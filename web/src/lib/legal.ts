import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { FITUR_BUNDEL, PENAWARAN } from "@/config/landing";
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
  if (jalur.length === 0) return "Kontak pengelola dicantumkan di sini sebelum penjualan dibuka.";
  return ["Hubungi kami lewat:", "", ...jalur, "- Khusus pembeli: sebutkan nomor pesanan dari halaman Akun."].join("\n");
}

function penawaran() {
  if (PENAWARAN.length === 0) return "";
  const bundel = PENAWARAN.map((x) => {
    const isi = x.isi.map((i) => `  - **${i.judul}**: ${i.detail}`).join("\n");
    return `- **${x.nama}** (${x.harga}):\n${isi}`;
  }).join("\n");
  const fitur = FITUR_BUNDEL.map((f) => `- **${f.judul}**: ${f.detail}`).join("\n");
  const pembuka =
    PENAWARAN.length > 1
      ? "Produk berbayar yang tersedia. Setiap bundel dibeli terpisah dan aktif di akun pembelinya:"
      : "Yang kamu dapat dengan membeli:";
  return `${pembuka}\n\n${bundel}\n\nDi setiap bundel:\n\n${fitur}`;
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
