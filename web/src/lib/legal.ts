import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PENAWARAN } from "@/config/landing";
import { BERLAKU_SEJAK, DIPERBARUI, EMAIL_KONTAK, PENGELOLA, PENGEMBALIAN_DANA, WA_KONTAK } from "@/config/legal";

/**
 * Halaman legal dari Markdown di `web/src/konten/<nama>.md` (dibaca saat build).
 * Penanda `{{...}}` di file diganti dari `web/src/config/legal.ts` dan `PENAWARAN`,
 * supaya nilai yang belum diisi (null) tidak pernah tampil sebagai teks pengganti.
 */
export type HalamanLegal = { md: string; daftarIsi: { id: string; judul: string }[]; tanggal: string };

/** "Pengembalian dana" → "pengembalian-dana". Dipakai juga oleh renderer untuk id judul. */
export function slug(teks: string) {
  return teks
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

const tanggal = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function pengelola() {
  return PENGELOLA
    ? `SoalSKD dikelola oleh **${PENGELOLA}** (selanjutnya disebut "kami").`
    : `SoalSKD selanjutnya disebut "kami".`;
}

function kontak() {
  const jalur: string[] = [];
  if (EMAIL_KONTAK) jalur.push(`- Email: [${EMAIL_KONTAK}](mailto:${EMAIL_KONTAK})`);
  if (WA_KONTAK) jalur.push(`- WhatsApp: [+${WA_KONTAK}](https://wa.me/${WA_KONTAK})`);
  const pembeli = "balas email kode aktivasi yang kamu terima; balasannya sampai ke kami.";
  if (jalur.length === 0) return `Pembeli bisa menghubungi kami dengan cara ini: ${pembeli}`;
  return ["Hubungi kami lewat:", "", ...jalur, `- Khusus pembeli: ${pembeli}`].join("\n");
}

function penawaran() {
  if (!PENAWARAN) return "";
  const isi = PENAWARAN.isi.map((x) => `- **${x.judul}**: ${x.detail}`).join("\n");
  return `Yang kamu dapat dengan membeli **${PENAWARAN.nama}** (${PENAWARAN.harga}):\n\n${isi}`;
}

const PENGGANTI: Record<string, () => string> = {
  pengelola,
  kontak,
  penawaran,
  pengembalian_dana: () => PENGEMBALIAN_DANA,
};

export async function muatHalamanLegal(nama: "privasi" | "syarat"): Promise<HalamanLegal> {
  const mentah = await readFile(path.join(process.cwd(), "src/konten", `${nama}.md`), "utf8");
  const md = mentah.replace(/\{\{(\w+)\}\}/g, (_, k: string) => {
    const isi = PENGGANTI[k];
    if (!isi) throw new Error(`Penanda {{${k}}} tidak dikenal di konten/${nama}.md`);
    return isi();
  });
  const daftarIsi = [...md.matchAll(/^## (.+)$/gm)].map(([, judul]) => ({ id: slug(judul), judul }));
  const bagian = [BERLAKU_SEJAK && `Berlaku sejak ${tanggal(BERLAKU_SEJAK)}`, `Terakhir diperbarui ${tanggal(DIPERBARUI)}`];
  return { md, daftarIsi, tanggal: bagian.filter(Boolean).join(" · ") };
}
