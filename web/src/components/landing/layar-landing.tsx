import {
  ArrowRight,
  BookOpen,
  CaretDown,
  ChartBar,
  ChartLineUp,
  CheckCircle,
  Flag,
  Timer,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { AMBANG_TIMER, DURASI_LATIHAN_MENIT_PER_SOAL } from "@/config/skd";
import { HARGA, TESTIMONI } from "@/config/landing";
import type { SoalPembahasan, SoalUjian } from "@/lib/soal";
import { ContohSoal, PratinjauHasil } from "./contoh-soal";
import { Muncul, TaglineBertahap } from "./gerak";

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
};

type Props = {
  data: DataLanding;
  soalHero: Omit<SoalUjian, "id"> | null;
  soalContoh: SoalPembahasan | null;
};

const CTA = "Mulai Try Out";
const tombolUtama =
  "button-md flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-on-primary transition-[background-color,transform] duration-300 ease-[var(--ease-out-house)] hover:bg-primary-hover active:scale-[0.98]";
const wadah = "mx-auto w-full max-w-5xl px-4";
const judulSection = "heading-4 lg:heading-3 text-balance";

const gabung = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")}, dan ${xs.at(-1)}`);

export function LayarLanding({ data, soalHero, soalContoh }: Props) {
  const komposisi = gabung(data.komposisi.map((s) => `${s.jumlah} ${s.kode}`));
  const ambangTeks = data.ambang && gabung(data.ambang.map((a) => `${a.kode} ${a.nilai}`));

  const keunggulan = [
    {
      ikon: Timer,
      judul: "Timer seperti di ruang CAT",
      isi: `Waktu berjalan sejak soal pertama dan selalu terlihat di atas layar. Warnanya berubah saat sisa waktu tinggal ${AMBANG_TIMER.peringatan * 100} persen, lalu ${AMBANG_TIMER.kritis * 100} persen.`,
    },
    {
      ikon: ChartBar,
      judul: "Skor per subtes dan passing grade",
      isi: `TWK dan TIU bernilai ${data.nilaiBenar} poin per jawaban benar, TKP dinilai dari bobot pilihanmu. ${
        ambangTeks
          ? `Skor langsung dibandingkan dengan ambang batas ${ambangTeks}.`
          : "Perbandingan dengan passing grade aktif setelah angka resmi tahun ini diumumkan."
      }`,
    },
    {
      ikon: BookOpen,
      judul: "Pembahasan untuk tiap pilihan",
      isi: "Bukan hanya kunci. Setiap opsi yang keliru dijelaskan kenapa menjebak, lengkap dengan konsep dan tips mengerjakan.",
    },
    {
      ikon: ChartLineUp,
      judul: "Riwayat skor tiap percobaan",
      isi: "Ulangi paket kapan saja dan lihat apakah skormu naik. Riwayat tersimpan di perangkatmu.",
    },
  ];

  const langkah = [
    {
      judul: "Pilih paket",
      isi: `Satu paket berisi ${data.soalPerPaket} soal: ${komposisi}, mengikuti proporsi SKD CAT.`,
    },
    {
      judul: "Kerjakan dengan timer",
      isi: "Jawaban tersimpan otomatis. Tandai soal yang belum yakin, lalu kembali lewat grid nomor.",
    },
    {
      judul: "Kumpulkan dan pelajari",
      isi: "Lihat skor per subtes, lalu saring pembahasan untuk soal yang salah, kosong, atau sempat kamu tandai.",
    },
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
      j: "Belum perlu. Jawaban, sesi ujian, dan riwayat skor disimpan di browser perangkatmu. Kalau data browser dihapus atau kamu ganti perangkat, riwayatnya ikut hilang.",
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
      <a
        href="#isi"
        className="title-4 sr-only z-50 rounded-lg bg-primary px-4 py-3 text-on-primary focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Langsung ke isi
      </a>

      <nav
        aria-label="Utama"
        className="fixed top-3 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-border bg-surface/80 p-2 backdrop-blur-md"
      >
        <Link href="/" className="title-3 rounded-lg px-3 py-2 text-text">
          SoalSKD
        </Link>
        <ul className="hidden items-center md:flex">
          {[
            ["#keunggulan", "Keunggulan"],
            ["#cara-kerja", "Cara kerja"],
            ["#contoh-soal", "Contoh soal"],
            ["#faq", "FAQ"],
          ].map(([href, label]) => (
            <li key={href}>
              <a
                href={href}
                className="title-4 block rounded-lg px-3 py-2 text-text-muted transition-colors duration-300 ease-[var(--ease-out-house)] hover:bg-surface-muted hover:text-text"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
        <Link
          href="/try-out"
          className="title-4 flex h-10 items-center rounded-lg bg-primary px-3 whitespace-nowrap text-on-primary transition-[background-color,transform] duration-300 ease-[var(--ease-out-house)] hover:bg-primary-hover active:scale-[0.98]"
        >
          {CTA}
        </Link>
      </nav>

      <main id="isi" className="flex flex-col">
        {/* Hero */}
        <section className={`${wadah} grid items-center gap-12 pt-24 pb-16 lg:grid-cols-2 lg:gap-16 lg:pt-32 lg:pb-24`}>
          <div className="flex flex-col gap-6">
            <p className="caption-4 flex w-fit items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-text-muted">
              Try out SKD CPNS · TWK, TIU, TKP
            </p>
            <h1 className="teks-hero heading-3 sm:heading-2 max-w-[680px] pb-2 text-balance">
              Latihan SKD CPNS <br className="hidden sm:block" />
              dengan suasana ujian CAT
            </h1>
            <p className="body-3 max-w-[680px] text-pretty text-text-muted">
              Kerjakan TWK, TIU, dan TKP dengan timer berjalan, grid nomor soal, dan pembahasan untuk setiap pilihan
              jawaban. Langsung dari HP, tanpa daftar akun.
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/try-out" className={`${tombolUtama} w-full sm:w-fit`}>
                {CTA}
                <ArrowRight size={20} aria-hidden />
              </Link>
              {data.totalSoal > 0 && (
                <p className="caption-4 flex items-center gap-1 text-text-muted">
                  <CheckCircle size={16} weight="fill" aria-hidden className="text-primary" />
                  <span>
                    <span className="mono-number text-text">{data.totalSoal}</span> soal orisinal dalam{" "}
                    <span className="mono-number text-text">{data.jumlahPaket}</span> paket
                    {data.paketLengkap > 0 && (
                      <>
                        , <span className="mono-number text-text">{data.paketLengkap}</span> di antaranya paket
                        lengkap {data.soalPerPaket} soal
                      </>
                    )}
                  </span>
                </p>
              )}
            </div>
          </div>
          {soalHero && <PratinjauUjian soal={soalHero} data={data} />}
        </section>

        {/* Keunggulan */}
        <section id="keunggulan" aria-labelledby="judul-keunggulan" className="scroll-mt-20 py-16 lg:py-24">
          <Muncul className={`${wadah} flex flex-col gap-8`}>
            <div className="flex max-w-[680px] flex-col gap-3">
              <h2 id="judul-keunggulan" className={judulSection}>
                Yang kamu dapat di setiap paket
              </h2>
              <p className="body-3 text-pretty text-text-muted">
                Latihan yang berguna bukan sekadar menjawab soal, tapi juga membiasakan diri dengan waktu, skor, dan cara
                berpikir di balik jawaban.
              </p>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {keunggulan.map(({ ikon: Ikon, judul, isi }) => (
                <li key={judul} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-6">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-surface-muted text-primary">
                    <Ikon size={20} aria-hidden />
                  </span>
                  <h3 className="title-3">{judul}</h3>
                  <p className="body-6 text-pretty text-text-muted">{isi}</p>
                </li>
              ))}
            </ul>
          </Muncul>
        </section>

        {/* Tagline */}
        <section aria-label="Tagline" className="py-16 lg:py-24">
          <div className={wadah}>
            <TaglineBertahap
              className="heading-4 sm:heading-3 lg:heading-2 max-w-[680px] text-balance lg:max-w-4xl"
              baris={["Biasakan diri dengan tekanan waktu sekarang,", "supaya di ruang tes kamu cukup fokus pada soal."]}
            />
          </div>
        </section>

        {/* Cara kerja */}
        <section id="cara-kerja" aria-labelledby="judul-cara-kerja" className="scroll-mt-20 py-16 lg:py-24">
          <Muncul className={`${wadah} flex flex-col gap-8`}>
            <h2 id="judul-cara-kerja" className={judulSection}>
              Tiga langkah dari paket ke pembahasan
            </h2>
            <ol className="grid gap-4 md:grid-cols-3">
              {langkah.map((l, i) => (
                <li key={l.judul} className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-6">
                  <span
                    aria-hidden
                    className="mono-number flex size-8 items-center justify-center rounded-full bg-primary text-on-primary"
                  >
                    {i + 1}
                  </span>
                  <h3 className="title-3">{l.judul}</h3>
                  <p className="body-6 text-pretty text-text-muted">{l.isi}</p>
                </li>
              ))}
            </ol>
          </Muncul>
        </section>

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
        {HARGA && HARGA.length > 0 && (
          <section id="harga" aria-labelledby="judul-harga" className="scroll-mt-20 py-16 lg:py-24">
            <Muncul className={`${wadah} flex flex-col gap-8`}>
              <h2 id="judul-harga" className={judulSection}>
                Pilih paket latihanmu
              </h2>
              <ul className="grid gap-4 md:grid-cols-3">
                {HARGA.map((h) => (
                  <li key={h.nama} className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-6">
                    <h3 className="title-3">{h.nama}</h3>
                    <p className="heading-5 font-mono tabular-nums">{h.harga}</p>
                    <ul className="flex flex-col gap-2">
                      {h.isi.map((x) => (
                        <li key={x} className="body-6 flex items-start gap-2 text-text-muted">
                          <CheckCircle size={20} aria-hidden className="shrink-0 text-primary" />
                          {x}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
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

        {/* CTA penutup */}
        <section aria-labelledby="judul-penutup" className="py-16 lg:py-24">
          <Muncul className={wadah}>
            <div className="flex flex-col items-start gap-6 rounded-xl border border-border bg-surface p-6 sm:p-10 lg:items-center lg:p-16 lg:text-center">
              <h2 id="judul-penutup" className={`${judulSection} max-w-[680px]`}>
                Coba satu paket penuh, lalu lihat di mana kamu perlu berlatih
              </h2>
              <p className="body-3 max-w-[680px] text-pretty text-text-muted">
                Tanpa daftar akun. Jawabanmu tersimpan otomatis di perangkat, jadi kamu bisa berhenti dan melanjutkan
                kapan saja.
              </p>
              <Link href="/try-out" className={`${tombolUtama} w-full sm:w-fit`}>
                {CTA}
                <ArrowRight size={20} aria-hidden />
              </Link>
            </div>
          </Muncul>
        </section>
      </main>

      <footer className="border-t border-border py-10">
        <div className={`${wadah} flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between`}>
          <div className="flex max-w-md flex-col gap-2">
            <p className="title-3">SoalSKD</p>
            <p className="caption-4 text-pretty text-text-muted">
              Soal latihan orisinal, bukan soal resmi BKN. Format dan passing grade mengikuti konfigurasi; cek aturan BKN
              dan KemenPAN-RB terbaru.
            </p>
          </div>
          <ul className="flex gap-2">
            <li>
              <Link href="/try-out" className="title-4 block rounded-lg px-3 py-2 text-text-muted hover:text-text">
                Try out
              </Link>
            </li>
            <li>
              <a href="#faq" className="title-4 block rounded-lg px-3 py-2 text-text-muted hover:text-text">
                FAQ
              </a>
            </li>
          </ul>
        </div>
      </footer>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}

/** Pratinjau statis layar ujian untuk hero, memakai soal asli dari bank (tanpa kunci). */
function PratinjauUjian({ soal, data }: { soal: Omit<SoalUjian, "id">; data: DataLanding }) {
  const sebelum = data.komposisi.slice(0, data.komposisi.findIndex((s) => s.kode === soal.kategori));
  const nomor = sebelum.reduce((n, s) => n + s.jumlah, 0) + 7;
  const terpilih = soal.opsi[3]?.huruf;
  // Status 10 sel grid di sekitar soal aktif: d = dijawab, r = ragu, b = belum.
  const sel = ["d", "d", "d", "r", "d", "d", "a", "b", "b", "b"];
  return (
    <figure aria-label="Contoh tampilan layar ujian" className="mx-auto w-full max-w-md lg:max-w-none">
      <div aria-hidden className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <span className="title-4">
            {soal.kategori} · <span className="mono-number">{nomor}</span>
            <span className="mono-number text-text-muted">/{data.soalPerPaket}</span>
          </span>
          <span className="flex items-center gap-1">
            <Timer size={20} />
            <span className="mono-timer">01:12:48</span>
          </span>
        </div>
        <div className="flex flex-col gap-4 p-4">
          <p className="caption-4 flex items-center gap-1 text-text-muted">
            <CheckCircle size={16} /> Tersimpan
          </p>
          <p className="body-5">{soal.pertanyaan}</p>
          <ul className="flex flex-col gap-2">
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
            <p className="caption-4 text-text-muted">
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
          <span className="title-4 flex h-10 items-center justify-center gap-1 rounded-lg border border-border">
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
