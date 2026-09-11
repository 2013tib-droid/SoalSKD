# Analisis Biaya Token: Bank Soal SKD untuk USM PKN STAN

Dokumen ini menjawab satu pertanyaan: **kalau bikin bank soal SKD pakai LLM,
konsumsi tokennya besar atau tidak?** Semua angka di bawah berasal dari
pengukuran nyata terhadap `bank/sample-15.json` (15 soal lengkap dengan kunci
dan pembahasan), bukan perkiraan kasar.

Estimator: `tools/estimate_tokens.py` (akurasi ±15%; untuk angka eksak pakai
endpoint `/v1/messages/count_tokens`).

---

## 1. Jawaban singkat

**Tidak besar.** Soal itu teks pendek, dan biaya generasi soal praktis hanya
biaya *output token*. Satu paket SKD penuh (110 soal: 30 TWK, 35 TIU, 45 TKP)
lengkap dengan kunci dan pembahasan hanya **~23.500 token output**.

Yang berpotensi mahal bukan soalnya, melainkan **cara kerjanya**: overhead
sesi agentik, konteks yang dikirim ulang, dan scraping halaman web. Bagian 4-6
membahas ini.

---

## 2. Biaya per soal (hasil ukur)

| Format output | Token / 15 soal | Token / soal |
|---|---:|---:|
| JSON pretty (indent 2) | 3.501 | 233 |
| JSON compact (1 baris) | 3.168 | 211 |
| Markdown + pembahasan | 2.334 | 156 |
| Soal + kunci saja (tanpa pembahasan) | 1.361 | 91 |

Per kategori (format JSON, termasuk pembahasan):

| Kategori | Token/soal | Catatan |
|---|---:|---|
| TIU | 170 | paling murah; opsi jawaban pendek (angka, satu kata) |
| TWK | 215 | pembahasan perlu rujukan pasal/sila |
| TKP | 246 | paling mahal: 5 opsi kalimat panjang + tabel bobot 1-5 |

Komposisi SKD membuat rata-rata tertimbang jatuh di **~213 token/soal**:

```
TWK 30 x 215 =  6.450
TIU 35 x 170 =  5.950
TKP 45 x 246 = 11.070
--------------------------
1 paket 110 soal = 23.470 token output
```

Sebagai perbandingan: 23.470 token itu sekitar **2% dari satu jendela konteks
1 juta token**. Satu paket SKD penuh muat berkali-kali lipat dalam satu request.

---

## 3. Proyeksi biaya API

Harga resmi ($/1 juta token, input/output): Opus 5 $5/$25 · Sonnet 5 $2/$10 ·
Haiku 4.5 $1/$5. Batch API memberi diskon 50%. Asumsi: 22 soal per request,
~1.500 token instruksi per request, ditambah "sidik jari" soal lama untuk
mencegah duplikat (lihat bagian 5).

| Model | 1 paket (110 soal) | 1 paket via Batch API | 10 paket (1.100 soal) | 50 paket (5.500 soal) |
|---|---:|---:|---:|---:|
| Opus 5 | $0,62 | $0,31 | $6,61 | $41,32 |
| Sonnet 5 | $0,25 | $0,12 | $2,65 | $16,53 |
| Haiku 4.5 | $0,12 | $0,06 | $1,32 | $8,26 |

**Bank soal 5.500 butir — cukup untuk latihan intensif berbulan-bulan — biayanya
di bawah $42 dengan model termahal, dan ~$8 dengan Haiku.** Kalau pakai
langganan Claude Code/Claude.ai, ini terserap jauh di dalam kuota; tidak perlu
strategi penghematan khusus.

**Rekomendasi model:** pakai model terkuat untuk *TIU numerik dan silogisme*
(di sinilah kunci jawaban salah paling sering terjadi dan paling fatal untuk
latihan), dan model yang lebih murah boleh untuk TKP/TWK yang lebih berpola.
Jangan turunkan model demi hemat $30 kalau taruhannya siswa menghafal kunci
yang salah.

---

## 4. Overhead yang sebenarnya mahal

Biaya generasi murni hanya sebagian kecil dari total. Data dari sesi ini sendiri:

| Komponen | Token |
|---|---:|
| Startup sesi (system prompt + definisi tool + instruksi) | ~58.200 |
| Menulis 15 soal lengkap (turn generasi) | ~6.800 |
| Satu tool call yang gagal (stack trace Python masuk konteks) | ~3.900 |

Tiga pelajaran:

1. **Startup sesi (~58k token) lebih mahal daripada dua paket SKD penuh.**
   Maka: generate banyak soal dalam satu sesi, jangan satu sesi per 10 soal.
2. **Output tool yang berisik itu mahal.** Satu stack trace gagal = ~3.900
   token, setara 18 soal. Pipeline yang rapi (script yang print ringkas)
   menghemat lebih banyak daripada mengutak-atik format soal.
3. **Prompt caching bekerja.** Turn lanjutan hanya menagih input baru + output,
   bukan seluruh konteks percakapan. Cache read berharga ~0,1x harga input;
   tulis cache 1,25x (TTL 5 menit) atau 2x (TTL 1 jam). Karena kisi-kisi dan
   instruksi format itu identik di setiap batch, taruh di prefix yang di-cache.

---

## 5. Masalah sebenarnya: duplikasi, bukan token

Pada bank soal besar, kesulitan teknis yang nyata bukan biaya, melainkan
**model mengulang soal yang mirip**. Solusi naif — kirim ulang semua soal lama
sebagai konteks — membuat biaya tumbuh kuadratik.

| Strategi anti-duplikat (bank 1.000 soal) | Token per request |
|---|---:|
| Kirim ulang seluruh soal lama | 210.000 |
| Kirim "sidik jari" saja (id + subtopik + 8 kata pertama) | 15.000 |

**14x lebih hemat**, dan efektivitasnya setara untuk mencegah pengulangan.
Lebih baik lagi: lakukan deduplikasi di sisi kode (hash/normalisasi teks soal),
bukan di dalam prompt — biayanya nol token.

Pembagian kerja yang dianjurkan:
- **Kunci blueprint per batch**: tentukan subtopik eksplisit sebelum generate
  ("5 soal TIU deret: 2 aritmetika, 2 geometri, 1 fibonacci-variasi"). Ini
  mencegah model berputar di topik favoritnya, tanpa biaya konteks.
- **Validasi di kode**, bukan di model: cek jumlah opsi, kunci ada di daftar
  opsi, TKP punya bobot lengkap 5 nilai, tidak ada soal duplikat.

---

## 6. Ambil dari internet vs. buat sendiri

| Pendekatan | Biaya per 20 soal | Kualitas | Risiko |
|---|---|---|---|
| Scraping (WebSearch + WebFetch 2-3 halaman) | ~15.000-40.000 token **input** | soal mentah, pembahasan sering tidak ada, kunci kadang salah ketik di sumber | hak cipta materi bimbel; soal kedaluwarsa (kisi-kisi SKD berubah) |
| Generate sendiri | ~4.200 token **output** + ~1.500 input | terkendali: subtopik, tingkat kesulitan, dan pembahasan ditentukan | perlu verifikasi kunci, terutama TIU numerik |

**Kesimpulan: buat sendiri lebih murah 4-10x sekaligus lebih aman secara hukum.**
Satu halaman web berisi 20 soal saja sudah menghabiskan token lebih banyak
daripada menulis 20 soal dari nol, karena satu halaman membawa serta menu,
iklan, dan komentar.

Pakai internet hanya untuk hal yang **tidak bisa dikarang**: kisi-kisi resmi
(PermenPAN-RB), ambang batas/passing grade tahun berjalan, dan jumlah soal per
bagian. Ambil sekali, simpan sebagai file lokal, lalu pakai berulang sebagai
prefix yang di-cache. Jangan fetch ulang tiap batch.

Catatan akurasi: pengetahuan model punya batas waktu, jadi **passing grade dan
format tes tahun berjalan wajib diverifikasi ke sumber resmi**; yang aman
dikarang adalah isi soalnya, bukan aturan seleksinya.

---

## 7. Resep operasional

1. Satu sesi panjang, banyak batch (amortisasi startup ~58k token).
2. 20-25 soal per request. Lebih kecil = overhead instruksi terbuang; lebih
   besar = kualitas pembahasan menurun dan risiko output terpotong naik.
3. Prefix yang di-cache: kisi-kisi + aturan format + contoh 1 soal tiap
   kategori. Bagian yang berubah (blueprint batch, daftar sidik jari) ditaruh
   **setelah** prefix.
4. Output JSON compact saat generate; render ke Markdown/HTML di sisi kode.
   Hemat ~10% token dan membuat data bisa divalidasi otomatis.
5. Jalankan Batch API kalau tidak butuh hasil seketika: diskon 50%.
6. Verifikasi kunci TIU numerik dengan menjalankan hitungannya di kode, bukan
   dengan meminta model memeriksa dirinya sendiri.
7. Pembahasan boleh digenerate belakangan (hanya untuk soal yang dipakai),
   kalau mau menekan biaya: soal+kunci saja hanya 91 token/soal.

## 8. Kesimpulan

Untuk skala pribadi atau satu bimbel, **biaya token bukan faktor pembatas** —
bank soal 5.500 butir berada di kisaran belasan dolar. Anggaran perhatian
sebaiknya dialihkan ke tiga hal yang benar-benar menentukan: **kebenaran kunci
jawaban, keberagaman soal, dan kesesuaian dengan kisi-kisi resmi terbaru.**
