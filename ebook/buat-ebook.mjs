#!/usr/bin/env node
// Buat ebook PDF dari satu paket soal (bank/<id>.json, skema 1).
//
//   node ebook/buat-ebook.mjs bank/p01.json            -> ebook/dist/p01.pdf
//   node ebook/buat-ebook.mjs bank/p01.json --html     -> juga simpan HTML-nya
//   node ebook/buat-ebook.mjs bank/p01.json --keluar x.pdf
//
// Paket yang gagal `python3 tools/validasi.py` ditolak.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Marked } from "marked";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, "..");
const HURUF = ["A", "B", "C", "D", "E"];

// ---------- argumen ----------
const args = process.argv.slice(2);
const fileArg = args.find((a) => !a.startsWith("--"));
if (!fileArg) {
  console.error("pakai: node ebook/buat-ebook.mjs bank/<paket>.json [--html] [--keluar <file.pdf>]");
  process.exit(2);
}
const sumber = path.resolve(fileArg);
const iKeluar = args.indexOf("--keluar");
const simpanHtml = args.includes("--html");

// ---------- 1. validasi ----------
const val = spawnSync("python3", ["tools/validasi.py", sumber], { cwd: ROOT, encoding: "utf8" });
if (val.error || val.status !== 0) {
  process.stderr.write(val.stdout ?? "");
  process.stderr.write(val.stderr ?? "");
  console.error(`\nDitolak: ${path.relative(ROOT, sumber)} gagal tools/validasi.py. Perbaiki datanya dulu.`);
  process.exit(1);
}
const peringatan = (val.stdout.match(/^PERINGATAN.*$/gm) ?? []).length;

const paket = JSON.parse(readFileSync(sumber, "utf8"));
const config = JSON.parse(readFileSync(path.join(ROOT, "config", "skd.json"), "utf8"));
const meta = paket.meta;
const keluar = iKeluar >= 0 ? path.resolve(args[iKeluar + 1]) : path.join(DIR, "dist", `${meta.id}.pdf`);

// ---------- Markdown GFM ----------
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const marked = new Marked({ gfm: true, breaks: true });
marked.use({ renderer: { html: (t) => esc(t.text) } }); // HTML mentah tidak diizinkan: tampilkan apa adanya
const md = (s) => marked.parse(s ?? "");
const mdRingkas = (s) => {
  const html = md(s).trim();
  const m = html.match(/^<p>([\s\S]*)<\/p>$/);
  return m && !m[1].includes("<p>") ? m[1] : html;
};

// ---------- data ----------
const subtesCfg = Object.fromEntries(config.subtes.map((s) => [s.kode, s]));
const urutan = config.urutan_soal.filter((k) => paket.soal.some((s) => s.kategori === k));
const perSubtes = Object.fromEntries(urutan.map((k) => [k, paket.soal.filter((s) => s.kategori === k)]));
const draf = meta.status !== "final";
const tanggal = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
const bankUrl = pathToFileURL(path.join(ROOT, "bank") + path.sep).href;

const gambar = (s) =>
  (s.gambar ?? [])
    .map((g) => `<figure><img src="${esc(new URL(g.file, bankUrl).href)}" alt="${esc(g.alt)}"></figure>`)
    .join("");

const nomor = (s) => `<span class="nomor">${s.nomor}</span>`;

// ---------- bagian ----------
function sampul() {
  const jumlah = urutan.map((k) => `${k} ${perSubtes[k].length}`).join(" · ");
  return `
<section class="sampul">
  <div class="sampul-atas">SoalSKD</div>
  <div class="sampul-tengah">
    <p class="sampul-label">Tryout SKD CPNS</p>
    <h1 class="sampul-judul">${esc(meta.judul)}</h1>
    <p class="sampul-sub">${paket.soal.length} soal · ${jumlah}</p>
    <p class="sampul-sub">Lengkap dengan kunci, bobot TKP, dan pembahasan per opsi</p>
  </div>
  <div class="sampul-bawah">
    ${draf ? `<p class="lencana-draf">Status: ${esc(meta.status)} · belum siap terbit</p>` : ""}
    <p>Versi ${meta.versi} · ${tanggal(meta.diperbarui ?? meta.dibuat)}</p>
    <p>Soal disusun orisinal. Cek aturan BKN/KemenPAN-RB terbaru.</p>
  </div>
</section>`;
}

function daftarIsi() {
  const item = (href, teks, sub = false) =>
    `<li class="${sub ? "sub" : ""}"><a href="#${href}">${esc(teks)}</a></li>`;
  return `
<nav class="daftar-isi bab" id="daftar-isi">
  <h1><span class="judul-bab">Daftar isi</span></h1>
  <ol>
    ${item("petunjuk", "Petunjuk dan aturan penilaian")}
    ${item("soal", "Soal")}
    ${urutan.map((k) => item(`soal-${k}`, `${k} · ${subtesCfg[k].nama}`, true)).join("")}
    ${item("kunci", "Kunci jawaban")}
    ${item("pembahasan", "Pembahasan")}
    ${urutan.map((k) => item(`bahas-${k}`, `${k} · ${subtesCfg[k].nama}`, true)).join("")}
  </ol>
</nav>`;
}

function petunjuk() {
  const baris = urutan
    .map((k) => {
      const c = subtesCfg[k];
      const nilai =
        c.penilaian === "bobot"
          ? `Setiap opsi berbobot ${c.nilai_bobot[0]}–${c.nilai_bobot[1]}, tidak ada nilai 0`
          : `Benar ${c.nilai_benar}, salah atau kosong ${c.nilai_salah}`;
      const ambang = c.ambang_batas ?? "Belum ditetapkan";
      return `<tr><td><b>${k}</b> · ${esc(c.nama)}</td><td class="angka">${perSubtes[k].length}</td><td class="angka">${c.jumlah_soal}</td><td>${nilai}</td><td>${ambang}</td></tr>`;
    })
    .join("");
  const penuh = paket.soal.length === config.subtes.reduce((n, s) => n + s.jumlah_soal, 0);
  return `
<section class="bab" id="petunjuk">
  <h1><span class="judul-bab">Petunjuk dan aturan penilaian</span></h1>
  <div class="catatan-penting">
    <p><b>Cek aturan BKN/KemenPAN-RB terbaru.</b> Jumlah soal, durasi, dan ambang batas (passing grade) bisa berubah setiap tahun.
    Cocokkan dengan pengumuman resmi seleksi yang kamu ikuti, jangan hanya berpegang pada buku ini.</p>
  </div>
  <h2>Komposisi dan penilaian</h2>
  <table class="tabel">
    <thead><tr><th>Subtes</th><th class="angka">Di paket ini</th><th class="angka">Standar</th><th>Penilaian</th><th>Ambang batas</th></tr></thead>
    <tbody>${baris}</tbody>
  </table>
  <p class="kecil">Durasi: ${config.durasi_menit ? `${config.durasi_menit} menit` : "belum ditetapkan, lihat pengumuman resmi"}.
  Nilai maksimum total untuk paket penuh: ${config.nilai_maks_total}.
  ${penuh ? "" : `<b>Paket ini belum penuh</b> (${paket.soal.length} dari ${config.subtes.reduce((n, s) => n + s.jumlah_soal, 0)} soal), jadi skornya belum bisa dibandingkan dengan ambang batas.`}</p>
  <h2>Cara memakai buku ini</h2>
  <ol>
    <li>Kerjakan soal secara berurutan seperti di ujian: TWK, TIU, lalu TKP. Pakai pengatur waktu.</li>
    <li>Catat jawabanmu di kertas terpisah. Jangan buka kunci sebelum selesai.</li>
    <li>Cocokkan dengan <a href="#kunci">kunci jawaban</a>. Untuk TKP, jumlahkan bobot opsi yang kamu pilih.</li>
    <li>Baca <a href="#pembahasan">pembahasan</a>, termasuk soal yang kamu jawab benar. Alasan per opsi menjelaskan jebakan yang sering muncul.</li>
  </ol>
</section>`;
}

function blokSoal(s) {
  const opsi = HURUF.map(
    (h) => `<li><span class="huruf">${h}</span><div class="teks-opsi">${mdRingkas(s.opsi[h])}</div></li>`,
  ).join("");
  return `
<article class="soal" id="soal-${esc(s.id)}">
  <div class="soal-kepala">${nomor(s)}</div>
  <div class="soal-isi">
    <div class="pertanyaan">${md(s.pertanyaan)}</div>
    ${gambar(s)}
    <ol class="opsi">${opsi}</ol>
  </div>
</article>`;
}

function bagianSoal() {
  return `
<section class="bab" id="soal">
  ${urutan
    .map(
      (k, i) => `
  <div class="subtes ${i ? "halaman-baru" : ""}" id="soal-${k}">
    <h1><span class="judul-bab">Soal ${k}</span> <span class="h1-sub">${esc(subtesCfg[k].nama)} · ${perSubtes[k].length} soal</span></h1>
    ${perSubtes[k].map(blokSoal).join("")}
  </div>`,
    )
    .join("")}
</section>`;
}

function bagianKunci() {
  const tabel = (k) => {
    const daftar = perSubtes[k];
    if (subtesCfg[k].penilaian === "bobot") {
      const rows = daftar
        .map(
          (s) =>
            `<tr><td class="angka">${s.nomor}</td>${HURUF.map((h) => `<td class="angka ${s.bobot[h] === 5 ? "tertinggi" : ""}">${s.bobot[h]}</td>`).join("")}</tr>`,
        )
        .join("");
      return `<table class="tabel tabel-kunci"><thead><tr><th class="angka">No.</th>${HURUF.map((h) => `<th class="angka">${h}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table>`;
    }
    return `<div class="grid-kunci">${daftar
      .map((s) => `<div><span class="angka">${s.nomor}</span><b>${s.kunci}</b></div>`)
      .join("")}</div>`;
  };
  return `
<section class="bab" id="kunci">
  <h1><span class="judul-bab">Kunci jawaban</span></h1>
  ${urutan
    .map(
      (k) =>
        `<h2>${k} · ${esc(subtesCfg[k].nama)}</h2>${subtesCfg[k].penilaian === "bobot" ? `<p class="kecil">Bobot per opsi. Bobot 5 ditebalkan.</p>` : ""}${tabel(k)}`,
    )
    .join("")}
</section>`;
}

function blokPembahasan(s) {
  const tkp = s.kategori === "TKP";
  const pb = s.pembahasan;
  const jawaban = tkp
    ? `<table class="tabel tabel-bobot"><tr>${HURUF.map((h) => `<th class="angka">${h}</th>`).join("")}</tr><tr>${HURUF.map((h) => `<td class="angka ${s.bobot[h] === 5 ? "tertinggi" : ""}">${s.bobot[h]}</td>`).join("")}</tr></table>`
    : `<p class="kunci">Kunci: <b>${s.kunci}</b></p>`;
  // TWK/TIU: kunci sering tidak punya penjelasan sendiri karena alasannya ada di pembahasan inti
  const alasan = HURUF.filter((h) => pb.opsi?.[h] || (!tkp && h === s.kunci))
    .map((h) => {
      const label = tkp ? `bobot ${s.bobot[h]}` : h === s.kunci ? "kunci" : "";
      const teks = pb.opsi?.[h] ? mdRingkas(pb.opsi[h]) : "Jawaban benar. Alasannya ada di pembahasan di atas.";
      return `<li><span class="huruf ${!tkp && h === s.kunci ? "huruf-kunci" : ""}">${h}</span><div>${label ? `<span class="label">${label}</span> ` : ""}${teks}</div></li>`;
    })
    .join("");
  return `
<article class="bahas" id="bahas-${esc(s.id)}">
  <header class="bahas-kepala">
    ${nomor(s)}
    <div>
      <p class="bahas-topik">${esc(s.subtopik)} · ${esc(s.topik)}</p>
      <p class="kecil">Tingkat ${esc(s.tingkat)} · ${esc(s.id)}</p>
    </div>
  </header>
  ${jawaban}
  <h3>Pembahasan</h3>
  <div>${md(pb.inti)}</div>
  ${alasan ? `<h3>Alasan per opsi</h3><ol class="opsi opsi-alasan">${alasan}</ol>` : ""}
  ${pb.konsep ? `<div class="kotak"><h3>Konsep</h3>${md(pb.konsep)}</div>` : ""}
  <div class="kotak kotak-tips"><h3>Tips</h3>${md(s.tips)}</div>
  ${s.rujukan?.length ? `<p class="kecil rujukan"><b>Rujukan:</b> ${s.rujukan.map(esc).join("; ")}</p>` : ""}
</article>`;
}

function bagianPembahasan() {
  return `
<section class="bab" id="pembahasan">
  ${urutan
    .map(
      (k, i) => `
  <div class="subtes ${i ? "halaman-baru" : ""}" id="bahas-${k}">
    <h1><span class="judul-bab">Pembahasan ${k}</span> <span class="h1-sub">${esc(subtesCfg[k].nama)}</span></h1>
    ${perSubtes[k].map(blokPembahasan).join("")}
  </div>`,
    )
    .join("")}
</section>`;
}

// ---------- rakit ----------
const polyfill = pathToFileURL(path.join(DIR, "node_modules", "pagedjs", "dist", "paged.polyfill.js")).href;
if (!existsSync(fileURLToPath(polyfill))) {
  console.error("Paged.js belum terpasang. Jalankan: cd ebook && npm install");
  process.exit(1);
}
// CSS disisipkan: Paged.js membaca <link> lewat XHR, yang diblokir di file://
const gaya = readFileSync(path.join(DIR, "gaya.css"), "utf8").replace(
  /url\("fonts\/([^"]+)"\)/g,
  (_, f) => `url("${pathToFileURL(path.join(DIR, "fonts", f)).href}")`,
);
const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<title>${esc(`SoalSKD · ${meta.judul}`)}</title>
<style>${gaya}</style>
<style>@page { @bottom-left { content: ${JSON.stringify(`SoalSKD · ${meta.judul}${draf ? ` · ${meta.status}` : ""}`)}; } }</style>
<script>window.PagedConfig = { auto: true, after: () => { window.__selesai = true; } };</script>
<script src="${polyfill}"></script>
</head>
<body>
${sampul()}
${daftarIsi()}
${petunjuk()}
${bagianSoal()}
${bagianKunci()}
${bagianPembahasan()}
</body>
</html>`;

mkdirSync(path.dirname(keluar), { recursive: true });
const htmlPath = keluar.replace(/\.pdf$/i, "") + ".html";
writeFileSync(htmlPath, html);

// ---------- PDF ----------
const { chromium } = createRequire(import.meta.url)("playwright");
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const galat = [];
  page.on("pageerror", (e) => galat.push(e.message));
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "load" });
  const batas = Date.now() + 180_000;
  while (!(await page.evaluate(() => window.__selesai === true))) {
    if (galat.length) throw new Error(`Galat saat tata letak: ${galat.join("; ")}`);
    if (Date.now() > batas) throw new Error("Tata letak Paged.js tidak selesai dalam 180 detik");
    await new Promise((r) => setTimeout(r, 250));
  }
  const halaman = await page.evaluate(() => document.querySelectorAll(".pagedjs_page").length);
  await page.pdf({ path: keluar, preferCSSPageSize: true, printBackground: true });
  console.log(
    `✓ ${path.relative(ROOT, keluar)} · ${halaman} halaman · ${paket.soal.length} soal` +
      (peringatan ? ` · ${peringatan} peringatan validator` : ""),
  );
} finally {
  await browser.close();
  if (!simpanHtml) rmSync(htmlPath, { force: true });
}
