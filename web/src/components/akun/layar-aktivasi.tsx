"use client";

import { CheckCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { pesanGalat, useAkun } from "./auth";
import { Kartu, Kerangka, Kolom, LayarAkun, Pesan, tautanTeks, tombolSekunder, tombolUtama, tujuanAman } from "./ui";

export type PaketBerbayar = { id: string; judul: string };

const JUDUL = "Aktivasi kode";
const KETERANGAN = "Kode aktivasi dikirim ke email yang kamu isi saat membayar. Satu kode untuk satu akun.";

export function LayarAktivasi({ paketBerbayar }: { paketBerbayar: PaketBerbayar[] }) {
  const akun = useAkun({ wajib: true });
  const params = useSearchParams();
  const tujuan = tujuanAman(params.get("lanjut"));
  const [kode, setKode] = useState("");
  const [proses, setProses] = useState<"tukar" | "cek" | "kirim" | null>(null);
  const [kabar, setKabar] = useState<{ jenis: "galat" | "sukses" | "info"; teks: string } | null>(null);

  if (akun.status === "memuat" || (akun.status === "masuk" && akun.paket === null))
    return (
      <LayarAkun judul={JUDUL} keterangan={KETERANGAN}>
        <p className="sr-only" role="status">
          Memuat…
        </p>
        <Kerangka />
      </LayarAkun>
    );

  if (akun.status === "keluar" || akun.status === "mati")
    return (
      <LayarAkun judul={JUDUL} keterangan={KETERANGAN}>
        <Kartu>
          <p className="body-6">Masuk dulu supaya paket yang kamu beli tersimpan di akunmu.</p>
          <Link href="/masuk?lanjut=/aktivasi" className={tombolUtama}>
            Masuk
          </Link>
          <Link href="/daftar?lanjut=/aktivasi" className={tombolSekunder}>
            Daftar akun baru
          </Link>
        </Kartu>
      </LayarAkun>
    );

  const milik = new Set(akun.paket ?? []);
  const dimiliki = paketBerbayar.filter((p) => milik.has(p.id));
  const semuaAktif = paketBerbayar.length > 0 && dimiliki.length === paketBerbayar.length;

  const tukar = async (e: FormEvent) => {
    e.preventDefault();
    if (!kode.trim()) {
      setKabar({ jenis: "galat", teks: "Isi kode aktivasi dulu." });
      return;
    }
    setKabar(null);
    setProses("tukar");
    try {
      const hasil = await akun.tukarKode(kode);
      setKode("");
      setKabar({ jenis: "sukses", teks: hasil.sudah ? "Kode ini sudah aktif di akunmu." : "Kode berhasil diaktifkan." });
    } catch (err) {
      setKabar({ jenis: "galat", teks: pesanGalat(err) });
    }
    setProses(null);
  };

  const cekVerifikasi = async () => {
    setKabar(null);
    setProses("cek");
    try {
      const ok = await akun.cekVerifikasi();
      if (!ok) setKabar({ jenis: "galat", teks: "Email belum terverifikasi. Buka tautan di email, cek juga folder spam." });
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
    <LayarAkun judul={JUDUL} keterangan={semuaAktif ? undefined : KETERANGAN}>
      {dimiliki.length > 0 && (
        <Kartu aksen>
          <div className="flex items-start gap-3">
            <CheckCircle size={24} weight="fill" className="shrink-0 text-success" aria-hidden />
            <div className="flex flex-col gap-1">
              <h2 className="title-3">{semuaAktif ? "Semua paket sudah aktif" : "Paket aktif di akunmu"}</h2>
              <ul className="body-6 text-text-muted">
                {dimiliki.map((p) => (
                  <li key={p.id}>{p.judul}</li>
                ))}
              </ul>
            </div>
          </div>
          <Link href={tujuan} className={tombolUtama}>
            Mulai try out
          </Link>
        </Kartu>
      )}

      {!semuaAktif &&
        (akun.pengguna?.perluVerifikasi ? (
          <Kartu>
            <h2 className="title-3">Verifikasi email dulu</h2>
            <p className="body-6 text-text-muted">
              Kami mengirim tautan verifikasi ke <span className="title-4 break-all text-text">{akun.pengguna.email}</span>.
              Buka tautannya, lalu kembali ke sini. Ini menjaga paketmu tidak hilang karena email salah ketik.
            </p>
            {kabar && <Pesan jenis={kabar.jenis}>{kabar.teks}</Pesan>}
            <button type="button" onClick={cekVerifikasi} disabled={proses !== null} className={tombolUtama}>
              {proses === "cek" ? "Memeriksa…" : "Saya sudah verifikasi"}
            </button>
            <button type="button" onClick={kirimUlang} disabled={proses !== null} className={tombolSekunder}>
              {proses === "kirim" ? "Mengirim…" : "Kirim ulang tautan"}
            </button>
          </Kartu>
        ) : (
          <Kartu>
            <form onSubmit={tukar} className="flex flex-col gap-4" noValidate>
              <Kolom
                label="Kode aktivasi"
                placeholder="ABC-DEF-GHJ"
                autoComplete="off"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                className="font-mono tracking-widest uppercase"
                value={kode}
                onChange={(e) => setKode(e.target.value)}
              />
              {kabar && <Pesan jenis={kabar.jenis}>{kabar.teks}</Pesan>}
              <button type="submit" disabled={proses !== null} className={tombolUtama}>
                {proses === "tukar" ? "Mengaktifkan…" : "Aktifkan"}
              </button>
            </form>
          </Kartu>
        ))}

      <div className="flex flex-col gap-1">
        {!semuaAktif && (
          <p className="body-6 text-text-muted">
            Belum punya kode?{" "}
            <Link href="/#harga" className={tautanTeks}>
              Lihat penawaran
            </Link>
          </p>
        )}
        <p className="body-6 text-text-muted">
          Masuk sebagai <span className="break-all text-text">{akun.pengguna?.email}</span> ·{" "}
          <button type="button" onClick={() => void akun.keluar()} className={tautanTeks}>
            Keluar
          </button>
        </p>
      </div>
    </LayarAkun>
  );
}
