import type { Metadata } from "next";
import { connection } from "next/server";
import { BUILD_STATIK } from "@/config/build";
import { CONTOH_SOAL, PAKET_GRATIS, SOAL_HERO } from "@/config/landing";
import { LayarLanding } from "@/components/landing/layar-landing";
import { ambilFormatSkd, durasiPaket } from "@/lib/format-skd";
import { ambilSoalPembahasan, daftarPaket } from "@/lib/soal";

export const metadata: Metadata = {
  title: "SoalSKD · Try out SKD CPNS dengan timer dan pembahasan",
  description:
    "Latihan SKD CPNS (TWK, TIU, TKP) dengan timer, grid nomor soal, skor per subtes, dan pembahasan tiap pilihan jawaban. Soal orisinal, bisa dikerjakan di HP.",
};

export default async function Landing() {
  if (!BUILD_STATIK) await connection();
  const [paket, format, soalContoh, soalHero] = await Promise.all([
    daftarPaket(),
    ambilFormatSkd(),
    ambilSoalPembahasan(CONTOH_SOAL.paket),
    ambilSoalPembahasan(SOAL_HERO.paket),
  ]);

  const komposisi = format.urutan.map((kode) => ({
    kode,
    jumlah: format.subtes[kode].jumlahSoal,
    nilaiMaks: format.subtes[kode].nilaiMaks,
  }));
  const soalPerPaket = komposisi.reduce((n, s) => n + s.jumlah, 0);
  const ambang = format.urutan.every((k) => format.subtes[k].ambangBatas !== null)
    ? format.urutan.map((k) => ({ kode: k, nilai: format.subtes[k].ambangBatas as number }))
    : null;
  const contoh = soalContoh?.find((s) => s.id === CONTOH_SOAL.id) ?? null;
  const hero = soalHero?.find((s) => s.id === SOAL_HERO.id) ?? null;

  return (
    <LayarLanding
      data={{
        jumlahPaket: paket.length,
        paketLengkap: paket.filter((p) => p.jumlahSoal === soalPerPaket).length,
        totalSoal: paket.reduce((n, p) => n + p.jumlahSoal, 0),
        soalPerPaket,
        durasiMenit: durasiPaket(format, soalPerPaket),
        durasiResmi: format.durasiResmiMenit !== null,
        komposisi,
        nilaiBenar: format.subtes.TWK.nilaiBenar,
        ambang,
        soalGratis: paket.find((p) => p.id === PAKET_GRATIS)?.jumlahSoal ?? 0,
      }}
      soalHero={hero && { kategori: hero.kategori, pertanyaan: hero.pertanyaan, opsi: hero.opsi }}
      soalContoh={contoh}
    />
  );
}
