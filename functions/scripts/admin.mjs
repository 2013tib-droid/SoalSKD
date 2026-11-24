#!/usr/bin/env node
// Alat admin SoalSKD. Berjalan di komputer pemilik dengan kredensial Google
// pemilik proyek (bukan endpoint publik), jadi kode cadangan tidak bisa dibuat
// dari internet.
//
// Persiapan sekali: `gcloud auth application-default login` (akun pemilik proyek),
// lalu dari folder functions/: `npm ci && npm run build`.
//
//   node scripts/admin.mjs --project ID kode bundel-3to [jumlah] [catatan...]
//   node scripts/admin.mjs --project ID cari email@contoh.com
//   node scripts/admin.mjs --project ID cabut-pesanan ord_xxx alasan...
//   node scripts/admin.mjs --project ID cabut-kode ABC-DEF-GHJ alasan...
//
// Di emulator: FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/admin.mjs --project demo-soalskd ...
import { createRequire } from 'node:module';

const require = createRequire(new URL('../package.json', import.meta.url));
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { buatKodeCadangan, cabutKode, cabutPesanan } = require('./lib/hak.js');

const args = process.argv.slice(2);
const iProject = args.indexOf('--project');
const project = iProject >= 0 ? args[iProject + 1] : process.env.GOOGLE_CLOUD_PROJECT;
if (iProject >= 0) args.splice(iProject, 2);
const [perintah, ...sisa] = args;

function pakai() {
  console.log(`Pakai:
  node scripts/admin.mjs --project ID kode <bundel-3to|bundel-3to-2> [jumlah] [catatan]
  node scripts/admin.mjs --project ID cari <email>
  node scripts/admin.mjs --project ID cabut-pesanan <orderId> <alasan>
  node scripts/admin.mjs --project ID cabut-kode <kode> <alasan>`);
  process.exit(1);
}
if (!project || !perintah) pakai();

initializeApp(process.env.FIRESTORE_EMULATOR_HOST ? { projectId: project } : { credential: applicationDefault(), projectId: project });
const db = getFirestore();

const tgl = (ms) => (typeof ms === 'number' ? new Date(ms).toISOString().slice(0, 16).replace('T', ' ') : '-');

switch (perintah) {
  case 'kode': {
    const [produk, jumlah = '1', ...catatan] = sisa;
    if (!produk) pakai();
    const kode = await buatKodeCadangan(db, produk, Number(jumlah), catatan.join(' ') || 'manual');
    console.log(`${kode.length} kode ${produk}:`);
    for (const k of kode) console.log(`  ${k}`);
    console.log('Kirim kode ke penerimanya secara pribadi. Penukaran di /aktivasi (akun dengan email terverifikasi).');
    break;
  }
  case 'cari': {
    const email = (sisa[0] ?? '').trim().toLowerCase();
    if (!email) pakai();
    const [akun, bayar, peristiwa] = await Promise.all([
      db.collection('orders').where('email', '==', email).get(),
      db.collection('orders').where('emailPembayar', '==', email).get(),
      db.collection('mayar_events').where('email', '==', email).get(),
    ]);
    const semua = new Map([...akun.docs, ...bayar.docs].map((d) => [d.id, d.data()]));
    console.log(`Pesanan (${semua.size}):`);
    for (const [id, d] of semua) {
      console.log(`  ${id}  ${d.produk}  ${d.status}  dibuat ${tgl(d.createdAt)}  uid ${d.uid}  akun ${d.email}  pembayar ${d.emailPembayar ?? '-'}  mayar ${d.mayarTransactionId ?? '-'}${d.problem ? `  masalah ${d.problem}` : ''}`);
    }
    console.log(`Webhook Mayar (${peristiwa.size}):`);
    for (const d of peristiwa.docs) {
      const x = d.data();
      console.log(`  ${d.id}  ${x.hasil}  ${x.productName ?? '-'}  Rp${x.amount ?? '-'}  ${tgl(x.diterimaPada)}  pesanan ${x.orderId ?? '-'}`);
    }
    break;
  }
  case 'cabut-pesanan': {
    const [orderId, ...alasan] = sisa;
    if (!orderId || !alasan.length) pakai();
    const hak = await cabutPesanan(db, orderId, alasan.join(' '));
    console.log(`Pesanan ${orderId} dicabut. Paket akun sekarang: ${hak.paket.join(', ') || '(tidak ada)'}`);
    break;
  }
  case 'cabut-kode': {
    const [kode, ...alasan] = sisa;
    if (!kode || !alasan.length) pakai();
    const hak = await cabutKode(db, kode, alasan.join(' '));
    console.log(hak ? `Kode dicabut. Paket akun pemakainya sekarang: ${hak.paket.join(', ') || '(tidak ada)'}` : 'Kode (belum dipakai) dicabut.');
    break;
  }
  default:
    pakai();
}
process.exit(0);
