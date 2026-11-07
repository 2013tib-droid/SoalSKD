# SoalSKD

Aplikasi try out SKD CPNS (TWK, TIU, TKP). Mayoritas pengguna membuka di HP.

## Stack & perintah

- Framework: Next.js
- Styling / komponen UI: Tailwind (token dari DESIGN.md lewat variabel CSS), ikon Phosphor
- App di `web/`. Dev: `npm run dev` · Typecheck: `npm run typecheck` · Build: `npm run build` (jalankan dari `web/`)
- Bank soal: validasi `python3 tools/validasi.py` (seluruh bank) atau `python3 tools/validasi.py bank/p01.json` / `bank/` (wajib 0 galat sebelum commit soal) · tes validator `python3 tools/test_validasi.py` · buat paket: `docs/cara-membuat-paket.md`

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
