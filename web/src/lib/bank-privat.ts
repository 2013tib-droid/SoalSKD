import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { bacaBerkasPrivat } from "@/lib/firebase/admin";

/**
 * Bank soal BERBAYAR. Tidak pernah dibaca di build statis (lihat `soal.ts`) dan
 * hanya dipanggil setelah hak paket dicek di server. Urutan sumber:
 *
 *   1. `BANK_PRIVAT_DIR` (path folder di server/komputer dev): `<dir>/<id>.json`
 *      dengan gambar di `<dir>/gambar/`. Untuk dev lokal dari repo/folder privat.
 *   2. Storage privat `bank/<id>.json` (produksi, App Hosting). Berkasnya dibuat
 *      `python3 tools/bank_privat.py siapkan` (SVG sudah ditanam) lalu diunggah
 *      `sh tools/unggah-bank.sh <bucket>`.
 *   3. Hanya dev (`next dev`): `bank/` di repo, selama berkasnya masih ada di sana.
 *
 * Produksi tanpa sumber 1/2 = paket "belum tersedia" (gagal aman), bukan membaca repo.
 */

type Paket = { soal?: { gambar?: { file: string; alt: string; svg?: string }[] }[] } & Record<string, unknown>;

const CACHE_MS = 10 * 60 * 1000;
const cache = new Map<string, { data: Paket | null; t: number }>();

async function dariFolder(dir: string, paket: string): Promise<Paket | null> {
  let data: Paket;
  try {
    data = JSON.parse(await readFile(path.join(dir, `${paket}.json`), "utf8")) as Paket;
  } catch {
    return null;
  }
  const akar = path.resolve(dir);
  for (const s of data.soal ?? []) {
    for (const g of s.gambar ?? []) {
      if (typeof g.svg === "string") continue;
      const file = path.resolve(akar, g.file);
      if (!file.startsWith(akar + path.sep) || !file.endsWith(".svg")) throw new Error(`path gambar tidak sah: ${g.file}`);
      g.svg = (await readFile(file)).toString("base64");
    }
  }
  return data;
}

async function muat(paket: string): Promise<Paket | null> {
  const dir = process.env.BANK_PRIVAT_DIR;
  if (dir) return dariFolder(dir, paket);
  const isi = await bacaBerkasPrivat(`bank/${paket}.json`);
  if (isi) return JSON.parse(isi.toString("utf8")) as Paket;
  if (process.env.NODE_ENV !== "production") return dariFolder(path.join(process.cwd(), "..", "bank"), paket);
  return null;
}

export async function bacaPaketPrivat(paket: string): Promise<Paket | null> {
  if (!/^[a-z0-9-]+$/.test(paket)) return null;
  const ada = cache.get(paket);
  if (ada && Date.now() - ada.t < CACHE_MS) return structuredClone(ada.data);
  const data = await muat(paket);
  cache.set(paket, { data, t: Date.now() });
  return structuredClone(data);
}
