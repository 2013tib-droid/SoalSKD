"use server";

import { cekAksesPaket, type AlasanTolak } from "@/lib/akses-server";
import { ambilFormatSkd } from "@/lib/format-skd";
import { hitungHasil, type HasilUjian } from "@/lib/nilai";
import { ambilJudulPaket, ambilSoalPembahasan } from "@/lib/soal";

export type HasilPenilaian = { status: "ok"; hasil: HasilUjian } | { status: AlasanTolak | "tidak-ada" };

/**
 * Menilai jawaban di server. Kunci dan bobot hanya dikirim ke browser setelah dikumpulkan.
 * Paket berbayar: ID token Firebase diverifikasi di server (firebase-admin) dan hak paket
 * dicek di `users/{uid}.paket`. Action ini bisa dipanggil langsung, jadi pemeriksaannya di sini.
 */
export async function nilaiUjian(
  paket: string,
  jawaban: Record<string, string>,
  idToken?: string | null,
): Promise<HasilPenilaian> {
  const akses = await cekAksesPaket(paket, idToken);
  if (!akses.ok) return { status: akses.alasan };
  const [soal, judul, format] = await Promise.all([
    ambilSoalPembahasan(paket),
    ambilJudulPaket(paket),
    ambilFormatSkd(),
  ]);
  if (!soal || !judul) return { status: "tidak-ada" };
  return { status: "ok", hasil: hitungHasil(soal, judul, format, jawaban) };
}
