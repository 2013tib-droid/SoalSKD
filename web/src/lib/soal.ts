import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { URUTAN_SUBTES, type Subtes } from "@/config/skd";

type SoalBank = {
  id: string;
  kategori: Subtes;
  subtopik: string;
  pertanyaan: string;
  opsi: Record<string, string>;
  kunci: string;
  bobot?: Record<string, number>;
  pembahasan: string;
  tingkat: string;
};

/** Soal yang aman dikirim ke browser: tanpa kunci, bobot, dan pembahasan. */
export type SoalUjian = {
  id: string;
  kategori: Subtes;
  pertanyaan: string;
  opsi: { huruf: string; teks: string }[];
};

const BANK_DIR = path.join(process.cwd(), "..", "bank");

export async function ambilSoalUjian(paket: string): Promise<SoalUjian[] | null> {
  if (!/^[a-z0-9-]+$/.test(paket)) return null;
  let raw: string;
  try {
    raw = await readFile(path.join(BANK_DIR, `${paket}.json`), "utf8");
  } catch {
    return null;
  }
  const data = JSON.parse(raw) as { soal: SoalBank[] };
  return [...data.soal]
    .sort((a, b) => URUTAN_SUBTES.indexOf(a.kategori) - URUTAN_SUBTES.indexOf(b.kategori))
    .map((s) => ({
      id: s.id,
      kategori: s.kategori,
      pertanyaan: s.pertanyaan,
      opsi: Object.entries(s.opsi).map(([huruf, teks]) => ({ huruf, teks })),
    }));
}
