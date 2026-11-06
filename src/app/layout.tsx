import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const display = localFont({ src: "./fonts/inter-tight-normal.woff2", weight: "300 600", variable: "--font-inter-tight", display: "swap" });
const text = localFont({ src: "./fonts/inter-normal.woff2", weight: "400 600", variable: "--font-inter", display: "swap" });
const accent = localFont({
  src: [
    { path: "./fonts/cormorant-garamond-normal.woff2", weight: "400 700", style: "normal" },
    { path: "./fonts/cormorant-garamond-italic.woff2", weight: "400 700", style: "italic" },
  ],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Home Karigar Studio", template: "%s · Home Karigar Studio" },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${text.variable} ${accent.variable}`}>
      <body>{children}</body>
    </html>
  );
}
