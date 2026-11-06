# Koordinasi antarsesi

Catatan saat beberapa sesi Claude mengerjakan repo ini bersamaan.
Repo ini tidak punya branch `main`. Branch utamanya `claude/skd-stan-resource-analysis-c10e5n`.

## Kepemilikan area

| Area | Dipegang |
|---|---|
| `bank/`, `schema/`, `tools/`, `web/`, `config/` | sesi utama |
| `ebook/` | belum ada sesi aktif (sesi ebook selesai 2026-11-06); sesi berikutnya yang mengambil alih mencatat namanya di sini |

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

## 2026-11-06 · Ebook PDF di branch `claude/ebook-pdf`

Atas permintaan sesi utama dan dengan persetujuan pemilik, sesi ebook mengerjakan langkah 4 di
`docs/rencana-ebook-cpns.md`. Laporannya sudah dikirim ke sesi utama.

- **Hasil:** `node ebook/buat-ebook.mjs bank/p01.json` menghasilkan `ebook/dist/p01.pdf`
  (A4, 31 halaman untuk 20 soal). Isinya sampul, daftar isi, petunjuk, soal per subtes, kunci,
  dan pembahasan. Cara pakai dan alasan pemilihan alat ada di `ebook/README.md`.
- **Alat:** Paged.js untuk tata letak cetak, Chromium bawaan environment untuk mencetak PDF,
  dan marked untuk Markdown GFM. WeasyPrint tidak bisa dipasang karena pip tidak bisa mengambil
  paket di environment ini.
- **Validasi:** skrip menolak paket yang gagal `tools/validasi.py` (exit 1). Sudah diuji dengan
  bobot TKP yang dirusak dan dengan `sample-15`.
- **Batas area:** hanya `ebook/` dan `docs/` yang diubah. Tidak ada yang perlu diubah di area
  sesi utama.
- **Terbuka untuk sesi utama:** Geist tidak punya glyph `∧ ∨ ≡ ✓ ✗` yang dipakai di pembahasan
  TIU (p01-008 s.d. p01-013), jadi karakter itu tercetak dengan DejaVu Sans. Mengganti karakternya
  di data adalah keputusan sesi utama, karena `bank/` areanya.
- **Status:** sudah masuk ke branch utama lewat PR #2 (merge `73c08e5`).

### Catatan susulan

Catatan di atas sempat di-commit (`1e8335d`) di atas branch yang sudah di-merge, karena sesi ebook
belum tahu PR #2 sudah masuk. Pemilik tidak mau riwayat ditulis ulang (tidak ada push paksa), jadi
branch utama di-merge biasa ke `claude/ebook-pdf` dan catatan ini dibetulkan dengan commit baru.

Pelajaran: sebelum menambah commit di branch lama, cek dulu apakah PR-nya sudah di-merge. Kalau
sudah, pekerjaan susulan masuk lewat PR baru.

### Penutupan sesi ebook

- PR #3 (catatan di atas) sudah di-merge ke branch utama (`f8d483d`).
- Sesi ebook selesai; pemilik pindah ke sesi lain. `ebook/` sekarang tidak dipegang sesi mana pun
  (lihat tabel kepemilikan).
- Yang masih terbuka: pilihan glyph `∧ ∨ ≡ ✓ ✗` di pembahasan TIU (lihat di atas), dan
  ebook untuk paket berikutnya (`node ebook/buat-ebook.mjs bank/p02.json` setelah paketnya lolos
  `tools/validasi.py`).
- Catatan penutupan ini ada di branch `claude/ebook-pdf` dan baru masuk ke branch utama lewat PR baru.
