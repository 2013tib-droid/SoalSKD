import type { Metadata } from "next";
import { Suspense } from "react";
import { LayarHasil } from "@/components/hasil/layar-hasil";

export const metadata: Metadata = { title: "Hasil · SoalSKD" };

export default async function HalamanHasil({ params }: { params: Promise<{ paket: string }> }) {
  const { paket } = await params;
  return (
    <Suspense>
      <LayarHasil paket={paket} />
    </Suspense>
  );
}
