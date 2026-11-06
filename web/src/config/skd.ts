/**
 * Pengaturan khusus aplikasi. Format SKD (jumlah soal, nilai, durasi, ambang batas) TIDAK ada di sini:
 * sumbernya `config/skd.json` di root repo, dibaca lewat `src/lib/format-skd.ts`.
 * Cek aturan BKN/KemenPAN-RB terbaru.
 */

export type Subtes = "TWK" | "TIU" | "TKP";

/** Dipakai selama `durasi_menit` di config/skd.json masih null. Angka latihan, bukan aturan resmi. */
export const DURASI_LATIHAN_MENIT_PER_SOAL = 1;

/** Ambang status timer, sebagai pecahan dari durasi paket (minimal 1 menit). */
export const AMBANG_TIMER = { peringatan: 0.1, kritis: 0.05 };

export function ambangTimerMenit(durasiMenit: number) {
  return {
    peringatanMenit: Math.max(1, Math.round(durasiMenit * AMBANG_TIMER.peringatan)),
    kritisMenit: Math.max(1, Math.round(durasiMenit * AMBANG_TIMER.kritis)),
  };
}
