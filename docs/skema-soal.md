# Skema data soal

Satu paket = satu file JSON di `bank/`, misalnya `bank/p01.json`. File ini
**sumber utama**: ebook PDF, Markdown, dan aplikasi try out semuanya membaca
dari sini. Kalau ada soal yang direvisi, ubah JSON-nya, lalu buat ulang
turunannya.

- Skema: `schema/paket.schema.json` (JSON Schema 2020-12)
- Format ujian (jumlah soal, durasi, nilai, ambang batas): `config/skd.json`.
  Durasi dan ambang batas bernilai `null` sampai sumber resminya dicatat. Aplikasi
  dan ebook wajib menampilkan catatan "cek aturan BKN/KemenPAN-RB terbaru".

## Bentuk file

```json
{
  "skema": 1,
  "meta": { "id": "p01", "judul": "Paket 01", "versi": 1,
            "dibuat": "2026-11-06", "status": "draf" },
  "soal": [ { ... }, { ... } ]
}
```

`meta.status`: `draf` (belum direview pemilik) → `review` → `final` (siap terbit).

## Field soal

| Field | Wajib | Isi |
|---|---|---|
| `id` | ya | `<id paket>-<3 digit>`, misalnya `p01-014`. Unik di seluruh bank dan tetap walau nomor berubah. Aplikasi menyimpan jawaban pengguna dengan kunci ini. |
| `nomor` | ya | Urutan di paket (1–110). |
| `kategori` | ya | `TWK`, `TIU`, atau `TKP`. |
| `subtopik` | ya | Materi kisi-kisi. Untuk TKP wajib salah satu dari: Pelayanan Publik, Jejaring Kerja, Sosial Budaya, Teknologi Informasi dan Komunikasi, Profesionalisme, Antiradikalisme. |
| `topik` | ya | Topik spesifik, misalnya "Pembatasan HAM (Pasal 28J)". Dipakai untuk mencegah topik berulang antarpaket. |
| `tingkat` | ya | `mudah`, `sedang`, `sulit`. |
| `pertanyaan` | ya | Markdown. |
| `opsi` | ya | `{ "A": ..., "E": ... }`, kelimanya wajib. Markdown. |
| `kunci` | TWK/TIU | Huruf jawaban benar. Benar = 5, salah/kosong = 0. Tidak boleh ada di TKP. |
| `bobot` | TKP | `{ "A": 3, "B": 1, "C": 5, "D": 4, "E": 2 }`. Nilai 1–5, tidak ada 0. Tidak boleh ada di TWK/TIU. |
| `pembahasan.inti` | ya | Alasan jawaban benar (TWK/TIU) atau prinsip penilaian aspek (TKP). |
| `pembahasan.opsi` | ya | Penjelasan per opsi. TWK/TIU: setiap opsi selain kunci (kesalahannya dan asal distraktornya). TKP: kelima opsi beserta alasan bobotnya. Aplikasi bisa langsung menampilkan "kenapa jawabanmu salah". |
| `pembahasan.konsep` | tidak | Konsep penting, rumus, trik eliminasi, atau pola bobot TKP. |
| `tips` | ya | Tips menghadapi soal sejenis. |
| `rujukan` | tidak | Pasal/peraturan yang dikutip, misalnya `"UUD NRI 1945 Pasal 28J ayat (2)"`. Wajib dicocokkan dengan teks resmi sebelum `status: final`. |
| `gambar` | tidak | TIU figural: `[{ "file": "gambar/p01-020.svg", "alt": "..." }]`, path relatif dari `bank/`. |
| `catatan_review` | tidak | Masukan pemilik saat review. Dihapus setelah soal diperbaiki. |

## Aturan teks

- Semua teks soal memakai **Markdown GFM**: tebal, miring, daftar bernomor, tabel.
- **Tanpa LaTeX.** Rumus ditulis dengan Unicode (`(a × b) / (a + b)`, `d₁ + d₂`, `√`, `²`),
  supaya aplikasi dan PDF tidak perlu mesin rumus.
- Tidak ada HTML mentah.

## Yang dicek skema vs validator

Skema menangkap kesalahan bentuk: field wajib, field salah ketik, kunci di soal
TKP, bobot 0, aspek TKP asing, tanggal salah, dan sejenisnya.

Aturan yang melibatkan beberapa soal sekaligus dicek oleh validator
(`python3 tools/validasi.py`; galat = tidak boleh terbit, peringatan = sebaiknya dibereskan): bobot TKP memakai 1–5 masing-masing tepat sekali, `id` dan `nomor`
unik dan berurutan, urutan TWK → TIU → TKP, komposisi 30/35/45 untuk paket
penuh, sebaran tingkat 20/50/30, sebaran kunci A–E, pembahasan minimal 150 kata,
`topik` tidak berulang di seluruh bank, dan jawaban terbaik tidak boleh terlalu sering menjadi
opsi terpanjang (peringatan jika lebih dari 35% soal satu subtes). Saat menulis soal TKP, buat
opsi bernilai 3 atau 4 sama panjang atau lebih panjang dari opsi bernilai 5.

## Catatan untuk app (`web/`)

- `ambilSoalUjian` hanya membaca `id`, `kategori`, `pertanyaan`, dan `opsi`, jadi sudah
  cocok dengan skema ini.
- Type `SoalBank` di `web/src/lib/soal.ts` perlu disesuaikan: `pembahasan` sekarang
  objek `{inti, opsi, konsep?}`, `kunci` opsional (tidak ada di TKP), serta ada field `topik` dan `tips`.
- `web/src/config/skd.ts` sebaiknya membaca jumlah soal, nilai, dan ambang batas resmi dari
  `config/skd.json`. Ambang timer (peringatan/kritis) dan format latihan tetap di app.
