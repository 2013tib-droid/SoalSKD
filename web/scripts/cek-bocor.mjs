#!/usr/bin/env node
// Gagal bila soal paket BERBAYAR ikut ke berkas yang bisa diunduh browser:
// `out/` (build statis GitHub Pages) dan `.next/static` (bundel client build server).
//
//   node scripts/cek-bocor.mjs [folder ...]       (bawaan: out .next/static yang ada)
//
// Yang dicari: id soal berbayar (mis. "p02-001"), potongan teks soal, potongan
// pembahasan, dan SVG gambar berbayar. Sumber pembanding: bank/*.json di repo,
// BANK_PRIVAT_DIR (bila diisi), dan repo privat ../SoalSKD-bank (bila ada). Tanpa
// salinan bank, pola id soal (p02-001 dst.) tetap diperiksa. Paket gratis = PAKET_TERBUKA di src/config/akses.ts.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const WEB = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const ROOT = path.resolve(WEB, '..');
const akses = readFileSync(path.join(WEB, 'src/config/akses.ts'), 'utf8');
const gratis = new Set([...akses.match(/PAKET_TERBUKA\s*=\s*\[([^\]]*)\]/)[1].matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1]));

const sumber = [path.join(ROOT, 'bank'), process.env.BANK_PRIVAT_DIR, path.join(ROOT, '..', 'SoalSKD-bank')].filter((d) => d && existsSync(d));
const jarum = new Map(); // teks → keterangan
const idBerbayar = new Set();
for (const d of sumber) {
  for (const f of readdirSync(d).filter((n) => /^p\d+\.json$/.test(n))) {
    const data = JSON.parse(readFileSync(path.join(d, f), 'utf8'));
    if (data.skema !== 1 || gratis.has(data.meta.id)) continue;
    idBerbayar.add(data.meta.id);
    for (const s of data.soal) {
      jarum.set(s.id, `id soal ${s.id}`);
      const teks = String(s.pertanyaan).replace(/\s+/g, ' ').trim();
      if (teks.length >= 40) jarum.set(teks.slice(0, 60), `teks soal ${s.id}`);
      const inti = String(s.pembahasan?.inti ?? '').replace(/\s+/g, ' ').trim();
      if (inti.length >= 40) jarum.set(inti.slice(0, 60), `pembahasan ${s.id}`);
      for (const g of s.gambar ?? []) {
        const svg = path.join(d, g.file);
        if (existsSync(svg)) jarum.set(readFileSync(svg).toString('base64').slice(0, 80), `gambar ${g.file}`);
      }
    }
  }
}
// Juga tanpa salinan bank: pola id soal untuk semua paket non-gratis (p02-001 dst).
const polaId = /\bp(\d{2})-\d{3}\b/g;

const target = (process.argv.slice(2).length ? process.argv.slice(2) : ['out', '.next/static'])
  .map((t) => path.resolve(WEB, t))
  .filter((t) => existsSync(t));
if (target.length === 0) {
  console.error('Tidak ada folder build untuk diperiksa (out/ atau .next/static). Jalankan build dulu.');
  process.exit(1);
}

function* berkas(dir) {
  for (const n of readdirSync(dir)) {
    const p = path.join(dir, n);
    if (statSync(p).isDirectory()) yield* berkas(p);
    else if (/\.(html|js|json|txt|rsc|css|svg|map)$/.test(n)) yield p;
  }
}

const temuan = [];
let diperiksa = 0;
for (const t of target) {
  for (const f of berkas(t)) {
    diperiksa++;
    const isi = readFileSync(f, 'utf8');
    for (const m of isi.matchAll(polaId)) {
      if (!gratis.has(`p${m[1]}`)) temuan.push(`${path.relative(WEB, f)}: id soal ${m[0]}`);
    }
    for (const [j, ket] of jarum) if (isi.includes(j)) temuan.push(`${path.relative(WEB, f)}: ${ket}`);
  }
}

const unik = [...new Set(temuan)];
if (unik.length) {
  console.error(`BOCOR: ${unik.length} temuan soal berbayar di berkas publik:`);
  for (const x of unik.slice(0, 30)) console.error(`  ${x}`);
  process.exit(1);
}
console.log(`Aman: ${diperiksa} berkas di ${target.map((t) => path.relative(WEB, t)).join(', ')} tanpa soal berbayar (${idBerbayar.size} paket berbayar dibandingkan: ${[...idBerbayar].join(', ') || '-'}).`);
