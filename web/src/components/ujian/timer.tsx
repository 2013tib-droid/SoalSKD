"use client";

import { Clock, Warning } from "@phosphor-icons/react";

export type StatusTimer = "normal" | "peringatan" | "kritis";

export function statusTimer(sisaDetik: number, peringatanMenit: number, kritisMenit: number): StatusTimer {
  if (sisaDetik <= kritisMenit * 60) return "kritis";
  if (sisaDetik <= peringatanMenit * 60) return "peringatan";
  return "normal";
}

function formatWaktu(detik: number) {
  const j = Math.floor(detik / 3600);
  const m = Math.floor((detik % 3600) / 60);
  const d = detik % 60;
  const dua = (n: number) => String(n).padStart(2, "0");
  return `${dua(j)}:${dua(m)}:${dua(d)}`;
}

const warna: Record<StatusTimer, string> = {
  normal: "text-text",
  peringatan: "text-warning",
  kritis: "text-danger",
};

/** Timer ujian. Selalu terlihat di topbar; status berubah warna dan ikon, bukan warna saja. */
export function Timer({ sisaDetik, status, dimuat }: { sisaDetik: number; status: StatusTimer; dimuat: boolean }) {
  const Ikon = status === "normal" ? Clock : Warning;
  return (
    <div
      role="timer"
      aria-label={dimuat ? `Sisa waktu ${formatWaktu(sisaDetik)}` : "Memuat sisa waktu"}
      className={`flex items-center gap-1 ${warna[status]}`}
    >
      <Ikon
        key={status}
        size={20}
        weight={status === "normal" ? "regular" : "fill"}
        aria-hidden
        className={status === "normal" ? "" : "animate-[pulse-sekali_600ms_var(--ease-out-house)_1]"}
      />
      <span className="mono-timer">{dimuat ? formatWaktu(sisaDetik) : "--:--:--"}</span>
    </div>
  );
}
