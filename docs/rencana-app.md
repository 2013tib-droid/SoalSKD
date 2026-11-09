# Rencana Aplikasi Try Out (`web/`)

Status per 2026-11-09. Area `web/`, `bank/`, `schema/`, dan `tools/` dipegang sesi utama (lihat `docs/koordinasi-sesi.md`).

## Sudah jadi

| Bagian | Isi | Path |
|---|---|---|
| Layar ujian | Topbar + timer (normal/peringatan/kritis), pilihan A–E, action bar bawah, grid nomor berstatus (sheet di HP, panel di desktop), simpan otomatis, konfirmasi kumpulkan, pintasan keyboard | `/ujian/<paket>` |
| Halaman hasil | Skor per subtes dihitung di server, pembahasan per soal (alasan per opsi, inti, konsep, tips, rujukan), filter di URL | `/ujian/<paket>/hasil` |
| Landing | Gaya promo: hero + mockup HP → harga (Rp9.900) → masalah/solusi → keunggulan → cara kerja → apa itu SKD → banner CTA → FAQ; angka dari `bank/` dan config. Tombol beli nonaktif selama `TAUTAN_BELI` null | `/` |
| Beranda | Panduan layar ujian (buka-tutup), kartu lanjutkan ujian, daftar paket dari `bank/` (p02–p04 jadi satu kartu bundel saat terkunci), aksi per state, riwayat skor, kartu unduh ebook | `/try-out` |
| Data | Bank skema 1 dan `config/skd.json` dibaca langsung; Markdown GFM dirender | `web/src/lib/` |
| Akun & penjualan | Login email+sandi dan Google, /aktivasi kode, gerbang p02–p04 di server, sinkron jawaban/riwayat ke akun, Cloud Functions tukar kode + webhook Mayar + `unduhEbook` (55 tes emulator), rules Firestore + Storage | `/masuk`, `/daftar`, `/aktivasi`, `functions/`, `firestore.rules`, `storage.rules` |
| Legal | Kebijakan Privasi dan Syarat & Ketentuan dari Markdown + config, ditautkan dari footer landing, /try-out, /daftar, /aktivasi, dan email kode; inventaris data di `docs/data-pribadi.md` | `/privasi`, `/syarat` |
| Ebook | Pembuat PDF dari `bank/*.json` (dikerjakan sesi ebook); unduhan pembeli lewat kartu "Ebook PDF" di /try-out → `unduhEbook` → signed URL 10 menit dari Storage privat `ebook/edisi-1.pdf`; build + unggah `tools/unggah-ebook.sh` | `ebook/`, `/try-out` |

Paket di `bank/`: `p01` gratis (20 dari 110 soal), `p02`–`p04` berbayar (110 soal masing-masing). Keempatnya masih berstatus `draf`; validator 0 galat.

## Deploy dev (sementara)

- URL: `https://2013tib-droid.github.io/SoalSKD/development/main/`. Workflow `.github/workflows/deploy-dev.yml`
  jalan otomatis tiap push ke branch utama yang mengubah `web/`, `bank/`, atau `config/`, dan bisa dijalankan manual.
- Build statis: `cd web && STATIK=1 BASE_PATH=/SoalSKD/development/main npm run build` → `web/out/`.
  Skor dihitung di browser (`src/lib/nilai.ts`, fungsi yang sama dengan server action), jadi kunci dan
  pembahasan ikut terkirim. Hanya untuk tes; situs pembeli memakai build biasa.
- Sekali saja di GitHub: Settings → Pages → Deploy from a branch → `gh-pages` / root.

## Keterbatasan yang diketahui

- **Dev statis sedang membuka semua paket.** `DEV_BUKA_SEMUA = true` di `web/src/config/akses.ts` (commit `1e1914e`, untuk cek ulang pemilik), jadi soal + kunci p02–p04 ikut ke GitHub Pages yang publik. Ini menyimpang dari keputusan "build statis dev ikut gerbang". Kembalikan ke `false` begitu pemilik selesai mengecek, dan wajib sebelum jualan.
- **Isi soal belum final.** p02–p04 masih `draf`: belum direview pemilik (terutama bobot TKP) dan kutipan pasal belum dicocokkan dengan teks resmi (daftar nomor di `docs/rencana-ebook-cpns.md`). Ebook masih berlencana "belum siap terbit".
- **Belum bisa membeli.** `TAUTAN_BELI` null dan produk Mayar belum dibuat, jadi tombol beli nonaktif.
- **Backend belum hidup.** Kode Firebase sudah ada, tapi proyek Firebase, App Hosting, Storage, dan webhook Mayar belum dibuat pemilik (`docs/firebase.md`). Sampai itu, situs server menutup p02–p04 dan login tidak tampil.
- **Ebook belum diunggah.** Setelah Storage aktif, pemilik menjalankan `docs/firebase.md` langkah 10 (izin tanda tangan + `tools/unggah-ebook.sh`) dan mengulang 10c tiap isi p02–p04 berubah. Sebelum itu tombol unduh menjawab "Ebook sedang disiapkan".
- **Tautan ebook bisa diteruskan** selama 10 menit, dan PDF yang sudah terunduh bisa disebar. Belum ada watermark nama/email pembeli di PDF.
- **Kunci belum aman penuh.** `nilaiUjian` mengecek hak paket, tapi pemilik paket bisa memanggilnya sebelum mengumpulkan (sesi ujian ditulis browser). Menutupnya = jam mulai/selesai dicatat server.
- **Belum ada batas perangkat** per akun (game edukasi: 3). Satu akun bisa dipakai bersama.
- **Masuk dengan Google lewat pindah halaman** (cadangan saat pop-up diblokir) bisa gagal di Safari karena `authDomain` beda domain dengan situs. Pop-up jalan normal.
- **Belum ada fitur hapus akun** di app. Permintaan hapus lewat kontak di /privasi, dihapus manual (`docs/data-pribadi.md`, bagian Keputusan terbuka).
- **Belum ada aturan lama simpan** untuk `orders` dan `activation_codes`; /privasi menulisnya apa adanya.
- **Nilai legal belum diisi**: `PENGELOLA`, `EMAIL_KONTAK`, `BERLAKU_SEJAK` masih `null`, dan `PENGEMBALIAN_DANA` masih usulan (`web/src/config/legal.ts`, `docs/firebase.md` langkah 12). Wajib sebelum jualan.
- **Belum ada bottom nav.** Ditambahkan saat halaman Riwayat dan Profil terpisah sudah ada.
- **Soal bergambar (`gambar`) belum ditampilkan** di app. Belum ada di `p01`.
- **Simbol `∧ ∨ ≡ ✓ ✗`** di pembahasan TIU `p01` dicetak dengan DejaVu Sans di PDF karena Geist tidak punya glyph-nya. Diputuskan dibiarkan.
- **Durasi dan ambang batas resmi** masih `null` di `config/skd.json`. Durasi latihan 1 menit per soal; ambang batas hanya dibandingkan untuk paket lengkap. Cek aturan BKN/KemenPAN-RB terbaru sebelum mengisinya.
- **Branch `claude/skema-json-bank`** masih ada di GitHub; pemilik menghapusnya manual.

## Langkah berikutnya (pilih salah satu)

Syarat minimal sebelum jualan: backend hidup (1), review + cek fakta p02–p04 lalu status `final` dan ebook dibuat ulang, nilai legal diisi, `DEV_BUKA_SEMUA = false`, `TAUTAN_BELI` diisi, uji beli sungguhan sekali (bayar → email kode → aktivasi → ujian → unduh ebook).

1. **Hidupkan backend.** Pemilik mengikuti `docs/firebase.md` (proyek, Blaze, Auth, Firestore, secret,
   deploy backend, App Hosting, webhook Mayar), lalu Claude mengisi `web/apphosting.yaml` dan `TAUTAN_BELI`.
2. **Review p02–p04 dan cek fakta**, lalu lengkapi `p01` jadi 110 soal. Dikerjakan per subtes (misalnya 24 soal TWK dulu), soal orisinal,
   `python3 tools/validasi.py bank/` wajib 0 galat sebelum setiap commit. Butuh banyak token.
3. **Pemeriksaan akhir tampilan.** `antislop` / `impeccable` sekali pada file UI yang sudah jadi
   (`web/src/components/`), sesuai aturan hemat token di CLAUDE.md.

Setelah backend hidup: fitur hapus akun di /profil (hapus Auth + `users/{uid}` dan subkoleksi lewat Cloud Function) dan aturan lama simpan data pesanan.

Setelah itu: halaman Riwayat dan Profil terpisah + bottom nav 4 item (Beranda, Try out, Riwayat, Profil),
sakelar tema terang/gelap di Profil, tampilan soal bergambar.

## Keputusan yang masih terbuka

- Urutan kerja: backend dulu atau review soal dulu.
- Kapan `DEV_BUKA_SEMUA` dikembalikan ke `false`.
- Kebijakan pengembalian dana (usulan di `web/src/config/legal.ts`), nama pengelola, kontak, dan lama simpan data pesanan.
- Sumber resmi untuk durasi dan ambang batas SKD tahun berjalan.
