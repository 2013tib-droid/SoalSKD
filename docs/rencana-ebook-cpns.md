# Rencana Produk: Ebook Bank Soal SKD CPNS

Catatan ini dibuat untuk melanjutkan pekerjaan di sesi baru. Baca file ini
dulu sebelum membuat soal atau ebook.

## Konteks

- Awalnya repo ini dibuat untuk USM PKN STAN. Fokusnya sekarang pindah ke
  **SKD CPNS**, karena pendaftaran CPNS sedang dibuka dan waktu ke ujian
  sekitar **satu bulan** (dicatat 6 November 2026).
- Pemilik repo sudah PNS. Produk ini **untuk dijual**, bukan untuk belajar
  sendiri.
- Paket contoh sudah ada: `bank/p01.json` (20 soal; arsip Markdown di `bank/premium-01.md`). Format dan
  kualitasnya menjadi standar acuan.

## Bentuk produk (usulan, belum final)

- **Versi 1:** ebook PDF berisi 3 paket tryout penuh (3 × 110 = 330 soal).
  Soal dan lembar jawaban di depan, kunci dan pembahasan di bagian akhir.
- **Versi 2:** tambah paket baru, lalu tryout interaktif sebagai bonus atau
  paket premium.
- **Pembeda dari produk lain:** kualitas pembahasan. Setiap soal menjelaskan
  alasan jawaban benar, kesalahan setiap opsi lain, konsep atau rumus, trik
  cepat, dan tips.
- **Strategi waktu:** minat beli paling tinggi dari masa pendaftaran sampai
  menjelang ujian. Terbitkan versi pertama cepat, lalu perbarui isinya.

## Alur kerja yang disarankan

1. Soal disimpan sebagai **data terstruktur (JSON)**, menjadi sumber utama.
   File Markdown dan PDF dibuat dari data ini.
2. Satu skrip membuat ebook PDF secara otomatis: sampul, daftar isi, soal,
   kunci, dan pembahasan.
3. Soal dibuat per paket, lalu **pemilik repo me-review** sebelum paket
   berikutnya dibuat, terutama bobot TKP.
4. Jika ada soal yang direvisi, data diperbaiki lalu PDF dibuat ulang.

## Standar soal (sesuai Paket 1)

- **Komposisi per paket SKD (110 soal):** TWK 30, TIU 35, TKP 45.
- **Distribusi kesulitan:** 20% mudah, 50% sedang, 30% sulit.
- **TWK dan TIU:** satu jawaban benar (nilai 5), salah atau kosong bernilai 0.
- **TKP:** setiap opsi bernilai 1–5 tanpa nilai 0. Nilai 5 dan 1 harus tegas.
- **Aspek TKP:** pelayanan publik, jejaring kerja, sosial budaya, TIK,
  profesionalisme, antiradikalisme.
- **Isi setiap soal:** nomor, kategori, sub materi, tingkat kesulitan, soal,
  opsi A–E, jawaban atau bobot, pembahasan minimal 150 kata (jawaban benar,
  kesalahan opsi lain, konsep, rumus, trik eliminasi), dan tips soal sejenis.
- **Distraktor** diambil dari kesalahan peserta yang umum, bukan dari opsi
  asal-asalan.
- Posisi kunci jawaban (A–E) disebar merata.
- **TIU figural dilewati** untuk sementara karena butuh gambar. Jika nanti
  diperlukan, buat gambarnya dengan SVG.
- Jangan mengulang topik yang sudah dipakai di `bank/sample-15.json` dan
  `bank/p01.json` (field `topik`).

## Catatan legal dan kualitas

- Jangan memakai logo atau nama BKN/Kemenpan RB sebagai branding. Cantumkan
  bahwa soal ini latihan orisinal, bukan soal resmi.
- Semua soal orisinal. Jangan menyalin soal asli BKN atau buku lain.
- Fakta dicek dari pengetahuan model tanpa sumber daring. **Sebelum terbit**,
  cocokkan kutipan pasal (UUD, UU Tipikor, UU ASN, UU Pelayanan Publik)
  dengan teks resminya.
- Jumlah soal, durasi, dan ambang batas tahun berjalan harus diambil dari
  pengumuman resmi.
- BKN tidak memublikasikan kunci bobot TKP, jadi bobot di produk ini adalah
  hasil penyusunan sendiri. Sebaiknya produk mencantumkan catatan ini juga.

## Keputusan (6 November 2026)

Pemilik menyerahkan keputusan ke model ("gas aja"):

1. **Nama:** tetap "SoalSKD", sama dengan aplikasi.
2. **Versi pertama:** 330 soal (3 paket penuh: p02, p03, p04). Paket 4 dan 5 menyusul
   sebagai pembaruan.
3. **Paket 1 (`bank/p01.json`)** diterima sebagai standar gaya, tingkat kesulitan, dan
   panjang pembahasan.
4. **Contoh ebook** sudah dibuat dengan `ebook/buat-ebook.mjs`.

## Langkah berikutnya

1. Ambil keputusan untuk poin 1–3 di atas.
2. ~~Ubah `bank/premium-01.md` menjadi data JSON.~~ Selesai: skema di
   `schema/paket.schema.json` (lihat `docs/skema-soal.md`), data di `bank/p01.json`.
3. ~~Validator~~ Selesai: `python3 tools/validasi.py`.
4. ~~Skrip pembuat PDF~~ Selesai: `node ebook/buat-ebook.mjs bank/p01.json` (lihat `ebook/README.md`).
5. Buat Paket 2 dan seterusnya (110 soal per paket), lalu review tiap paket.
   - Paket 2 (`bank/p02.json`, 110 soal) selesai 6 November 2026, status draf. Berikutnya p03 dan p04:
     alur di `docs/cara-membuat-paket.md`, prompt siap pakai di `prompts/paket-p03.md` dan `prompts/paket-p04.md`.
   - Paket 3 (`bank/p03.json`, 110 soal, seed 303) selesai 6 November 2026, status draf. Validator 0 galat/0 peringatan, PDF 145 halaman.
   - Paket 4 (`bank/p04.json`, 110 soal, seed 404) selesai 6 November 2026, status draf. Validator 0 galat
     dan 0 peringatan, PDF 143 halaman. Topik yang mirip p03 sudah diganti (24 soal). Cek fakta sebelum terbit: no. 4–15, 17–21, 27, 30, 68, 76, 84, 93–94, 106, 109–110 (lihat `rujukan`).
