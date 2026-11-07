import { kirimRiwayat } from "@/lib/sinkron";

/**
 * Riwayat skor di perangkat (localStorage). Satu entri per percobaan, dikenali dari
 * `berakhirPada` sesi ujian. Saat login, ikut disalin ke akun (lihat `lib/sinkron.ts`).
 */

export type EntriRiwayat = {
  paket: string;
  judul: string;
  total: number;
  totalMaks: number;
  perSubtes: { subtes: string; skor: number; maks: number }[];
  /** Penanda percobaan: jam selesai sesi ujian (ms). */
  percobaan: number;
  dicatatPada: number;
};

export const KUNCI_RIWAYAT = "soalskd:riwayat";
const MAKS_ENTRI = 50;

export function bacaRiwayat(): EntriRiwayat[] {
  try {
    const raw = localStorage.getItem(KUNCI_RIWAYAT);
    const data = raw ? (JSON.parse(raw) as EntriRiwayat[]) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** Catat hasil sekali per percobaan; membuka halaman hasil lagi tidak membuat entri ganda. */
export function catatRiwayat(entri: EntriRiwayat) {
  try {
    const lama = bacaRiwayat().find((e) => e.paket === entri.paket && e.percobaan === entri.percobaan);
    if (lama) return; // percobaan ini sudah tercatat; jam catat pertama dipertahankan
    tulisRiwayat([entri, ...bacaRiwayat()]);
  } catch {
    // Penyimpanan penuh atau diblokir: riwayat tidak tercatat, hasil tetap tampil.
  }
  kirimRiwayat(entri);
}

/** Tulis ulang seluruh riwayat lokal (terbaru dulu, maks 50). */
export function tulisRiwayat(daftar: EntriRiwayat[]) {
  try {
    const urut = [...daftar].sort((a, b) => b.dicatatPada - a.dicatatPada).slice(0, MAKS_ENTRI);
    localStorage.setItem(KUNCI_RIWAYAT, JSON.stringify(urut));
  } catch {}
}
