"use client";

import { useEffect, useRef, useState } from "react";

const reduksiGerak = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Pembungkus section landing. Dulu section di bawah layar disembunyikan (opacity 0) sampai
 * di-scroll; akibatnya screenshot halaman penuh, cetak, dan alat audit melihat area kosong
 * (2026-11-24). Sekarang isi selalu terlihat sejak render server, tanpa animasi masuk.
 */
export function Muncul({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

/**
 * Tagline besar: tiap kata berubah dari redup ke warna penuh saat melewati garis 60% tinggi layar.
 * Satu listener scroll, di-throttle lewat requestAnimationFrame, hanya aktif saat section terlihat.
 */
export function TaglineBertahap({ baris, className = "" }: { baris: string[]; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [menyala, setMenyala] = useState<number | null>(null);
  const kata = baris.map((b) => b.split(" "));

  useEffect(() => {
    const el = ref.current;
    if (!el || reduksiGerak()) return;
    const span = Array.from(el.querySelectorAll<HTMLElement>("[data-kata]"));
    let frame = 0;
    const hitung = () => {
      frame = 0;
      const garis = window.innerHeight * 0.6;
      setMenyala(span.filter((s) => s.getBoundingClientRect().top < garis).length);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(hitung);
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) window.addEventListener("scroll", onScroll, { passive: true });
      else window.removeEventListener("scroll", onScroll);
    });
    hitung();
    io.observe(el);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  let i = 0;
  return (
    <p ref={ref} className={className}>
      {kata.map((b, n) => (
        <span key={n} className="block">
          {b.map((k, m) => {
            const nyala = menyala === null || i++ < menyala;
            return (
              <span
                key={m}
                data-kata
                className={`transition-opacity duration-500 ease-[var(--ease-out-house)] ${nyala ? "opacity-100" : "opacity-30"}`}
              >
                {k}
                {m < b.length - 1 ? " " : ""}
              </span>
            );
          })}
        </span>
      ))}
    </p>
  );
}
