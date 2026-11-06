"use client";

import { CheckCircle } from "@phosphor-icons/react";
import type { SoalUjian } from "@/lib/soal";
import { TeksMd } from "@/components/teks-md";

type Props = {
  soal: SoalUjian;
  nomor: number;
  terpilih?: string;
  onPilih: (huruf: string) => void;
  terkunci: boolean;
};

/** Teks soal + pilihan A–E. Seluruh kartu pilihan bisa diketuk; terpilih ditandai border, latar, dan ikon. */
export function KartuSoal({ soal, nomor, terpilih, onPilih, terkunci }: Props) {
  const idJudul = `soal-${soal.id}`;
  return (
    <article className="flex flex-col gap-6">
      <div id={idJudul} className="body-5 text-text">
        <span className="sr-only">Soal nomor {nomor}. </span>
        <TeksMd>{soal.pertanyaan}</TeksMd>
      </div>
      <div role="radiogroup" aria-labelledby={idJudul} className="flex flex-col gap-3">
        {soal.opsi.map(({ huruf, teks }) => {
          const aktif = terpilih === huruf;
          return (
            <button
              key={huruf}
              type="button"
              role="radio"
              aria-checked={aktif}
              disabled={terkunci}
              onClick={() => onPilih(huruf)}
              className={`flex min-h-12 w-full items-start gap-3 rounded-xl border p-4 text-left transition-[background-color,border-color] duration-200 ease-[var(--ease-out-house)] disabled:cursor-not-allowed ${
                aktif
                  ? "border-primary bg-surface-muted outline outline-1 outline-primary"
                  : "border-border bg-surface active:bg-surface-muted"
              }`}
            >
              <span
                aria-hidden
                className={`mono-number flex size-7 shrink-0 items-center justify-center rounded-full border ${
                  aktif ? "border-primary bg-primary text-on-primary" : "border-border text-text-muted"
                }`}
              >
                {huruf}
              </span>
              <span className="body-5 flex-1 text-text">
                <TeksMd inline>{teks}</TeksMd>
              </span>
              <CheckCircle
                size={20}
                weight="fill"
                aria-hidden
                className={`mt-0.5 shrink-0 text-primary ${aktif ? "opacity-100" : "opacity-0"}`}
              />
            </button>
          );
        })}
      </div>
    </article>
  );
}
