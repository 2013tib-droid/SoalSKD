import { ArrowLeft, ArrowsClockwise, ChartLineUp, Exam, LockKeyOpen } from "@phosphor-icons/react";
import Link from "next/link";
import type { ReactNode } from "react";

type Mode = "masuk" | "daftar";

const MANFAAT = [
  { Ikon: ArrowsClockwise, judul: "Lanjutkan di perangkat lain", isi: "Jawaban tersimpan otomatis dan ikut ke HP atau laptopmu." },
  { Ikon: LockKeyOpen, judul: "Paket yang dibeli terbuka di akun", isi: "Tukar kode aktivasi sekali, buka kapan saja." },
  { Ikon: ChartLineUp, judul: "Riwayat skor tersimpan", isi: "Bandingkan hasil tiap percobaan dan lihat kemajuanmu." },
];

/** Status ilustrasi grid nomor: d = dijawab, r = ragu, a = aktif, b = belum. */
const SEL = "ddddddrabb".split("");

function Merek() {
  return (
    <Link href="/" className="title-3 -ml-1 flex min-h-11 items-center gap-2 self-start rounded-lg px-1 text-text">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-on-primary">
        <Exam size={20} weight="bold" aria-hidden />
      </span>
      SoalSKD
    </Link>
  );
}

/** Pratinjau kecil layar ujian (dekoratif): grid nomor berstatus + timer. */
function PratinjauUjian() {
  return (
    <div aria-hidden className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="caption-4 text-text-muted">TWK · soal 8</span>
        <span className="mono-number text-text">00:42:15</span>
      </div>
      <ol className="grid grid-cols-5 gap-2">
        {SEL.map((s, i) => (
          <li
            key={i}
            className={`mono-number relative flex h-11 items-center justify-center rounded-lg border text-sm ${
              s === "d"
                ? "border-primary bg-primary text-on-primary"
                : s === "r"
                  ? "border-doubt bg-doubt text-on-doubt"
                  : "border-border bg-surface text-text"
            } ${s === "a" ? "ring-2 ring-ring ring-offset-2 ring-offset-surface" : ""}`}
          >
            {i + 1}
            {s === "r" && <span className="absolute top-1 right-1 size-1.5 rounded-full bg-on-doubt" />}
          </li>
        ))}
      </ol>
      <p className="caption-4 text-text-muted">
        Dijawab <span className="mono-number text-text">6</span> · Ragu <span className="mono-number text-text">1</span> · Belum{" "}
        <span className="mono-number text-text">3</span>
      </p>
    </div>
  );
}

function DaftarManfaat() {
  return (
    <ul className="flex flex-col gap-4">
      {MANFAAT.map(({ Ikon, judul, isi }) => (
        <li key={judul} className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-primary">
            <Ikon size={20} aria-hidden />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="title-4">{judul}</span>
            <span className="body-6 text-text-muted">{isi}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Sakelar Masuk / Daftar; `?lanjut=` ikut dibawa. */
function Sakelar({ mode, qLanjut }: { mode: Mode; qLanjut: string }) {
  return (
    <nav aria-label="Masuk atau daftar" className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-surface-muted p-1">
      {(["masuk", "daftar"] as const).map((m) => {
        const aktif = m === mode;
        return (
          <Link
            key={m}
            href={`/${m}${qLanjut}`}
            replace
            aria-current={aktif ? "page" : undefined}
            className={`title-4 flex h-10 items-center justify-center rounded-md transition-colors duration-200 ease-[var(--ease-out-house)] ${
              aktif ? "border border-border bg-surface text-text" : "text-text-muted hover:text-text"
            }`}
          >
            {m === "masuk" ? "Masuk" : "Daftar"}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Kerangka /masuk dan /daftar. HP: merek, judul, sakelar, form, lalu manfaat.
 * Desktop (≥1024px): panel kiri berisi pratinjau ujian + manfaat, form di kanan.
 */
export function KerangkaMasuk({
  mode,
  judul,
  keterangan,
  qLanjut = "",
  sakelar = true,
  children,
}: {
  mode: Mode;
  judul: string;
  keterangan?: ReactNode;
  qLanjut?: string;
  sakelar?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-2">
      <aside className="hidden border-r border-border bg-surface-muted lg:flex lg:flex-col lg:justify-center lg:px-12 lg:py-12">
        <div className="mx-auto flex w-full max-w-md flex-col gap-8">
          <Merek />
          <p className="heading-4 text-balance">Latihan SKD yang terasa seperti hari ujian.</p>
          <PratinjauUjian />
          <DaftarManfaat />
        </div>
      </aside>

      <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 pt-4 pb-10 lg:justify-center lg:py-12">
        <div className="flex items-center justify-between gap-2">
          <div className="lg:hidden">
            <Merek />
          </div>
          <Link
            href="/"
            className="caption-4 -mr-2 flex h-11 items-center gap-1 rounded-lg px-2 text-text-muted hover:bg-surface-muted lg:mr-0 lg:-ml-2"
          >
            <ArrowLeft size={16} aria-hidden />
            Halaman utama
          </Link>
        </div>

        <div className="masuk-naik flex flex-col gap-6">
          <header className="flex flex-col gap-2 pt-2">
            <h1 className="heading-4 text-balance">{judul}</h1>
            {keterangan && <p className="body-6 text-text-muted">{keterangan}</p>}
          </header>
          {sakelar && <Sakelar mode={mode} qLanjut={qLanjut} />}
          {children}
        </div>

        <section aria-labelledby="judul-manfaat" className="flex flex-col gap-4 border-t border-border pt-6 lg:hidden">
          <h2 id="judul-manfaat" className="caption-4 text-text-muted">
            Dengan akun SoalSKD
          </h2>
          <DaftarManfaat />
          <PratinjauUjian />
        </section>
      </main>
    </div>
  );
}
