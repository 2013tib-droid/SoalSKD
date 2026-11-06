# SoalSKD — Bank Soal SKD untuk Latihan USM PKN STAN

Repo ini berisi analisis biaya token untuk membangun bank soal SKD dengan LLM,
beserta contoh soal dan perkakas pendukungnya.

## Isi

| Path | Keterangan |
|---|---|
| `docs/analisis-token.md` | **Analisis utama**: biaya token per soal, proyeksi biaya API, dan strategi penghematan |
| `bank/sample-15.json` | 15 soal contoh (5 TWK, 5 TIU, 5 TKP) lengkap dengan kunci, bobot TKP, dan pembahasan |
| `bank/schema/bank-soal.schema.json` | JSON Schema (draft 2020-12) untuk berkas bank soal |
| `tools/validate_bank.py` | Validator bank soal (skema + id ganda + kunci TKP) |
| `tools/estimate_tokens.py` | Estimator token bank soal, jalan offline |
| `prompts/generator-batch.md` | Template prompt generator yang ramah prompt caching |

## Ringkasan temuan

- Satu paket SKD penuh (110 soal + kunci + pembahasan) = **~23.500 token output**
- Rata-rata **213 token per soal** (TIU 170 · TWK 215 · TKP 246)
- Biaya 1 paket: **$0,62** (Opus 5) / **$0,25** (Sonnet 5) / **$0,12** (Haiku 4.5)
- Bank 5.500 soal: **di bawah $42** dengan model termahal
- Startup satu sesi agentik (~58.000 token) lebih mahal daripada dua paket soal —
  batch besar dalam satu sesi jauh lebih efisien daripada banyak sesi kecil
- Membuat soal sendiri **4-10x lebih murah** daripada scraping halaman web, dan
  tanpa risiko hak cipta

Rinciannya ada di `docs/analisis-token.md`.

## Pakai estimator

```bash
python3 tools/estimate_tokens.py bank/*.json
```

## Validasi bank soal

```bash
python3 tools/validate_bank.py bank/            # semua *.json di bank/
python3 tools/validate_bank.py bank/sample-15.json
```

Memakai `jsonschema` bila terpasang (`pip install jsonschema`), selain itu
pemeriksa stdlib. Keluar dengan kode 1 dan menyebut `id` soal bila ada error.

## Format data

Setiap berkas di `bank/` berupa JSON dengan kunci `meta` dan `soal`. Field
`bobot` hanya ada pada soal TKP (skor 1-5 per opsi, sesuai sistem penilaian SKD).

## Catatan

Soal disusun orisinal dengan mengacu pada kisi-kisi SKD. Aturan seleksi yang
berubah tiap tahun — jumlah soal, durasi, dan ambang batas (passing grade) —
**wajib diverifikasi ke pengumuman resmi PKN STAN/BKN**, jangan diambil dari
sini maupun dari keluaran model.
