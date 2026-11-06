import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { BUILD_STATIK } from "@/config/build";
import "./globals.css";

export const metadata: Metadata = {
  title: "SoalSKD",
  description: "Try out SKD CPNS: TWK, TIU, TKP",
  // Build statis = halaman dev di GitHub Pages: jangan sampai terindeks mesin pencari.
  ...(BUILD_STATIK && { robots: { index: false, follow: false } }),
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#181818" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
