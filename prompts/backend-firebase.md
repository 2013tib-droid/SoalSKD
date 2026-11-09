# Prompt sesi baru: hidupkan backend (Firebase + Mayar)

Salin teks di bawah ke sesi Claude baru.

---

Tugas sesi ini: menghidupkan backend SoalSKD, yaitu langkah 1 di "Langkah berikutnya" `docs/rencana-app.md`.
Kodenya sudah jadi (Auth, Firestore, Cloud Functions, Storage, App Hosting, webhook Mayar). Yang belum: proyek
dan layanannya dibuat di Console oleh saya (pemilik), lalu konfigurasi repo diisi.

Sebelum mulai:
1. `git fetch` lalu cek branch utama `claude/skd-stan-resource-analysis-c10e5n` (repo tidak punya `main`). Baca
   `CLAUDE.md`, `docs/firebase.md`, `docs/rencana-app.md` bagian keterbatasan, dan `docs/koordinasi-sesi.md`.
2. Ikuti aturan hemat token di `CLAUDE.md`: baca seperlunya, jangan muat skill desain (tugas ini bukan UI).

Cara kerja:
- Pandu saya langkah demi langkah sesuai `docs/firebase.md` (langkah 1–12), **satu langkah per pesan**.
  Saya bukan developer dan membuka dari HP: tulis singkat, sebut tombol/menu persis, beri tautan Console yang
  sudah berisi PROJECT_ID begitu saya menyebutkannya. Tunggu konfirmasi atau tangkapan layar saya sebelum lanjut.
- Kalau tampilan Console berbeda dengan dokumen, sesuaikan arahannya lalu betulkan `docs/firebase.md`.
- **Rahasia jangan pernah diminta di chat** (App Password Gmail, Webhook Token Mayar, kunci service account).
  Itu saya isi sendiri di Secret Manager / GitHub Secrets. Yang boleh saya kirim: Project ID, 4 nilai config web
  (bukan rahasia), nama bucket, alamat situs, tautan produk Mayar.
- Bagian repo yang Claude kerjakan:
  - isi 4 nilai `NEXT_PUBLIC_FIREBASE_*` di `web/apphosting.yaml` (langkah 8.1);
  - isi `TAUTAN_BELI` di `web/src/config/landing.ts` setelah produk Mayar ada (langkah 9.5);
  - bantu baca log GitHub Actions "Deploy backend" kalau gagal (dry run dulu, baru sungguhan);
  - nilai legal di `web/src/config/legal.ts` (langkah 12) hanya diisi dengan data yang saya berikan, tanpa karangan.
- Sebelum commit: `cd web && npm run typecheck && npm run build`; kalau `functions/` berubah, `cd functions && npm run uji`.
- Kerjakan di branch sesi ini, commit + push, lalu buat PR ke branch utama setelah saya minta.

Batasan:
- **Jangan ubah `DEV_BUKA_SEMUA`** di `web/src/config/akses.ts`; sengaja `true` untuk testing saya.
- **Jangan deploy/merge ke branch `produksi`** tanpa izin eksplisit saya.
- Jangan ubah `bank/`, `schema/`, `tools/`, `ebook/` (bukan tugas sesi ini).
- Hal yang membutuhkan keputusan saya (misalnya kebijakan pengembalian dana, domain sendiri): tanyakan, jangan diputuskan sendiri.

Selesai kalau langkah 11 di `docs/firebase.md` (uji beli sungguhan: bayar → email kode → aktivasi → ujian p02 →
unduh ebook) berhasil. Tutup dengan memperbarui `docs/rencana-app.md` (hapus keterbatasan "Backend belum hidup" /
"Belum bisa membeli" yang sudah beres) dan tambah satu baris di "Keputusan" `CLAUDE.md` kalau ada keputusan baru.
