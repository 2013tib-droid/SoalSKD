import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ReactNode } from "react";
import Markdown, { type Components, type ExtraProps } from "react-markdown";
import remarkGfm from "remark-gfm";
import { slug, type HalamanLegal } from "@/lib/legal";

/**
 * Layar teks panjang (/privasi, /syarat): satu kolom selebar `max-w-prose`, teks 16px,
 * daftar isi ber-anchor di atas. Server component, tanpa SDK Firebase.
 */

type Node = ExtraProps["node"];
function teksNode(n: Node | { type: string; value?: string; children?: unknown[] } | undefined): string {
  if (!n) return "";
  if ("value" in n && typeof n.value === "string") return n.value;
  return ((n as { children?: unknown[] }).children ?? []).map((c) => teksNode(c as Node)).join("");
}

const tautan = "text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary";

const komponen: Components = {
  h2: ({ node, children }) => (
    <h2 id={slug(teksNode(node))} className="title-2 mt-10 mb-3 scroll-mt-6 text-text first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => <h3 className="title-3 mt-6 mb-2 text-text">{children}</h3>,
  p: ({ children }) => <p className="mb-4">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-text">{children}</strong>,
  em: ({ children }) => <span className="font-medium">{children}</span>,
  ul: ({ children }) => <ul className="mb-4 list-disc pl-6 [&>li]:mt-2">{children}</ul>,
  ol: ({ children }) => <ol className="mb-4 list-decimal pl-6 [&>li]:mt-2">{children}</ol>,
  code: ({ children }) => <code className="font-mono text-[0.9em] break-words">{children}</code>,
  table: ({ children }) => (
    <div className="mb-4 overflow-x-auto rounded-lg border border-border">
      <table className="body-6 w-full border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="caption-4 border-b border-border bg-surface-muted px-3 py-2 text-left align-bottom">{children}</th>
  ),
  td: ({ children }) => <td className="border-b border-border px-3 py-2 align-top">{children}</td>,
  a: ({ href = "", children }) =>
    // Tautan internal lewat Link supaya basePath (build statis) ikut.
    href.startsWith("/") ? (
      <Link href={href} className={tautan}>
        {children}
      </Link>
    ) : (
      <a href={href} className={tautan} {...(href.startsWith("http") && { rel: "noopener noreferrer" })}>
        {children}
      </a>
    ),
  img: () => null,
};

export function LayarLegal({ judul, halaman, lain }: { judul: string; halaman: HalamanLegal; lain: { href: string; label: string } }) {
  return (
    <main id="atas" className="mx-auto flex min-h-dvh w-full max-w-prose flex-col gap-6 px-4 pt-6 pb-10">
      <header className="flex flex-col gap-1">
        <Link
          href="/"
          className="caption-4 -ml-2 flex h-11 items-center gap-1 self-start rounded-lg px-2 text-text-muted hover:bg-surface-muted"
        >
          <ArrowLeft size={16} aria-hidden />
          Halaman utama
        </Link>
        <h1 className="heading-5">{judul}</h1>
        <p className="caption-4 text-text-muted">{halaman.tanggal}</p>
      </header>

      <nav aria-labelledby="judul-daftar-isi" className="rounded-xl border border-border bg-surface p-4">
        <h2 id="judul-daftar-isi" className="title-4 text-text-muted">
          Daftar isi
        </h2>
        <ol className="mt-1 grid sm:grid-cols-2 sm:gap-x-4">
          {halaman.daftarIsi.map((b) => (
            <Item key={b.id} href={`#${b.id}`}>
              {b.judul}
            </Item>
          ))}
        </ol>
      </nav>

      <article className="body-5 text-pretty text-text">
        <Markdown remarkPlugins={[remarkGfm]} components={komponen} skipHtml>
          {halaman.md}
        </Markdown>
      </article>

      <footer className="flex flex-wrap items-center gap-x-4 border-t border-border pt-4">
        <Link href={lain.href} className={`title-4 flex min-h-11 items-center ${tautan}`}>
          {lain.label}
        </Link>
        <a href="#atas" className="title-4 flex min-h-11 items-center text-text-muted hover:text-text">
          Kembali ke atas
        </a>
      </footer>
    </main>
  );
}

function Item({ href, children }: { href: string; children: ReactNode }) {
  return (
    <li>
      <a href={href} className="body-6 flex min-h-11 items-center text-primary underline-offset-4 hover:underline">
        {children}
      </a>
    </li>
  );
}
