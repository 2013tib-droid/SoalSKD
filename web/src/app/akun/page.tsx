import type { Metadata } from "next";
import { Suspense } from "react";
import { LayarAkunSaya } from "@/components/akun/layar-akun-saya";
import { PAKET_TERBUKA } from "@/config/akses";
import { daftarPaket } from "@/lib/soal";

export const metadata: Metadata = { title: "Akun & pembelian · SoalSKD", robots: { index: false } };

export default async function Halaman() {
  // Katalog saja (judul), tanpa soal.
  const paket = (await daftarPaket()).map(({ id, judul }) => ({
    id,
    judul,
    gratis: (PAKET_TERBUKA as readonly string[]).includes(id),
  }));
  return (
    <Suspense>
      <LayarAkunSaya paket={paket} />
    </Suspense>
  );
}
