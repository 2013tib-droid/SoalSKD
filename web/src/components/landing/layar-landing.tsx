import {
  ArrowRight,
  BookOpen,
  CaretDown,
  ChartBar,
  ChartLineUp,
  Check,
  CheckCircle,
  DeviceMobile,
  Exam,
  Flag,
  Gift,
  Lightning,
  Megaphone,
  PlayCircle,
  ShieldCheck,
  ShoppingBag,
  SmileyNervous,
  SmileyWink,
  Stack,
  Star,
  Target,
  Timer,
  Trophy,
  XCircle,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { AMBANG_TIMER, DURASI_LATIHAN_MENIT_PER_SOAL } from "@/config/skd";
import { PAKET_GRATIS, PENAWARAN, TAUTAN_BELI, TESTIMONI } from "@/config/landing";
import type { SoalPembahasan, SoalUjian } from "@/lib/soal";
import { MenuAkun } from "@/components/akun/menu-akun";
import { LOGIN_AKTIF } from "@/lib/firebase/klien";
import { ContohSoal, PratinjauHasil } from "./contoh-soal";
import { Muncul } from "./gerak";

export type DataLanding = {
  jumlahPaket: number;
  paketLengkap: number;
  totalSoal: number;
  soalPerPaket: number;
  durasiMenit: number;
  durasiResmi: boolean;
  komposisi: { kode: string; jumlah: number; nilaiMaks: number }[];
  nilaiBenar: number;
  ambang: { kode: string; nilai: number }[] | null;
  soalGratis: number;
};

type Props = {
  data: DataLanding;
  soalHero: Omit<SoalUjian, "id"> | null;
  soalContoh: SoalPembahasan | null;
};

const CTA = "Mulai Try Out";
const tombolUtama =
  "button-md flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-on-primary transition-[background-color,transform] duration-300 ease-[var(--ease-out-house)] hover:bg-primary-hover active:scale-[0.98]";
const tombolKedua =
  "button-md flex h-12 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-text transition-[background-color,transform] duration-300 ease-[var(--ease-out-house)] hover:bg-surface-muted active:scale-[0.98]";
const wadah = "mx-auto w-full max-w-5xl px-4";
const judulSection = "heading-4 lg:heading-3 text-balance";

const gabung = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")}, dan ${xs.at(-1)}`);

/** Penjelasan bahasa awam untuk tiap bagian SKD. Jumlah soal dan nilai tetap diambil dari config. */
const BAGIAN_SKD: Record<string, { nama: string; menguji: string; contoh: string }> = {
  TWK: {
    nama: "Wawasan Kebangsaan",
    menguji: "Pengetahuanmu tentang negara sendiri.",
    contoh: "Pancasila, UUD 1945, sejarah, dan Bhinneka Tunggal Ika.",
  },
  TIU: {
    nama: "Kemampuan Berpikir",
    menguji: "Cara kamu bernalar dan berhitung.",
    contoh: "Deret angka, soal cerita hitungan, logika, dan arti kata.",
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

export function LayarLanding({ data, soalHero, soalContoh }: Props) {
  const komposisi = gabung(data.komposisi.map((s) => `${s.jumlah} ${s.kode}`));
  const ambangTeks = data.ambang && gabung(data.ambang.map((a) => `${a.kode} ${a.nilai}`));

  const keunggulan = [
    {
      ikon: Target,
      warna: "bg-danger/10 text-danger",
      judul: `${data.totalSoal > 0 ? `${data.totalSoal} soal` : "Soal"} orisinal`,
      isi: "Ditulis sendiri mengikuti format SKD, bukan salinan dari internet.",
    },
    {
      ikon: Timer,
      warna: "bg-primary/10 text-primary",
      judul: "Simulasi seperti CAT",
      isi: `Timer selalu terlihat dan berubah warna saat waktu tinggal ${AMBANG_TIMER.peringatan * 100}%.`,
    },
    {
      ikon: BookOpen,
      warna: "bg-primary/10 text-primary",
      judul: "Pembahasan tiap pilihan",
      isi: "Tahu kenapa jawabanmu benar, dan kenapa pilihan lain menjebak.",
    },
    {
      ikon: ChartBar,
      warna: "bg-success/10 text-success",
      judul: "Skor per subtes",
      isi: ambangTeks
        ? `TWK, TIU, TKP dinilai terpisah dan dibandingkan dengan ${ambangTeks}.`
        : "TWK, TIU, dan TKP dinilai terpisah, jadi kelihatan bagian yang perlu dilatih.",
    },
  ];

  const masalah = [
    "Soal acak dari internet, tanpa format SKD",
    "Tidak tahu nilai sendiri per subtes",
    "Kunci tanpa pembahasan",
    "Belum terbiasa dikejar timer",
  ];
  const solusi = [
    `Satu paket ${data.soalPerPaket} soal seperti CAT`,
    "Nilai langsung keluar setelah dikumpulkan",
    "Pembahasan untuk setiap pilihan",
    "Riwayat skor tiap percobaan",
  ];

  const langkah = [
    { judul: "Pilih paket", isi: `${data.soalPerPaket} soal: ${komposisi}.` },
    { judul: "Kerjakan", isi: "Timer berjalan, jawaban tersimpan otomatis." },
    { judul: "Lihat skor", isi: "Nilai TWK, TIU, TKP langsung keluar." },
    { judul: "Pelajari", isi: "Saring soal yang salah, kosong, atau ragu." },
  ];

  const angka = [
    ...(data.totalSoal > 0
      ? [{ ikon: Lightning, nilai: `${data.totalSoal}`, label: "Soal orisinal" }]
      : []),
    ...(data.jumlahPaket > 0 ? [{ ikon: Stack, nilai: `${data.jumlahPaket}`, label: "Paket latihan" }] : []),
    { ikon: DeviceMobile, nilai: "HP", label: "Nyaman satu tangan" },
    { ikon: ShieldCheck, nilai: "Gratis", label: `Paket pertama, tanpa akun` },
  ];

  const faq = [
    {
      t: "Apakah soalnya sama dengan soal asli BKN?",
      j: "Tidak. Semua soal ditulis sendiri mengikuti format SKD. Tidak ada soal yang disalin dari buku atau aplikasi lain.",
    },
    {
      t: "Berapa soal dan berapa lama satu paket?",
      j: `${data.soalPerPaket} soal (${komposisi}) dengan waktu ${data.durasiMenit} menit.${
        data.durasiResmi
          ? ""
          : ` Untuk sementara durasinya ${DURASI_LATIHAN_MENIT_PER_SOAL} menit per soal, sampai durasi resmi tahun ini kami catat.`
      }`,
    },
    {
      t: "Bagaimana nilainya dihitung?",
      j: `TWK dan TIU: ${data.nilaiBenar} poin untuk jawaban benar, 0 untuk salah atau kosong. TKP: setiap pilihan punya bobot sendiri, jadi tidak ada pilihan yang bernilai nol. Soal TKP yang dikosongkan tetap bernilai 0.`,
    },
    {
      t: "Apakah bisa dikerjakan di HP?",
      j: "Bisa. Tampilannya dibuat untuk layar HP lebih dulu: pilihan jawaban selebar layar, timer di atas, dan tombol navigasi di bawah supaya nyaman dipakai satu tangan.",
    },
    {
      t: "Perlu daftar akun?",
      j: LOGIN_AKTIF
        ? "Untuk paket gratis tidak perlu: jawaban dan riwayat skor disimpan di browser perangkatmu. Paket berbayar dibuka lewat akun, supaya bisa dikerjakan dari HP atau laptop mana pun dan riwayatmu ikut tersimpan."
        : "Belum perlu. Jawaban, sesi ujian, dan riwayat skor disimpan di browser perangkatmu. Kalau data browser dihapus atau kamu ganti perangkat, riwayatnya ikut hilang.",
    },
    {
      t: "Bagaimana kalau tab tertutup di tengah ujian?",
      j: "Jawaban tersimpan setiap kali kamu memilih. Buka paket yang sama lagi dan ujian lanjut dari jawaban terakhir. Timer tetap berjalan seperti ujian sungguhan.",
    },
    {
      t: "Berapa passing grade SKD?",
      j: `Ambang batas ditetapkan pemerintah dan bisa berubah setiap tahun. ${
        ambangTeks
          ? `Saat ini kami memakai ${ambangTeks}.`
          : "Kami belum mencantumkan angkanya sampai ada pengumuman resmi tahun ini."
      } Selalu cek aturan BKN dan KemenPAN-RB terbaru.`,
    },
    {
      t: "Apakah ada ranking antar peserta?",
      j: "Belum. Ranking butuh akun dan server untuk membandingkan skor antar peserta. Untuk sekarang kamu bisa membandingkan skormu sendiri lewat riwayat.",
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.t, acceptedAnswer: { "@type": "Answer", text: f.j } })),
  };

  return (
    <>
      <nav
        aria-label="Utama"
        className="fixed inset-x-0 top-0 z-40 border-b border-border/60 bg-surface/80 backdrop-blur-md"
      >
        <div className={`${wadah} flex h-16 items-center justify-between gap-2`}>
          <Logo />
          <ul className="hidden items-center md:flex">
            {[
              ["#contoh-soal", "Contoh Soal"],
              ["#cara-kerja", "Cara Kerja"],
              ...(PENAWARAN ? [["#harga", "Harga"]] : []),
              ["#faq", "FAQ"],
            ].map(([href, label]) => (
              <li key={href}>
                <a
                  href={href}
                  className="title-4 block rounded-lg px-3 py-2 whitespace-nowrap text-text-muted transition-colors duration-300 ease-[var(--ease-out-house)] hover:bg-surface-muted hover:text-text"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-1">
            <MenuAkun />
            <Link
              href="/try-out"
              className="title-4 flex h-10 items-center gap-1 rounded-lg bg-primary px-3 whitespace-nowrap text-on-primary transition-[background-color,transform] duration-300 ease-[var(--ease-out-house)] hover:bg-primary-hover active:scale-[0.98]"
            >
              {CTA}
              <ArrowRight size={16} aria-hidden className="hidden sm:block" />
            </Link>
          </div>
        </div>
      </nav>

      <main id="isi" className="flex flex-col">
        {/* Hero: latar biru lembut + mockup HP */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.07] to-transparent" />
            <div className="absolute -top-24 right-[-10%] size-[520px] rounded-full bg-primary/15 blur-3xl lg:size-[640px]" />
            <div className="absolute top-1/3 -left-40 size-[360px] rounded-full bg-primary/[0.08] blur-3xl" />
          </div>
          <div className={`${wadah} grid items-center gap-10 pt-24 pb-10 lg:grid-cols-[7fr_5fr] lg:gap-8 lg:pt-28 lg:pb-12`}>
            <div className="flex flex-col gap-6">
              <p className="caption-4 flex w-fit items-center gap-2 rounded-full bg-accent-soft px-3 py-1.5 text-text">
                <Trophy size={16} weight="fill" aria-hidden className="text-accent" />
                SKD CPNS · Simulasi CAT di HP
              </p>
              <h1 className="heading-3 sm:heading-2 lg:heading-1 text-balance tracking-tight">
                Latihan SKD yang terasa seperti{" "}
                <span className="relative inline-block whitespace-nowrap text-primary">
                  ujian CAT
                  <svg
                    aria-hidden
                    viewBox="0 0 200 12"
                    preserveAspectRatio="none"
                    className="absolute -bottom-2 left-0 h-3 w-full text-accent"
                  >
                    <path d="M2 9 C 50 2, 120 2, 198 7" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                </span>{" "}
                sesungguhnya.
              </h1>
              <p className="body-3 max-w-[560px] text-pretty text-text-muted sm:text-lg">
                Soal orisinal dengan pembahasan tiap pilihan, timer seperti di ruang tes, dan skor per subtes yang
                langsung keluar. Belajar lebih terarah sebelum hari ujian.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/try-out" className={`${tombolUtama} h-14 px-6 sm:w-fit`}>
                  {CTA}
                  <ArrowRight size={20} aria-hidden />
                </Link>
                {soalContoh && (
                  <a
                    href="#contoh-soal"
                    className="button-md flex h-14 items-center justify-center gap-2 rounded-lg border-2 border-primary bg-surface px-6 text-primary transition-[background-color,transform] duration-300 ease-[var(--ease-out-house)] hover:bg-primary/5 active:scale-[0.98] sm:w-fit"
                  >
                    <PlayCircle size={20} weight="fill" aria-hidden />
                    Lihat Contoh Soal
                  </a>
                )}
              </div>
              <ul className="caption-4 flex flex-wrap gap-x-4 gap-y-2 text-text-muted">
                {["Paket pertama gratis", "Tanpa daftar akun", "Jawaban tersimpan otomatis"].map((t) => (
                  <li key={t} className="flex items-center gap-1">
                    <CheckCircle size={16} weight="fill" aria-hidden className="text-success" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            {soalHero && (
              <div className="relative mx-auto w-full max-w-[340px] lg:mr-0">
                <Kilau className="absolute -top-6 -right-4 z-10 size-14 text-accent" />
                <div className="relative lg:rotate-[4deg]">
                  <div className="overflow-hidden rounded-[2.75rem] border-[10px] border-neutral-900 bg-surface shadow-[0_30px_60px_-20px_rgba(30,64,175,0.35)] ring-1 ring-border [mask-image:linear-gradient(to_bottom,black_82%,transparent)] dark:border-neutral-700">
                    <div className="flex items-center justify-between px-5 pt-3 pb-1">
                      <span className="title-4">SoalSKD</span>
                      <span aria-hidden className="h-5 w-20 rounded-full bg-neutral-900 dark:bg-neutral-700" />
                      <span className="caption-4 rounded-full bg-surface-muted px-2 py-0.5 text-text-muted">Paket 1</span>
                    </div>
                    <div className="max-h-[540px] overflow-hidden">
                      <PratinjauUjian soal={soalHero} data={data} tanpaBingkai />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Strip angka */}
          <div className={`${wadah} pb-12 lg:pb-16`}>
            <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border shadow-[0_8px_30px_-12px_rgba(30,64,175,0.18)] lg:grid-cols-4">
              {angka.map(({ ikon: Ikon, nilai, label }) => (
                <li key={label} className="flex items-center gap-3 bg-surface p-4 sm:p-5">
                  <Ikon size={28} weight="duotone" aria-hidden className="shrink-0 text-primary" />
                  <span className="flex min-w-0 flex-col">
                    <span className="title-2 font-semibold tabular-nums">{nilai}</span>
                    <span className="caption-4 text-text-muted">{label}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Masalah → solusi */}
        <section aria-labelledby="judul-masalah" className="py-8 lg:py-12">
          <Muncul className={`${wadah} grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr]`}>
            <div className="relative flex overflow-hidden rounded-2xl border border-border bg-surface p-6 sm:p-8">
              <div className="relative z-10 flex flex-col gap-5 sm:pr-16">
                <h2 id="judul-masalah" className="heading-6 sm:heading-5 max-w-[260px] text-balance">
                  Masih belajar CPNS seperti ini?
                </h2>
                <ul className="flex flex-col gap-3">
                  {masalah.map((t) => (
                    <li key={t} className="body-6 flex items-center gap-3 text-text sm:text-base">
                      <XCircle size={22} weight="fill" aria-hidden className="shrink-0 text-danger/80" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <SmileyNervous
                size={120}
                weight="duotone"
                aria-hidden
                className="absolute -right-4 -bottom-4 text-text-muted/15"
              />
            </div>
            <span
              aria-hidden
              className="flex size-12 items-center justify-center self-center justify-self-center rounded-full border border-border bg-surface text-primary max-lg:rotate-90"
            >
              <ArrowRight size={22} />
            </span>
            <div className="relative flex overflow-hidden rounded-2xl border border-primary/20 bg-primary/[0.06] p-6 sm:p-8">
              <div className="relative z-10 flex flex-col gap-5 sm:pr-16">
                <h2 className="heading-6 sm:heading-5 max-w-[260px] text-balance">Di SoalSKD, latihannya begini.</h2>
                <ul className="flex flex-col gap-3">
                  {solusi.map((t) => (
                    <li key={t} className="body-6 flex items-center gap-3 text-text sm:text-base">
                      <CheckCircle size={22} weight="fill" aria-hidden className="shrink-0 text-success" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <SmileyWink
                size={120}
                weight="duotone"
                aria-hidden
                className="absolute -right-4 -bottom-4 text-primary/20"
              />
            </div>
          </Muncul>
        </section>

        {/* Keunggulan */}
        <section id="keunggulan" aria-labelledby="judul-keunggulan" className="scroll-mt-20 py-12 lg:py-16">
          <Muncul className={`${wadah} flex flex-col gap-8`}>
            <h2 id="judul-keunggulan" className={`${judulSection} text-center`}>
              Kenapa latihan di SoalSKD?
            </h2>
            <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {keunggulan.map(({ ikon: Ikon, warna, judul, isi }) => (
                <li
                  key={judul}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-center transition-transform duration-300 ease-[var(--ease-out-house)] hover:-translate-y-1 sm:p-6"
                >
                  <span className={`flex size-14 items-center justify-center rounded-2xl ${warna}`}>
                    <Ikon size={30} weight="duotone" aria-hidden />
                  </span>
                  <h3 className="title-3 font-semibold text-balance">{judul}</h3>
                  <p className="body-6 text-pretty text-text-muted">{isi}</p>
                </li>
              ))}
            </ul>
          </Muncul>
        </section>

        {/* Cara kerja: garis langkah */}
        <section id="cara-kerja" aria-labelledby="judul-cara-kerja" className="scroll-mt-20 py-12 lg:py-16">
          <Muncul className={wadah}>
            <div className="grid gap-6 rounded-2xl border border-primary/15 bg-primary/[0.05] p-6 sm:p-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,5fr)] lg:items-center">
              <div className="flex items-center gap-4">
                <ChartLineUp size={36} weight="duotone" aria-hidden className="shrink-0 text-primary" />
                <h2 id="judul-cara-kerja" className="title-2 font-semibold text-balance">
                  Semakin sering latihan, semakin siap menghadapi CAT.
                </h2>
              </div>
              <ol className="relative grid gap-5 sm:grid-cols-4 sm:gap-2">
                <span aria-hidden className="absolute top-4 bottom-4 left-4 w-0.5 bg-primary/30 sm:top-4 sm:right-[12.5%] sm:bottom-auto sm:left-[12.5%] sm:h-0.5 sm:w-auto" />
                {langkah.map((l, i) => {
                  const akhir = i === langkah.length - 1;
                  return (
                    <li key={l.judul} className="relative flex items-start gap-3 sm:flex-col sm:items-center sm:text-center">
                      <span
                        aria-hidden
                        className={`relative flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-surface ${
                          akhir ? "bg-accent text-on-accent" : "bg-primary text-on-primary"
                        }`}
                      >
                        {akhir ? <Star size={16} weight="fill" /> : <Check size={16} weight="bold" />}
                      </span>
                      <span className="flex flex-col gap-0.5">
                        <span className="title-3 font-semibold">
                          <span className="sr-only">Langkah {i + 1}: </span>
                          {l.judul}
                        </span>
                        <span className="caption-4 text-pretty text-text-muted">{l.isi}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </Muncul>
        </section>

        {/* Apa itu SKD: penjelasan untuk orang yang baru pertama kali dengar */}
        <section id="apa-itu-skd" aria-labelledby="judul-skd" className="scroll-mt-20 py-16 lg:py-24">
          <Muncul className={`${wadah} flex flex-col gap-8`}>
            <div className="flex max-w-[680px] flex-col gap-3">
              <h2 id="judul-skd" className={judulSection}>
                Baru dengar SKD? Ini ringkasannya
              </h2>
              <p className="body-3 text-pretty text-text-muted">
                SKD (Seleksi Kompetensi Dasar) berisi <span className="mono-number text-text">{data.soalPerPaket}</span>{" "}
                soal pilihan ganda yang terbagi tiga bagian. Setiap bagian dinilai sendiri-sendiri.
              </p>
            </div>
            <ul className="grid gap-4 md:grid-cols-3">
              {data.komposisi.map((s) => {
                const b = BAGIAN_SKD[s.kode];
                return (
                  <li key={s.kode} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-6">
                    <span className="title-4 w-fit rounded-md bg-surface-muted px-2 py-1 font-mono text-primary">
                      {s.kode}
                    </span>
                    <h3 className="title-3">{b?.nama ?? s.kode}</h3>
                    {b && (
                      <p className="body-6 text-pretty text-text-muted">
                        <span className="text-text">{b.menguji}</span> {b.contoh}
                      </p>
                    )}
                    <p className="caption-4 mt-auto border-t border-border pt-3 text-text-muted">
                      <span className="mono-number text-text">{s.jumlah}</span> soal ·{" "}
                      {s.kode === "TKP"
                        ? "setiap pilihan punya nilai, tidak ada yang nol"
                        : `benar ${data.nilaiBenar} poin, salah 0`}
                    </p>
                  </li>
                );
              })}
            </ul>
            <p className="body-6 flex max-w-[680px] items-start gap-3 rounded-xl bg-surface-muted p-4 text-pretty text-text">
              <ChartBar size={20} aria-hidden className="mt-0.5 shrink-0 text-primary" />
              <span>
                Supaya lolos, nilai <strong className="font-semibold">ketiga bagian</strong> harus mencapai batas
                minimal yang disebut <em>passing grade</em>. Nilai TIU yang tinggi tidak bisa menutup nilai TWK yang
                kurang.{" "}
                {ambangTeks
                  ? `Batas yang kami pakai: ${ambangTeks}.`
                  : "Angkanya ditetapkan pemerintah tiap tahun; cek aturan BKN dan KemenPAN-RB terbaru."}
              </span>
            </p>
          </Muncul>
        </section>

        {/* Cara membaca layar ujian: pratinjau bernomor + keterangan */}
        {soalHero && (
          <section id="cara-baca" aria-labelledby="judul-cara-baca" className="scroll-mt-20 py-16 lg:py-24">
            <Muncul className={`${wadah} flex flex-col gap-8`}>
              <div className="flex max-w-[680px] flex-col gap-3">
                <h2 id="judul-cara-baca" className={judulSection}>
                  Cara membaca layar ujian
                </h2>
                <p className="body-3 text-pretty text-text-muted">
                  Pertama kali melihatnya mungkin terasa ramai. Cocokkan nomor bulat di gambar dengan keterangan
                  bernomor sama.
                </p>
              </div>
              <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-16">
                <PratinjauUjian soal={soalHero} data={data} beranotasi />
                <CaraBaca soal={soalHero} data={data} />
              </div>
            </Muncul>
          </section>
        )}

        {/* Contoh soal + pratinjau hasil */}
        {soalContoh && (
          <section id="contoh-soal" aria-labelledby="judul-contoh" className="scroll-mt-20 py-16 lg:py-24">
            <Muncul className={`${wadah} flex flex-col gap-8`}>
              <div className="flex max-w-[680px] flex-col gap-3">
                <h2 id="judul-contoh" className={judulSection}>
                  Coba satu soal {soalContoh.kategori} sekarang
                </h2>
                <p className="body-3 text-pretty text-text-muted">
                  Pilih jawabanmu. Pembahasan muncul di bawahnya, termasuk alasan kenapa pilihan lain keliru.
                </p>
              </div>
              <div className="grid items-start gap-8 lg:grid-cols-2">
                <ContohSoal soal={soalContoh} />
                <div className="flex min-w-0 flex-col gap-4">
                  <h3 className="title-3">Setelah dikumpulkan, hasilmu terlihat seperti ini</h3>
                  <PratinjauHasil maks={data.komposisi.map((s) => ({ kode: s.kode, nilai: s.nilaiMaks }))} />
                  <ul className="body-6 flex flex-col gap-2 text-pretty text-text-muted">
                    <li>
                      <span className="text-text">Kotak Total</span> adalah jumlah nilai ketiga bagian.
                    </li>
                    <li>
                      <span className="text-text">Tiga kotak lainnya</span> adalah nilai tiap bagian. Angka kecil di
                      belakang garis miring adalah nilai tertinggi yang mungkin.
                    </li>
                    <li>
                      Di bawahnya ada pembahasan. Kamu bisa menyaring hanya soal yang salah, kosong, atau sempat
                      ditandai ragu.
                    </li>
                  </ul>
                  <p className="caption-4 text-text-muted">
                    Angka di atas hanya contoh. Format dan passing grade mengikuti konfigurasi; cek aturan BKN dan
                    KemenPAN-RB terbaru.
                  </p>
                </div>
              </div>
            </Muncul>
          </section>
        )}

        {/* Harga: tampil hanya jika sudah diisi di config/landing.ts */}
        {PENAWARAN && (
          <section id="harga" aria-labelledby="judul-harga" className="scroll-mt-20 py-16 lg:py-24">
            <Muncul className={`${wadah} flex flex-col gap-8`}>
              <div className="flex flex-col gap-3">
                <h2 id="judul-harga" className={judulSection}>
                  Semua paket latihan, harga satu gelas kopi
                </h2>
                <p className="body-3 max-w-[680px] text-pretty text-text-muted">
                  Kerjakan di HP, baca ulang pembahasannya lewat ebook. Belum yakin? Coba paket gratis dulu.
                </p>
              </div>

              <div className="grid overflow-hidden rounded-2xl border border-primary/40 bg-surface lg:grid-cols-[5fr_7fr]">
                <div className="flex flex-col gap-6 bg-primary/[0.06] p-6 sm:p-10">
                  <p className="caption-4 w-fit rounded-full bg-primary px-3 py-1 text-on-primary">{PENAWARAN.label}</p>
                  <div className="flex flex-col gap-2">
                    <h3 className="title-2">{PENAWARAN.nama}</h3>
                    <p className="heading-1 tracking-tight text-text tabular-nums">{PENAWARAN.harga}</p>
                    <p className="body-6 text-text-muted">Sekali bayar untuk seluruh isi bundel.</p>
                  </div>
                  <div className="mt-auto flex flex-col gap-3">
                    {TAUTAN_BELI ? (
                      <a href={TAUTAN_BELI} target="_blank" rel="noopener" className={`${tombolUtama} w-full`}>
                        <ShoppingBag size={20} aria-hidden />
                        Beli bundel {PENAWARAN.harga}
                      </a>
                    ) : (
                      <span
                        role="link"
                        aria-disabled="true"
                        className="button-md flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-surface-muted px-4 text-text-muted"
                      >
                        <ShoppingBag size={20} aria-hidden />
                        Pembelian segera dibuka
                      </span>
                    )}
                    {data.soalGratis > 0 && (
                      <Link href={`/ujian/${PAKET_GRATIS}`} className={`${tombolKedua} w-full`}>
                        <Gift size={20} aria-hidden className="text-primary" />
                        Coba {data.soalGratis} soal gratis
                      </Link>
                    )}
                    {LOGIN_AKTIF && (
                      <Link
                        href="/aktivasi"
                        className="title-4 flex h-11 items-center justify-center rounded-lg text-text-muted hover:text-text"
                      >
                        Sudah bayar? Masukkan kode aktivasi
                      </Link>
                    )}
                  </div>
                </div>

                <ul className="flex flex-col gap-6 border-t border-border p-6 sm:p-10 lg:border-t-0 lg:border-l">
                  {PENAWARAN.isi.map((x) => (
                    <li key={x.judul} className="flex items-start gap-4">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <CheckCircle size={20} weight="fill" aria-hidden />
                      </span>
                      <span className="flex flex-col gap-1">
                        <span className="title-3">{x.judul}</span>
                        <span className="body-6 text-text-muted">{x.detail}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Muncul>
          </section>
        )}

        {/* Testimoni: tampil hanya jika sudah ada testimoni asli di config/landing.ts */}
        {TESTIMONI.length > 0 && (
          <section aria-labelledby="judul-testimoni" className="py-16 lg:py-24">
            <Muncul className={`${wadah} flex flex-col gap-8`}>
              <h2 id="judul-testimoni" className={judulSection}>
                Kata mereka yang sudah mencoba
              </h2>
              <ul className="grid gap-4 md:grid-cols-3">
                {TESTIMONI.map((t) => (
                  <li key={t.nama}>
                    <figure className="flex h-full flex-col gap-4 rounded-xl border border-border bg-surface p-6">
                      <blockquote className="body-3 text-pretty text-text">{t.kutipan}</blockquote>
                      <figcaption className="mt-auto flex flex-col">
                        <span className="title-4">{t.nama}</span>
                        <span className="caption-4 text-text-muted">{t.keterangan}</span>
                      </figcaption>
                    </figure>
                  </li>
                ))}
              </ul>
            </Muncul>
          </section>
        )}

        {/* FAQ */}
        <section id="faq" aria-labelledby="judul-faq" className="scroll-mt-20 py-16 lg:py-24">
          <Muncul className={`${wadah} grid gap-8 lg:grid-cols-[1fr_2fr]`}>
            <h2 id="judul-faq" className={judulSection}>
              Pertanyaan yang sering muncul
            </h2>
            <div className="flex flex-col gap-3">
              {faq.map((f) => (
                <details key={f.t} className="group rounded-xl border border-border bg-surface">
                  <summary className="title-3 flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 rounded-xl p-4 transition-colors duration-300 ease-[var(--ease-out-house)] hover:bg-surface-muted [&::-webkit-details-marker]:hidden">
                    {f.t}
                    <CaretDown
                      size={20}
                      aria-hidden
                      className="shrink-0 text-text-muted transition-transform duration-300 ease-[var(--ease-out-house)] group-open:rotate-180"
                    />
                  </summary>
                  <p className="body-6 px-4 pb-4 text-pretty text-text-muted">{f.j}</p>
                </details>
              ))}
            </div>
          </Muncul>
        </section>

        {/* CTA penutup: banner biru */}
        <section aria-labelledby="judul-penutup" className="py-12 lg:py-16">
          <Muncul className={wadah}>
            <div className="relative grid gap-6 overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-hover p-6 text-on-primary dark:from-blue-800 dark:to-blue-950 dark:text-white shadow-[0_30px_60px_-25px_rgba(30,64,175,0.6)] sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-10">
              <div aria-hidden className="pointer-events-none absolute -top-20 -right-20 size-64 rounded-full bg-on-primary/10 blur-2xl" />
              <Kilau className="absolute top-3 right-4 size-12 text-accent" />
              <div className="relative flex flex-col items-start gap-3">
                <p className="caption-4 flex w-fit items-center gap-2 rounded-full bg-accent px-4 py-2 text-on-accent sm:text-sm">
                  <Megaphone size={20} weight="fill" aria-hidden />
                  Jangan tunggu sampai hari ujian!
                </p>
                <h2 id="judul-penutup" className="heading-5 sm:heading-4 text-balance">
                  Siap menghadapi <span className="text-accent">SKD</span>?
                </h2>
                <p className="body-3 max-w-[480px] text-pretty opacity-90">
                  Mulai dengan paket gratis hari ini. Semakin cepat latihan, semakin terbiasa dengan waktunya.
                </p>
              </div>
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center lg:border-l lg:border-on-primary/25 lg:pl-10">
                {PENAWARAN && (
                  <p className="flex flex-col">
                    <span className="caption-4 opacity-90">Bundel lengkap</span>
                    <span className="heading-4 tracking-tight text-accent tabular-nums">{PENAWARAN.harga}</span>
                  </p>
                )}
                <Link
                  href="/try-out"
                  className="button-md flex h-14 items-center justify-center gap-2 rounded-full bg-surface px-6 whitespace-nowrap text-text transition-transform duration-300 ease-[var(--ease-out-house)] hover:scale-[1.03] active:scale-[0.98]"
                >
                  Mulai Sekarang
                  <ArrowRight size={20} aria-hidden />
                </Link>
              </div>
            </div>
          </Muncul>
        </section>
      </main>

      <footer className="border-t border-border bg-surface py-10">
        <div className={`${wadah} flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between`}>
          <div className="flex max-w-md flex-col gap-3">
            <Logo />
            <p className="title-4 text-text">Belajar lebih terarah sebelum hari ujian.</p>
            <p className="caption-4 text-pretty text-text-muted">
              Soal latihan orisinal, bukan soal resmi BKN. Format dan passing grade mengikuti konfigurasi; cek aturan BKN
              dan KemenPAN-RB terbaru.
            </p>
          </div>
          <ul className="flex flex-wrap gap-2">
            {[
              ["/try-out", "Try out"],
              ["#contoh-soal", "Contoh soal"],
              ["#faq", "FAQ"],
              ["/privasi", "Privasi"],
              ["/syarat", "Syarat"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="title-4 block rounded-lg px-3 py-2 text-text-muted hover:text-text">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </footer>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}

/** Logo: kotak biru berisi ikon + nama. */
function Logo() {
  return (
    <Link href="/" className="-ml-1 flex items-center gap-2 rounded-lg px-1 py-1 text-text">
      <span aria-hidden className="flex size-8 items-center justify-center rounded-lg bg-primary text-on-primary">
        <Exam size={20} weight="fill" />
      </span>
      <span className="title-2 font-bold tracking-tight">SoalSKD</span>
    </Link>
  );
}

/** Tiga garis kilau dekoratif (aksen kuning) di pojok mockup dan banner. */
function Kilau({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 48 48" fill="none" className={className}>
      <path d="M12 22 L18 6" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M24 28 L42 16" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M28 40 L44 38" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/** Nomor soal yang ditampilkan di pratinjau: soal ke-7 di bagian soal tersebut. */
function nomorPratinjau(soal: Omit<SoalUjian, "id">, data: DataLanding) {
  const sebelum = data.komposisi.slice(0, data.komposisi.findIndex((s) => s.kode === soal.kategori));
  return sebelum.reduce((n, s) => n + s.jumlah, 0) + 7;
}

/** Keterangan bernomor untuk pratinjau layar ujian (pasangan `PratinjauUjian beranotasi`). */
function CaraBaca({ soal, data }: { soal: Omit<SoalUjian, "id">; data: DataLanding }) {
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
function PratinjauUjian({
  soal,
  data,
  beranotasi = false,
  tanpaBingkai = false,
}: {
  soal: Omit<SoalUjian, "id">;
  data: DataLanding;
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
