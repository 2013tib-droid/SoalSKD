// Tes unit tanpa emulator: hak ebook per edisi, harga produk, dan keputusan
// verifikasi pembayaran Mayar (modul murni src/pembayaran.ts).
// Jalankan: cd functions && npm run build && node test/produk.mjs
import { createRequire } from 'node:module';

const require = createRequire(new URL('../package.json', import.meta.url));
const { punyaEdisi, isEdisi, paketDariProduk, PRODUK, EBOOK } = require('./lib/produk.js');
const { nilaiTransaksi, nilaiPermintaanBayar, statusBerikut, refDariWebhook, statusWebhook, idAman, samarkanEmail } = require('./lib/pembayaran.js');

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

console.log('Hak ebook per edisi');
cek('edisi dikenal', isEdisi('edisi-1') && isEdisi('edisi-2') && !isEdisi('edisi-3') && !isEdisi(2) && !isEdisi('__proto__'));
cek('edisi-1 dibuka p02–p04', ['p02', 'p03', 'p04'].every((p) => punyaEdisi([p], 'edisi-1')));
cek('edisi-2 dibuka p05–p07', ['p05', 'p06', 'p07'].every((p) => punyaEdisi([p], 'edisi-2')));
cek('Bundel 1 saja tidak membuka edisi-2', !punyaEdisi(['p02', 'p03', 'p04'], 'edisi-2'));
cek('Bundel 2 saja tidak membuka edisi-1', !punyaEdisi(['p05', 'p06', 'p07'], 'edisi-1'));
cek('paket gratis p01 tidak membuka ebook', !punyaEdisi(['p01'], 'edisi-1') && !punyaEdisi(['p01'], 'edisi-2'));
cek('pemilik dua bundel membuka keduanya', punyaEdisi(['p02', 'p05'], 'edisi-1') && punyaEdisi(['p02', 'p05'], 'edisi-2'));
cek('data rusak ditolak', !punyaEdisi('p02', 'edisi-1') && !punyaEdisi(null, 'edisi-1') && !punyaEdisi([2], 'edisi-1'));
cek('nama unduhan per edisi', EBOOK['edisi-1'].namaFile === 'SoalSKD-Edisi-1.pdf' && EBOOK['edisi-2'].namaFile === 'SoalSKD-Edisi-2.pdf');
cek('path Storage per edisi', EBOOK['edisi-1'].path === 'ebook/edisi-1.pdf' && EBOOK['edisi-2'].path === 'ebook/edisi-2.pdf');
cek('paket bundel tidak tumpang tindih', !PRODUK['bundel-3to'].paket.some((p) => PRODUK['bundel-3to-2'].paket.includes(p)));

console.log('Produk dan harga');
cek('harga bilangan bulat rupiah', Object.values(PRODUK).every((p) => Number.isInteger(p.harga) && p.harga > 0));
cek('harga perkenalan Rp9.900', PRODUK['bundel-3to'].harga === 9900 && PRODUK['bundel-3to-2'].harga === 9900);
cek('paketDariProduk gabung tanpa dobel', JSON.stringify(paketDariProduk(['bundel-3to', 'bundel-3to', 'x'])) === '["p02","p03","p04"]');

console.log('Verifikasi transaksi Mayar');
const pesanan = { orderId: 'ord_abc12345', mayarTransactionId: 'trx-1', mayarPaymentId: 'pay-1', amount: 9900 };
const trx = (x = {}) => ({
  id: 'trx-1', status: 'paid', amount: 9900, extraData: { orderId: 'ord_abc12345' },
  paymentLink: { id: 'pay-1', amount: 9900 }, customer: { email: 'Budi@Contoh.Test' }, ...x,
});
const v = (x) => nilaiTransaksi(pesanan, x);
cek('lunas + semua cocok → lunas, email dinormalkan', v(trx()).jenis === 'lunas' && v(trx()).emailPembayar === 'budi@contoh.test');
cek('status "PAID" huruf besar tetap lunas', v(trx({ status: 'PAID' })).jenis === 'lunas');
cek('extraData null (seperti contoh docs) tetap lunas', v(trx({ extraData: null })).jenis === 'lunas');
cek('tanpa paymentLink tetap lunas (id transaksi sudah mengikat)', v(trx({ paymentLink: undefined })).jenis === 'lunas');
cek('status Boolean true → tidak-diketahui (bukan lunas)', v(trx({ status: true })).jenis === 'tidak-diketahui');
cek('status Boolean false → tidak-diketahui', v(trx({ status: false })).jenis === 'tidak-diketahui');
cek('status unpaid → menunggu', v(trx({ status: 'unpaid' })).jenis === 'menunggu');
cek('status created → menunggu', v(trx({ status: 'created' })).jenis === 'menunggu');
cek('status expired → kedaluwarsa', v(trx({ status: 'expired' })).jenis === 'kedaluwarsa');
cek('status asing (refunded) → tidak-diketahui', v(trx({ status: 'refunded' })).jenis === 'tidak-diketahui');
cek('nominal kurang → tidak-cocok nominal', v(trx({ amount: 990 })).alasan === 'nominal');
cek('nominal lebih → tidak-cocok nominal', v(trx({ amount: 99000 })).alasan === 'nominal');
cek('nominal teks "9900" → tidak-cocok', v(trx({ amount: '9900' })).jenis === 'tidak-cocok');
cek('mata uang USD → tidak-cocok', v(trx({ currency: 'USD' })).alasan === 'mata-uang');
cek('mata uang IDR → lunas', v(trx({ currency: 'IDR' })).jenis === 'lunas');
cek('paymentLink lain (produk tidak sesuai) → tidak-cocok', v(trx({ paymentLink: { id: 'pay-lain' } })).alasan === 'produk');
cek('extraData.orderId lain → tidak-cocok', v(trx({ extraData: { orderId: 'ord_lain' } })).alasan === 'order-id');
cek('id transaksi lain (transaksi palsu) → tidak-cocok', v(trx({ id: 'trx-palsu' })).alasan === 'id-transaksi');
cek('respons kosong → tidak-diketahui', v(null).jenis === 'tidak-diketahui' && v('x').jenis === 'tidak-diketahui');
cek('belum lunas tidak pernah memeriksa nominal', v(trx({ status: 'unpaid', amount: 1 })).jenis === 'menunggu');

console.log('Cadangan status permintaan bayar (transaksi 404)');
cek('permintaan unpaid → menunggu', nilaiPermintaanBayar({ status: 'unpaid' }).jenis === 'menunggu');
cek('permintaan expired/closed → kedaluwarsa', nilaiPermintaanBayar({ status: 'expired' }).jenis === 'kedaluwarsa' && nilaiPermintaanBayar({ status: 'closed' }).jenis === 'kedaluwarsa');
cek('permintaan "paid" tanpa detail transaksi → TIDAK lunas', nilaiPermintaanBayar({ status: 'paid' }).jenis === 'tidak-diketahui');
cek('permintaan rusak → tidak-diketahui', nilaiPermintaanBayar(null).jenis === 'tidak-diketahui');

console.log('Transisi status pesanan');
const lunas = { jenis: 'lunas', emailPembayar: null };
cek('menunggu + lunas → aktif + beri akses', JSON.stringify(statusBerikut('menunggu', lunas, false)) === '{"status":"aktif","berikanAkses":true}');
cek('kedaluwarsa + lunas (bayar terlambat) → aktif', statusBerikut('kedaluwarsa', lunas, true).status === 'aktif');
cek('aktif + lunas lagi → tetap aktif tanpa beri ulang', statusBerikut('aktif', lunas, false).berikanAkses === false);
cek('aktif + kedaluwarsa (webhook tidak berurutan) → tetap aktif', statusBerikut('aktif', { jenis: 'kedaluwarsa' }, true).status === 'aktif');
cek('dicabut + lunas → tetap dicabut', statusBerikut('dicabut', lunas, false).status === 'dicabut');
cek('gagal + lunas → tetap gagal (tinjau manual)', statusBerikut('gagal', lunas, false).status === 'gagal');
cek('menunggu + tidak-cocok → gagal', statusBerikut('menunggu', { jenis: 'tidak-cocok', alasan: 'nominal' }, false).status === 'gagal');
cek('menunggu + menunggu lewat waktu → kedaluwarsa', statusBerikut('menunggu', { jenis: 'menunggu' }, true).status === 'kedaluwarsa');
cek('menunggu + tidak-diketahui → tetap menunggu', statusBerikut('menunggu', { jenis: 'tidak-diketahui', alasan: 'x' }, true).status === 'menunggu');

console.log('Isi webhook');
cek('ref dari transactionId, id, productId', JSON.stringify(refDariWebhook({ transactionId: 't1', id: 't1', productId: 'p1' })) === '["t1","p1"]');
cek('ref berbahaya dibuang', refDariWebhook({ id: '../orders/x', productId: 'a/b', transactionId: 'x'.repeat(101) }).length === 0);
cek('data bukan objek → tanpa ref', refDariWebhook(null).length === 0 && refDariWebhook('x').length === 0);
cek('status webhook Boolean false → bukan-sukses', statusWebhook(false) === 'bukan-sukses');
cek('status webhook true / "SUCCESS" → sukses', statusWebhook(true) === 'sukses' && statusWebhook('success') === 'sukses');
cek('status webhook "PENDING" → bukan-sukses', statusWebhook('PENDING') === 'bukan-sukses');
cek('idAman', idAman(' abc_D-1 ') === 'abc_D-1' && idAman('a b') === null && idAman(5) === null);
cek('samarkanEmail', samarkanEmail('budi.santoso@gmail.com') === 'bu***@gmail.com' && samarkanEmail(null) === null);

console.log(`\n${lulus} lulus, ${gagal.length} gagal`);
if (gagal.length) {
  console.log('Gagal:', gagal.join('; '));
  process.exit(1);
}
