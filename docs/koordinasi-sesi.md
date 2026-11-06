# Koordinasi antarsesi

Catatan saat beberapa sesi Claude mengerjakan repo ini bersamaan.
Repo ini tidak punya branch `main`. Branch utamanya `claude/skd-stan-resource-analysis-c10e5n`.

## Kepemilikan area

| Area | Dipegang |
|---|---|
| `bank/`, `schema/`, `tools/`, `web/`, `config/` | sesi utama |
| `ebook/` | sesi ebook (branch `claude/ebook-pdf`) |

Sesi lain yang butuh perubahan di area milik sesi lain menuliskannya di laporan,
tidak mengubahnya sendiri.

## 2026-11-06 · Branch `claude/skema-json-bank` ditutup

### Yang terjadi

1. Satu sesi diminta membuat skema dan validator bank soal di branch `claude/skema-json-bank`:
   `bank/schema/bank-soal.schema.json` (mengikuti format `bank/sample-15.json`) dan
   `tools/validate_bank.py`.
2. Pada saat yang sama, sesi utama menambahkan `schema/paket.schema.json` di branch utama
   (commit `64ee684`). Aturan kedua skema bertentangan: format id, `kunci` di soal TKP,
   aturan bobot TKP, dan bentuk `pembahasan`.
3. Pemilik memilih skema di branch utama. Branch tadi di-merge dengan branch utama, skemanya
   dihapus, dan validatornya ditulis ulang untuk `schema/paket.schema.json` (commit `4b7ec22`).
4. Branch utama lalu bergerak lagi: sesi utama menambahkan `tools/validasi.py` beserta tesnya
   (commit `476d461`), yang lebih lengkap. Validator di branch tadi jadi dobel, dan PR #1
   kembali konflik di `CLAUDE.md` dan `docs/skema-soal.md`.
5. Keputusan pemilik: tutup. PR #1 ditutup tanpa merge dan branch lokalnya dihapus.
   Branch `claude/skema-json-bank` di GitHub belum terhapus karena sesi itu tidak punya izin
   menghapus branch. Pemilik akan menghapusnya manual.

Tidak ada isi branch itu yang masuk ke branch utama.

### Yang tetap berlaku

- Skema bank soal: `schema/paket.schema.json` (penjelasan di `docs/skema-soal.md`).
- Validator: `python3 tools/validasi.py`. Validator ini juga menerima folder
  (`python3 tools/validasi.py bank/`).
- `bank/sample-15.json` masih memakai format lama. `validasi.py` melewatinya karena
  file itu tidak punya field `skema`.

### Pelajaran

- **Satu area, satu sesi.** Lihat tabel kepemilikan di atas.
- **Cek branch utama dulu sebelum mulai.** Jalankan `git fetch`, lalu cari apakah yang akan
  dibuat sudah ada atau sedang direncanakan, misalnya di bagian "langkah berikutnya" di `docs/`.
- **Cek branch utama lagi sebelum push atau membuat PR**, terutama kalau tugasnya makan waktu lama.
- Pelajaran ini berlaku untuk semua proyek. Usulkan ke repo `agensi` (`house-style`).
