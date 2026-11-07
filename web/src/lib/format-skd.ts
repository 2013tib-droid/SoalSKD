import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { DURASI_LATIHAN_MENIT_PER_SOAL, type Subtes } from "@/config/skd";

/** Bentuk `config/skd.json` di root repo. Satu sumber untuk app dan ebook. */
type ConfigSkd = {
  durasi_menit: number | null;
  sumber: string | null;
  subtes: {
    kode: Subtes;
    jumlah_soal: number;
    penilaian: "benar_salah" | "bobot";
    nilai_benar?: number;
    nilai_salah?: number;
    nilai_maks: number;
    ambang_batas: number | null;
  }[];
  urutan_soal: Subtes[];
};

export type FormatSkd = {
  urutan: Subtes[];
  sumber: string | null;
  durasiResmiMenit: number | null;
  subtes: Record<
    Subtes,
    { jumlahSoal: number; nilaiBenar: number; nilaiSalah: number; nilaiMaks: number; ambangBatas: number | null }
  >;
};

export async function ambilFormatSkd(): Promise<FormatSkd> {
  const raw = await readFile(path.join(process.cwd(), "..", "config", "skd.json"), "utf8");
  const c = JSON.parse(raw) as ConfigSkd;
  const subtes = Object.fromEntries(
    c.subtes.map((s) => [
      s.kode,
      {
        jumlahSoal: s.jumlah_soal,
        nilaiBenar: s.nilai_benar ?? 0,
        nilaiSalah: s.nilai_salah ?? 0,
        nilaiMaks: s.nilai_maks,
        ambangBatas: s.ambang_batas,
      },
    ]),
  ) as FormatSkd["subtes"];
  return { urutan: c.urutan_soal, sumber: c.sumber, durasiResmiMenit: c.durasi_menit, subtes };
}

/**
 * Durasi untuk sebuah paket. Kalau durasi resmi sudah diisi, diskalakan sesuai jumlah soal
 * paket terhadap jumlah soal resmi. Kalau belum, pakai durasi latihan per soal.
 */
export function durasiPaket(format: FormatSkd, jumlahSoal: number): number {
  const totalResmi = Object.values(format.subtes).reduce((n, s) => n + s.jumlahSoal, 0);
  if (format.durasiResmiMenit !== null) {
    return Math.max(1, Math.round((format.durasiResmiMenit * jumlahSoal) / totalResmi));
  }
  return Math.max(1, Math.round(jumlahSoal * DURASI_LATIHAN_MENIT_PER_SOAL));
}
