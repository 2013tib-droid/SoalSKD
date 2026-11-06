# Cara membuat paket soal

Alur yang dipakai untuk Paket 2 (`bank/p02.json`, 110 soal), beserta pelajarannya.
Pakai lagi untuk Paket 3, 4, dan seterusnya.

## Alur

1. **Sinkronkan dulu.** `git fetch` lalu pull branch utama. Cek `docs/koordinasi-sesi.md`
   (siapa memegang area apa) dan bagian langkah berikutnya di `docs/rencana-ebook-cpns.md`.
2. **Lihat topik yang sudah dipakai**, supaya paket baru tidak mengulang:
   ```bash
   python3 -c "import json,glob;[print(s['kategori'],'|',s['subtopik'],'|',s['topik']) for f in sorted(glob.glob('bank/p*.json')) for s in json.load(open(f))['soal']]"
   ```
   Validator juga menolak `topik` dan teks pertanyaan yang sama persis, tetapi topik yang
   mirip dengan kata berbeda tidak tertangkap. Tetap cek manual.
3. **Susun kerangka 110 soal sebelum menulis.** Untuk setiap nomor tentukan subtes,
   subtopik, topik, tingkat, dan kunci (atau posisi bobot 5). Target sebaran:
   - TWK 30 (6 mudah, 15 sedang, 9 sulit), TIU 35 (7/18/10), TKP 45 (9/22/14).
   - TKP per aspek: Pelayanan Publik 8, Jejaring Kerja 8, Sosial Budaya 7, TIK 7,
     Profesionalisme 8, Antiradikalisme 7.
   - Urutan kunci dan posisi bobot 5: `python3 tools/bangun_paket.py urutan --seed <angka>`.
     Pakai seed yang berbeda untuk setiap paket.
4. **Tulis per batch** (sekitar 9–12 soal) sebagai JSON array di scratchpad, dengan nama
   file `batch-01.json`, `batch-02.json`, dan seterusnya, berurutan TWK → TIU → TKP.
   Field `id` dan `nomor` tidak perlu diisi.
5. **Gabung dan validasi setelah setiap batch:**
   `python3 tools/bangun_paket.py gabung p03 <folder-batch>`. Perbaiki semua galat.
6. **Commit dan push setiap satu subtes selesai** (TWK, lalu TIU, lalu TKP). Container
   bisa hilang, jadi jangan menunggu sampai 110 soal.
7. **Akhiri dengan:** validator 0 galat dan 0 peringatan, `node ebook/buat-ebook.mjs bank/p03.json`
   berhasil, lalu lihat beberapa halaman PDF-nya. Status paket tetap `draf` sampai pemilik
   me-review.

## Pelajaran dari Paket 2

- **Jawaban terbaik jangan selalu opsi terpanjang.** Di draf pertama TWK p02, kunci menjadi
  opsi terpanjang di 23 dari 30 soal. Tulis opsi bernilai 3 atau 4 (TKP) dan distraktor
  terkuat (TWK/TIU) sama panjang atau lebih panjang dari jawaban terbaik. Validator
  memberi peringatan jika pola ini muncul di lebih dari 35% soal satu subtes.
- **Pembahasan minimal 150 kata** dihitung dari `inti` + `opsi` + `konsep` (tanpa `tips`).
  Soal pendek seperti sinonim, antonim, dan deret sering kurang. Tulis `inti` sekitar 70 kata
  dan tambahkan isi yang berguna, seperti contoh kalimat atau cara memeriksa, bukan kalimat pengisi.
- **Distraktor numerik harus berasal dari kesalahan nyata.** Setiap angka pengecoh punya
  asal hitungan yang bisa dijelaskan, misalnya diskon dijumlahkan, lupa mengurangi volume
  awal, atau salah membaca yang ditanyakan. Hindari penjelasan seperti “salah hitung kecil”.
- **Verifikasi semua hitungan dan teka-teki dengan Python** sebelum menulis soalnya,
  termasuk keunikan jawaban soal penjadwalan atau pemilihan anggota (pakai `itertools`).
- **TKP:** bobot 1–5 dipakai sekali per soal. Nilai 5 dan 1 harus tegas. Pola yang dipakai:
  5 = menyelesaikan masalah + melibatkan pihak yang tepat + sesuai aturan; 4 = baik tetapi
  kurang satu unsur; 3 = aman tetapi pasif atau kaku; 2 = menghindar; 1 = melanggar aturan
  atau merugikan pihak lain. Tulis alasan bobot setiap opsi di `pembahasan.opsi`.
- **Fakta hukum:** isi `rujukan` untuk setiap pasal atau UU yang dikutip. Pakai hanya fakta
  yang yakin benar. Kalau ragu, pilih topik lain.
- **Validator bisa salah.** Di p02 cek opsi kembar sempat menganggap `x > y` sama dengan
  `x < y`. Jika galat terasa janggal, periksa validatornya (dan tambahkan kasus uji).

## Alat

| Perintah | Fungsi |
|---|---|
| `python3 tools/bangun_paket.py urutan --seed N` | Urutan kunci dan posisi bobot 5 yang merata |
| `python3 tools/bangun_paket.py gabung pXX <folder>` | Gabung batch → `bank/pXX.json`, ringkasan sebaran, validasi |
| `python3 tools/validasi.py` | Validasi seluruh bank (termasuk topik lintas paket) |
| `python3 tools/test_validasi.py` | Tes validator |
| `node ebook/buat-ebook.mjs bank/pXX.json` | PDF ebook (`ebook/dist/pXX.pdf`) |
