# Laporan: pembelian otomatis SoalSKD (tanpa Gmail, tanpa kode manual)

Tanggal: 2026-11-24 · Branch: `claude/soalskd-activation-audit-tee1cy`
Status: **diimplementasikan dan diuji di emulator dengan server Mayar tiruan.** Integrasi
dengan Mayar sungguhan dan Firebase produksi **belum pernah dijalankan** (backend belum
di-deploy, belum ada transaksi sungguhan).

## 0. Verifikasi kemampuan Mayar (docs.mayar.id, dibaca langsung 2026-11-24)

| Kemampuan | Status | Sumber |
|---|---|---|
| Checkout dinamis per pesanan: Single Payment Request `POST /hl/v2/payments/create` (name, amount, email opsional, mobile opsional, redirectUrl, expiredAt, extraData) → `id`, `transactionId`, `link` | Terkonfirmasi | api-reference-v2/reqpayment/create |
| Metadata / external reference: `extraData` (objek bebas) | Terkonfirmasi (contoh respons detail transaksi menampilkan `extraData: null`, jadi tidak diandalkan) | reqpayment/create, invoice/create, transaction/detail |
| `redirectUrl` bisa ditolak dengan 400 "redirectUrl is not supported…" | Terkonfirmasi; ditangani (diulang tanpa redirect) | reqpayment/create |
| Detail transaksi `GET /hl/v2/transactions/{id}`: `status` (paid/unpaid/created/expired), `amount`, `paymentLink.id`, `customer.email`, `extraData` | Terkonfirmasi | transaction/detail |
| Detail permintaan bayar `GET /hl/v2/payments/{id}` (`status` mis. unpaid) | Terkonfirmasi | reqpayment/detail |
| Autentikasi API: `Authorization: Bearer <API key>`, key Read & Write untuk POST; sandbox `api.mayar.io` | Terkonfirmasi | api-reference-v2/introduction |
| Batas API: 50 permintaan/menit per API key | Terkonfirmasi | rate-limit |
| Webhook event: payment.received, payment.reminder, shipper.status, membership.* | Terkonfirmasi | integration/webhook |
| Field mata uang | **Tidak ada** di API (semua IDR) | transaction/detail |
| Event refund / chargeback / pembatalan | **Tidak ada** di daftar event | integration/webhook |
| Tanda tangan / token webhook (`X-Callback-Token`) | **Tidak tertulis di docs**; terbukti dipakai di proyek game edukasi milik pemilik | — |
| Tipe `data.status` webhook | Docs bertentangan (tabel: Boolean; contoh payload: "SUCCESS") → tidak dipakai untuk keputusan | integration/webhook, webhook/newhistory |
| Biaya: Pay Request 1,5% (Starter), QRIS 0,7%, e-wallet 1,5%, penarikan Rp2.775 | Terkonfirmasi | mor/fees |

Karena pengaitan ke pesanan internal didukung, dipakai **pesanan terikat uid** (bukan
pencocokan email). Email pembayaran yang berbeda tidak mengganggu.

## 1. Diagram arsitektur terbaru

```
                    ┌────────────────────────── Browser (HP) ──────────────────────────┐
                    │ /beli → login (Google / email terverifikasi) → "Bayar Rp9.900"     │
                    │ /akun → status pesanan, "Cek Status Pembayaran", paket, ebook      │
                    └──────┬─────────────────────────────┬──────────────────────┬────────┘
             callable (ID token)                callable (ID token)     server action (ID token)
                           ▼                             ▼                      ▼
┌──────────────── Cloud Functions (Jakarta) ─────────────────────┐   ┌── App Hosting (Next.js) ──┐
│ buatPesanan: uid+email dari token, harga dari produk.ts        │   │ cekAksesPaket: verifikasi │
│   orders/{ord_…} (membuat→menunggu), checkout lock, mayar_ref  │   │ token + users/{uid}.paket │
│   ──POST /payments/create (API key)──────────────────────────┐ │   │ soal berbayar dari        │
│ cekPembayaran (rem 5 dtk, 20/10 mnt) ─┐                      │ │   │ Storage privat bank/*.json│
│ mayarWebhook (X-Callback-Token) ──────┤ hanya PEMICU         │ │   │ (cache 10 mnt); kunci &   │
│                                       ▼                      │ │   │ pembahasan baru setelah   │
│ verifikasiPesanan ──GET /transactions/{id} (API key)──────┐  │ │   │ dikumpulkan               │
│   nilaiTransaksi: paid + id + nominal + paymentLink +     │  │ │   └───────────────────────────┘
│   orderId cocok → transaksi Firestore: orders aktif +     │  │ │
│   users/{uid}.paket (+ cermin users/{uid}/pembelian)      │  │ │
│ redeemActivationCode (kode cadangan) · unduhEbook         │  │ │
└───────────────────────────────────────────────────────────┼──┼─┘
                                                            ▼  ▼
                                                      Mayar API v2  ◀── pembeli membayar QRIS/e-wallet
Alat admin pemilik (functions/scripts/admin.mjs, kredensial pemilik): kode cadangan, cari, cabut-pesanan, cabut-kode
GitHub Pages (dev statis): hanya p01; cek-bocor.mjs menggagalkan deploy bila soal berbayar terbawa
```

## 2. Daftar file yang diubah

Baru:
- `functions/src/pembayaran.ts` — keputusan bayar murni (verifikasi transaksi, transisi status monoton, parsing webhook).
- `functions/src/mayar.ts` — klien Mayar API v2 (buat permintaan bayar, detail transaksi, detail permintaan bayar).
- `functions/src/hak.ts` — pemberian akses atomik, cermin pembelian, kode cadangan, pencabutan.
- `functions/scripts/admin.mjs` — alat admin pemilik.
- `web/src/app/beli/page.tsx`, `web/src/components/akun/layar-beli.tsx` — checkout.
- `web/src/app/akun/page.tsx`, `web/src/components/akun/layar-akun-saya.tsx` — akun & pembelian.
- `web/src/components/akun/status-pembelian.tsx` — kartu status pesanan + Cek Status.
- `web/src/lib/bank-privat.ts` — pembaca bank berbayar privat.
- `bank/katalog.json`, `tools/bank_privat.py`, `tools/unggah-bank.sh` — katalog publik + unggah bank privat.
- `web/scripts/cek-bocor.mjs` — pemeriksa kebocoran soal berbayar.
- `web/test/` — loader TS, tes unit, tes bank statis/produksi, tes gerbang di emulator, E2E Playwright.
- `docs/laporan-pembelian-otomatis.md` — laporan ini.

Diubah:
- `functions/src/index.ts` (webhook baru, `buatPesanan`, `cekPembayaran`, Gmail dihapus), `functions/src/produk.ts` (harga, tebakan nama dihapus), `functions/package.json` + lock, `functions/test/*`.
- `firestore.rules` (`users/{uid}/pembelian` baca-saja pemilik; `mayar_ref`, `checkout`, `mayar_events`, `rate_limits` tertutup).
- `web/src/lib/soal.ts`, `web/src/lib/firebase/admin.ts`, `web/next.config.ts`, `web/src/config/akses.ts` (`DEV_BUKA_SEMUA = false`), `web/src/config/landing.ts` (`PENJUALAN_DIBUKA`), `web/src/components/akun/auth.tsx`, `menu-akun.tsx`, `layar-aktivasi.tsx`, `kerangka-masuk.tsx`, `beranda/layar-beranda.tsx`, `landing/layar-landing.tsx`, `ujian/gerbang-ujian.tsx`, `hasil/layar-hasil.tsx`, `app/aktivasi/page.tsx`, `app/syarat/page.tsx`, `web/package.json`, `web/apphosting.yaml`.
- Legal: `web/src/konten/privasi.md`, `web/src/konten/syarat.md`, `web/src/config/legal.ts`, `web/src/lib/legal.ts`, `docs/data-pribadi.md`.
- Workflow: `.github/workflows/deploy-backend.yml`, `deploy-dev.yml`, `uji-backend.yml`.
- Dokumen: `CLAUDE.md`, `docs/firebase.md`, `docs/pola.md`, `docs/rencana-app.md`.

Tidak diubah: isi soal, kunci, pembahasan (`bank/p*.json`), skor, timer, format SKD.

## 3. Dependency dan secret yang dihapus / ditambah

| Dihapus | Pengganti |
|---|---|
| `nodemailer`, `@types/nodemailer` | — (app tidak mengirim email) |
| Secret `GMAIL_APP_PASSWORD` | — |
| Parameter/variable `EMAIL_PENGIRIM` | — |
| `config/mayar_products` + `produkDariNama` (tebakan nama produk) | produk ditentukan pesanan buatan server |
| `TAUTAN_BELI` | `PENJUALAN_DIBUKA` + `/beli` |

Ditambah: secret `MAYAR_API_KEY` (Secret Manager), parameter opsional `MAYAR_API_BASE`
(sandbox), env opsional `BANK_BUCKET` / `BANK_PRIVAT_DIR` (web). Tetap: `MAYAR_WEBHOOK_TOKEN`,
`URL_SITUS`. Tidak ada dependency npm baru.

## 4. Skema Firestore terbaru

| Koleksi | Ditulis oleh | Dibaca client | Isi utama |
|---|---|---|---|
| `users/{uid}` | functions | pemilik | `paket[]`, `produk[]`, `diperbaruiPada` |
| `users/{uid}/pembelian/{orderId}` | functions | pemilik | `produk`, `judul`, `amount`, `currency`, `status`, `link` (selama menunggu), `expiresAt`, `createdAt`, `updatedAt`, `emailBeda`, `emailPembayaran` (tersamar), `perluTinjau` |
| `users/{uid}/sesi/{paket}`, `users/{uid}/riwayat/{id}` | browser pemilik (divalidasi rules) | pemilik | tidak berubah |
| `orders/{ord_…}` | functions | tidak | `uid`, `email`, `produk`, `amount`, `currency: IDR`, `status` (membuat/menunggu/aktif/kedaluwarsa/gagal/dicabut), `mayarPaymentId`, `mayarTransactionId`, `link`, `expiresAt`, `createdAt`, `updatedAt`, `paidAt`, `grantedAt`, `emailPembayar`, `emailBeda`, `verifikasiTerakhir`, `perluTinjau`, `problem`, `dicabutPada`, `alasanCabut` |
| `mayar_ref/{id Mayar}` | functions | tidak | `orderId`, `jenis` (transaksi/pembayaran); `create()` = satu transaksi Mayar hanya milik satu pesanan |
| `checkout/{uid}__{produk}` | functions | tidak | `orderId`, `pada` (satu pesanan terbuka per akun per bundel) |
| `mayar_events/{id}` | functions | tidak | catatan webhook; `hasil: tanpa-pesanan` = tinjau manual |
| `rate_limits/{buat_uid / cek_uid}` | functions | tidak | `mulai`, `jumlah`, `terakhir`, `kedaluwarsa` (untuk TTL) |
| `activation_codes/{KODE}` | alat admin | tidak | `produk`, `batch: admin`, `catatan`, `used`, `usedBy`, `usedAt`, `dicabut` |
| `redeem_attempts/{uid}` | functions | tidak | rem tukar kode |
| `config/*` | Console | tidak | (tidak dipakai lagi oleh pembelian) |

Storage (semua tertutup client): `ebook/edisi-N.pdf`, `bank/<id>.json` (baru).

## 5. Hasil automated test

HASIL_TES

## 6. Hasil security audit

Diperbaiki:
- **Parsing status Boolean** — status webhook tidak dipakai untuk keputusan; status API wajib string `paid`. Boolean/teks lain = tidak dikenal = tanpa akses (diuji).
- **Validasi eksplisit** — id transaksi, nominal (integer, sama persis), mata uang (bila ada), `paymentLink.id`, `extraData.orderId` (bila ada), status. Gagal/tidak dikenal = tanpa akses.
- **Verifikasi via API** dari backend dengan API key di Secret Manager; webhook dan redirect hanya pemicu.
- **Idempotensi & replay** — transaksi Firestore + status monoton; `mayar_ref` dengan `create()`; webhook ganda/terlambat/tidak berurutan tidak mengubah pesanan final.
- **Duplikat entitlement** — `arrayUnion` di transaksi yang sama dengan perubahan status; dua perangkat bersamaan diuji.
- **Rate limiting** — buat pesanan 6/jam/akun, cek status 5 detik & 20/10 menit/akun, tukar kode 10 salah/jam.
- **Refund/chargeback** — tidak ada event dari Mayar; pencabutan manual lewat alat admin dengan hitung ulang hak dari semua sumber.
- **Bank soal berbayar** — tidak lagi ikut build statis, bundel client, maupun paket server Next.js; dibaca dari Storage privat setelah hak dicek; `DEV_BUKA_SEMUA = false`; deploy dev gagal otomatis bila ada kebocoran.
- **Kode cadangan** hanya dari alat admin berkredensial pemilik; tidak ada endpoint publik (diuji 404).

Temuan yang masih terbuka (butuh keputusan pemilik):
1. **KRITIS — soal berbayar sudah publik.** Repo `2013tib-droid/SoalSKD` publik (0 fork terdeteksi). `bank/p02.json`–`p07.json` + `bank/gambar/*.svg` ada di history sejak 2026-11-06 dan di banyak branch. GitHub Pages `development/main` (p02–p07), `development/cek-lengkap` dan `development/modest-franklin` (p02–p04) saat ini menyajikan soal **lengkap dengan kunci dan pembahasan**. Tidak ada release, tag, atau artifact Actions yang memuat bank. Siapa pun bisa sudah menyalinnya (clone, cache, arsip web); kerusakan ini tidak bisa ditarik kembali.
2. Kode belum menghapus berkas p02–p07 dari `bank/` (dipakai validator, ebook, sesi lain; belum ada tujuan privat).
3. `X-Callback-Token` tidak terdokumentasi Mayar (mitigasi: webhook hanya pemicu).
4. Header keamanan, App Check, dan pembatasan perangkat per akun belum ada (di luar lingkup ini).

Rekomendasi migrasi paling aman (urut, semua butuh izin pemilik):
1. Segera: gabungkan branch ini ke branch utama supaya deploy dev menimpa `development/main` dengan build tanpa soal berbayar; jalankan workflow Deploy dev dengan "hapus" untuk `cek-lengkap` dan `modest-franklin`.
2. Buat repo **privat** baru (mis. `SoalSKD-bank`) berisi `bank/p02+`, `bank/gambar/`, lalu hapus berkas itu dari repo publik dengan commit biasa (tanpa rewrite).
3. Pilih salah satu: (a) jadikan repo SoalSKD privat (Pages untuk repo privat butuh paket GitHub berbayar; dev bisa pindah ke preview App Hosting), atau (b) tulis ulang history + hapus branch lama + hapus `gh-pages` lama (force push, butuh izin; salinan yang sudah beredar tetap ada).
4. Anggap p02–p07 bocor: pertimbangkan paket baru untuk dijual, atau jual dengan sadar risikonya.

## 7. Estimasi biaya operasional (perkiraan; cek halaman harga resmi)

| Komponen | Skala awal (≈100 pesanan, ≈2.000 kunjungan/bulan) |
|---|---|
| App Hosting / Cloud Run (`minInstances: 0`) | umumnya di kuota gratis Cloud Run; build lewat Cloud Build (kuota gratis menit build) |
| Cloud Functions v2 | di kuota gratis (pemanggilan ratusan) |
| Firestore | di kuota gratis harian (50k baca / 20k tulis) |
| Storage Jakarta (ebook + bank < 100 MB) | kuota gratis hanya untuk region AS → ± beberapa ratus rupiah + egress unduhan ebook (± Rp1–2 ribu) |
| Secret Manager (2 secret) | di kuota gratis (6 versi aktif) |
| Artifact Registry (image function) | bisa melewati 0,5 GB gratis → ± ribuan rupiah; pasang cleanup policy |
| Cloud Logging | di kuota gratis 50 GiB |
| Gmail / SMTP / email API | Rp0 (dihapus) |
| **Total biaya tetap** | **± Rp0–Rp10.000/bulan**, di bawah budget alert Rp50.000 |
| Mayar per transaksi Rp9.900 | Pay Request 1,5% + QRIS 0,7% ≈ Rp218 (e-wallet: 1,5% + 1,5% ≈ Rp297); penarikan Rp2.775 per kali |

Budget alert bukan pemutus; pengaman resource ada di `docs/firebase.md` bagian "Biaya dan batas pemakaian".

## 8. Checklist Firebase Console

- [ ] Proyek terpisah, paket Blaze, budget alert Rp50.000/bulan (50/90/100%).
- [ ] Firestore di `asia-southeast2`, mode production.
- [ ] Authentication: Email/Password + Google aktif; Authorized domains (domain hosted.app + domain sendiri); template email bahasa Indonesia.
- [ ] Storage di `asia-southeast2`; deploy `storage.rules`.
- [ ] IAM Service Account Credentials API aktif; peran Service Account Token Creator untuk service account compute (signed URL ebook).
- [ ] Service account App Hosting bisa membaca bucket (Storage Object Viewer) untuk `bank/`.
- [ ] Secret Manager: `MAYAR_API_KEY`, `MAYAR_WEBHOOK_TOKEN` (hapus `GMAIL_APP_PASSWORD` bila pernah dibuat).
- [ ] GitHub: secret `FIREBASE_SERVICE_ACCOUNT`, variable `FIREBASE_PROJECT_ID`, `URL_SITUS`, (opsional) `MAYAR_API_BASE`.
- [ ] Deploy backend (dry run dulu) target `functions,firestore,storage`.
- [ ] App Hosting `asia-southeast1`, root `web`, live branch `produksi`; isi 4 nilai `NEXT_PUBLIC_*`.
- [ ] Unggah ebook (`tools/unggah-ebook.sh`) dan bank (`tools/unggah-bank.sh`).
- [ ] Firestore TTL `rate_limits.kedaluwarsa`; Artifact Registry cleanup policy.

## 9. Checklist dashboard Mayar

- [ ] Akun + KYC/verifikasi toko disetujui (menu API & Webhook).
- [ ] (Disarankan) uji dulu di sandbox web.mayar.io dengan API key sandbox.
- [ ] API Key **Read & Write** dari web.mayar.id/api-keys → Secret Manager `MAYAR_API_KEY`.
- [ ] Settings → Payment Methods: QRIS + e-wallet aktif.
- [ ] Integrasi → Webhook: URL `https://asia-southeast2-PROJECT_ID.cloudfunctions.net/mayarWebhook`, salin Webhook Token → `MAYAR_WEBHOOK_TOKEN`, tekan Test → 200.
- [ ] Data toko: URL privasi, syarat, pengembalian dana.
- [ ] Jangan sebarkan tautan produk Mayar statis (pembelian harus lewat tombol Beli SoalSKD).

## 10. Panduan deployment production

`docs/firebase.md` langkah 1–13, lalu:
1. Merge branch ini ke branch utama (dev), uji di situs dev (hanya p01, tombol beli nonaktif).
2. Deploy backend (functions, firestore, storage) dengan dry run lalu sungguhan.
3. App Hosting dari `produksi`; `URL_SITUS` diisi; deploy functions ulang.
4. Unggah bank + ebook ke Storage.
5. Uji beli sungguhan (bagian 11). Setelah lulus, nyalakan `PENJUALAN_DIBUKA`, gabungkan ke `produksi`.

## 11. Panduan satu transaksi sungguhan

Lihat `docs/firebase.md` langkah 11 (login Google → Bayar Rp9.900 → bayar QRIS → kembali
ke /akun → "Paket aktif" → buka Paket 02 → kumpulkan → unduh ebook → periksa `orders`,
`users/{uid}.paket`, log function, dan transaksi + Webhook History di Mayar → refund
opsional + `admin.mjs cabut-pesanan`).

## 12. Tindakan manual pemilik

1. Putuskan penanganan soal berbayar yang sudah publik (bagian 6, rekomendasi migrasi) dan izinkan langkah 1 (merge + bersihkan Pages).
2. KYC Mayar, buat API key + webhook token, simpan di Secret Manager.
3. Ikuti checklist Firebase (bagian 8) dan deploy backend + App Hosting.
4. Isi nilai legal (`PENGELOLA`, `EMAIL_KONTAK`, `BERLAKU_SEJAK`) dan setujui `PENGEMBALIAN_DANA`.
5. Unggah bank berbayar dan ebook ke Storage.
6. Lakukan satu transaksi sungguhan; laporkan hasilnya ke Claude.
7. Minta Claude menyalakan `PENJUALAN_DIBUKA` setelah uji lulus.
