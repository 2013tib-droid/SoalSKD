/**
 * Produk yang dijual, harganya, paket yang dibukanya, dan ebook per edisi.
 *
 * Modul ini murni (tanpa Firebase) supaya bisa diuji langsung dengan Node
 * (`test/produk.mjs`). Sengaja diulang di web (`web/src/config/produk.ts`),
 * bukan diimpor: functions di-deploy terpisah. Ubah keduanya bersamaan.
 */

/**
 * `harga` dalam rupiah (IDR, bilangan bulat). Ini satu-satunya sumber nominal yang
 * ditagihkan ke Mayar (`buatPesanan`) dan dicocokkan saat verifikasi pembayaran.
 * Tampilan harga di web: `PENAWARAN` (web/src/config/landing.ts); ubah bersamaan.
 */
export const PRODUK = {
  'bundel-3to': { judul: 'Bundel 1: 3 Try Out SKD', paket: ['p02', 'p03', 'p04'], harga: 9900 },
  'bundel-3to-2': { judul: 'Bundel 2: 3 Try Out SKD', paket: ['p05', 'p06', 'p07'], harga: 9900 },
} as const;
export type IdProduk = keyof typeof PRODUK;

export function isProduk(v: unknown): v is IdProduk {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(PRODUK, v);
}

/**
 * Ebook PDF per edisi. Edisi dibuka oleh paket bundel yang sama (punya minimal
 * satu paketnya = boleh mengunduh). File diunggah pemilik ke `path` di Storage
 * privat (docs/firebase.md); nama unduhan dipaksa lewat Content-Disposition.
 */
export const EBOOK = {
  'edisi-1': { judul: 'Ebook Edisi 1', path: 'ebook/edisi-1.pdf', namaFile: 'SoalSKD-Edisi-1.pdf', produk: 'bundel-3to' },
  'edisi-2': { judul: 'Ebook Edisi 2', path: 'ebook/edisi-2.pdf', namaFile: 'SoalSKD-Edisi-2.pdf', produk: 'bundel-3to-2' },
} as const satisfies Record<string, { judul: string; path: string; namaFile: string; produk: IdProduk }>;
export type IdEdisi = keyof typeof EBOOK;

export function isEdisi(v: unknown): v is IdEdisi {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(EBOOK, v);
}

/** Boleh mengunduh edisi ini? Cukup satu paket dari bundel edisi tersebut. */
export function punyaEdisi(milik: unknown, edisi: IdEdisi): boolean {
  const paket: readonly string[] = PRODUK[EBOOK[edisi].produk].paket;
  return Array.isArray(milik) && milik.some((p) => typeof p === 'string' && paket.includes(p));
}

/** Paket yang dibuka sekumpulan produk (urut, tanpa duplikat). */
export function paketDariProduk(produk: readonly string[]): string[] {
  const hasil: string[] = [];
  for (const p of produk) {
    if (!isProduk(p)) continue;
    for (const id of PRODUK[p].paket) if (!hasil.includes(id)) hasil.push(id);
  }
  return hasil;
}
