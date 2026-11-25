# SoalSKD

Aplikasi try out SKD CPNS (TWK, TIU, TKP). Mayoritas pengguna membuka di HP.

## Stack & perintah

- Framework: Next.js
- Styling / komponen UI: Tailwind (token dari DESIGN.md lewat variabel CSS), ikon Phosphor
- App di `web/`. Dev: `npm run dev` · Typecheck: `npm run typecheck` · Build: `npm run build` (jalankan dari `web/`)
- Bank soal: paket berbayar di repo privat `SoalSKD-bank` (clone di sebelah repo ini; tanpa itu hanya p01 yang ada) · validasi `python3 tools/validasi.py` (seluruh bank) atau `python3 tools/validasi.py bank/p01.json` / `bank/` (wajib 0 galat sebelum commit soal) · tes validator `python3 tools/test_validasi.py` · buat paket: `docs/cara-membuat-paket.md` · setelah menambah/mengubah paket: `python3 tools/bank_privat.py katalog` (metadata publik) lalu pemilik `sh tools/unggah-bank.sh <bucket>` (Storage privat)
- Tes: `cd web && npm run uji:unit` · `cd functions && npm run uji` (emulator, Mayar tiruan) · `cd web && STATIK=1 npm run build && npm run cek-bocor && npm run uji:e2e`

## Sumber kebenaran (baca ini dulu, sebelum memanggil skill)

- `DESIGN.md`: token visual (warna, font, spacing, radius, motion). Sudah final, jadi ikuti saja.
- `docs/pola.md`: komponen dan pola yang sudah ada. Pakai ulang sebelum membuat yang baru.
- `docs/rencana-app.md`: status aplikasi, keterbatasan, dan langkah berikutnya.
- Bagian "Keputusan" di bawah: hal yang sudah diputuskan. Jangan dibahas ulang.

## Aturan hemat token

1. **DESIGN.md dulu, skill belakangan.** Panggil skill desain hanya untuk keputusan yang belum dijawab DESIGN.md atau `docs/pola.md`.
2. **Satu skill per masalah.** Jangan memuat beberapa skill yang tumpang tindih untuk satu tugas.
3. **Skill berat hanya di akhir.** `antislop` (~13k token) dan `impeccable` dipakai sekali per fitur yang selesai, hanya pada file yang berubah, bukan per layar.
4. **Jangan baca `references/` skill secara utuh.** Ambil satu file yang relevan saja.
5. **Baca kode seperlunya.** Cari dulu (grep), lalu baca potongan yang relevan. Jangan membaca seluruh folder.
6. **Edit, jangan tulis ulang.** Ubah bagian kecil. Jangan menghasilkan ulang file besar.
7. **Tutup setiap fitur dengan mencatat:**
   - keputusan visual baru → `DESIGN.md`
   - komponen/pola baru yang bisa dipakai ulang → satu baris di `docs/pola.md`
   - keputusan arsitektur/produk → satu baris di "Keputusan" di bawah
   - pelajaran yang berlaku untuk **semua** proyek → usulkan ke repo `agensi` (`house-style`)

## Keputusan

<!-- Format: YYYY-MM-DD · keputusan · alasan singkat -->
2026-11-06 · Mobile-first; mayoritas pengguna buka di HP · konteks pengguna
2026-11-06 · House-style menang. Layar aplikasi pakai `house-style:dashboard-design`; landing page (kalau ada) pakai `/house-style:landing`; skill lain dipilih lewat `house-style:ui-router` · konsistensi + hemat token
2026-11-06 · Pola ujian wajib: grid nomor soal berstatus (belum / dijawab / ragu-ragu), timer selalu terlihat + peringatan saat hampir habis, jawaban tersimpan otomatis, nyaman satu tangan · kebutuhan inti try out
2026-11-06 · Soal harus orisinal; jangan salin dari buku atau aplikasi lain · hak cipta & kualitas
2026-11-06 · Format SKD (jumlah soal, durasi, skor) dan passing grade disimpan sebagai konfigurasi, tidak di-hardcode tanpa sumber; beri catatan "cek aturan BKN/KemenPAN-RB terbaru" · aturan bisa berubah tiap tahun
2026-11-06 · DESIGN.md "SoalSKD Tenang": biru tenang, Geist/Geist Mono, terang + gelap, Next.js + Tailwind · jawaban pengguna; saran claymorphism dari ui-ux-pro-max ditolak karena bentrok dengan house-style
2026-11-06 · Bottom nav di HP (bukan drawer) dan teks soal 16px · nyaman satu tangan + teks bacaan panjang
2026-11-06 · App Next.js di `web/`, soal dibaca dari `bank/*.json` di server; kunci, bobot, dan pembahasan tidak dikirim ke browser · cegah bocor kunci
2026-11-06 · Simpan otomatis sementara di localStorage; sinkron ke server menyusul saat ada backend · belum ada backend
2026-11-06 · Data soal: satu JSON per paket di `bank/` sesuai `schema/paket.schema.json` (lihat `docs/skema-soal.md`), dipakai app dan ebook; format SKD resmi di `config/skd.json`, durasi dan ambang batas `null` sampai ada sumber · satu sumber kebenaran untuk dua produk
2026-11-06 · Skor dihitung di server (server action); kunci dan pembahasan baru dikirim setelah ujian dikumpulkan · belum anti-curang penuh: action bisa dipanggil langsung, perlu sesi server saat ada backend
2026-11-06 · `web/` membaca `config/skd.json` dan bank skema 1 langsung; `web/src/config/skd.ts` hanya pengaturan app · satu sumber kebenaran; `bank/sample-15.json` (format lama) tidak dipakai app
2026-11-06 · Satu area satu sesi: `bank/`, `schema/`, `tools/`, `web/` dipegang sesi utama; sesi lain fetch dan cek main dulu sebelum membuat file di area itu · PR #1 ditutup karena skema dan validatornya dobel
2026-11-06 · Beranda tanpa bottom nav dulu; nav 4 item dari DESIGN.md ditambahkan saat ada halaman Riwayat dan Profil terpisah · hindari tautan ke halaman yang belum ada
2026-11-06 · Versi pertama ebook 330 soal (p02–p04, 110 soal per paket), nama tetap "SoalSKD", p01 jadi standar gaya · pemilik menyerahkan keputusan ("gas aja"); waktu ke ujian ±1 bulan
2026-11-06 · Dev sementara di GitHub Pages (`/SoalSKD/development/<nama>/`) lewat build statis `STATIK=1`: kunci ikut ke browser, noindex, beberapa hari saja; situs pembeli nanti di domain sendiri dengan build server · pemilik menerima risiko repo publik untuk tes cepat
2026-11-07 · Landing di `/`, daftar paket pindah ke `/try-out`; testimoni dan harga disembunyikan sampai ada data asli di `web/src/config/landing.ts`; ranking tidak diklaim sebelum ada backend · tanpa klaim palsu
2026-11-07 · Harga perkenalan bundel 3 try out (p02–p04) + ebook PDF: Rp9.900, tanpa harga coret; naik setelah ada testimoni/paket bertambah; utamakan pembayaran QRIS/e-wallet (biaya tetap VA terlalu besar di harga ini) · mengejar jumlah pembeli, pesaing besar Rp15.000/3 TO
2026-11-07 · Tombol beli di kartu harga menunjuk `TAUTAN_BELI` (checkout QRIS/e-wallet atau wa.me); selama null tampil nonaktif "Pembelian segera dibuka". Tombol coba gratis membuka `PAKET_GRATIS` (p01) · belum ada backend pembayaran, tanpa tautan mati
2026-11-07 · Landing tanpa skip link "Langsung ke isi"; cukup landmark `<nav>`/`<main>` · tautan itu muncul di HP dan membingungkan pemilik/pengguna
2026-11-07 · Backend Firebase proyek terpisah dari game edukasi: Auth (email+sandi dan Google), Firestore + Cloud Functions di Jakarta (`asia-southeast2`). `users/{uid}.paket` hanya ditulis function `redeemActivationCode`; `activation_codes`, `orders`, `config`, `redeem_attempts` tertutup dari client · meniru pola game edukasi yang sudah jualan; langkah pemilik di `docs/firebase.md`
2026-11-07 · Penjualan: Mayar `payment.received` → `mayarWebhook` (header `X-Callback-Token`) membuat satu kode per pesanan dan mengirimnya ke email pembeli → /aktivasi. Tukar kode wajib email terverifikasi; produk ditebak dari nama (bundel + 3) atau `config/mayar_products` · otomatis tanpa kirim manual, kode tak pernah di log
2026-11-07 · Gerbang paket dicek di server: soal paket berbayar diminta lewat server action `muatUjianBerbayar` dan penilaian `nilaiUjian` memverifikasi ID token (firebase-admin) + `users/{uid}.paket`; satu keputusan di `web/src/lib/akses-server.ts`, paket gratis di `web/src/config/akses.ts` (p01). Build statis: login dan gerbang mati · halaman statis tidak boleh menanam soal berbayar
2026-11-07 · localStorage tetap tempat kerja ujian; saat login disalin ke `users/{uid}/sesi` dan `/riwayat` (`web/src/lib/sinkron.ts`), data sebelum login dipindah ke akun, keluar = data lokal dihapus. SDK Firebase hanya dimuat kalau perangkat pernah login atau halaman butuh akun · ujian tidak menunggu jaringan; landing tetap ringan
2026-11-07 · Hosting situs pembeli: Firebase App Hosting `asia-southeast1`, root `web`, live branch `produksi`; Vercel ditolak (Hobby non-komersial, Pro US$20/bulan terlalu berat di harga Rp9.900). Deploy produksi hanya atas izin pemilik · biaya + satu proyek Google
2026-11-07 · Dev statis tetap menampilkan tombol "Masuk" (pratinjau posisi); /masuk di sana menjelaskan login aktif di situs pembeli · pemilik mencari tombolnya di dev
2026-11-07 · Build statis dev ikut gerbang: p02–p04 tampil terkunci ("Berbayar"), soal dan kuncinya tidak masuk `out/`; hanya p01 bisa dikerjakan · pemilik ingin try out berbayar nonaktif sampai dibayar, juga di dev
2026-11-07 · Layar ujian punya tombol keluar (X di topbar) dengan konfirmasi; jawaban tersimpan, timer tetap berjalan, lanjut dari /try-out · pengguna merasa terjebak di layar ujian
2026-11-07 · Layar masuk/daftar/aktivasi sama persis di dev dan produksi: tanpa pesan "versi uji"; saat login mati form tetap tampil dan aksi menjawab "Login sedang tidak bisa dipakai" · pemilik ingin dev = produksi; menggantikan pesan /masuk di keputusan dev statis sebelumnya
2026-11-07 · Landing pakai gaya promo dari mockup pemilik (hero bercahaya, mockup HP, masalah → solusi, kartu fitur berwarna, banner CTA biru, aksen kuning); bayangan/gradien hanya di landing, app tetap datar. Isi mockup yang tidak bisa dibuktikan (12.000+ pengguna, bintang, testimoni karangan, Rp15.000, "akses selamanya", foto orang) tidak dipakai · pemilik membandingkan dengan desain lain; tetap tanpa klaim palsu
2026-11-07 · Ebook PDF: file di Storage privat `ebook/edisi-1.pdf` (`storage.rules` tolak semua client), diunduh lewat Cloud Function onCall `unduhEbook` (asia-southeast2) yang mengecek `users/{uid}.paket` punya minimal satu dari p02–p04 lalu memberi signed URL v4 10 menit bernama `SoalSKD-Edisi-1.pdf`; tombol di /try-out hanya untuk pemilik paket dan tidak ikut build statis. onCall dipilih, bukan server action: hak paket dan bucket satu tempat di functions, bisa dites di emulator seperti tukar kode, dan tidak bergantung pada server Next.js · PDF tidak pernah masuk repo/`out/`; email kode hanya menyebut /try-out
2026-11-07 · Halaman /privasi dan /syarat: teks di `web/src/konten/*.md`, nilai pemilik (pengelola, kontak, tanggal berlaku, teks pengembalian dana) di `web/src/config/legal.ts` (`null` = disembunyikan), setiap pernyataan harus cocok dengan `docs/data-pribadi.md`. Belum ada hapus akun di app: lewat permintaan ke kontak. Pengembalian dana masih usulan sampai disetujui pemilik · syarat Mayar + OAuth consent Google, tanpa klaim palsu
2026-11-07 · Landing tanpa "Cara membaca layar ujian" dan tanpa contoh soal interaktif; panduan layar ujian pindah ke /try-out (bisa dibuka-tutup, sebelum daftar paket), contoh soal cukup lewat paket gratis p01. Urutan landing: hero → harga → masalah/solusi → … → banner CTA → FAQ · permintaan pemilik: landing lebih ringkas, harga lebih awal
2026-11-22 · Simulasi paket lengkap 100 menit (SKD CPNS TA 2024, KepmenPANRB 321/2024) di `config/skd.json`; paket belum lengkap (demo p01) tetap 1 menit per soal; ambang batas tetap `null` · audit akademik; teks PDF belum dicocokkan langsung
2026-11-22 · Setiap paket lengkap memuat TIU figural 1 analogi + 1 ketidaksamaan + 1 serial gambar (mengganti 3 TIU, komposisi tetap 30/35/45); SVG + verifikasi kunci di `tools/buat_figural.py`, dikirim ke browser sebagai data URI lewat jalur soal yang sama (ikut gerbang) · kisi-kisi TIU figural sebelumnya kosong
2026-11-24 · Polish UI/UX: CTA utama landing "Coba Try Out Gratis" (→ paket gratis, juga di banner penutup), CTA kedua "Lihat Paket Latihan" (→ #harga); strip angka membedakan paket mini gratis dan try out lengkap (semua dari `bank/` + config); jumlah soal per bundel dihitung dari bank; status bank `draf` tidak tampil ke pengguna (diganti chip Gratis / Paket mini / Simulasi lengkap); hasil diberi ringkasan + saran subtes terlemah + langkah berikutnya; layar "siap mulai" sebelum timer DITUNDA karena mengubah saat timer mulai (perlu izin pemilik) · brief pemilik "UI/UX final polish", tanpa ubah harga, skor, timer, atau data soal
2026-11-24 · Section landing tidak lagi disembunyikan sampai di-scroll (`Muncul` tanpa animasi masuk); tombol header landing jadi "Try Out" bergaya sekunder ke /try-out, CTA utama tetap "Coba Try Out Gratis" di hero · audit eksternal melihat section kosong di screenshot halaman penuh dan membaca tombol header sebagai CTA utama
2026-11-21 · Bundel 2 = p05, p06, p07 + ebook PDF Edisi 2, Rp9.900, dijual terpisah dari Bundel 1 (p02–p04 + Edisi 1): produk `bundel-3to-2`, `unduhEbook` mengecek hak per edisi (`ebook/edisi-2.pdf`), produk/edisi di `functions/src/produk.ts` dengan cermin `web/src/config/produk.ts`; nama Mayar yang ragu → manual. Merge ke branch utama diizinkan untuk dev; "Deploy backend" dan branch `produksi` tidak · keputusan pemilik
2026-11-24 · Pembelian otomatis tanpa kode dan tanpa Gmail: pembeli wajib login (Google diutamakan, email+sandi terverifikasi) → `buatPesanan` membuat `orders/{orderId}` terikat uid + Single Payment Request Mayar (`extraData.orderId`, harga dari `functions/src/produk.ts`) → akses hanya setelah server memanggil API Mayar `GET /transactions/{id}` (status `paid` + id/nominal/produk cocok), dalam satu transaksi Firestore. Webhook (`X-Callback-Token`) dan tombol "Cek Status Pembayaran" hanya pemicu; redirect/screenshot tidak pernah membuka akses. Kode aktivasi tinggal cadangan dari `functions/scripts/admin.mjs`; refund = `cabut-pesanan` manual (Mayar tanpa event refund). nodemailer, `GMAIL_APP_PASSWORD`, `EMAIL_PENGIRIM`, `config/mayar_products` dihapus; secret `MAYAR_API_KEY` + `MAYAR_WEBHOOK_TOKEN`. Tombol beli ke `/beli` dan baru aktif saat `PENJUALAN_DIBUKA` (menggantikan `TAUTAN_BELI`) · keputusan pemilik atas audit E1; docs Mayar dibaca 2026-11-24
2026-11-24 · Bank soal berbayar: situs pembeli membacanya dari Storage privat `bank/<id>.json` (`tools/unggah-bank.sh`), bukan dari repo; daftar/judul dari `bank/katalog.json` (metadata saja); build statis tidak pernah membaca paket berbayar dan `web/scripts/cek-bocor.mjs` menggagalkan deploy dev yang membawanya; `DEV_BUKA_SEMUA = false` di semua deployment publik. Berkas p02+ dan gambarnya dipindah ke repo PRIVAT `2013tib-droid/SoalSKD-bank` (clone di `../SoalSKD-bank` atau `BANK_PRIVAT_DIR`, dicari `tools/lokasi_bank.py`); repo publik hanya p01 + katalog; repo SoalSKD diprivatkan pemilik saat deploy, history lama masih memuat p02–p07 · prioritas kritis sebelum launching; tanpa ubah visibilitas/force push tanpa izin

