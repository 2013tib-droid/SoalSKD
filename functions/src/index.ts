/**
 * Cloud Functions SoalSKD.
 *
 * Yang dijual adalah AKSES ke paket try out berbayar. Semua keputusan yang
 * menentukan "boleh mengerjakan paket ini atau tidak" ditulis DI SINI (dan
 * dibaca server Next.js lewat Admin SDK), karena apa pun yang berjalan di
 * browser bisa diubah pemiliknya.
 *
 * Yang dijaga:
 *   1. Kode aktivasi hanya bisa dipakai SEKALI (transaksi Firestore).
 *   2. Field `users/{uid}.paket` hanya ditulis dari sini; firestore.rules
 *      melarang client menulis dokumen user sama sekali.
 *   3. Pembelian normal tanpa kode: `buatPesanan` membuat permintaan bayar Mayar
 *      yang terikat ke uid di server; akses diberikan HANYA setelah API Mayar
 *      (dipanggil server dengan API key) menyatakan transaksi itu lunas dan
 *      nominal/produknya cocok. Webhook dan redirect browser hanya pemicu.
 *      Kode aktivasi tinggal cadangan (giveaway, kompensasi), dibuat lewat alat
 *      admin; kode tidak pernah dicatat di log.
 *   4. Ebook PDF per edisi ada di Storage privat (storage.rules menolak semua
 *      client); `unduhEbook` memberi signed URL berumur pendek, hanya untuk
 *      pemilik paket dari bundel edisi yang diminta.
 *
 * Pola ini meniru game edukasi (functions/src/index.ts di repo itu), tapi
 * yang dibuka di sini daftar PAKET, bukan kelompok umur.
 */
import { generateKeyPairSync, randomBytes, timingSafeEqual } from 'node:crypto';
import { cert, initializeApp, type App } from 'firebase-admin/app';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { logger } from 'firebase-functions';
import { defineSecret, defineString } from 'firebase-functions/params';
import { setGlobalOptions } from 'firebase-functions/v2';
import { HttpsError, onCall, onRequest, type CallableRequest } from 'firebase-functions/v2/https';
import { nilaiUntukPesanan, terapkanVerifikasi, type Pesanan } from './hak';
import { ambilPermintaanBayar, ambilTransaksi, buatPermintaanBayar, GalatMayar } from './mayar';
import { nilaiPermintaanBayar, refDariWebhook, statusWebhook } from './pembayaran';
import { EBOOK, isEdisi, isProduk, PRODUK, punyaEdisi, type IdEdisi } from './produk';

initializeApp();
const db = getFirestore();

// Jakarta, sama dengan Firestore. Client memakai region yang sama
// (web/src/lib/firebase/klien.ts, FUNCTIONS_REGION).
setGlobalOptions({ region: 'asia-southeast2', maxInstances: 10 });

// Produk, paket, dan ebook per edisi ada di ./produk (modul murni, diuji
// tanpa emulator). Cerminnya di web/src/config/produk.ts: ubah bersamaan.

/** Rem percobaan kode: 10 kegagalan per jam per akun. */
const MAKS_GAGAL = 10;
const JENDELA_MS = 60 * 60 * 1000;

// --- Alat bantu -------------------------------------------------------------

function wajibUid(request: CallableRequest): string {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Masuk ke akun dulu.');
  return uid;
}

/**
 * Email terverifikasi, syarat MENUKAR KODE. Klaim `email_verified` ada di ID
 * token yang ditandatangani Google, jadi tidak bisa dipalsukan dari browser.
 * Alasannya: akun dengan email salah ketik yang sudah menukar kode tidak bisa
 * dipulihkan (setel ulang sandi dikirim ke alamat yang tidak ada).
 * Masuk dengan Google selalu sudah terverifikasi.
 */
function wajibEmailTerverifikasi(request: CallableRequest): void {
  if (request.auth?.token.email_verified === true) return;
  throw new HttpsError(
    'failed-precondition',
    'Verifikasi email dulu. Tautannya sudah kami kirim ke emailmu, cek juga folder spam.',
  );
}

/** "abc-def", "ABC DEF", "abcdef" = kode yang sama. Bentuk tanpa pemisah = id dokumen. */
function normalkanKode(raw: unknown): string {
  if (typeof raw !== 'string') throw new HttpsError('invalid-argument', 'Kode aktivasi tidak terbaca.');
  const bersih = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (bersih.length < 6 || bersih.length > 32) {
    throw new HttpsError('invalid-argument', 'Kode aktivasi tidak terbaca.');
  }
  return bersih;
}

/**
 * Hitungan gagal disimpan di koleksinya sendiri (tertutup dari client), bukan
 * di dokumen user, supaya penebak kode tidak bisa meresetnya.
 */
async function cekRem(uid: string): Promise<void> {
  const data = (await db.doc(`redeem_attempts/${uid}`).get()).data();
  const mulai = data?.windowStart as Timestamp | undefined;
  if (!mulai) return;
  const masihBaru = Date.now() - mulai.toMillis() < JENDELA_MS;
  if (masihBaru && ((data?.failed as number) ?? 0) >= MAKS_GAGAL) {
    throw new HttpsError('resource-exhausted', 'Terlalu banyak percobaan kode. Coba lagi satu jam lagi.');
  }
}

async function catatGagal(uid: string): Promise<void> {
  const ref = db.doc(`redeem_attempts/${uid}`);
  await db.runTransaction(async (tx) => {
    const data = (await tx.get(ref)).data();
    const mulai = data?.windowStart as Timestamp | undefined;
    const masihBaru = mulai && Date.now() - mulai.toMillis() < JENDELA_MS;
    tx.set(ref, {
      failed: masihBaru ? ((data?.failed as number) ?? 0) + 1 : 1,
      windowStart: masihBaru ? mulai : FieldValue.serverTimestamp(),
      lastAttemptAt: FieldValue.serverTimestamp(),
    });
  });
}

// --- 1. Tukar kode aktivasi -------------------------------------------------

/**
 * Menukar kode aktivasi menjadi akses paket. Semua pemeriksaan ada di SATU
 * transaksi, jadi dua HP yang menekan "Aktifkan" bersamaan tidak bisa memakai
 * kode yang sama dua kali.
 */
export const redeemActivationCode = onCall(async (request) => {
  const uid = wajibUid(request);
  // Sebelum kode dibaca: kode sah tidak boleh hangus karena email belum diverifikasi.
  wajibEmailTerverifikasi(request);
  const kode = normalkanKode((request.data as { kode?: unknown } | undefined)?.kode);
  await cekRem(uid);

  const kodeRef = db.doc(`activation_codes/${kode}`);
  const userRef = db.doc(`users/${uid}`);

  const hasil = await db.runTransaction(async (tx) => {
    const snap = await tx.get(kodeRef);
    if (!snap.exists) return { status: 'tidak-ada' as const };
    const data = snap.data() ?? {};
    const produk = data.produk;
    if (!isProduk(produk)) return { status: 'rusak' as const };
    const paket = [...PRODUK[produk].paket];

    // Kode yang dicabut admin (mis. kode giveaway bocor) tidak bisa dipakai lagi.
    if (data.dicabut === true) return { status: 'terpakai' as const };
    if (data.used === true) {
      // Akun yang sama menekan dua kali: bukan kesalahan.
      if (data.usedBy === uid) return { status: 'sudah-milikmu' as const, paket };
      return { status: 'terpakai' as const };
    }

    tx.update(kodeRef, { used: true, usedBy: uid, usedAt: FieldValue.serverTimestamp() });
    // set + merge: dokumen user belum tentu ada.
    tx.set(
      userRef,
      {
        paket: FieldValue.arrayUnion(...paket),
        produk: FieldValue.arrayUnion(produk),
        diperbaruiPada: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return { status: 'ok' as const, paket };
  });

  if (hasil.status === 'tidak-ada' || hasil.status === 'terpakai') {
    await catatGagal(uid);
    // Pesan SAMA untuk "tidak ada" dan "sudah dipakai", supaya jawaban server
    // tidak bisa dipakai memetakan kode yang sah.
    throw new HttpsError('not-found', 'Kode tidak ditemukan atau sudah dipakai. Periksa lagi kodenya.');
  }
  if (hasil.status === 'rusak') {
    throw new HttpsError('internal', 'Kode ini bermasalah. Balas email pembelianmu supaya kami bantu.');
  }

  await db.doc(`redeem_attempts/${uid}`).delete().catch(() => undefined);
  return { paket: hasil.paket, sudah: hasil.status === 'sudah-milikmu' };
});

// --- 2. Unduh ebook PDF -----------------------------------------------------

/** Umur signed URL ebook. PDF tiap edisi dibuat dari bank/ (ebook/README.md). */
const EBOOK_BERLAKU_MS = 10 * 60 * 1000;

let appEmulator: App | null = null;

/**
 * Bucket default proyek. Di emulator tidak ada kredensial untuk menandatangani
 * URL, jadi dipakai app terpisah dengan kunci RSA sekali pakai (hanya emulator;
 * URL-nya cuma berlaku di emulator). Produksi menandatangani lewat IAM signBlob
 * dengan service account function (docs/firebase.md, langkah Storage).
 */
function bucketEbook() {
  if (process.env.FUNCTIONS_EMULATOR !== 'true') return getStorage().bucket();
  if (!appEmulator) {
    const { privateKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      publicKeyEncoding: { type: 'spki', format: 'pem' },
    });
    const projectId = process.env.GCLOUD_PROJECT ?? 'demo-soalskd';
    appEmulator = initializeApp(
      { credential: cert({ projectId, clientEmail: `emulator@${projectId}.iam.gserviceaccount.com`, privateKey }) },
      'emulator-ebook',
    );
  }
  return getStorage(appEmulator).bucket(getStorage().bucket().name);
}

/**
 * Tautan unduh ebook satu edisi (`{ edisi: 'edisi-1' | 'edisi-2' }`) untuk akun
 * yang memiliki minimal satu paket dari bundel edisi itu. Tanpa `edisi` = edisi-1
 * (client lama). Hak dibaca dari `users/{uid}.paket` (hanya ditulis
 * `redeemActivationCode`). URL berlaku 10 menit; tidak disimpan di mana pun.
 */
export const unduhEbook = onCall(async (request) => {
  const uid = wajibUid(request);
  const diminta = (request.data as { edisi?: unknown } | undefined)?.edisi ?? 'edisi-1';
  if (!isEdisi(diminta)) throw new HttpsError('invalid-argument', 'Edisi ebook tidak dikenal.');
  const edisi: IdEdisi = diminta;
  const ebook = EBOOK[edisi];
  const milik: unknown = (await db.doc(`users/${uid}`).get()).get('paket');
  if (!punyaEdisi(milik, edisi)) {
    throw new HttpsError(
      'permission-denied',
      `${ebook.judul} ikut ${PRODUK[ebook.produk].judul}. Tukar kode aktivasi bundel itu dulu di halaman Aktivasi.`,
    );
  }

  const file = bucketEbook().file(ebook.path);
  let ada = false;
  try {
    [ada] = await file.exists();
  } catch (e) {
    logger.error('unduhEbook: Storage tidak bisa dibaca', { pesan: (e as Error).message });
    throw new HttpsError('internal', 'Ebook belum bisa diambil. Coba lagi sebentar lagi.');
  }
  if (!ada) {
    logger.error('unduhEbook: file belum diunggah', { path: ebook.path });
    throw new HttpsError('not-found', 'Ebook sedang disiapkan. Coba lagi nanti, atau balas email pembelianmu.');
  }

  try {
    const berakhir = Date.now() + EBOOK_BERLAKU_MS;
    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: berakhir,
      responseDisposition: `attachment; filename="${ebook.namaFile}"`,
      responseType: 'application/pdf',
    });
    logger.info('unduhEbook: tautan dibuat', { uid, edisi });
    return { url, namaFile: ebook.namaFile, berakhirPada: berakhir };
  } catch (e) {
    // Biasanya: service account function belum punya peran Service Account Token Creator.
    logger.error('unduhEbook: gagal menandatangani URL', { pesan: (e as Error).message });
    throw new HttpsError('internal', 'Tautan unduhan belum bisa dibuat. Coba lagi sebentar lagi.');
  }
});

// --- 3. Pembelian otomatis lewat Mayar ---------------------------------------
//
// Alur (docs/firebase.md, "Gambaran alurnya"):
//   1. Pembeli login (Google atau email terverifikasi) → `buatPesanan(produk)`.
//      Server membuat `orders/{orderId}` (uid dari ID token, harga dari produk.ts)
//      lalu Single Payment Request Mayar dengan `extraData.orderId`, dan menyimpan
//      id permintaan + id transaksi yang dikembalikan Mayar.
//   2. Pembeli membayar di halaman Mayar.
//   3. Mayar memanggil `mayarWebhook` (payment.received) dan/atau pembeli menekan
//      "Cek Status Pembayaran" (`cekPembayaran`). Keduanya hanya memicu
//      verifikasi: server memanggil `GET /transactions/{id}` dengan API key.
//   4. Lunas + nominal/produk/id cocok → satu transaksi Firestore: pesanan `aktif`
//      dan paket ditambahkan ke `users/{uid}`. Selain itu: tidak ada akses.

/** API key Mayar (Read & Write) dari web.mayar.id/api-keys. Hanya di Secret Manager. */
const MAYAR_API_KEY = defineSecret('MAYAR_API_KEY');
/** Webhook Token dari dasbor Mayar, dikirim lewat header `X-Callback-Token`. */
const MAYAR_WEBHOOK_TOKEN = defineSecret('MAYAR_WEBHOOK_TOKEN');
/** Produksi `https://api.mayar.id/hl/v2`; uji coba sandbox `https://api.mayar.io/hl/v2`. */
const MAYAR_API_BASE = defineString('MAYAR_API_BASE', { default: 'https://api.mayar.id/hl/v2' });
/** Alamat situs pembeli, mis. https://soalskd.id (tanpa garis miring di akhir). Untuk tautan kembali dari Mayar. */
const URL_SITUS = defineString('URL_SITUS', { default: '' });

/** Pesanan yang belum dibayar dianggap kedaluwarsa setelah ini (juga `expiredAt` di Mayar). */
const UMUR_PESANAN_MS = 24 * 60 * 60 * 1000;

function baseMayar(): string {
  const base = MAYAR_API_BASE.value().trim().replace(/\/+$/, '');
  // Di luar emulator hanya host API Mayar yang sah (produksi .id / sandbox .io).
  if (process.env.FUNCTIONS_EMULATOR !== 'true' && !/^https:\/\/api\.mayar\.(id|io)\/hl\/v2$/.test(base)) {
    logger.error('MAYAR_API_BASE tidak sah', { base });
    throw new HttpsError('internal', 'Pembayaran sedang tidak bisa diproses. Coba lagi nanti.');
  }
  return base;
}

/**
 * Rem umum berbasis Firestore (`rate_limits/{kunci}`, tertutup dari client).
 * `maks` permintaan per `jendelaMs`, dan jeda minimal `jedaMs` antar permintaan.
 * Mengembalikan detik tunggu (0 = boleh).
 */
async function rem(kunci: string, maks: number, jendelaMs: number, jedaMs = 0): Promise<number> {
  const ref = db.doc(`rate_limits/${kunci}`);
  return db.runTransaction(async (tx) => {
    const d = (await tx.get(ref)).data() ?? {};
    const now = Date.now();
    const mulai = typeof d.mulai === 'number' && now - d.mulai < jendelaMs ? d.mulai : now;
    const jumlah = mulai === d.mulai && typeof d.jumlah === 'number' ? d.jumlah : 0;
    const terakhir = typeof d.terakhir === 'number' ? d.terakhir : 0;
    if (jedaMs && now - terakhir < jedaMs) return Math.ceil((jedaMs - (now - terakhir)) / 1000);
    if (jumlah >= maks) return Math.ceil((mulai + jendelaMs - now) / 1000);
    tx.set(ref, { mulai, jumlah: jumlah + 1, terakhir: now, kedaluwarsa: Timestamp.fromMillis(mulai + jendelaMs) });
    return 0;
  });
}

function idPesananBaru(): string {
  return `ord_${randomBytes(12).toString('base64url').replace(/[^A-Za-z0-9]/g, 'x')}`;
}

/** Verifikasi satu pesanan ke API Mayar lalu terapkan. Galat sementara Mayar dilempar ke pemanggil. */
async function verifikasiPesanan(orderId: string) {
  const snap = await db.doc(`orders/${orderId}`).get();
  if (!snap.exists) return null;
  const p = snap.data() as Pesanan;
  // Final: tidak perlu bertanya ke Mayar lagi (hemat kuota 50/menit).
  if (p.status === 'aktif' || p.status === 'dicabut' || p.status === 'gagal') return { status: p.status, diberikan: false };
  if (!p.mayarTransactionId) return { status: p.status, diberikan: false };
  const kunci = MAYAR_API_KEY.value().trim();
  const trx = await ambilTransaksi(baseMayar(), kunci, p.mayarTransactionId);
  let hasil = nilaiUntukPesanan(orderId, p, trx);
  // Transaksi belum terbaca: lihat status permintaan bayarnya (hanya menunggu/kedaluwarsa, tidak pernah lunas).
  if (trx === null && p.mayarPaymentId) {
    const permintaan = await ambilPermintaanBayar(baseMayar(), kunci, p.mayarPaymentId);
    if (permintaan !== null) hasil = nilaiPermintaanBayar(permintaan);
  }
  if (hasil.jenis === 'tidak-cocok' || hasil.jenis === 'tidak-diketahui') {
    // Tanpa data pribadi: id pesanan + alasan saja.
    logger.warn('verifikasi: pesanan perlu ditinjau', { orderId, jenis: hasil.jenis, alasan: hasil.alasan });
  }
  const r = await terapkanVerifikasi(db, orderId, hasil);
  if (r.diberikan) logger.info('verifikasi: paket diaktifkan', { orderId, produk: p.produk });
  return r;
}

/** Ringkasan pesanan untuk pembelinya sendiri (sama dengan cermin `users/{uid}/pembelian`). */
async function ringkasan(orderId: string) {
  const d = (await db.doc(`orders/${orderId}`).get()).data() ?? {};
  return {
    orderId,
    produk: d.produk,
    judul: isProduk(d.produk) ? PRODUK[d.produk].judul : '',
    amount: typeof d.amount === 'number' ? d.amount : null,
    createdAt: typeof d.createdAt === 'number' ? d.createdAt : null,
    status: d.status,
    link: d.status === 'menunggu' ? d.link ?? null : null,
    expiresAt: d.expiresAt ?? null,
    emailBeda: d.emailBeda === true,
    emailPembayaran: d.emailPembayaran ?? null,
    perluTinjau: d.perluTinjau === true,
    paket: d.status === 'aktif' && isProduk(d.produk) ? [...PRODUK[d.produk].paket] : [],
  };
}

function galatMayarKeKlien(e: unknown): never {
  if (e instanceof GalatMayar) {
    logger.error('Mayar gagal', { status: e.status, pesan: e.pesanServer });
    if (e.status === 429) throw new HttpsError('resource-exhausted', 'Sistem pembayaran sedang sibuk. Coba lagi satu menit lagi.');
    throw new HttpsError('unavailable', 'Sistem pembayaran belum bisa dihubungi. Coba lagi sebentar lagi.');
  }
  throw e;
}

/**
 * Membuat (atau melanjutkan) pesanan satu bundel untuk akun yang login. uid,
 * email, dan harga TIDAK diambil dari client. Satu pesanan terbuka per akun per
 * produk: menekan "Bayar" dua kali, atau dari dua HP, memberi tautan yang sama.
 */
export const buatPesanan = onCall({ secrets: [MAYAR_API_KEY] }, async (request) => {
  const uid = wajibUid(request);
  wajibEmailTerverifikasi(request);
  const email = String(request.auth?.token.email ?? '').trim().toLowerCase();
  if (!email) throw new HttpsError('failed-precondition', 'Akun ini belum punya email. Masuk dengan Google atau email.');
  const produk = (request.data as { produk?: unknown } | undefined)?.produk;
  if (!isProduk(produk)) throw new HttpsError('invalid-argument', 'Bundel tidak dikenal.');

  const milik: unknown = (await db.doc(`users/${uid}`).get()).get('paket');
  if (Array.isArray(milik) && PRODUK[produk].paket.every((p) => milik.includes(p))) {
    throw new HttpsError('already-exists', 'Bundel ini sudah aktif di akunmu.');
  }

  const kunciKunci = db.doc(`checkout/${uid}__${produk}`);
  const now = Date.now();
  // Ambil kunci checkout: pesanan terbuka yang masih berlaku dipakai ulang.
  const kunci = await db.runTransaction(async (tx) => {
    const k = (await tx.get(kunciKunci)).data();
    if (k?.orderId) {
      const o = (await tx.get(db.doc(`orders/${k.orderId}`))).data();
      if (o?.status === 'menunggu' && typeof o.expiresAt === 'number' && o.expiresAt - now > 30 * 60 * 1000) {
        return { pakaiUlang: k.orderId as string };
      }
      // Sedang dibuat permintaan lain (≤30 detik): jangan buat dobel.
      if (o?.status === 'membuat' && typeof o.createdAt === 'number' && now - o.createdAt < 30_000) {
        return { sedangDibuat: k.orderId as string };
      }
    }
    const orderId = idPesananBaru();
    const pesanan: Pesanan & Record<string, unknown> = {
      uid,
      email,
      produk,
      amount: PRODUK[produk].harga,
      currency: 'IDR',
      status: 'membuat',
      mayarPaymentId: null,
      mayarTransactionId: null,
      link: null,
      expiresAt: now + UMUR_PESANAN_MS,
      createdAt: now,
      updatedAt: now,
      source: 'checkout',
    };
    tx.create(db.doc(`orders/${orderId}`), pesanan);
    tx.set(kunciKunci, { orderId, pada: now });
    return { baru: orderId };
  });

  if ('pakaiUlang' in kunci && kunci.pakaiUlang) return ringkasan(kunci.pakaiUlang);
  if ('sedangDibuat' in kunci && kunci.sedangDibuat) {
    throw new HttpsError('aborted', 'Pembayaran sedang disiapkan. Tunggu beberapa detik lalu coba lagi.');
  }
  const orderId = (kunci as { baru: string }).baru;

  // Rem dihitung hanya untuk pesanan yang benar-benar baru (yang memanggil Mayar).
  const tunggu = await rem(`buat_${uid}`, 6, 60 * 60 * 1000);
  if (tunggu > 0) {
    await db.doc(`orders/${orderId}`).update({ status: 'gagal', problem: 'rem', updatedAt: Date.now() });
    throw new HttpsError('resource-exhausted', 'Terlalu banyak pesanan baru. Coba lagi nanti.');
  }

  const situs = URL_SITUS.value().trim().replace(/\/+$/, '');
  let hasil;
  try {
    hasil = await buatPermintaanBayar(baseMayar(), MAYAR_API_KEY.value().trim(), {
      name: `SoalSKD ${PRODUK[produk].judul}`,
      amount: PRODUK[produk].harga,
      email,
      description: `SoalSKD ${PRODUK[produk].judul} (${PRODUK[produk].paket.join(', ')}) + ebook PDF. Pesanan ${orderId}.`,
      redirectUrl: /^https:\/\//.test(situs) ? `${situs}/akun?pesanan=${orderId}` : undefined,
      expiredAt: new Date(now + UMUR_PESANAN_MS).toISOString(),
      extraData: { orderId },
    });
  } catch (e) {
    await db.doc(`orders/${orderId}`).update({ status: 'gagal', problem: 'mayar-buat-gagal', updatedAt: Date.now() });
    galatMayarKeKlien(e);
  }

  // Indeks referensi Mayar → pesanan. create(): satu transaksi Mayar hanya milik satu pesanan.
  await db.runTransaction(async (tx) => {
    tx.create(db.doc(`mayar_ref/${hasil.transactionId}`), { orderId, jenis: 'transaksi' });
    tx.create(db.doc(`mayar_ref/${hasil.id}`), { orderId, jenis: 'pembayaran' });
    const ubah = {
      status: 'menunggu' as const,
      mayarPaymentId: hasil.id,
      mayarTransactionId: hasil.transactionId,
      link: hasil.link,
      updatedAt: Date.now(),
    };
    tx.update(db.doc(`orders/${orderId}`), ubah);
    tx.set(
      db.doc(`users/${uid}/pembelian/${orderId}`),
      {
        orderId,
        produk,
        judul: PRODUK[produk].judul,
        amount: PRODUK[produk].harga,
        currency: 'IDR',
        status: 'menunggu',
        link: hasil.link,
        expiresAt: now + UMUR_PESANAN_MS,
        createdAt: now,
        updatedAt: Date.now(),
        emailBeda: false,
        emailPembayaran: null,
        perluTinjau: false,
      },
    );
  });
  logger.info('buatPesanan: pesanan dibuat', { orderId, produk });
  return ringkasan(orderId);
});

/**
 * Tombol "Cek Status Pembayaran". Hanya pemilik pesanan; direm (jeda 5 detik,
 * 20 kali per 10 menit per akun) karena tiap cek memanggil API Mayar.
 */
export const cekPembayaran = onCall({ secrets: [MAYAR_API_KEY] }, async (request) => {
  const uid = wajibUid(request);
  const orderId = (request.data as { orderId?: unknown } | undefined)?.orderId;
  if (typeof orderId !== 'string' || !/^ord_[A-Za-z0-9]{8,40}$/.test(orderId)) {
    throw new HttpsError('invalid-argument', 'Nomor pesanan tidak dikenal.');
  }
  const d = (await db.doc(`orders/${orderId}`).get()).data();
  // Pesanan akun lain dijawab sama dengan "tidak ada".
  if (!d || d.uid !== uid) throw new HttpsError('not-found', 'Pesanan tidak ditemukan di akun ini.');
  if (d.status === 'aktif' || d.status === 'dicabut' || d.status === 'gagal') return ringkasan(orderId);

  const tunggu = await rem(`cek_${uid}`, 20, 10 * 60 * 1000, 5000);
  if (tunggu > 0) {
    throw new HttpsError('resource-exhausted', `Tunggu ${tunggu} detik sebelum memeriksa lagi.`);
  }
  try {
    await verifikasiPesanan(orderId);
  } catch (e) {
    galatMayarKeKlien(e);
  }
  return ringkasan(orderId);
});

/**
 * Webhook Mayar. Isi webhook TIDAK dipercaya: hanya dipakai mencari pesanan
 * (`mayar_ref`), lalu status diambil sendiri dari API. Webhook palsu, diulang,
 * terlambat, atau tidak berurutan tidak bisa membuka akses tanpa transaksi yang
 * benar-benar lunas di Mayar.
 */
export const mayarWebhook = onRequest(
  { secrets: [MAYAR_WEBHOOK_TOKEN, MAYAR_API_KEY], maxInstances: 3 },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('');
      return;
    }
    const header = req.get('x-callback-token');
    const token = typeof header === 'string' ? header : '';
    const harus = MAYAR_WEBHOOK_TOKEN.value();
    // Spasi/baris baru di tepi dibuang: menempel ke Secret Manager sering membawa baris baru.
    const a = Buffer.from(token.trim());
    const b = Buffer.from(harus.trim());
    if (!b.length || a.length !== b.length || !timingSafeEqual(a, b)) {
      logger.warn('mayarWebhook: token ditolak', { headerAda: Boolean(header), panjangHeader: token.length, panjangSecret: harus.length });
      res.status(401).send('');
      return;
    }

    const body = (req.body ?? {}) as { event?: unknown; data?: unknown };
    const event = String(body.event ?? '').slice(0, 60);
    // Pengingat, event membership, dan uji coba dari dasbor: diterima tapi diabaikan (200 supaya tidak diulang).
    if (event !== 'payment.received') {
      logger.info('mayarWebhook: event diabaikan', { event });
      res.status(200).json({ ok: true, ignored: event });
      return;
    }

    const refs = refDariWebhook(body.data);
    let orderId: string | null = null;
    for (const r of refs) {
      const m = (await db.doc(`mayar_ref/${r}`).get()).data();
      if (typeof m?.orderId === 'string') {
        orderId = m.orderId;
        break;
      }
    }
    const data = (body.data && typeof body.data === 'object' ? body.data : {}) as Record<string, unknown>;
    const catatan = {
      event,
      refs,
      statusWebhook: statusWebhook(data.status),
      amount: typeof data.amount === 'number' ? data.amount : null,
      productName: typeof data.productName === 'string' ? data.productName.slice(0, 200) : null,
      email: typeof data.customerEmail === 'string' ? data.customerEmail.trim().toLowerCase().slice(0, 200) : null,
      orderId,
      diterimaPada: Date.now(),
    };
    const idCatatan = refs[0] ?? `tanpa-id-${Date.now()}`;

    if (!orderId) {
      // Pembayaran yang tidak lewat checkout SoalSKD (mis. halaman produk Mayar lama): ditinjau pemilik.
      await db.doc(`mayar_events/${idCatatan}`).set({ ...catatan, hasil: 'tanpa-pesanan' }, { merge: true });
      logger.warn('mayarWebhook: pembayaran tanpa pesanan SoalSKD, perlu ditinjau', { refs });
      res.status(200).json({ ok: false, reason: 'unmatched' });
      return;
    }

    try {
      const r = await verifikasiPesanan(orderId);
      await db.doc(`mayar_events/${idCatatan}`).set({ ...catatan, hasil: r?.status ?? 'tidak-ada' }, { merge: true });
      res.status(200).json({ ok: true, status: r?.status ?? null });
    } catch (e) {
      if (e instanceof GalatMayar && e.sementara) {
        // Mayar sedang tidak bisa dihubungi: 503 supaya webhook diulang. Pembeli juga bisa menekan "Cek Status".
        logger.error('mayarWebhook: API Mayar gagal, minta diulang', { orderId, status: e.status });
        res.status(503).json({ ok: false, reason: 'retry' });
        return;
      }
      logger.error('mayarWebhook: gagal memverifikasi', { orderId, pesan: (e as Error).message });
      await db.doc(`mayar_events/${idCatatan}`).set({ ...catatan, hasil: 'galat' }, { merge: true });
      res.status(200).json({ ok: false, reason: 'error' });
    }
  },
);
