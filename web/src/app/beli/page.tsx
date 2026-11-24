import type { Metadata } from "next";
import { Suspense } from "react";
import { LayarBeli } from "@/components/akun/layar-beli";

export const metadata: Metadata = { title: "Beli bundel · SoalSKD", robots: { index: false } };

export default function Halaman() {
  return (
    <Suspense>
      <LayarBeli />
    </Suspense>
  );
}
