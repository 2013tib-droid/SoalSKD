> **Usang.** Format lama (USM PKN STAN). Untuk paket SKD CPNS, pakai
> `docs/cara-membuat-paket.md` dan `prompts/paket-p03.md`.

# Template Prompt Generator Batch (hemat token)

Struktur di bawah memisahkan bagian **stabil** (di-cache) dari bagian
**berubah** (dikirim ulang tiap batch). Urutan ini penting: prompt caching
bekerja dengan pencocokan prefix, jadi apa pun yang berubah harus berada
setelah bagian yang tetap.

---

## Bagian A — PREFIX STABIL (tandai untuk cache, ~1.200 token)

> Kamu menyusun soal Seleksi Kompetensi Dasar (SKD) untuk latihan USM PKN STAN.
>
> Aturan format — keluarkan **hanya** JSON array, tanpa teks pembuka/penutup:
> ```json
> [{"id":"","kategori":"TWK|TIU|TKP","subtopik":"","pertanyaan":"",
>   "opsi":{"A":"","B":"","C":"","D":"","E":""},"kunci":"A",
>   "bobot":{"A":5,"B":4,"C":3,"D":2,"E":1},"pembahasan":"","tingkat":"mudah|sedang|sulit"}]
> ```
>
> Aturan isi:
> - TWK: Pancasila, UUD 1945, NKRI, Bhinneka Tunggal Ika, bela negara, bahasa
>   Indonesia. Satu jawaban benar; pembahasan menyebut dasar hukum/sila.
> - TIU: verbal (analogi, silogisme, analitis), numerik (deret, aritmetika,
>   soal cerita), figural. Pembahasan menunjukkan langkah hitung, bukan sekadar
>   menyatakan hasil.
> - TKP: `bobot` wajib ada, nilai 1-5 tanpa duplikat, opsi terbaik bernilai 5;
>   `kunci` diisi opsi bernilai 5. Tidak ada opsi yang melanggar aturan sebagai
>   jawaban terbaik.
> - Pengecoh harus masuk akal. Hindari opsi yang jelas konyol.
> - Pembahasan maksimal 2 kalimat.
> - Soal harus orisinal; jangan menyalin soal yang beredar.

## Bagian B — BLUEPRINT BATCH (berubah, ~100 token)

> Buat 22 soal dengan komposisi persis:
> - TIU deret: 2 aritmetika, 2 geometri, 1 bertingkat
> - TIU verbal: 3 analogi, 2 silogisme
> - TWK: 4 UUD 1945 (pasal berbeda), 3 Pancasila penerapan
> - TKP: 3 integritas, 2 pelayanan publik
> Tingkat kesulitan: 6 mudah, 12 sedang, 4 sulit. Mulai id dari SKD-0231.

## Bagian C — SIDIK JARI ANTI-DUPLIKAT (berubah, ~15 token/soal)

Kirim hanya ringkasan soal yang sudah ada, bukan soal utuh:

```
SKD-0104 TIU/deret: 3,6,11,18,27
SKD-0108 TWK/UUD: lembaga uji UU terhadap UUD
SKD-0131 TKP/integritas: selisih catat menguntungkan unit
```

> Jangan buat soal yang konsepnya sama dengan daftar di atas.

---

## Catatan penerapan

- Batasi daftar sidik jari ke subtopik yang sedang digenerate saja — tidak perlu
  mengirim seluruh bank.
- Deduplikasi sebenarnya tetap dilakukan di kode (normalisasi teks lalu hash);
  daftar ini hanya mengarahkan model, bukan penjamin.
- Kalau ingin menekan biaya lebih jauh, hilangkan field `pembahasan` pada tahap
  generate (91 token/soal, bukan 213) dan buat pembahasan hanya untuk soal yang
  benar-benar dipakai.
