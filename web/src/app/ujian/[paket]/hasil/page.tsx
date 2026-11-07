import type { Metadata } from "next";
import { Suspense } from "react";
import { BUILD_STATIK } from "@/config/build";
import { paketTerbuka } from "@/config/akses";
import { LayarHasil, type DataStatik } from "@/components/hasil/layar-hasil";
import { ambilFormatSkd } from "@/lib/format-skd";
import { ambilJudulPaket, ambilSoalPembahasan, daftarPaket } from "@/lib/soal";

export const metadata: Metadata = { title: "Hasil · SoalSKD" };

export async function generateStaticParams() {
  return (await daftarPaket()).map((p) => ({ paket: p.id }));
}

/**
 * Build statis saja: soal lengkap ikut ke halaman karena tidak ada server untuk menilai.
 * Hanya paket terbuka; kunci paket berbayar tidak pernah ditanam di halaman statis.
 */
async function muatDataStatik(paket: string): Promise<DataStatik | undefined> {
  if (!BUILD_STATIK || !paketTerbuka(paket)) return undefined;
  const [soal, judul, format] = await Promise.all([ambilSoalPembahasan(paket), ambilJudulPaket(paket), ambilFormatSkd()]);
  return soal && judul ? { soal, judul, format } : undefined;
}

export default async function HalamanHasil({ params }: { params: Promise<{ paket: string }> }) {
  const { paket } = await params;
  const dataStatik = await muatDataStatik(paket);
  return (
    <Suspense>
      <LayarHasil paket={paket} dataStatik={dataStatik} />
    </Suspense>
  );
}
