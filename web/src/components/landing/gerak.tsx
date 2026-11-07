"use client";

import { useEffect, useRef, useState } from "react";

const reduksiGerak = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Section naik 32px dan muncul sekali saat masuk layar. Konten sudah terlihat di render server;
 * hanya elemen yang masih di bawah layar saat dimuat yang disembunyikan dulu.
 */
export function Muncul({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tahap, setTahap] = useState<"diam" | "tunggu" | "tampil">("diam");

  useEffect(() => {
    const el = ref.current;
    if (!el || reduksiGerak() || el.getBoundingClientRect().top < window.innerHeight) return;
    setTahap("tunggu");
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setTahap("tampil");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} ${tahap === "tunggu" ? "translate-y-8 opacity-0" : ""} ${
        tahap === "tampil" ? "transition-[opacity,transform] duration-700 ease-[var(--ease-out-house)]" : ""
      }`}
    >
      {children}
    </div>
  );
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
