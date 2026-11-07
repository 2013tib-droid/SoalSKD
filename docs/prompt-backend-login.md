# Prompt: backend + login (Firebase)

Prompt siap tempel untuk sesi baru yang mengerjakan langkah berikutnya no. 1 di
`docs/rencana-app.md`. Keputusannya dicatat di `CLAUDE.md` (Keputusan, 2026-11-07).

Kenapa Firebase, bukan Supabase: pola yang sama sudah jalan di produksi di repo
`2013tib-droid/Game-Edukasi-Anak` (login, kode aktivasi, webhook Mayar), jadi pemilik
cukup merawat satu jenis sistem. Bedanya: SoalSKD memakai Next.js dengan skor dihitung
di server, jadi hosting-nya harus punya server (Firebase App Hosting atau Vercel).
Cloud Functions mewajibkan paket Blaze (bayar sesuai pemakaian); pasang batas anggaran
di Google Cloud.

Yang perlu disiapkan pemilik: akun Google/Firebase dan akun Mayar.

## Prompt

```
Tugas: tambahkan backend + login ke SoalSKD pakai Firebase, meniru repo
2013tib-droid/Game-Edukasi-Anak (sudah jalan di produksi dengan penjualan sungguhan).

Baca dulu (sesuai CLAUDE.md): CLAUDE.md (bagian Keputusan), DESIGN.md, docs/pola.md,
docs/rencana-app.md (langkah berikutnya no. 1). Fetch dan cek main
(`claude/skd-stan-resource-analysis-c10e5n`) dulu, karena web/ dipegang sesi utama.

Referensi (baca seperlunya, cari dulu dengan grep, jangan baca seluruh repo):
clone read-only 2013tib-droid/Game-Edukasi-Anak, lalu lihat:
- CLAUDE.md bagian "Model Bisnis/akses" dan "Kode aktivasi DIKIRIM OTOMATIS setelah bayar di Mayar"
- src/auth/ (firebase.ts, AuthContext.tsx, LoginPage.tsx, GoogleSignInButton.tsx,
  ActivationPage.tsx, entitlements.ts, progressSync.ts)
- functions/src/index.ts (redeemActivationCode, mayarWebhook), firestore.rules
- docs/kirim-kode-otomatis.md
Tiru polanya, jangan salin mentah: SoalSKD pakai Next.js, bukan Vite.

Keputusan pemilik (jangan dibahas ulang):
- Backend: Firebase (Auth + Firestore + Cloud Functions), proyek Firebase TERPISAH
  dari game edukasi, region asia-southeast2 (Jakarta).
- Login: email + kata sandi DAN "Masuk dengan Google", sama seperti game edukasi.
- Penjualan: Mayar (QRIS/e-wallet) → webhook membuat kode aktivasi → dikirim ke email
  pembeli → pembeli login dan memasukkan kode di /aktivasi → akses p02–p04 terbuka.
  Isi TAUTAN_BELI di web/src/config/landing.ts dengan link Mayar setelah pemilik memberi.
- p01 tetap gratis tanpa login.
- Tombol "Masuk" di nav atas landing, di sebelah "Mulai Try Out". Setelah login: akun
  dengan menu Keluar.

Lingkup:
1. Firebase Auth di web/ (email+sandi, Google). Config dari env; tambah web/.env.example.
2. Halaman /masuk, /daftar, /aktivasi.
3. Firestore + firestore.rules: users/{uid} (paket dimiliki, hanya ditulis Cloud
   Function), sesi ujian, riwayat. Kode aktivasi tertutup total dari client.
4. Cloud Functions: redeemActivationCode + mayarWebhook (header X-Callback-Token),
   uji di Firebase Emulator.
5. Gerbang akses p02–p04: dicek di server (bukan cuma tampilan).
6. Simpan otomatis jawaban + riwayat ke Firestore saat login; tetap localStorage kalau
   belum login. Saat pertama login, pindahkan data localStorage ke akun.
7. Server action penilaian (web/src/app/ujian/[paket]/hasil/actions.ts) verifikasi
   token Firebase di server (firebase-admin) + cek hak paket.
8. Hosting dengan server untuk Next.js: bandingkan Firebase App Hosting vs Vercel
   (biaya, region dekat Indonesia, kemudahan), rekomendasikan satu, siapkan workflow
   deploy. Jangan deploy ke produksi tanpa izin pemilik.

Perhatian:
- Build statis GitHub Pages (STATIK=1, web/src/config/build.ts, penilai.statik.ts)
  harus tetap jalan: login dan gerbang dimatikan di mode statis.
- Kunci, bobot, pembahasan tetap tidak dikirim ke browser sebelum dikumpulkan.

Tampilan:
- Ikuti DESIGN.md (token, Geist, terang + gelap) dan pakai ulang pola di docs/pola.md.
- /masuk, /daftar, /aktivasi, menu akun = layar aplikasi → skill
  house-style:dashboard-design. Tombol Masuk di nav landing → /house-style:landing.
  Satu skill per masalah.
- Mobile-first, target tap ≥44px, nyaman satu tangan. Teks bahasa Indonesia, ringkas.
- Status: loading, error (sandi salah, kode tidak valid/terpakai, login dibatalkan),
  sudah login, sudah punya paket.
- Di akhir fitur: antislop/impeccable sekali saja, pada file yang berubah.

Pemilik bukan developer: tulis docs/firebase.md langkah demi langkah (buat proyek,
paket Blaze, aktifkan Auth Email + Google, Firestore Jakarta, secret webhook, URL
webhook di Mayar, isi env), mencontoh docs/kirim-kode-otomatis.md di game edukasi.

Selesai:
- `npm run typecheck` dan `npm run build` lulus (juga dengan STATIK=1); tes emulator lulus.
- Catat: keputusan → CLAUDE.md "Keputusan", pola baru → docs/pola.md, status →
  docs/rencana-app.md.
- Commit, push, buat PR. Jelaskan ke pemilik apa yang harus dia isi/klik di Firebase,
  Google, dan Mayar.
```
