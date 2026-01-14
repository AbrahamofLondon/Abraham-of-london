// lib/next-fonts.ts
import { Inter, Roboto_Mono } from "next/font/google";
import localFont from "next/font/local";

export const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  fallback: ["system-ui", "sans-serif"],
  preload: true,
  adjustFontFallback: true,
});

export const robotoMono = Roboto_Mono({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  fallback: ["monospace"],
  preload: true,
});

// ✅ Use the file you actually have
export const editorialFont = localFont({
  src: [
    {
      path: "../public/assets/fonts/EditorialNew-Regular.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-editorial",
  display: "swap",
  preload: true,
});

// ✅ You only have TTF for AoLSerif-Italic, so use TTF
export const aolSerif = localFont({
  src: [
    {
      path: "../public/assets/fonts/AoLSerif-Italic.ttf",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-aol-serif",
  display: "swap",
  preload: false,
});

export const fontVariables = [
  inter.variable,
  robotoMono.variable,
  editorialFont.variable,
  aolSerif.variable,
].join(" ");

export const fontBodyClass = inter.className;

export const fontConfig = {
  inter,
  robotoMono,
  editorialFont,
  aolSerif,
  fontVariables,
  fontBodyClass,
};