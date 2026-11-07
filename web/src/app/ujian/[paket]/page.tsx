import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ambangTimerMenit } from "@/config/skd";
import { ambilFormatSkd, durasiPaket } from "@/lib/format-skd";
import { ambilJudulPaket, ambilSoalUjian, daftarPaket } from "@/lib/soal";
import { paketTerbuka } from "@/config/akses";
import { GerbangUjian } from "@/components/ujian/gerbang-ujian";
import { LayarUjian } from "@/components/ujian/layar-ujian";

export const metadata: Metadata = { title: "Ujian · SoalSKD" };

export async function generateStaticParams() {
  return (await daftarPaket()).map((p) => ({ paket: p.id }));
}

export default async function HalamanUjian({ params }: { params: Promise<{ paket: string }> }) {
  const { paket } = await params;
  // Paket berbayar: soal tidak ditanam di halaman; diminta lewat server action setelah hak akses dicek.
  if (!paketTerbuka(paket)) {
    const judul = await ambilJudulPaket(paket);
    if (!judul) notFound();
    return <GerbangUjian paket={paket} judul={judul} />;
  }
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
