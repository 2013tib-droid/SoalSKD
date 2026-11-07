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
   Tombol **Unduh ebook PDF** muncul di halaman Try out; server memberi tautan
   unduh yang hanya berlaku ±10 menit.
5. Paket p01 tetap gratis tanpa login.

Jawaban dan riwayat skor pembeli yang login tersimpan di akunnya, jadi pindah HP
tidak hilang. Pengunjung yang belum login tetap tersimpan di HP-nya saja, dan
datanya ikut pindah ke akun saat ia pertama kali login.

Yang dipakai:

| Bagian | Layanan | Lokasi |
|---|---|---|
| Login | Firebase Authentication | — |
| Database (paket milik, jawaban, riwayat, pesanan) | Cloud Firestore | Jakarta (`asia-southeast2`) |
| Tukar kode + webhook Mayar + tautan unduh ebook | Cloud Functions | Jakarta (`asia-southeast2`) |
| File ebook PDF (privat) | Cloud Storage for Firebase | Jakarta (`asia-southeast2`) |
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
4. **Verifikasi merchant / data toko**: kalau Mayar meminta URL kebijakan,
   isi `https://DOMAIN/privasi` (privasi), `https://DOMAIN/syarat` (syarat), dan
   `https://DOMAIN/syarat#pengembalian-dana` (pengembalian dana). Teks
   pengembalian dana ada di `PENGEMBALIAN_DANA` (`web/src/config/legal.ts`) dan
   masih **usulan**: setujui atau ubah dulu (langkah 12).
5. Kirim **tautan produk Mayar** ke Claude. Claude mengisinya di `TAUTAN_BELI`
   (`web/src/config/landing.ts`) supaya tombol beli di landing aktif.

## 10. Ebook PDF di Storage (privat)

Ebook dijanjikan di kartu harga. File-nya **tidak boleh** ada di repo, `web/public`,
atau situs dev (repo ini publik). Tempatnya di Storage dengan path
`ebook/edisi-1.pdf`, tertutup untuk semua client (`storage.rules`). Pembeli
menekan **Unduh ebook PDF** di halaman Try out; Cloud Function `unduhEbook` mengecek
akunnya punya paket bundel (p02/p03/p04), lalu memberi tautan bertanda tangan
yang berlaku **10 menit** dengan nama file `SoalSKD-Edisi-1.pdf`.

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
sh tools/unggah-ebook.sh soalskd-1a2b3.firebasestorage.app   # ganti dengan nama bucket
```

Skrip ini memvalidasi `bank/p02–p04`, membuat `ebook/dist/edisi-1.pdf` (Edisi 1,
330 soal), lalu `gsutil cp` ke `gs://<bucket>/ebook/edisi-1.pdf`. Hanya ingin
membuat PDF: `sh tools/unggah-ebook.sh --cuma-buat`.

Tanpa skrip: buat PDF dengan
`node ebook/buat-ebook.mjs bank/p02.json bank/p03.json bank/p04.json --judul "Edisi 1" --keluar ebook/dist/edisi-1.pdf`,
lalu Console → **Storage → Create folder** `ebook` → buka folder → **Upload file**
→ pilih PDF-nya dan beri nama persis `edisi-1.pdf` (ganti nama di komputer dulu
kalau perlu).

**Jangan** klik "Create new access token" atau membagikan tautan dari Console:
tautan semacam itu berlaku selamanya dan bisa disebar.

### 10d. Setiap kali isi bank berubah

Soal p02–p04 diperbaiki atau ditambah → jalankan lagi **10c**. File lama ditimpa
di path yang sama, jadi tombol unduh langsung memberi versi baru. Pembeli yang
sudah mengunduh tetap memegang versi lamanya. Edisi baru dengan nama file lain
(mis. "Edisi 2") butuh perubahan kecil di `functions/src/index.ts` (`EBOOK`) dan
skrip; minta Claude.

## 11. Uji sekali dengan uang sungguhan

Beli sendiri pakai email lain (Rp9.900). Dalam beberapa menit email berisi kode
harus masuk. Daftar dengan email itu, verifikasi, buka **Aktivasi kode**,
masukkan kode → "Semua paket sudah aktif" → buka Paket 02. Kembali ke halaman
Try out → **Unduh ebook PDF** → file `SoalSKD-Edisi-1.pdf` terunduh.

## 12. Lengkapi halaman Privasi dan Syarat (sebelum jualan)

Halaman `/privasi` dan `/syarat` membaca nilai dari `web/src/config/legal.ts`.
Nilai `null` disembunyikan dengan rapi, tapi **wajib diisi sebelum situs pembeli
dibuka** (repo ini publik, jadi isi hanya data yang memang boleh tampil di
halaman publik). Kirim nilainya ke Claude atau ubah sendiri:

| Nilai | Isi | Kenapa wajib |
|---|---|---|
| `PENGELOLA` | nama Anda atau badan usaha | UU PDP: pengendali data harus jelas; Mayar dan Google juga memeriksanya |
| `EMAIL_KONTAK` | email kontak umum (boleh Gmail pengirim kode) | tanpa ini, yang belum membeli tidak punya cara meminta hapus akun |
| `WA_KONTAK` | nomor WA, mis. `6281234567890` | opsional |
| `PENGEMBALIAN_DANA` | teks kebijakan pengembalian dana | sekarang masih usulan Claude, perlu persetujuan Anda |
| `BERLAKU_SEJAK` | tanggal mulai berlaku, mis. `2026-12-01` | diisi setelah Anda membaca kedua halaman |
| `DIPERBARUI` | tanggal terakhir teks diubah | ganti setiap kali teks atau nilai berubah |

Teks lengkapnya di `web/src/konten/privasi.md` dan `web/src/konten/syarat.md`.
Daftar data yang dijelaskan di sana: `docs/data-pribadi.md`. Teks ini bukan
nasihat hukum; baca ulang (atau minta orang yang paham hukum membacanya)
sebelum situs pembeli dibuka.

---

## Memantau dan menangani masalah

Semua pesanan ada di Firestore → koleksi **`orders`** (id = id transaksi Mayar):

| Isi dokumen | Artinya | Yang dilakukan |
|---|---|---|
| `code` + `emailedAt` terisi | Beres | — |
| `code` terisi, `emailedAt` kosong | Email gagal; Mayar mengulang sendiri | Setelah 1 jam masih kosong: kirim kode di `code` secara manual |
| `problem: produk-tidak-dikenal` | Nama produk tidak cocok | Buat kode manual (di bawah), betulkan nama produk |
| `problem: status-…` | Status pembayaran bukan sukses | Cek di dasbor Mayar; kalau ternyata lunas, kirim kode manual |

Pembeli melapor ebook tidak bisa diunduh: lihat log function `unduhEbook`
(Console → Functions → Logs). `file belum diunggah` = ulangi langkah 10c;
`gagal menandatangani URL` = cek langkah 10b.

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
cd functions && npm ci && npm run uji          # 55 skenario: webhook, tukar kode, unduh ebook, rules Firestore + Storage
```

Butuh Java 21. Untuk mencoba situs dengan emulator: jalankan
`npx firebase-tools@14 emulators:start --project demo-soalskd --only auth,functions,firestore,storage`
dari root repo, lalu isi `web/.env.local` mengikuti contoh emulator di
`web/.env.example` (`NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-soalskd`, nilai lain
boleh asal) dan `npm run dev` di `web/`.

Di emulator, `unduhEbook` menandatangani tautan dengan kunci sekali pakai (tanpa
kredensial Google), dan tautannya mengarah ke emulator Storage.

Build statis GitHub Pages (`STATIK=1`): login dan gerbang mati, p02–p04
terkunci, kartu ebook tidak ikut dibundel. Hanya untuk penguji.
