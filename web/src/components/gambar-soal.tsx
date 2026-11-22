import type { GambarSoal as Gambar } from "@/lib/soal";

/**
 * Gambar soal TIU figural (SVG dari bank, sudah berupa data URI). SVG membawa latar putihnya sendiri,
 * jadi tetap terbaca di tema gelap. Lebar penuh kolom soal di HP, dibatasi di layar lebar.
 */
export function GambarSoal({ gambar }: { gambar: Gambar[] }) {
  if (gambar.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      {gambar.map((g) => (
        // eslint-disable-next-line @next/next/no-img-element -- data URI SVG; next/image tidak menambah apa pun
        <img
          key={g.src.slice(-32)}
          src={g.src}
          alt={g.alt}
          className="h-auto w-full max-w-xl rounded-lg border border-border"
        />
      ))}
    </div>
  );
}
