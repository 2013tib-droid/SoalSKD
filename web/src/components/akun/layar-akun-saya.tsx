"use client";

import { Play, ShoppingBag } from "@phosphor-icons/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { dibatalkan, pesanGalat, useAkun, type Pembelian } from "./auth";
import { KartuPembelian } from "./status-pembelian";
import { Kartu, Kerangka, LayarAkun, Pemisah, Pesan, tautanTeks, TombolGoogle, tombolSekunder, tombolUtama } from "./ui";
import { tombolSekunder as tombolSekunderRingkas } from "@/components/tombol";
import { KartuEbook } from "@/components/beranda/kartu-ebook";
import { bacaRekaman } from "@/components/ujian/use-ujian";
import { EMAIL_KONTAK, WA_KONTAK } from "@/config/legal";

export type PaketRingkas = { id: string; judul: string; gratis: boolean };

const JUDUL = "Akun & pembelian";

function Bagian({ id, judul, children }: { id: string; judul: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`judul-${id}`} id={id} className="flex scroll-mt-6 flex-col gap-3">
      <h2 id={`judul-${id}`} className="title-3">
        {judul}
      </h2>
      {children}
    </section>
  );
}

/** Ujian yang belum dikumpulkan dan waktunya belum habis (tersimpan di perangkat ini). */
function useLanjutkan(paket: PaketRingkas[]) {
  const [isi, setIsi] = useState<PaketRingkas[] | null>(null);
  useEffect(() => {
    setIsi(
      paket.filter((p) => {
        const r = bacaRekaman(p.id);
        return r !== null && !r.selesai && r.berakhirPada > Date.now();
      }),
    );
  }, [paket]);
  return isi;
}

export function LayarAkunSaya({ paket }: { paket: PaketRingkas[] }) {
  const akun = useAkun({ wajib: true });
  const params = useSearchParams();
  const pesananBaru = params.get("pesanan");
  const [pembelian, setPembelian] = useState<Pembelian[] | null>(null);
  const [galatMuat, setGalatMuat] = useState<string | null>(null);
  const [proses, setProses] = useState(false);
  const [kabar, setKabar] = useState<string | null>(null);
  const lanjutkan = useLanjutkan(paket);
  const { status, muatPembelian } = akun;
  const uid = akun.pengguna?.uid;

  const muat = useCallback(() => {
    setGalatMuat(null);
    muatPembelian()
      .then(setPembelian)
      .catch((e) => {
        setPembelian([]);
        setGalatMuat(pesanGalat(e, "Riwayat pembelian belum bisa dimuat."));
      });
  }, [muatPembelian]);

  useEffect(() => {
    if (status === "masuk" && uid) muat();
  }, [status, uid, muat]);

  if (status === "memuat" || (status === "masuk" && akun.paket === null))
    return (
      <LayarAkun judul={JUDUL} kembali={{ href: "/try-out", label: "Try out" }}>
        <p className="sr-only" role="status">
          Memuat…
        </p>
        <Kerangka />
      </LayarAkun>
    );

  if (status === "keluar" || status === "mati") {
    const lanjut = `/akun${pesananBaru ? `?pesanan=${encodeURIComponent(pesananBaru)}` : ""}`;
    return (
      <LayarAkun judul={JUDUL} kembali={{ href: "/try-out", label: "Try out" }}>
        <Kartu>
          <p className="body-6">
            {pesananBaru
              ? "Masuk dengan akun yang dipakai saat membeli untuk melihat status pembayaranmu."
              : "Masuk untuk melihat paket, status pembelian, dan ebook milikmu."}
          </p>
          {kabar && <Pesan jenis="galat">{kabar}</Pesan>}
          <TombolGoogle
            memuat={proses}
            onClick={async () => {
              setKabar(null);
              setProses(true);
              try {
                await akun.masukGoogle();
              } catch (e) {
                if (!dibatalkan(e)) setKabar(pesanGalat(e));
              }
              setProses(false);
            }}
          />
          <Pemisah />
          <Link href={`/masuk?lanjut=${encodeURIComponent(lanjut)}`} className={tombolSekunder}>
            Masuk dengan email
          </Link>
        </Kartu>
        <Bantuan />
      </LayarAkun>
    );
  }

  const milik = new Set(akun.paket ?? []);
  const paketSaya = paket.filter((p) => p.gratis || milik.has(p.id));
  const disorot = pembelian?.find((p) => p.orderId === pesananBaru);
  const lainnya = (pembelian ?? []).filter((p) => p.orderId !== pesananBaru);

  return (
    <LayarAkun
      judul={JUDUL}
      keterangan={<span className="break-all">{akun.pengguna?.email}</span>}
      kembali={{ href: "/try-out", label: "Try out" }}
    >
      {pesananBaru && (
        <Bagian id="status" judul="Status pembayaran">
          {pembelian === null ? (
            <Kerangka tinggi="h-32" />
          ) : disorot ? (
            <ul className="flex flex-col gap-3">
              <KartuPembelian awal={disorot} otomatis sorot />
            </ul>
          ) : (
            <Kartu>
              <Pesan jenis="info">
                Pesanan ini tidak ada di akun {akun.pengguna?.email}. Masuk dengan akun yang dipakai saat menekan Bayar.
              </Pesan>
            </Kartu>
          )}
        </Bagian>
      )}

      <Bagian id="paket" judul="Paket saya">
        <ul className="flex flex-col gap-2">
          {paketSaya.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
              <span className="flex flex-col">
                <span className="title-4">{p.judul}</span>
                <span className="caption-4 text-text-muted">{p.gratis ? "Gratis" : "Dibeli"}</span>
              </span>
              <Link href={`/ujian/${p.id}`} className={`${tombolSekunderRingkas} shrink-0`}>
                <Play size={16} weight="fill" aria-hidden />
                Buka
              </Link>
            </li>
          ))}
        </ul>
        {paketSaya.every((p) => p.gratis) && (
          <Link href="/#harga" className={tombolSekunder}>
            <ShoppingBag size={20} aria-hidden />
            Lihat bundel berbayar
          </Link>
        )}
      </Bagian>

      <Bagian id="lanjutkan" judul="Lanjutkan try out">
        {lanjutkan === null ? null : lanjutkan.length === 0 ? (
          <p className="body-6 text-text-muted">Tidak ada ujian yang sedang berjalan di perangkat ini.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {lanjutkan.map((p) => (
              <li key={p.id}>
                <Link href={`/ujian/${p.id}`} className={tombolUtama}>
                  <Play size={20} weight="fill" aria-hidden />
                  Lanjutkan {p.judul}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link href="/try-out" className={tombolSekunder}>
          Ke daftar try out
        </Link>
      </Bagian>

      {process.env.STATIK !== "1" && (
        <Bagian id="ebook" judul="Ebook">
          {akun.paket?.some((p) => !paket.find((x) => x.id === p)?.gratis) ? (
            <ul className="flex flex-col gap-3">
              <KartuEbook />
            </ul>
          ) : (
            <p className="body-6 text-text-muted">Ebook PDF muncul di sini setelah bundel aktif di akunmu.</p>
          )}
        </Bagian>
      )}

      <Bagian id="pembelian" judul="Riwayat pembelian">
        {galatMuat && <Pesan jenis="galat">{galatMuat}</Pesan>}
        {pembelian === null ? (
          <Kerangka tinggi="h-24" />
        ) : lainnya.length === 0 && !disorot ? (
          <p className="body-6 text-text-muted">Belum ada pembelian di akun ini.</p>
        ) : lainnya.length === 0 ? null : (
          <ul className="flex flex-col gap-3">
            {lainnya.map((p) => (
              <KartuPembelian key={p.orderId} awal={p} />
            ))}
          </ul>
        )}
      </Bagian>

      <Bantuan />

      <p className="body-6 text-text-muted">
        <button type="button" onClick={() => void akun.keluar()} className={tautanTeks}>
          Keluar
        </button>
      </p>
    </LayarAkun>
  );
}

const TANYA: { t: string; j: React.ReactNode }[] = [
  {
    t: "Sudah bayar, tapi paket belum aktif?",
    j: "Tekan Cek Status Pembayaran pada pesananmu. Verifikasi ke Mayar biasanya beberapa detik sampai beberapa menit. Jangan membayar ulang. Kalau lebih dari 1 jam masih menunggu, hubungi kami dengan nomor pesanan.",
  },
  {
    t: "Salah mengisi email di halaman pembayaran?",
    j: "Tidak masalah. Paket terikat ke akun yang menekan Bayar, bukan ke email yang diisi di Mayar.",
  },
  {
    t: "Pembayaran tidak muncul di riwayat?",
    j: "Pastikan kamu masuk dengan akun yang sama saat membeli. Kalau kamu membayar lewat tautan lain, hubungi kami dari email yang dipakai saat membayar. Kami mencocokkannya dengan catatan Mayar; akses tidak diberikan hanya dari screenshot atau nomor transaksi.",
  },
  {
    t: "Pembayaran kedaluwarsa?",
    j: "Tagihan yang kedaluwarsa tidak ditagih lagi. Buat pembayaran baru dari pesanan tersebut atau dari halaman harga.",
  },
  {
    t: "Punya kode hadiah atau kompensasi?",
    j: (
      <>
        Tukar di{" "}
        <Link href="/aktivasi" className={tautanTeks}>
          halaman Tukar kode
        </Link>
        .
      </>
    ),
  },
  {
    t: "Pengembalian dana",
    j: (
      <>
        Lihat{" "}
        <Link href="/syarat#pengembalian-dana" className={tautanTeks}>
          Syarat &amp; pengembalian dana
        </Link>
        .
      </>
    ),
  },
];

function Bantuan() {
  return (
    <Bagian id="bantuan" judul="Bantuan pembelian">
      <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-surface">
        {TANYA.map((x) => (
          <details key={x.t} className="group px-4">
            <summary className="title-4 flex min-h-12 cursor-pointer items-center py-3">{x.t}</summary>
            <p className="body-6 pb-4 text-text-muted">{x.j}</p>
          </details>
        ))}
      </div>
      {(EMAIL_KONTAK || WA_KONTAK) && (
        <p className="body-6 text-text-muted">
          Kontak:{" "}
          {EMAIL_KONTAK && (
            <a href={`mailto:${EMAIL_KONTAK}`} className={tautanTeks}>
              {EMAIL_KONTAK}
            </a>
          )}
          {EMAIL_KONTAK && WA_KONTAK && " · "}
          {WA_KONTAK && (
            <a href={`https://wa.me/${WA_KONTAK}`} rel="noopener" className={tautanTeks}>
              WhatsApp
            </a>
          )}
        </p>
      )}
    </Bagian>
  );
}
