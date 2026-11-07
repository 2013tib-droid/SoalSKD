/**
 * Paket yang boleh dikerjakan tanpa login. Paket lain di `bank/` hanya untuk akun
 * yang memilikinya (`users/{uid}.paket`, ditulis Cloud Function `redeemActivationCode`).
 * Daftar produk → paket ada di functions/src/index.ts (`PRODUK`).
 */
export const PAKET_TERBUKA = ["p01"] as const;

/**
 * Paket yang terbuka untuk semua orang. Build statis (GitHub Pages dev) ikut aturan yang sama:
 * paket berbayar tampil terkunci dan soalnya tidak ditanam di halaman.
 */
export function paketTerbuka(paket: string): boolean {
  return (PAKET_TERBUKA as readonly string[]).includes(paket);
}
