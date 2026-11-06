import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatUntuk } from "@/config/skd";
import { ambilSoalUjian } from "@/lib/soal";
import { LayarUjian } from "@/components/ujian/layar-ujian";

export const metadata: Metadata = { title: "Ujian · SoalSKD" };

export default async function HalamanUjian({ params }: { params: Promise<{ paket: string }> }) {
  const { paket } = await params;
  const soal = await ambilSoalUjian(paket);
  if (!soal || soal.length === 0) notFound();
  const format = formatUntuk(paket);

  return (
    <LayarUjian
      paket={paket}
      soal={soal}
      durasiMenit={format.durasiMenit}
      peringatanMenit={format.peringatanMenit}
      kritisMenit={format.kritisMenit}
    />
  );
}
