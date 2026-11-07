// Mode server: soal paket berbayar lewat server action. Di build statis (STATIK=1)
// modul ini diganti `gerbang.statik.ts` (lihat next.config.ts).
export { muatUjianBerbayar } from "@/app/ujian/[paket]/actions";
