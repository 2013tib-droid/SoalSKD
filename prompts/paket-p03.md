# Prompt: buat Paket 3

## Teks untuk ditempel di sesi baru

```
Buat Paket 3 bank soal SKD CPNS (bank/p03.json, 110 soal).
Instruksi lengkap ada di prompts/paket-p03.md. Baca file itu dulu, lalu kerjakan sampai selesai
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

Buat `bank/p03.json`: 110 soal orisinal, status `draf`, dengan komposisi dan sebaran yang
sama seperti p02 (lihat `docs/cara-membuat-paket.md`). Gunakan seed **303**:
`python3 tools/bangun_paket.py urutan --seed 303`.

### Arah topik Paket 3

Jangan mengulang topik di `bank/p01.json`, `bank/p02.json`, dan `bank/sample-15.json`
(lihat perintah daftar topik di `docs/cara-membuat-paket.md`). Gagasan berikut belum dipakai
dan boleh diganti dengan topik lain yang setara:

- **TWK:** penerapan sila kedua dan sila ketiga; wewenang MPR (Pasal 3); BPK (Pasal 23E);
  asas pemilu (Pasal 22E); bank sentral (Pasal 23D); hak yang tidak dapat dikurangi
  (Pasal 28I ayat 1); sistem pertahanan rakyat semesta (Pasal 30 ayat 2); otonomi khusus
  dan daerah istimewa (Pasal 18B); asas desentralisasi, dekonsentrasi, dan tugas pembantuan;
  Sarekat Islam, Indische Partij, Perhimpunan Indonesia (Manifesto 1925), Kongres Perempuan
  1928; sidang pertama BPUPKI; nepotisme dan LHKPN; kata baku, konjungsi, kalimat ambigu,
  penulisan angka.
- **TIU:** sinonim dan antonim kata serapan lain; analogi fungsi, profesi–alat, atau
  produk–bahan; silogisme dengan premis “sebagian”; posisi duduk melingkar; deret dua
  tingkat atau deret pecahan; kenaikan dan penurunan persen berturut-turut; susul-menyusul
  (kecepatan berbeda, arah sama); soal umur; dua keran mengisi dan satu menguras; peluang
  dua dadu; permutasi susunan; median dan modus; luas dan keliling bangun datar;
  logika “hanya jika”; perbandingan kuantitatif dengan pecahan atau akar.
- **TKP:** warga meminta informasi lewat media sosial di luar jam kerja; atasan meminta
  laporan diubah agar target tampak tercapai; rekan senior menolak bimbingan dari pegawai
  muda; kerja sama dengan organisasi masyarakat; perayaan hari besar agama yang berbeda di
  kantor; rapat dengan peserta tunarungu; aplikasi layanan yang belum dipahami warga
  lansia; dokumen rahasia tertinggal di printer bersama; kebijakan kerja dari mana saja;
  ajakan donasi dari lembaga yang tidak jelas untuk kelompok kekerasan; penolakan pendirian
  rumah ibadah di lingkungan tempat tinggal.

### Aturan mutu (ringkas, rinciannya di docs/cara-membuat-paket.md)

- Pembahasan minimal 150 kata. Isi: alasan jawaban benar, kesalahan setiap opsi lain beserta
  asal jebakannya, konsep, rumus, atau trik eliminasi. Ditambah `tips` soal sejenis.
- Jawaban terbaik jangan menjadi opsi terpanjang. Validator memberi peringatan.
- Semua hitungan dan teka-teki TIU diverifikasi dengan Python sebelum ditulis.
- Distraktor berasal dari kesalahan peserta yang nyata.
- `rujukan` diisi untuk setiap pasal atau UU yang dikutip. Hanya tulis fakta yang yakin benar.
- TIU figural dilewati.
- Selesai = `python3 tools/validasi.py` 0 galat dan 0 peringatan untuk p03, serta PDF berhasil
  dibuat dengan `node ebook/buat-ebook.mjs bank/p03.json` (sekali saja: `cd ebook && npm install`).

### Commit dan koordinasi

- Kerjakan di branch utama `claude/skd-stan-resource-analysis-c10e5n`. `git fetch` sebelum
  mulai dan sebelum setiap push.
- Commit dan push setiap satu subtes selesai (TWK, TIU, TKP).
- Area yang boleh diubah: `bank/p03.json`, dan `tools/` jika validator perlu diperbaiki
  (dengan kasus uji). Jangan mengubah `web/` atau `ebook/`. Catat kebutuhan di area itu
  di laporan.
- Setelah selesai, tambahkan satu baris kemajuan di `docs/rencana-ebook-cpns.md` langkah 5.

### Laporan akhir

Singkat saja: jumlah soal, hasil validator, jumlah halaman PDF, fakta yang perlu dicek
pemilik sebelum terbit (daftar nomor soal dan rujukannya), dan hal yang perlu diputuskan pemilik.
