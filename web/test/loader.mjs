// Memuat modul TypeScript web/src langsung dengan Node (type stripping bawaan Node 22)
// untuk tes tanpa Next.js: alias "@/…" → src/…, "server-only" → modul kosong,
// impor tanpa ekstensi → .ts. Hanya untuk modul tanpa JSX.
import { register } from 'node:module';

register(
  'data:text/javascript,' +
    encodeURIComponent(`
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
const SRC = ${JSON.stringify(new URL('../src/', import.meta.url).href)};
function coba(base) {
  for (const akhir of ['', '.ts', '/index.ts']) {
    const u = new URL(base + akhir);
    if (existsSync(fileURLToPath(u)) && !fileURLToPath(u).endsWith('/')) return u.href;
  }
  return null;
}
export async function resolve(spec, ctx, next) {
  if (spec === 'server-only') return { url: 'data:text/javascript,export{}', shortCircuit: true };
  if (spec.startsWith('@/')) {
    const u = coba(SRC + spec.slice(2));
    if (u) return { url: u, shortCircuit: true, format: 'module-typescript' };
  }
  if ((spec.startsWith('./') || spec.startsWith('../')) && ctx.parentURL?.startsWith('file:') && ctx.parentURL.endsWith('.ts')) {
    const u = coba(new URL(spec, ctx.parentURL).href);
    if (u) return { url: u, shortCircuit: true, format: 'module-typescript' };
  }
  return next(spec, ctx);
}
`),
);
