import { BUILD_STATIK } from "@/config/build";

/**
 * Paket yang boleh dikerjakan tanpa login. Paket lain di `bank/` hanya untuk akun
 * yang memilikinya (`users/{uid}.paket`, ditulis Cloud Function `redeemActivationCode`).
 * Daftar produk → paket ada di functions/src/index.ts (`PRODUK`).
 */
export const PAKET_TERBUKA = ["p01"] as const;

/** Build statis (GitHub Pages dev): login dan gerbang dimatikan, semua paket terbuka. */
export function paketTerbuka(paket: string): boolean {
  return BUILD_STATIK || (PAKET_TERBUKA as readonly string[]).includes(paket);
}
