/**
 * Kelas tombol aplikasi (DESIGN.md: button-primary / button-secondary, tinggi 48px, rounded.md).
 * Satu sumber untuk layar try out, ujian, hasil, dan akun. Landing memakai ukuran teks `button-md`
 * lewat `tombolBesar`. Modul biasa (bukan client), jadi bisa dipakai server component.
 */
export const tombolDasar =
  "flex h-12 items-center justify-center gap-2 rounded-lg px-4 title-4 transition-[background-color,transform,opacity] duration-200 ease-[var(--ease-out-house)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50";
export const tombolUtama = `${tombolDasar} bg-primary text-on-primary hover:bg-primary-hover`;
export const tombolSekunder = `${tombolDasar} border border-border bg-surface text-text hover:bg-surface-muted`;
/** Aksi yang belum bisa dipakai (mis. pembelian belum dibuka): tampil, tapi jelas tidak aktif. */
export const tombolNonaktif =
  "flex h-12 cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-surface-muted px-4 title-4 text-text-muted";
/** Landing: teks tombol 16px (`button-md`). */
export const tombolBesar = (kelas: string) => kelas.replace("title-4", "button-md");
