/**
 * Isi halaman /privasi dan /syarat yang bergantung pada pemilik.
 * `null` = belum diisi: bagian terkait menyesuaikan diri (tidak ada tautan mati
 * atau teks "ISI_DI_SINI"). Jangan isi dengan data karangan.
 * Wajib diisi sebelum situs pembeli dibuka: lihat docs/firebase.md (langkah 12).
 */

/** Nama orang atau badan usaha yang mengelola SoalSKD, mis. "Budi Santoso" atau "CV Contoh". */
export const PENGELOLA: string | null = null;

/** Email kontak umum (privasi, dukungan, pengembalian dana). Ditampilkan di halaman publik. */
export const EMAIL_KONTAK: string | null = null;

/** Nomor WhatsApp kontak, format internasional tanpa + (mis. "6281234567890"). Opsional. */
export const WA_KONTAK: string | null = null;

/**
 * Tanggal mulai berlaku (YYYY-MM-DD), diisi setelah pemilik membaca dan menyetujui teksnya.
 * null = halaman hanya menampilkan "Terakhir diperbarui".
 */
export const BERLAKU_SEJAK: string | null = null;

/** Tanggal terakhir teks di web/src/konten/*.md atau nilai di file ini diubah (YYYY-MM-DD). */
export const DIPERBARUI = "2026-11-07";

/**
 * Kebijakan pengembalian dana (Markdown), tampil di /syarat#pengembalian-dana.
 * USULAN, BELUM DISETUJUI PEMILIK. Ubah di sini sebelum situs pembeli dibuka.
 */
export const PENGEMBALIAN_DANA = `Bundel ini produk digital yang langsung bisa dipakai setelah kode ditukar, jadi pembayaran yang berhasil pada umumnya tidak bisa dikembalikan. Kami mengembalikan dana penuh kalau:

- pembayaranmu tercatat di Mayar, tapi kode aktivasi tidak sampai ke emailmu dan kami tidak berhasil mengirimkannya ulang;
- kode tidak bisa ditukar karena kesalahan di pihak kami, dan kami tidak bisa memperbaikinya; atau
- kamu tidak sengaja membayar dua kali untuk produk yang sama, dan kode dari pembayaran kedua belum ditukar.

Untuk meminta pengembalian dana, hubungi kami (lihat bagian [Kontak](#kontak)) dan sebutkan email yang kamu pakai saat membayar serta waktu pembayaran. Setelah dana dikembalikan, akses dari pesanan itu kami cabut.`;
