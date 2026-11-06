"use client";

import { CheckCircle, CloudSlash } from "@phosphor-icons/react";
import type { StatusSimpan } from "./use-ujian";

function jam(ms: number) {
  return new Date(ms).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/** Status simpan otomatis. Diumumkan ke pembaca layar hanya saat gagal. */
export function IndikatorSimpan({ status, pada }: { status: StatusSimpan; pada: number | null }) {
  if (status === "memuat") return <span className="caption-4 text-text-muted">Memuat jawaban…</span>;
  if (status === "gagal")
    return (
      <span role="status" className="caption-4 flex items-center gap-1 text-danger">
        <CloudSlash size={16} aria-hidden />
        Jawaban belum tersimpan. Penyimpanan perangkat penuh atau diblokir.
      </span>
    );
  return (
    <span className="caption-4 flex items-center gap-1 text-text-muted">
      <CheckCircle size={16} weight="fill" className="text-success" aria-hidden />
      Tersimpan{pada ? ` ${jam(pada)}` : ""}
    </span>
  );
}
