"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { dibatalkan, pesanGalat, useAkun } from "./auth";
import { KerangkaMasuk } from "./kerangka-masuk";
import {
  Kartu,
  Kerangka,
  Kolom,
  KolomSandi,
  Pemisah,
  Pesan,
  TombolGoogle,
  tautanTeks,
  tombolSekunder,
  tombolUtama,
  tujuanAman,
} from "./ui";

type Mode = "masuk" | "daftar";
type Kabar = { jenis: "galat" | "sukses" | "info"; teks: string } | null;

/** Satu layar untuk /masuk dan /daftar: email + sandi, atau Google. */
export function LayarMasuk({ mode }: { mode: Mode }) {
  const akun = useAkun({ wajib: true });
  const router = useRouter();
  const params = useSearchParams();
  const lanjut = params.get("lanjut");
  const tujuan = tujuanAman(lanjut);
  const qLanjut = lanjut ? `?lanjut=${encodeURIComponent(tujuan)}` : "";

  const [email, setEmail] = useState("");
  const [sandi, setSandi] = useState("");
  const [proses, setProses] = useState<"form" | "google" | "lupa" | null>(null);
  const [kabar, setKabar] = useState<Kabar>(null);
  const [selesai, setSelesai] = useState(false);

  const daftar = mode === "daftar";
  const judul = daftar ? "Buat akun SoalSKD" : "Selamat datang lagi";
  const keterangan = daftar
    ? "Gratis. Akun menyimpan paket yang kamu beli dan jawabanmu di semua perangkat."
    : "Masuk untuk membuka paket yang kamu beli dan melanjutkan ujian di perangkat mana pun.";
  const kerangka = { mode, judul, keterangan, qLanjut };

  const berhasil = () => {
    setSelesai(true);
    router.replace(tujuan);
  };

  const kirim = async (e: FormEvent) => {
    e.preventDefault();
    setKabar(null);
    setProses("form");
    try {
      if (daftar) await akun.daftar(email, sandi);
      else await akun.masuk(email, sandi);
      berhasil();
    } catch (err) {
      setKabar({ jenis: "galat", teks: pesanGalat(err) });
      setProses(null);
    }
  };

  const google = async () => {
    setKabar(null);
    setProses("google");
    try {
      await akun.masukGoogle();
      berhasil();
    } catch (err) {
      setKabar(dibatalkan(err) ? { jenis: "info", teks: "Masuk dengan Google dibatalkan." } : { jenis: "galat", teks: pesanGalat(err) });
      setProses(null);
    }
  };

  const lupa = async () => {
    if (!email.trim()) {
      setKabar({ jenis: "galat", teks: "Isi email dulu, lalu tekan Lupa kata sandi." });
      return;
    }
    setKabar(null);
    setProses("lupa");
    try {
      await akun.lupaSandi(email);
      setKabar({ jenis: "sukses", teks: `Tautan setel ulang dikirim ke ${email.trim()}. Cek juga folder spam.` });
    } catch (err) {
      setKabar({ jenis: "galat", teks: pesanGalat(err) });
    }
    setProses(null);
  };

  // Saat login baru saja berhasil, status sudah "masuk" sebelum pindah halaman: jangan kedipkan kartu "sudah masuk".
  if (akun.status === "memuat" || selesai || (akun.status === "masuk" && proses !== null))
    return (
      <KerangkaMasuk {...kerangka}>
        <p className="sr-only" role="status">
          Memuat…
        </p>
        <Kerangka tinggi="h-80" />
      </KerangkaMasuk>
    );

  if (akun.status === "masuk")
    return (
      <KerangkaMasuk {...kerangka} judul="Kamu sudah masuk" keterangan={undefined} sakelar={false}>
        <Kartu>
          <p className="body-6">
            Masuk sebagai <span className="title-4 break-all">{akun.pengguna?.email}</span>.
          </p>
          <Link href={tujuan} className={tombolUtama}>
            Lanjutkan
          </Link>
          <button type="button" onClick={() => void akun.keluar()} className={tombolSekunder}>
            Keluar
          </button>
        </Kartu>
      </KerangkaMasuk>
    );

  const sibuk = proses !== null;
  const galatGoogle = akun.galatGoogle && !kabar ? { jenis: "galat" as const, teks: akun.galatGoogle } : null;
  const tampil = kabar ?? galatGoogle;

  return (
    <KerangkaMasuk {...kerangka}>
      <Kartu>
        <TombolGoogle onClick={google} memuat={proses === "google"} />
        <Pemisah />
        <form onSubmit={kirim} className="flex flex-col gap-4" noValidate>
          <Kolom
            label="Email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <KolomSandi
            autoComplete={daftar ? "new-password" : "current-password"}
            required
            minLength={6}
            value={sandi}
            onChange={(e) => setSandi(e.target.value)}
          />
          {daftar && <p className="caption-4 -mt-2 text-text-muted">Minimal 6 karakter.</p>}
          {tampil && <Pesan jenis={tampil.jenis}>{tampil.teks}</Pesan>}
          <button type="submit" disabled={sibuk} className={tombolUtama}>
            {proses === "form" ? (daftar ? "Mendaftarkan…" : "Memeriksa…") : daftar ? "Daftar" : "Masuk"}
          </button>
        </form>
        {!daftar && (
          <button type="button" onClick={lupa} disabled={sibuk} className={`${tautanTeks} self-start`}>
            {proses === "lupa" ? "Mengirim tautan…" : "Lupa kata sandi?"}
          </button>
        )}
      </Kartu>
    </KerangkaMasuk>
  );
}
