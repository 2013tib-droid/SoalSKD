// Tes unit tanpa emulator: pemetaan nama produk Mayar dan hak ebook per edisi.
// Jalankan: cd functions && npm run build && node test/produk.mjs
import { createRequire } from 'node:module';

const require = createRequire(new URL('../package.json', import.meta.url));
const { produkDariNama, punyaEdisi, isEdisi, PRODUK, EBOOK } = require('./lib/produk.js');

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

console.log('Nama produk Mayar → produk');
const harap = [
  // Bundel 1
  ['Bundel 3 Try Out SKD', 'bundel-3to'],
  ['SoalSKD Bundel 1: 3 Try Out SKD + Ebook', 'bundel-3to'],
  ['Bundle 3 Try Out SKD + Ebook Edisi 1', 'bundel-3to'],
  ['Bundel Pertama: Tiga Try Out SKD (p02-p04)', 'bundel-3to'],
  ['bundel-3to', 'bundel-3to'],
  // Bundel 2: tidak boleh pernah terbaca sebagai bundel-3to
  ['SoalSKD Bundel 2: 3 Try Out SKD + Ebook', 'bundel-3to-2'],
  ['Bundel 2 - 3 Try Out SKD', 'bundel-3to-2'],
  ['Bundel 3 Try Out SKD Edisi II', 'bundel-3to-2'],
  ['Bundel 3 Try Out SKD Edisi 2', 'bundel-3to-2'],
  ['Bundel Kedua: 3 Try Out SKD', 'bundel-3to-2'],
  ['Bundel 3 Try Out SKD (p05-p07)', 'bundel-3to-2'],
  ['Bundle 3 TO SKD jilid dua', 'bundel-3to-2'],
  ['BUNDEL-3TO-2', 'bundel-3to-2'],
  // Ambigu atau bukan bundel → null (ditangani manual)
  ['Bundel 5 Try Out', null],
  ['Bundel 1 dan 2: 6 Try Out SKD', null],
  ['Bundel 1 + Bundel 2: 3 Try Out SKD', null],
  ['Bundel 2 Try Out SKD', null],
  ['Bundel Try Out SKD', null],
  ['Bundel 3 Try Out SKD (p02-p07)', null],
  ['Ebook Saja', null],
  ['3 Try Out SKD Edisi 2', null],
  ['Bundel 3 Try Out SKD Rp9.900', null],
  ['', null],
];
for (const [nama, produk] of harap) {
  const hasil = produkDariNama(nama);
  cek(`"${nama}" → ${produk}`, hasil === produk, hasil);
}
for (const [nama, produk] of harap) {
  if (produk === 'bundel-3to-2') {
    cek(`"${nama}" tidak pernah Bundel 1`, produkDariNama(nama) !== 'bundel-3to');
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

console.log(`\n${lulus} lulus, ${gagal.length} gagal`);
if (gagal.length) {
  console.log('Gagal:', gagal.join('; '));
  process.exit(1);
}
