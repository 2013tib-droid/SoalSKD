"use client";

import { DownloadSimple, FilePdf } from "@phosphor-icons/react";
import { useState } from "react";
import { pesanGalat, useAkun } from "@/components/akun/auth";
import { Pesan, tombolSekunder } from "@/components/akun/ui";
import { BUILD_STATIK } from "@/config/build";
import { EBOOK_EDISI, edisiMilik, type IdEdisi } from "@/config/akses";
import { PRODUK } from "@/config/produk";

type Kabar = { jenis: "galat" | "info"; teks: string } | null;

/**
 * Kartu unduh ebook PDF di /try-out, satu kartu per edisi yang dimiliki akun
 * (Edisi 1 untuk Bundel 1, Edisi 2 untuk Bundel 2). Build statis dan login mati tidak
 * merender apa pun. Tautan diminta saat tombol diketuk (signed URL ±10 menit dari
 * `unduhEbook`, hak edisi dicek server), tidak pernah ditanam di halaman.
 */
export function KartuEbook() {
  const akun = useAkun();
  if (BUILD_STATIK || akun.status !== "masuk") return null;
  return edisiMilik(akun.paket).map((e) => <KartuSatuEdisi key={e} edisi={e} />);
}

function KartuSatuEdisi({ edisi }: { edisi: IdEdisi }) {
  const akun = useAkun();
  const [memuat, setMemuat] = useState(false);
  const [kabar, setKabar] = useState<Kabar>(null);
  const ebook = EBOOK_EDISI[edisi];

  const unduh = async () => {
    setMemuat(true);
    setKabar(null);
    try {
      const { url } = await akun.unduhEbook(edisi);
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
          <h3 className="title-3">{ebook.judul}</h3>
          <p className="body-6 text-text-muted">
            Soal, kunci, dan pembahasan {PRODUK[ebook.produk].labelPaket} dalam satu file.
          </p>
        </div>
      </div>
      {kabar && <Pesan jenis={kabar.jenis}>{kabar.teks}</Pesan>}
      <button type="button" onClick={unduh} disabled={memuat} aria-busy={memuat} className={tombolSekunder}>
        <DownloadSimple size={20} aria-hidden />
        {memuat ? "Menyiapkan unduhan…" : `Unduh ${ebook.judul}`}
      </button>
    </li>
  );
}
