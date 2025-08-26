import { Inter, Playfair_Display, Great_Vibes } from "next/font/google";

/**
 * Rule of thumb:
 * - Preload ONLY the font used on first paint (body text).
 * - Let headings/accent fonts load without preload to avoid “preloaded but not used” warnings.
 */

export const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: true, // body font → used above-the-fold
});

export const serif = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  preload: false, // headings only → not always above-the-fold
});

export const cursive = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-cursive",
  display: "swap",
  preload: false, // decorative → do not preload
});
