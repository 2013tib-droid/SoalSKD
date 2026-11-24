"use client";

import { ArrowClockwise, ArrowSquareOut, CheckCircle, Clock, Info, Prohibit, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { pesanGalat, useAkun, type Pembelian, type StatusPembelian } from "./auth";
import { Pesan, tombolSekunder, tombolUtama } from "./ui";
import { PRODUK } from "@/config/produk";

const chip = "caption-4 inline-flex items-center gap-1 rounded-full px-2 py-0.5";

/** Label + gaya status. "Diverifikasi" = sedang ditanyakan ke server (bukan status tersimpan). */
const LABEL: Record<StatusPembelian | "diverifikasi", { teks: string; kelas: string; Ikon: typeof Clock }> = {
  membuat: { teks: "Menyiapkan pembayaran", kelas: "border border-border text-text-muted", Ikon: Clock },
  menunggu: { teks: "Menunggu pembayaran", kelas: "border border-border text-text-muted", Ikon: Clock },
  diverifikasi: { teks: "Pembayaran sedang diverifikasi", kelas: "bg-primary/10 text-primary", Ikon: ArrowClockwise },
  aktif: { teks: "Paket aktif", kelas: "bg-success/10 text-success", Ikon: CheckCircle },
  kedaluwarsa: { teks: "Pembayaran kedaluwarsa", kelas: "border border-border text-text-muted", Ikon: Clock },
  gagal: { teks: "Pembayaran gagal diverifikasi", kelas: "bg-danger/10 text-danger", Ikon: WarningCircle },
  dicabut: { teks: "Akses dicabut", kelas: "border border-border text-text-muted", Ikon: Prohibit },
};

export function ChipStatus({ status }: { status: StatusPembelian | "diverifikasi" }) {
  const { teks, kelas, Ikon } = LABEL[status];
  return (
    <span className={`${chip} ${kelas}`}>
      <Ikon size={12} weight="bold" aria-hidden />
      {teks}
    </span>
  );
}

const rupiah = (n: number) => `Rp${n.toLocaleString("id-ID")}`;
const tanggal = (ms: number | null) =>
  ms ? new Date(ms).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

/** Jeda tombol cek (sama dengan rem server 5 detik). */
const JEDA_CEK_MS = 5000;

/**
 * Satu pesanan dengan statusnya dan tombol "Cek Status Pembayaran".
 * `otomatis`: langsung cek sekali saat tampil (pembeli baru kembali dari Mayar).
 * Status hanya berubah dari jawaban server; kembali dari Mayar saja tidak membuka apa pun.
 */
export function KartuPembelian({
  awal,
  otomatis = false,
  sorot = false,
  onAktif,
}: {
  awal: Pembelian;
  otomatis?: boolean;
  sorot?: boolean;
  onAktif?: () => void;
}) {
  const akun = useAkun();
  const [p, setP] = useState(awal);
  const [memeriksa, setMemeriksa] = useState(false);
  const [jeda, setJeda] = useState(false);
  const [kabar, setKabar] = useState<{ jenis: "galat" | "info" | "sukses"; teks: string } | null>(null);
  const sudahOtomatis = useRef(false);
  const { cekPembayaran } = akun;

  const cek = useCallback(async () => {
    setMemeriksa(true);
    setKabar(null);
    try {
      const baru = await cekPembayaran(p.orderId);
      // Field yang tidak dikirim server (0/null/kosong) tidak menimpa yang sudah tampil.
      setP((lama) => ({
        ...lama,
        ...baru,
        judul: baru.judul || lama.judul,
        amount: baru.amount || lama.amount,
        createdAt: baru.createdAt ?? lama.createdAt,
      }));
      // Status "aktif" sudah punya pesan suksesnya sendiri di kartu.
      if (baru.status === "aktif") {
        onAktif?.();
      } else if (baru.status === "menunggu") {
        setKabar({
          jenis: "info",
          teks: "Pembayaran belum tercatat lunas di Mayar. Sudah bayar? Biasanya beberapa detik sampai beberapa menit. Jangan membayar ulang; cek lagi sebentar.",
        });
      }
    } catch (err) {
      setKabar({ jenis: "galat", teks: pesanGalat(err, "Status belum bisa diperiksa. Coba lagi sebentar lagi.") });
    } finally {
      setMemeriksa(false);
      setJeda(true);
      setTimeout(() => setJeda(false), JEDA_CEK_MS);
    }
  }, [cekPembayaran, onAktif, p.orderId]);

  useEffect(() => {
    if (!otomatis || sudahOtomatis.current || (p.status !== "menunggu" && p.status !== "membuat")) return;
    sudahOtomatis.current = true;
    void cek();
  }, [otomatis, p.status, cek]);

  const status: StatusPembelian | "diverifikasi" = memeriksa ? "diverifikasi" : p.status;
  const bisaCek = p.status === "menunggu" || p.status === "membuat";
  const produk = PRODUK[p.produk];

  return (
    <li className={`flex flex-col gap-3 rounded-xl border bg-surface p-4 ${sorot ? "border-primary" : "border-border"}`}>
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="title-3">{produk?.nama ?? p.judul}</h3>
          <ChipStatus status={status} />
        </div>
        <p className="caption-4 text-text-muted">
          <span className="mono-number">{rupiah(p.amount)}</span> · {tanggal(p.createdAt)} · No. pesanan{" "}
          <span className="mono-number break-all">{p.orderId}</span>
        </p>
      </div>

      {p.status === "aktif" && (
        <Pesan jenis="sukses">
          Pembayaran berhasil dan paket aktif: {produk?.labelPaket ?? "paket bundel ini"}.
        </Pesan>
      )}
      {p.status === "aktif" && p.emailBeda && (
        <Pesan jenis="info">
          Email pembayaran{p.emailPembayaran ? ` (${p.emailPembayaran})` : ""} berbeda dengan email akun ini. Tidak masalah: paket
          tetap aktif di akun ini karena pesanannya dibuat dari akun ini.
        </Pesan>
      )}
      {p.status === "menunggu" && p.perluTinjau && (
        <Pesan jenis="info">Status dari Mayar belum bisa dipastikan otomatis. Kami memeriksanya manual; jangan membayar ulang.</Pesan>
      )}
      {p.status === "kedaluwarsa" && (
        <Pesan jenis="info">Batas waktu bayar sudah lewat dan tagihan ini tidak ditagih lagi. Buat pembayaran baru kalau masih ingin membeli.</Pesan>
      )}
      {p.status === "gagal" && (
        <Pesan jenis="galat">
          Pembayaran ini tidak cocok dengan pesanan (misalnya nominal berbeda), jadi tidak diaktifkan otomatis. Jangan membayar
          ulang; hubungi kami dengan nomor pesanan di atas.
        </Pesan>
      )}
      {p.status === "dicabut" && <Pesan jenis="info">Akses dari pesanan ini dicabut (misalnya karena dana dikembalikan).</Pesan>}
      {kabar && <Pesan jenis={kabar.jenis}>{kabar.teks}</Pesan>}

      <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2">
        {p.status === "menunggu" && p.link && (
          <a href={p.link} rel="noopener" className={tombolUtama}>
            <ArrowSquareOut size={20} aria-hidden />
            Lanjutkan pembayaran
          </a>
        )}
        {bisaCek && (
          <button type="button" onClick={cek} disabled={memeriksa || jeda} aria-busy={memeriksa} className={tombolSekunder}>
            <ArrowClockwise size={20} aria-hidden />
            {memeriksa ? "Memeriksa…" : "Cek Status Pembayaran"}
          </button>
        )}
        {p.status === "aktif" && (
          <Link href="/try-out" className={tombolUtama}>
            Mulai try out
          </Link>
        )}
        {p.status === "kedaluwarsa" && (
          <Link href={`/beli?produk=${p.produk}`} className={tombolSekunder}>
            Buat pembayaran baru
          </Link>
        )}
      </div>
    </li>
  );
}

/** Ringkasan kecil "apa yang terjadi setelah bayar" (dipakai di /beli). */
export function LangkahBayar() {
  return (
    <ol className="flex flex-col gap-2">
      {[
        "Bayar di halaman Mayar (QRIS atau e-wallet).",
        "Kembali ke SoalSKD. Server memeriksa pembayaranmu langsung ke Mayar.",
        "Paket aktif otomatis di akun ini. Tanpa kode, tanpa menunggu email.",
      ].map((t, i) => (
        <li key={t} className="body-6 flex items-start gap-3">
          <span aria-hidden className="caption-4 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-primary">
            {i + 1}
          </span>
          <span>
            <span className="sr-only">Langkah {i + 1}: </span>
            {t}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function CatatanAman() {
  return (
    <p className="caption-4 flex items-start gap-2 text-text-muted">
      <Info size={16} className="mt-px shrink-0" aria-hidden />
      Paket dibuka hanya setelah server memastikan pembayaran ke Mayar, bukan dari halaman sukses di browser.
    </p>
  );
}
