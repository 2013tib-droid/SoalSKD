import type { Metadata } from "next";
import { Suspense } from "react";
import { LayarAktivasi } from "@/components/akun/layar-aktivasi";
import { PAKET_TERBUKA } from "@/config/akses";
import { daftarPaket } from "@/lib/soal";

export const metadata: Metadata = { title: "Aktivasi kode · SoalSKD", robots: { index: false } };

export default async function Halaman() {
  const paketBerbayar = (await daftarPaket()).filter((p) => !(PAKET_TERBUKA as readonly string[]).includes(p.id)).map(({ id, judul }) => ({ id, judul }));
  return (
    <Suspense>
      <LayarAktivasi paketBerbayar={paketBerbayar} />
    </Suspense>
  );
}
