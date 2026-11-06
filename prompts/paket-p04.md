# Prompt: buat Paket 4

## Teks untuk ditempel di sesi baru

```
Buat Paket 4 bank soal SKD CPNS (bank/p04.json, 110 soal).
Instruksi lengkap ada di prompts/paket-p04.md. Baca file itu dulu, lalu kerjakan sampai selesai
tanpa menunggu konfirmasi per batch. Laporkan singkat di akhir.
```

---

## Instruksi untuk sesi yang mengerjakan

### Baca dulu (seperlunya, jangan seluruh folder)

1. `CLAUDE.md`: aturan proyek dan keputusan.
2. `docs/cara-membuat-paket.md`: alur kerja dan pelajaran dari Paket 2. **Wajib diikuti.**
3. `docs/skema-soal.md`: bentuk data.
4. Contoh gaya: baca 3 soal saja dari `bank/p02.json`, misalnya nomor 23 (TWK), 54 (TIU), dan
   72 (TKP). Panjang, nada, dan struktur pembahasannya menjadi standar.

### Tugas

Buat `bank/p04.json`: 110 soal orisinal, status `draf`, dengan komposisi dan sebaran yang
sama seperti p02 (lihat `docs/cara-membuat-paket.md`). Gunakan seed **404**:
`python3 tools/bangun_paket.py urutan --seed 404`.

### Arah topik Paket 4

Jangan mengulang topik di `bank/p01.json`, `bank/p02.json`, `bank/p03.json` (jika sudah ada),
dan `bank/sample-15.json`. **Jangan juga memakai daftar gagasan topik di `prompts/paket-p03.md`**,
karena Paket 3 mungkin sedang dikerjakan bersamaan dan belum masuk ke bank. Gagasan berikut
belum dipakai dan boleh diganti dengan topik lain yang setara:

- **TWK:** penerapan sila keempat dalam musyawarah di kantor; Pancasila sebagai pandangan
  hidup dan perjanjian luhur; wewenang Mahkamah Konstitusi (Pasal 24C); syarat dan masa
  jabatan presiden (Pasal 6A dan Pasal 7); hak warga negara atas pekerjaan (Pasal 27 ayat 2);
  kebebasan berserikat (Pasal 28E ayat 3); lambang dan bahasa negara (Pasal 35–36C); fungsi
  DPR (Pasal 20A); Trikora dan Pepera (integrasi Irian Barat); Konferensi Meja Bundar 1949;
  Dekrit Presiden 5 Juli 1959; nilai integritas dalam pengadaan barang dan jasa; bela negara
  di bidang ekonomi dan siber; kalimat efektif (kesejajaran), makna kata berimbuhan,
  penggunaan tanda baca.
- **TIU:** sinonim dan antonim istilah administrasi; analogi sebab–akibat ganda dan tempat–
  kegiatan; silogisme dengan tiga premis; urutan kedatangan atau antrean; pengelompokan
  dengan syarat ganda; deret kuadrat dan kubus; deret dengan pola kali-tambah bergantian;
  bunga tunggal tabungan; rata-rata gabungan dua kelompok; kecepatan rata-rata pulang–pergi;
  pekerjaan dengan efisiensi berbeda; peluang mengambil kartu atau kelereng berurutan;
  kombinasi memilih panitia; volume bangun ruang; logika biimplikasi; perbandingan
  kuantitatif dengan persen dan pangkat.
- **TKP:** warga mengeluh karena prosedur berbelit di unit lain; rekan menyalahgunakan
  kendaraan dinas; menyambut pegawai baru penyandang disabilitas; kerja sama dengan
  perguruan tinggi untuk survei; tradisi daerah yang berbeda dalam acara pernikahan rekan;
  pegawai lansia kesulitan dengan presensi daring; pesan berantai berisi tautan undian
  berhadiah; tugas lapangan saat cuaca buruk; atasan baru yang gaya kerjanya berbeda;
  rekan mengunggah keluhan tentang kantor di media sosial; donasi pembangunan rumah ibadah
  yang disertai ajakan memusuhi kelompok lain; konten permainan daring yang menyisipkan
  ajakan kekerasan.

### Aturan mutu (ringkas, rinciannya di docs/cara-membuat-paket.md)

- Pembahasan minimal 150 kata. Isi: alasan jawaban benar, kesalahan setiap opsi lain beserta
  asal jebakannya, konsep, rumus, atau trik eliminasi. Ditambah `tips` soal sejenis.
- Jawaban terbaik jangan menjadi opsi terpanjang. Validator memberi peringatan.
- Semua hitungan dan teka-teki TIU diverifikasi dengan Python sebelum ditulis.
- Distraktor berasal dari kesalahan peserta yang nyata.
- `rujukan` diisi untuk setiap pasal atau UU yang dikutip. Hanya tulis fakta yang yakin benar.
- TIU figural dilewati.
- Selesai = `python3 tools/validasi.py` 0 galat dan 0 peringatan untuk p04, serta PDF berhasil
  dibuat dengan `node ebook/buat-ebook.mjs bank/p04.json` (sekali saja: `cd ebook && npm install`).

### Commit dan koordinasi

- Kerjakan di branch utama `claude/skd-stan-resource-analysis-c10e5n`. `git fetch` sebelum
  mulai dan sebelum setiap push.
- Commit dan push setiap satu subtes selesai (TWK, TIU, TKP).
- Jika Paket 3 sedang dikerjakan sesi lain, `tools/validasi.py` (tanpa argumen) juga memeriksa
  p03. Galat di p03 bukan urusan sesi ini; validasi p04 dengan `python3 tools/validasi.py bank/p04.json`
  (pemeriksaan topik lintas paket tetap berjalan).
- Area yang boleh diubah: `bank/p04.json`, dan `tools/` jika validator perlu diperbaiki
  (dengan kasus uji). Jangan mengubah `web/` atau `ebook/`. Catat kebutuhan di area itu
  di laporan.
- Setelah selesai, tambahkan satu baris kemajuan di `docs/rencana-ebook-cpns.md` langkah 5.

### Laporan akhir

Singkat saja: jumlah soal, hasil validator, jumlah halaman PDF, fakta yang perlu dicek
pemilik sebelum terbit (daftar nomor soal dan rujukannya), dan hal yang perlu diputuskan pemilik.
