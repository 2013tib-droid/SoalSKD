"use client";

import { CaretDown, CheckCircle, Flag, MinusCircle, XCircle } from "@phosphor-icons/react";
import type { ItemHasil, StatusJawaban } from "@/app/ujian/[paket]/hasil/actions";

const ikonStatus: Record<StatusJawaban, { Ikon: typeof CheckCircle; kelas: string; label: string }> = {
  benar: { Ikon: CheckCircle, kelas: "text-success", label: "Benar" },
  salah: { Ikon: XCircle, kelas: "text-danger", label: "Salah" },
  kosong: { Ikon: MinusCircle, kelas: "text-text-muted", label: "Kosong" },
};

/** Satu soal di pembahasan: ringkas saat tertutup, lengkap (opsi, kunci, bobot, pembahasan) saat dibuka. */
export function ItemPembahasan({ item, ragu }: { item: ItemHasil; ragu: boolean }) {
  const tkp = item.bobot !== null;
  const { Ikon, kelas, label } = ikonStatus[item.status];
  const labelStatus = tkp && item.status === "salah" ? "Bukan opsi terbaik" : label;

  return (
    <details className="group rounded-xl border border-border bg-surface">
      <summary className="flex min-h-12 cursor-pointer list-none items-start gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <span className="mono-number w-6 shrink-0 pt-0.5 text-text-muted">{item.nomor}</span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="body-6 line-clamp-2 text-text">{item.pertanyaan}</span>
          <span className="caption-4 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className={`flex items-center gap-1 ${kelas}`}>
              <Ikon size={16} weight="fill" aria-hidden />
              {labelStatus}
            </span>
            <span className="text-text-muted">
              {item.kategori} · {item.subtopik}
            </span>
            <span className="mono-number text-xs text-text-muted">
              +{item.poin}/{item.poinMaks}
            </span>
            {ragu && (
              <span className="flex items-center gap-1 text-text-muted">
                <Flag size={14} weight="fill" className="text-doubt" aria-hidden />
                Ragu
              </span>
            )}
          </span>
        </span>
        <CaretDown
          size={20}
          aria-hidden
          className="mt-0.5 shrink-0 text-text-muted transition-transform duration-200 ease-[var(--ease-out-house)] group-open:rotate-180"
        />
      </summary>

      <div className="flex flex-col gap-4 border-t border-border p-4">
        <p className="body-5 text-text">{item.pertanyaan}</p>
        <ul className="flex flex-col gap-2">
          {item.opsi.map(({ huruf, teks }) => {
            const dipilih = item.jawaban === huruf;
            const kunci = item.kunci === huruf;
            return (
              <li
                key={huruf}
                className={`flex items-start gap-3 rounded-lg border p-3 ${
                  kunci ? "border-success" : dipilih ? "border-danger" : "border-border"
                }`}
              >
                <span className="mono-number w-4 shrink-0 text-text-muted">{huruf}</span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="body-6 text-text">{teks}</span>
                  {(kunci || dipilih) && (
                    <span className="caption-4 flex flex-wrap gap-x-3">
                      {kunci && (
                        <span className="flex items-center gap-1 text-success">
                          <CheckCircle size={14} weight="fill" aria-hidden />
                          {tkp ? "Opsi terbaik" : "Kunci"}
                        </span>
                      )}
                      {dipilih && <span className="text-text-muted">Jawabanmu</span>}
                    </span>
                  )}
                </span>
                {tkp && (
                  <span className="mono-number shrink-0 text-text-muted" aria-label={`Bobot ${item.bobot![huruf]}`}>
                    {item.bobot![huruf]}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
        <section className="flex flex-col gap-1 rounded-lg bg-surface-muted p-3">
          <h3 className="caption-4 text-text-muted">Pembahasan</h3>
          <p className="body-6 text-text">{item.pembahasan}</p>
        </section>
      </div>
    </details>
  );
}
