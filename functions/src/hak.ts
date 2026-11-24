/**
 * Hak akses paket di Firestore: pemberian dari pesanan yang lunas, kode cadangan,
 * dan pencabutan. Dipakai Cloud Functions (index.ts) dan alat admin
 * (scripts/admin.mjs), jadi modul ini tidak menyalakan function apa pun.
 *
 * Sumber hak satu akun:
 *   - `orders/{orderId}` dengan `uid` = akun itu dan `status: 'aktif'`
 *   - `activation_codes/{kode}` dengan `usedBy` = akun itu dan tanpa `dicabut`
 * `users/{uid}.paket` dan `.produk` adalah ringkasan dari sumber itu; hanya ditulis
 * dari sini (rules menolak semua tulisan client).
 */
import { randomInt } from 'node:crypto';
import { FieldValue, type Firestore, type Transaction } from 'firebase-admin/firestore';
import { nilaiTransaksi, samarkanEmail, statusBerikut, type HasilVerifikasi, type StatusPesanan } from './pembayaran';
import { isProduk, paketDariProduk, PRODUK, type IdProduk } from './produk';

// --- Kode aktivasi cadangan ---------------------------------------------------

/** Tanpa I, L, O, 0, 1 supaya tidak salah baca. */
const ABJAD_KODE = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Bentuk tampilan `K7P-M4X-Q2R` (9 karakter, ±2,6×10¹³ kemungkinan). */
export function buatKode(): { id: string; tampil: string } {
  const blok = () => Array.from({ length: 3 }, () => ABJAD_KODE[randomInt(ABJAD_KODE.length)]).join('');
  const tampil = `${blok()}-${blok()}-${blok()}`;
  return { id: tampil.replace(/-/g, ''), tampil };
}

/**
 * Kode cadangan (giveaway, kompensasi, bantuan pelanggan). HANYA dari alat admin
 * yang berjalan dengan kredensial pemilik proyek; tidak ada endpoint publik.
 */
export async function buatKodeCadangan(db: Firestore, produk: IdProduk, jumlah: number, catatan: string): Promise<string[]> {
  if (!isProduk(produk)) throw new Error(`produk tidak dikenal: ${produk}`);
  if (!Number.isInteger(jumlah) || jumlah < 1 || jumlah > 100) throw new Error('jumlah 1–100');
  const hasil: string[] = [];
  while (hasil.length < jumlah) {
    const k = buatKode();
    try {
      await db.doc(`activation_codes/${k.id}`).create({
        code: k.id,
        display: k.tampil,
        produk,
        batch: 'admin',
        catatan: catatan.slice(0, 200),
        used: false,
        usedBy: null,
        usedAt: null,
        createdAt: FieldValue.serverTimestamp(),
      });
      hasil.push(k.tampil);
    } catch (e) {
      if ((e as { code?: unknown }).code !== 6) throw e; // 6 = ALREADY_EXISTS → kode lain
    }
  }
  return hasil;
}

// --- Pesanan -----------------------------------------------------------------

export type Pesanan = {
  uid: string;
  email: string;
  produk: IdProduk;
  amount: number;
  currency: 'IDR';
  status: StatusPesanan;
  mayarPaymentId: string | null;
  mayarTransactionId: string | null;
  link: string | null;
  expiresAt: number;
  createdAt: number;
};

/** Ringkasan pesanan yang boleh dibaca pemilik akun (`users/{uid}/pembelian/{orderId}`). */
export function cerminPembelian(orderId: string, p: Pesanan & Record<string, unknown>) {
  return {
    orderId,
    produk: p.produk,
    judul: PRODUK[p.produk]?.judul ?? p.produk,
    amount: p.amount,
    currency: 'IDR',
    status: p.status,
    // Tautan bayar hanya selama masih menunggu.
    link: p.status === 'menunggu' ? p.link : null,
    expiresAt: p.expiresAt,
    createdAt: p.createdAt,
    updatedAt: Date.now(),
    emailBeda: p.emailBeda === true,
    emailPembayaran: typeof p.emailPembayaran === 'string' ? p.emailPembayaran : null,
    perluTinjau: p.perluTinjau === true,
  };
}

/** Grace setelah batas waktu sebelum pesanan yang belum dibayar dianggap kedaluwarsa. */
const GRACE_MS = 10 * 60 * 1000;

/**
 * Menerapkan hasil verifikasi API ke satu pesanan dalam SATU transaksi:
 * status pesanan, cermin pembelian, dan (bila lunas) hak paket akun. Idempoten:
 * dipanggil berkali-kali (webhook ganda, tombol cek di dua HP) hasilnya sama.
 */
export async function terapkanVerifikasi(
  db: Firestore,
  orderId: string,
  hasil: HasilVerifikasi,
): Promise<{ status: StatusPesanan; diberikan: boolean }> {
  const ref = db.doc(`orders/${orderId}`);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error('pesanan tidak ada');
    const p = snap.data() as Pesanan & Record<string, unknown>;
    const lewat = Date.now() > p.expiresAt + GRACE_MS;
    const { status, berikanAkses } = statusBerikut(p.status, hasil, lewat);

    const ubah: Record<string, unknown> = {
      status,
      updatedAt: Date.now(),
      verifikasiTerakhir: { jenis: hasil.jenis, alasan: 'alasan' in hasil ? hasil.alasan : null, pada: Date.now() },
    };
    if (hasil.jenis === 'tidak-diketahui') ubah.perluTinjau = true;
    if (hasil.jenis === 'tidak-cocok') {
      ubah.perluTinjau = true;
      ubah.problem = `tidak-cocok-${hasil.alasan}`;
    }
    if (berikanAkses && hasil.jenis === 'lunas') {
      const beda = hasil.emailPembayar !== null && hasil.emailPembayar !== p.email;
      Object.assign(ubah, {
        paidAt: Date.now(),
        grantedAt: Date.now(),
        emailPembayar: hasil.emailPembayar,
        emailBeda: beda,
        emailPembayaran: beda ? samarkanEmail(hasil.emailPembayar) : null,
      });
      tx.set(
        db.doc(`users/${p.uid}`),
        {
          paket: FieldValue.arrayUnion(...PRODUK[p.produk].paket),
          produk: FieldValue.arrayUnion(p.produk),
          diperbaruiPada: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }
    tx.update(ref, ubah);
    tx.set(db.doc(`users/${p.uid}/pembelian/${orderId}`), cerminPembelian(orderId, { ...p, ...ubah } as Pesanan & Record<string, unknown>));
    return { status, diberikan: berikanAkses };
  });
}

/** Menilai respons API terhadap pesanan tersimpan (tanpa menulis apa pun). */
export function nilaiUntukPesanan(orderId: string, p: Pesanan, trx: unknown | null): HasilVerifikasi {
  if (trx === null) return { jenis: 'tidak-diketahui', alasan: 'transaksi-tidak-ditemukan' };
  return nilaiTransaksi(
    { orderId, mayarTransactionId: p.mayarTransactionId ?? '', mayarPaymentId: p.mayarPaymentId ?? '', amount: p.amount },
    trx,
  );
}

// --- Pencabutan (refund, chargeback, pembatalan) -----------------------------

/** Hitung ulang `users/{uid}.paket/.produk` dari semua sumber hak yang masih berlaku. */
async function hitungUlangHak(db: Firestore, tx: Transaction, uid: string, kecualiPesanan?: string, kecualiKode?: string) {
  const [pesanan, kode] = await Promise.all([
    tx.get(db.collection('orders').where('uid', '==', uid).where('status', '==', 'aktif')),
    tx.get(db.collection('activation_codes').where('usedBy', '==', uid)),
  ]);
  const produk: string[] = [];
  for (const d of pesanan.docs) if (d.id !== kecualiPesanan) produk.push(d.get('produk'));
  for (const d of kode.docs) if (d.id !== kecualiKode && d.get('dicabut') !== true) produk.push(d.get('produk'));
  const unik = [...new Set(produk.filter(isProduk))];
  return { paket: paketDariProduk(unik), produk: unik };
}

/**
 * Mencabut akses dari satu pesanan (refund/chargeback yang disetujui pemilik).
 * Mayar tidak mengirim event refund (docs: daftar event webhook), jadi ini manual
 * lewat alat admin. Paket yang juga dibuka sumber lain (pesanan/kode lain) tetap ada.
 */
export async function cabutPesanan(db: Firestore, orderId: string, alasan: string) {
  const ref = db.doc(`orders/${orderId}`);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error('pesanan tidak ada');
    const p = snap.data() as Pesanan & Record<string, unknown>;
    const hak = await hitungUlangHak(db, tx, p.uid, orderId);
    const ubah = { status: 'dicabut' as const, dicabutPada: Date.now(), alasanCabut: alasan.slice(0, 200), updatedAt: Date.now() };
    tx.update(ref, ubah);
    tx.set(db.doc(`users/${p.uid}/pembelian/${orderId}`), cerminPembelian(orderId, { ...p, ...ubah }));
    tx.set(db.doc(`users/${p.uid}`), { ...hak, diperbaruiPada: FieldValue.serverTimestamp() }, { merge: true });
    return hak;
  });
}

/** Mencabut kode cadangan yang sudah/belum dipakai (mis. kode giveaway bocor). */
export async function cabutKode(db: Firestore, kode: string, alasan: string) {
  const id = kode.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const ref = db.doc(`activation_codes/${id}`);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new Error('kode tidak ada');
    const uid = snap.get('usedBy');
    const ubah = { dicabut: true, used: true, dicabutPada: Date.now(), alasanCabut: alasan.slice(0, 200) };
    if (typeof uid !== 'string') {
      tx.update(ref, ubah);
      return null;
    }
    const hak = await hitungUlangHak(db, tx, uid, undefined, id);
    tx.update(ref, ubah);
    tx.set(db.doc(`users/${uid}`), { ...hak, diperbaruiPada: FieldValue.serverTimestamp() }, { merge: true });
    return hak;
  });
}
