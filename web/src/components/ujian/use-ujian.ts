"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SoalUjian } from "@/lib/soal";
import { EVENT_SINKRON, hapusRekamanAkun, kirimRekaman } from "@/lib/sinkron";

export type StatusSoal = "belum" | "dijawab" | "ragu";
export type StatusSimpan = "tersimpan" | "gagal" | "memuat";

export type Rekaman = {
  jawaban: Record<string, string>;
  ragu: Record<string, boolean>;
  indeks: number;
  berakhirPada: number;
  selesai: boolean;
  disimpanPada: number;
};

export const kunciPenyimpanan = (paket: string) => `soalskd:ujian:${paket}`;

export function bacaRekaman(paket: string): Rekaman | null {
  try {
    const raw = localStorage.getItem(kunciPenyimpanan(paket));
    return raw ? (JSON.parse(raw) as Rekaman) : null;
  } catch {
    return null;
  }
}

export function hapusRekaman(paket: string) {
  try {
    localStorage.removeItem(kunciPenyimpanan(paket));
  } catch {}
  hapusRekamanAkun(paket);
}

/**
 * State satu sesi ujian. Jawaban disimpan otomatis ke perangkat setiap kali berubah,
 * dan batas waktu disimpan sebagai jam selesai, jadi refresh tidak mengulang timer.
 */
export function useUjian(paket: string, soal: SoalUjian[], durasiMenit: number) {
  const [jawaban, setJawaban] = useState<Record<string, string>>({});
  const [ragu, setRagu] = useState<Record<string, boolean>>({});
  const [indeks, setIndeks] = useState(0);
  const [berakhirPada, setBerakhirPada] = useState<number | null>(null);
  const [selesai, setSelesai] = useState(false);
  const [statusSimpan, setStatusSimpan] = useState<StatusSimpan>("memuat");
  const [disimpanPada, setDisimpanPada] = useState<number | null>(null);
  const [sekarang, setSekarang] = useState(() => Date.now());
  const siap = useRef(false);
  /** Pengguna sudah mengubah sesi ini di perangkat ini sejak dimuat. */
  const diubah = useRef(false);

  // Pulihkan sesi yang tersimpan, atau mulai sesi baru.
  useEffect(() => {
    const pulihkan = (r: Rekaman) => {
      setJawaban(r.jawaban);
      setRagu(r.ragu);
      setIndeks(Math.min(r.indeks, soal.length - 1));
      setBerakhirPada(r.berakhirPada);
      setSelesai(r.selesai);
      setDisimpanPada(r.disimpanPada);
    };
    const r = bacaRekaman(paket);
    if (r) pulihkan(r);
    else setBerakhirPada(Date.now() + durasiMenit * 60_000);
    setSekarang(Date.now());
    siap.current = true;
    diubah.current = false;

    // Sesi dari akun (perangkat lain) tiba setelah layar terbuka: pakai selama belum ada perubahan di sini.
    const dariAkun = () => {
      const baru = bacaRekaman(paket);
      if (baru && !diubah.current) pulihkan(baru);
    };
    window.addEventListener(EVENT_SINKRON, dariAkun);
    return () => window.removeEventListener(EVENT_SINKRON, dariAkun);
  }, [paket, soal.length, durasiMenit]);

  // Simpan otomatis.
  useEffect(() => {
    if (!siap.current || berakhirPada === null) return;
    const waktu = Date.now();
    const r: Rekaman = { jawaban, ragu, indeks, berakhirPada, selesai, disimpanPada: waktu };
    try {
      localStorage.setItem(kunciPenyimpanan(paket), JSON.stringify(r));
      setStatusSimpan("tersimpan");
      setDisimpanPada(waktu);
    } catch {
      setStatusSimpan("gagal");
    }
    // Hanya perubahan dari pengguna yang dikirim ke akun, bukan sesi yang baru dibuka/dipulihkan.
    if (diubah.current) kirimRekaman(paket, r);
  }, [paket, jawaban, ragu, indeks, berakhirPada, selesai]);

  // Detak timer.
  useEffect(() => {
    if (selesai) return;
    const id = window.setInterval(() => setSekarang(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [selesai]);

  const dimuat = berakhirPada !== null;
  const sisaDetik = dimuat
    ? Math.min(durasiMenit * 60, Math.max(0, Math.ceil((berakhirPada - sekarang) / 1000)))
    : durasiMenit * 60;

  // Waktu habis: kumpulkan otomatis.
  useEffect(() => {
    if (berakhirPada !== null && sisaDetik === 0 && !selesai) {
      diubah.current = true;
      setSelesai(true);
    }
  }, [sisaDetik, berakhirPada, selesai]);

  const statusDari = useCallback(
    (id: string): StatusSoal => (ragu[id] ? "ragu" : jawaban[id] ? "dijawab" : "belum"),
    [jawaban, ragu],
  );

  const ringkasan = useMemo(() => {
    let dijawab = 0;
    let raguRagu = 0;
    for (const s of soal) {
      const st = statusDari(s.id);
      if (st === "dijawab") dijawab++;
      if (st === "ragu") raguRagu++;
    }
    return { dijawab, ragu: raguRagu, belum: soal.length - dijawab - raguRagu };
  }, [soal, statusDari]);

  const aktif = soal[indeks];

  return {
    aktif,
    dimuat,
    indeks,
    jawaban,
    ragu,
    selesai,
    sisaDetik,
    statusSimpan,
    disimpanPada,
    ringkasan,
    statusDari,
    pilih: (huruf: string) => {
      if (selesai) return;
      diubah.current = true;
      setJawaban((j) => ({ ...j, [aktif.id]: huruf }));
    },
    toggleRagu: () => {
      if (selesai) return;
      diubah.current = true;
      setRagu((r) => ({ ...r, [aktif.id]: !r[aktif.id] }));
    },
    keSoal: (i: number) => setIndeks(Math.max(0, Math.min(soal.length - 1, i))),
    kumpulkan: () => {
      diubah.current = true;
      setSelesai(true);
    },
    ulangi: () => {
      diubah.current = true;
      setJawaban({});
      setRagu({});
      setIndeks(0);
      setSelesai(false);
      setSekarang(Date.now());
      setBerakhirPada(Date.now() + durasiMenit * 60_000);
    },
  };
}
