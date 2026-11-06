"use server";

import { ambilFormatSkd } from "@/lib/format-skd";
import { hitungHasil, type HasilUjian } from "@/lib/nilai";
import { ambilJudulPaket, ambilSoalPembahasan } from "@/lib/soal";

/** Menilai jawaban di server. Kunci dan bobot hanya dikirim ke browser setelah dikumpulkan. */
export async function nilaiUjian(paket: string, jawaban: Record<string, string>): Promise<HasilUjian | null> {
  const [soal, judul, format] = await Promise.all([
    ambilSoalPembahasan(paket),
    ambilJudulPaket(paket),
    ambilFormatSkd(),
  ]);
  if (!soal || !judul) return null;
  return hitungHasil(soal, judul, format, jawaban);
}
