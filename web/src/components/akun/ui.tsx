"use client";

import { ArrowLeft, CheckCircle, Eye, EyeSlash, GoogleLogo, Info, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";

const tombolDasar =
  "flex h-12 w-full items-center justify-center gap-2 rounded-lg px-4 title-4 transition-[background-color,transform,opacity] duration-200 ease-[var(--ease-out-house)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60";
export const tombolUtama = `${tombolDasar} bg-primary text-on-primary hover:bg-primary-hover`;
export const tombolSekunder = `${tombolDasar} border border-border bg-surface text-text hover:bg-surface-muted`;
export const tautanTeks = "title-4 inline-flex min-h-11 items-center rounded-lg px-1 text-primary underline-offset-4 hover:underline";

/** Kerangka layar akun: tautan kembali, judul, isi satu kolom (nyaman satu tangan). */
export function LayarAkun({
  judul,
  keterangan,
  kembali = { href: "/", label: "Halaman utama" },
  children,
}: {
  judul: string;
  keterangan?: ReactNode;
  kembali?: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 pt-6 pb-10">
      <header className="flex flex-col gap-1">
        <Link
          href={kembali.href}
          className="caption-4 -ml-2 flex h-11 items-center gap-1 self-start rounded-lg px-2 text-text-muted hover:bg-surface-muted"
        >
          <ArrowLeft size={16} aria-hidden />
          {kembali.label}
        </Link>
        <h1 className="heading-5">{judul}</h1>
        {keterangan && <p className="body-6 text-text-muted">{keterangan}</p>}
      </header>
      {children}
    </main>
  );
}

export function Kartu({ children, aksen = false }: { children: ReactNode; aksen?: boolean }) {
  return (
    <section className={`flex flex-col gap-4 rounded-xl border bg-surface p-4 ${aksen ? "border-primary" : "border-border"}`}>
      {children}
    </section>
  );
}

type PropsKolom = InputHTMLAttributes<HTMLInputElement> & { label: string; petunjuk?: string };

/** Input 48px, teks 16px (iOS tidak zoom), label di atas. */
export function Kolom({ label, petunjuk, className = "", ...props }: PropsKolom) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="title-4">
        {label}
      </label>
      <input
        id={id}
        aria-describedby={petunjuk ? `${id}-p` : undefined}
        className={`body-5 h-12 w-full rounded-lg border border-border bg-surface px-4 text-text placeholder:text-text-muted ${className}`}
        {...props}
      />
      {petunjuk && (
        <p id={`${id}-p`} className="caption-4 text-text-muted">
          {petunjuk}
        </p>
      )}
    </div>
  );
}

export function KolomSandi({ label = "Kata sandi", ...props }: Omit<PropsKolom, "type" | "label"> & { label?: string }) {
  const id = useId();
  const [lihat, setLihat] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="title-4">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={lihat ? "text" : "password"}
          className="body-5 h-12 w-full rounded-lg border border-border bg-surface pr-12 pl-4 text-text"
          {...props}
        />
        <button
          type="button"
          onClick={() => setLihat((v) => !v)}
          aria-label={lihat ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          aria-pressed={lihat}
          className="absolute top-0.5 right-0.5 flex size-11 items-center justify-center rounded-lg text-text-muted hover:bg-surface-muted"
        >
          {lihat ? <EyeSlash size={20} aria-hidden /> : <Eye size={20} aria-hidden />}
        </button>
      </div>
    </div>
  );
}

export function Pesan({ jenis, children }: { jenis: "galat" | "sukses" | "info"; children: ReactNode }) {
  const Ikon = jenis === "galat" ? WarningCircle : jenis === "sukses" ? CheckCircle : Info;
  const warna = jenis === "galat" ? "text-danger" : jenis === "sukses" ? "text-success" : "text-text-muted";
  return (
    <p role={jenis === "galat" ? "alert" : "status"} className="body-6 flex items-start gap-2">
      <Ikon size={20} weight={jenis === "info" ? "regular" : "fill"} className={`mt-px shrink-0 ${warna}`} aria-hidden />
      <span>{children}</span>
    </p>
  );
}

export function TombolGoogle({ onClick, memuat }: { onClick: () => void; memuat: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={memuat} className={tombolSekunder}>
      <GoogleLogo size={20} weight="bold" aria-hidden />
      {memuat ? "Menghubungkan ke Google…" : "Masuk dengan Google"}
    </button>
  );
}

export function Pemisah() {
  return (
    <div className="caption-4 flex items-center gap-3 text-text-muted" aria-hidden>
      <span className="h-px flex-1 bg-border" />
      atau
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function Kerangka({ tinggi = "h-48" }: { tinggi?: string }) {
  return <div className={`${tinggi} animate-pulse rounded-xl border border-border bg-surface`} aria-hidden />;
}

/** Tujuan setelah login dari `?lanjut=`; hanya jalur internal. */
export function tujuanAman(lanjut: string | null, cadangan = "/try-out") {
  return lanjut && lanjut.startsWith("/") && !lanjut.startsWith("//") && !lanjut.startsWith("/\\") ? lanjut : cadangan;
}
