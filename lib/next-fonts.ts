// lib/next-fonts.ts — Production hardened, variable-first, single source of truth
import { Inter, Roboto_Mono } from "next/font/google";
import localFont from "next/font/local";

/**
 * Strategy:
 * - CSS owns `font-family` tokens via variables:
 *   --font-family-sans, --font-family-mono, --font-family-serif, --font-editorial
 * - next/font only populates those variables and provides a body class.
 * - Keep weight/style sets minimal (don’t ship the entire library by default).
 */

// Sans (UI)
export const fontSans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-family-sans",
  // Keep this lean. Add more weights only if your design system truly uses them.
  weight: ["400", "500", "600", "700"],
  style: ["normal"],
  fallback: [
    "system-ui",
    "-apple-system",
    "Segoe UI",
    "Roboto",
    "Helvetica",
    "Arial",
    "Apple Color Emoji",
    "Segoe UI Emoji",
  ],
  preload: true,
  adjustFontFallback: true,
});

// Mono (code, numerals)
export const fontMono = Roboto_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-family-mono",
  weight: ["400", "500", "700"],
  style: ["normal"],
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
  preload: true,
});

// Editorial (your actual file)
export const fontEditorial = localFont({
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
  fallback: ["ui-serif", "Georgia", "Times New Roman", "Times", "serif"],
});

// Serif (optional stylistic serif — you only have italic TTF)
export const fontSerif = localFont({
  src: [
    {
      path: "../public/assets/fonts/AoLSerif-Italic.ttf",
      weight: "400",
      style: "italic",
    },
  ],
  // This sets your serif token. If you later add a Regular woff2, add it here.
  variable: "--font-family-serif",
  display: "swap",
  preload: false, // italic-only; don’t force preload unless it’s critical
  fallback: ["ui-serif", "Georgia", "Times New Roman", "Times", "serif"],
});

/**
 * Use these in layout:
 * <html className={fontVariables} ...>
 * <body className={fontBodyClass} ...>
 */
export const fontVariables = [
  fontSans.variable,
  fontMono.variable,
  fontEditorial.variable,
  fontSerif.variable,
].join(" ");

export const fontBodyClass = fontSans.className;

export const fontConfig = {
  fontSans,
  fontMono,
  fontEditorial,
  fontSerif,
  fontVariables,
  fontBodyClass,
};