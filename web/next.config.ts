import path from "node:path";
import type { NextConfig } from "next";

// STATIK=1: build statis untuk GitHub Pages dev (lihat src/config/build.ts).
// BASE_PATH: subfolder di Pages, mis. /SoalSKD/development/main.
const statik = process.env.STATIK === "1";

const nextConfig: NextConfig = statik
  ? {
      output: "export",
      basePath: process.env.BASE_PATH || undefined,
      trailingSlash: true,
      images: { unoptimized: true },
      webpack(config, { webpack }) {
        // Export statis tidak mendukung server action: ganti penilai server dengan versi statis.
        config.plugins.push(
          new webpack.NormalModuleReplacementPlugin(/^@\/lib\/penilai$/, path.resolve("src/lib/penilai.statik.ts")),
        );
        return config;
      },
    }
  : {};

export default nextConfig;
