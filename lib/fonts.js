// lib/fonts.ts
import localFont from "next/font/local";

export const sans = localFont({
  src: [{ path: "/fonts/Inter-Variable.woff2", style: "normal", weight: "100 900" }],
  variable: "--font-sans",
  display: "swap",
  preload: true, // body font → above-the-fold
});

export const serif = localFont({
  src: [{ path: "/fonts/PlayfairDisplay-Variable.woff2", style: "normal", weight: "400 900" }],
  variable: "--font-serif",
  display: "swap",
  preload: false, // headings only
});

export const cursive = localFont({
  src: [{ path: "/fonts/GreatVibes-Regular.woff2", style: "normal", weight: "400" }],
  variable: "--font-cursive",
  display: "swap",
  preload: false, // decorative
});
