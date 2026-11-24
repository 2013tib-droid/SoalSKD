# Rencana Aplikasi Try Out (`web/`)

Status per 2026-11-24. Area `web/`, `bank/`, `schema/`, dan `tools/` dipegang sesi utama (lihat `docs/koordinasi-sesi.md`).

## Sudah jadi

| Bagian | Isi | Path |
|---|---|---|
| Layar ujian | Topbar + timer (normal/peringatan/kritis), pilihan A–E, action bar bawah, grid nomor berstatus (sheet di HP, panel di desktop), simpan otomatis, konfirmasi kumpulkan, pintasan keyboard | `/ujian/<paket>` |
| Halaman hasil | Skor per subtes dihitung di server, pembahasan per soal (alasan per opsi, inti, konsep, tips, rujukan), filter di URL | `/ujian/<paket>/hasil` |
| Landing | Gaya promo: hero + mockup HP → harga (dua kartu bundel, masing-masing Rp9.900) → masalah/solusi → keunggulan → cara kerja → apa itu SKD → banner CTA → FAQ (termasuk beda Bundel 1 dan 2); angka dari `bank/` dan config. Tombol beli per bundel ke `/beli?produk=…`, nonaktif selama `PENJUALAN_DIBUKA[bundel]` false | `/` |
| Beranda | Panduan layar ujian (buka-tutup), kartu lanjutkan ujian, daftar paket dari `bank/` (paket terkunci dikelompokkan per bundel: Bundel 1 p02–p04, Bundel 2 p05–p07, tiap kartu dengan harga dan tombolnya), aksi per state, riwayat skor, kartu unduh ebook per edisi yang dimiliki | `/try-out` |
| Data | Bank skema 1 dan `config/skd.json` dibaca langsung; Markdown GFM dirender | `web/src/lib/` |
| Akun & penjualan | Login email+sandi dan Google; **pembelian otomatis tanpa kode**: `/beli` (login → `buatPesanan` → Single Payment Request Mayar terikat uid) → verifikasi server lewat API Mayar (`cekPembayaran`, webhook hanya pemicu) → paket aktif; `/akun` (paket saya, lanjutkan, ebook, riwayat + status pembelian, bantuan); kode cadangan lewat alat admin + `/aktivasi`; pencabutan (refund) lewat alat admin; gerbang paket berbayar di server; bank berbayar dari Storage privat; sinkron jawaban/riwayat; `unduhEbook` per edisi; rules Firestore + Storage. Tes: 51 unit + 120 emulator (Mayar tiruan) + 8 gerbang web di emulator + 10 unit web + 28 E2E | `/beli`, `/akun`, `/masuk`, `/daftar`, `/aktivasi`, `functions/`, `firestore.rules`, `storage.rules` |
| Legal | Kebijakan Privasi dan Syarat & Ketentuan dari Markdown + config, ditautkan dari footer landing, /try-out, /daftar, /aktivasi, /akun; inventaris data di `docs/data-pribadi.md` | `/privasi`, `/syarat` |
| Ebook | Pembuat PDF dari `bank/*.json` (dikerjakan sesi ebook); unduhan pembeli lewat kartu "Ebook PDF Edisi N" di /try-out → `unduhEbook({ edisi })` → signed URL 10 menit dari Storage privat `ebook/edisi-1.pdf` (Bundel 1) atau `ebook/edisi-2.pdf` (Bundel 2); build + unggah `tools/unggah-ebook.sh <bucket> <edisi>` | `ebook/`, `/try-out` |

Paket di `bank/`: `p01` gratis (20 dari 110 soal); Bundel 1 = `p02`–`p04`, Bundel 2 = `p05`–`p07` (110 soal masing-masing, dijual terpisah, Rp9.900 per bundel). Semuanya masih berstatus `draf`; validator 0 galat (satu peringatan: p01 belum penuh).

## Deploy dev (sementara)

- URL: `https://2013tib-droid.github.io/SoalSKD/development/main/`. Workflow `.github/workflows/deploy-dev.yml`
  jalan otomatis tiap push ke branch utama yang mengubah `web/`, `bank/`, atau `config/`, dan bisa dijalankan manual.
- Build statis: `cd web && STATIK=1 BASE_PATH=/SoalSKD/development/main npm run build` → `web/out/`.
  Skor dihitung di browser (`src/lib/nilai.ts`, fungsi yang sama dengan server action), jadi kunci dan
  pembahasan ikut terkirim. Hanya untuk tes; situs pembeli memakai build biasa.
- Sekali saja di GitHub: Settings → Pages → Deploy from a branch → `gh-pages` / root.
- Build dev hanya memuat paket gratis: `lib/soal.ts` tidak membaca paket berbayar saat `STATIK=1`, dan `scripts/cek-bocor.mjs` menggagalkan deploy bila id/teks/pembahasan/gambar paket berbayar terbawa ke `out/`.

## Keterbatasan yang diketahui

- **Soal berbayar sudah tersebar publik (audit 2026-11-24).** p02–p07 (soal, kunci, pembahasan, SVG) ada di repo GitHub publik sejak 2026-11-06 (history + 27 branch) dan di GitHub Pages `development/main` (p02–p07), `development/cek-lengkap` dan `development/modest-franklin` (p02–p04) lengkap dengan kunci. `DEV_BUKA_SEMUA` sudah `false` di kode, tapi Pages baru bersih setelah deploy dev dijalankan ulang/dihapus, dan history git tetap memuatnya sampai repo diprivatkan atau history ditulis ulang (keduanya butuh izin pemilik). Anggap p02–p07 sudah bocor.
- **Bank berbayar masih ada di `bank/` repo** (untuk validator, ebook, dan sesi lain). Situs pembeli tidak membacanya (Storage privat, `tools/unggah-bank.sh`); pemindahan berkasnya ke repo privat menunggu keputusan pemilik.
- **Isi soal belum final.** p02–p07 masih `draf`: belum direview pemilik (terutama bobot TKP) dan kutipan pasal belum dicocokkan dengan teks resmi (daftar nomor di `docs/rencana-ebook-cpns.md`). Ebook masih berlencana "belum siap terbit".
- **Belum bisa membeli.** `PENJUALAN_DIBUKA` kedua bundel `false`; API key + webhook Mayar belum disimpan, jadi tombol beli nonaktif.
- **Backend belum hidup.** Kode Firebase sudah ada dan teruji di emulator (Mayar tiruan), tapi proyek Firebase, App Hosting, Storage (ebook + bank berbayar), secret Mayar, dan webhook belum dibuat pemilik (`docs/firebase.md`). Integrasi Mayar sungguhan **belum pernah diuji**. Sampai itu, situs server menutup p02–p07 dan login tidak tampil.
- **Refund/chargeback manual.** Mayar tidak punya event refund; pencabutan akses lewat `functions/scripts/admin.mjs cabut-pesanan`.
- **Header `X-Callback-Token`** webhook tidak tertulis di docs Mayar (terbukti di game edukasi). Webhook hanya pemicu, jadi kalau Mayar mengubahnya, pembeli tetap bisa aktif lewat Cek Status.
- **Ebook belum diunggah.** Setelah Storage aktif, pemilik menjalankan `docs/firebase.md` langkah 10 (izin tanda tangan + `tools/unggah-ebook.sh <bucket> edisi-1` dan `edisi-2`) dan mengulang 10c tiap isi paket edisi itu berubah. Sebelum itu tombol unduh menjawab "Ebook sedang disiapkan".
- **Tautan ebook bisa diteruskan** selama 10 menit, dan PDF yang sudah terunduh bisa disebar. Belum ada watermark nama/email pembeli di PDF.
- **Kunci belum aman penuh.** `nilaiUjian` mengecek hak paket, tapi pemilik paket bisa memanggilnya sebelum mengumpulkan (sesi ujian ditulis browser). Menutupnya = jam mulai/selesai dicatat server.
- **Belum ada batas perangkat** per akun (game edukasi: 3). Satu akun bisa dipakai bersama.
- **Masuk dengan Google lewat pindah halaman** (cadangan saat pop-up diblokir) bisa gagal di Safari karena `authDomain` beda domain dengan situs. Pop-up jalan normal.
- **Belum ada fitur hapus akun** di app. Permintaan hapus lewat kontak di /privasi, dihapus manual (`docs/data-pribadi.md`, bagian Keputusan terbuka).
- **Belum ada aturan lama simpan** untuk `orders`, `mayar_events`, `mayar_ref`, dan `activation_codes`; /privasi menulisnya apa adanya.
- **Nilai legal belum diisi**: `PENGELOLA`, `EMAIL_KONTAK`, `BERLAKU_SEJAK` masih `null`, dan `PENGEMBALIAN_DANA` masih usulan (`web/src/config/legal.ts`, `docs/firebase.md` langkah 12). Wajib sebelum jualan.
- **Belum ada bottom nav.** Ditambahkan saat halaman Riwayat dan Profil terpisah sudah ada.
- **Soal figural** tampil di ujian dan pembahasan (`GambarSoal`). Teks alt menggambarkan isi gambar, tetapi soal rotasi/pencerminan (mis. p03-063) tetap sulit dikerjakan dengan pembaca layar. `p01` belum punya soal figural.
- **Simbol `∧ ∨ ≡ ✓ ✗`** di pembahasan TIU `p01` dicetak dengan DejaVu Sans di PDF karena Geist tidak punya glyph-nya. Diputuskan dibiarkan.
- **Durasi** paket lengkap 100 menit (SKD CPNS TA 2024, KepmenPANRB 321/2024, `config/skd.json`); teks PDF-nya belum dicocokkan langsung (bkn.go.id diblokir dari lingkungan kerja). Paket belum lengkap (p01) tetap 1 menit per soal. **Ambang batas** masih `null`. Cek aturan BKN/KemenPAN-RB terbaru.
- **Ebook PDF Edisi 1 dan 2 belum memuat revisi audit 2026-11-22** (soal figural baru, perbaikan p02/p05/p07). Buat ulang dan unggah sebelum jualan.
- **Branch `claude/skema-json-bank`** masih ada di GitHub; pemilik menghapusnya manual.

## Langkah berikutnya (pilih salah satu)

Syarat minimal sebelum jualan: backend hidup (1), bank berbayar diunggah ke Storage, keputusan pemilik soal repo publik/bocoran p02–p07, review + cek fakta p02–p07 lalu status `final` dan kedua edisi ebook dibuat ulang, nilai legal diisi, uji beli sungguhan sekali (`docs/firebase.md` langkah 11: login → bayar → paket aktif otomatis → ujian → unduh ebook), lalu `PENJUALAN_DIBUKA` dinyalakan.

1. **Hidupkan backend.** Pemilik mengikuti `docs/firebase.md` (proyek, Blaze, Auth, Firestore, secret,
   deploy backend, App Hosting, webhook Mayar, bank + ebook ke Storage), lalu Claude mengisi `web/apphosting.yaml` dan menyalakan `PENJUALAN_DIBUKA` setelah uji beli lulus.
2. **Review p02–p07 dan cek fakta**, lalu lengkapi `p01` jadi 110 soal. Dikerjakan per subtes (misalnya 24 soal TWK dulu), soal orisinal,
   `python3 tools/validasi.py bank/` wajib 0 galat sebelum setiap commit. Butuh banyak token.
3. **Pemeriksaan akhir tampilan.** `antislop` / `impeccable` sekali pada file UI yang sudah jadi
   (`web/src/components/`), sesuai aturan hemat token di CLAUDE.md.

Setelah backend hidup: fitur hapus akun di /profil (hapus Auth + `users/{uid}` dan subkoleksi lewat Cloud Function) dan aturan lama simpan data pesanan.

Setelah itu: halaman Riwayat dan Profil terpisah + bottom nav 4 item (Beranda, Try out, Riwayat, Profil),
sakelar tema terang/gelap di Profil.

## Keputusan yang masih terbuka

- Urutan kerja: backend dulu atau review soal dulu.
- Kebijakan pengembalian dana (usulan di `web/src/config/legal.ts`), nama pengelola, kontak, dan lama simpan data pesanan.
- Sumber resmi untuk durasi dan ambang batas SKD tahun berjalan.
