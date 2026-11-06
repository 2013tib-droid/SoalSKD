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

/** Soal lengkap untuk halaman hasil, dikirim hanya setelah jawaban dikumpulkan. */
export type SoalPembahasan = SoalUjian & {
  subtopik: string;
  kunci: string;
  bobot: Record<string, number> | null;
  pembahasan: string;
};

const BANK_DIR = path.join(process.cwd(), "..", "bank");

async function bacaBank(paket: string): Promise<SoalBank[] | null> {
  if (!/^[a-z0-9-]+$/.test(paket)) return null;
  try {
    const raw = await readFile(path.join(BANK_DIR, `${paket}.json`), "utf8");
    const data = JSON.parse(raw) as { soal: SoalBank[] };
    return [...data.soal].sort(
      (a, b) => URUTAN_SUBTES.indexOf(a.kategori) - URUTAN_SUBTES.indexOf(b.kategori),
    );
  } catch {
    return null;
  }
}

const keOpsi = (s: SoalBank) => Object.entries(s.opsi).map(([huruf, teks]) => ({ huruf, teks }));

export async function ambilSoalUjian(paket: string): Promise<SoalUjian[] | null> {
  const bank = await bacaBank(paket);
  return bank && bank.map((s) => ({ id: s.id, kategori: s.kategori, pertanyaan: s.pertanyaan, opsi: keOpsi(s) }));
}

export async function ambilSoalPembahasan(paket: string): Promise<SoalPembahasan[] | null> {
  const bank = await bacaBank(paket);
  return (
    bank &&
    bank.map((s) => ({
      id: s.id,
      kategori: s.kategori,
      subtopik: s.subtopik,
      pertanyaan: s.pertanyaan,
      opsi: keOpsi(s),
      kunci: s.kunci,
      bobot: s.bobot ?? null,
      pembahasan: s.pembahasan,
    }))
  );
}
