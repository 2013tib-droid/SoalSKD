Halaman ini menjelaskan data apa yang disimpan saat kamu memakai SoalSKD, untuk apa, di mana, berapa lama, dan cara kamu mengaturnya. Kebijakan ini disusun dengan mengacu pada Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP).

## Pengelola dan kontak

{{pengelola}}

{{kontak}}

## Data yang kami kumpulkan

### Kalau kamu belum punya akun

Semua data tersimpan di perangkatmu saja dan tidak dikirim ke database kami:

- jawaban, tanda ragu-ragu, nomor soal terakhir, dan jam selesai ujian yang sedang berjalan;
- riwayat skor, maksimal 50 percobaan terakhir.

Saat ujian dikumpulkan, jawabanmu dikirim ke server untuk dinilai. Server menghitung skor lalu mengirimkannya kembali; jawaban itu tidak disimpan di server.

### Kalau kamu punya akun

- **Email dan kata sandi.** Kata sandi dikirim langsung ke Firebase Authentication (layanan Google) dan disimpan di sana dalam bentuk yang tidak bisa dibaca ulang. Kata sandi tidak disimpan di database kami.
- **Data akun dari Firebase Authentication:** ID akun, status verifikasi email, cara masuk, waktu daftar, dan waktu masuk terakhir.
- **Kalau kamu masuk dengan Google:** Google mengirim email, nama, dan foto profil akun Googlemu ke Firebase Authentication. Aplikasi SoalSKD hanya memakai email dan ID akun; nama dan foto tidak ditampilkan dan tidak disalin ke database kami.
- **Paket yang kamu miliki:** daftar paket dan produk yang aktif di akunmu, serta waktu terakhir diperbarui.
- **Jawaban ujian yang sedang berjalan dan riwayat skor:** data perangkat di atas disalin ke akunmu supaya bisa dilanjutkan di perangkat lain. Data yang kamu buat sebelum masuk ikut dipindah ke akun saat kamu masuk.
- **Percobaan kode aktivasi yang gagal:** jumlah dan waktunya, untuk membatasi tebakan kode (maksimal 10 kali gagal per jam).

Firebase Authentication juga mengirim email verifikasi dan email atur ulang kata sandi ke alamat akunmu.

### Kalau kamu membeli

Pembayaran diproses oleh Mayar. Setelah pembayaran berhasil, Mayar mengirim data pesanan ke server kami, lalu kami menyimpan:

- email dan nama yang kamu isi saat membayar;
- ID transaksi, ID dan nama produk, serta jumlah pembayaran;
- kode aktivasi untuk pesananmu, waktu email kode terkirim, dan catatan kalau pesanan perlu ditangani manual.

Saat kode ditukar, kami mencatat akun mana yang menukarnya dan kapan. Dengan begitu pesanan, kode, dan akunmu saling terhubung.

Kami tidak menerima nomor kartu, nomor rekening, atau PIN e-wallet. Data itu diproses Mayar dan penyedia pembayarannya.

Tautan unduh ebook dibuat saat kamu menekan tombol unduh, berlaku 10 menit, dan tidak disimpan.

### Log server

Saat situs dan Cloud Functions berjalan, Google Cloud mencatat log teknis. Log permintaan bawaan platform memuat alamat IP, jenis browser, alamat yang diminta, dan waktunya. Log yang kami tulis sendiri berisi ID pesanan, produk, status pemrosesan, dan ID akun saat ebook diunduh. Kode aktivasi dan token tidak pernah ditulis ke log. Email pembeli juga tidak kami tulis ke log, kecuali kalau termuat dalam pesan galat dari server email.

## Tujuan dan dasar pemrosesan

| Tujuan | Data | Dasar |
|---|---|---|
| Menjalankan try out, menyimpan progres, dan menampilkan riwayat | Jawaban, riwayat skor | Menjalankan layanan yang kamu minta |
| Membuat akun dan login | Data akun | Menjalankan layanan yang kamu minta |
| Mengirim kode dan membuka paket yang dibeli | Data pesanan, paket milikmu | Menjalankan perjanjian jual beli |
| Mencegah penyalahgunaan kode | Percobaan kode gagal, log | Kepentingan yang sah: menjaga kode pembeli |
| Membantu pembeli dan memproses pengembalian dana | Data pesanan, kode, isi pesanmu | Menjalankan perjanjian jual beli |

Kami tidak memakai datamu untuk iklan dan tidak mengirim email promosi. Email yang dikirim hanya email kode aktivasi, serta email verifikasi dan atur ulang kata sandi dari Firebase Authentication.

## Pihak lain yang memproses data

| Pihak | Untuk apa | Lokasi |
|---|---|---|
| Google Firebase: Firestore dan Cloud Functions | Database akun, paket, pesanan; tukar kode; pemrosesan pesanan Mayar | Jakarta (asia-southeast2) |
| Google Firebase: App Hosting | Menjalankan situs | Singapura (asia-southeast1) |
| Google Firebase: Authentication | Akun dan login | Pusat data Google, termasuk di luar Indonesia |
| Google Cloud Storage | File ebook (tidak berisi data pribadi) | Jakarta (asia-southeast2) |
| Google Cloud Logging | Log teknis | Pusat data Google |
| Gmail (Google) | Mengirim email kode dari akun Gmail kami; salinannya tersimpan di folder Terkirim | Pusat data Google |
| Mayar | Pembayaran | Lihat kebijakan privasi Mayar |
| GitHub Pages | Hanya situs uji coba (tanpa login dan pembayaran) | Server GitHub di luar Indonesia |

Sebagian data diproses di luar Indonesia, yaitu di Singapura dan di pusat data Google lainnya. Setiap pihak di atas memproses data sesuai kebijakan privasinya sendiri.

## Penyimpanan di perangkatmu

Situs ini menyimpan data di browser perangkatmu:

- `soalskd:ujian:<paket>`: jawaban ujian yang sedang berjalan (localStorage);
- `soalskd:riwayat`: riwayat skor (localStorage);
- `soalskd:pernah-masuk`: penanda bahwa perangkat ini pernah masuk, supaya modul login hanya dimuat bila perlu (localStorage);
- `soalskd:google-redirect`: penanda sementara saat masuk dengan Google lewat pindah halaman (sessionStorage);
- sesi login Firebase Authentication (IndexedDB atau localStorage), sampai kamu keluar.

Situs ini tidak memasang cookie dan tidak memakai analitik, piksel iklan, atau pelacak pihak ketiga. Font dimuat dari situs ini sendiri. Halaman masuk Google memakai cookie Google sendiri.

Cara menghapus data di perangkat:

- tekan **Keluar** di menu akun: jawaban dan riwayat dihapus dari perangkat setelah tersalin ke akun. Kalau perangkat sedang offline dan data belum tersalin, data dibiarkan supaya tidak hilang;
- tekan **Ulangi** pada satu paket untuk menghapus jawaban paket itu (juga dari akun);
- hapus data situs di pengaturan browser. Tanpa akun, data yang dihapus dengan cara ini tidak bisa dikembalikan.

## Lama penyimpanan

- **Data di perangkat:** sampai kamu menghapusnya dengan cara di atas.
- **Akun, paket, jawaban, dan riwayat di akun:** selama akunmu ada. Belum ada penghapusan otomatis.
- **Data pesanan dan kode aktivasi:** disimpan sebagai catatan pembelian untuk dukungan dan pengembalian dana. Belum ada aturan hapus otomatis. Kalau jangka waktunya sudah ditetapkan, halaman ini akan diperbarui.
- **Percobaan kode yang gagal:** dihapus saat kode berhasil ditukar.
- **Log teknis:** mengikuti masa simpan Google Cloud Logging (bawaan 30 hari).
- **Email kode di folder Terkirim Gmail kami:** sampai dihapus.

## Hak kamu

Sesuai UU PDP, kamu berhak:

- **mengetahui dan mengakses datamu.** Jawaban dan riwayat skor terlihat di halaman Try out, email akun di menu akun. Untuk salinan data lain, hubungi kami;
- **memperbaiki data yang salah**, misalnya email pembelian yang salah ketik;
- **menghapus akun dan datamu.** Tombol hapus akun belum ada di aplikasi, jadi kirim permintaan lewat kontak di atas dari email akunmu. Kami menghapus akun beserta paket, jawaban, dan riwayat di akun itu. Untuk catatan pesanan, kami jelaskan apa yang masih perlu disimpan dan alasannya;
- **menarik persetujuan** dengan berhenti memakai layanan, keluar dari akun, dan meminta akunmu dihapus.

Permintaan dikirim lewat [kontak di atas](#pengelola-dan-kontak). Untuk menjaga akunmu, kami bisa meminta bukti bahwa kamu pemilik email akun itu.

## Keamanan

Langkah yang kami terapkan:

- koneksi ke situs dan ke layanan Firebase memakai HTTPS;
- aturan database membuat setiap akun hanya bisa membaca datanya sendiri. Data pesanan, kode aktivasi, dan percobaan kode tertutup dari browser dan hanya bisa diakses server;
- hak atas paket berbayar dicek di server, bukan di browser;
- file ebook disimpan di penyimpanan privat dan hanya bisa diunduh lewat tautan berumur 10 menit;
- kode aktivasi tidak ditulis ke log.

Tidak ada sistem yang sepenuhnya aman. Kalau terjadi kebocoran yang menyangkut datamu, kami akan memberitahumu sesuai UU PDP.

## Usia pengguna

SoalSKD ditujukan untuk orang dewasa yang bersiap mengikuti seleksi CPNS. Kalau kamu belum berusia 18 tahun, pakai layanan ini dengan izin orang tua atau wali.

## Perubahan kebijakan

Kebijakan ini bisa diperbarui saat layanan berubah. Tanggal di bagian atas halaman menunjukkan versi yang berlaku. Perubahan penting akan diumumkan di situs.
