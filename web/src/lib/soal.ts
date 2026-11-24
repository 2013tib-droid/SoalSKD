import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PAKET_TERBUKA } from "@/config/akses";
import { BUILD_STATIK } from "@/config/build";
import type { Subtes } from "@/config/skd";
import { bacaPaketPrivat } from "@/lib/bank-privat";
import { ambilFormatSkd } from "@/lib/format-skd";

/** Bentuk soal di bank sesuai `schema/paket.schema.json` (skema 1). */
type SoalBank = {
  id: string;
  nomor: number;
  kategori: Subtes;
  subtopik: string;
  topik: string;
  tingkat: string;
  pertanyaan: string;
  opsi: Record<string, string>;
  kunci?: string;
  bobot?: Record<string, number>;
  pembahasan: { inti: string; opsi: Record<string, string>; konsep?: string };
  tips: string;
  rujukan?: string[];
  /** `svg`: base64, hanya di berkas paket privat (tools/bank_privat.py). */
  gambar?: { file: string; alt: string; svg?: string }[];
};

type PaketBank = { skema: number; meta: { id: string; judul: string; status: string }; soal: SoalBank[] };

export type RingkasanPaket = {
  id: string;
  judul: string;
  status: string;
  jumlahSoal: number;
  perSubtes: { subtes: Subtes; jumlah: number }[];
};

/** Soal yang aman dikirim ke browser: tanpa kunci, bobot, dan pembahasan. Teks berupa Markdown. */
export type SoalUjian = {
  id: string;
  kategori: Subtes;
  pertanyaan: string;
  opsi: { huruf: string; teks: string }[];
  /** TIU figural: SVG dari `bank/gambar/` sebagai data URI, jadi ikut gerbang paket seperti teks soal. */
  gambar: GambarSoal[];
};

export type GambarSoal = { src: string; alt: string };

/** Soal lengkap untuk halaman hasil, dikirim hanya setelah jawaban dikumpulkan. */
export type SoalPembahasan = SoalUjian & {
  subtopik: string;
  /** TWK/TIU: kunci. TKP: opsi berbobot tertinggi. */
  kunci: string;
  bobot: Record<string, number> | null;
  pembahasan: { inti: string; opsi: Record<string, string>; konsep: string | null };
  tips: string;
  rujukan: string[];
};

const ROOT = path.join(process.cwd(), "..");
const DIR_BANK = path.join(ROOT, "bank");

/**
 * Sumber paket:
 *   - Paket gratis (`PAKET_TERBUKA`): `bank/<id>.json` di repo (ikut build statis).
 *   - Paket berbayar: penyimpanan PRIVAT (`lib/bank-privat.ts`), hanya dipanggil
 *     setelah hak paket dicek di server. Tidak pernah dibaca di build statis.
 *   - Daftar/judul/jumlah soal semua paket: `bank/katalog.json` (metadata saja,
 *     dibuat `tools/bank_privat.py`).
 */
async function bacaPaket(paket: string): Promise<PaketBank | null> {
  if (!/^[a-z0-9-]+$/.test(paket)) return null;
  let data: PaketBank | null;
  // Daftar tetap, bukan `paketTerbuka()`: saklar DEV_BUKA_SEMUA tidak boleh membuat paket berbayar dibaca dari repo.
  if ((PAKET_TERBUKA as readonly string[]).includes(paket)) {
    try {
      data = JSON.parse(await readFile(path.join(DIR_BANK, `${paket}.json`), "utf8")) as PaketBank;
    } catch {
      return null;
    }
  } else {
    // Build statis tidak pernah memuat soal berbayar, apa pun yang ada di disk.
    if (BUILD_STATIK) return null;
    data = (await bacaPaketPrivat(paket)) as PaketBank | null;
  }
  // Hanya file yang mengikuti skema 1. File lama (mis. sample-15) tidak dimuat.
  if (!data || data.skema !== 1 || !Array.isArray(data.soal)) return null;
  const { urutan } = await ambilFormatSkd();
  const soal = [...data.soal].sort(
    (a, b) => urutan.indexOf(a.kategori) - urutan.indexOf(b.kategori) || a.nomor - b.nomor,
  );
  return { ...data, soal };
}

/**
 * SVG soal menjadi data URI. Paket privat membawa SVG-nya sendiri (`svg`, base64);
 * paket di repo membaca `bank/<file>` (path relatif, tidak boleh keluar folder).
 */
async function muatGambar(s: SoalBank): Promise<GambarSoal[]> {
  return Promise.all(
    (s.gambar ?? []).map(async (g) => {
      if (typeof g.svg === "string") return { src: `data:image/svg+xml;base64,${g.svg}`, alt: g.alt };
      const file = path.resolve(DIR_BANK, g.file);
      if (!file.startsWith(DIR_BANK + path.sep) || !file.endsWith(".svg")) {
        throw new Error(`path gambar tidak sah: ${g.file}`);
      }
      const svg = await readFile(file);
      return { src: `data:image/svg+xml;base64,${svg.toString("base64")}`, alt: g.alt };
    }),
  );
}

type EntriKatalog = { id: string; judul: string; status: string; jumlahSoal: number; perSubtes: Partial<Record<Subtes, number>> };

async function bacaKatalog(): Promise<EntriKatalog[]> {
  try {
    const k = JSON.parse(await readFile(path.join(DIR_BANK, "katalog.json"), "utf8")) as { paket?: EntriKatalog[] };
    return Array.isArray(k.paket) ? k.paket : [];
  } catch {
    return [];
  }
}

const keOpsi = (s: SoalBank) => Object.entries(s.opsi).map(([huruf, teks]) => ({ huruf, teks }));

const kunciDari = (s: SoalBank) =>
  s.bobot ? Object.entries(s.bobot).reduce((a, b) => (b[1] > a[1] ? b : a))[0] : (s.kunci ?? "");

/** Judul dari katalog: tidak perlu membaca soal (juga untuk paket berbayar). */
export async function ambilJudulPaket(paket: string): Promise<string | null> {
  return (await bacaKatalog()).find((p) => p.id === paket)?.judul ?? null;
}

export async function ambilSoalUjian(paket: string): Promise<SoalUjian[] | null> {
  const data = await bacaPaket(paket);
  if (!data) return null;
  return Promise.all(
    data.soal.map(async (s) => ({
      id: s.id,
      kategori: s.kategori,
      pertanyaan: s.pertanyaan,
      opsi: keOpsi(s),
      gambar: await muatGambar(s),
    })),
  );
}

export async function ambilSoalPembahasan(paket: string): Promise<SoalPembahasan[] | null> {
  const data = await bacaPaket(paket);
  if (!data) return null;
  return Promise.all(
    data.soal.map(async (s) => ({
      id: s.id,
      kategori: s.kategori,
      subtopik: s.subtopik,
      pertanyaan: s.pertanyaan,
      opsi: keOpsi(s),
      gambar: await muatGambar(s),
      kunci: kunciDari(s),
      bobot: s.bobot ?? null,
      pembahasan: { inti: s.pembahasan.inti, opsi: s.pembahasan.opsi, konsep: s.pembahasan.konsep ?? null },
      tips: s.tips,
      rujukan: s.rujukan ?? [],
    })),
  );
}

/** Semua paket di katalog, urut menurut id. Tanpa membaca soal. */
export async function daftarPaket(): Promise<RingkasanPaket[]> {
  const [katalog, { urutan }] = await Promise.all([bacaKatalog(), ambilFormatSkd()]);
  return [...katalog]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((p) => ({
      id: p.id,
      judul: p.judul,
      status: p.status,
      jumlahSoal: p.jumlahSoal,
      perSubtes: urutan
        .map((subtes) => ({ subtes, jumlah: p.perSubtes[subtes] ?? 0 }))
        .filter((x) => x.jumlah > 0),
    }));
}
