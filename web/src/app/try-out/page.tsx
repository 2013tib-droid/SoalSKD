import type { Metadata } from "next";
import { connection } from "next/server";
import { BUILD_STATIK } from "@/config/build";
import { LayarBeranda } from "@/components/beranda/layar-beranda";
import { PanduanUjian } from "@/components/panduan/panduan-ujian";
import { SOAL_HERO } from "@/config/landing";
import { ambilFormatSkd, durasiPaket } from "@/lib/format-skd";
import { ambilSoalUjian, daftarPaket } from "@/lib/soal";
import { paketTerbuka } from "@/config/akses";

export const metadata: Metadata = { title: "Pilih paket · SoalSKD" };

export default async function Beranda() {
  // Mode server: daftar paket dibaca dari bank/ setiap request, jadi paket baru langsung muncul.
  // Build statis: dibaca sekali saat build.
  if (!BUILD_STATIK) await connection();
  const [paket, format, soalPanduan] = await Promise.all([
    daftarPaket(),
    ambilFormatSkd(),
    ambilSoalUjian(SOAL_HERO.paket),
  ]);
  // Panduan dirender di server dan diteruskan sebagai slot, jadi tidak menambah bundel client.
  const soal = soalPanduan?.find((s) => s.id === SOAL_HERO.id);
  const komposisi = format.urutan.map((kode) => ({ kode, jumlah: format.subtes[kode].jumlahSoal }));
  const panduan = soal && (
    <PanduanUjian
      soal={{ kategori: soal.kategori, pertanyaan: soal.pertanyaan, opsi: soal.opsi }}
      data={{ komposisi, soalPerPaket: komposisi.reduce((n, s) => n + s.jumlah, 0) }}
    />
  );
  return (
    <LayarBeranda
      paket={paket.map((p) => ({ ...p, durasiMenit: durasiPaket(format, p.jumlahSoal), terbuka: paketTerbuka(p.id) }))}
      panduan={panduan}
    />
  );
}
