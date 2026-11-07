"use client";

import { ArrowCounterClockwise, ArrowLeft, ArrowRight, ClockCountdown, Info, Play } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { bacaRekaman, hapusRekaman } from "@/components/ujian/use-ujian";
import { bacaRiwayat, type EntriRiwayat } from "@/lib/riwayat";

export type PaketBeranda = {
  id: string;
  judul: string;
  status: string;
  jumlahSoal: number;
  durasiMenit: number;
  perSubtes: { subtes: string; jumlah: number }[];
};

type Sesi =
  | { jenis: "baru" }
  | { jenis: "berjalan"; terjawab: number; sisaDetik: number }
  | { jenis: "selesai" };

const tombolDasar =
  "flex h-12 items-center justify-center gap-2 rounded-lg px-4 title-4 transition-[background-color,transform] duration-200 ease-[var(--ease-out-house)] active:scale-[0.98]";
const tombolUtama = `${tombolDasar} bg-primary text-on-primary hover:bg-primary-hover`;
const tombolSekunder = `${tombolDasar} border border-border bg-surface text-text hover:bg-surface-muted`;

function sesiDari(paket: PaketBeranda, sekarang: number): Sesi {
  const r = bacaRekaman(paket.id);
  if (!r) return { jenis: "baru" };
  if (r.selesai) return { jenis: "selesai" };
  return {
    jenis: "berjalan",
    terjawab: Object.keys(r.jawaban).filter((id) => r.jawaban[id]).length,
    sisaDetik: Math.max(0, Math.ceil((r.berakhirPada - sekarang) / 1000)),
  };
}

function formatSisa(detik: number) {
  const m = Math.floor(detik / 60);
  const d = detik % 60;
  return `${String(m).padStart(2, "0")}:${String(d).padStart(2, "0")}`;
}

const rtf = new Intl.RelativeTimeFormat("id", { numeric: "auto" });
function waktuRelatif(ms: number, sekarang: number) {
  const menit = Math.round((ms - sekarang) / 60_000);
  if (Math.abs(menit) < 1) return "baru saja";
  if (Math.abs(menit) < 60) return rtf.format(menit, "minute");
  const jam = Math.round(menit / 60);
  if (Math.abs(jam) < 24) return rtf.format(jam, "hour");
  return rtf.format(Math.round(jam / 24), "day");
}
const tanggalLengkap = (ms: number) =>
  new Date(ms).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function LayarBeranda({ paket }: { paket: PaketBeranda[] }) {
  const router = useRouter();
  const [dimuat, setDimuat] = useState(false);
  const [sekarang, setSekarang] = useState(0);
  const [sesi, setSesi] = useState<Record<string, Sesi>>({});
  const [riwayat, setRiwayat] = useState<EntriRiwayat[]>([]);

  useEffect(() => {
    const t = Date.now();
    setSekarang(t);
    setSesi(Object.fromEntries(paket.map((p) => [p.id, sesiDari(p, t)])));
    setRiwayat(bacaRiwayat());
    setDimuat(true);
  }, [paket]);

  const berjalan = paket.find((p) => sesi[p.id]?.jenis === "berjalan");
  const sesiBerjalan = berjalan ? (sesi[berjalan.id] as Extract<Sesi, { jenis: "berjalan" }>) : null;

  const ulangi = (id: string) => {
    hapusRekaman(id);
    router.push(`/ujian/${id}`);
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-8 px-4 pt-6 pb-10">
      <header className="flex flex-col gap-1">
        <Link
          href="/"
          className="caption-4 -ml-2 flex h-11 items-center gap-1 self-start rounded-lg px-2 text-text-muted hover:bg-surface-muted"
        >
          <ArrowLeft size={16} aria-hidden />
          Halaman utama
        </Link>
        <h1 className="heading-5">Try out SKD CPNS</h1>
        <p className="body-6 text-text-muted">Latihan TWK, TIU, dan TKP dengan timer dan pembahasan lengkap.</p>
      </header>

      {berjalan && sesiBerjalan && (
        <section
          aria-labelledby="judul-lanjutkan"
          className="flex flex-col gap-4 rounded-xl border border-primary bg-surface p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 id="judul-lanjutkan" className="title-3">
                Lanjutkan {berjalan.judul}
              </h2>
              <p className="body-6 text-text-muted">
                <span className="mono-number">
                  {sesiBerjalan.terjawab}/{berjalan.jumlahSoal}
                </span>{" "}
                soal dijawab
              </p>
            </div>
            <p
              className={`flex items-center gap-1 ${sesiBerjalan.sisaDetik === 0 ? "text-danger" : "text-text"}`}
              aria-label={sesiBerjalan.sisaDetik === 0 ? "Waktu habis" : `Sisa waktu ${formatSisa(sesiBerjalan.sisaDetik)}`}
            >
              <ClockCountdown size={20} aria-hidden />
              <span className="mono-timer">
                {sesiBerjalan.sisaDetik === 0 ? "Habis" : formatSisa(sesiBerjalan.sisaDetik)}
              </span>
            </p>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted" aria-hidden>
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(sesiBerjalan.terjawab / berjalan.jumlahSoal) * 100}%` }}
            />
          </div>
          <Link href={`/ujian/${berjalan.id}`} className={tombolUtama}>
            {sesiBerjalan.sisaDetik === 0 ? "Waktu habis, lihat hasil" : "Lanjutkan ujian"}
            <ArrowRight size={20} aria-hidden />
          </Link>
        </section>
      )}

      <section aria-labelledby="judul-paket" className="flex flex-col gap-3">
        <h2 id="judul-paket" className="title-3">
          Paket try out
        </h2>
        {paket.length === 0 ? (
          <p className="body-6 rounded-xl border border-border bg-surface p-4 text-text-muted">
            Belum ada paket soal. Paket muncul di sini setelah ditambahkan ke bank soal.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {paket.map((p) => {
              const s = sesi[p.id];
              const terakhir = riwayat.find((e) => e.paket === p.id);
              return (
                <li key={p.id} className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="title-3">{p.judul}</h3>
                      {p.status !== "final" && (
                        <span className="caption-4 rounded-full border border-border px-2 py-0.5 text-text-muted">
                          {p.status === "review" ? "Review" : "Draf"}
                        </span>
                      )}
                    </div>
                    <p className="body-6 text-text-muted">
                      <span className="mono-number">{p.jumlahSoal}</span> soal ·{" "}
                      <span className="mono-number">{p.durasiMenit}</span> menit ·{" "}
                      {p.perSubtes.map((x) => `${x.subtes} ${x.jumlah}`).join(" · ")}
                    </p>
                    {terakhir && (
                      <p className="caption-4 text-text-muted" title={tanggalLengkap(terakhir.dicatatPada)}>
                        Skor terakhir{" "}
                        <span className="mono-number text-xs text-text">
                          {terakhir.total}/{terakhir.totalMaks}
                        </span>{" "}
                        · {waktuRelatif(terakhir.dicatatPada, sekarang)}
                      </p>
                    )}
                  </div>
                  {!dimuat ? (
                    <div className="h-12 animate-pulse rounded-lg bg-surface-muted" aria-hidden />
                  ) : s?.jenis === "selesai" ? (
                    <div className="grid grid-cols-2 gap-3">
                      <Link href={`/ujian/${p.id}/hasil`} className={tombolSekunder}>
                        Lihat hasil
                      </Link>
                      <button type="button" onClick={() => ulangi(p.id)} className={tombolUtama}>
                        <ArrowCounterClockwise size={20} aria-hidden />
                        Ulangi
                      </button>
                    </div>
                  ) : s?.jenis === "berjalan" ? (
                    <Link href={`/ujian/${p.id}`} className={tombolSekunder}>
                      Lanjutkan
                      <ArrowRight size={20} aria-hidden />
                    </Link>
                  ) : (
                    <Link href={`/ujian/${p.id}`} className={tombolUtama}>
                      <Play size={20} weight="fill" aria-hidden />
                      Mulai
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="judul-riwayat" className="flex flex-col gap-3">
        <h2 id="judul-riwayat" className="title-3">
          Riwayat skor
        </h2>
        {!dimuat ? (
          <div className="h-16 animate-pulse rounded-xl border border-border bg-surface" aria-hidden />
        ) : riwayat.length === 0 ? (
          <p className="body-6 rounded-xl border border-border bg-surface p-4 text-text-muted">
            Belum ada riwayat. Selesaikan satu paket untuk melihat skormu di sini.
          </p>
        ) : (
          <ol className="divide-y divide-border rounded-xl border border-border bg-surface">
            {riwayat.slice(0, 10).map((e) => (
              <li key={`${e.paket}-${e.percobaan}`}>
                <Link
                  href={`/ujian/${e.paket}/hasil`}
                  className="flex min-h-14 items-center justify-between gap-4 px-4 py-3 hover:bg-surface-muted"
                >
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="title-4 truncate">{e.judul}</span>
                    <span className="caption-4 text-text-muted" title={tanggalLengkap(e.dicatatPada)}>
                      {waktuRelatif(e.dicatatPada, sekarang)} · {e.perSubtes.map((x) => `${x.subtes} ${x.skor}`).join(" · ")}
                    </span>
                  </span>
                  <span className="mono-number shrink-0 text-right">
                    {e.total}
                    <span className="text-text-muted">/{e.totalMaks}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
        <p className="caption-4 text-text-muted">Riwayat tersimpan di perangkat ini.</p>
      </section>

      <p className="caption-4 flex items-start gap-2 text-text-muted">
        <Info size={16} className="shrink-0" aria-hidden />
        Format dan passing grade mengikuti konfigurasi. Cek aturan BKN/KemenPAN-RB terbaru.
      </p>
    </main>
  );
}
