// Skenario backend SoalSKD di emulator: webhook Mayar, tukar kode, unduh ebook,
// security rules Firestore + Storage.
// Jalankan: cd functions && npm run uji
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../package.json', import.meta.url));
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');

const PROJECT = 'demo-soalskd';
const FN = `http://127.0.0.1:5001/${PROJECT}/asia-southeast2`;
const AUTH = 'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1';
const FS = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`;
// Bucket default emulator (sama dengan FIREBASE_CONFIG yang dilihat functions).
const BUCKET = `${PROJECT}.appspot.com`;
const ST = `http://127.0.0.1:9199/v0/b/${BUCKET}/o`;
const TOKEN = readFileSync(new URL('../.secret.local', import.meta.url), 'utf8').match(/MAYAR_WEBHOOK_TOKEN=(.*)/)[1].trim();

initializeApp({ projectId: PROJECT, storageBucket: BUCKET });
const db = getFirestore();
const auth = getAuth();

let lulus = 0;
const gagal = [];
function cek(nama, kondisi, info) {
  if (kondisi) {
    lulus++;
    console.log(`  ok   ${nama}`);
  } else {
    gagal.push(nama);
    console.log(`  GAGAL ${nama}`, info ?? '');
  }
}

// --- alat bantu ---
async function webhook(body, { token = TOKEN, method = 'POST', query = '' } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (token !== null) headers['x-callback-token'] = token;
  const r = await fetch(`${FN}/mayarWebhook${query}`, {
    method,
    headers,
    body: method === 'POST' ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await r.json(); } catch {}
  return { status: r.status, json };
}

const bayar = (id, extra = {}) => ({
  event: 'payment.received',
  data: {
    id, status: 'SUCCESS', customerEmail: 'Pembeli@Contoh.test', customerName: 'Budi',
    productId: 'prod-1', productName: 'Bundel 3 Try Out SKD', amount: 9900, ...extra,
  },
});

async function daftar(email, terverifikasi) {
  const r = await fetch(`${AUTH}/accounts:signUp?key=demo`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'rahasia123', returnSecureToken: true }),
  }).then((x) => x.json());
  if (terverifikasi) await auth.updateUser(r.localId, { emailVerified: true });
  const m = await fetch(`${AUTH}/accounts:signInWithPassword?key=demo`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: 'rahasia123', returnSecureToken: true }),
  }).then((x) => x.json());
  return { uid: r.localId, token: m.idToken };
}

async function panggil(nama, token, data) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  const r = await fetch(`${FN}/${nama}`, {
    method: 'POST', headers, body: JSON.stringify({ data }),
  }).then((x) => x.json());
  return r.error ? { galat: r.error.status, pesan: r.error.message } : { hasil: r.result };
}
const tukar = (token, kode) => panggil('redeemActivationCode', token, { kode });
const unduh = (token) => panggil('unduhEbook', token, {});

// Storage REST sebagai client (rules berlaku).
async function stGet(token, path) {
  const r = await fetch(`${ST}/${encodeURIComponent(path)}?alt=media`, {
    headers: token ? { authorization: `Firebase ${token}` } : {},
  });
  return r.status;
}
async function stList(token, prefix) {
  const r = await fetch(`${ST}?prefix=${encodeURIComponent(prefix)}`, {
    headers: token ? { authorization: `Firebase ${token}` } : {},
  });
  return r.status;
}
async function stUpload(token, path) {
  const r = await fetch(`${ST}?name=${encodeURIComponent(path)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/pdf', ...(token ? { authorization: `Firebase ${token}` } : {}) },
    body: '%PDF-1.4 palsu',
  });
  return r.status;
}

// Firestore REST sebagai client (rules berlaku).
async function fsGet(token, path) {
  const r = await fetch(`${FS}/${path}`, { headers: token ? { authorization: `Bearer ${token}` } : {} });
  return r.status;
}
async function fsPatch(token, path, fields) {
  const r = await fetch(`${FS}/${path}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ fields }),
  });
  return r.status;
}
const nilai = (v) =>
  typeof v === 'boolean' ? { booleanValue: v }
  : Number.isInteger(v) ? { integerValue: String(v) }
  : typeof v === 'number' ? { doubleValue: v }
  : typeof v === 'string' ? { stringValue: v }
  : Array.isArray(v) ? { arrayValue: { values: v.map(nilai) } }
  : { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, nilai(x)])) } };
const fields = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, nilai(v)]));

// --- skenario ---
console.log('Webhook Mayar');
cek('tanpa header token → 401', (await webhook(bayar('t1'), { token: null })).status === 401);
cek('token salah → 401', (await webhook(bayar('t1'), { token: 'salah' })).status === 401);
cek('token di query ?t= ditolak → 401', (await webhook(bayar('t1'), { token: null, query: `?t=${TOKEN}` })).status === 401);
cek('GET → 405', (await webhook(null, { method: 'GET' })).status === 405);
const lain = await webhook({ event: 'payment.reminder', data: {} });
cek('event lain diabaikan (200)', lain.status === 200 && lain.json?.ignored === 'payment.reminder');
cek('token dengan baris baru di tepi tetap diterima', (await webhook({ event: 'x' }, { token: `${TOKEN}\n` })).status === 200);

const ok1 = await webhook(bayar('trx-1'));
const order1 = (await db.doc('orders/trx-1').get()).data();
cek('bayar SUCCESS → 200 + kode + emailedAt', ok1.status === 200 && ok1.json?.ok === true
  && typeof order1?.code === 'string' && order1.emailedAt != null, { ok1, order1 });
cek('email pembeli dinormalkan huruf kecil', order1?.email === 'pembeli@contoh.test');
const kode1 = order1?.code;
cek('bentuk kode XXX-XXX-XXX', /^[A-Z2-9]{3}-[A-Z2-9]{3}-[A-Z2-9]{3}$/.test(kode1 ?? ''));
const kodeDoc = (await db.doc(`activation_codes/${kode1.replace(/-/g, '')}`).get()).data();
cek('dokumen kode: produk bundel-3to, belum dipakai', kodeDoc?.produk === 'bundel-3to' && kodeDoc.used === false);

const ulang = await webhook(bayar('trx-1'));
const semuaTrx1 = await db.collection('activation_codes').where('orderId', '==', 'trx-1').get();
cek('webhook diulang → tidak dobel (already)', ulang.json?.already === true && semuaTrx1.size === 1);

await Promise.all(Array.from({ length: 5 }, () => webhook(bayar('trx-ganda'))));
const ganda = await db.collection('activation_codes').where('orderId', '==', 'trx-ganda').get();
cek('5 webhook bersamaan → 1 kode', ganda.size === 1, ganda.size);

const pending = await webhook(bayar('trx-pending', { status: 'PENDING' }));
const dPending = (await db.doc('orders/trx-pending').get()).data();
cek('status bukan SUCCESS → tanpa kode', pending.json?.reason === 'not-success' && dPending?.code === null
  && dPending.problem === 'status-pending');

const asing = await webhook(bayar('trx-asing', { productId: 'x', productName: 'Ebook Saja' }));
const dAsing = (await db.doc('orders/trx-asing').get()).data();
cek('produk tak dikenal → dicatat manual', asing.json?.reason === 'unknown-product' && dAsing?.problem === 'produk-tidak-dikenal');
cek('nama "Bundel 5 Try Out" tidak ditebak', (await webhook(bayar('trx-5', { productId: '', productName: 'Bundel 5 Try Out' }))).json?.reason === 'unknown-product');

await db.doc('config/mayar_products').set({ 'prod-khusus': 'bundel-3to' });
const peta = await webhook(bayar('trx-peta', { productId: 'prod-khusus', productName: 'Nama Bebas' }));
cek('pemetaan config/mayar_products diutamakan', peta.json?.ok === true);

cek('data tanpa email → incomplete', (await webhook(bayar('trx-x', { customerEmail: '' }))).json?.reason === 'incomplete');

console.log('Tukar kode aktivasi');
const belumVerif = await daftar('belum@contoh.test', false);
const andi = await daftar('andi@contoh.test', true);
const sari = await daftar('sari@contoh.test', true);

cek('tanpa login → UNAUTHENTICATED', (await tukar(null, kode1)).galat === 'UNAUTHENTICATED');
const r0 = await tukar(belumVerif.token, kode1);
cek('email belum diverifikasi → FAILED_PRECONDITION', r0.galat === 'FAILED_PRECONDITION', r0);
cek('kode tetap utuh setelah ditolak', (await db.doc(`activation_codes/${kode1.replace(/-/g, '')}`).get()).data()?.used === false);
cek('kode tidak terbaca → INVALID_ARGUMENT', (await tukar(andi.token, 'ab')).galat === 'INVALID_ARGUMENT');
cek('kode salah → NOT_FOUND', (await tukar(andi.token, 'ZZZ-ZZZ-ZZZ')).galat === 'NOT_FOUND');

const r1 = await tukar(andi.token, kode1.toLowerCase().replace(/-/g, ' '));
cek('kode benar (huruf kecil + spasi) → paket p02–p04', JSON.stringify(r1.hasil?.paket) === '["p02","p03","p04"]' && r1.hasil.sudah === false, r1);
const userAndi = (await db.doc(`users/${andi.uid}`).get()).data();
cek('users/{uid}.paket terisi', JSON.stringify(userAndi?.paket) === '["p02","p03","p04"]');
const r2 = await tukar(andi.token, kode1);
cek('akun sama menukar lagi → sudah: true', r2.hasil?.sudah === true, r2);
const r3 = await tukar(sari.token, kode1);
cek('akun lain memakai kode terpakai → NOT_FOUND (pesan sama)', r3.galat === 'NOT_FOUND' && r3.pesan === (await tukar(sari.token, 'QQQ-QQQ-QQQ')).pesan);

const penebak = await daftar('penebak@contoh.test', true);
for (let i = 0; i < 10; i++) await tukar(penebak.token, `AAA-AAA-AA${i + 2}`);
cek('10 kali salah → RESOURCE_EXHAUSTED', (await tukar(penebak.token, kode1)).galat === 'RESOURCE_EXHAUSTED');

console.log('Security rules');
cek('pemilik membaca users/{uid}', (await fsGet(andi.token, `users/${andi.uid}`)) === 200);
cek('akun lain tidak bisa membaca users/{uid}', (await fsGet(sari.token, `users/${andi.uid}`)) === 403);
cek('tanpa login tidak bisa membaca users/{uid}', (await fsGet(null, `users/${andi.uid}`)) === 403);
cek('client tidak bisa menulis paket sendiri', (await fsPatch(sari.token, `users/${sari.uid}`, fields({ paket: ['p02'] }))) === 403);
cek('activation_codes tertutup', (await fsGet(andi.token, `activation_codes/${kode1.replace(/-/g, '')}`)) === 403);
cek('orders tertutup', (await fsGet(andi.token, 'orders/trx-1')) === 403);
cek('config tertutup', (await fsGet(andi.token, 'config/mayar_products')) === 403);
cek('redeem_attempts tertutup', (await fsGet(penebak.token, `redeem_attempts/${penebak.uid}`)) === 403);

const sesi = { jawaban: { 'p01-001': 'A' }, ragu: { 'p01-002': true }, indeks: 3, berakhirPada: 1790000000000, selesai: false, disimpanPada: 1780000000000 };
cek('menulis sesi sendiri', (await fsPatch(sari.token, `users/${sari.uid}/sesi/p01`, fields(sesi))) === 200);
cek('membaca sesi sendiri', (await fsGet(sari.token, `users/${sari.uid}/sesi/p01`)) === 200);
cek('sesi dengan field asing ditolak', (await fsPatch(sari.token, `users/${sari.uid}/sesi/p01`, fields({ ...sesi, paket: ['p02'] }))) === 403);
cek('menulis sesi akun lain ditolak', (await fsPatch(sari.token, `users/${andi.uid}/sesi/p01`, fields(sesi))) === 403);
const riwayat = { paket: 'p01', judul: 'Paket 1', total: 120, totalMaks: 550, perSubtes: [{ subtes: 'TWK', skor: 40, maks: 150 }], percobaan: 1780000000000, dicatatPada: 1780000000001 };
cek('menulis riwayat sendiri', (await fsPatch(sari.token, `users/${sari.uid}/riwayat/p01-1780000000000`, fields(riwayat))) === 200);
cek('riwayat id tidak sah ditolak', (await fsPatch(sari.token, `users/${sari.uid}/riwayat/ngawur`, fields(riwayat))) === 403);

console.log('Unduh ebook');
const PATH_EBOOK = 'ebook/edisi-1.pdf';
cek('tanpa login → UNAUTHENTICATED', (await unduh(null)).galat === 'UNAUTHENTICATED');
cek('akun tanpa paket → PERMISSION_DENIED', (await unduh(sari.token)).galat === 'PERMISSION_DENIED');
const gratisan = await daftar('gratis@contoh.test', true);
await db.doc(`users/${gratisan.uid}`).set({ paket: ['p01'] });
cek('hanya paket gratis p01 → PERMISSION_DENIED', (await unduh(gratisan.token)).galat === 'PERMISSION_DENIED');
const belumAda = await unduh(andi.token);
cek('pemilik bundel, file belum diunggah → NOT_FOUND', belumAda.galat === 'NOT_FOUND', belumAda);

await getStorage().bucket().file(PATH_EBOOK).save(Buffer.from('%PDF-1.4 uji'), { contentType: 'application/pdf' });
const u1 = await unduh(andi.token);
const url = u1.hasil?.url ? new URL(u1.hasil.url) : null;
cek('pemilik bundel → signed URL', url !== null && url.pathname.endsWith(`/${BUCKET}/${PATH_EBOOK}`), u1);
cek('URL berlaku 10 menit', url?.searchParams.get('X-Goog-Expires') === '600'
  && Math.abs(u1.hasil.berakhirPada - Date.now() - 600_000) < 60_000, url?.search);
cek('nama file unduhan SoalSKD-Edisi-1.pdf', u1.hasil?.namaFile === 'SoalSKD-Edisi-1.pdf'
  && url?.searchParams.get('response-content-disposition') === 'attachment; filename="SoalSKD-Edisi-1.pdf"');
cek('URL bertanda tangan v4', Boolean(url?.searchParams.get('X-Goog-Signature')) && url?.searchParams.get('X-Goog-Algorithm') === 'GOOG4-RSA-SHA256');
const satuPaket = await daftar('satu@contoh.test', true);
await db.doc(`users/${satuPaket.uid}`).set({ paket: ['p03'] });
cek('cukup satu paket bundel (p03) → boleh', typeof (await unduh(satuPaket.token)).hasil?.url === 'string');

console.log('Storage rules');
cek('pemilik bundel tidak bisa membaca PDF langsung', (await stGet(andi.token, PATH_EBOOK)) === 403);
cek('tanpa login tidak bisa membaca PDF', (await stGet(null, PATH_EBOOK)) === 403);
cek('tidak bisa mendaftar isi ebook/', (await stList(andi.token, 'ebook/')) === 403);
cek('client tidak bisa mengunggah', (await stUpload(andi.token, 'ebook/palsu.pdf')) === 403);
cek('client tidak bisa menimpa PDF', (await stUpload(andi.token, PATH_EBOOK)) === 403);

console.log(`\n${lulus} lulus, ${gagal.length} gagal`);
if (gagal.length) {
  console.log('Gagal:', gagal.join('; '));
  process.exit(1);
}
process.exit(0);
