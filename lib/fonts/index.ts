// lib/fonts/index.ts
import localFont from "next/font/local";

export const sans = localFont({
  src: [{ path: "./Inter-Variable.woff2", style: "normal", weight: "100 900" }],
  variable: "--font-sans",
  display: "swap",
  preload: true,
});

export const serif = localFont({
  src: [
    {
      path: "./PlayfairDisplay-Variable.woff2",
      style: "normal",
      weight: "400 900",
    },
  ],
  variable: "--font-serif",
  display: "swap",
  preload: false,
});

export const cursive = localFont({
  src: [{ path: "./GreatVibes-Regular.woff2", style: "normal", weight: "400" }],
  variable: "--font-cursive",
  display: "swap",
  preload: false,
});
