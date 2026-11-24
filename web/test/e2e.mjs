// E2E di browser (Playwright, Chromium) pada build STATIS `out/` (sama dengan GitHub Pages dev):
// navigasi soal, timer + peringatan, simpan otomatis, skor + pembahasan, paket berbayar terkunci,
// halaman beli/akun. Jalankan dari web/: STATIK=1 npm run build && npm run uji:e2e
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../out');
if (!existsSync(path.join(OUT, 'index.html'))) {
  console.error('out/ belum ada. Jalankan: STATIK=1 npm run build');
  process.exit(1);
}

const TIPE = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.woff2': 'font/woff2' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let f = path.join(OUT, p);
  if (!f.startsWith(OUT)) return res.writeHead(403).end();
  if (existsSync(f) && statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!existsSync(f)) return res.writeHead(404).end('404');
  res.writeHead(200, { 'content-type': TIPE[path.extname(f)] ?? 'application/octet-stream' });
  createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(4321, '127.0.0.1', r));
const URL_ = 'http://127.0.0.1:4321';

let lulus = 0;
const gagal = [];
function cek(nama, kondisi, info) {
  if (kondisi) { lulus++; console.log(`  ok   ${nama}`); }
  else { gagal.push(nama); console.log(`  GAGAL ${nama}`, info ?? ''); }
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const galatHalaman = [];
page.on('pageerror', (e) => galatHalaman.push(e.message));

console.log('Landing dan pembelian');
await page.goto(`${URL_}/`);
cek('landing tampil', await page.getByRole('heading', { level: 1 }).isVisible());
cek('tombol beli nonaktif selama penjualan belum dibuka', (await page.getByText('Pembelian segera dibuka').count()) >= 1);
cek('landing tidak menjanjikan kode lewat email', !(await page.content()).includes('Kode aktivasi dikirim ke emailmu'));
await page.goto(`${URL_}/beli/?produk=bundel-3to`);
cek('/beli: pembelian belum dibuka', await page.getByText('Pembelian bundel ini belum dibuka.').isVisible());
await page.goto(`${URL_}/akun/`);
cek('/akun tanpa login: ajakan masuk dengan Google', await page.getByRole('button', { name: /Masuk dengan Google/ }).isVisible());
await page.getByRole('button', { name: /Masuk dengan Google/ }).click();
cek('/akun login mati: pesan jelas, bukan crash', await page.getByText(/Login sedang tidak bisa dipakai/).isVisible());
cek('/akun: bantuan pembelian tersedia', await page.getByRole('heading', { name: 'Bantuan pembelian' }).isVisible());

console.log('Paket berbayar terkunci');
await page.goto(`${URL_}/ujian/p02/`);
await page.waitForTimeout(500);
const isiP02 = await page.content();
cek('p02: tidak ada pilihan jawaban (soal tidak ditanam)', (await page.getByRole('radio').count()) === 0);
cek('p02: tidak ada id soal berbayar di halaman', !/p02-\d{3}/.test(isiP02));
await page.goto(`${URL_}/ujian/p02/hasil/`);
await page.waitForTimeout(500);
cek('p02 hasil: tanpa kunci', !/p02-\d{3}/.test(await page.content()));

console.log('Ujian p01: navigasi, ragu, simpan otomatis, timer');
await page.goto(`${URL_}/ujian/p01/`);
await page.evaluate(() => localStorage.clear());
await page.reload();
const timer = page.getByRole('timer');
await timer.waitFor();
cek('timer selalu terlihat', await timer.isVisible());
await page.waitForFunction(() => document.querySelector('[role=timer]')?.getAttribute('aria-label')?.startsWith('Sisa waktu'));
cek('timer berjalan dengan durasi 20 menit (paket mini)', /Sisa waktu 00:(19|20):\d\d/.test(await timer.getAttribute('aria-label')));
await page.getByRole('radio').first().click();
cek('memilih jawaban → radio tercentang', (await page.getByRole('radio', { checked: true }).count()) === 1);
await page.getByRole('button', { name: /Berikutnya/ }).click();
await page.getByRole('radio').nth(1).click();
await page.getByRole('button', { name: /Ragu-ragu/ }).click();
cek('tombol ragu-ragu aktif', (await page.getByRole('button', { name: /Ragu-ragu/ }).getAttribute('aria-pressed')) === 'true');
await page.getByRole('button', { name: 'Soal sebelumnya' }).click();
cek('kembali ke soal 1 dengan jawaban tetap', (await page.getByRole('radio', { checked: true }).count()) === 1);
const rek = await page.evaluate(() => JSON.parse(localStorage.getItem('soalskd:ujian:p01')));
cek('jawaban tersimpan otomatis di perangkat', Object.keys(rek.jawaban).length === 2 && Object.values(rek.ragu).filter(Boolean).length === 1, rek);
await page.reload();
await page.getByRole('timer').waitFor();
await page.waitForTimeout(300);
cek('setelah muat ulang jawaban tetap ada', (await page.getByRole('radio', { checked: true }).count()) === 1);

// Peringatan waktu: sisa 40 detik (di bawah ambang kritis 5% dari 20 menit = 60 detik).
await page.evaluate(() => {
  const r = JSON.parse(localStorage.getItem('soalskd:ujian:p01'));
  r.berakhirPada = Date.now() + 40_000;
  localStorage.setItem('soalskd:ujian:p01', JSON.stringify(r));
});
await page.reload();
await page.waitForFunction(() => document.querySelector('[role=timer]')?.className.includes('text-danger'));
cek('timer berubah ke status kritis saat hampir habis', (await page.getByRole('timer').getAttribute('class')).includes('text-danger'));

console.log('Kumpulkan, skor, dan pembahasan');
// HP: grid nomor dibuka dari topbar (bottom sheet), lalu Kumpulkan jawaban.
await page.getByRole('button', { name: 'Lihat semua nomor soal' }).click();
cek('grid nomor soal menampilkan status', await page.getByRole('dialog').getByLabel('Ringkasan status').isVisible());
await page.getByRole('dialog').getByRole('button', { name: /Kumpulkan jawaban/ }).click();
await page.getByRole('button', { name: /^Kumpulkan$/ }).click();
await page.waitForURL(/\/ujian\/p01\/hasil/);
await page.getByText('Total').first().waitFor();
cek('halaman hasil menampilkan skor total', await page.getByText('Total').first().isVisible());
const hasilHtml = await page.content();
cek('pembahasan tampil di hasil', /Pembahasan|pembahasan/.test(hasilHtml));
cek('filter status hasil tersedia', await page.getByRole('group', { name: 'Filter status' }).or(page.getByLabel('Filter status')).first().isVisible());

console.log('Waktu habis → dikumpulkan otomatis');
await page.goto(`${URL_}/ujian/p01/`);
await page.evaluate(() => {
  localStorage.setItem('soalskd:ujian:p01', JSON.stringify({ jawaban: {}, ragu: {}, indeks: 0, berakhirPada: Date.now() + 2000, selesai: false, disimpanPada: Date.now() }));
});
await page.reload();
await page.waitForURL(/\/ujian\/p01\/hasil/, { timeout: 15000 }).catch(() => undefined);
const rekHabis = await page.evaluate(() => JSON.parse(localStorage.getItem('soalskd:ujian:p01') ?? 'null'));
cek('timer habis → sesi selesai', rekHabis?.selesai === true || /hasil/.test(page.url()), { url: page.url(), rekHabis });

console.log('Halaman lain');
for (const [jalur, teks] of [['/try-out/', 'Try out'], ['/aktivasi/', 'Tukar kode'], ['/syarat/', 'Pembelian'], ['/privasi/', 'Mayar']]) {
  await page.goto(`${URL_}${jalur}`);
  cek(`${jalur} memuat "${teks}"`, (await page.content()).includes(teks));
}
cek('tanpa galat JavaScript di halaman', galatHalaman.length === 0, galatHalaman);

await browser.close();
server.close();
console.log(`\n${lulus} lulus, ${gagal.length} gagal`);
if (gagal.length) { console.log('Gagal:', gagal.join('; ')); process.exit(1); }
