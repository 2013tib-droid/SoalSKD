import type { HasilUjian } from "@/lib/nilai";

// Pengganti `penilai.ts` di build statis. Tidak pernah dipanggil: halaman hasil
// statis selalu membawa `dataStatik` dan menghitung skor di browser.
export async function nilaiUjian(): Promise<HasilUjian | null> {
  return null;
}
