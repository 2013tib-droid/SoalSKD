import { PAKET_TERBUKA } from "@/config/akses";
import { PRODUK, type IdProduk } from "@/config/produk";

/**
 * Isi landing page yang belum punya data asli di repo.
 * Bagian yang kosong tidak ditampilkan. Jangan isi dengan angka atau kutipan karangan.
 */

/** Soal yang tampil di pratinjau layar ujian pada hero landing dan panduan di /try-out (tanpa kunci). */
export const SOAL_HERO = { paket: "p01", id: "p01-007" };

/** Isi dari pengguna sungguhan (dengan izin). Kosong = section testimoni disembunyikan. */
export const TESTIMONI: { nama: string; keterangan: string; kutipan: string }[] = [];

/**
 * Penawaran berbayar: satu entri per bundel (`config/produk.ts`), dijual terpisah.
 * Daftar kosong = section harga disembunyikan. Jangan tambahkan harga coret kecuali
 * bundel itu memang pernah dijual di harga tersebut, dan jangan menjanjikan akses selamanya.
 */
export type Penawaran = {
  produk: IdProduk;
  nama: string;
  /** Pita kecil di atas nama, mis. "Harga perkenalan". null = tanpa pita. */
  label: string | null;
  harga: string;
  /** Isi khas bundel ini (paket dan edisi ebook). Fitur yang sama ada di `FITUR_BUNDEL`. */
  isi: { judul: string; detail: string }[];
};

export const PENAWARAN: Penawaran[] = [
  {
    produk: "bundel-3to",
    nama: PRODUK["bundel-3to"].nama,
    label: "Harga perkenalan",
    harga: "Rp9.900",
    isi: [
      { judul: PRODUK["bundel-3to"].labelPaket, detail: "3 try out lengkap: TWK, TIU, dan TKP" },
      { judul: "Ebook PDF Edisi 1", detail: "Soal, kunci, dan pembahasan ketiga paket untuk dibaca ulang" },
    ],
  },
  {
    produk: "bundel-3to-2",
    nama: PRODUK["bundel-3to-2"].nama,
    label: "Paket baru",
    harga: "Rp9.900",
    isi: [
      { judul: PRODUK["bundel-3to-2"].labelPaket, detail: "3 try out lengkap dengan soal yang berbeda dari Bundel 1" },
      { judul: "Ebook PDF Edisi 2", detail: "Soal, kunci, dan pembahasan ketiga paket untuk dibaca ulang" },
    ],
  },
];

/** Yang didapat di setiap bundel; tampil sekali di bawah kartu harga. */
export const FITUR_BUNDEL: { judul: string; detail: string }[] = [
  { judul: "Pembahasan setiap pilihan", detail: "Tahu kenapa jawabanmu benar atau keliru" },
  { judul: "Ujian di HP", detail: "Timer, grid nomor soal, dan simpan otomatis" },
  { judul: "Kode aktivasi lewat email", detail: "Ditukar di akunmu; semua bundel bisa di satu akun" },
];

/**
 * Tujuan tombol beli per bundel: tautan checkout (QRIS/e-wallet) atau wa.me dengan pesan terisi.
 * null = tombol tampil nonaktif "Pembelian segera dibuka" (tidak ada tautan mati).
 */
export const TAUTAN_BELI: Record<IdProduk, string | null> = {
  "bundel-3to": null,
  "bundel-3to-2": null,
};

/** Penawaran untuk satu bundel, atau undefined kalau bundel itu belum ditawarkan. */
export function penawaranUntuk(produk: IdProduk): Penawaran | undefined {
  return PENAWARAN.find((x) => x.produk === produk);
}

/** Paket yang boleh dicoba gratis dari landing. */
export const PAKET_GRATIS = PAKET_TERBUKA[0];
