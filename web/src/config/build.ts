/**
 * Build statis untuk GitHub Pages (dev saja): `STATIK=1 npm run build`.
 * Di mode ini tidak ada server, jadi kunci dan pembahasan ikut terkirim ke browser.
 * Jangan dipakai untuk situs pembeli.
 */
export const BUILD_STATIK = process.env.STATIK === "1";
