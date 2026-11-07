import type { UjianBerbayar } from "@/app/ujian/[paket]/actions";

// Pengganti `gerbang.ts` di build statis. Tidak pernah dipanggil: di build statis
// semua paket terbuka dan soal ikut di halaman.
export async function muatUjianBerbayar(): Promise<UjianBerbayar> {
  return { status: "tidak-ada" };
}
