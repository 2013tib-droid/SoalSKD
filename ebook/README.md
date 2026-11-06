# Ebook PDF

Membuat ebook PDF A4 dari satu paket soal (`bank/<id>.json`, skema 1).

```bash
cd ebook && npm install && cd ..          # sekali saja
node ebook/buat-ebook.mjs bank/p01.json   # hasil: ebook/dist/p01.pdf
```

Opsi: `--keluar <file.pdf>` untuk menentukan lokasi hasil, `--html` untuk ikut menyimpan
HTML-nya (berguna saat mengatur tampilan). Hasil di `ebook/dist/` tidak di-commit.

## Isi PDF

1. Sampul: judul paket, jumlah soal per subtes, versi, dan tanggal. Paket yang `meta.status`-nya
   bukan `final` diberi lencana "belum siap terbit", dan statusnya ikut tercetak di kaki halaman.
2. Daftar isi dengan nomor halaman.
3. Petunjuk: catatan "cek aturan BKN/KemenPAN-RB terbaru", komposisi dan penilaian dari
   `config/skd.json`. Durasi dan ambang batas yang masih `null` ditulis "belum ditetapkan".
4. Soal per subtes (TWK, TIU, TKP), tanpa kunci.
5. Kunci jawaban: huruf untuk TWK/TIU, tabel bobot untuk TKP.
6. Pembahasan per soal: kunci atau bobot, `pembahasan.inti`, alasan per opsi, konsep, tips, rujukan.

Teks soal dirender sebagai Markdown GFM (tabel, daftar, tebal). HTML mentah ditampilkan apa adanya,
tidak dijalankan. Sesuai DESIGN.md tidak ada italic: `*teks*` dicetak sedikit lebih tebal.

## Validasi

Skrip menjalankan `python3 tools/validasi.py <file>` lebih dulu. Kalau ada galat, PDF tidak dibuat
dan skrip keluar dengan kode 1. Peringatan, misalnya paket belum penuh, hanya dihitung di ringkasan.

## Alat yang dipakai dan alasannya

- **Paged.js** (`pagedjs`) untuk tata letak cetak: ukuran A4, kepala dan kaki halaman, nomor halaman,
  dan nomor halaman di daftar isi (`target-counter`). Chromium sendiri tidak mendukung fitur
  CSS Paged Media ini.
- **Chromium lewat Playwright** untuk mencetak ke PDF. Keduanya sudah terpasang di environment sesi,
  jadi tidak dicantumkan di `package.json`. Kalau dijalankan di mesin lain, pasang dulu dengan
  `npm i -g playwright && npx playwright install chromium`.
- **marked** untuk Markdown GFM.
- **WeasyPrint** sebenarnya lebih cocok untuk cetak, tetapi tidak bisa dipasang di sesi ini
  (pip tidak bisa mengambil paket), jadi tidak dipakai.

## Font

`fonts/` berisi Geist dan Geist Mono (lisensi SIL OFL, lihat `fonts/OFL.txt`), diambil dari paket npm
`geist`. Geist tidak punya glyph `∧ ∨ ≡ ✓ ✗`, jadi karakter itu memakai **DejaVu Sans** dari sistem.
Kalau DejaVu tidak ada, browser memakai font sans-serif lain.

## File

| File | Isi |
|---|---|
| `buat-ebook.mjs` | Validasi, susun HTML, lalu cetak PDF |
| `gaya.css` | Gaya cetak (token warna dari DESIGN.md, A4) |
| `fonts/` | Geist dan Geist Mono (woff2) |
