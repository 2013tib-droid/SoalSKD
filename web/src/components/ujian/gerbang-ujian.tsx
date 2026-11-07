"use client";

import { LockKey } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { UjianBerbayar } from "@/app/ujian/[paket]/actions";
import { useAkun } from "@/components/akun/auth";
import { Kartu, Kerangka, LayarAkun, Pesan, tombolSekunder, tombolUtama } from "@/components/akun/ui";
import { muatUjianBerbayar } from "@/lib/gerbang";
import { LayarUjian } from "./layar-ujian";

type Keadaan = { status: "memuat" } | { status: "gagal" } | UjianBerbayar;

/**
 * Paket berbayar: soal baru diminta dari server setelah login, dan server
 * (bukan halaman ini) yang memutuskan boleh atau tidak.
 */
export function GerbangUjian({ paket, judul }: { paket: string; judul: string }) {
  const akun = useAkun({ wajib: true });
  const [k, setK] = useState<Keadaan>({ status: "memuat" });
  const { status, ambilToken } = akun;
  const uid = akun.pengguna?.uid;
  const milik = akun.paket?.includes(paket) ?? false;

  const muat = useCallback(async () => {
    if (status === "memuat") return;
    if (status === "mati") return setK({ status: "belum-dibuka" });
    if (status === "keluar") return setK({ status: "perlu-masuk" });
    setK({ status: "memuat" });
    try {
      setK(await muatUjianBerbayar(paket, await ambilToken()));
    } catch {
      setK({ status: "gagal" });
    }
    // `milik` ikut supaya soal dimuat ulang setelah kode diaktifkan.
  }, [status, uid, milik, paket, ambilToken]);

  useEffect(() => {
    void muat();
  }, [muat]);

  if (k.status === "ok")
    return (
      <LayarUjian
        paket={paket}
        soal={k.soal}
        durasiMenit={k.durasiMenit}
        peringatanMenit={k.peringatanMenit}
        kritisMenit={k.kritisMenit}
      />
    );

  const lanjut = encodeURIComponent(`/ujian/${paket}`);
  return (
    <LayarAkun judul={judul} kembali={{ href: "/try-out", label: "Daftar try out" }}>
      {k.status === "memuat" ? (
        <>
          <p className="sr-only" role="status">
            Memeriksa akses…
          </p>
          <Kerangka />
        </>
      ) : k.status === "gagal" ? (
        <Kartu>
          <Pesan jenis="galat">Soal gagal dimuat. Periksa koneksi lalu coba lagi.</Pesan>
          <button type="button" onClick={() => void muat()} className={tombolSekunder}>
            Coba lagi
          </button>
        </Kartu>
      ) : k.status === "tidak-ada" ? (
        <Kartu>
          <Pesan jenis="info">Paket ini belum tersedia.</Pesan>
          <Link href="/try-out" className={tombolSekunder}>
            Ke daftar try out
          </Link>
        </Kartu>
      ) : (
        <Kartu>
          <div className="flex items-start gap-3">
            <LockKey size={24} className="shrink-0 text-text-muted" aria-hidden />
            <p className="body-6">
              {k.status === "perlu-masuk"
                ? "Paket ini untuk pembeli. Masuk dengan akun yang dipakai saat aktivasi."
                : k.status === "belum-punya"
                  ? "Akunmu belum punya akses ke paket ini. Masukkan kode aktivasi dari email pembelian."
                  : "Paket ini belum dibuka. Sementara itu, coba paket gratis dulu."}
            </p>
          </div>
          {k.status === "perlu-masuk" && (
            <Link href={`/masuk?lanjut=${lanjut}`} className={tombolUtama}>
              Masuk
            </Link>
          )}
          {k.status === "belum-punya" && (
            <Link href={`/aktivasi?lanjut=${lanjut}`} className={tombolUtama}>
              Masukkan kode aktivasi
            </Link>
          )}
          <Link href="/#harga" className={tombolSekunder}>
            Lihat penawaran
          </Link>
        </Kartu>
      )}
    </LayarAkun>
  );
}
