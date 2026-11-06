# SoalSKD

Aplikasi try out SKD CPNS (TWK, TIU, TKP). Mayoritas pengguna membuka di HP.

## Stack & perintah

- Framework: Next.js
- Styling / komponen UI: Tailwind (token dari DESIGN.md lewat variabel CSS), ikon Phosphor
- App di `web/`. Dev: `npm run dev` · Typecheck: `npm run typecheck` · Build: `npm run build` (jalankan dari `web/`)
- Bank soal: validasi `python3 tools/validasi.py` (wajib 0 galat sebelum commit soal) · tes validator `python3 tools/test_validasi.py`

## Sumber kebenaran (baca ini dulu, sebelum memanggil skill)

- `DESIGN.md`: token visual (warna, font, spacing, radius, motion). Sudah final, jadi ikuti saja.
- `docs/pola.md`: komponen dan pola yang sudah ada. Pakai ulang sebelum membuat yang baru.
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
