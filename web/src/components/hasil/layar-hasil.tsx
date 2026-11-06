"use client";

import { ArrowCounterClockwise, ArrowLeft, Info } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { nilaiUjian } from "@/lib/penilai";
import type { FormatSkd } from "@/lib/format-skd";
import { hitungHasil, type HasilUjian, type ItemHasil } from "@/lib/nilai";
import type { SoalPembahasan } from "@/lib/soal";
import { bacaRekaman, hapusRekaman, type Rekaman } from "@/components/ujian/use-ujian";
import { catatRiwayat } from "@/lib/riwayat";
import { ItemPembahasan } from "./item-pembahasan";
import { KartuSkor } from "./kartu-skor";

const FILTER = [
  { id: "semua", label: "Semua" },
  { id: "salah", label: "Salah" },
  { id: "kosong", label: "Kosong" },
  { id: "ragu", label: "Ragu" },
] as const;
type IdFilter = (typeof FILTER)[number]["id"];

const tombolDasar =
  "flex h-12 items-center justify-center gap-2 rounded-lg px-4 title-4 transition-[background-color,transform] duration-200 ease-[var(--ease-out-house)] active:scale-[0.98]";
const tombolUtama = `${tombolDasar} bg-primary text-on-primary hover:bg-primary-hover`;
const tombolSekunder = `${tombolDasar} border border-border bg-surface text-text hover:bg-surface-muted`;

type Keadaan =
  | { jenis: "memuat" }
  | { jenis: "belum-ada" }
  | { jenis: "belum-selesai" }
  | { jenis: "gagal" }
  | { jenis: "siap"; hasil: HasilUjian; rekaman: Rekaman };

/** Hanya diisi di build statis (GitHub Pages dev): soal lengkap ikut terkirim dan skor dihitung di browser. */
export type DataStatik = { soal: SoalPembahasan[]; judul: string; format: FormatSkd };

export function LayarHasil({ paket, dataStatik }: { paket: string; dataStatik?: DataStatik }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [keadaan, setKeadaan] = useState<Keadaan>({ jenis: "memuat" });

  const muat = useCallback(async () => {
    const rekaman = bacaRekaman(paket);
    if (!rekaman) return setKeadaan({ jenis: "belum-ada" });
    if (!rekaman.selesai) return setKeadaan({ jenis: "belum-selesai" });
    setKeadaan({ jenis: "memuat" });
    try {
      const hasil = dataStatik
        ? hitungHasil(dataStatik.soal, dataStatik.judul, dataStatik.format, rekaman.jawaban)
        : await nilaiUjian(paket, rekaman.jawaban);
      if (hasil) {
        catatRiwayat({
          paket,
          judul: hasil.judul,
          total: hasil.total,
          totalMaks: hasil.totalMaks,
          perSubtes: hasil.perSubtes.map(({ subtes, skor, maks }) => ({ subtes, skor, maks })),
          percobaan: rekaman.berakhirPada,
          dicatatPada: Date.now(),
        });
      }
      setKeadaan(hasil ? { jenis: "siap", hasil, rekaman } : { jenis: "gagal" });
    } catch {
      setKeadaan({ jenis: "gagal" });
    }
  }, [paket, dataStatik]);

  useEffect(() => {
    muat();
  }, [muat]);

  // Filter disimpan di URL supaya bertahan saat refresh dan bisa dibagikan.
  const filter = (FILTER.some((f) => f.id === params.get("filter")) ? params.get("filter") : "semua") as IdFilter;
  const subtes =
    keadaan.jenis === "siap"
      ? (keadaan.hasil.perSubtes.find((p) => p.subtes === params.get("subtes"))?.subtes ?? null)
      : null;
  const setParam = (kunci: string, nilai: string | null) => {
    const q = new URLSearchParams(params.toString());
    if (nilai === null) q.delete(kunci);
    else q.set(kunci, nilai);
    const s = q.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  };

  const ulangi = () => {
    hapusRekaman(paket);
    router.push(`/ujian/${paket}`);
  };

  const cocok = useCallback(
    (it: ItemHasil, rekaman: Rekaman) =>
      (subtes === null || it.kategori === subtes) &&
      (filter === "semua" ||
        (filter === "ragu" ? !!rekaman.ragu[it.id] : it.status === filter)),
    [filter, subtes],
  );

  const daftar = useMemo(
    () => (keadaan.jenis === "siap" ? keadaan.hasil.items.filter((it) => cocok(it, keadaan.rekaman)) : []),
    [keadaan, cocok],
  );

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-4 pt-6 pb-10">
      <header className="flex flex-col gap-1">
        <Link
          href="/"
          className="caption-4 -ml-2 flex h-11 items-center gap-1 self-start rounded-lg px-2 text-text-muted hover:bg-surface-muted"
        >
          <ArrowLeft size={16} aria-hidden />
          Beranda
        </Link>
        <h1 className="heading-5">Hasil try out</h1>
        <p className="body-6 text-text-muted">
          {keadaan.jenis === "siap" ? keadaan.hasil.judul : `Paket ${paket}`}. Skor dihitung dari jawaban yang kamu
          kumpulkan.
        </p>
      </header>

      {keadaan.jenis === "memuat" && <Kerangka />}

      {keadaan.jenis === "gagal" && (
        <section className="flex flex-col items-start gap-3 rounded-xl border border-border bg-surface p-4">
          <p className="body-6">Skor gagal dihitung. Periksa koneksi lalu coba lagi.</p>
          <button type="button" onClick={muat} className={tombolSekunder}>
            Coba lagi
          </button>
        </section>
      )}

      {(keadaan.jenis === "belum-ada" || keadaan.jenis === "belum-selesai") && (
        <section className="flex flex-col items-start gap-3 rounded-xl border border-border bg-surface p-4">
          <p className="body-6">
            {keadaan.jenis === "belum-ada"
              ? "Belum ada jawaban untuk paket ini di perangkat ini."
              : "Ujian paket ini belum dikumpulkan."}
          </p>
          <Link href={`/ujian/${paket}`} className={tombolUtama}>
            {keadaan.jenis === "belum-ada" ? "Mulai ujian" : "Lanjutkan ujian"}
          </Link>
        </section>
      )}

      {keadaan.jenis === "siap" && (
        <>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <KartuSkor
              label="Total"
              skor={keadaan.hasil.total}
              maks={keadaan.hasil.totalMaks}
              ambangBatas={null}
              lulus={keadaan.hasil.lulusSemua}
              utama
            />
            {keadaan.hasil.perSubtes.map((p) => (
              <KartuSkor key={p.subtes} label={p.subtes} {...p} />
            ))}
          </div>

          <p className="caption-4 flex items-start gap-2 text-text-muted">
            <Info size={16} className="shrink-0" aria-hidden />
            {keadaan.hasil.paketLengkap
              ? "Format dan passing grade mengikuti konfigurasi. Cek aturan BKN/KemenPAN-RB terbaru."
              : `Paket ini berisi ${keadaan.hasil.items.length} soal, bukan paket penuh, jadi skor tidak dibandingkan dengan ambang batas. Cek aturan BKN/KemenPAN-RB terbaru.`}
          </p>

          <section aria-labelledby="judul-pembahasan" className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <h2 id="judul-pembahasan" className="title-3">
                Pembahasan
              </h2>
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Filter status">
                {FILTER.map((f) => {
                  const jumlah = keadaan.hasil.items.filter(
                    (it) =>
                      (subtes === null || it.kategori === subtes) &&
                      (f.id === "semua" ||
                        (f.id === "ragu" ? !!keadaan.rekaman.ragu[it.id] : it.status === f.id)),
                  ).length;
                  return (
                    <Chip
                      key={f.id}
                      aktif={filter === f.id}
                      onClick={() => setParam("filter", f.id === "semua" ? null : f.id)}
                    >
                      {f.label} <span className="mono-number text-xs">{jumlah}</span>
                    </Chip>
                  );
                })}
              </div>
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Filter subtes">
                <Chip aktif={subtes === null} onClick={() => setParam("subtes", null)}>
                  Semua subtes
                </Chip>
                {keadaan.hasil.perSubtes.map((p) => (
                  <Chip key={p.subtes} aktif={subtes === p.subtes} onClick={() => setParam("subtes", p.subtes)}>
                    {p.subtes}
                  </Chip>
                ))}
              </div>
            </div>

            {daftar.length === 0 ? (
              <div className="flex flex-col items-start gap-3 rounded-xl border border-border bg-surface p-4">
                <p className="body-6">Tidak ada soal yang cocok dengan filter ini.</p>
                <button type="button" onClick={() => router.replace(pathname, { scroll: false })} className={tombolSekunder}>
                  Hapus filter
                </button>
              </div>
            ) : (
              <ol className="flex flex-col gap-3">
                {daftar.map((it) => (
                  <li key={it.id}>
                    <ItemPembahasan item={it} ragu={!!keadaan.rekaman.ragu[it.id]} />
                  </li>
                ))}
              </ol>
            )}
          </section>

          <button type="button" onClick={ulangi} className={`${tombolUtama} self-start`}>
            <ArrowCounterClockwise size={20} aria-hidden />
            Ulangi paket ini
          </button>
        </>
      )}
    </main>
  );
}

function Chip({ aktif, onClick, children }: { aktif: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={aktif}
      onClick={onClick}
      className={`title-4 flex h-11 shrink-0 items-center gap-1 rounded-full border px-4 transition-colors duration-200 ease-[var(--ease-out-house)] ${
        aktif ? "border-primary bg-primary text-on-primary" : "border-border bg-surface text-text hover:bg-surface-muted"
      }`}
    >
      {children}
    </button>
  );
}

function Kerangka() {
  return (
    <div aria-busy="true" aria-label="Menghitung skor" className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex h-[132px] flex-col gap-3 rounded-xl border border-border bg-surface p-4 ${i === 0 ? "col-span-3" : ""}`}
          >
            <div className="h-3 w-16 animate-pulse rounded bg-surface-muted" />
            <div className="h-8 w-24 animate-pulse rounded bg-surface-muted" />
            <div className="h-1.5 w-full animate-pulse rounded-full bg-surface-muted" />
          </div>
        ))}
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-surface" />
      ))}
    </div>
  );
}
