# Rencana Aplikasi Try Out (`web/`)

Status per 2026-11-07. Area `web/`, `bank/`, `schema/`, dan `tools/` dipegang sesi utama (lihat `docs/koordinasi-sesi.md`).

## Sudah jadi

| Bagian | Isi | Path |
|---|---|---|
| Layar ujian | Topbar + timer (normal/peringatan/kritis), pilihan A–E, action bar bawah, grid nomor berstatus (sheet di HP, panel di desktop), simpan otomatis, konfirmasi kumpulkan, pintasan keyboard | `/ujian/<paket>` |
| Halaman hasil | Skor per subtes dihitung di server, pembahasan per soal (alasan per opsi, inti, konsep, tips, rujukan), filter di URL | `/ujian/<paket>/hasil` |
| Landing | Hero + pratinjau ujian, keunggulan, cara kerja, contoh soal interaktif, FAQ; angka dari `bank/` dan config | `/` |
| Beranda | Kartu lanjutkan ujian, daftar paket dari `bank/`, aksi per state, riwayat skor | `/try-out` |
| Data | Bank skema 1 dan `config/skd.json` dibaca langsung; Markdown GFM dirender | `web/src/lib/` |
| Akun & penjualan | Login email+sandi dan Google, /aktivasi kode, gerbang p02–p04 di server, sinkron jawaban/riwayat ke akun, Cloud Functions tukar kode + webhook Mayar (41 tes emulator), rules Firestore | `/masuk`, `/daftar`, `/aktivasi`, `functions/`, `firestore.rules` |
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

- **Backend belum hidup.** Kode Firebase sudah ada, tapi proyek Firebase, App Hosting, dan webhook Mayar belum dibuat pemilik (`docs/firebase.md`). Sampai itu, situs server menutup p02–p04 dan login tidak tampil.
- **Kunci belum aman penuh.** `nilaiUjian` mengecek hak paket, tapi pemilik paket bisa memanggilnya sebelum mengumpulkan (sesi ujian ditulis browser). Menutupnya = jam mulai/selesai dicatat server.
- **Belum ada batas perangkat** per akun (game edukasi: 3). Satu akun bisa dipakai bersama.
- **Masuk dengan Google lewat pindah halaman** (cadangan saat pop-up diblokir) bisa gagal di Safari karena `authDomain` beda domain dengan situs. Pop-up jalan normal.
- **Belum ada bottom nav.** Ditambahkan saat halaman Riwayat dan Profil terpisah sudah ada.
- **Belum ada tombol keluar dari layar ujian** selain tombol kembali browser (jawaban tetap tersimpan).
- **Soal bergambar (`gambar`) belum ditampilkan** di app. Belum ada di `p01`.
- **Simbol `∧ ∨ ≡ ✓ ✗`** di pembahasan TIU `p01` dicetak dengan DejaVu Sans di PDF karena Geist tidak punya glyph-nya. Diputuskan dibiarkan.
- **Durasi dan ambang batas resmi** masih `null` di `config/skd.json`. Durasi latihan 1 menit per soal; ambang batas hanya dibandingkan untuk paket lengkap. Cek aturan BKN/KemenPAN-RB terbaru sebelum mengisinya.
- **Branch `claude/skema-json-bank`** masih ada di GitHub; pemilik menghapusnya manual.

## Langkah berikutnya (pilih salah satu)

1. **Hidupkan backend.** Pemilik mengikuti `docs/firebase.md` (proyek, Blaze, Auth, Firestore, secret,
   deploy backend, App Hosting, webhook Mayar), lalu Claude mengisi `web/apphosting.yaml` dan `TAUTAN_BELI`.
2. **Lengkapi `p01` jadi 110 soal.** Dikerjakan per subtes (misalnya 24 soal TWK dulu), soal orisinal,
   `python3 tools/validasi.py bank/` wajib 0 galat sebelum setiap commit. Butuh banyak token.
3. **Pemeriksaan akhir tampilan.** `antislop` / `impeccable` sekali pada file UI yang sudah jadi
   (`web/src/components/`), sesuai aturan hemat token di CLAUDE.md.

Setelah itu: halaman Riwayat dan Profil terpisah + bottom nav 4 item (Beranda, Try out, Riwayat, Profil),
sakelar tema terang/gelap di Profil, tampilan soal bergambar.

## Keputusan yang masih terbuka

- Urutan kerja: backend dulu atau isi bank soal dulu.
- Sumber resmi untuk durasi dan ambang batas SKD tahun berjalan.
