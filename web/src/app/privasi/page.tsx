import type { Metadata } from "next";
import { LayarLegal } from "@/components/legal/layar-legal";
import { muatHalamanLegal } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Kebijakan Privasi · SoalSKD",
  description: "Data yang disimpan SoalSKD, untuk apa, di mana, berapa lama, dan cara mengatur atau menghapusnya.",
};

export default async function Halaman() {
  return (
    <LayarLegal
      judul="Kebijakan Privasi"
      halaman={await muatHalamanLegal("privasi")}
      lain={{ href: "/syarat", label: "Syarat & Ketentuan" }}
    />
  );
}
