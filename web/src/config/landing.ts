/**
 * Isi landing page yang belum punya data asli di repo.
 * Bagian yang kosong tidak ditampilkan. Jangan isi dengan angka atau kutipan karangan.
 */

/** Soal contoh interaktif di landing. Kunci dan pembahasan soal ini ikut ke browser. */
export const CONTOH_SOAL = { paket: "p01", id: "p01-010" };

/** Soal yang tampil di pratinjau layar ujian pada hero (tanpa kunci). */
export const SOAL_HERO = { paket: "p01", id: "p01-007" };

/** Isi dari pengguna sungguhan (dengan izin). Kosong = section testimoni disembunyikan. */
export const TESTIMONI: { nama: string; keterangan: string; kutipan: string }[] = [];

/** Paket berbayar. null = section harga disembunyikan sampai harga diputuskan pemilik. */
export const HARGA: { nama: string; harga: string; isi: string[] }[] | null = null;
