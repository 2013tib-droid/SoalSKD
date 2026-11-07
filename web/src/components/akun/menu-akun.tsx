"use client";

import { Key, SignOut, UserCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { BUILD_STATIK } from "@/config/build";
import { useAkun } from "./auth";

const itemMenu =
  "title-4 flex h-11 w-full items-center gap-2 rounded-lg px-3 text-left text-text hover:bg-surface-muted disabled:opacity-60";

/**
 * Tombol "Masuk" (belum login) atau ikon akun dengan menu: email, Aktivasi kode, Keluar.
 * Login mati: tidak tampil di server tanpa env Firebase; di build statis tampil sebagai pratinjau.
 */
export function MenuAkun() {
  const akun = useAkun();
  const path = usePathname();
  const [buka, setBuka] = useState(false);
  const [keluar, setKeluar] = useState(false);
  const wadah = useRef<HTMLDivElement>(null);
  const idMenu = useId();

  // Tutup saat klik di luar atau Esc.
  useEffect(() => {
    if (!buka) return;
    const klik = (e: PointerEvent) => {
      if (!wadah.current?.contains(e.target as Node)) setBuka(false);
    };
    const tombol = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBuka(false);
    };
    document.addEventListener("pointerdown", klik);
    document.addEventListener("keydown", tombol);
    return () => {
      document.removeEventListener("pointerdown", klik);
      document.removeEventListener("keydown", tombol);
    };
  }, [buka]);

  // Build statis (dev GitHub Pages): tombol tetap tampil sebagai pratinjau posisi; /masuk menjelaskan
  // bahwa login baru aktif di situs pembeli. Server tanpa env Firebase: tidak tampil.
  if (akun.status === "mati" && !BUILD_STATIK) return null;
  if (akun.status === "memuat") return <span className="block h-10 w-16 rounded-lg bg-surface-muted" aria-hidden />;
  if (akun.status === "keluar" || akun.status === "mati")
    return (
      <Link
        href={path && path !== "/" ? `/masuk?lanjut=${encodeURIComponent(path)}` : "/masuk"}
        className="title-4 flex h-10 items-center rounded-lg px-3 whitespace-nowrap text-text transition-colors duration-300 ease-[var(--ease-out-house)] hover:bg-surface-muted"
      >
        Masuk
      </Link>
    );

  return (
    <div ref={wadah} className="relative">
      <button
        type="button"
        onClick={() => setBuka((v) => !v)}
        aria-expanded={buka}
        aria-controls={idMenu}
        aria-label="Akun"
        className="flex size-11 items-center justify-center rounded-lg text-text hover:bg-surface-muted"
      >
        <UserCircle size={24} aria-hidden />
      </button>
      {buka && (
        <div
          id={idMenu}
          className="absolute top-full right-0 z-50 mt-2 flex w-64 flex-col gap-1 rounded-xl border border-border bg-surface p-2"
        >
          <p className="caption-4 truncate px-3 py-2 text-text-muted">{akun.pengguna?.email ?? "Akun Google"}</p>
          <Link href="/aktivasi" onClick={() => setBuka(false)} className={itemMenu}>
            <Key size={20} aria-hidden />
            Aktivasi kode
          </Link>
          <button
            type="button"
            disabled={keluar}
            onClick={async () => {
              setKeluar(true);
              try {
                await akun.keluar();
              } finally {
                setKeluar(false);
                setBuka(false);
              }
            }}
            className={itemMenu}
          >
            <SignOut size={20} aria-hidden />
            {keluar ? "Keluar…" : "Keluar"}
          </button>
        </div>
      )}
    </div>
  );
}
