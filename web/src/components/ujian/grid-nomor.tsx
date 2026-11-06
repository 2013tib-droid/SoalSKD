"use client";

import { URUTAN_SUBTES } from "@/config/skd";
import type { SoalUjian } from "@/lib/soal";
import type { StatusSoal } from "./use-ujian";

type Props = {
  soal: SoalUjian[];
  indeksAktif: number;
  statusDari: (id: string) => StatusSoal;
  ringkasan: { dijawab: number; ragu: number; belum: number };
  onPilih: (indeks: number) => void;
};

const gayaSel: Record<StatusSoal, string> = {
  belum: "border-border bg-surface text-text",
  dijawab: "border-primary bg-primary text-on-primary",
  ragu: "border-doubt bg-doubt text-on-doubt",
};

const labelStatus: Record<StatusSoal, string> = { belum: "belum dijawab", dijawab: "dijawab", ragu: "ragu-ragu" };

function Legenda({ status, jumlah, label }: { status: StatusSoal; jumlah: number; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span aria-hidden className={`relative size-3 rounded-sm border ${gayaSel[status]}`} />
      <span className="caption-4 text-text-muted">
        {label} <span className="mono-number text-xs text-text">{jumlah}</span>
      </span>
    </li>
  );
}

/** Grid nomor soal per subtes dengan status belum / dijawab / ragu-ragu. */
export function GridNomor({ soal, indeksAktif, statusDari, ringkasan, onPilih }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Ringkasan status">
        <Legenda status="dijawab" jumlah={ringkasan.dijawab} label="Dijawab" />
        <Legenda status="ragu" jumlah={ringkasan.ragu} label="Ragu" />
        <Legenda status="belum" jumlah={ringkasan.belum} label="Belum" />
      </ul>
      {URUTAN_SUBTES.map((subtes) => {
        const daftar = soal.map((s, i) => ({ s, i })).filter(({ s }) => s.kategori === subtes);
        if (daftar.length === 0) return null;
        return (
          <section key={subtes} className="flex flex-col gap-2">
            <h3 className="caption-4 text-text-muted">{subtes}</h3>
            <ol className="grid grid-cols-5 gap-2">
              {daftar.map(({ s, i }) => {
                const st = statusDari(s.id);
                const aktif = i === indeksAktif;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => onPilih(i)}
                      aria-current={aktif ? "step" : undefined}
                      aria-label={`Soal ${i + 1}, ${labelStatus[st]}`}
                      className={`mono-number relative flex h-11 w-full items-center justify-center rounded-lg border transition-transform duration-200 ease-[var(--ease-out-house)] active:scale-95 ${gayaSel[st]} ${
                        aktif ? "ring-2 ring-ring ring-offset-2 ring-offset-surface" : ""
                      }`}
                    >
                      {i + 1}
                      {st === "ragu" && (
                        <span aria-hidden className="absolute top-1 right-1 size-1.5 rounded-full bg-on-doubt" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
