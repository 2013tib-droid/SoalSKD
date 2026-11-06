/**
 * Riwayat skor di perangkat (localStorage). Satu entri per percobaan, dikenali dari
 * `berakhirPada` sesi ujian. Pindah ke server saat ada backend.
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

const KUNCI = "soalskd:riwayat";
const MAKS_ENTRI = 50;

export function bacaRiwayat(): EntriRiwayat[] {
  try {
    const raw = localStorage.getItem(KUNCI);
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
    const lain = bacaRiwayat();
    const baru = [entri, ...lain].sort((a, b) => b.dicatatPada - a.dicatatPada).slice(0, MAKS_ENTRI);
    localStorage.setItem(KUNCI, JSON.stringify(baru));
  } catch {
    // Penyimpanan penuh atau diblokir: riwayat tidak tercatat, hasil tetap tampil.
  }
}
