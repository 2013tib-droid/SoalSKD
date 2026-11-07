import type { Metadata } from "next";
import { LayarLegal } from "@/components/legal/layar-legal";
import { muatHalamanLegal } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan · SoalSKD",
  description: "Syarat memakai dan membeli try out SKD CPNS di SoalSKD: akun, kode aktivasi, pengembalian dana, dan hak cipta.",
};

export default async function Halaman() {
  return (
    <LayarLegal
      judul="Syarat & Ketentuan"
      halaman={await muatHalamanLegal("syarat")}
      lain={{ href: "/privasi", label: "Kebijakan Privasi" }}
    />
  );
}
