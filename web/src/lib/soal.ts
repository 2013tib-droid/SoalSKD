import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { Subtes } from "@/config/skd";
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
};

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

async function bacaPaket(paket: string): Promise<PaketBank | null> {
  if (!/^[a-z0-9-]+$/.test(paket)) return null;
  try {
    const data = JSON.parse(await readFile(path.join(ROOT, "bank", `${paket}.json`), "utf8")) as PaketBank;
    // Hanya file yang mengikuti skema 1. File lama (mis. sample-15) tidak dimuat.
    if (data.skema !== 1 || !Array.isArray(data.soal)) return null;
    const { urutan } = await ambilFormatSkd();
    data.soal.sort(
      (a, b) => urutan.indexOf(a.kategori) - urutan.indexOf(b.kategori) || a.nomor - b.nomor,
    );
    return data;
  } catch {
    return null;
  }
}

const keOpsi = (s: SoalBank) => Object.entries(s.opsi).map(([huruf, teks]) => ({ huruf, teks }));

const kunciDari = (s: SoalBank) =>
  s.bobot ? Object.entries(s.bobot).reduce((a, b) => (b[1] > a[1] ? b : a))[0] : (s.kunci ?? "");

export async function ambilJudulPaket(paket: string): Promise<string | null> {
  return (await bacaPaket(paket))?.meta.judul ?? null;
}

export async function ambilSoalUjian(paket: string): Promise<SoalUjian[] | null> {
  const data = await bacaPaket(paket);
  return (
    data &&
    data.soal.map((s) => ({ id: s.id, kategori: s.kategori, pertanyaan: s.pertanyaan, opsi: keOpsi(s) }))
  );
}

export async function ambilSoalPembahasan(paket: string): Promise<SoalPembahasan[] | null> {
  const data = await bacaPaket(paket);
  return (
    data &&
    data.soal.map((s) => ({
      id: s.id,
      kategori: s.kategori,
      subtopik: s.subtopik,
      pertanyaan: s.pertanyaan,
      opsi: keOpsi(s),
      kunci: kunciDari(s),
      bobot: s.bobot ?? null,
      pembahasan: { inti: s.pembahasan.inti, opsi: s.pembahasan.opsi, konsep: s.pembahasan.konsep ?? null },
      tips: s.tips,
      rujukan: s.rujukan ?? [],
    }))
  );
}

/** Semua paket skema 1 di `bank/`, urut menurut id. File lama dilewati. */
export async function daftarPaket(): Promise<RingkasanPaket[]> {
  let nama: string[];
  try {
    nama = await readdir(path.join(ROOT, "bank"));
  } catch {
    return [];
  }
  const ids = nama.filter((n) => n.endsWith(".json")).map((n) => n.slice(0, -5)).sort();
  const hasil = await Promise.all(ids.map((id) => bacaPaket(id)));
  const { urutan } = await ambilFormatSkd();
  return hasil
    .filter((d): d is PaketBank => d !== null)
    .map((d) => ({
      id: d.meta.id,
      judul: d.meta.judul,
      status: d.meta.status,
      jumlahSoal: d.soal.length,
      perSubtes: urutan
        .map((subtes) => ({ subtes, jumlah: d.soal.filter((s) => s.kategori === subtes).length }))
        .filter((x) => x.jumlah > 0),
    }));
}
