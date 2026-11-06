"use client";

import { X } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";

type Props = {
  terbuka: boolean;
  onTutup: () => void;
  judul: string;
  /** "sheet": menempel di bawah layar HP. "tengah": dialog konfirmasi. */
  varian?: "sheet" | "tengah";
  children: React.ReactNode;
  footer?: React.ReactNode;
};

/** Dialog berbasis <dialog> native: fokus terkunci di dalam, Esc menutup. */
export function Dialog({ terbuka, onTutup, judul, varian = "tengah", children, footer }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (terbuka && !el.open) el.showModal();
    if (!terbuka && el.open) el.close();
  }, [terbuka]);

  const posisi =
    varian === "sheet"
      ? "mt-auto mb-0 w-full max-w-none rounded-t-xl max-h-[85dvh]"
      : "m-auto w-[calc(100%-32px)] max-w-sm rounded-xl";

  return (
    <dialog
      ref={ref}
      onClose={onTutup}
      onClick={(e) => e.target === ref.current && onTutup()}
      aria-labelledby="judul-dialog"
      className={`${posisi} border border-border bg-surface p-0 text-text backdrop:bg-overlay`}
    >
      <div className="flex max-h-[inherit] flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
          <h2 id="judul-dialog" className="title-3">
            {judul}
          </h2>
          <button
            type="button"
            onClick={onTutup}
            aria-label="Tutup"
            className="flex size-11 items-center justify-center rounded-lg text-text-muted active:bg-surface-muted"
          >
            <X size={20} aria-hidden />
          </button>
        </header>
        <div className="overflow-y-auto p-4">{children}</div>
        {footer && (
          <footer className="flex gap-3 border-t border-border p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
            {footer}
          </footer>
        )}
      </div>
    </dialog>
  );
}
