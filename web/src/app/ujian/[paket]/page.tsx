import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ambangTimerMenit } from "@/config/skd";
import { ambilFormatSkd, durasiPaket } from "@/lib/format-skd";
import { ambilSoalUjian, daftarPaket } from "@/lib/soal";
import { LayarUjian } from "@/components/ujian/layar-ujian";

export const metadata: Metadata = { title: "Ujian · SoalSKD" };

export async function generateStaticParams() {
  return (await daftarPaket()).map((p) => ({ paket: p.id }));
}

export default async function HalamanUjian({ params }: { params: Promise<{ paket: string }> }) {
  const { paket } = await params;
  const soal = await ambilSoalUjian(paket);
  if (!soal || soal.length === 0) notFound();
  const durasiMenit = durasiPaket(await ambilFormatSkd(), soal.length);
  const { peringatanMenit, kritisMenit } = ambangTimerMenit(durasiMenit);

  return (
    <LayarUjian
      paket={paket}
      soal={soal}
      durasiMenit={durasiMenit}
      peringatanMenit={peringatanMenit}
      kritisMenit={kritisMenit}
    />
  );
}
