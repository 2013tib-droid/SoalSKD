# Backend, login, dan penjualan SoalSKD (Firebase + Mayar)

Panduan ini untuk pemilik. Kerjakan berurutan, **sekali saja**. Kalau ada langkah
yang membingungkan, kirim tangkapan layarnya ke Claude (tanpa kata sandi/token).

## Gambaran alurnya

Pembelian normal **tanpa kode dan tanpa email dari kita** (keputusan 2026-11-24):

1. Pembeli menekan **Beli** pada Bundel 1 (p02–p04) atau Bundel 2 (p05–p07), masing-masing
   Rp9.900, lalu **masuk** (Google diutamakan; email + sandi harus terverifikasi).
2. Server (`buatPesanan`) membuat pesanan `orders/{orderId}` yang terikat ke uid akun itu,
   lalu meminta Mayar membuat **Single Payment Request** (`POST /payments/create`,
   `extraData.orderId`, email akun, nominal dari `functions/src/produk.ts`). Pembeli
   diarahkan ke halaman bayar Mayar (QRIS/e-wallet).
3. Setelah bayar, Mayar memanggil webhook `mayarWebhook` dan/atau pembeli kembali ke
   `/akun?pesanan=…` lalu menekan **Cek Status Pembayaran** (`cekPembayaran`). Keduanya hanya
   **pemicu**: server menanyakan status ke API Mayar (`GET /transactions/{id}`) dengan API key.
4. Lunas + nominal, produk, dan id cocok → satu transaksi Firestore: pesanan `aktif` dan
   paket masuk ke `users/{uid}.paket`. Webhook palsu, redirect browser, atau screenshot tidak
   pernah membuka akses.
5. Paket terbuka di HP mana pun akun itu login. Tombol **Unduh Ebook PDF Edisi 1/2** muncul
   di halaman Try out (tautan bertanda tangan ±10 menit).
6. Paket p01 tetap gratis tanpa login. **Kode aktivasi** tinggal cadangan (hadiah,
   kompensasi), dibuat pemilik lewat alat admin dan ditukar di `/aktivasi`.

```
Pembeli ──login──▶ /beli ──buatPesanan──▶ Cloud Functions ──POST /payments/create──▶ Mayar
   │                                         │  orders/{id} (uid, harga)              │
   │◀────────── tautan bayar ────────────────┘                                        │
   │──────────────────────── bayar QRIS/e-wallet ────────────────────────────────────▶│
   │                                         ◀── webhook payment.received (pemicu) ───┤
   │── /akun "Cek Status" (pemicu) ─────────▶ │── GET /transactions/{id} (API key) ───▶│
   │                                         │◀── status, amount, paymentLink.id ─────┤
   │                                         └─ lunas & cocok → transaksi Firestore:
   │                                            orders aktif + users/{uid}.paket
   │◀── paket aktif; soal berbayar dari Storage privat lewat server Next.js (hak dicek)
```

Jawaban dan riwayat skor pembeli yang login tersimpan di akunnya, jadi pindah HP
tidak hilang. Pengunjung yang belum login tetap tersimpan di HP-nya saja, dan
datanya ikut pindah ke akun saat ia pertama kali login.

Yang dipakai:

| Bagian | Layanan | Lokasi |
|---|---|---|
| Login | Firebase Authentication | — |
| Database (paket milik, pesanan, jawaban, riwayat) | Cloud Firestore | Jakarta (`asia-southeast2`) |
| Buat pesanan, cek bayar, webhook Mayar, tukar kode, unduh ebook | Cloud Functions | Jakarta (`asia-southeast2`) |
| File ebook PDF + bank soal berbayar (privat) | Cloud Storage for Firebase | Jakarta (`asia-southeast2`) |
| Situs (Next.js dengan server) | Firebase App Hosting | Singapura (`asia-southeast1`) |
| Pembayaran, tagihan, bukti bayar | Mayar (Single Payment Request + API transaksi) | — |

Tidak ada Gmail, SMTP, App Password, atau layanan email pihak ketiga.
Proyek Firebase-nya **terpisah** dari game edukasi.

---

## 1. Buat proyek Firebase

1. Buka https://console.firebase.google.com → **Create a project** (Buat proyek).
2. Nama: `SoalSKD`. Firebase memberi **Project ID** (mis. `soalskd-1a2b3`).
   Catat Project ID ini; dipakai di banyak langkah di bawah.
3. Google Analytics: boleh dimatikan.

## 2. Pindah ke paket Blaze (bayar sesuai pemakaian)

Cloud Functions, Secret Manager, dan App Hosting hanya jalan di paket Blaze.

1. Di Console, kiri bawah **Spark → Upgrade** → pilih **Blaze**, sambungkan akun
   penagihan (kartu).
2. **Wajib:** pasang batas peringatan biaya. Buka
   https://console.cloud.google.com/billing → **Budgets & alerts → Create budget**:
   proyek SoalSKD, jumlah **Rp50.000/bulan**, peringatan 50%, 90%, 100% ke email.
   (Ini peringatan, bukan pemutus otomatis. Pada jumlah pembeli awal, biaya
   biasanya di bawah kuota gratis.)

## 3. Buat database Firestore di Jakarta

1. Console → **Build → Firestore Database → Create database**.
2. Location: **asia-southeast2 (Jakarta)**. Lokasi **tidak bisa diganti** setelah dibuat.
3. Mode: **Production mode** (aturan aksesnya kita kirim lewat deploy di langkah 7).

## 4. Aktifkan login Email dan Google

1. Console → **Build → Authentication → Get started**.
2. Tab **Sign-in method**:
   - **Email/Password** → Enable → Save (yang "Email link" biarkan mati).
   - **Google** → Enable → isi **Project support email** (email Anda) → Save.
3. Tab **Settings → Authorized domains**: nanti, setelah situs punya alamat
   (langkah 8), tambahkan domain situs di sini, mis. `soalskd.id`. Tanpa itu
   "Masuk dengan Google" ditolak.
4. (Disarankan) **Templates → Email address verification** dan **Password reset**:
   ganti bahasa template ke **Indonesian** (ikon pensil → Template language).

5. **Layar izin Google (OAuth consent screen)**: Google Cloud Console →
   **APIs & Services → OAuth consent screen** (Branding). Setelah situs punya
   domain (langkah 8), isi:
   - **Application privacy policy link**: `https://DOMAIN/privasi`
   - **Application terms of service link**: `https://DOMAIN/syarat`
   - **Authorized domains**: domain situs pembeli.
   Isi dulu nilai di `web/src/config/legal.ts` (langkah 12) supaya kedua
   halaman memuat nama pengelola dan kontak.

Pembeli yang daftar dengan email + kata sandi harus **klik tautan verifikasi** di
emailnya sebelum bisa menukar kode. Ini mencegah paket hilang karena email salah
ketik. Masuk dengan Google tidak perlu verifikasi.

## 5. Daftarkan aplikasi web, ambil 4 nilai config

1. Console → ikon roda gigi **Project settings → General → Your apps** → ikon
   **`</>`** (Web) → nama `soalskd-web` → **Register app** (Firebase Hosting tidak
   perlu dicentang).
2. Akan muncul kode `const firebaseConfig = { ... }`. Yang dibutuhkan 4 nilai:
   `apiKey`, `authDomain`, `projectId`, `appId`.
3. Nilai-nilai ini **bukan rahasia** (memang dikirim ke browser), jadi boleh
   ditempel ke Claude. Claude akan mengisinya di `web/apphosting.yaml`.

## 6. Siapkan dua rahasia Mayar

**Jangan ditempel ke chat mana pun, termasuk ke Claude.** Mayar biasanya baru membuka
menu API dan Webhook setelah KYC/verifikasi toko disetujui.

### 6a. API Key Mayar

1. Masuk ke https://web.mayar.id/api-keys → **Create API Key** → pilih **Read & Write**
   (dibutuhkan untuk membuat tagihan; docs Mayar: Read Only hanya untuk GET).
2. Salin kuncinya ke Notepad sementara. Kunci ini hanya akan disimpan di Secret Manager.
3. Docs Mayar: mengganti domain/subdomain toko butuh API key baru.

### 6b. Webhook Token Mayar

Dasbor Mayar → **Integrasi → Webhook** → salin **Webhook Token** (dikirim Mayar di header
`X-Callback-Token`; terbukti di proyek game edukasi, tidak tertulis di docs Mayar). Webhook
hanya pemicu: tanpa API yang menyatakan lunas, webhook tidak membuka apa pun.

### 6c. Simpan di Secret Manager

1. Buka `https://console.cloud.google.com/security/secret-manager?project=PROJECT_ID`
   (ganti `PROJECT_ID`). Kalau diminta, tekan **Enable**.
2. **Create secret** → Name `MAYAR_API_KEY` → value: API key → Create.
3. **Create secret** → Name `MAYAR_WEBHOOK_TOKEN` → value: Webhook Token → Create.

Nama secret harus persis begitu (huruf besar semua). Secret `GMAIL_APP_PASSWORD` dari
versi lama tidak dipakai lagi; kalau sempat dibuat, hapus.

**Uji dulu di sandbox (disarankan):** buat akun di https://web.mayar.io, ambil API key
sandbox dari https://web.mayar.io/api-keys, simpan sebagai `MAYAR_API_KEY`, dan isi variable
GitHub `MAYAR_API_BASE` = `https://api.mayar.io/hl/v2` (langkah 7b). Setelah uji lulus,
ganti secret ke API key produksi (versi baru) dan kosongkan `MAYAR_API_BASE`, lalu deploy ulang.

## 7. Deploy backend lewat GitHub Actions

### 7a. Buat service account untuk GitHub

1. Console → **Project settings → Service accounts → Generate new private key**.
   File JSON terunduh. **Ini rahasia.**
2. Buka `https://console.cloud.google.com/iam-admin/iam?project=PROJECT_ID`, cari
   akun berakhiran `firebase-adminsdk-...@PROJECT_ID.iam.gserviceaccount.com`,
   ikon pensil → tambahkan peran: **Firebase Admin**, **Cloud Functions Admin**,
   **Service Account User**, **Cloud Datastore Owner**, **Secret Manager Admin** → Save.

### 7b. Isi di GitHub

Repo SoalSKD → **Settings → Secrets and variables → Actions**:

| Jenis | Nama | Isi |
|---|---|---|
| Secret | `FIREBASE_SERVICE_ACCOUNT` | seluruh isi file JSON dari 7a |
| Variable | `FIREBASE_PROJECT_ID` | Project ID |
| Variable | `URL_SITUS` | alamat situs, mis. `https://soalskd.id`; dipakai sebagai tautan kembali dari Mayar (`/akun?pesanan=…`) |
| Variable | `MAYAR_API_BASE` | kosong = produksi `https://api.mayar.id/hl/v2`; sandbox: `https://api.mayar.io/hl/v2` |

Setelah itu file JSON di komputer boleh dihapus.

### 7c. Jalankan

Tab **Actions → Deploy backend → Run workflow**:
1. target `functions,firestore`, **dry_run dicentang** → Run. Harus hijau.
2. Ulangi **tanpa centang** dry_run. Ini mengirim Cloud Functions dan aturan
   keamanan database. Target `storage` (dan `functions,firestore,storage`)
   baru dipakai setelah Storage aktif di langkah 10a.

## 8. Situs di Firebase App Hosting

Kenapa App Hosting, bukan Vercel: lihat bagian "Perbandingan hosting" di bawah.

1. Minta Claude mengisi 4 nilai dari langkah 5 di `web/apphosting.yaml`, lalu
   gabungkan (merge) ke branch utama.
2. Console → **Build → App Hosting → Get started / Create backend**:
   - Region: **asia-southeast1 (Singapore)** (yang terdekat dengan Indonesia).
   - Hubungkan GitHub → pilih repo `2013tib-droid/SoalSKD`.
   - **App root directory: `web`**
   - **Live branch**: buat dulu branch `produksi` di GitHub dari branch utama,
     lalu pilih `produksi`. Dengan begitu situs pembeli hanya berubah saat Anda
     menggabungkan perubahan ke `produksi`, bukan setiap kali Claude mengubah
     branch utama.
   - Automatic rollouts: **on**.
   - Backend name: `soalskd-web`.
3. Tunggu rollout pertama selesai (±5–10 menit). Situs dapat alamat
   `https://soalskd-web--PROJECT_ID.asia-southeast1.hosted.app`.
4. Domain sendiri (kalau ada): App Hosting → backend → **Settings → Domains →
   Add custom domain**, ikuti petunjuk DNS.
5. **Authentication → Settings → Authorized domains**: tambahkan domain `hosted.app`
   di atas dan domain sendiri.
6. Isi variable GitHub `URL_SITUS` dengan alamat situs, lalu jalankan
   **Deploy backend** sekali lagi (target `functions`) supaya Mayar mengarahkan pembeli
   kembali ke `/akun?pesanan=…` setelah membayar.
7. **Bank soal berbayar** dibaca server dari Storage privat (langkah 10d). Bucket bawaan =
   `PROJECT_ID.firebasestorage.app`. Kalau nama bucket berbeda, tambahkan env `BANK_BUCKET`
   di `web/apphosting.yaml`. Service account App Hosting perlu bisa membaca bucket itu
   (peran **Storage Object Viewer** bila belum ada).

**Jangan rollout ke produksi sebelum yakin**: gabungkan ke `produksi` hanya
setelah dicoba di alamat App Hosting.

## 9. Mayar

Checkout dibuat per pesanan lewat API (Single Payment Request), jadi **tidak perlu** membuat
halaman produk di Mayar dan tidak ada pemetaan nama produk. Harga ada di
`functions/src/produk.ts` (`harga`) dan tampilannya di `web/src/config/landing.ts`
(`PENAWARAN`); ubah keduanya bersamaan.

1. **Metode pembayaran**: Dasbor Mayar → **Settings → Payment Methods**: aktifkan QRIS dan
   e-wallet. (Docs Mayar: biaya admin/channel yang dibebankan ke pembeli **tidak berlaku**
   untuk Request Payment, jadi nominal yang dibayar = harga.)
2. **URL webhook**: Dasbor Mayar → **Integrasi → Webhook** → isi
   ```
   https://asia-southeast2-PROJECT_ID.cloudfunctions.net/mayarWebhook
   ```
   (ganti `PROJECT_ID`, tanpa apa pun di belakangnya). Simpan → **Test**.
   Hasil benar: **200** (event uji diabaikan). Kalau **401**: token di Secret Manager tidak
   sama dengan di dasbor Mayar (cek spasi yang ikut tersalin), perbaiki lalu deploy ulang.
3. **Jangan bagikan tautan produk Mayar lama** (kalau pernah dibuat). Pembayaran yang tidak
   lewat tombol Beli SoalSKD tidak terikat ke akun mana pun; webhook-nya dicatat di
   `mayar_events` dengan `hasil: tanpa-pesanan` untuk ditangani manual.
4. **Verifikasi merchant / data toko**: kalau Mayar meminta URL kebijakan,
   isi `https://DOMAIN/privasi`, `https://DOMAIN/syarat`, dan
   `https://DOMAIN/syarat#pengembalian-dana`. Teks pengembalian dana ada di
   `PENGEMBALIAN_DANA` (`web/src/config/legal.ts`) dan masih **usulan** (langkah 12).
5. **Buka penjualan** setelah uji beli (langkah 11) lulus: minta Claude mengubah
   `PENJUALAN_DIBUKA` di `web/src/config/landing.ts` menjadi `true` untuk bundel itu, lalu
   gabungkan ke `produksi`. Selama `false`, tombol tampil "Pembelian segera dibuka".

## 9b. Repo privat bank soal (`SoalSKD-bank`)

Soal, kunci, dan pembahasan paket berbayar (p02 dst.) **tidak ada di repo publik**. Tempatnya
repo GitHub privat `2013tib-droid/SoalSKD-bank` (isi: `pXX.json` + `gambar/`, lihat README di
repo itu). Untuk membuat ebook, mengunggah bank ke Storage, atau mengedit soal di komputer:

```sh
git clone https://github.com/2013tib-droid/SoalSKD-bank.git   # di sebelah folder SoalSKD
```

Alat di repo SoalSKD menemukannya otomatis (`tools/lokasi_bank.py`), atau isi
`BANK_PRIVAT_DIR=/path/ke/SoalSKD-bank`. Sesi Claude yang mengerjakan soal berbayar perlu
kedua repo. CI GitHub dan GitHub Pages hanya memakai repo publik (tes memakai paket tiruan).

## 10. Ebook PDF di Storage (privat)

Ebook dijanjikan di kartu harga, satu edisi per bundel. File-nya **tidak boleh** ada
di repo, `web/public`, atau situs dev (repo ini publik). Tempatnya di Storage,
tertutup untuk semua client (`storage.rules`):

| Edisi | Path di Storage | Dibuka oleh | Nama unduhan |
|---|---|---|---|
| `edisi-1` | `ebook/edisi-1.pdf` | Bundel 1 (p02/p03/p04) | `SoalSKD-Edisi-1.pdf` |
| `edisi-2` | `ebook/edisi-2.pdf` | Bundel 2 (p05/p06/p07) | `SoalSKD-Edisi-2.pdf` |

Pembeli menekan **Unduh Ebook PDF Edisi N** di halaman Try out (satu kartu per edisi
yang dimilikinya); Cloud Function `unduhEbook` mengecek akunnya punya paket dari
bundel edisi itu, lalu memberi tautan bertanda tangan yang berlaku **10 menit**.

### 10a. Aktifkan Storage di Jakarta (sekali)

1. Console → **Build → Storage → Get started**.
2. Location: **asia-southeast2 (Jakarta)**, sama dengan Firestore dan Functions.
   Lokasi bucket **tidak bisa diganti**. (Bucket di luar region AS butuh paket
   Blaze; sudah dari langkah 2.)
3. Mode: **Production mode**. Aturan sebenarnya (tolak semua) dikirim lewat
   Deploy backend target `storage` (langkah 7c, dry run dulu), setelah bucket ada.
4. Catat nama bucket di bagian atas halaman Storage, mis.
   `soalskd-1a2b3.firebasestorage.app`.

### 10b. Izinkan function menandatangani tautan (sekali)

Tautan unduh ditandatangani oleh service account Cloud Functions. Tanpa izin ini
tombol unduh menjawab "Tautan unduhan belum bisa dibuat".

1. Buka `https://console.cloud.google.com/apis/library/iamcredentials.googleapis.com?project=PROJECT_ID`
   → **Enable** (IAM Service Account Credentials API).
2. Buka `https://console.cloud.google.com/iam-admin/iam?project=PROJECT_ID`, cari
   akun `PROJECT_NUMBER-compute@developer.gserviceaccount.com` (service account
   bawaan Cloud Functions generasi 2), ikon pensil → tambahkan peran
   **Service Account Token Creator** → Save.

### 10c. Buat PDF lalu unggah

Di komputer dengan Node 22, Python 3, Chromium (Playwright), dan
[gcloud CLI](https://cloud.google.com/sdk/docs/install) yang sudah `gcloud auth login`
dengan akun pemilik proyek:

```sh
sh tools/unggah-ebook.sh soalskd-1a2b3.firebasestorage.app edisi-1   # ganti dengan nama bucket
sh tools/unggah-ebook.sh soalskd-1a2b3.firebasestorage.app edisi-2
```

Skrip ini memvalidasi paket edisi itu (`edisi-1` = p02–p04, `edisi-2` = p05–p07),
membuat `ebook/dist/<edisi>.pdf` (330 soal), lalu `gsutil cp` ke
`gs://<bucket>/ebook/<edisi>.pdf`. Tanpa argumen edisi = `edisi-1`. Hanya ingin
membuat PDF: `sh tools/unggah-ebook.sh --cuma-buat edisi-2`.

Tanpa skrip: buat PDF dengan
`node ebook/buat-ebook.mjs ../SoalSKD-bank/p02.json ../SoalSKD-bank/p03.json ../SoalSKD-bank/p04.json --judul "Edisi 1" --keluar ebook/dist/edisi-1.pdf`,
lalu Console → **Storage → Create folder** `ebook` → buka folder → **Upload file**
→ pilih PDF-nya dan beri nama persis `edisi-1.pdf` (ganti nama di komputer dulu
kalau perlu). Edisi 2 sama, dengan `p05.json p06.json p07.json` dari `../SoalSKD-bank`,
`--judul "Edisi 2"`, dan nama `edisi-2.pdf`.

**Jangan** klik "Create new access token" atau membagikan tautan dari Console:
tautan semacam itu berlaku selamanya dan bisa disebar.

### 10d. Bank soal berbayar di Storage (wajib sebelum jualan)

Soal, kunci, dan pembahasan paket berbayar **tidak dibaca dari repo** oleh situs pembeli.
Server Next.js membacanya dari Storage privat `bank/<id>.json` (storage.rules menolak semua
client) hanya setelah hak paket dicek. Unggah sekali, dan setiap kali isi paket berubah:

```sh
sh tools/unggah-bank.sh soalskd-1a2b3.firebasestorage.app   # paket berbayar dari ../SoalSKD-bank (otomatis)
```

Skrip memvalidasi bank, menanam SVG gambar figural ke JSON (`tools/bank_privat.py siapkan`),
lalu `gsutil cp` ke `gs://<bucket>/bank/`. Paket gratis (PAKET_TERBUKA) tidak diunggah.
Server menyimpan cache 10 menit. Setelah menambah/mengubah paket, perbarui juga katalog
publik (metadata saja): `python3 tools/bank_privat.py katalog [folder…]`.

### 10e. Setiap kali isi bank berubah

Soal p02–p04 (Edisi 1) atau p05–p07 (Edisi 2) diperbaiki → jalankan lagi **10c**
untuk edisi itu **dan 10d** (bank di Storage). File lama ditimpa di path yang sama, jadi tombol unduh langsung
memberi versi baru. Pembeli yang sudah mengunduh tetap memegang versi lamanya.
Edisi atau bundel baru (mis. Bundel 3) butuh perubahan kecil di
`functions/src/produk.ts` (`PRODUK` termasuk `harga`, `EBOOK`), cerminnya di `web/src/config/produk.ts`, `PENAWARAN` di `web/src/config/landing.ts`,
dan `web/src/config/akses.ts`, serta skrip; minta Claude.

## 11. Uji sekali dengan uang sungguhan

Lakukan setelah langkah 1–10 dan 12 selesai, **sebelum** `PENJUALAN_DIBUKA` dinyalakan
untuk umum. Untuk uji ini saja, minta Claude menyalakan `PENJUALAN_DIBUKA` di branch uji
atau buka langsung `https://DOMAIN/beli?produk=bundel-3to` setelah saklarnya dinyalakan.

1. Buka situs di HP (jendela penyamaran), tekan **Beli Bundel 1** → **Masuk dengan Google**
   (akun yang belum pernah membeli).
2. Tekan **Bayar Rp9.900** → halaman Mayar terbuka. Periksa nominal **Rp9.900**.
3. Bayar dengan QRIS/e-wallet sungguhan.
4. Kembali ke SoalSKD (otomatis lewat redirect, atau buka `/akun`). Status harus berubah
   dari **Pembayaran sedang diverifikasi** ke **Paket aktif** dalam beberapa detik; kalau
   belum, tekan **Cek Status Pembayaran** (jeda 5 detik antar cek).
5. Buka **Paket 02** dari /try-out → soal tampil (dibaca dari Storage privat).
   Kerjakan 1–2 soal, kumpulkan → skor + pembahasan tampil.
6. /try-out → **Unduh Ebook PDF Edisi 1** → `SoalSKD-Edisi-1.pdf` terunduh.
7. Periksa Console → Firestore: `orders/{id}` `status: aktif`, `paidAt`, `mayarTransactionId`
   terisi; `users/{uid}.paket` = p02–p04. Console → Functions → Logs: ada
   `verifikasi: paket diaktifkan`, tanpa galat.
8. Dasbor Mayar → Transaksi: transaksi Rp9.900 lunas, dan **Webhook History** berstatus sukses.
9. Ulangi untuk Bundel 2 (langkah 13). Bila perlu, refund transaksi uji di Mayar lalu
   cabut aksesnya: `node scripts/admin.mjs --project PROJECT_ID cabut-pesanan ord_… refund uji`.

## 12. Lengkapi halaman Privasi dan Syarat (sebelum jualan)

Halaman `/privasi` dan `/syarat` membaca nilai dari `web/src/config/legal.ts`.
Nilai `null` disembunyikan dengan rapi, tapi **wajib diisi sebelum situs pembeli
dibuka** (repo ini publik, jadi isi hanya data yang memang boleh tampil di
halaman publik). Kirim nilainya ke Claude atau ubah sendiri:

| Nilai | Isi | Kenapa wajib |
|---|---|---|
| `PENGELOLA` | nama Anda atau badan usaha | UU PDP: pengendali data harus jelas; Mayar dan Google juga memeriksanya |
| `EMAIL_KONTAK` | email kontak umum (boleh email yang sudah Anda punya; tidak perlu akun baru) | tanpa ini, yang belum membeli tidak punya cara meminta hapus akun |
| `WA_KONTAK` | nomor WA, mis. `6281234567890` | opsional |
| `PENGEMBALIAN_DANA` | teks kebijakan pengembalian dana | sekarang masih usulan Claude, perlu persetujuan Anda |
| `BERLAKU_SEJAK` | tanggal mulai berlaku, mis. `2026-12-01` | diisi setelah Anda membaca kedua halaman |
| `DIPERBARUI` | tanggal terakhir teks diubah | ganti setiap kali teks atau nilai berubah |

Teks lengkapnya di `web/src/konten/privasi.md` dan `web/src/konten/syarat.md`.
Daftar data yang dijelaskan di sana: `docs/data-pribadi.md`. Teks ini bukan
nasihat hukum; baca ulang (atau minta orang yang paham hukum membacanya)
sebelum situs pembeli dibuka.

---

## 13. Bundel 2 (p05–p07 + Ebook Edisi 2)

Bundel 2 memakai alur checkout yang sama (produk `bundel-3to-2`, harga di
`functions/src/produk.ts`). Yang perlu dilakukan:

1. **Ebook Edisi 2**: `sh tools/unggah-ebook.sh <bucket> edisi-2` (langkah 10c).
2. **Bank p05–p07**: ikut `sh tools/unggah-bank.sh <bucket>` (langkah 10d).
3. Review isi p05–p07 (status masih `draf`), lalu unggah ulang bank + ebook bila berubah.
4. **Uji sekali** seperti langkah 11 dengan Bundel 2: p05–p07 terbuka, kartu **Unduh Ebook PDF
   Edisi 2** muncul. Akun yang punya dua bundel melihat dua kartu ebook.
5. Nyalakan `PENJUALAN_DIBUKA["bundel-3to-2"]` (minta Claude).

## Memantau dan menangani masalah

Semua pesanan ada di Firestore → koleksi **`orders`** (id `ord_…`, juga terlihat oleh pembeli
di halaman Akun). Pembeli melihat cerminnya di `users/{uid}/pembelian`.

| `status` di `orders` | Artinya | Yang dilakukan |
|---|---|---|
| `menunggu` | Tagihan dibuat, belum lunas menurut Mayar | Tidak perlu apa-apa. Pembeli bisa menekan Cek Status |
| `menunggu` + `perluTinjau: true` | Mayar mengembalikan status yang tidak dikenal (mis. `refunded`) | Cek transaksi di dasbor Mayar |
| `aktif` | Lunas, paket diberikan | — |
| `kedaluwarsa` | Tidak dibayar sampai batas waktu (24 jam) | Tidak perlu apa-apa. Kalau ternyata dibayar, webhook/cek berikutnya mengaktifkannya |
| `gagal` + `problem: tidak-cocok-…` | Mayar bilang lunas, tapi nominal/produk/id tidak cocok | Periksa di Mayar. Kalau sah, beri kode cadangan atau refund. **Jangan** ubah status manual |
| `dicabut` | Akses dicabut admin (refund/chargeback) | — |

Pembayaran yang tidak lewat checkout SoalSKD: Firestore → **`mayar_events`** dengan
`hasil: tanpa-pesanan` (email, produk, jumlah dari webhook). Minta pembeli membalas **dari
email itu**, cocokkan dengan transaksi di dasbor Mayar, lalu beri kode cadangan. Jangan beri
akses hanya dari screenshot atau nomor transaksi.

**Alat admin** (komputer pemilik, kredensial pemilik; tidak ada endpoint publik). Sekali:
`gcloud auth application-default login`, lalu di `functions/`: `npm ci && npm run build`.

```sh
node scripts/admin.mjs --project PROJECT_ID cari pembeli@contoh.com          # pesanan + webhook untuk email itu
node scripts/admin.mjs --project PROJECT_ID kode bundel-3to 1 kompensasi     # kode cadangan
node scripts/admin.mjs --project PROJECT_ID cabut-pesanan ord_xxx refund     # cabut akses (refund/chargeback)
node scripts/admin.mjs --project PROJECT_ID cabut-kode ABC-DEF-GHJ bocor      # cabut kode cadangan
```

Kode cadangan ditukar pembeli di `/aktivasi` (email terverifikasi, 10 salah per jam).
Mayar **tidak** mengirim event refund/chargeback (docs: daftar event webhook), jadi
pencabutan selalu lewat alat admin setelah refund disetujui.

Pembeli melapor ebook tidak bisa diunduh: lihat log function `unduhEbook`
(Console → Functions → Logs). `file belum diunggah` = ulangi langkah 10c;
`gagal menandatangani URL` = cek langkah 10b.

**Kunci API atau token Mayar bocor**: buat yang baru di Mayar, tambahkan sebagai **versi
baru** di secret `MAYAR_API_KEY` / `MAYAR_WEBHOOK_TOKEN`, nonaktifkan yang lama di Mayar, lalu
jalankan Deploy backend (target `functions`).

## Biaya dan batas pemakaian

Budget alert **Rp50.000/bulan** (langkah 2) hanya peringatan, **bukan** pemutus. Pengaman
yang sudah dipasang di repo:

| Layanan | Pengaman |
|---|---|
| App Hosting (Cloud Run) | `minInstances: 0`, `maxInstances: 3`, 512 MiB (`web/apphosting.yaml`) |
| Cloud Functions | `maxInstances: 10` global, webhook `maxInstances: 3` |
| Mayar API | rem buat pesanan 6/jam/akun; cek status jeda 5 detik dan 20/10 menit/akun; status final tidak ditanyakan ulang (batas Mayar 50/menit/API key) |
| Tukar kode | 10 salah/jam/akun |
| Storage | ebook lewat signed URL 10 menit; bank dibaca server dengan cache 10 menit |

Disarankan (Console, sekali): Firestore → **TTL policies** → koleksi `rate_limits`, field
`kedaluwarsa`; Artifact Registry → repositori `gcf-artifacts` (asia-southeast2) →
**Cleanup policies**: simpan 2 versi terbaru (image function lama menumpuk biaya penyimpanan).

## Perbandingan hosting (keputusan: Firebase App Hosting)

Situs butuh **server** (bukan GitHub Pages) karena skor dihitung dan hak paket
dicek di server, supaya kunci jawaban tidak ikut ke browser.

| | Firebase App Hosting | Vercel |
|---|---|---|
| Boleh untuk jualan | Ya (paket Blaze) | Paket gratis (Hobby) **hanya non-komersial**; jualan wajib Pro **US$20/bulan** (±Rp330 ribu) |
| Biaya di skala awal | Bayar pemakaian; pada trafik kecil umumnya masih di kuota gratis Cloud Run/Build | Minimal US$20/bulan |
| Region terdekat | Singapura (`asia-southeast1`) | Singapura (`sin1`) |
| Dengan Firestore/Functions Jakarta | Satu proyek Google, server tidak perlu kunci rahasia tambahan | Perlu menyimpan JSON service account di Vercel |
| Kemudahan | Satu Console; deploy otomatis dari branch GitHub | Paling mudah untuk Next.js, tapi dua tempat yang diurus |

Dengan harga Rp9.900, biaya tetap Vercel Pro setara ±33 penjualan per bulan
sebelum untung. App Hosting dipilih. (Angka harga dicek 2026-11; cek halaman
harga resmi sebelum memutuskan ulang.)

## Untuk developer: uji di emulator

```sh
cd web && npm ci && npm run uji:unit            # skor, timer, katalog, gerbang bank berbayar (tanpa emulator)
cd functions && npm ci && npm run uji          # tes unit pembayaran + skenario emulator (Mayar tiruan): pesanan, webhook, verifikasi, kode cadangan, ebook, rules, gerbang web
cd web && STATIK=1 npm run build && npm run cek-bocor && npm run uji:e2e   # build statis tanpa soal berbayar + E2E Playwright
```

Butuh Java 21. Untuk mencoba situs dengan emulator: jalankan
`npx firebase-tools@14 emulators:start --project demo-soalskd --only auth,functions,firestore,storage`
dari root repo, lalu isi `web/.env.local` mengikuti contoh emulator di
`web/.env.example` (`NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-soalskd`, nilai lain
boleh asal) dan `npm run dev` di `web/`.

Di emulator, `unduhEbook` menandatangani tautan dengan kunci sekali pakai (tanpa
kredensial Google), dan tautannya mengarah ke emulator Storage.

Build statis GitHub Pages (`STATIK=1`): login dan gerbang mati, paket berbayar
terkunci dan soalnya tidak pernah dibaca (`DEV_BUKA_SEMUA` wajib `false`), kartu ebook tidak
ikut dibundel. `scripts/cek-bocor.mjs` menggagalkan deploy dev bila soal berbayar terbawa.
