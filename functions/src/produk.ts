/**
 * Produk yang dijual, paket yang dibukanya, dan ebook per edisi.
 *
 * Modul ini murni (tanpa Firebase) supaya bisa diuji langsung dengan Node
 * (`test/produk.mjs`). Sengaja diulang di web (`web/src/config/produk.ts`),
 * bukan diimpor: functions di-deploy terpisah. Ubah keduanya bersamaan.
 */

export const PRODUK = {
  'bundel-3to': { judul: 'Bundel 1: 3 Try Out SKD', paket: ['p02', 'p03', 'p04'] },
  'bundel-3to-2': { judul: 'Bundel 2: 3 Try Out SKD', paket: ['p05', 'p06', 'p07'] },
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

// Penanda edisi dalam nama produk Mayar. "3"/"tiga" = jumlah try out, bukan edisi.
const EDISI_1 = new Set(['1', 'i', 'satu', 'pertama']);
const EDISI_2 = new Set(['2', 'ii', 'dua', 'kedua']);
const NETRAL = new Set(['3', 'tiga']);

/**
 * Nama produk Mayar → produk SoalSKD, hanya bila tidak ragu. Cadangan kalau
 * productId belum dipetakan di `config/mayar_products`.
 *
 *   "Bundel 3 Try Out SKD", "Bundel 1: 3 Try Out SKD"   → bundel-3to
 *   "Bundel 2: 3 Try Out SKD", "Bundel 3 Try Out Edisi II" → bundel-3to-2
 *
 * Aturan: harus menyebut bundel/bundle DAN jumlah 3 try out. Penanda edisi 2
 * (angka 2, "II", "dua", "kedua", atau p05–p07) membuat nama TIDAK PERNAH
 * terbaca sebagai Bundel 1. Penanda kedua edisi sekaligus, angka lain, atau
 * jumlah try out yang tidak disebut → null (ditangani manual).
 */
export function produkDariNama(nama: string): IdProduk | null {
  const n = nama.toLowerCase().trim();
  if (isProduk(n)) return n;
  if (!/\b(bundel|bundle)\b/.test(n)) return null;

  const token = n.match(/\b(\d+|i{1,3}|iv|v|vi|satu|dua|tiga|empat|lima|enam|pertama|kedua|ketiga)\b/g) ?? [];
  if (token.some((t) => !EDISI_1.has(t) && !EDISI_2.has(t) && !NETRAL.has(t))) return null;
  if (!token.some((t) => NETRAL.has(t))) return null;

  const ed1 = token.some((t) => EDISI_1.has(t)) || /\bp0?[2-4]\b/.test(n);
  const ed2 = token.some((t) => EDISI_2.has(t)) || /\bp0?[5-7]\b/.test(n);
  if (ed1 && ed2) return null;
  return ed2 ? 'bundel-3to-2' : 'bundel-3to';
}
