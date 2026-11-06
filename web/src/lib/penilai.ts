// Mode server: penilaian lewat server action. Di build statis (STATIK=1) modul ini
// diganti `penilai.statik.ts` lewat alias di next.config.ts, karena export statis
// tidak mendukung server action.
export { nilaiUjian } from "@/app/ujian/[paket]/hasil/actions";
