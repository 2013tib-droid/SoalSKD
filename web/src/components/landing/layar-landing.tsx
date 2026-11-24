import {
  ArrowRight,
  BookOpen,
  CaretDown,
  ChartBar,
  Check,
  CheckCircle,
  ClockCountdown,
  Exam,
  Gift,
  Lightning,
  ListChecks,
  PlayCircle,
  ShoppingBag,
  Stack,
  Star,
  Student,
  Timer,
  XCircle,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { AMBANG_TIMER, DURASI_LATIHAN_MENIT_PER_SOAL } from "@/config/skd";
import { FITUR_BUNDEL, PAKET_GRATIS, PENAWARAN, TAUTAN_BELI, TESTIMONI } from "@/config/landing";
import type { SoalUjian } from "@/lib/soal";
import { MenuAkun } from "@/components/akun/menu-akun";
import { LOGIN_AKTIF } from "@/lib/firebase/klien";
import { BAGIAN_SKD, PratinjauHasil, PratinjauUjian } from "@/components/panduan/panduan-ujian";
import { tombolBesar, tombolNonaktif, tombolSekunder, tombolUtama as tombolUtamaApp } from "@/components/tombol";
import { EMAIL_KONTAK } from "@/config/legal";
import { PRODUK, type IdProduk } from "@/config/produk";
import { Muncul } from "./gerak";

export type DataLanding = {
  jumlahPaket: number;
  paketLengkap: number;
  totalSoal: number;
  soalPerPaket: number;
  durasiMenit: number;
  /** Aturan acuan durasi paket lengkap; null = durasi resmi belum diisi, pakai durasi latihan. */
  acuanDurasi: string | null;
  komposisi: { kode: string; jumlah: number; nilaiMaks: number }[];
  nilaiBenar: number;
  ambang: { kode: string; nilai: number }[] | null;
  soalGratis: number;
  /** Jumlah soal per bundel, dihitung dari bank. */
  soalProduk: Partial<Record<IdProduk, number>>;
};

type Props = {
  data: DataLanding;
  soalHero: Omit<SoalUjian, "id"> | null;
};

const CTA = "Mulai Try Out";
/** CTA utama landing: satu ajakan yang sama di hero dan banner penutup. */
const CTA_GRATIS = "Coba Try Out Gratis";
const tombolUtama = tombolBesar(tombolUtamaApp);
const tombolKedua = tombolBesar(tombolSekunder);
const wadah = "mx-auto w-full max-w-5xl px-4";
const judulSection = "heading-4 lg:heading-3 text-balance";

const gabung = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")}, dan ${xs.at(-1)}`);

export function LayarLanding({ data, soalHero }: Props) {
  const komposisi = gabung(data.komposisi.map((s) => `${s.jumlah} ${s.kode}`));
  const ambangTeks = data.ambang && gabung(data.ambang.map((a) => `${a.kode} ${a.nilai}`));

  // Ikon keunggulan semua biru: warna status (danger/success) hanya untuk timer, galat, dan hasil.
  const keunggulan = [
    {
      ikon: ListChecks,
      judul: "Komposisi seperti SKD",
      isi: `${komposisi} dalam satu paket. Soal ditulis sendiri, bukan salinan.`,
    },
    {
      ikon: Timer,
      judul: "Simulasi seperti CAT",
      isi: `Timer selalu terlihat dan berubah warna saat waktu tinggal ${AMBANG_TIMER.peringatan * 100}%.`,
    },
    {
      ikon: BookOpen,
      judul: "Pembahasan tiap pilihan",
      isi: "Tahu kenapa jawabanmu benar, dan kenapa pilihan lain menjebak.",
    },
    {
      ikon: ChartBar,
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
    { judul: "Lihat skor", isi: "Nilai TWK, TIU, TKP langsung keluar, lengkap dengan subtes yang perlu dikejar." },
    { judul: "Pelajari", isi: "Saring soal yang salah, kosong, atau ragu, lalu baca pembahasannya." },
  ];

  // Semua angka dari bank/ dan config/skd.json. Paket mini gratis dan simulasi lengkap dibedakan.
  const angka = [
    ...(data.totalSoal > 0 ? [{ ikon: Lightning, nilai: `${data.totalSoal}`, label: "Soal orisinal" }] : []),
    ...(data.paketLengkap > 0
      ? [{ ikon: Stack, nilai: `${data.paketLengkap}`, label: `Try out lengkap, ${data.soalPerPaket} soal` }]
      : []),
    { ikon: ClockCountdown, nilai: `${data.durasiMenit} menit`, label: "Per simulasi lengkap" },
    ...(data.soalGratis > 0
      ? [{ ikon: Gift, nilai: `${data.soalGratis} soal`, label: "Paket mini gratis, tanpa akun" }]
      : []),
  ];

  const faq = [
    {
      t: "Apakah soalnya sama dengan soal asli BKN?",
      j: "Tidak. Semua soal ditulis sendiri mengikuti format SKD. Tidak ada soal yang disalin dari buku atau aplikasi lain. SoalSKD adalah platform latihan independen dan tidak berafiliasi dengan BKN, KemenPAN-RB, atau SSCASN.",
    },
    {
      t: "Bagaimana soalnya disusun?",
      j: `Setiap paket lengkap memuat ${komposisi}, dengan campuran soal mudah, sedang, dan sulit. Setiap soal punya pembahasan untuk semua pilihan jawaban, dan soal TKP punya bobot untuk setiap pilihan. Sebelum terbit, setiap paket diperiksa otomatis: format, kunci jawaban, bobot TKP, dan jumlah soal per subtes.`,
    },
    {
      t: "Berapa soal dan berapa lama satu paket?",
      j: `Paket lengkap berisi ${data.soalPerPaket} soal (${komposisi}) dengan waktu ${data.durasiMenit} menit.${
        data.soalGratis > 0 && data.soalGratis < data.soalPerPaket
          ? ` Paket gratis adalah versi mini berisi ${data.soalGratis} soal dengan waktu ${data.soalGratis * DURASI_LATIHAN_MENIT_PER_SOAL} menit.`
          : ""
      }${
        data.acuanDurasi
          ? ` Durasinya mengikuti ${data.acuanDurasi}. Cek aturan BKN/KemenPAN-RB terbaru.`
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
    ...(PENAWARAN.length > 1
      ? [
          {
            t: "Apa bedanya Bundel 1 dan Bundel 2?",
            j: `Isinya berbeda. ${PENAWARAN.map((x) => `${x.nama.split(":")[0]} berisi ${x.isi.map((i) => i.judul).join(" dan ")}`).join(", sedangkan ")}. Soal di setiap paket tidak berulang, jadi keduanya bisa dikerjakan berurutan. Setiap bundel dibeli terpisah dengan kode aktivasinya sendiri, dan semua kode bisa ditukar di akun yang sama.`,
          },
        ]
      : []),
    ...(PENAWARAN.length > 0
      ? [
          {
            t: "Setelah membeli, bagaimana membuka paketnya?",
            j: "Setelah pembayaran berhasil, kode aktivasi dikirim ke emailmu. Masuk atau daftar di SoalSKD, buka halaman Aktivasi, lalu masukkan kodenya. Paket langsung terbuka di halaman Try Out, dan ebook PDF bisa diunduh dari halaman yang sama.",
          },
        ]
      : []),
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
              ["#cara-kerja", "Cara Kerja"],
              ...(PENAWARAN.length > 0 ? [["#harga", "Harga"]] : []),
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
            {/* Navigasi ke daftar paket, sengaja sekunder: CTA utama halaman ini "Coba Try Out Gratis" di hero. */}
            <Link
              href="/try-out"
              className="title-4 flex h-11 items-center gap-1 rounded-lg border border-border bg-surface px-3 whitespace-nowrap text-text transition-[background-color,transform] duration-300 ease-[var(--ease-out-house)] hover:bg-surface-muted active:scale-[0.98]"
            >
              Try Out
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
                <Student size={16} weight="fill" aria-hidden />
                Untuk calon peserta SKD CPNS
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
                Try out TWK, TIU, dan TKP dengan timer, skor per subtes, dan pembahasan untuk setiap pilihan jawaban.
                {data.soalGratis > 0 &&
                  ` Mulai dari ${data.soalGratis} soal gratis tanpa daftar${
                    data.paketLengkap > 0 ? `, lalu lanjut ke simulasi lengkap ${data.soalPerPaket} soal` : ""
                  }.`}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                {data.soalGratis > 0 && (
                  <Link href={`/ujian/${PAKET_GRATIS}`} className={`${tombolUtama} h-14 px-6 sm:w-fit`}>
                    <PlayCircle size={20} weight="fill" aria-hidden />
                    {CTA_GRATIS}
                  </Link>
                )}
                <Link
                  href={PENAWARAN.length > 0 ? "#harga" : "/try-out"}
                  className={`${data.soalGratis > 0 ? tombolKedua : tombolUtama} h-14 px-6 sm:w-fit`}
                >
                  Lihat Paket Latihan
                  <ArrowRight size={20} aria-hidden />
                </Link>
              </div>
              <ul className="caption-4 flex flex-wrap gap-x-4 gap-y-2 text-text-muted">
                {["Tanpa daftar akun untuk paket gratis", "Jawaban tersimpan otomatis", "Bisa di HP dan laptop"].map((t) => (
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
                      <span className="caption-4 rounded-full bg-surface-muted px-2 py-0.5 text-text-muted">Contoh</span>
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

        {/* Harga: satu kartu per bundel dari config/landing.ts (PENAWARAN); kosong = section disembunyikan */}
        {PENAWARAN.length > 0 && (
          <section id="harga" aria-labelledby="judul-harga" className="scroll-mt-20 py-16 lg:py-24">
            <Muncul className={`${wadah} flex flex-col gap-8`}>
              <div className="flex flex-col gap-3">
                <h2 id="judul-harga" className={judulSection}>
                  {PENAWARAN.length > 1 ? "Pilih bundelmu, harga satu gelas kopi" : "Semua paket latihan, harga satu gelas kopi"}
                </h2>
                <p className="body-3 max-w-[680px] text-pretty text-text-muted">
                  {PENAWARAN.length > 1
                    ? "Setiap bundel berisi tiga try out yang berbeda dan dibeli terpisah. Belum yakin? Coba paket gratis dulu."
                    : "Kerjakan di HP, baca ulang pembahasannya lewat ebook. Belum yakin? Coba paket gratis dulu."}
                </p>
              </div>

              <ul className={`grid gap-4 ${PENAWARAN.length > 1 ? "lg:grid-cols-2" : ""}`}>
                {PENAWARAN.map((x) => {
                  const beli = TAUTAN_BELI[x.produk];
                  return (
                    <li
                      key={x.produk}
                      className="flex flex-col overflow-hidden rounded-2xl border border-primary/40 bg-surface"
                    >
                      <div className="flex flex-col gap-4 bg-primary/[0.06] p-6 sm:p-8">
                        {x.label && (
                          <p className="caption-4 w-fit rounded-full bg-primary px-3 py-1 text-on-primary">{x.label}</p>
                        )}
                        <div className="flex flex-col gap-2">
                          <h3 className="title-2">{x.nama}</h3>
                          <p className="heading-2 tracking-tight text-text tabular-nums">{x.harga}</p>
                          <p className="body-6 text-text-muted">
                            Sekali bayar untuk {PRODUK[x.produk].paket.length} try out lengkap
                            {data.soalProduk[x.produk] ? (
                              <>
                                {" "}
                                · <span className="mono-number">{data.soalProduk[x.produk]}</span> soal
                              </>
                            ) : null}{" "}
                            + ebook PDF.
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col gap-6 border-t border-border p-6 sm:p-8">
                        <ul className="flex flex-col gap-5">
                          {x.isi.map((i) => (
                            <li key={i.judul} className="flex items-start gap-4">
                              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <CheckCircle size={20} weight="fill" aria-hidden />
                              </span>
                              <span className="flex flex-col gap-1">
                                <span className="title-3">{i.judul}</span>
                                <span className="body-6 text-pretty text-text-muted">{i.detail}</span>
                              </span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-auto">
                          {beli ? (
                            <a href={beli} target="_blank" rel="noopener" className={`${tombolUtama} w-full`}>
                              <ShoppingBag size={20} aria-hidden />
                              Beli {x.nama.split(":")[0]} {x.harga}
                            </a>
                          ) : (
                            <span role="link" aria-disabled="true" className={`${tombolBesar(tombolNonaktif)} w-full`}>
                              <ShoppingBag size={20} aria-hidden />
                              Pembelian segera dibuka
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="grid gap-8 rounded-2xl border border-border bg-surface p-6 sm:p-8 lg:grid-cols-2">
                <div className="flex flex-col gap-4">
                  <p className="title-3">{PENAWARAN.length > 1 ? "Di setiap bundel" : "Termasuk"}</p>
                  <ul className="flex flex-col gap-4">
                    {FITUR_BUNDEL.map((f) => (
                      <li key={f.judul} className="flex items-start gap-3">
                        <CheckCircle size={20} weight="fill" className="mt-0.5 shrink-0 text-primary" aria-hidden />
                        <span className="flex flex-col gap-1">
                          <span className="title-4">{f.judul}</span>
                          <span className="body-6 text-text-muted">{f.detail}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col gap-4 border-t border-border pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
                  <p className="title-3">Setelah membayar</p>
                  <ol className="flex flex-col gap-3">
                    {[
                      "Kode aktivasi dikirim ke emailmu.",
                      "Masuk atau daftar, lalu masukkan kode di halaman Aktivasi.",
                      "Paket terbuka di halaman Try Out, ebook PDF bisa diunduh di sana.",
                    ].map((t, i) => (
                      <li key={t} className="body-6 flex items-start gap-3 text-pretty">
                        <span
                          aria-hidden
                          className="caption-4 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-primary"
                        >
                          {i + 1}
                        </span>
                        <span>
                          <span className="sr-only">Langkah {i + 1}: </span>
                          {t}
                        </span>
                      </li>
                    ))}
                  </ol>
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
            </Muncul>
          </section>
        )}

        {/* Masalah → solusi */}
        <section aria-labelledby="judul-masalah" className="py-8 lg:py-12">
          <Muncul className={`${wadah} grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr]`}>
            <div className="relative flex overflow-hidden rounded-2xl border border-border bg-surface p-6 sm:p-8">
              <div className="relative z-10 flex flex-col gap-5">
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
            </div>
            <span
              aria-hidden
              className="flex size-12 items-center justify-center self-center justify-self-center rounded-full border border-border bg-surface text-primary max-lg:rotate-90"
            >
              <ArrowRight size={22} />
            </span>
            <div className="relative flex overflow-hidden rounded-2xl border border-primary/20 bg-primary/[0.06] p-6 sm:p-8">
              <div className="relative z-10 flex flex-col gap-5">
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
              {keunggulan.map(({ ikon: Ikon, judul, isi }) => (
                <li
                  key={judul}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-center sm:p-6"
                >
                  <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
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
          <Muncul className={`${wadah} grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-12`}>
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-3">
                <h2 id="judul-cara-kerja" className={judulSection}>
                  Kerjakan, lihat skor, lalu pelajari yang keliru
                </h2>
                <p className="body-3 max-w-[560px] text-pretty text-text-muted">
                  Hasil tidak berhenti di angka. Kamu tahu subtes mana yang perlu dikejar dan soal mana yang perlu dibaca
                  ulang.
                </p>
              </div>
              <ol className="relative flex flex-col gap-5">
                <span aria-hidden className="absolute top-4 bottom-4 left-4 w-0.5 bg-primary/30" />
                {langkah.map((l, i) => {
                  const akhir = i === langkah.length - 1;
                  return (
                    <li key={l.judul} className="relative flex items-start gap-3">
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
                        <span className="body-6 text-pretty text-text-muted">{l.isi}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
            <PratinjauHasil komposisi={data.komposisi} nilaiBenar={data.nilaiBenar} />
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

        {/* CTA penutup: banner biru */}
        <section aria-labelledby="judul-penutup" className="py-12 lg:py-16">
          <Muncul className={wadah}>
            <div className="relative grid gap-6 overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-hover p-6 text-on-primary dark:from-blue-800 dark:to-blue-950 dark:text-white shadow-[0_30px_60px_-25px_rgba(30,64,175,0.6)] sm:p-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-10">
              <div aria-hidden className="pointer-events-none absolute -top-20 -right-20 size-64 rounded-full bg-on-primary/10 blur-2xl" />
              <Kilau className="absolute top-3 right-4 size-12 text-accent" />
              <div className="relative flex flex-col items-start gap-3">
                <p className="caption-4 flex w-fit items-center gap-2 rounded-full bg-accent px-4 py-2 text-on-accent sm:text-sm">
                  <Gift size={20} weight="fill" aria-hidden />
                  Mulai dari paket gratis
                </p>
                <h2 id="judul-penutup" className="heading-5 sm:heading-4 text-balance">
                  Siap menghadapi <span className="text-accent">SKD</span>?
                </h2>
                <p className="body-3 max-w-[480px] text-pretty opacity-90">
                  Kerjakan paket mini tanpa daftar akun. Kalau cocok, lanjut ke simulasi lengkap dengan pembahasannya.
                </p>
              </div>
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center lg:border-l lg:border-on-primary/25 lg:pl-10">
                {PENAWARAN.length > 0 && (
                  <p className="flex flex-col">
                    <span className="caption-4 opacity-90">
                      {PENAWARAN.length === 1
                        ? "Bundel lengkap"
                        : PENAWARAN.every((x) => x.harga === PENAWARAN[0].harga)
                          ? "Per bundel"
                          : "Mulai dari"}
                    </span>
                    <span className="heading-4 tracking-tight text-accent tabular-nums">{PENAWARAN[0].harga}</span>
                  </p>
                )}
                <Link
                  href={data.soalGratis > 0 ? `/ujian/${PAKET_GRATIS}` : "/try-out"}
                  className="button-md flex h-14 items-center justify-center gap-2 rounded-lg bg-surface px-6 whitespace-nowrap text-text transition-[background-color,transform] duration-300 ease-[var(--ease-out-house)] hover:bg-surface-muted active:scale-[0.98]"
                >
                  {data.soalGratis > 0 ? CTA_GRATIS : CTA}
                  <ArrowRight size={20} aria-hidden />
                </Link>
              </div>
            </div>
          </Muncul>
        </section>
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

      </main>

      <footer className="border-t border-border bg-surface py-10">
        <div className={`${wadah} flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between`}>
          <div className="flex max-w-md flex-col gap-3">
            <Logo />
            <p className="title-4 text-text">Belajar lebih terarah sebelum hari ujian.</p>
            <p className="caption-4 text-pretty text-text-muted">
              SoalSKD adalah platform latihan independen dan tidak berafiliasi dengan BKN, KemenPAN-RB, maupun SSCASN.
              Soal latihan orisinal, bukan soal resmi. Format dan passing grade mengikuti konfigurasi; cek aturan BKN dan
              KemenPAN-RB terbaru.
            </p>
            {EMAIL_KONTAK && (
              <p className="caption-4 text-text-muted">
                Bantuan:{" "}
                <a href={`mailto:${EMAIL_KONTAK}`} className="text-primary underline-offset-4 hover:underline">
                  {EMAIL_KONTAK}
                </a>
              </p>
            )}
          </div>
          <ul className="flex flex-wrap gap-2">
            {[
              ["/try-out", "Try out"],
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
