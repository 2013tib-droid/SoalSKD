/**
 * Konfigurasi format try out.
 *
 * CATATAN: cek aturan BKN/KemenPAN-RB terbaru. Jumlah soal, durasi, sistem nilai,
 * dan nilai ambang batas bisa berubah tiap tahun. Jangan menulis angka resmi di sini
 * tanpa menyertakan sumbernya di kolom `sumber`.
 */

export type Subtes = "TWK" | "TIU" | "TKP";

export const URUTAN_SUBTES: Subtes[] = ["TWK", "TIU", "TKP"];

export type FormatPaket = {
  /** Durasi pengerjaan dalam menit. */
  durasiMenit: number;
  /** Timer berubah ke status peringatan saat sisa waktu ≤ nilai ini (menit). */
  peringatanMenit: number;
  /** Timer berubah ke status kritis saat sisa waktu ≤ nilai ini (menit). */
  kritisMenit: number;
  /** Nilai ambang batas per subtes. `null` berarti belum diisi dari sumber resmi. */
  ambangBatas: Record<Subtes, number | null>;
  /**
   * Nilai TWK/TIU per jawaban. TKP selalu memakai bobot opsi dari bank soal (1–5),
   * dan jawaban kosong bernilai 0.
   */
  nilaiPilihanTunggal: { benar: number; salah: number; kosong: number };
  /** Asal angka di atas, misalnya nomor peraturan dan tahunnya. */
  sumber: string;
};

/** Format latihan, bukan format resmi. Dipakai sampai ada sumber resmi yang dicatat. */
export const FORMAT_LATIHAN: FormatPaket = {
  durasiMenit: 20,
  peringatanMenit: 5,
  kritisMenit: 2,
  ambangBatas: { TWK: null, TIU: null, TKP: null },
  // Sama dengan "Petunjuk Penilaian" di bank/premium-01.md. Cek aturan resmi terbaru.
  nilaiPilihanTunggal: { benar: 5, salah: 0, kosong: 0 },
  sumber: "Format latihan internal. Belum mengacu peraturan resmi.",
};

export const FORMAT_PER_PAKET: Record<string, FormatPaket> = {
  "sample-15": FORMAT_LATIHAN,
};

export function formatUntuk(paket: string): FormatPaket {
  return FORMAT_PER_PAKET[paket] ?? FORMAT_LATIHAN;
}
