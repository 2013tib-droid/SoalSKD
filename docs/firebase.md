# Backend, login, dan penjualan SoalSKD (Firebase + Mayar)

Panduan ini untuk pemilik. Kerjakan berurutan, **sekali saja**. Kalau ada langkah
yang membingungkan, kirim tangkapan layarnya ke Claude (tanpa kata sandi/token).

## Gambaran alurnya

1. Pembeli membayar **Bundel 3 Try Out SKD** di Mayar (QRIS/e-wallet).
2. Mayar memberi tahu server kita (webhook). Server membuat **satu kode aktivasi
   baru** untuk pesanan itu dan mengirimnya ke **email pembeli**.
3. Pembeli membuka situs → **Masuk** (email + kata sandi, atau Google) →
   halaman **Aktivasi kode** → memasukkan kode.
4. Paket p02, p03, p04 terbuka di akun itu, di HP mana pun ia login.
5. Paket p01 tetap gratis tanpa login.

Jawaban dan riwayat skor pembeli yang login tersimpan di akunnya, jadi pindah HP
tidak hilang. Pengunjung yang belum login tetap tersimpan di HP-nya saja, dan
datanya ikut pindah ke akun saat ia pertama kali login.

Yang dipakai:

| Bagian | Layanan | Lokasi |
|---|---|---|
| Login | Firebase Authentication | — |
| Database (paket milik, jawaban, riwayat, pesanan) | Cloud Firestore | Jakarta (`asia-southeast2`) |
| Tukar kode + webhook Mayar | Cloud Functions | Jakarta (`asia-southeast2`) |
| Situs (Next.js dengan server) | Firebase App Hosting | Singapura (`asia-southeast1`) |
| Email kode | Gmail dengan App Password | — |

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

## 6. Siapkan dua rahasia: App Password Gmail dan Webhook Token Mayar

**Jangan ditempel ke chat mana pun, termasuk ke Claude.**

### 6a. App Password Gmail

Kode dikirim dari satu akun Gmail milik Anda (disarankan Gmail khusus, mis.
`soalskd.id@gmail.com`; alamat ini juga jadi alamat balasan pembeli).

1. Masuk ke https://myaccount.google.com dengan Gmail itu.
2. **Keamanan → Verifikasi 2 Langkah** harus aktif.
3. Buka https://myaccount.google.com/apppasswords → nama `SoalSKD` → **Buat**.
4. Salin 16 hurufnya ke Notepad sementara.

Gmail bisa mengirim sekitar 500 email per hari, jauh di atas kebutuhan awal.

### 6b. Webhook Token Mayar

Dasbor Mayar → **Integrasi → Webhook** → salin **Webhook Token**. (Menu ini
biasanya baru muncul setelah KYC Mayar disetujui.)

### 6c. Simpan di Secret Manager

1. Buka `https://console.cloud.google.com/security/secret-manager?project=PROJECT_ID`
   (ganti `PROJECT_ID`). Kalau diminta, tekan **Enable**.
2. **Create secret** → Name `MAYAR_WEBHOOK_TOKEN` → value: Webhook Token → Create.
3. **Create secret** → Name `GMAIL_APP_PASSWORD` → value: 16 huruf App Password → Create.

Nama secret harus persis begitu (huruf besar semua).

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
| Variable | `EMAIL_PENGIRIM` | Gmail dari langkah 6a |
| Variable | `URL_SITUS` | alamat situs, mis. `https://soalskd.id` (boleh dikosongkan dulu) |

Setelah itu file JSON di komputer boleh dihapus.

### 7c. Jalankan

Tab **Actions → Deploy backend → Run workflow**:
1. target `functions,firestore`, **dry_run dicentang** → Run. Harus hijau.
2. Ulangi **tanpa centang** dry_run. Ini mengirim Cloud Functions dan aturan
   keamanan database.

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
   **Deploy backend** sekali lagi (target `functions`) supaya tautan di email
   kode menunjuk ke situs.

**Jangan rollout ke produksi sebelum yakin**: gabungkan ke `produksi` hanya
setelah dicoba di alamat App Hosting.

## 9. Mayar

1. **Produk**: buat produk digital dengan nama yang memuat kata **Bundel** dan
   angka **3**, mis. `Bundel 3 Try Out SKD`, harga Rp9.900.
   Server menebak produk dari nama itu. Nama lain (atau bundel dengan angka lain)
   **tidak dikirimi kode otomatis**, dicatat untuk ditangani manual.
   Kalau ingin nama bebas: Firestore → koleksi `config` → dokumen
   `mayar_products` → field bernama **id produk Mayar**, nilai `bundel-3to`.
2. **Catatan produk** (tampil setelah bayar):
   > Terima kasih sudah membeli SoalSKD. Kode aktivasi dikirim otomatis ke email
   > yang kamu isi saat membayar, biasanya dalam beberapa menit. Cek juga folder
   > Spam/Promosi. Lalu buka situs SoalSKD → Masuk → Aktivasi kode.
3. **URL webhook**: Dasbor Mayar → **Integrasi → Webhook** → isi
   ```
   https://asia-southeast2-PROJECT_ID.cloudfunctions.net/mayarWebhook
   ```
   (ganti `PROJECT_ID`, tanpa apa pun di belakangnya). Simpan → **Test**.
   Hasil benar: **200**. Kalau **401**: token di Secret Manager tidak sama dengan
   di dasbor Mayar (cek spasi yang ikut tersalin), perbaiki lalu deploy ulang.
4. Kirim **tautan produk Mayar** ke Claude. Claude mengisinya di `TAUTAN_BELI`
   (`web/src/config/landing.ts`) supaya tombol beli di landing aktif.

## 10. Uji sekali dengan uang sungguhan

Beli sendiri pakai email lain (Rp9.900). Dalam beberapa menit email berisi kode
harus masuk. Daftar dengan email itu, verifikasi, buka **Aktivasi kode**,
masukkan kode → "Semua paket sudah aktif" → buka Paket 02.

---

## Memantau dan menangani masalah

Semua pesanan ada di Firestore → koleksi **`orders`** (id = id transaksi Mayar):

| Isi dokumen | Artinya | Yang dilakukan |
|---|---|---|
| `code` + `emailedAt` terisi | Beres | — |
| `code` terisi, `emailedAt` kosong | Email gagal; Mayar mengulang sendiri | Setelah 1 jam masih kosong: kirim kode di `code` secara manual |
| `problem: produk-tidak-dikenal` | Nama produk tidak cocok | Buat kode manual (di bawah), betulkan nama produk |
| `problem: status-…` | Status pembayaran bukan sukses | Cek di dasbor Mayar; kalau ternyata lunas, kirim kode manual |

Pembeli salah ketik email: cari pesanannya di `orders`, kirim kode yang sama dari
field `code`. **Jangan buat kode baru**, supaya satu pembayaran tetap satu kode.

**Membuat kode manual** (giveaway, transfer biasa): Firestore → koleksi
`activation_codes` → **Add document**:
- Document ID: kode tanpa tanda hubung, huruf besar, mis. `HADIAH2026A`
- Field: `produk` (string) `bundel-3to`, `used` (boolean) `false`

Pembeli bisa mengetiknya dengan atau tanpa tanda hubung/spasi.

**Token Mayar bocor**: buat token baru di Mayar, tambahkan sebagai **versi baru**
di secret `MAYAR_WEBHOOK_TOKEN`, lalu jalankan Deploy backend (target `functions`).

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
cd functions && npm ci && npm run uji          # 41 skenario: webhook, tukar kode, rules
```

Butuh Java 21. Untuk mencoba situs dengan emulator: jalankan
`npx firebase-tools@14 emulators:start --project demo-soalskd --only auth,functions,firestore`
dari root repo, lalu isi `web/.env.local` mengikuti contoh emulator di
`web/.env.example` (`NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-soalskd`, nilai lain
boleh asal) dan `npm run dev` di `web/`.

Build statis GitHub Pages (`STATIK=1`) tetap seperti dulu: login dan gerbang
mati, semua paket terbuka, kunci ikut ke browser. Hanya untuk penguji.
