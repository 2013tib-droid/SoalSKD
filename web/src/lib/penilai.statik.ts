import type { HasilPenilaian } from "@/app/ujian/[paket]/hasil/actions";

// Pengganti `penilai.ts` di build statis. Tidak pernah dipanggil: halaman hasil
// statis selalu membawa `dataStatik` dan menghitung skor di browser.
export async function nilaiUjian(): Promise<HasilPenilaian> {
  return { status: "tidak-ada" };
}
