import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Self-hosted (offline-safe) fonts, subset to Latin + Mongolian Cyrillic (incl. Ө, Ү) and ₮.
const serif = localFont({
  src: [
    { path: "../fonts/cormorant-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/cormorant-500-italic.woff2", weight: "500", style: "italic" },
  ],
  variable: "--font-cormorant",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

const sans = localFont({
  src: [
    { path: "../fonts/manrope-400.woff2", weight: "400" },
    { path: "../fonts/manrope-500.woff2", weight: "500" },
    { path: "../fonts/manrope-600.woff2", weight: "600" },
    { path: "../fonts/manrope-700.woff2", weight: "700" },
  ],
  variable: "--font-manrope",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: { default: "Нархан — H&M дотуур хувцас, унтлагын хувцас", template: "%s · Нархан" },
  description:
    "Европоос ирсэн H&M-ийн жинхэнэ дотуур хувцас, унтлагын хувцас. Бүх бараа бэлэн, хүргэлт 5,000₮. Storepay, Pocket Zero-р хувааж төлөх боломжтой.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#FBF6F1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn" className={`${serif.variable} ${sans.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
