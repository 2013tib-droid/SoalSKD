import { CheckCircle, MinusCircle, XCircle } from "@phosphor-icons/react";

type Props = {
  label: string;
  skor: number;
  maks: number;
  ambangBatas: number | null;
  lulus: boolean | null;
  utama?: boolean;
};

/** Kartu KPI skor. Status ambang batas memakai ikon + teks, bukan warna saja. */
export function KartuSkor({ label, skor, maks, ambangBatas, lulus, utama }: Props) {
  const persen = maks > 0 ? Math.round((skor / maks) * 100) : 0;
  return (
    <section
      aria-label={`Skor ${label}`}
      className={`flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 ${utama ? "col-span-full" : ""}`}
    >
      <h2 className="caption-4 text-text-muted">{label}</h2>
      <p className="flex items-baseline gap-1">
        <span className={`font-mono font-semibold tabular-nums ${utama ? "text-3xl" : "text-2xl"}`}>{skor}</span>
        <span className="mono-number text-text-muted">/ {maks}</span>
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted" aria-hidden>
        <div className="h-full rounded-full bg-primary" style={{ width: `${persen}%` }} />
      </div>
      {lulus === null ? (
        utama && (
        <p className="caption-4 flex items-center gap-1 text-text-muted">
          <MinusCircle size={16} aria-hidden />
          Ambang batas belum diatur
        </p>
        )
      ) : lulus ? (
        <p className="caption-4 flex items-center gap-1 text-success">
          <CheckCircle size={16} weight="fill" aria-hidden />
          Di atas ambang {ambangBatas}
        </p>
      ) : (
        <p className="caption-4 flex items-center gap-1 text-danger">
          <XCircle size={16} weight="fill" aria-hidden />
          Di bawah ambang {ambangBatas}
        </p>
      )}
    </section>
  );
}
