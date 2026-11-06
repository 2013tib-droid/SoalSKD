"use client";

import { BookOpen, CaretDown, CheckCircle, Flag, Lightbulb, MinusCircle, XCircle } from "@phosphor-icons/react";
import type { ItemHasil, StatusJawaban } from "@/lib/nilai";
import { TeksMd } from "@/components/teks-md";

const ikonStatus: Record<StatusJawaban, { Ikon: typeof CheckCircle; kelas: string; label: string }> = {
  benar: { Ikon: CheckCircle, kelas: "text-success", label: "Benar" },
  salah: { Ikon: XCircle, kelas: "text-danger", label: "Salah" },
  kosong: { Ikon: MinusCircle, kelas: "text-text-muted", label: "Kosong" },
};

/** Cuplikan satu baris untuk ringkasan: Markdown dibuang, baris digabung. */
const cuplikan = (md: string) => md.replace(/[*_`#|>]/g, "").replace(/\s+/g, " ").trim();

/**
 * Satu soal di pembahasan. Tertutup: status, subtopik, poin, ragu.
 * Terbuka: soal, setiap opsi dengan alasannya (TKP + bobot), inti, konsep, tips, rujukan.
 */
export function ItemPembahasan({ item, ragu }: { item: ItemHasil; ragu: boolean }) {
  const tkp = item.bobot !== null;
  const { Ikon, kelas, label } = ikonStatus[item.status];
  const labelStatus = tkp && item.status === "salah" ? "Bukan opsi terbaik" : label;

  return (
    <details className="group rounded-xl border border-border bg-surface">
      <summary className="flex min-h-12 cursor-pointer list-none items-start gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <span className="mono-number w-6 shrink-0 pt-0.5 text-text-muted">{item.nomor}</span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="body-6 line-clamp-2 text-text">{cuplikan(item.pertanyaan)}</span>
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
        <div className="body-5 text-text">
          <TeksMd>{item.pertanyaan}</TeksMd>
        </div>

        <ul className="flex flex-col gap-2">
          {item.opsi.map(({ huruf, teks }) => {
            const dipilih = item.jawaban === huruf;
            const kunci = item.kunci === huruf;
            const alasan = item.pembahasan.opsi[huruf];
            return (
              <li
                key={huruf}
                className={`flex items-start gap-3 rounded-lg border p-3 ${
                  kunci ? "border-success" : dipilih ? "border-danger" : "border-border"
                }`}
              >
                <span className="mono-number w-4 shrink-0 text-text-muted">{huruf}</span>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="body-6 text-text">
                    <TeksMd>{teks}</TeksMd>
                  </div>
                  {(kunci || dipilih) && (
                    <span className="caption-4 flex flex-wrap gap-x-3">
                      {kunci && (
                        <span className="flex items-center gap-1 text-success">
                          <CheckCircle size={14} weight="fill" aria-hidden />
                          {tkp ? "Opsi terbaik" : "Kunci"}
                        </span>
                      )}
                      {dipilih && (
                        <span className={`flex items-center gap-1 ${kunci ? "text-text-muted" : "text-danger"}`}>
                          {!kunci && <XCircle size={14} weight="fill" aria-hidden />}
                          Jawabanmu
                        </span>
                      )}
                    </span>
                  )}
                  {/* Alasan per opsi: selalu tampil untuk jawabanmu, opsi lain lebih redup. */}
                  {alasan && (
                    <div className={`body-6 ${dipilih ? "text-text" : "text-text-muted"}`}>
                      <TeksMd>{alasan}</TeksMd>
                    </div>
                  )}
                </div>
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
          <h3 className="caption-4 text-text-muted">{tkp ? "Prinsip penilaian" : "Pembahasan"}</h3>
          <div className="body-6 text-text">
            <TeksMd>{item.pembahasan.inti}</TeksMd>
          </div>
        </section>

        {item.pembahasan.konsep && (
          <section className="flex flex-col gap-1 rounded-lg border border-border p-3">
            <h3 className="caption-4 flex items-center gap-1 text-text-muted">
              <BookOpen size={14} aria-hidden />
              Konsep
            </h3>
            <div className="body-6 text-text">
              <TeksMd>{item.pembahasan.konsep}</TeksMd>
            </div>
          </section>
        )}

        <section className="flex flex-col gap-1 rounded-lg border border-border p-3">
          <h3 className="caption-4 flex items-center gap-1 text-text-muted">
            <Lightbulb size={14} aria-hidden />
            Tips
          </h3>
          <div className="body-6 text-text">
            <TeksMd>{item.tips}</TeksMd>
          </div>
        </section>

        {item.rujukan.length > 0 && (
          <p className="caption-4 text-text-muted">Rujukan: {item.rujukan.join("; ")}</p>
        )}
      </div>
    </details>
  );
}
