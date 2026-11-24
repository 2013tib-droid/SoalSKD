import path from "node:path";
import type { NextConfig } from "next";

// STATIK=1: build statis untuk GitHub Pages dev (lihat src/config/build.ts).
// BASE_PATH: subfolder di Pages, mis. /SoalSKD/development/main.
const statik = process.env.STATIK === "1";

// STATIK ikut ditanam ke bundel browser, supaya komponen client tahu login dimatikan.
const env = { STATIK: statik ? "1" : "" };

const nextConfig: NextConfig = statik
  ? {
      env,
      output: "export",
      basePath: process.env.BASE_PATH || undefined,
      trailingSlash: true,
      images: { unoptimized: true },
      webpack(config, { webpack }) {
        // Export statis tidak mendukung server action: ganti modul server action dengan versi statis.
        config.plugins.push(
          new webpack.NormalModuleReplacementPlugin(/^@\/lib\/penilai$/, path.resolve("src/lib/penilai.statik.ts")),
          new webpack.NormalModuleReplacementPlugin(/^@\/lib\/gerbang$/, path.resolve("src/lib/gerbang.statik.ts")),
        );
        return config;
      },
    }
  : {
      env,
      // Server (App Hosting): katalog, paket GRATIS, dan config dibaca dari luar web/ saat
      // request, jadi ikut dibawa ke paket server. Paket berbayar TIDAK dibawa: dibaca dari
      // Storage privat (src/lib/bank-privat.ts). Tambahkan paket di sini bila PAKET_TERBUKA berubah.
      outputFileTracingRoot: path.resolve(".."),
      outputFileTracingIncludes: {
        "/**/*": ["../bank/katalog.json", "../bank/p01.json", "../config/*.json", "./src/konten/*.md"],
      },
      outputFileTracingExcludes: {
        "*": ["../bank/p0[2-9].json", "../bank/p[1-9][0-9].json", "../bank/gambar/**", "../bank/premium-*.md", "../bank/sample-*.json"],
      },
    };

export default nextConfig;
