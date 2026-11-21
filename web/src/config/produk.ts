/**
 * Produk (bundel) yang dijual dan paket yang dibukanya.
 *
 * CERMIN `PRODUK` dan `EBOOK` di functions/src/produk.ts: ubah juga di functions.
 * Di sana keputusan akses dibuat (tukar kode, unduh ebook); di sini hanya untuk
 * tampilan (kartu bundel di /try-out, section harga, kartu ebook). Harga dan
 * tautan beli ada di config/landing.ts (`PENAWARAN`, `TAUTAN_BELI`).
 */
export const PRODUK = {
  "bundel-3to": {
    nama: "Bundel 1: 3 Try Out SKD",
    paket: ["p02", "p03", "p04"],
    labelPaket: "Paket 02, 03, dan 04",
    edisi: "edisi-1",
  },
  "bundel-3to-2": {
    nama: "Bundel 2: 3 Try Out SKD",
    paket: ["p05", "p06", "p07"],
    labelPaket: "Paket 05, 06, dan 07",
    edisi: "edisi-2",
  },
} as const;

export type IdProduk = keyof typeof PRODUK;

/** Urutan tampil: Bundel 1, lalu Bundel 2. */
export const DAFTAR_PRODUK = Object.keys(PRODUK) as IdProduk[];

/** Bundel yang memuat paket ini, atau null (paket gratis / belum dijual). */
export function produkDariPaket(paket: string): IdProduk | null {
  return DAFTAR_PRODUK.find((id) => (PRODUK[id].paket as readonly string[]).includes(paket)) ?? null;
}
