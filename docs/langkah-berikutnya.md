# Langkah berikutnya (catatan serah terima)

Status per 2026-11-25. Baca ini dulu di sesi baru.

## Kisi-kisi SKD 2026 (2026-11-28): butuh tindakan pemilik

Soal sudah mengikuti KepmenPANRB 674/2026 (p01 di repo ini, p02–p07 di `SoalSKD-bank` branch
`claude/cool-cray-illzma`), dan `config/skd.json` memakai ambang batas 65/80/166. Situs pembeli dan
ebook di Storage **masih versi lama** sampai pemilik menjalankan (setelah branch bank di-merge):

1. `sh tools/unggah-bank.sh <bucket>`: unggah p02–p07 baru ke Storage privat.
2. `sh tools/unggah-ebook.sh <bucket> edisi-1` dan `sh tools/unggah-ebook.sh <bucket> edisi-2`:
   buat ulang dan unggah ebook (sudah dicoba dengan `--cuma-buat`: 446 dan 479 halaman, matriks
   dan tabel tampil benar).

`bank/katalog.json` tidak berubah (judul dan jumlah soal tetap).

## Sudah selesai

- Pembelian otomatis lewat Mayar tanpa Gmail dan tanpa kode manual: kode, tes (emulator + Mayar tiruan), dan dokumen. Ringkasan lengkap: `docs/laporan-pembelian-otomatis.md`.
- GitHub Pages dev bersih dari soal berbayar (hanya p01).
- Bank soal berbayar p02–p07 + gambar figural dipindah ke repo **privat** `2013tib-droid/SoalSKD-bank`. Repo publik tinggal `bank/p01.json` + `bank/katalog.json`. Untuk mengerjakan soal berbayar atau membuat ebook, sesi perlu kedua repo (`SoalSKD-bank` di-clone di sebelah `SoalSKD`, lihat README di repo itu).

## Belum dilakukan (dan kenapa)

- Integrasi Mayar dan Firebase **belum pernah berjalan sungguhan**. Belum ada deploy backend dan belum ada transaksi asli.
- History git repo publik masih memuat p02–p07 lama. Keputusan pemilik: repo `SoalSKD` dijadikan privat saat deploy.
- `PENJUALAN_DIBUKA` (`web/src/config/landing.ts`) masih `false`, jadi tombol beli nonaktif.

## Langkah berikutnya (satu per satu)

1. **Sekarang:** ajukan verifikasi toko (KYC) di dashboard Mayar. Menu API key dan webhook biasanya baru muncul setelah disetujui.
2. Setelah KYC disetujui: buat API key **Read & Write** dan salin Webhook Token (`docs/firebase.md` langkah 6). Jangan tempel kunci ke chat.

Sisanya sudah urut di `docs/firebase.md` (langkah 1–13) dan checklist di `docs/laporan-pembelian-otomatis.md` bagian 8–12. Kerjakan dua langkah sekali jalan, jangan semuanya sekaligus.

## Untuk sesi Claude berikutnya

- Pemilik ingin dipandu **1–2 langkah per giliran**, tidak banyak sekaligus.
- Jangan deploy backend, merge ke branch `produksi`, transaksi sungguhan, ubah visibilitas repo, atau force push tanpa izin pemilik.
- Tes: `cd web && npm run uji:unit` · `cd functions && npm run uji` · `cd web && STATIK=1 npm run build && npm run cek-bocor && npm run uji:e2e`.
