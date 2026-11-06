import type { FormatSkd } from "@/lib/format-skd";
import type { Subtes } from "@/config/skd";
import type { SoalPembahasan } from "@/lib/soal";

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
  judul: string;
  total: number;
  totalMaks: number;
  perSubtes: SkorSubtes[];
  lulusSemua: boolean | null;
  /** Ambang batas hanya dibandingkan kalau paket memuat jumlah soal resmi per subtes. */
  paketLengkap: boolean;
  items: ItemHasil[];
};

/**
 * Menghitung skor dari soal lengkap dan jawaban. Fungsi murni, dipakai server action
 * (mode biasa) dan browser (build statis untuk GitHub Pages dev).
 */
export function hitungHasil(
  soal: SoalPembahasan[],
  judul: string,
  format: FormatSkd,
  jawaban: Record<string, string>,
): HasilUjian {
  const items: ItemHasil[] = soal.map((s, i) => {
    const raw = jawaban?.[s.id];
    const j = typeof raw === "string" && s.opsi.some((o) => o.huruf === raw) ? raw : null;
    if (s.bobot) {
      const poinMaks = Math.max(...Object.values(s.bobot));
      const poin = j ? (s.bobot[j] ?? 0) : 0;
      const status: StatusJawaban = !j ? "kosong" : poin === poinMaks ? "benar" : "salah";
      return { ...s, nomor: i + 1, jawaban: j, poin, poinMaks, status };
    }
    const aturan = format.subtes[s.kategori];
    const status: StatusJawaban = !j ? "kosong" : j === s.kunci ? "benar" : "salah";
    // Kosong bernilai 0, sama seperti "salah/kosong = 0" di docs/skema-soal.md.
    const poin = status === "benar" ? aturan.nilaiBenar : status === "salah" ? aturan.nilaiSalah : 0;
    return { ...s, nomor: i + 1, jawaban: j, poin, poinMaks: aturan.nilaiBenar, status };
  });

  const subtesAda = format.urutan.filter((t) => items.some((it) => it.kategori === t));
  const paketLengkap = format.urutan.every(
    (t) => items.filter((it) => it.kategori === t).length === format.subtes[t].jumlahSoal,
  );

  const perSubtes: SkorSubtes[] = subtesAda.map((subtes) => {
    const isi = items.filter((it) => it.kategori === subtes);
    const skor = isi.reduce((n, it) => n + it.poin, 0);
    const ambangBatas = paketLengkap ? format.subtes[subtes].ambangBatas : null;
    return {
      subtes,
      skor,
      maks: isi.reduce((n, it) => n + it.poinMaks, 0),
      ambangBatas,
      lulus: ambangBatas === null ? null : skor >= ambangBatas,
    };
  });

  return {
    judul,
    total: perSubtes.reduce((n, p) => n + p.skor, 0),
    totalMaks: perSubtes.reduce((n, p) => n + p.maks, 0),
    perSubtes,
    lulusSemua: perSubtes.every((p) => p.lulus !== null) ? perSubtes.every((p) => p.lulus) : null,
    paketLengkap,
    items,
  };
}
