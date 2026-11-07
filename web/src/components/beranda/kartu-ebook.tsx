"use client";

import { DownloadSimple, FilePdf } from "@phosphor-icons/react";
import { useState } from "react";
import { pesanGalat, useAkun } from "@/components/akun/auth";
import { Pesan, tombolSekunder } from "@/components/akun/ui";
import { BUILD_STATIK } from "@/config/build";
import { punyaEbook } from "@/config/akses";

type Kabar = { jenis: "galat" | "info"; teks: string } | null;

/**
 * Kartu unduh ebook PDF di /try-out. Tampil hanya untuk akun yang memiliki paket
 * bundel; build statis dan login mati tidak merender apa pun. Tautan diminta saat
 * tombol diketuk (signed URL ±10 menit dari `unduhEbook`), tidak pernah ditanam di halaman.
 */
export function KartuEbook() {
  const akun = useAkun();
  const [memuat, setMemuat] = useState(false);
  const [kabar, setKabar] = useState<Kabar>(null);

  if (BUILD_STATIK || akun.status !== "masuk" || !punyaEbook(akun.paket)) return null;

  const unduh = async () => {
    setMemuat(true);
    setKabar(null);
    try {
      const { url } = await akun.unduhEbook();
      // Server memaksa Content-Disposition: attachment, jadi halaman ini tidak ditinggalkan.
      window.location.assign(url);
      setKabar({ jenis: "info", teks: "Unduhan dimulai. Belum muncul? Ketuk tombolnya lagi." });
    } catch (err) {
      setKabar({ jenis: "galat", teks: pesanGalat(err, "Ebook belum bisa diunduh. Coba lagi sebentar lagi.") });
    } finally {
      setMemuat(false);
    }
  };

  return (
    <li className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <FilePdf size={24} className="mt-0.5 shrink-0 text-primary" aria-hidden />
        <div className="flex flex-col gap-1">
          <h3 className="title-3">Ebook PDF</h3>
          <p className="body-6 text-text-muted">Soal, kunci, dan pembahasan paket berbayar dalam satu file.</p>
        </div>
      </div>
      {kabar && <Pesan jenis={kabar.jenis}>{kabar.teks}</Pesan>}
      <button type="button" onClick={unduh} disabled={memuat} aria-busy={memuat} className={tombolSekunder}>
        <DownloadSimple size={20} aria-hidden />
        {memuat ? "Menyiapkan unduhan…" : "Unduh ebook PDF"}
      </button>
    </li>
  );
}
