/**
 * Paket yang boleh dikerjakan tanpa login. Paket lain di `bank/` hanya untuk akun
 * yang memilikinya (`users/{uid}.paket`, ditulis Cloud Function `redeemActivationCode`).
 * Daftar produk → paket ada di functions/src/index.ts (`PRODUK`).
 */
export const PAKET_TERBUKA = ["p01"] as const;

/**
 * SAKLAR SEMENTARA untuk cek ulang pemilik: `true` = semua paket terbuka di build statis
 * (GitHub Pages dev), soal + kunci p02–p04 ikut ke `out/`. Tidak berlaku di build server
 * (produksi tetap bergerbang). Kembalikan ke `false` sebelum deploy produksi.
 */
export const DEV_BUKA_SEMUA = true;

/**
 * Paket yang terbuka untuk semua orang. Build statis (GitHub Pages dev) ikut aturan yang sama:
 * paket berbayar tampil terkunci dan soalnya tidak ditanam di halaman (kecuali `DEV_BUKA_SEMUA`).
 */
export function paketTerbuka(paket: string): boolean {
  if (DEV_BUKA_SEMUA && process.env.STATIK === "1") return true;
  return (PAKET_TERBUKA as readonly string[]).includes(paket);
}

/**
 * Paket bundel yang ikut membuka ebook PDF (minimal satu dimiliki). Hanya untuk
 * menampilkan tombol unduh; haknya dicek Cloud Function `unduhEbook`
 * (functions/src/index.ts, `EBOOK.paket`). Build statis tidak pernah menampilkannya.
 */
export const PAKET_EBOOK = ["p02", "p03", "p04"] as const;

export function punyaEbook(milik: readonly string[] | null | undefined): boolean {
  return (milik ?? []).some((p) => (PAKET_EBOOK as readonly string[]).includes(p));
}
