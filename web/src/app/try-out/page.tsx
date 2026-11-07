import type { Metadata } from "next";
import { connection } from "next/server";
import { BUILD_STATIK } from "@/config/build";
import { LayarBeranda } from "@/components/beranda/layar-beranda";
import { ambilFormatSkd, durasiPaket } from "@/lib/format-skd";
import { daftarPaket } from "@/lib/soal";

export const metadata: Metadata = { title: "Pilih paket · SoalSKD" };

export default async function Beranda() {
  // Mode server: daftar paket dibaca dari bank/ setiap request, jadi paket baru langsung muncul.
  // Build statis: dibaca sekali saat build.
  if (!BUILD_STATIK) await connection();
  const [paket, format] = await Promise.all([daftarPaket(), ambilFormatSkd()]);
  return <LayarBeranda paket={paket.map((p) => ({ ...p, durasiMenit: durasiPaket(format, p.jumlahSoal) }))} />;
}
