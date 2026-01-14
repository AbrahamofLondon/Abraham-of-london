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

// ✅ Keep local fonts OUT of /public
// ✅ Prefer woff2/woff only (best for Next + web performance + Windows tooling)
export const editorialFont = localFont({
  src: [
    {
      path: "../assets/fonts/EditorialNew-Regular.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-editorial",
  display: "swap",
  preload: true,
});

// If you truly need AoL Serif, convert it to WOFF2 and add it here.
// Example (once you have AoLSerif-Italic.woff2):
export const aolSerif = localFont({
  src: [
    {
      path: "../assets/fonts/AoLSerif-Italic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-aol-serif",
  display: "swap",
  preload: true,
});

export const fontVariables = `${inter.variable} ${robotoMono.variable} ${editorialFont.variable} ${aolSerif.variable}`;
export const fontBodyClass = inter.className;

export const fontConfig = {
  inter,
  robotoMono,
  editorialFont,
  aolSerif,
  fontVariables,
  fontBodyClass,
};