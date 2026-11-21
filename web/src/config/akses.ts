import { PRODUK, type IdProduk } from "@/config/produk";

/**
 * Paket yang boleh dikerjakan tanpa login. Paket lain di `bank/` hanya untuk akun
 * yang memilikinya (`users/{uid}.paket`, ditulis Cloud Function `redeemActivationCode`).
 * Daftar produk → paket ada di functions/src/produk.ts (`PRODUK`), cerminnya di config/produk.ts.
 */
export const PAKET_TERBUKA = ["p01"] as const;

/**
 * SAKLAR SEMENTARA untuk cek ulang pemilik: `true` = semua paket terbuka di build statis
 * (GitHub Pages dev), soal + kunci paket berbayar ikut ke `out/`. Tidak berlaku di build server
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
 * Edisi ebook PDF → paket yang membukanya (cukup satu dimiliki). Cermin `EBOOK` di
 * functions/src/produk.ts: ubah juga di functions. Hanya untuk menampilkan tombol
 * unduh; haknya dicek Cloud Function `unduhEbook` per edisi. Build statis tidak
 * pernah menampilkannya.
 */
export const EBOOK_EDISI = {
  "edisi-1": { judul: "Ebook PDF Edisi 1", produk: "bundel-3to", paket: PRODUK["bundel-3to"].paket },
  "edisi-2": { judul: "Ebook PDF Edisi 2", produk: "bundel-3to-2", paket: PRODUK["bundel-3to-2"].paket },
} as const satisfies Record<string, { judul: string; produk: IdProduk; paket: readonly string[] }>;

export type IdEdisi = keyof typeof EBOOK_EDISI;

/** Edisi ebook yang boleh diunduh akun ini, urut dari Edisi 1. */
export function edisiMilik(milik: readonly string[] | null | undefined): IdEdisi[] {
  const punya = milik ?? [];
  return (Object.keys(EBOOK_EDISI) as IdEdisi[]).filter((e) =>
    (EBOOK_EDISI[e].paket as readonly string[]).some((p) => punya.includes(p)),
  );
}
