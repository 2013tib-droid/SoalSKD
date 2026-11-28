# Cara membuat paket soal

Alur yang dipakai untuk Paket 2 (`p02.json`, 110 soal), beserta pelajarannya.

> **Lokasi berkas (sejak 2026-11-24):** paket berbayar (p02 dst.) dan gambarnya ada di repo
> **privat** `SoalSKD-bank` (clone di sebelah folder SoalSKD, atau `BANK_PRIVAT_DIR`). Repo publik
> hanya memuat paket gratis `bank/p01.json` dan `bank/katalog.json`. `tools/bangun_paket.py`
> menulis paket berbayar ke repo privat; setelah paket baru/berubah jalankan
> `python3 tools/bank_privat.py katalog` (repo publik) lalu commit di **kedua** repo.
> Contoh perintah `bank/pXX.json` di bawah berarti `../SoalSKD-bank/pXX.json` untuk paket berbayar.
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
   Setiap soal harus masuk kisi-kisi KepmenPANRB 674/2026 (daftar butir dan pemetaan `subtopik`
   di `SoalSKD-bank/kisi-kisi/`; cek dengan `python3 kisi-kisi/cek_kisi.py --ketat` dari repo itu).
   Analogi kata, sinonim, antonim, dan ketidaksamaan gambar tidak lagi ada di kisi-kisi.
   TIU wajib memuat minimal satu serial gambar, satu analogi gambar, dan satu penalaran matriks. Definisikan gambarnya di `tools/buat_figural.py` (state + aturan), jalankan skrip itu,
   lalu pastikan "0 galat" (jawaban tunggal, kunci di bank cocok). Pola dan cara berpikirnya
   jangan diulang antarpaket.
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
- **Tapi jangan pindah ke pola baru.** Aturan di atas, kalau dipakai di setiap soal, membuat
  kunci TWK p02 menjadi opsi terpanjang **ke-2** di 22 dari 30 soal dan opsi bobot 4 TKP menjadi
  terpanjang di 38 dari 45 soal (audit 2026-11-25: menebak "terpanjang ke-2" memberi 110/150
  TWK dan 188/225 TKP tanpa membaca soal). Targetnya sebaran merata: jawaban terbaik kadang
  terpanjang, kadang terpendek. Validator kini memperingatkan jika satu peringkat panjang dipakai
  lebih dari 40% soal satu subtes (TKP: juga untuk opsi bobot 4).
- **Pembahasan minimal 150 kata** dihitung dari `inti` + `opsi` + `konsep` (tanpa `tips`).
  Soal pendek seperti deret angka, berhitung, dan silogisme sering kurang. Tulis `inti` sekitar 70 kata
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

## Pelajaran dari Paket 7

- **Cek bentuk opsi TKP, bukan hanya panjangnya.** Di p05, opsi bobot 5 adalah opsi dengan
  klausa terbanyak (koma, *dan*, *lalu*, *serta*) di 38 dari 45 soal (p06: 30 dari 45), jadi
  peserta bisa menebak tanpa membaca soal. Setelah opsi 5 diringkas, polanya berbalik: opsi 5
  menjadi yang **terpendek** (9 dari 12 soal di batch pertama). Ukur tiga pola sekaligus
  (terpanjang, terpendek, klausa terbanyak) dan jaga masing-masing di bawah sekitar 20%.
  Caranya: opsi 4 dan 3 ditulis sama berlapisnya dengan opsi 5, dan opsi 5 kadang ringkas.
  Hasil p07: terpanjang 2/45, terpendek 0/45, klausa terbanyak 1/45.
- **TWK: paling banyak satu distraktor ekstrem.** Soal perbatasan p05/p06 punya tiga atau
  empat opsi ekstrem ("ditutup sepenuhnya", "dibuka tanpa dokumen"), sehingga kunci tertebak.
  Distraktor yang kuat adalah yang setengah benar: pasal yang mirip (Pasal 18B ayat 1 vs 2,
  Pasal 28D ayat 3 vs 27 ayat 1), "jalan tengah" yang tetap melanggar, atau hak yang benar
  tetapi dipakai untuk hal yang salah.
- **Teka-teki “informasi tambahan” dan “tidak dapat ditentukan”:** uji **setiap opsi**
  dengan program, bukan hanya kuncinya. Di draf p07-045, tiga opsi sama-sama membuat urutan
  tunggal. Untuk silogisme “premis yang hilang”, uji dengan dan tanpa anggapan setiap
  himpunan tidak kosong; beberapa premis sah hanya dengan anggapan itu, jadi jangan dipakai
  sebagai distraktor.
- **Soal rute terpendek atau optimasi:** pastikan strategi serakah (“selalu yang terdekat”)
  menghasilkan jawaban salah, supaya soal benar-benar menguji penalaran, dan jadikan hasil
  serakah itu distraktor.
- **Variasikan kalimat tanya TKP**: paling banyak sekitar 10 soal per bentuk (“Sikap Anda
  adalah”, “Tindakan Anda adalah”, “Anda akan”, “Langkah pertama Anda”, dan seterusnya).
- **Sebaran bundel:** sebelum menyusun kerangka, hitung subtopik paket lain dalam bundel yang
  sama, lalu isi celahnya supaya ketiga paket bersama-sama seimbang.

## Alat

| Perintah | Fungsi |
|---|---|
| `python3 tools/bangun_paket.py urutan --seed N` | Urutan kunci dan posisi bobot 5 yang merata |
| `python3 tools/bangun_paket.py gabung pXX <folder>` | Gabung batch → `bank/pXX.json`, ringkasan sebaran, validasi |
| `python3 tools/validasi.py` | Validasi seluruh bank (termasuk topik lintas paket) |
| `python3 tools/test_validasi.py` | Tes validator |
| `node ebook/buat-ebook.mjs bank/pXX.json` | PDF ebook (`ebook/dist/pXX.pdf`) |
