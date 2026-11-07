"use client";

import { ArrowCounterClockwise, CheckCircle, XCircle } from "@phosphor-icons/react";
import { useState } from "react";
import { KartuSkor } from "@/components/hasil/kartu-skor";
import { TeksMd } from "@/components/teks-md";
import { KartuSoal } from "@/components/ujian/kartu-soal";
import type { SoalPembahasan } from "@/lib/soal";

/** Satu soal contoh di landing: pilih jawaban, lalu pembahasan muncul di bawahnya. */
export function ContohSoal({ soal }: { soal: SoalPembahasan }) {
  const [pilihan, setPilihan] = useState<string>();
  const benar = pilihan === soal.kunci;
  const alasan = pilihan && !benar ? soal.pembahasan.opsi[pilihan] : null;

  return (
    <div className="flex min-w-0 flex-col gap-6 rounded-xl border border-border bg-surface p-4 sm:p-6">
      <p className="caption-4 text-text-muted">
        {soal.kategori} · {soal.subtopik}
      </p>
      <KartuSoal soal={soal} nomor={1} terpilih={pilihan} onPilih={setPilihan} terkunci={pilihan !== undefined} />

      <div aria-live="polite" className="flex flex-col gap-4 empty:hidden">
        {pilihan && (
          <>
            <p className={`title-3 flex items-center gap-2 ${benar ? "text-success" : "text-danger"}`}>
              {benar ? (
                <CheckCircle size={20} weight="fill" aria-hidden />
              ) : (
                <XCircle size={20} weight="fill" aria-hidden />
              )}
              {benar ? `Benar, jawabannya ${soal.kunci}` : `Belum tepat. Jawabannya ${soal.kunci}`}
            </p>
            {alasan && (
              <div className="body-6 rounded-lg bg-surface-muted p-4 text-text">
                <p className="title-4 mb-2">Kenapa {pilihan} keliru</p>
                <TeksMd>{alasan}</TeksMd>
              </div>
            )}
            <div className="body-6 text-text">
              <TeksMd>{soal.pembahasan.inti}</TeksMd>
            </div>
            <button
              type="button"
              onClick={() => setPilihan(undefined)}
              className="title-4 flex h-12 items-center justify-center gap-2 self-start rounded-lg border border-border bg-surface px-4 text-text transition-[background-color,transform] duration-200 ease-[var(--ease-out-house)] hover:bg-surface-muted active:scale-[0.98]"
            >
              <ArrowCounterClockwise size={20} aria-hidden />
              Coba lagi
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/** Contoh tampilan kartu skor. Angkanya ilustrasi, bukan data pengguna. */
export function PratinjauHasil({ maks }: { maks: { kode: string; nilai: number }[] }) {
  // Ilustrasi saja: sekitar 77%, 71%, 83% dari nilai maksimal tiap subtes.
  const contoh = maks.map((m, i) => ({ ...m, skor: Math.round((m.nilai * [0.77, 0.71, 0.83][i % 3]) / 5) * 5 }));
  const total = contoh.reduce((n, s) => n + s.skor, 0);
  const totalMaks = maks.reduce((n, s) => n + s.nilai, 0);
  return (
    <div className="grid grid-cols-3 gap-3">
      <KartuSkor label="Total" skor={total} maks={totalMaks} ambangBatas={null} lulus={null} utama />
      {contoh.map((s) => (
        <KartuSkor key={s.kode} label={s.kode} skor={s.skor} maks={s.nilai} ambangBatas={null} lulus={null} />
      ))}
    </div>
  );
}
