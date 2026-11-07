"use server";

import { ambangTimerMenit } from "@/config/skd";
import { cekAksesPaket, type AlasanTolak } from "@/lib/akses-server";
import { ambilFormatSkd, durasiPaket } from "@/lib/format-skd";
import { ambilSoalUjian, type SoalUjian } from "@/lib/soal";

export type UjianBerbayar =
  | { status: "ok"; soal: SoalUjian[]; durasiMenit: number; peringatanMenit: number; kritisMenit: number }
  | { status: AlasanTolak | "tidak-ada" };

/**
 * Soal paket berbayar, hanya untuk akun yang memilikinya. Soal tanpa kunci/bobot/pembahasan
 * (sama dengan paket gratis); yang dijaga di sini adalah isi soalnya.
 */
export async function muatUjianBerbayar(paket: string, idToken: string | null): Promise<UjianBerbayar> {
  const akses = await cekAksesPaket(paket, idToken);
  if (!akses.ok) return { status: akses.alasan };
  const soal = await ambilSoalUjian(paket);
  if (!soal || soal.length === 0) return { status: "tidak-ada" };
  const durasiMenit = durasiPaket(await ambilFormatSkd(), soal.length);
  return { status: "ok", soal, durasiMenit, ...ambangTimerMenit(durasiMenit) };
}
