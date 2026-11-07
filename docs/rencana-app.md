# Rencana Aplikasi Try Out (`web/`)

Status per 2026-11-06. Area `web/`, `bank/`, `schema/`, dan `tools/` dipegang sesi utama (lihat `docs/koordinasi-sesi.md`).

## Sudah jadi

| Bagian | Isi | Path |
|---|---|---|
| Layar ujian | Topbar + timer (normal/peringatan/kritis), pilihan A–E, action bar bawah, grid nomor berstatus (sheet di HP, panel di desktop), simpan otomatis, konfirmasi kumpulkan, pintasan keyboard | `/ujian/<paket>` |
| Halaman hasil | Skor per subtes dihitung di server, pembahasan per soal (alasan per opsi, inti, konsep, tips, rujukan), filter di URL | `/ujian/<paket>/hasil` |
| Landing | Hero + pratinjau ujian, keunggulan, cara kerja, contoh soal interaktif, FAQ; angka dari `bank/` dan config | `/` |
| Beranda | Kartu lanjutkan ujian, daftar paket dari `bank/`, aksi per state, riwayat skor | `/try-out` |
| Data | Bank skema 1 dan `config/skd.json` dibaca langsung; Markdown GFM dirender | `web/src/lib/` |
| Ebook | Pembuat PDF dari `bank/*.json` (dikerjakan sesi ebook) | `ebook/` |

Paket yang tersedia: `p01` (20 dari 110 soal, status draf).

## Deploy dev (sementara)

- URL: `https://2013tib-droid.github.io/SoalSKD/development/main/`. Workflow `.github/workflows/deploy-dev.yml`
  jalan otomatis tiap push ke branch utama yang mengubah `web/`, `bank/`, atau `config/`, dan bisa dijalankan manual.
- Build statis: `cd web && STATIK=1 BASE_PATH=/SoalSKD/development/main npm run build` → `web/out/`.
  Skor dihitung di browser (`src/lib/nilai.ts`, fungsi yang sama dengan server action), jadi kunci dan
  pembahasan ikut terkirim. Hanya untuk tes; situs pembeli memakai build biasa.
- Sekali saja di GitHub: Settings → Pages → Deploy from a branch → `gh-pages` / root.

## Keterbatasan yang diketahui

- **Belum ada backend.** Jawaban, sesi ujian, dan riwayat hanya tersimpan di localStorage perangkat. Ganti perangkat atau hapus data browser = hilang.
- **Kunci belum aman penuh.** Server action `nilaiUjian` bisa dipanggil langsung sebelum ujian dikumpulkan. Butuh sesi server untuk menutupnya.
- **Belum ada bottom nav.** Ditambahkan saat halaman Riwayat dan Profil terpisah sudah ada.
- **Belum ada tombol keluar dari layar ujian** selain tombol kembali browser (jawaban tetap tersimpan).
- **Soal bergambar (`gambar`) belum ditampilkan** di app. Belum ada di `p01`.
- **Simbol `∧ ∨ ≡ ✓ ✗`** di pembahasan TIU `p01` dicetak dengan DejaVu Sans di PDF karena Geist tidak punya glyph-nya. Diputuskan dibiarkan.
- **Durasi dan ambang batas resmi** masih `null` di `config/skd.json`. Durasi latihan 1 menit per soal; ambang batas hanya dibandingkan untuk paket lengkap. Cek aturan BKN/KemenPAN-RB terbaru sebelum mengisinya.
- **Branch `claude/skema-json-bank`** masih ada di GitHub; pemilik menghapusnya manual.

## Langkah berikutnya (pilih salah satu)

1. **Backend + login.** Simpan jawaban dan riwayat di server, tutup celah kunci jawaban.
   Sudah diputuskan: Firebase (Auth email+sandi + Google, Firestore Jakarta, Cloud Functions) dan
   penjualan lewat Mayar + kode aktivasi, meniru Game-Edukasi-Anak. Prompt siap tempel: `docs/prompt-backend-login.md`.
2. **Lengkapi `p01` jadi 110 soal.** Dikerjakan per subtes (misalnya 24 soal TWK dulu), soal orisinal,
   `python3 tools/validasi.py bank/` wajib 0 galat sebelum setiap commit. Butuh banyak token.
3. **Pemeriksaan akhir tampilan.** `antislop` / `impeccable` sekali pada file UI yang sudah jadi
   (`web/src/components/`), sesuai aturan hemat token di CLAUDE.md.

Setelah itu: halaman Riwayat dan Profil terpisah + bottom nav 4 item (Beranda, Try out, Riwayat, Profil),
sakelar tema terang/gelap di Profil, tampilan soal bergambar.

## Keputusan yang masih terbuka

- Hosting dengan server untuk Next.js: Firebase App Hosting atau Vercel.
- Urutan kerja: backend dulu atau isi bank soal dulu.
- Sumber resmi untuk durasi dan ambang batas SKD tahun berjalan.
