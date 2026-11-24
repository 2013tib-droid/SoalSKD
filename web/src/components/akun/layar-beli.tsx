"use client";

import { CheckCircle, ShoppingBag } from "@phosphor-icons/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { dibatalkan, pesanGalat, useAkun } from "./auth";
import { CatatanAman, LangkahBayar } from "./status-pembelian";
import { Kartu, Kerangka, LayarAkun, Pemisah, Pesan, tautanTeks, TombolGoogle, tombolSekunder, tombolUtama } from "./ui";
import { penawaranUntuk, PENJUALAN_DIBUKA } from "@/config/landing";
import { DAFTAR_PRODUK, PRODUK, type IdProduk } from "@/config/produk";

const JUDUL = "Beli bundel";

function bacaProduk(v: string | null): IdProduk | null {
  return v && (DAFTAR_PRODUK as string[]).includes(v) ? (v as IdProduk) : null;
}

/**
 * Checkout: wajib login (Google diutamakan, email+sandi harus terverifikasi), lalu server
 * membuat tagihan Mayar yang terikat ke akun ini. Harga dan akun ditentukan server.
 */
export function LayarBeli() {
  const akun = useAkun({ wajib: true });
  const params = useSearchParams();
  const produk = bacaProduk(params.get("produk"));
  const [proses, setProses] = useState<"bayar" | "google" | "cek" | "kirim" | null>(null);
  const [kabar, setKabar] = useState<{ jenis: "galat" | "sukses" | "info"; teks: string } | null>(null);

  const tawar = produk ? penawaranUntuk(produk) : undefined;
  if (!produk || !tawar || !PENJUALAN_DIBUKA[produk])
    return (
      <LayarAkun judul={JUDUL} kembali={{ href: "/#harga", label: "Penawaran" }}>
        <Kartu>
          <Pesan jenis="info">Pembelian bundel ini belum dibuka.</Pesan>
          <Link href="/#harga" className={tombolSekunder}>
            Lihat penawaran
          </Link>
        </Kartu>
      </LayarAkun>
    );

  const lanjut = `/beli?produk=${produk}`;
  const info = PRODUK[produk];

  const ringkasan = (
    <Kartu aksen>
      <div className="flex flex-col gap-1">
        <h2 className="title-3">{tawar.nama}</h2>
        <p className="heading-5 mono-number">{tawar.harga}</p>
      </div>
      <ul className="flex flex-col gap-2">
        {tawar.isi.map((i) => (
          <li key={i.judul} className="body-6 flex items-start gap-2">
            <CheckCircle size={20} weight="fill" className="mt-px shrink-0 text-primary" aria-hidden />
            <span>
              <span className="title-4">{i.judul}</span>
              <span className="text-text-muted"> · {i.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </Kartu>
  );

  if (akun.status === "memuat" || (akun.status === "masuk" && akun.paket === null))
    return (
      <LayarAkun judul={JUDUL} kembali={{ href: "/#harga", label: "Penawaran" }}>
        <p className="sr-only" role="status">
          Memuat…
        </p>
        {ringkasan}
        <Kerangka tinggi="h-40" />
      </LayarAkun>
    );

  const google = async () => {
    setKabar(null);
    setProses("google");
    try {
      await akun.masukGoogle();
    } catch (err) {
      if (!dibatalkan(err)) setKabar({ jenis: "galat", teks: pesanGalat(err) });
    }
    setProses(null);
  };

  if (akun.status === "keluar" || akun.status === "mati")
    return (
      <LayarAkun judul={JUDUL} kembali={{ href: "/#harga", label: "Penawaran" }}>
        {ringkasan}
        <Kartu>
          <div className="flex flex-col gap-1">
            <h2 className="title-3">Masuk dulu</h2>
            <p className="body-6 text-text-muted">Paket yang kamu beli tersimpan di akun ini dan terbuka di HP mana pun.</p>
          </div>
          {kabar && <Pesan jenis={kabar.jenis}>{kabar.teks}</Pesan>}
          <TombolGoogle onClick={google} memuat={proses === "google"} />
          <Pemisah />
          <Link href={`/masuk?lanjut=${encodeURIComponent(lanjut)}`} className={tombolSekunder}>
            Masuk dengan email
          </Link>
          <p className="body-6 text-text-muted">
            Belum punya akun?{" "}
            <Link href={`/daftar?lanjut=${encodeURIComponent(lanjut)}`} className={tautanTeks}>
              Daftar
            </Link>
          </p>
        </Kartu>
      </LayarAkun>
    );

  const sudahPunya = info.paket.every((p) => (akun.paket ?? []).includes(p));
  if (sudahPunya)
    return (
      <LayarAkun judul={JUDUL} kembali={{ href: "/try-out", label: "Try out" }}>
        <Kartu aksen>
          <Pesan jenis="sukses">{tawar.nama} sudah aktif di akunmu.</Pesan>
          <Link href="/try-out" className={tombolUtama}>
            Mulai try out
          </Link>
          <Link href="/akun" className={tombolSekunder}>
            Lihat akun &amp; pembelian
          </Link>
        </Kartu>
      </LayarAkun>
    );

  if (akun.pengguna?.perluVerifikasi) {
    const cekVerifikasi = async () => {
      setKabar(null);
      setProses("cek");
      try {
        if (!(await akun.cekVerifikasi()))
          setKabar({ jenis: "galat", teks: "Email belum terverifikasi. Buka tautan di email, cek juga folder spam." });
      } catch (err) {
        setKabar({ jenis: "galat", teks: pesanGalat(err) });
      }
      setProses(null);
    };
    const kirimUlang = async () => {
      setKabar(null);
      setProses("kirim");
      try {
        await akun.kirimVerifikasi();
        setKabar({ jenis: "sukses", teks: `Tautan verifikasi dikirim ulang ke ${akun.pengguna?.email ?? "emailmu"}.` });
      } catch (err) {
        setKabar({ jenis: "galat", teks: pesanGalat(err) });
      }
      setProses(null);
    };
    return (
      <LayarAkun judul={JUDUL} kembali={{ href: "/#harga", label: "Penawaran" }}>
        {ringkasan}
        <Kartu>
          <h2 className="title-3">Verifikasi email dulu</h2>
          <p className="body-6 text-text-muted">
            Kami mengirim tautan verifikasi ke <span className="title-4 break-all text-text">{akun.pengguna.email}</span>. Buka
            tautannya, lalu kembali ke sini. Ini menjaga paketmu tidak hilang karena email salah ketik.
          </p>
          {kabar && <Pesan jenis={kabar.jenis}>{kabar.teks}</Pesan>}
          <button type="button" onClick={cekVerifikasi} disabled={proses !== null} className={tombolUtama}>
            {proses === "cek" ? "Memeriksa…" : "Saya sudah verifikasi"}
          </button>
          <button type="button" onClick={kirimUlang} disabled={proses !== null} className={tombolSekunder}>
            {proses === "kirim" ? "Mengirim…" : "Kirim ulang tautan"}
          </button>
        </Kartu>
      </LayarAkun>
    );
  }

  const bayar = async () => {
    setKabar(null);
    setProses("bayar");
    for (let coba = 0; coba < 3; coba++) {
      try {
        const p = await akun.buatPesanan(produk);
        if (p.status === "menunggu" && p.link) {
          window.location.assign(p.link);
          return; // halaman ditinggalkan; tombol tetap "Membuka Mayar…"
        }
        setKabar({ jenis: "info", teks: "Pesanan ini sudah tidak menunggu pembayaran. Lihat statusnya di halaman Akun." });
        break;
      } catch (err) {
        // Pesanan yang sama sedang disiapkan (mis. tombol ditekan di HP lain): tunggu lalu ulangi.
        if ((err as { code?: string }).code === "functions/aborted" && coba < 2) {
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }
        setKabar({ jenis: "galat", teks: pesanGalat(err, "Pembayaran belum bisa dibuat. Coba lagi sebentar lagi.") });
        break;
      }
    }
    setProses(null);
  };

  return (
    <LayarAkun judul={JUDUL} kembali={{ href: "/#harga", label: "Penawaran" }}>
      {ringkasan}
      <Kartu>
        <LangkahBayar />
        {kabar && <Pesan jenis={kabar.jenis}>{kabar.teks}</Pesan>}
        <button type="button" onClick={bayar} disabled={proses !== null} aria-busy={proses === "bayar"} className={tombolUtama}>
          <ShoppingBag size={20} aria-hidden />
          {proses === "bayar" ? "Membuka Mayar…" : `Bayar ${tawar.harga}`}
        </button>
        <CatatanAman />
      </Kartu>
      <div className="flex flex-col gap-1">
        <p className="body-6 text-text-muted">
          Paket akan aktif di <span className="break-all text-text">{akun.pengguna?.email}</span>. Sudah pernah bayar?{" "}
          <Link href="/akun" className={tautanTeks}>
            Cek status pembelian
          </Link>
        </p>
      </div>
    </LayarAkun>
  );
}
