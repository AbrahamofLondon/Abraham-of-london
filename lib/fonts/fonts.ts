// lib/fonts/fonts.ts
import { Inter, Playfair_Display, JetBrains_Mono, Source_Serif_4, Space_Grotesk } from '...';
import localFont from "next/font/local";

// Font definitions only - no JSX
export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif-alt",
});

export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

export const customFont = localFont({
  src: [],
  variable: "--font-custom",
});

// Types
export type FontFamily =
  | "sans"
  | "serif"
  | "mono"
  | "display"
  | "serif-alt"
  | "custom";
export type FontWeight = "light" | "normal" | "medium" | "semibold" | "bold";

// Utilities
export const fontConfig = {
  sans: `var(--font-inter), system-ui, sans-serif`,
  serif: `var(--font-playfair), Georgia, serif`,
  // ... etc
} as const;

export function generateFontCSSVariables(): string {
  return `
    :root {
      --font-inter: ${inter.style.fontFamily};
      --font-playfair: ${playfair.style.fontFamily};
      --font-mono: ${jetbrainsMono.style.fontFamily};
      --font-serif-alt: ${sourceSerif.style.fontFamily};
      --font-display: ${spaceGrotesk.style.fontFamily};
      --font-custom: ${customFont.style.fontFamily};
    }
  `.trim();
}

export const fontCSS = generateFontCSSVariables();
