import { PAKET_TERBUKA } from "@/config/akses";

/**
 * Isi landing page yang belum punya data asli di repo.
 * Bagian yang kosong tidak ditampilkan. Jangan isi dengan angka atau kutipan karangan.
 */

/** Soal yang tampil di pratinjau layar ujian pada hero landing dan panduan di /try-out (tanpa kunci). */
export const SOAL_HERO = { paket: "p01", id: "p01-007" };

/** Isi dari pengguna sungguhan (dengan izin). Kosong = section testimoni disembunyikan. */
export const TESTIMONI: { nama: string; keterangan: string; kutipan: string }[] = [];

/**
 * Penawaran berbayar. null = section harga disembunyikan sampai harga diputuskan pemilik.
 * Jangan tambahkan harga coret kecuali paket itu memang pernah dijual di harga tersebut.
 */
export const PENAWARAN: {
  nama: string;
  label: string;
  harga: string;
  isi: { judul: string; detail: string }[];
} | null = {
  nama: "Bundel 3 Try Out SKD",
  label: "Harga perkenalan",
  harga: "Rp9.900",
  isi: [
    { judul: "3 paket try out lengkap", detail: "110 soal per paket: TWK, TIU, dan TKP" },
    { judul: "Pembahasan setiap pilihan", detail: "Tahu kenapa jawabanmu benar atau keliru" },
    { judul: "Ujian di HP", detail: "Timer, grid nomor soal, dan simpan otomatis" },
    { judul: "Ebook PDF", detail: "Soal dan pembahasan untuk dibaca ulang tanpa internet" },
  ],
};

/**
 * Tujuan tombol beli: tautan checkout (QRIS/e-wallet) atau wa.me dengan pesan terisi.
 * null = tombol tampil nonaktif dengan label "segera dibuka" (tidak ada tautan mati).
 */
export const TAUTAN_BELI: string | null = null;

/** Paket yang boleh dicoba gratis dari landing. */
export const PAKET_GRATIS = PAKET_TERBUKA[0];
