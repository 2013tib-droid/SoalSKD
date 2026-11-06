import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Teks soal dan pembahasan (Markdown GFM, tanpa HTML mentah, sesuai docs/skema-soal.md).
 * `sebaris`: paragraf dirender sebagai <span>, untuk dipakai di dalam tombol atau label.
 */
const blok: Components = {
  p: ({ children }) => <p className="[&:not(:last-child)]:mb-3">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  // House-style tanpa italic: penekanan miring dirender sebagai medium.
  em: ({ children }) => <span className="font-medium">{children}</span>,
  ol: ({ children }) => <ol className="mb-3 list-decimal pl-6 [&>li]:mt-1">{children}</ol>,
  ul: ({ children }) => <ul className="mb-3 list-disc pl-6 [&>li]:mt-1">{children}</ul>,
  table: ({ children }) => (
    <div className="mb-3 overflow-x-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="caption-4 border-b border-border px-3 py-2 text-left">{children}</th>,
  td: ({ children }) => <td className="border-b border-border px-3 py-2 tabular-nums">{children}</td>,
  code: ({ children }) => <code className="font-mono text-[0.95em]">{children}</code>,
  a: ({ children }) => <span>{children}</span>,
  img: () => null,
};

const sebaris: Components = { ...blok, p: ({ children }) => <span>{children}</span> };

export function TeksMd({ children, inline = false }: { children: string; inline?: boolean }) {
  return (
    <Markdown remarkPlugins={[remarkGfm]} components={inline ? sebaris : blok} skipHtml>
      {children}
    </Markdown>
  );
}
