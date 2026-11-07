"use client";

import {
  ArrowLeft,
  ArrowRight,
  Flag,
  PaperPlaneTilt,
  SquaresFour,
  X,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { SoalUjian } from "@/lib/soal";
import { Dialog } from "./dialog";
import { GridNomor } from "./grid-nomor";
import { IndikatorSimpan } from "./indikator-simpan";
import { KartuSoal } from "./kartu-soal";
import { statusTimer, Timer, type StatusTimer } from "./timer";
import { useUjian } from "./use-ujian";

type Props = {
  paket: string;
  soal: SoalUjian[];
  durasiMenit: number;
  peringatanMenit: number;
  kritisMenit: number;
};

const tombolDasar =
  "flex h-12 items-center justify-center gap-2 rounded-lg px-4 title-4 transition-[background-color,transform] duration-200 ease-[var(--ease-out-house)] active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100";
const tombolUtama = `${tombolDasar} bg-primary text-on-primary hover:bg-primary-hover`;
const tombolSekunder = `${tombolDasar} border border-border bg-surface text-text hover:bg-surface-muted`;

export function LayarUjian({
  paket,
  soal,
  durasiMenit,
  peringatanMenit,
  kritisMenit,
}: Props) {
  const u = useUjian(paket, soal, durasiMenit);
  const router = useRouter();
  const [gridTerbuka, setGridTerbuka] = useState(false);
  const [konfirmasiTerbuka, setKonfirmasiTerbuka] = useState(false);
  const [keluarTerbuka, setKeluarTerbuka] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const statusSebelumnya = useRef<StatusTimer | null>(null);
  const isiRef = useRef<HTMLDivElement>(null);

  const status = statusTimer(u.sisaDetik, peringatanMenit, kritisMenit);
  const terakhir = u.indeks === soal.length - 1;
  const raguAktif = !!u.ragu[u.aktif.id];

  // Satu toast saat timer masuk ambang peringatan / kritis (bukan saat memulihkan sesi).
  useEffect(() => {
    if (!u.dimuat) return;
    const lalu = statusSebelumnya.current;
    statusSebelumnya.current = status;
    if (lalu === null || lalu === status || u.selesai) return;
    const menit = status === "kritis" ? kritisMenit : peringatanMenit;
    setToast(`Sisa waktu ${menit} menit. Periksa soal yang belum dijawab.`);
    const id = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(id);
  }, [status, kritisMenit, peringatanMenit, u.selesai, u.dimuat]);

  // Kembali ke atas saat pindah soal.
  useEffect(() => {
    window.scrollTo({ top: 0 });
    isiRef.current?.focus({ preventScroll: true });
  }, [u.indeks]);

  // Pintasan keyboard: A–E / 1–5 memilih, ← → pindah soal, R ragu-ragu.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (gridTerbuka || konfirmasiTerbuka || keluarTerbuka || u.selesai)
        return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
      const k = e.key.toLowerCase();
      const huruf = u.aktif.opsi.map((o) => o.huruf.toLowerCase());
      const angka = ["1", "2", "3", "4", "5"].indexOf(k);
      if (huruf.includes(k)) u.pilih(k.toUpperCase());
      else if (angka >= 0 && angka < huruf.length)
        u.pilih(u.aktif.opsi[angka].huruf);
      else if (k === "arrowright") u.keSoal(u.indeks + 1);
      else if (k === "arrowleft") u.keSoal(u.indeks - 1);
      else if (k === "r") u.toggleRagu();
      else return;
      e.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [u, gridTerbuka, konfirmasiTerbuka, keluarTerbuka]);

  // Setelah dikumpulkan (manual atau waktu habis), pindah ke halaman hasil.
  useEffect(() => {
    if (u.selesai) router.replace(`/ujian/${paket}/hasil`);
  }, [u.selesai, paket, router]);

  const grid = (
    <GridNomor
      soal={soal}
      indeksAktif={u.indeks}
      statusDari={u.statusDari}
      ringkasan={u.ringkasan}
      onPilih={(i) => {
        u.keSoal(i);
        setGridTerbuka(false);
      }}
    />
  );

  if (u.selesai) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-xl items-center justify-center px-4">
        <p role="status" className="body-6 text-text-muted">
          Jawaban terkumpul. Membuka hasil…
        </p>
      </main>
    );
  }

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[1fr_320px]">
      <div className="flex min-h-dvh flex-col">
        {/* Topbar: keluar, subtes, nomor, timer, tombol grid. Selalu terlihat. */}
        <header className="sticky top-0 z-10 border-b border-border bg-surface pt-[env(safe-area-inset-top)]">
          <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 pr-4 pl-1.5">
            <div className="flex min-w-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setKeluarTerbuka(true)}
                aria-label="Keluar dari ujian"
                className="flex size-11 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-surface-muted hover:text-text active:bg-surface-muted"
              >
                <X size={20} aria-hidden />
              </button>
              <span className="flex min-w-0 items-baseline gap-2">
                <span className="title-4">{u.aktif.kategori}</span>
                <span className="mono-number text-text-muted">
                  {u.indeks + 1}/{soal.length}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Timer
                sisaDetik={u.sisaDetik}
                status={status}
                dimuat={u.dimuat}
              />
              <button
                type="button"
                onClick={() => setGridTerbuka(true)}
                aria-label="Lihat semua nomor soal"
                className="flex size-11 items-center justify-center rounded-lg border border-border text-text active:bg-surface-muted lg:hidden"
              >
                <SquaresFour size={20} aria-hidden />
              </button>
            </div>
          </div>
          <div
            className="h-1 bg-primary transition-[width] duration-300 ease-[var(--ease-out-house)]"
            style={{
              width: `${((u.ringkasan.dijawab + u.ringkasan.ragu) / soal.length) * 100}%`,
            }}
            aria-hidden
          />
        </header>

        <main
          ref={isiRef}
          tabIndex={-1}
          className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 pt-4 pb-6 outline-none"
        >
          <div className="flex items-center justify-between gap-2">
            <h1 className="title-3">Soal {u.indeks + 1}</h1>
            <IndikatorSimpan status={u.statusSimpan} pada={u.disimpanPada} />
          </div>
          <KartuSoal
            key={u.aktif.id}
            soal={u.aktif}
            nomor={u.indeks + 1}
            terpilih={u.jawaban[u.aktif.id]}
            onPilih={u.pilih}
            terkunci={u.selesai}
          />
        </main>

        {/* Action bar di zona jempol. */}
        <nav
          aria-label="Navigasi soal"
          className="sticky bottom-0 z-10 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]"
        >
          <div className="mx-auto grid h-16 max-w-3xl grid-cols-[48px_1fr_1fr] items-center gap-2 px-4 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => u.keSoal(u.indeks - 1)}
              disabled={u.indeks === 0}
              aria-label="Soal sebelumnya"
              className={`${tombolSekunder} px-0 sm:px-4`}
            >
              <ArrowLeft size={20} aria-hidden />
              <span className="hidden sm:inline">Sebelumnya</span>
            </button>
            <button
              type="button"
              aria-pressed={raguAktif}
              onClick={u.toggleRagu}
              className={
                raguAktif
                  ? `${tombolDasar} border border-doubt bg-doubt text-on-doubt`
                  : tombolSekunder
              }
            >
              <Flag
                size={20}
                weight={raguAktif ? "fill" : "regular"}
                aria-hidden
              />
              Ragu-ragu
            </button>
            {terakhir ? (
              <button
                type="button"
                onClick={() => setKonfirmasiTerbuka(true)}
                className={tombolUtama}
              >
                Selesai
                <PaperPlaneTilt size={20} aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => u.keSoal(u.indeks + 1)}
                className={tombolUtama}
              >
                Berikutnya
                <ArrowRight size={20} aria-hidden />
              </button>
            )}
          </div>
        </nav>
      </div>

      {/* Desktop: grid sebagai panel kanan tetap. */}
      <aside
        aria-label="Nomor soal"
        className="hidden border-l border-border bg-surface lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col"
      >
        <div className="flex h-14 items-center border-b border-border px-4">
          <h2 className="title-3">Nomor soal</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{grid}</div>
        <div className="border-t border-border p-4">
          <button
            type="button"
            onClick={() => setKonfirmasiTerbuka(true)}
            className={`${tombolSekunder} w-full`}
          >
            Kumpulkan jawaban
          </button>
        </div>
      </aside>

      {/* HP: grid sebagai bottom sheet. */}
      <Dialog
        terbuka={gridTerbuka}
        onTutup={() => setGridTerbuka(false)}
        judul="Nomor soal"
        varian="sheet"
        footer={
          <button
            type="button"
            onClick={() => {
              setGridTerbuka(false);
              setKonfirmasiTerbuka(true);
            }}
            className={`${tombolSekunder} w-full`}
          >
            Kumpulkan jawaban
          </button>
        }
      >
        {grid}
      </Dialog>

      <Dialog
        terbuka={konfirmasiTerbuka}
        onTutup={() => setKonfirmasiTerbuka(false)}
        judul="Kumpulkan jawaban?"
        footer={
          <>
            <button
              type="button"
              onClick={() => setKonfirmasiTerbuka(false)}
              className={`${tombolSekunder} flex-1`}
            >
              Periksa lagi
            </button>
            <button
              type="button"
              onClick={() => {
                setKonfirmasiTerbuka(false);
                u.kumpulkan();
              }}
              className={`${tombolUtama} flex-1`}
            >
              Kumpulkan
            </button>
          </>
        }
      >
        <p className="body-6 text-text">
          {u.ringkasan.belum === 0 && u.ringkasan.ragu === 0
            ? "Semua soal sudah dijawab. Jawaban tidak bisa diubah setelah dikumpulkan."
            : `Masih ada ${[
                u.ringkasan.belum > 0 &&
                  `${u.ringkasan.belum} soal belum dijawab`,
                u.ringkasan.ragu > 0 && `${u.ringkasan.ragu} soal ragu-ragu`,
              ]
                .filter(Boolean)
                .join(
                  " dan ",
                )}. Jawaban tidak bisa diubah setelah dikumpulkan.`}
        </p>
      </Dialog>

      <Dialog
        terbuka={keluarTerbuka}
        onTutup={() => setKeluarTerbuka(false)}
        judul="Keluar dari ujian?"
        footer={
          <>
            <button
              type="button"
              onClick={() => setKeluarTerbuka(false)}
              className={`${tombolSekunder} flex-1`}
            >
              Lanjutkan
            </button>
            <button
              type="button"
              onClick={() => router.push("/try-out")}
              className={`${tombolUtama} flex-1`}
            >
              Keluar
            </button>
          </>
        }
      >
        <p className="body-6 text-text">
          Jawabanmu sudah tersimpan dan bisa dilanjutkan dari daftar try out.
          Timer tetap berjalan seperti ujian sungguhan, jadi kembali sebelum
          waktunya habis.
        </p>
      </Dialog>

      {/* Toast peringatan waktu. */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-20 flex justify-center px-4"
      >
        {toast && (
          <p className="body-6 rounded-lg border border-border bg-surface px-4 py-3 text-text shadow-none">
            {toast}
          </p>
        )}
      </div>
    </div>
  );
}
