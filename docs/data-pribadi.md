# Inventaris data pribadi

Sumber kebenaran untuk `/privasi` (`web/src/konten/privasi.md`). **Setiap kali fitur menambah, mengubah, atau menghapus data yang disimpan, perbarui tabel ini lalu halaman privasi.** Status per 2026-11-07, dicek dengan grep pada kode.

## Di perangkat pengguna (browser)

| Data | Sumber | Tempat simpan | Tujuan | Lama simpan | File kode |
|---|---|---|---|---|---|
| Sesi ujian: `jawaban`, `ragu`, `indeks`, `berakhirPada`, `selesai`, `disimpanPada` | pengguna | localStorage `soalskd:ujian:<paket>` | simpan otomatis, lanjut ujian, timer tidak ter-reset | sampai "Ulangi", Keluar (bila sudah tersalin ke akun), atau data browser dihapus | `web/src/components/ujian/use-ujian.ts` |
| Riwayat skor: `paket`, `judul`, `total`, `totalMaks`, `perSubtes`, `percobaan`, `dicatatPada` (maks 50) | hasil penilaian | localStorage `soalskd:riwayat` | daftar riwayat di /try-out | sama dengan di atas | `web/src/lib/riwayat.ts` |
| Penanda pernah masuk (`"1"`) | app | localStorage `soalskd:pernah-masuk` | SDK Firebase hanya dimuat di perangkat yang pernah login | dihapus saat status keluar | `web/src/components/akun/auth.tsx` |
| Penanda login Google lewat pindah halaman | app | sessionStorage `soalskd:google-redirect` | membaca hasil redirect Google | dihapus setelah dibaca / tab ditutup | `web/src/components/akun/auth.tsx` |
| Sesi login Firebase (token) | Firebase Auth SDK | IndexedDB (cadangan localStorage), bawaan `getAuth()` | tetap masuk | sampai Keluar | `web/src/lib/firebase/klien.ts` |

Tidak ada: cookie buatan app, analytics, piksel, pelacak pihak ketiga (grep `analytics|gtag|pixel|sentry|cookie` kosong). Font Geist lewat paket `geist` (next/font lokal), bukan Google Fonts.

## Di server (Google Firebase / Google Cloud)

| Data | Sumber | Tempat simpan | Tujuan | Lama simpan | File kode |
|---|---|---|---|---|---|
| Akun: uid, email, hash sandi, status verifikasi, penyedia, waktu daftar & masuk terakhir. Google: + nama & foto profil (dicatat Firebase Auth; app hanya memakai uid & email) | pengguna / Google | Firebase Authentication | login | selama akun ada; belum ada hapus akun di app | `web/src/components/akun/auth.tsx` |
| `users/{uid}`: `paket`, `produk`, `diperbaruiPada` | `redeemActivationCode` | Firestore asia-southeast2 | gerbang paket berbayar + ebook | selama akun ada | `functions/src/index.ts`, `web/src/lib/firebase/admin.ts` |
| `users/{uid}/sesi/{paket}`: isi sesi ujian | browser saat login | Firestore | lanjut di perangkat lain | dihapus saat "Ulangi"; selain itu selama akun ada | `web/src/lib/sinkron.ts` |
| `users/{uid}/riwayat/{paket-percobaan}`: entri riwayat | browser saat login | Firestore | riwayat lintas perangkat | selama akun ada | `web/src/lib/sinkron.ts` |
| `orders/{orderId}`: `email`, `nama`, `produk`, `productId`, `productName`, `amount`, `source`, `code`, `problem`, `emailedAt`, `createdAt` | webhook Mayar `payment.received` | Firestore | kirim kode, dukungan, pengembalian dana | **belum ada aturan hapus** (keputusan terbuka) | `functions/src/index.ts` (`kodeUntukPesanan`, `catatMasalah`) |
| `activation_codes/{kode}`: `code`, `display`, `produk`, `batch`, `orderId`, `used`, `usedBy` (uid), `usedAt`, `createdAt` | function | Firestore | kode sekali pakai; menghubungkan pesanan ↔ akun | **belum ada aturan hapus** | `functions/src/index.ts` |
| `redeem_attempts/{uid}`: `failed`, `windowStart`, `lastAttemptAt` | function | Firestore | rem tebakan kode (10 gagal/jam) | dihapus saat tukar kode berhasil; selain itu tetap ada | `functions/src/index.ts` (`cekRem`, `catatGagal`) |
| Jawaban saat dinilai, ID token | browser → server action | tidak disimpan (hanya diproses) | penilaian, cek hak paket | — | `web/src/app/ujian/[paket]/hasil/actions.ts`, `web/src/lib/akses-server.ts` |
| Signed URL ebook | `unduhEbook` | tidak disimpan | unduh PDF (10 menit) | — | `functions/src/index.ts` |
| Email kode (nama, kode, email penerima) | function | Gmail SMTP (nodemailer); salinan di folder Terkirim Gmail pengirim | kirim kode | sampai dihapus pemilik Gmail | `functions/src/index.ts` (`kirimEmail`) |
| Email verifikasi & reset sandi | Firebase Auth | Firebase | verifikasi email, lupa sandi | — | `web/src/components/akun/auth.tsx` |
| Log yang ditulis app: `orderId`, `productId`, `productName`, `produk`, `status`, nama field webhook, `uid` (unduh ebook), pesan galat | function | Cloud Logging | diagnosa | bawaan Cloud Logging (30 hari) | `functions/src/index.ts` (`logger.*`) |
| Log permintaan platform: IP, user agent, URL, waktu | Cloud Run (App Hosting, Functions v2) | Cloud Logging | bawaan platform | bawaan Cloud Logging (30 hari) | — |

Tidak pernah ditulis ke log: kode aktivasi, token webhook, email pembeli (kecuali termuat di pesan galat server email). Tidak diterima: data kartu/rekening/e-wallet (diproses Mayar).

## Lokasi

Firestore, Cloud Functions, Storage (ebook, tanpa data pribadi): Jakarta `asia-southeast2`. App Hosting: Singapura `asia-southeast1`. Firebase Auth, Cloud Logging, Gmail: pusat data Google (bisa di luar Indonesia). Situs dev: GitHub Pages (tanpa login, tanpa pembayaran).

## Keputusan terbuka

- Lama simpan `orders` dan `activation_codes` (catatan pembelian).
- Fitur hapus akun di app (sekarang lewat permintaan ke kontak; hapus manual: Auth user + `users/{uid}` beserta subkoleksi `sesi`, `riwayat`, + `redeem_attempts/{uid}`).
