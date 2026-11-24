# Inventaris data pribadi

Sumber kebenaran untuk `/privasi` (`web/src/konten/privasi.md`). **Setiap kali fitur menambah, mengubah, atau menghapus data yang disimpan, perbarui tabel ini lalu halaman privasi.** Status per 2026-11-24 (pembelian otomatis tanpa Gmail), dicek dengan grep pada kode.

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
| `users/{uid}`: `paket`, `produk`, `diperbaruiPada` | Cloud Functions (pembayaran terverifikasi, tukar kode, pencabutan admin) | Firestore asia-southeast2 | gerbang paket berbayar + ebook | selama akun ada | `functions/src/index.ts`, `web/src/lib/firebase/admin.ts` |
| `users/{uid}/sesi/{paket}`: isi sesi ujian | browser saat login | Firestore | lanjut di perangkat lain | dihapus saat "Ulangi"; selain itu selama akun ada | `web/src/lib/sinkron.ts` |
| `users/{uid}/riwayat/{paket-percobaan}`: entri riwayat | browser saat login | Firestore | riwayat lintas perangkat | selama akun ada | `web/src/lib/sinkron.ts` |
| `users/{uid}/pembelian/{orderId}`: `produk`, `judul`, `amount`, `status`, `link` (selama menunggu), `expiresAt`, `createdAt`, `updatedAt`, `emailBeda`, `emailPembayaran` (tersamar), `perluTinjau` | Cloud Functions (cermin `orders`) | Firestore; hanya dibaca pemilik akun | status & riwayat pembelian di /akun | selama akun ada | `functions/src/hak.ts` (`cerminPembelian`), `functions/src/index.ts` |
| `orders/{orderId}`: `uid`, `email` (akun), `produk`, `amount`, `currency`, `status`, `mayarPaymentId`, `mayarTransactionId`, `link`, `expiresAt`, `createdAt`, `updatedAt`, `paidAt`, `grantedAt`, `emailPembayar`, `emailBeda`, `emailPembayaran`, `verifikasiTerakhir`, `perluTinjau`, `problem`, pencabutan (`dicabutPada`, `alasanCabut`) | `buatPesanan` + API Mayar `GET /transactions/{id}` | Firestore (tertutup client) | tagihan, verifikasi bayar, dukungan, pengembalian dana | **belum ada aturan hapus** (keputusan terbuka) | `functions/src/index.ts`, `functions/src/hak.ts` |
| Email akun, nominal, deskripsi, `extraData.orderId` | `buatPesanan` | dikirim ke Mayar (`POST /payments/create`) | tagihan + bukti bayar Mayar | menurut Mayar | `functions/src/mayar.ts` |
| `mayar_ref/{id}`: `orderId`, `jenis` | `buatPesanan` | Firestore (tertutup) | mencocokkan webhook ke pesanan | belum ada aturan hapus | `functions/src/index.ts` |
| `mayar_events/{id}`: `event`, `refs`, `statusWebhook`, `amount`, `productName`, `email` (pembayar), `orderId`, `hasil`, `diterimaPada` | webhook Mayar | Firestore (tertutup) | audit; pembayaran tanpa pesanan ditinjau manual | belum ada aturan hapus | `functions/src/index.ts` (`mayarWebhook`) |
| `checkout/{uid}__{produk}`: `orderId`, `pada` | `buatPesanan` | Firestore (tertutup) | satu pesanan terbuka per akun per bundel | ditimpa pesanan berikutnya | `functions/src/index.ts` |
| `rate_limits/{buat_uid \| cek_uid}`: `mulai`, `jumlah`, `terakhir`, `kedaluwarsa` | functions | Firestore (tertutup) | rem buat pesanan (6/jam) & cek status (20/10 menit, jeda 5 detik) | bisa dihapus otomatis dengan TTL `kedaluwarsa` (disarankan) | `functions/src/index.ts` (`rem`) |
| `activation_codes/{kode}`: `code`, `display`, `produk`, `batch: 'admin'`, `catatan`, `used`, `usedBy` (uid), `usedAt`, `createdAt`, `dicabut` | alat admin `functions/scripts/admin.mjs` | Firestore | kode cadangan (hadiah, kompensasi) | **belum ada aturan hapus** | `functions/src/hak.ts` |
| `redeem_attempts/{uid}`: `failed`, `windowStart`, `lastAttemptAt` | function | Firestore | rem tebakan kode (10 gagal/jam) | dihapus saat tukar kode berhasil; selain itu tetap ada | `functions/src/index.ts` (`cekRem`, `catatGagal`) |
| Jawaban saat dinilai, ID token | browser → server action | tidak disimpan (hanya diproses) | penilaian, cek hak paket | — | `web/src/app/ujian/[paket]/hasil/actions.ts`, `web/src/lib/akses-server.ts` |
| Signed URL ebook | `unduhEbook` | tidak disimpan | unduh PDF (10 menit) | — | `functions/src/index.ts` |
| Email verifikasi & reset sandi | Firebase Auth | Firebase | verifikasi email, lupa sandi | — | `web/src/components/akun/auth.tsx` |
| Log yang ditulis app: `orderId`, `produk`, status/alasan verifikasi, `refs` webhook (id transaksi), status HTTP Mayar, `uid` dan `edisi` (unduh ebook), pesan galat | function | Cloud Logging | diagnosa | bawaan Cloud Logging (30 hari) | `functions/src/index.ts` (`logger.*`) |
| Log permintaan platform: IP, user agent, URL, waktu | Cloud Run (App Hosting, Functions v2) | Cloud Logging | bawaan platform | bawaan Cloud Logging (30 hari) | — |

Tidak pernah ditulis ke log: kode aktivasi, API key dan token webhook Mayar, email pembeli. Tidak ada email yang dikirim app sendiri (Gmail/SMTP dihapus 2026-11-24). Tidak diterima: data kartu/rekening/e-wallet (diproses Mayar).

## Lokasi

Firestore, Cloud Functions, Storage (ebook + bank soal berbayar, tanpa data pribadi): Jakarta `asia-southeast2`. App Hosting: Singapura `asia-southeast1`. Firebase Auth, Cloud Logging: pusat data Google (bisa di luar Indonesia). Situs dev: GitHub Pages (tanpa login, tanpa pembayaran).

## Keputusan terbuka

- Lama simpan `orders`, `mayar_events`, `mayar_ref`, dan `activation_codes` (catatan pembelian).
- Fitur hapus akun di app (sekarang lewat permintaan ke kontak; hapus manual: Auth user + `users/{uid}` beserta subkoleksi `sesi`, `riwayat`, `pembelian`, + `redeem_attempts/{uid}`, `rate_limits/*_{uid}`, `checkout/{uid}__*`).
