import "server-only";
import { paketTerbuka } from "@/config/akses";
import { ADMIN_AKTIF, paketMilik, uidDariToken } from "@/lib/firebase/admin";

export type AlasanTolak = "perlu-masuk" | "belum-punya" | "belum-dibuka";

/**
 * Satu-satunya keputusan akses paket di server. Dipakai server action soal ujian
 * dan penilaian. Paket terbuka (p01) tidak butuh token.
 */
export async function cekAksesPaket(
  paket: string,
  idToken: string | null | undefined,
): Promise<{ ok: true } | { ok: false; alasan: AlasanTolak }> {
  if (paketTerbuka(paket)) return { ok: true };
  // Server tanpa Firebase: paket berbayar tertutup untuk semua orang (gagal aman).
  if (!ADMIN_AKTIF) return { ok: false, alasan: "belum-dibuka" };
  const uid = await uidDariToken(idToken);
  if (!uid) return { ok: false, alasan: "perlu-masuk" };
  return (await paketMilik(uid)).includes(paket) ? { ok: true } : { ok: false, alasan: "belum-punya" };
}
