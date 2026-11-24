// Skenario backend SoalSKD di emulator: pembelian Mayar (dengan server Mayar
// tiruan), webhook, kode cadangan, unduh ebook, security rules Firestore + Storage.
// Jalankan: cd functions && npm run uji
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../package.json', import.meta.url));
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const { buatKodeCadangan, cabutKode, cabutPesanan } = require('./lib/hak.js');

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

// Bentuk payload mengikuti contoh di docs Mayar (webhook new-history).
const bayar = (trxId, extra = {}) => ({
  event: 'payment.received',
  data: {
    id: trxId, transactionId: trxId, status: 'SUCCESS', transactionStatus: 'paid',
    customerEmail: 'Pembeli@Contoh.test', customerName: 'Budi', productType: 'payment_request',
    productName: 'SoalSKD Bundel 1', amount: 9900, ...extra,
  },
});

// --- Server Mayar tiruan (alamatnya di .env.local: MAYAR_API_BASE) -----------
const KUNCI_API = readFileSync(new URL('../.secret.local', import.meta.url), 'utf8').match(/MAYAR_API_KEY=(.*)/)[1].trim();
const mayar = { trx: new Map(), bayar: new Map(), tersembunyi: new Set(), dibuat: [], panggilan: 0, mati: false, tolakRedirect: false, n: 0 };
const server = createServer(async (req, res) => {
  mayar.panggilan++;
  const kirim = (status, isi) => {
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(JSON.stringify(isi));
  };
  if (req.headers.authorization !== `Bearer ${KUNCI_API}`) return kirim(401, { statusCode: 401, messages: 'Unauthorized' });
  if (mayar.mati) return kirim(503, { statusCode: 500, messages: 'Error' });
  let raw = '';
  for await (const c of req) raw += c;
  if (req.method === 'POST' && req.url === '/hl/v2/payments/create') {
    const body = JSON.parse(raw);
    if (body.redirectUrl && mayar.tolakRedirect) {
      return kirim(400, { statusCode: 400, messages: 'redirectUrl is not supported on payment requests and was not saved' });
    }
    mayar.dibuat.push(body);
    const n = ++mayar.n;
    const id = `pay-${n}`;
    const transactionId = `trx-${n}`;
    mayar.trx.set(transactionId, {
      id: transactionId, status: 'unpaid', amount: body.amount, extraData: body.extraData ?? null,
      paymentLink: { id, amount: body.amount, type: 'payment_request' }, customer: { email: body.email },
    });
    mayar.bayar.set(id, { id, status: 'unpaid', amount: body.amount, type: 'payment_request' });
    return kirim(200, { statusCode: 200, messages: 'success', data: { id, transactionId, link: `https://toko.myr.id/pl/${id}` } });
  }
  const mp = req.url.match(/^\/hl\/v2\/payments\/([^/?]+)$/);
  if (req.method === 'GET' && mp) {
    const b = mayar.bayar.get(decodeURIComponent(mp[1]));
    return b ? kirim(200, { statusCode: 200, messages: 'success', data: b }) : kirim(404, { statusCode: 404, messages: 'Not Found' });
  }
  const m = req.url.match(/^\/hl\/v2\/transactions\/([^/?]+)$/);
  if (req.method === 'GET' && m) {
    const idT = decodeURIComponent(m[1]);
    const t = mayar.tersembunyi.has(idT) ? null : mayar.trx.get(idT);
    return t ? kirim(200, { statusCode: 200, messages: 'success', data: t }) : kirim(404, { statusCode: 404, messages: 'Transaction not found' });
  }
  kirim(404, { statusCode: 404, messages: 'Not Found' });
});
await new Promise((r) => server.listen(9911, '127.0.0.1', r));
const lunaskan = (trxId, ubah = {}) => Object.assign(mayar.trx.get(trxId), { status: 'paid', ...ubah });

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
const beli = (token, produk) => panggil('buatPesanan', token, { produk });
const cekBayar = (token, orderId) => panggil('cekPembayaran', token, { orderId });
const pesanan = async (id) => (await db.doc(`orders/${id}`).get()).data();
const paketAkun = async (uid) => (await db.doc(`users/${uid}`).get()).data()?.paket ?? [];
const jeda = (ms) => new Promise((r) => setTimeout(r, ms));
const unduh = (token, edisi) => panggil('unduhEbook', token, edisi === undefined ? {} : { edisi });

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
console.log('Webhook Mayar: autentikasi');
cek('tanpa header token → 401', (await webhook(bayar('t1'), { token: null })).status === 401);
cek('token salah → 401', (await webhook(bayar('t1'), { token: 'salah' })).status === 401);
cek('token di query ?t= ditolak → 401', (await webhook(bayar('t1'), { token: null, query: `?t=${TOKEN}` })).status === 401);
cek('GET → 405', (await webhook(null, { method: 'GET' })).status === 405);
const lain = await webhook({ event: 'payment.reminder', data: {} });
cek('event lain diabaikan (200)', lain.status === 200 && lain.json?.ignored === 'payment.reminder');
cek('token dengan baris baru di tepi tetap diterima', (await webhook({ event: 'x' }, { token: `${TOKEN}\n` })).status === 200);

console.log('Buat pesanan');
const belumVerif = await daftar('belum@contoh.test', false);
const ani = await daftar('ani@contoh.test', true);
cek('tanpa login → UNAUTHENTICATED', (await beli(null, 'bundel-3to')).galat === 'UNAUTHENTICATED');
cek('email belum diverifikasi → FAILED_PRECONDITION', (await beli(belumVerif.token, 'bundel-3to')).galat === 'FAILED_PRECONDITION');
cek('produk asing → INVALID_ARGUMENT', (await beli(ani.token, 'bundel-99')).galat === 'INVALID_ARGUMENT');
cek('produk bukan teks → INVALID_ARGUMENT', (await beli(ani.token, { produk: 'bundel-3to' })).galat === 'INVALID_ARGUMENT');
const b1 = await beli(ani.token, 'bundel-3to');
const o1 = b1.hasil ? await pesanan(b1.hasil.orderId) : null;
cek('pesanan dibuat: menunggu + tautan Mayar', b1.hasil?.status === 'menunggu' && b1.hasil.link?.startsWith('https://'), b1);
cek('pesanan terikat uid dari token, harga dari server', o1?.uid === ani.uid && o1.amount === 9900 && o1.currency === 'IDR' && o1.email === 'ani@contoh.test');
const kirimMayar = mayar.dibuat.at(-1);
cek('Mayar menerima nominal, email akun, extraData.orderId', kirimMayar?.amount === 9900 && kirimMayar.email === 'ani@contoh.test'
  && kirimMayar.extraData?.orderId === b1.hasil?.orderId, kirimMayar);
cek('redirectUrl ke /akun?pesanan=…, tanpa nomor HP', kirimMayar?.redirectUrl === `https://contoh.test/akun?pesanan=${b1.hasil?.orderId}` && !('mobile' in kirimMayar));
cek('belum dibayar → paket belum terbuka', (await paketAkun(ani.uid)).length === 0);
const b1lagi = await beli(ani.token, 'bundel-3to');
cek('tekan Bayar lagi → pesanan yang sama, Mayar tidak dipanggil ulang', b1lagi.hasil?.orderId === b1.hasil?.orderId && mayar.dibuat.length === 1);
cek('cermin users/{uid}/pembelian terbaca pemilik', (await fsGet(ani.token, `users/${ani.uid}/pembelian/${b1.hasil.orderId}`)) === 200);

const dua = await daftar('duaperangkat@contoh.test', true);
const sebelum = mayar.dibuat.length;
const serentak = await Promise.all([beli(dua.token, 'bundel-3to'), beli(dua.token, 'bundel-3to'), beli(dua.token, 'bundel-3to')]);
const idSerentak = new Set(serentak.filter((x) => x.hasil).map((x) => x.hasil.orderId));
cek('dua perangkat menekan Bayar bersamaan → satu pesanan Mayar', mayar.dibuat.length - sebelum === 1 && idSerentak.size === 1
  && serentak.every((x) => x.hasil || x.galat === 'ABORTED'), serentak);

mayar.tolakRedirect = true;
const tolakR = await daftar('redirect@contoh.test', true);
const bR = await beli(tolakR.token, 'bundel-3to-2');
cek('Mayar menolak redirectUrl → diulang tanpa redirect, tetap berhasil', bR.hasil?.status === 'menunggu' && !('redirectUrl' in mayar.dibuat.at(-1)), bR);
mayar.tolakRedirect = false;

const rem = await daftar('rem@contoh.test', true);
await db.doc(`rate_limits/buat_${rem.uid}`).set({ mulai: Date.now(), jumlah: 6, terakhir: 0 });
cek('rem pesanan baru (6/jam) → RESOURCE_EXHAUSTED', (await beli(rem.token, 'bundel-3to')).galat === 'RESOURCE_EXHAUSTED');

console.log('Cek status pembayaran');
const idAni = b1.hasil.orderId;
const trxAni = o1.mayarTransactionId;
const c0 = await cekBayar(ani.token, idAni);
cek('belum dibayar → menunggu', c0.hasil?.status === 'menunggu' && c0.hasil.paket.length === 0, c0);
cek('cek lagi < 5 detik → RESOURCE_EXHAUSTED', (await cekBayar(ani.token, idAni)).galat === 'RESOURCE_EXHAUSTED');
const orang = await daftar('orang@contoh.test', true);
cek('pesanan akun lain → NOT_FOUND', (await cekBayar(orang.token, idAni)).galat === 'NOT_FOUND');
cek('nomor pesanan tidak sah → INVALID_ARGUMENT', (await cekBayar(ani.token, '../x')).galat === 'INVALID_ARGUMENT');
cek('tanpa login → UNAUTHENTICATED', (await cekBayar(null, idAni)).galat === 'UNAUTHENTICATED');

console.log('Webhook Mayar: verifikasi lewat API');
const palsu = await webhook(bayar('trx-tidak-ada'));
cek('transaksi palsu (tidak dikenal) → tanpa akses, dicatat', palsu.json?.reason === 'unmatched'
  && (await db.doc('mayar_events/trx-tidak-ada').get()).data()?.hasil === 'tanpa-pesanan');
const klaimPalsu = await webhook(bayar(trxAni));
cek('webhook "SUCCESS" padahal API belum lunas → tanpa akses', klaimPalsu.json?.status === 'menunggu' && (await paketAkun(ani.uid)).length === 0, klaimPalsu);
const boolFalse = await webhook(bayar(trxAni, { status: false }));
cek('status Boolean false → tetap tanpa akses', boolFalse.status === 200 && (await paketAkun(ani.uid)).length === 0);

lunaskan(trxAni);
// Pembeli belum membuka situs lagi: webhook saja yang membuka paketnya.
const ok = await webhook(bayar(trxAni));
cek('lunas di API → 200 aktif', ok.json?.status === 'aktif', ok);
cek('paket terbuka sebelum pembeli login kembali', JSON.stringify(await paketAkun(ani.uid)) === '["p02","p03","p04"]');
const oAni = await pesanan(idAni);
cek('pesanan aktif: paidAt + grantedAt, email sama', oAni.status === 'aktif' && oAni.paidAt && oAni.grantedAt && oAni.emailBeda === false);
const cermin = (await db.doc(`users/${ani.uid}/pembelian/${idAni}`).get()).data();
cek('cermin pembelian aktif tanpa tautan bayar', cermin?.status === 'aktif' && cermin.link === null);
await Promise.all(Array.from({ length: 5 }, () => webhook(bayar(trxAni))));
const userAni = (await db.doc(`users/${ani.uid}`).get()).data();
cek('5 webhook ganda → paket tidak dobel', JSON.stringify(userAni.paket) === '["p02","p03","p04"]' && JSON.stringify(userAni.produk) === '["bundel-3to"]');
const cAni = await cekBayar(ani.token, idAni);
cek('cek status setelah aktif → aktif + daftar paket', cAni.hasil?.status === 'aktif' && cAni.hasil.paket.length === 3, cAni);
cek('beli bundel yang sudah aktif → ALREADY_EXISTS', (await beli(ani.token, 'bundel-3to')).galat === 'ALREADY_EXISTS');

console.log('Webhook Mayar: transaksi tidak cocok');
const nom = await daftar('nominal@contoh.test', true);
const bNom = await beli(nom.token, 'bundel-3to');
const trxNom = (await pesanan(bNom.hasil.orderId)).mayarTransactionId;
lunaskan(trxNom, { amount: 990 });
await webhook(bayar(trxNom));
const oNom = await pesanan(bNom.hasil.orderId);
cek('nominal tidak sesuai → gagal, tanpa akses, perlu ditinjau', oNom.status === 'gagal' && oNom.perluTinjau === true
  && oNom.problem === 'tidak-cocok-nominal' && (await paketAkun(nom.uid)).length === 0, oNom);
lunaskan(trxNom, { amount: 9900 });
await webhook(bayar(trxNom));
cek('setelah gagal, webhook berikutnya tidak membuka akses otomatis', (await pesanan(bNom.hasil.orderId)).status === 'gagal' && (await paketAkun(nom.uid)).length === 0);

const prd = await daftar('produk@contoh.test', true);
const bPrd = await beli(prd.token, 'bundel-3to');
const trxPrd = (await pesanan(bPrd.hasil.orderId)).mayarTransactionId;
lunaskan(trxPrd, { paymentLink: { id: 'pay-produk-lain' } });
await webhook(bayar(trxPrd));
cek('produk tidak sesuai → gagal, tanpa akses', (await pesanan(bPrd.hasil.orderId)).problem === 'tidak-cocok-produk' && (await paketAkun(prd.uid)).length === 0);

const ext = await daftar('extra@contoh.test', true);
const bExt = await beli(ext.token, 'bundel-3to');
const trxExt = (await pesanan(bExt.hasil.orderId)).mayarTransactionId;
lunaskan(trxExt, { extraData: { orderId: 'ord_milikoranglain' } });
await webhook(bayar(trxExt));
cek('extraData pesanan lain → gagal, tanpa akses', (await pesanan(bExt.hasil.orderId)).status === 'gagal' && (await paketAkun(ext.uid)).length === 0);

const asing = await daftar('statusasing@contoh.test', true);
const bAsing = await beli(asing.token, 'bundel-3to');
const trxAsing = (await pesanan(bAsing.hasil.orderId)).mayarTransactionId;
lunaskan(trxAsing, { status: 'refunded' });
await webhook(bayar(trxAsing));
const oAsing = await pesanan(bAsing.hasil.orderId);
cek('status tidak dikenal → tetap menunggu, perlu ditinjau, tanpa akses', oAsing.status === 'menunggu' && oAsing.perluTinjau === true && (await paketAkun(asing.uid)).length === 0);

console.log('Transaksi belum terbaca (404) → status permintaan bayar');
const t404 = await daftar('trx404@contoh.test', true);
const b404 = await beli(t404.token, 'bundel-3to');
const o404 = await pesanan(b404.hasil.orderId);
mayar.tersembunyi.add(o404.mayarTransactionId);
const c404 = await cekBayar(t404.token, b404.hasil.orderId);
cek('transaksi 404 + permintaan unpaid → menunggu, tidak ditandai tinjau', c404.hasil?.status === 'menunggu' && c404.hasil.perluTinjau === false, c404);
mayar.bayar.get(o404.mayarPaymentId).status = 'paid';
await webhook(bayar(o404.mayarTransactionId));
cek('permintaan "paid" tanpa detail transaksi → belum aktif', (await paketAkun(t404.uid)).length === 0 && (await pesanan(b404.hasil.orderId)).status === 'menunggu');
mayar.tersembunyi.delete(o404.mayarTransactionId);
lunaskan(o404.mayarTransactionId);
await webhook(bayar(o404.mayarTransactionId, { transactionId: 'id-lain-dari-mayar', id: 'id-lain', productId: o404.mayarPaymentId }));
cek('webhook dengan id transaksi berbeda tetap cocok lewat productId (id permintaan) → aktif', (await pesanan(b404.hasil.orderId)).status === 'aktif');

console.log('Email pembayaran berbeda');
const bedaE = await daftar('akun.asli@contoh.test', true);
const bBeda = await beli(bedaE.token, 'bundel-3to-2');
const trxBeda = (await pesanan(bBeda.hasil.orderId)).mayarTransactionId;
lunaskan(trxBeda, { customer: { email: 'Salah.Ketik@Contoh.test' } });
await webhook(bayar(trxBeda));
const cBeda = (await db.doc(`users/${bedaE.uid}/pembelian/${bBeda.hasil.orderId}`).get()).data();
cek('email pembayar beda → tetap aktif di akun pemesan (terikat uid)', cBeda?.status === 'aktif'
  && JSON.stringify(await paketAkun(bedaE.uid)) === '["p05","p06","p07"]');
cek('cermin menandai emailBeda + email tersamar', cBeda?.emailBeda === true && cBeda.emailPembayaran === 'sa***@contoh.test', cBeda);

console.log('Kedaluwarsa, terlambat, dan Mayar tidak bisa dihubungi');
const exp = await daftar('kedaluwarsa@contoh.test', true);
const bExp = await beli(exp.token, 'bundel-3to');
const trxExp = (await pesanan(bExp.hasil.orderId)).mayarTransactionId;
mayar.trx.get(trxExp).status = 'expired';
const cExp = await cekBayar(exp.token, bExp.hasil.orderId);
cek('Mayar expired → kedaluwarsa, tanpa tautan bayar', cExp.hasil?.status === 'kedaluwarsa' && cExp.hasil.link === null, cExp);
const bExp2 = await beli(exp.token, 'bundel-3to');
cek('setelah kedaluwarsa, Bayar membuat pesanan baru', bExp2.hasil?.orderId && bExp2.hasil.orderId !== bExp.hasil.orderId);
lunaskan(trxExp);
await webhook(bayar(trxExp));
cek('webhook lunas datang terlambat untuk pesanan kedaluwarsa → aktif', (await pesanan(bExp.hasil.orderId)).status === 'aktif'
  && (await paketAkun(exp.uid)).includes('p02'));

const lambat = await daftar('lewatwaktu@contoh.test', true);
const bLambat = await beli(lambat.token, 'bundel-3to');
await db.doc(`orders/${bLambat.hasil.orderId}`).update({ expiresAt: Date.now() - 60 * 60 * 1000 });
cek('batas waktu lewat + Mayar masih unpaid → kedaluwarsa', (await cekBayar(lambat.token, bLambat.hasil.orderId)).hasil?.status === 'kedaluwarsa');

const down = await daftar('mayarmati@contoh.test', true);
const bDown = await beli(down.token, 'bundel-3to');
const trxDown = (await pesanan(bDown.hasil.orderId)).mayarTransactionId;
lunaskan(trxDown);
mayar.mati = true;
const wDown = await webhook(bayar(trxDown));
cek('API Mayar mati → webhook 503 (minta diulang), tanpa akses', wDown.status === 503 && (await paketAkun(down.uid)).length === 0, wDown);
cek('API Mayar mati → cek status UNAVAILABLE', (await cekBayar(down.token, bDown.hasil.orderId)).galat === 'UNAVAILABLE');
cek('API Mayar mati → buat pesanan baru UNAVAILABLE', (await beli(orang.token, 'bundel-3to')).galat === 'UNAVAILABLE');
mayar.mati = false;
await jeda(5200);
const [cD, w1, w2] = await Promise.all([cekBayar(down.token, bDown.hasil.orderId), webhook(bayar(trxDown)), webhook(bayar(trxDown))]);
const userDown = (await db.doc(`users/${down.uid}`).get()).data();
cek('Mayar pulih: cek + 2 webhook bersamaan → aktif sekali', cD.hasil?.status === 'aktif' && w1.status === 200 && w2.status === 200
  && JSON.stringify(userDown.paket) === '["p02","p03","p04"]', { cD, w1: w1.json, userDown });

console.log('Pencabutan (refund manual oleh admin)');
const kodeCabut = (await buatKodeCadangan(db, 'bundel-3to-2', 1, 'uji'))[0];
await tukar(ani.token, kodeCabut);
cek('pemilik Bundel 1 (beli) + Bundel 2 (kode) → enam paket', (await paketAkun(ani.uid)).length === 6);
const sisa = await cabutPesanan(db, idAni, 'uji refund');
cek('cabut pesanan Bundel 1 → tinggal Bundel 2 dari kode', JSON.stringify(sisa.paket) === '["p05","p06","p07"]'
  && JSON.stringify(await paketAkun(ani.uid)) === '["p05","p06","p07"]');
cek('cermin pembelian berstatus dicabut', (await db.doc(`users/${ani.uid}/pembelian/${idAni}`).get()).data()?.status === 'dicabut');
await webhook(bayar(trxAni));
cek('webhook setelah dicabut tidak membuka lagi', (await pesanan(idAni)).status === 'dicabut' && !(await paketAkun(ani.uid)).includes('p02'));
await cabutKode(db, kodeCabut, 'uji');
cek('cabut kode → paket dari kode itu hilang', (await paketAkun(ani.uid)).length === 0);
cek('kode yang dicabut tidak bisa ditukar lagi', (await tukar(ani.token, kodeCabut)).galat === 'NOT_FOUND');

console.log('Kode cadangan (admin)');
const [kode1] = await buatKodeCadangan(db, 'bundel-3to', 1, 'giveaway uji');
const [kodeB2, kodeB2b] = await buatKodeCadangan(db, 'bundel-3to-2', 2, 'kompensasi uji');
cek('bentuk kode XXX-XXX-XXX', /^[A-Z2-9]{3}-[A-Z2-9]{3}-[A-Z2-9]{3}$/.test(kode1 ?? ''));
const kodeDoc = (await db.doc(`activation_codes/${kode1.replace(/-/g, '')}`).get()).data();
cek('dokumen kode: produk, batch admin, catatan, belum dipakai', kodeDoc?.produk === 'bundel-3to' && kodeDoc.used === false
  && kodeDoc.batch === 'admin' && kodeDoc.catatan === 'giveaway uji');
let galatJumlah = null;
try { await buatKodeCadangan(db, 'bundel-3to', 0, 'x'); } catch (e) { galatJumlah = e.message; }
cek('jumlah kode tidak sah ditolak', galatJumlah === 'jumlah 1–100');
const ujiEndpoint = await fetch(`${FN}/buatKodeCadangan`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"data":{}}' });
cek('tidak ada endpoint publik pembuat kode', ujiEndpoint.status === 404, ujiEndpoint.status);

console.log('Tukar kode aktivasi');
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
const duaHp = await daftar('duahp@contoh.test', true);
const [kodeDuaHp] = await buatKodeCadangan(db, 'bundel-3to', 1, 'uji');
const hpLain = await daftar('hplain@contoh.test', true);
const balapan = await Promise.all([tukar(duaHp.token, kodeDuaHp), tukar(hpLain.token, kodeDuaHp)]);
cek('dua akun menukar kode sama bersamaan → hanya satu berhasil', balapan.filter((x) => x.hasil).length === 1, balapan);

const budi = await daftar('budi@contoh.test', true);
const rb2 = await tukar(budi.token, kodeB2);
cek('kode Bundel 2 → paket p05–p07', JSON.stringify(rb2.hasil?.paket) === '["p05","p06","p07"]', rb2);
const userBudi = (await db.doc(`users/${budi.uid}`).get()).data();
cek('users/{uid}: paket p05–p07 + produk bundel-3to-2', JSON.stringify(userBudi?.paket) === '["p05","p06","p07"]'
  && JSON.stringify(userBudi?.produk) === '["bundel-3to-2"]');
const rAndiB2 = await tukar(andi.token, kodeB2b);
const userAndi2 = (await db.doc(`users/${andi.uid}`).get()).data();
cek('pemilik Bundel 1 menukar Bundel 2 → enam paket, dua produk',
  rAndiB2.hasil?.sudah === false && JSON.stringify(userAndi2?.paket) === '["p02","p03","p04","p05","p06","p07"]'
  && JSON.stringify(userAndi2?.produk) === '["bundel-3to","bundel-3to-2"]', userAndi2);

const penebak = await daftar('penebak@contoh.test', true);
for (let i = 0; i < 10; i++) await tukar(penebak.token, `AAA-AAA-AA${i + 2}`);
cek('10 kali salah → RESOURCE_EXHAUSTED', (await tukar(penebak.token, kode1)).galat === 'RESOURCE_EXHAUSTED');

console.log('Security rules');
cek('pemilik membaca users/{uid}', (await fsGet(andi.token, `users/${andi.uid}`)) === 200);
cek('akun lain tidak bisa membaca users/{uid}', (await fsGet(sari.token, `users/${andi.uid}`)) === 403);
cek('tanpa login tidak bisa membaca users/{uid}', (await fsGet(null, `users/${andi.uid}`)) === 403);
cek('client tidak bisa menulis paket sendiri', (await fsPatch(sari.token, `users/${sari.uid}`, fields({ paket: ['p02'] }))) === 403);
cek('activation_codes tertutup', (await fsGet(andi.token, `activation_codes/${kode1.replace(/-/g, '')}`)) === 403);
cek('orders tertutup, juga untuk pemiliknya', (await fsGet(ani.token, `orders/${idAni}`)) === 403);
cek('cermin pembelian akun lain tertutup', (await fsGet(sari.token, `users/${ani.uid}/pembelian/${idAni}`)) === 403);
cek('client tidak bisa menulis cermin pembelian sendiri', (await fsPatch(ani.token, `users/${ani.uid}/pembelian/${idAni}`, fields({ status: 'aktif' }))) === 403);
cek('client tidak bisa membuat pembelian palsu', (await fsPatch(sari.token, `users/${sari.uid}/pembelian/ord_palsu123`, fields({ status: 'aktif', produk: 'bundel-3to' }))) === 403);
cek('mayar_ref tertutup', (await fsGet(ani.token, `mayar_ref/${trxAni}`)) === 403);
cek('mayar_events tertutup', (await fsGet(ani.token, 'mayar_events/trx-tidak-ada')) === 403);
cek('checkout tertutup', (await fsGet(ani.token, `checkout/${ani.uid}__bundel-3to`)) === 403);
cek('rate_limits tertutup', (await fsGet(rem.token, `rate_limits/buat_${rem.uid}`)) === 403);
cek('config tertutup', (await fsGet(andi.token, 'config/apa-saja')) === 403);
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
cek('edisi tidak dikenal → INVALID_ARGUMENT', (await unduh(andi.token, 'edisi-9')).galat === 'INVALID_ARGUMENT');
cek('edisi bukan teks → INVALID_ARGUMENT', (await unduh(andi.token, 2)).galat === 'INVALID_ARGUMENT');
const b1Saja = await daftar('b1saja@contoh.test', true);
await db.doc(`users/${b1Saja.uid}`).set({ paket: ['p02', 'p03', 'p04'] });
const tolakE2 = await unduh(b1Saja.token, 'edisi-2');
cek('Bundel 1 saja minta edisi-2 → PERMISSION_DENIED', tolakE2.galat === 'PERMISSION_DENIED' && /Bundel 2/.test(tolakE2.pesan), tolakE2);
cek('Bundel 2 saja minta edisi-1 → PERMISSION_DENIED', (await unduh(budi.token, 'edisi-1')).galat === 'PERMISSION_DENIED');
cek('Bundel 2, edisi-2 belum diunggah → NOT_FOUND', (await unduh(budi.token, 'edisi-2')).galat === 'NOT_FOUND');

await getStorage().bucket().file(PATH_EBOOK).save(Buffer.from('%PDF-1.4 uji'), { contentType: 'application/pdf' });
const u1 = await unduh(andi.token);
const url = u1.hasil?.url ? new URL(u1.hasil.url) : null;
cek('pemilik bundel → signed URL', url !== null && url.pathname.endsWith(`/${BUCKET}/${PATH_EBOOK}`), u1);
cek('URL berlaku 10 menit', url?.searchParams.get('X-Goog-Expires') === '600'
  && Math.abs(u1.hasil.berakhirPada - Date.now() - 600_000) < 60_000, url?.search);
cek('nama file unduhan SoalSKD-Edisi-1.pdf', u1.hasil?.namaFile === 'SoalSKD-Edisi-1.pdf'
  && url?.searchParams.get('response-content-disposition') === 'attachment; filename="SoalSKD-Edisi-1.pdf"');
cek('URL bertanda tangan v4', Boolean(url?.searchParams.get('X-Goog-Signature')) && url?.searchParams.get('X-Goog-Algorithm') === 'GOOG4-RSA-SHA256');
const e1 = await unduh(andi.token, 'edisi-1');
cek('edisi-1 eksplisit sama dengan tanpa edisi', e1.hasil?.namaFile === 'SoalSKD-Edisi-1.pdf'
  && new URL(e1.hasil.url).pathname.endsWith(`/${PATH_EBOOK}`));

const PATH_EBOOK_2 = 'ebook/edisi-2.pdf';
await getStorage().bucket().file(PATH_EBOOK_2).save(Buffer.from('%PDF-1.4 uji 2'), { contentType: 'application/pdf' });
const e2 = await unduh(budi.token, 'edisi-2');
const url2 = e2.hasil?.url ? new URL(e2.hasil.url) : null;
cek('Bundel 2 → signed URL edisi-2', url2 !== null && url2.pathname.endsWith(`/${BUCKET}/${PATH_EBOOK_2}`), e2);
cek('nama file unduhan SoalSKD-Edisi-2.pdf', e2.hasil?.namaFile === 'SoalSKD-Edisi-2.pdf'
  && url2?.searchParams.get('response-content-disposition') === 'attachment; filename="SoalSKD-Edisi-2.pdf"');
const aE1 = await unduh(andi.token, 'edisi-1');
const aE2 = await unduh(andi.token, 'edisi-2');
cek('pemilik dua bundel mengunduh kedua edisi', aE1.hasil?.namaFile === 'SoalSKD-Edisi-1.pdf' && aE2.hasil?.namaFile === 'SoalSKD-Edisi-2.pdf');
cek('Bundel 1 saja tetap ditolak setelah edisi-2 diunggah', (await unduh(b1Saja.token, 'edisi-2')).galat === 'PERMISSION_DENIED');

const satuPaket = await daftar('satu@contoh.test', true);
await db.doc(`users/${satuPaket.uid}`).set({ paket: ['p03'] });
cek('cukup satu paket bundel (p03) → boleh', typeof (await unduh(satuPaket.token)).hasil?.url === 'string');

console.log('Storage rules');
cek('pemilik bundel tidak bisa membaca PDF langsung', (await stGet(andi.token, PATH_EBOOK)) === 403);
cek('tanpa login tidak bisa membaca PDF', (await stGet(null, PATH_EBOOK)) === 403);
cek('tidak bisa mendaftar isi ebook/', (await stList(andi.token, 'ebook/')) === 403);
cek('client tidak bisa mengunggah', (await stUpload(andi.token, 'ebook/palsu.pdf')) === 403);
cek('client tidak bisa menimpa PDF', (await stUpload(andi.token, PATH_EBOOK)) === 403);
cek('pemilik Bundel 2 tidak bisa membaca PDF edisi-2 langsung', (await stGet(budi.token, 'ebook/edisi-2.pdf')) === 403);

server.close();
console.log(`\n${lulus} lulus, ${gagal.length} gagal`);
if (gagal.length) {
  console.log('Gagal:', gagal.join('; '));
  process.exit(1);
}
process.exit(0);
