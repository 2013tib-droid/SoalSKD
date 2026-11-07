import type { Metadata } from "next";
import { Suspense } from "react";
import { LayarMasuk } from "@/components/akun/layar-masuk";

export const metadata: Metadata = { title: "Masuk · SoalSKD", robots: { index: false } };

export default function Halaman() {
  return (
    <Suspense>
      <LayarMasuk mode="masuk" />
    </Suspense>
  );
}
