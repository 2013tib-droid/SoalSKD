/**
 * Keputusan pembayaran yang murni (tanpa Firebase, tanpa jaringan), supaya bisa
 * diuji langsung dengan Node (`test/produk.mjs`).
 *
 * Prinsip: akses HANYA diberikan dari hasil API Mayar `GET /transactions/{id}`
 * yang dipanggil server dengan API key, untuk transaksi yang id-nya kita terima
 * sendiri saat membuat permintaan pembayaran (`POST /payments/create`). Isi
 * webhook dan redirect browser tidak pernah dipercaya; webhook hanya pemicu.
 *
 * Bentuk respons yang dipakai (docs.mayar.id, API V2, dibaca 2026-11-24):
 *   data.id (string), data.status ("paid" | "unpaid" | "created" | "expired"),
 *   data.amount (integer, rupiah), data.paymentLink.id, data.extraData,
 *   data.customer.email. Mayar tidak mengirim field mata uang: semua IDR.
 */

export type StatusPesanan = 'membuat' | 'menunggu' | 'aktif' | 'kedaluwarsa' | 'gagal' | 'dicabut';

export type HasilVerifikasi =
  | { jenis: 'lunas'; emailPembayar: string | null }
  | { jenis: 'menunggu' }
  | { jenis: 'kedaluwarsa' }
  /** Transaksi ada tapi tidak cocok dengan pesanan (nominal, produk, id). Tidak pernah membuka akses. */
  | { jenis: 'tidak-cocok'; alasan: string }
  /** Status yang tidak dikenal atau respons rusak. Tidak membuka akses, pesanan tetap menunggu. */
  | { jenis: 'tidak-diketahui'; alasan: string };

export type DataPesanan = {
  orderId: string;
  mayarTransactionId: string;
  mayarPaymentId: string;
  amount: number;
};

const obj = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

/** Menilai satu respons `GET /transactions/{id}` (field `data`) terhadap pesanan kita. */
export function nilaiTransaksi(pesanan: DataPesanan, trx: unknown): HasilVerifikasi {
  const t = obj(trx);
  if (!t) return { jenis: 'tidak-diketahui', alasan: 'respons-kosong' };
  if (typeof t.id !== 'string' || t.id !== pesanan.mayarTransactionId) {
    return { jenis: 'tidak-cocok', alasan: 'id-transaksi' };
  }
  // Status WAJIB string. Boolean (seperti tabel webhook di docs) atau tipe lain = tidak dikenal.
  if (typeof t.status !== 'string') return { jenis: 'tidak-diketahui', alasan: 'status-bukan-teks' };
  const status = t.status.trim().toLowerCase();

  if (status === 'unpaid' || status === 'created' || status === 'pending') return { jenis: 'menunggu' };
  if (status === 'expired') return { jenis: 'kedaluwarsa' };
  if (status !== 'paid') return { jenis: 'tidak-diketahui', alasan: `status-${status.slice(0, 20) || 'kosong'}` };

  // Lunas menurut Mayar. Semua kecocokan harus lolos sebelum akses diberikan.
  if (typeof t.amount !== 'number' || !Number.isInteger(t.amount) || t.amount !== pesanan.amount) {
    return { jenis: 'tidak-cocok', alasan: 'nominal' };
  }
  if ('currency' in t && t.currency != null && String(t.currency).toUpperCase() !== 'IDR') {
    return { jenis: 'tidak-cocok', alasan: 'mata-uang' };
  }
  const link = obj(t.paymentLink);
  if (link && typeof link.id === 'string' && link.id !== pesanan.mayarPaymentId) {
    return { jenis: 'tidak-cocok', alasan: 'produk' };
  }
  const extra = obj(t.extraData);
  if (extra && 'orderId' in extra && extra.orderId !== pesanan.orderId) {
    return { jenis: 'tidak-cocok', alasan: 'order-id' };
  }
  const email = obj(t.customer)?.email;
  return { jenis: 'lunas', emailPembayar: typeof email === 'string' ? email.trim().toLowerCase() : null };
}

/**
 * Status pesanan berikutnya. Monoton: `aktif`, `dicabut`, dan `gagal` tidak pernah
 * diubah otomatis, jadi webhook yang terlambat atau tidak berurutan tidak bisa
 * menurunkan atau menaikkan pesanan yang sudah final.
 */
export function statusBerikut(
  sekarang: StatusPesanan,
  hasil: HasilVerifikasi,
  lewatBatasWaktu: boolean,
): { status: StatusPesanan; berikanAkses: boolean } {
  if (sekarang === 'aktif' || sekarang === 'dicabut' || sekarang === 'gagal') return { status: sekarang, berikanAkses: false };
  switch (hasil.jenis) {
    case 'lunas':
      // Dibayar setelah kita anggap kedaluwarsa: tetap sah karena Mayar menyatakan lunas.
      return { status: 'aktif', berikanAkses: true };
    case 'tidak-cocok':
      return { status: 'gagal', berikanAkses: false };
    case 'kedaluwarsa':
      return { status: 'kedaluwarsa', berikanAkses: false };
    case 'menunggu':
      return { status: lewatBatasWaktu ? 'kedaluwarsa' : 'menunggu', berikanAkses: false };
    case 'tidak-diketahui':
      return { status: sekarang === 'membuat' ? 'menunggu' : sekarang, berikanAkses: false };
  }
}

/** Id yang aman dipakai sebagai id dokumen Firestore (huruf, angka, - dan _). */
export function idAman(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  return /^[A-Za-z0-9_-]{1,100}$/.test(s) ? s : null;
}

/**
 * Calon referensi pesanan dari isi webhook. Contoh payload di docs Mayar memuat
 * `data.id`, `data.transactionId`, dan `data.productId` (= id permintaan pembayaran
 * untuk `productType: payment_request`). Hanya dipakai untuk MENCARI pesanan;
 * keputusannya tetap dari API.
 */
export function refDariWebhook(data: unknown): string[] {
  const d = obj(data);
  if (!d) return [];
  const hasil: string[] = [];
  for (const k of ['transactionId', 'id', 'productId', 'paymentLinkId']) {
    const id = idAman(d[k]);
    if (id && !hasil.includes(id)) hasil.push(id);
  }
  return hasil;
}

/**
 * Status di isi webhook, untuk dicatat saja. Docs menyebut Boolean, contoh payload
 * memakai "SUCCESS". `false`, teks lain, atau tipe lain tidak dianggap sukses.
 */
export function statusWebhook(v: unknown): 'sukses' | 'bukan-sukses' | 'tidak-ada' {
  if (v === undefined || v === null || v === '') return 'tidak-ada';
  if (v === true) return 'sukses';
  if (typeof v === 'string' && ['SUCCESS', 'PAID', 'SETTLED'].includes(v.trim().toUpperCase())) return 'sukses';
  return 'bukan-sukses';
}

/** "budi.santoso@gmail.com" → "bu***@gmail.com" (untuk ditampilkan ke pemilik akun). */
export function samarkanEmail(email: string | null): string | null {
  if (!email) return null;
  const [nama, domain] = email.split('@');
  if (!nama || !domain) return null;
  return `${nama.slice(0, 2)}***@${domain}`;
}

/**
 * Cadangan bila `GET /transactions/{id}` menjawab 404 (docs tidak menjelaskan apakah
 * transaksi yang belum dibayar sudah bisa dibaca). Status permintaan bayar hanya dipakai
 * untuk "masih menunggu" atau "kedaluwarsa"; LUNAS tetap wajib lewat detail transaksi
 * (nominal dan id dicocokkan di sana), jadi di sini tidak pernah menghasilkan `lunas`.
 */
export function nilaiPermintaanBayar(permintaan: unknown): HasilVerifikasi {
  const p = obj(permintaan);
  const status = typeof p?.status === 'string' ? p.status.trim().toLowerCase() : '';
  if (status === 'unpaid' || status === 'active' || status === 'created' || status === 'pending') return { jenis: 'menunggu' };
  if (status === 'expired' || status === 'closed') return { jenis: 'kedaluwarsa' };
  return { jenis: 'tidak-diketahui', alasan: status === 'paid' ? 'lunas-tanpa-detail-transaksi' : 'transaksi-tidak-ditemukan' };
}
