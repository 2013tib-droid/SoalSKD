---
version: alpha
name: SoalSKD Tenang
description: Sistem visual aplikasi try out SKD CPNS. Mobile-first, biru tenang, padat tapi mudah dibaca, terang dan gelap. Mengikuti house-style:dashboard-design.
colors:
  # Terang
  primary: "#1E40AF"
  primary-hover: "#1E3A8A"
  on-primary: "#FFFFFF"
  background: "#F7F8FA"
  surface: "#FFFFFF"
  surface-muted: "#F1F3F6"
  border: "#E5E7EB"
  text: "#111827"
  text-muted: "#4B5563"
  ring: "#1E40AF"
  status-unanswered: "#FFFFFF"
  status-answered: "#1E40AF"
  status-doubt: "#F59E0B"
  on-status-doubt: "#111827"
  warning: "#B45309"
  danger: "#B91C1C"
  success: "#15803D"
  # Gelap (hanya abu dari house-style untuk latar)
  background-dark: "#000000"
  surface-dark: "#181818"
  surface-muted-dark: "#1F1F1F"
  surface-raised-dark: "#272727"
  border-dark: "#313131"
  text-dark: "#F3F4F6"
  text-muted-dark: "#A1A1AA"
  primary-dark: "#60A5FA"
  on-primary-dark: "#000000"
  status-doubt-dark: "#FBBF24"
  on-status-doubt-dark: "#000000"
  warning-dark: "#FBBF24"
  danger-dark: "#F87171"
  success-dark: "#4ADE80"
typography:
  heading-5:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: 600
    lineHeight: 32px
  title-3:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: 500
    lineHeight: 24px
  title-4:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: 500
    lineHeight: 20px
  body-5:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: 400
    lineHeight: 26px
  body-6:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
  caption-4:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: 500
    lineHeight: 16px
  mono-timer:
    fontFamily: Geist Mono
    fontSize: 18px
    fontWeight: 600
    lineHeight: 28px
    fontFeature: "\"tnum\" 1"
  mono-number:
    fontFamily: Geist Mono
    fontSize: 14px
    fontWeight: 500
    lineHeight: 20px
    fontFeature: "\"tnum\" 1"
rounded:
  sm: 4px
  md: 8px
  lg: 12px
  full: 9999px
spacing:
  "0": 0px
  "1": 2px
  "2": 4px
  "3": 8px
  "4": 12px
  "5": 16px
  "6": 24px
  "7": 32px
  "8": 40px
  "9": 48px
  "10": 64px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.title-4}"
    rounded: "{rounded.md}"
    height: 48px
    padding: 16px
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.title-4}"
    rounded: "{rounded.md}"
    height: 48px
    padding: 16px
  answer-option:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.body-5}"
    rounded: "{rounded.lg}"
    padding: 16px
  answer-option-selected:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
  grid-cell:
    backgroundColor: "{colors.status-unanswered}"
    textColor: "{colors.text}"
    typography: "{typography.mono-number}"
    rounded: "{rounded.md}"
    size: 44px
  grid-cell-answered:
    backgroundColor: "{colors.status-answered}"
    textColor: "{colors.on-primary}"
  grid-cell-doubt:
    backgroundColor: "{colors.status-doubt}"
    textColor: "{colors.on-status-doubt}"
  exam-topbar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    height: 56px
  exam-actionbar:
    backgroundColor: "{colors.surface}"
    height: 64px
  timer:
    textColor: "{colors.text}"
    typography: "{typography.mono-timer}"
  timer-warning:
    textColor: "{colors.warning}"
  timer-critical:
    textColor: "{colors.danger}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: 16px
---

# SoalSKD Tenang

## Overview

Aplikasi try out SKD CPNS (TWK, TIU, TKP). Pengguna mengerjakan di HP, sering dengan satu tangan, sering malam hari, dan di bawah tekanan waktu. Rasa yang dituju: **tenang, fokus, bisa dipercaya**, seperti ruang ujian yang rapi, bukan aplikasi game.

Urutan prioritas: permintaan pengguna > DESIGN.md ini > `house-style:dashboard-design` > skill lain. Aturan house-style (font, skala teks, spacing, ikon, motion, bahasa) berlaku penuh. Bagian di bawah hanya mencatat pilihan dan pengecualian khusus proyek ini.

Asumsi stack: Next.js + Tailwind. Token dipetakan ke variabel CSS (`--color-primary`, dst.) dan tema Tailwind. Komponen hanya memakai token, bukan hex mentah.

## Colors

- **Biru tenang (`primary`)** dipakai untuk aksi utama, soal yang sudah dijawab, dan fokus. Hanya ada satu warna brand.
- **Amber (`status-doubt`)** khusus untuk status ragu-ragu. Jangan dipakai untuk hal lain supaya maknanya tidak kabur.
- **`warning` / `danger`** hanya untuk timer dan error. **`success`** hanya untuk hasil lulus passing grade.
- Latar datar tanpa gradien. Kartu memakai border di semua sisi (`border`), bukan bayangan.
- **Gelap:** latar hanya dari abu house-style (`#000000` sampai `#313131`). Biru dinaikkan ke `primary-dark` supaya kontrasnya ≥ 4.5:1. Ikuti `prefers-color-scheme`, dengan sakelar manual di profil.
- Warna tidak boleh menjadi satu-satunya sinyal. Status juga ditandai dengan ikon atau bentuk (lihat Components).

## Typography

- **Geist** untuk semua teks, **Geist Mono** untuk timer, nomor soal, dan skor. Tanpa italic.
- Hanya skala Tailwind, didefinisikan sebagai class bernama (`heading-5`, `title-3`, `body-5`, `body-6`, `caption-4`).
- **Pengecualian dari default dashboard 14px:** teks soal dan pilihan jawaban memakai `body-5` (16px, line-height 26px) karena ini teks bacaan panjang di HP. UI lainnya memakai `body-6` (14px).
- Angka memakai `tabular-nums` supaya timer dan skor tidak bergoyang.
- **Landing (`/`)** mengikuti `house-style:landing-page-design`: judul section `heading-4`/`heading-3`, hero `heading-3` → `heading-2` dengan gradien teks (`.teks-hero`, hitam → #666 / putih → #9B9B9B; latar tetap datar), satu efek gerak utama: tagline yang menyala kata per kata.

## Layout

- **Mobile-first, target 360–430px.** Desktop ≥ 1024px adalah tambahan.
- Spacing hanya dari skala house-style. Padding kartu 16px, gap 16 atau 24px. Margin samping layar 16px.
- **Zona jempol:** aksi yang sering dipakai berada di sepertiga bawah layar.
- **Navigasi aplikasi:** di HP pakai bottom nav (maksimal 4 item: Beranda, Try out, Riwayat, Profil). Ini menyimpang dari drawer house-style karena aplikasi harus nyaman dipakai satu tangan. Di desktop pakai sidebar 240px.
- **Layar ujian** (tanpa bottom nav aplikasi):
  - `exam-topbar` sticky 56px: subtes + nomor ("TIU · 12/110"), timer di kanan, tombol grid.
  - Isi: teks soal, lalu pilihan jawaban A–E sebagai kartu selebar layar.
  - `exam-actionbar` sticky 64px di bawah: Sebelumnya · Ragu-ragu · Berikutnya. Menghormati `env(safe-area-inset-bottom)`.
  - Grid nomor soal: bottom sheet di HP dan panel kanan tetap di desktop.

## Elevation & Depth

Tanpa bayangan dekoratif. Kedalaman ditunjukkan dengan border dan perbedaan `surface` / `surface-muted`. Hanya bottom sheet dan dialog yang memakai overlay `rgba(0,0,0,0.4)`.

## Shapes

`rounded.md` (8px) untuk tombol dan sel grid, `rounded.lg` (12px) untuk kartu dan pilihan jawaban, `rounded.full` untuk chip dan badge. Elemen bersarang memakai radius dalam = radius luar − jarak.

## Components

- **Pilihan jawaban (`answer-option`):** tinggi minimal 48px, seluruh kartu bisa diketuk, huruf A–E dalam lingkaran di kiri. Saat dipilih: border 2px `primary`, latar `surface-muted`, dan ikon centang. Di TKP tidak ada jawaban "salah", jadi jangan tampilkan warna benar/salah saat ujian berjalan.
- **Grid nomor soal (`grid-cell`):** sel 44×44px, 5 kolom di HP, dikelompokkan per subtes TWK / TIU / TKP dengan judul `caption-4`.
  - Belum: latar `surface`, border `border`.
  - Dijawab: latar `primary`, teks `on-primary`.
  - Ragu-ragu: latar `status-doubt` + titik kecil di pojok kanan atas (sinyal bentuk).
  - Soal aktif: ring 2px `ring` dengan offset 2px.
  - Legenda dengan jumlah per status selalu tampil di atas grid ("Dijawab 48 · Ragu 3 · Belum 59").
- **Timer:** selalu terlihat di topbar dan tidak pernah tersembunyi saat scroll. Format `jj:mm:dd` dengan Geist Mono.
  - Normal: `text`.
  - Peringatan (ambang dari konfigurasi, misalnya 10 menit): `warning` + ikon jam, dan satu toast "Sisa 10 menit".
  - Kritis (misalnya 5 menit): `danger`. Tanpa kedip, kecuali satu pulse opacity saat masuk ambang (dimatikan oleh `prefers-reduced-motion`).
  - Ambang waktu disimpan di konfigurasi, bukan di komponen.
- **Indikator simpan otomatis:** `caption-4` di bawah topbar: "Tersimpan" + ikon centang. Saat offline: "Belum tersimpan, mencoba lagi" + ikon awan. Jawaban disimpan lokal dulu, lalu disinkronkan.
- **Tombol Ragu-ragu:** toggle dengan `aria-pressed`. Saat aktif memakai latar `status-doubt`.
- **Selesai ujian:** dialog konfirmasi yang menyebut jumlah soal belum dijawab dan ragu-ragu, dengan aksi utama "Kumpulkan" dan aksi sekunder "Periksa lagi".
- **Kartu hasil:** skor per subtes dengan Geist Mono, dibandingkan dengan passing grade dari konfigurasi. Status lulus atau tidak memakai ikon + teks, bukan warna saja. Selalu sertakan catatan kecil: "Format dan passing grade mengikuti konfigurasi. Cek aturan BKN/KemenPAN-RB terbaru."
- **Ikon:** Phosphor (regular, 20px). Jangan pakai emoji atau Material.

## Do's and Don'ts

- **Do:** ukuran target sentuh ≥ 44px, fokus selalu terlihat, ujian bisa dikerjakan dengan keyboard (1–5 / A–E untuk memilih, ← → untuk pindah, R untuk ragu).
- **Do:** skeleton per widget, error per widget dengan tombol "Coba lagi", toast yang spesifik.
- **Do:** motion `cubic-bezier(0.22,1,0.36,1)` selama 200–300ms, hanya `transform`/`opacity`.
- **Don't:** gaya claymorphism, maskot, konfeti, atau warna ceria. Ini ujian, bukan game.
- **Don't:** hardcode jumlah soal, durasi, bobot skor, atau passing grade di komponen. Semuanya dibaca dari konfigurasi.
- **Don't:** menyembunyikan timer, memakai pop-up yang menutupi soal saat ujian, atau memakai tanda seru di copy.
- **Don't:** menyalin soal atau tata letak aplikasi try out lain.
