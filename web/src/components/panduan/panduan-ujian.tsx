import { CaretDown, CheckCircle, Flag, Info, Target, Timer } from "@phosphor-icons/react/dist/ssr";
import { AMBANG_TIMER } from "@/config/skd";
import type { SoalUjian } from "@/lib/soal";

/** Data paket yang dibutuhkan pratinjau layar ujian. */
export type InfoPratinjau = {
  soalPerPaket: number;
  komposisi: { kode: string; jumlah: number }[];
};

/** Penjelasan bahasa awam untuk tiap bagian SKD. Jumlah soal dan nilai tetap diambil dari config. */
export const BAGIAN_SKD: Record<string, { nama: string; menguji: string; contoh: string }> = {
  TWK: {
    nama: "Wawasan Kebangsaan",
    menguji: "Pengetahuanmu tentang negara sendiri.",
    contoh: "Pancasila, UUD 1945, sejarah, dan Bhinneka Tunggal Ika.",
  },
  TIU: {
    nama: "Kemampuan Berpikir",
    menguji: "Cara kamu bernalar dan berhitung.",
    contoh: "Penalaran (silogisme, induktif, analitis), hitungan dan deret angka, serta gambar (serial, analogi, matriks).",
  },
  TKP: {
    nama: "Sikap dan Karakter",
    menguji: "Sikapmu saat bekerja dan melayani orang.",
    contoh: "Kamu memilih tindakan yang paling tepat dalam sebuah situasi kerja.",
  },
};

/** Nomor bulat kecil penunjuk bagian pada pratinjau layar ujian. */
function Penanda({ n, className = "" }: { n: number; className?: string }) {
  return (
    <span
      className={`caption-4 flex size-6 shrink-0 items-center justify-center rounded-full bg-text font-mono text-surface tabular-nums ${className}`}
    >
      {n}
    </span>
  );
}

/** Nomor soal yang ditampilkan di pratinjau: soal ke-7 di bagian soal tersebut. */
function nomorPratinjau(soal: Omit<SoalUjian, "id">, data: InfoPratinjau) {
  const sebelum = data.komposisi.slice(0, data.komposisi.findIndex((s) => s.kode === soal.kategori));
  return sebelum.reduce((n, s) => n + s.jumlah, 0) + 7;
}

/** Keterangan bernomor untuk pratinjau layar ujian (pasangan `PratinjauUjian beranotasi`). */
export function CaraBaca({ soal, data }: { soal: Omit<SoalUjian, "id">; data: InfoPratinjau }) {
  const nomor = nomorPratinjau(soal, data);
  const nama = BAGIAN_SKD[soal.kategori]?.nama;
  const warna = [
    { kelas: "bg-primary", label: "sudah dijawab" },
    { kelas: "bg-doubt", label: "ditandai ragu" },
    { kelas: "border border-border bg-surface", label: "belum dijawab" },
    { kelas: "bg-primary ring-2 ring-ring ring-offset-2 ring-offset-background", label: "soal yang sedang dibuka" },
  ];
  const butir = [
    {
      judul: "Bagian dan nomor soal",
      isi: `${soal.kategori}${nama ? ` berarti bagian ${nama}` : ""}. ${nomor}/${data.soalPerPaket} artinya kamu sedang di soal ke-${nomor} dari ${data.soalPerPaket}.`,
    },
    {
      judul: "Sisa waktu",
      isi: `Jam:menit:detik, menghitung mundur. Warnanya berubah saat waktu tinggal ${AMBANG_TIMER.peringatan * 100} persen dan ${AMBANG_TIMER.kritis * 100} persen. Kalau habis, jawabanmu dikumpulkan otomatis.`,
    },
    {
      judul: "Tanda tersimpan",
      isi: "Setiap kali kamu memilih, jawaban langsung disimpan. Tidak ada tombol simpan. Kalau HP mati, buka lagi dan lanjutkan.",
    },
    {
      judul: "Pilihan jawaban",
      isi: "Ketuk salah satu huruf. Pilihanmu ditandai biru dan bercentang. Masih bisa diganti selama belum dikumpulkan.",
    },
    {
      judul: "Peta nomor soal",
      isi: "Ketuk nomor mana saja untuk lompat ke soal itu. Di HP, peta ini dibuka lewat tombol kotak di sebelah timer.",
      warna: true,
    },
    {
      judul: "Tombol Ragu",
      isi: "Tandai soal yang belum yakin supaya mudah dicari lagi. Tanda ini tidak mengurangi nilai.",
    },
  ];
  return (
    <ol className="flex flex-col gap-6">
      {butir.map((b, i) => (
        <li key={b.judul} className="flex items-start gap-4">
          <Penanda n={i + 1} className="mt-0.5" />
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="title-3">{b.judul}</h3>
            <p className="body-6 text-pretty text-text-muted">{b.isi}</p>
            {b.warna && (
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {warna.map((w) => (
                  <li key={w.label} className="body-6 flex items-center gap-3 text-text">
                    <span aria-hidden className={`size-5 shrink-0 rounded-md ${w.kelas}`} />
                    {w.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * Pratinjau statis layar ujian, memakai soal asli dari bank (tanpa kunci).
 * `beranotasi`: tampilkan nomor penunjuk 1–6 yang dijelaskan `CaraBaca`.
 */
export function PratinjauUjian({
  soal,
  data,
  beranotasi = false,
  tanpaBingkai = false,
}: {
  soal: Omit<SoalUjian, "id">;
  data: InfoPratinjau;
  beranotasi?: boolean;
  /** Tanpa border dan sudut sendiri, untuk ditaruh di dalam bingkai HP. */
  tanpaBingkai?: boolean;
}) {
  const nomor = nomorPratinjau(soal, data);
  const penanda = (n: number, className?: string) => (beranotasi ? <Penanda n={n} className={className} /> : null);
  const terpilih = soal.opsi[3]?.huruf;
  // Status 10 sel grid di sekitar soal aktif: d = dijawab, r = ragu, b = belum.
  const sel = ["d", "d", "d", "r", "d", "d", "a", "b", "b", "b"];
  return (
    <figure
      aria-label={beranotasi ? "Layar ujian dengan nomor penunjuk 1 sampai 6" : "Contoh tampilan layar ujian"}
      className={tanpaBingkai ? "w-full" : "mx-auto w-full max-w-md lg:max-w-none"}
    >
      <div aria-hidden className={tanpaBingkai ? "bg-surface" : "overflow-hidden rounded-xl border border-border bg-surface"}>
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <span className="title-4 flex items-center gap-2">
            {penanda(1)}
            {soal.kategori} · <span className="mono-number">{nomor}</span>
            <span className="mono-number text-text-muted">/{data.soalPerPaket}</span>
          </span>
          <span className="flex items-center gap-1">
            {penanda(2, "mr-1")}
            <Timer size={20} />
            <span className="mono-timer">01:12:48</span>
          </span>
        </div>
        <div className="flex flex-col gap-4 p-4">
          <p className="caption-4 flex items-center gap-1 text-text-muted">
            {penanda(3, "mr-1")}
            <CheckCircle size={16} /> Tersimpan
          </p>
          <p className="body-5">{soal.pertanyaan}</p>
          <ul className="relative flex flex-col gap-2">
            {penanda(4, "absolute -top-3 -left-3 z-10")}
            {soal.opsi.map(({ huruf, teks }) => {
              const aktif = huruf === terpilih;
              return (
                <li
                  key={huruf}
                  className={`flex items-center gap-3 rounded-xl border p-3 ${
                    aktif ? "border-primary bg-surface-muted outline outline-1 outline-primary" : "border-border"
                  }`}
                >
                  <span
                    className={`mono-number flex size-7 shrink-0 items-center justify-center rounded-full border ${
                      aktif ? "border-primary bg-primary text-on-primary" : "border-border text-text-muted"
                    }`}
                  >
                    {huruf}
                  </span>
                  <span className="body-6 flex-1">{teks}</span>
                  {aktif && <CheckCircle size={20} weight="fill" className="shrink-0 text-primary" />}
                </li>
              );
            })}
          </ul>
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <p className="caption-4 flex flex-wrap items-center gap-x-1 text-text-muted">
              {penanda(5, "mr-1")}
              Dijawab <span className="mono-number">{nomor - 1}</span> · Ragu <span className="mono-number">1</span> ·
              Belum <span className="mono-number">{data.soalPerPaket - nomor}</span>
            </p>
            <div className="grid grid-cols-10 gap-1">
              {sel.map((s, i) => (
                <span
                  key={i}
                  className={`relative flex aspect-square items-center justify-center rounded-md font-mono text-xs tabular-nums ${
                    s === "d"
                      ? "bg-primary text-on-primary"
                      : s === "r"
                        ? "bg-doubt text-on-doubt"
                        : s === "a"
                          ? "bg-primary text-on-primary ring-2 ring-ring ring-offset-2 ring-offset-surface"
                          : "border border-border bg-surface text-text-muted"
                  }`}
                >
                  {nomor - 6 + i}
                  {s === "r" && <span className="absolute top-0.5 right-0.5 size-1 rounded-full bg-on-doubt" />}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 border-t border-border p-3">
          <span className="title-4 flex h-10 items-center justify-center rounded-lg border border-border">Sebelumnya</span>
          <span className="title-4 relative flex h-10 items-center justify-center gap-1 rounded-lg border border-border">
            {penanda(6, "absolute -top-3 -right-2")}
            <Flag size={16} /> Ragu
          </span>
          <span className="title-4 flex h-10 items-center justify-center rounded-lg bg-primary text-on-primary">
            Berikutnya
          </span>
        </div>
      </div>
    </figure>
  );
}

/** Rasio skor ilustrasi per subtes untuk `PratinjauHasil` (angka contoh, bukan data peserta). */
const RASIO_CONTOH: Record<string, number> = { TWK: 0.57, TIU: 0.63, TKP: 0.79 };

/**
 * Contoh halaman hasil untuk landing: total, skor per subtes, saran mulai belajar, dan jumlah soal
 * yang perlu dibaca ulang. Angkanya dihitung dari rasio ilustrasi dan nilai maksimal di config,
 * dan selalu diberi label "Contoh" supaya tidak terbaca sebagai hasil peserta.
 */
export function PratinjauHasil({
  komposisi,
  nilaiBenar,
}: {
  komposisi: { kode: string; jumlah: number; nilaiMaks: number }[];
  nilaiBenar: number;
}) {
  const sub = komposisi.map((s) => {
    const r = RASIO_CONTOH[s.kode] ?? 0.6;
    const tkp = s.kode === "TKP";
    const skor = tkp ? Math.round(s.nilaiMaks * r) : Math.round((s.nilaiMaks * r) / nilaiBenar) * nilaiBenar;
    // TWK/TIU: soal tidak benar = jumlah - skor/nilai benar. TKP: ±60% memilih opsi terbaik.
    const tidakBenar = tkp ? s.jumlah - Math.round(s.jumlah * 0.6) : s.jumlah - skor / nilaiBenar;
    return { ...s, skor, persen: Math.round((skor / s.nilaiMaks) * 100), tidakBenar, tkp };
  });
  const total = sub.reduce((n, s) => n + s.skor, 0);
  const maks = sub.reduce((n, s) => n + s.nilaiMaks, 0);
  const terlemah = [...sub].sort((a, b) => a.persen - b.persen)[0];
  const kosong = sub.filter((s) => !s.tkp).length * 2;
  const salah = sub.reduce((n, s) => n + s.tidakBenar, 0) - kosong;
  if (!terlemah) return null;
  return (
    <figure className="flex w-full flex-col gap-3" aria-label="Contoh hasil try out dengan angka ilustrasi">
      <figcaption className="caption-4 flex flex-wrap items-center gap-2 text-text-muted">
        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-text">Contoh hasil try out</span>
        Angka ilustrasi, bukan hasil peserta.
      </figcaption>
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex flex-col gap-2">
          <p className="caption-4 text-text-muted">Total skor</p>
          <p className="flex items-baseline gap-1">
            <span className="font-mono text-3xl font-semibold tabular-nums">{total}</span>
            <span className="mono-number text-text-muted">/ {maks}</span>
          </p>
          <span aria-hidden className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
            <span className="block h-full rounded-full bg-primary" style={{ width: `${(total / maks) * 100}%` }} />
          </span>
        </div>
        <ul className="grid grid-cols-3 gap-2">
          {sub.map((s) => (
            <li key={s.kode} className="flex flex-col gap-1 rounded-lg border border-border p-3">
              <span className="caption-4 text-text-muted">{s.kode}</span>
              <span className="mono-number">
                {s.skor}
                <span className="text-text-muted">/{s.nilaiMaks}</span>
              </span>
              <span aria-hidden className="h-1 overflow-hidden rounded-full bg-surface-muted">
                <span className="block h-full rounded-full bg-primary" style={{ width: `${s.persen}%` }} />
              </span>
            </li>
          ))}
        </ul>
        <p className="body-6 flex items-start gap-2 rounded-lg bg-surface-muted p-3 text-pretty">
          <Target size={20} aria-hidden className="mt-px shrink-0 text-primary" />
          <span>
            Mulai dari <strong className="font-semibold">{terlemah.kode}</strong>: skornya{" "}
            <span className="mono-number">{terlemah.persen}%</span> dari maksimal.
          </span>
        </p>
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <p className="caption-4 text-text-muted">Pembahasan yang perlu dibaca ulang</p>
          <ul className="flex flex-wrap gap-2">
            {[
              ["Salah", salah],
              ["Kosong", kosong],
              ["Ragu", 6],
            ].map(([label, n]) => (
              <li key={label} className="title-4 flex h-9 items-center gap-1 rounded-full border border-border px-3">
                {label} <span className="mono-number text-xs text-text-muted">{n}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </figure>
  );
}

/** Panduan "Cara membaca layar ujian" yang bisa dibuka-tutup, dipasang di /try-out sebelum memilih paket. */
export function PanduanUjian({ soal, data }: { soal: Omit<SoalUjian, "id">; data: InfoPratinjau }) {
  return (
    <details className="group rounded-xl border border-border bg-surface">
      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-xl p-4 transition-colors duration-300 ease-[var(--ease-out-house)] hover:bg-surface-muted [&::-webkit-details-marker]:hidden">
        <Info size={20} aria-hidden className="shrink-0 text-primary" />
        <span className="flex flex-1 flex-col">
          <span className="title-3">Cara membaca layar ujian</span>
          <span className="caption-4 text-text-muted">Baca sebentar sebelum mulai, terutama kalau baru pertama kali.</span>
        </span>
        <CaretDown
          size={20}
          aria-hidden
          className="shrink-0 text-text-muted transition-transform duration-300 ease-[var(--ease-out-house)] group-open:rotate-180"
        />
      </summary>
      <div className="flex flex-col gap-6 border-t border-border p-4">
        <p className="body-6 text-pretty text-text-muted">
          Cocokkan nomor bulat di gambar dengan keterangan bernomor sama.
        </p>
        <PratinjauUjian soal={soal} data={data} beranotasi />
        <CaraBaca soal={soal} data={data} />
      </div>
    </details>
  );
}
