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
 *   3. Kode dari Mayar dibuat per pesanan, idempoten, dan dikirim ke email
 *      pembeli. Kode tidak pernah dicatat di log.
 *
 * Pola ini meniru game edukasi (functions/src/index.ts di repo itu), tapi
 * yang dibuka di sini daftar PAKET, bukan kelompok umur.
 */
import { randomInt, timingSafeEqual } from 'node:crypto';
import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { defineSecret, defineString } from 'firebase-functions/params';
import { setGlobalOptions } from 'firebase-functions/v2';
import { HttpsError, onCall, onRequest, type CallableRequest } from 'firebase-functions/v2/https';
import { createTransport } from 'nodemailer';

initializeApp();
const db = getFirestore();

// Jakarta, sama dengan Firestore. Client memakai region yang sama
// (web/src/lib/firebase/klien.ts, FUNCTIONS_REGION).
setGlobalOptions({ region: 'asia-southeast2', maxInstances: 10 });

/**
 * Produk yang dijual dan paket yang dibukanya. Sengaja diulang di sini (bukan
 * diimpor dari web/): functions di-deploy terpisah. Kalau menambah produk,
 * ubah juga `PAKET_TERBUKA` / daftar paket di web bila perlu.
 */
const PRODUK = {
  'bundel-3to': { judul: 'Bundel 3 Try Out SKD', paket: ['p02', 'p03', 'p04'] },
} as const;
type IdProduk = keyof typeof PRODUK;

function isProduk(v: unknown): v is IdProduk {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(PRODUK, v);
}

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

// --- 2. Webhook Mayar: buat kode + kirim email -------------------------------

/** Webhook Token dari dasbor Mayar, dikirim Mayar lewat header `X-Callback-Token`. */
const MAYAR_WEBHOOK_TOKEN = defineSecret('MAYAR_WEBHOOK_TOKEN');
/** App Password Gmail (bukan sandi Gmail biasa). Lihat docs/firebase.md. */
const GMAIL_APP_PASSWORD = defineSecret('GMAIL_APP_PASSWORD');
/** Alamat Gmail pengirim kode. Diisi lewat functions/.env saat deploy (workflow). */
const EMAIL_PENGIRIM = defineString('EMAIL_PENGIRIM');
/** Alamat situs pembeli, mis. https://soalskd.id (tanpa garis miring di akhir). */
const URL_SITUS = defineString('URL_SITUS', { default: '' });

/** Tanpa I, L, O, 0, 1 supaya tidak salah baca. */
const ABJAD_KODE = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Bentuk tampilan `K7P-M4X-Q2R` (9 karakter, ±2,6×10¹³ kemungkinan). */
function buatKode(): { id: string; tampil: string } {
  const blok = () => Array.from({ length: 3 }, () => ABJAD_KODE[randomInt(ABJAD_KODE.length)]).join('');
  const tampil = `${blok()}-${blok()}-${blok()}`;
  return { id: tampil.replace(/-/g, ''), tampil };
}

/**
 * Produk Mayar → produk SoalSKD. Diutamakan dokumen `config/mayar_products`
 * (`{ "<productId Mayar>": "bundel-3to" }`, diisi pemilik di Console, tanpa
 * deploy). Cadangannya nama produk. Tidak cocok → null → ditangani manual:
 * lebih baik satu pembeli dibalas manual daripada menerima akses yang salah.
 */
async function produkDari(productId: string, productName: string): Promise<IdProduk | null> {
  if (productId) {
    const peta = (await db.doc('config/mayar_products').get()).data() ?? {};
    if (isProduk(peta[productId])) return peta[productId];
  }
  return produkDariNama(productName);
}

/** "Bundel 3 Try Out SKD" → bundel-3to. Hanya kalau menyebut bundel DAN angka 3. */
export function produkDariNama(nama: string): IdProduk | null {
  const n = nama.toLowerCase();
  const angka: string[] = n.match(/\b\d+\b/g) ?? [];
  if (/bundel|bundle/.test(n) && angka.length === 1 && angka[0] === '3') return 'bundel-3to';
  return null;
}

/** Nilai pertama yang ada dari beberapa kandidat nama field (boleh bertitik). */
function ambil(data: Record<string, unknown>, kunci: string[]): string {
  for (const k of kunci) {
    let cur: unknown = data;
    for (const bagian of k.split('.')) {
      cur = cur && typeof cur === 'object' ? (cur as Record<string, unknown>)[bagian] : undefined;
    }
    if (typeof cur === 'string' && cur.trim()) return cur;
    if (typeof cur === 'number' && Number.isFinite(cur)) return String(cur);
  }
  return '';
}

function isEmail(v: string): boolean {
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v) && v.length <= 200;
}

function escapeHtml(v: string): string {
  return v.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function emailKode(nama: string, produk: IdProduk, kode: string) {
  const judul = PRODUK[produk].judul;
  const situs = URL_SITUS.value().replace(/\/+$/, '');
  const halamanAktivasi = situs ? `${situs}/aktivasi` : '';
  const sapa = nama ? `Halo ${nama},` : 'Halo,';
  const langkah1 = halamanAktivasi ? `Buka ${halamanAktivasi}` : 'Buka situs SoalSKD, lalu pilih Masuk';
  const text = [
    sapa,
    '',
    `Terima kasih sudah membeli ${judul} di SoalSKD.`,
    '',
    `Kode aktivasi: ${kode}`,
    '',
    'Cara memakainya:',
    `1. ${langkah1}`,
    '2. Masuk atau daftar (email + kata sandi, atau akun Google)',
    '3. Masukkan kode di atas, lalu tekan Aktifkan',
    '',
    'Satu kode untuk satu akun. Simpan email ini. Ada kendala? Balas email ini.',
    '',
    'Salam,',
    'SoalSKD',
  ].join('\n');

  const tautan = halamanAktivasi
    ? `<a href="${halamanAktivasi}">halaman aktivasi</a>`
    : 'situs SoalSKD, lalu pilih Masuk';
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#111827;line-height:1.5">
<p>${escapeHtml(sapa)}</p>
<p>Terima kasih sudah membeli <b>${judul}</b> di SoalSKD.</p>
<p>Kode aktivasi:</p>
<p style="font-family:monospace;font-size:26px;font-weight:bold;letter-spacing:3px;background:#F1F3F6;border:1px solid #E5E7EB;border-radius:8px;padding:12px 16px;display:inline-block;margin:0">${kode}</p>
<p><b>Cara memakainya:</b></p>
<ol>
<li>Buka ${tautan}</li>
<li>Masuk atau daftar (email + kata sandi, atau akun Google)</li>
<li>Masukkan kode di atas, lalu tekan <b>Aktifkan</b></li>
</ol>
<p>Satu kode untuk satu akun. Simpan email ini. Ada kendala? Balas email ini.</p>
<p>Salam,<br>SoalSKD</p>
</div>`;
  return { subject: `Kode aktivasi SoalSKD: ${judul}`, text, html };
}

async function kirimEmail(pesan: { to: string; subject: string; text: string; html: string }) {
  const pengirim = EMAIL_PENGIRIM.value();
  const mail = { from: `SoalSKD <${pengirim}>`, replyTo: pengirim, ...pesan };
  // Emulator: email hanya disusun, tidak dikirim.
  if (process.env.FUNCTIONS_EMULATOR === 'true') {
    await createTransport({ jsonTransport: true }).sendMail(mail);
    logger.info('emulator: email tidak dikirim', { subject: mail.subject });
    return;
  }
  const transport = createTransport({
    service: 'gmail',
    auth: { user: pengirim, pass: GMAIL_APP_PASSWORD.value().replace(/\s/g, '') },
  });
  await transport.sendMail(mail);
}

type HasilPesanan = { status: 'siap'; kode: string; terkirim: boolean } | { status: 'perlu-manual' };

/**
 * Membuat (atau mengambil lagi) kode untuk satu pesanan. Kode dan catatan
 * pesanan ditulis dalam SATU transaksi: webhook ganda = satu kode.
 */
async function kodeUntukPesanan(
  orderId: string,
  pesanan: { email: string; nama: string; produk: IdProduk; productId: string; productName: string; amount: number },
): Promise<HasilPesanan> {
  const orderRef = db.doc(`orders/${orderId}`);
  for (let i = 0; i < 5; i++) {
    const baru = buatKode();
    const kodeRef = db.doc(`activation_codes/${baru.id}`);
    try {
      return await db.runTransaction(async (tx) => {
        const ada = await tx.get(orderRef);
        if (ada.exists) {
          const d = ada.data() ?? {};
          if (typeof d.code !== 'string') return { status: 'perlu-manual' as const };
          return { status: 'siap' as const, kode: d.code, terkirim: Boolean(d.emailedAt) };
        }
        tx.create(kodeRef, {
          code: baru.id,
          display: baru.tampil,
          produk: pesanan.produk,
          batch: 'mayar-otomatis',
          orderId,
          used: false,
          usedBy: null,
          usedAt: null,
          createdAt: FieldValue.serverTimestamp(),
        });
        tx.create(orderRef, {
          ...pesanan,
          source: 'mayar',
          code: baru.tampil,
          emailedAt: null,
          createdAt: FieldValue.serverTimestamp(),
        });
        return { status: 'siap' as const, kode: baru.tampil, terkirim: false };
      });
    } catch (e) {
      // 6 = ALREADY_EXISTS: kode acak kebetulan sudah ada → coba kode lain.
      if ((e as { code?: unknown }).code === 6) continue;
      throw e;
    }
  }
  throw new Error('Gagal membuat kode unik setelah 5 percobaan');
}

async function catatMasalah(orderId: string, data: Record<string, unknown>, problem: string) {
  await db.doc(`orders/${orderId}`).set(
    { ...data, source: 'mayar', code: null, problem, createdAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
}

export const mayarWebhook = onRequest(
  { secrets: [MAYAR_WEBHOOK_TOKEN, GMAIL_APP_PASSWORD], maxInstances: 3 },
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
      // Diagnosa TANPA isi token.
      logger.warn('mayarWebhook: token ditolak', {
        headerAda: Boolean(header),
        panjangHeader: token.length,
        panjangSecret: harus.length,
      });
      res.status(401).send('');
      return;
    }

    const body = (req.body ?? {}) as { event?: unknown; data?: Record<string, unknown> };
    const event = String(body.event ?? '');
    const data = body.data ?? {};

    // Event lain (pengingat, uji coba dari dasbor) diterima tapi diabaikan; 200 supaya tidak diulang.
    if (event !== 'payment.received') {
      logger.info('mayarWebhook: event diabaikan', { event });
      res.status(200).json({ ok: true, ignored: event });
      return;
    }

    const orderId = ambil(data, ['id', 'transactionId', 'transaction_id']).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 100);
    const email = ambil(data, ['customerEmail', 'customer.email', 'email']).trim().toLowerCase();
    const nama = ambil(data, ['customerName', 'customer.name', 'name'])
      .replace(/[\u0000-\u001f<>]/g, '')
      .trim()
      .slice(0, 80);
    const productId = ambil(data, ['productId', 'product.id', 'paymentLinkId']).slice(0, 100);
    const productName = ambil(data, ['productName', 'product.name', 'paymentLinkName']).slice(0, 200);
    const amount = Number(ambil(data, ['amount', 'totalAmount', 'credit'])) || 0;

    if (!orderId || !isEmail(email)) {
      // Hanya NAMA field yang dicatat, bukan isinya (data pribadi pembeli).
      logger.warn('mayarWebhook: data pesanan tidak lengkap', {
        orderId,
        adaEmail: Boolean(email),
        fields: Object.keys(data).slice(0, 40),
      });
      res.status(200).json({ ok: false, reason: 'incomplete' });
      return;
    }

    const dasar = { email, nama, productId, productName, amount };
    const status = ambil(data, ['status']).toUpperCase();
    if (status && !['SUCCESS', 'PAID', 'SETTLED'].includes(status)) {
      await catatMasalah(orderId, dasar, `status-${status.toLowerCase().slice(0, 20)}`);
      logger.warn('mayarWebhook: status bukan SUCCESS, tidak dikirimi kode', { orderId, status });
      res.status(200).json({ ok: false, reason: 'not-success' });
      return;
    }

    const produk = await produkDari(productId, productName);
    if (!produk) {
      await catatMasalah(orderId, dasar, 'produk-tidak-dikenal');
      logger.error('mayarWebhook: produk tidak dikenal, kirim kode manual', { orderId, productId, productName });
      res.status(200).json({ ok: false, reason: 'unknown-product' });
      return;
    }

    const hasil = await kodeUntukPesanan(orderId, { ...dasar, produk });
    if (hasil.status === 'perlu-manual') {
      res.status(200).json({ ok: false, reason: 'needs-manual' });
      return;
    }
    if (hasil.terkirim) {
      res.status(200).json({ ok: true, already: true });
      return;
    }

    try {
      await kirimEmail({ to: email, ...emailKode(nama, produk, hasil.kode) });
    } catch (e) {
      // KODE TIDAK DICATAT DI LOG. 500 → Mayar mengulang; kodenya sudah tersimpan di pesanan.
      logger.error('mayarWebhook: email gagal, Mayar akan mengulang', { orderId, error: (e as Error).message });
      res.status(500).json({ ok: false, reason: 'email-failed' });
      return;
    }

    await db.doc(`orders/${orderId}`).update({ emailedAt: FieldValue.serverTimestamp() });
    logger.info('mayarWebhook: kode terkirim', { orderId, produk });
    res.status(200).json({ ok: true });
  },
);
