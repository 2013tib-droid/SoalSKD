"use server";

import { formatUntuk, URUTAN_SUBTES, type Subtes } from "@/config/skd";
import { ambilSoalPembahasan, type SoalPembahasan } from "@/lib/soal";

export type StatusJawaban = "benar" | "salah" | "kosong";

export type ItemHasil = SoalPembahasan & {
  nomor: number;
  jawaban: string | null;
  poin: number;
  poinMaks: number;
  /** TWK/TIU: benar/salah/kosong. TKP: "benar" hanya kalau memilih opsi berbobot tertinggi. */
  status: StatusJawaban;
};

export type SkorSubtes = {
  subtes: Subtes;
  skor: number;
  maks: number;
  ambangBatas: number | null;
  lulus: boolean | null;
};

export type HasilUjian = {
  total: number;
  totalMaks: number;
  perSubtes: SkorSubtes[];
  lulusSemua: boolean | null;
  items: ItemHasil[];
};

/** Menilai jawaban di server. Kunci dan bobot hanya dikirim ke browser setelah dikumpulkan. */
export async function nilaiUjian(paket: string, jawaban: Record<string, string>): Promise<HasilUjian | null> {
  const soal = await ambilSoalPembahasan(paket);
  if (!soal) return null;
  const format = formatUntuk(paket);
  const nilai = format.nilaiPilihanTunggal;

  const items: ItemHasil[] = soal.map((s, i) => {
    const raw = jawaban?.[s.id];
    const j = typeof raw === "string" && s.opsi.some((o) => o.huruf === raw) ? raw : null;
    if (s.bobot) {
      const poinMaks = Math.max(...Object.values(s.bobot));
      const poin = j ? (s.bobot[j] ?? 0) : 0;
      const status: StatusJawaban = !j ? "kosong" : poin === poinMaks ? "benar" : "salah";
      return { ...s, nomor: i + 1, jawaban: j, poin, poinMaks, status };
    }
    const status: StatusJawaban = !j ? "kosong" : j === s.kunci ? "benar" : "salah";
    return { ...s, nomor: i + 1, jawaban: j, poin: nilai[status], poinMaks: nilai.benar, status };
  });

  const perSubtes: SkorSubtes[] = URUTAN_SUBTES.filter((t) => items.some((it) => it.kategori === t)).map(
    (subtes) => {
      const isi = items.filter((it) => it.kategori === subtes);
      const skor = isi.reduce((n, it) => n + it.poin, 0);
      const ambangBatas = format.ambangBatas[subtes];
      return {
        subtes,
        skor,
        maks: isi.reduce((n, it) => n + it.poinMaks, 0),
        ambangBatas,
        lulus: ambangBatas === null ? null : skor >= ambangBatas,
      };
    },
  );

  const semuaAda = perSubtes.every((p) => p.lulus !== null);
  return {
    total: perSubtes.reduce((n, p) => n + p.skor, 0),
    totalMaks: perSubtes.reduce((n, p) => n + p.maks, 0),
    perSubtes,
    lulusSemua: semuaAda ? perSubtes.every((p) => p.lulus) : null,
    items,
  };
}
