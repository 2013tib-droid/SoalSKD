import { LayarBeranda } from "@/components/beranda/layar-beranda";
import { ambilFormatSkd, durasiPaket } from "@/lib/format-skd";
import { daftarPaket } from "@/lib/soal";

// Daftar paket dibaca dari bank/ setiap request, jadi paket baru langsung muncul.
export const dynamic = "force-dynamic";

export default async function Beranda() {
  const [paket, format] = await Promise.all([daftarPaket(), ambilFormatSkd()]);
  return <LayarBeranda paket={paket.map((p) => ({ ...p, durasiMenit: durasiPaket(format, p.jumlahSoal) }))} />;
}
