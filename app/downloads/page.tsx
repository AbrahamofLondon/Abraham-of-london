// app/fonts/index.ts
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";

// Primary fonts with robust configuration
export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
  fallback: ["system-ui", "Arial"],
});

export const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
  preload: true,
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "optional",
  variable: "--font-mono",
});

// Optional: CSS variable declarations for use in globals.css if needed
export const fontCSS = `
  :root {
    --font-inter: ${inter.style.fontFamily}, system-ui, -apple-system, sans-serif;
    --font-playfair: ${playfair.style.fontFamily}, Georgia, serif;
    --font-mono: ${jetbrainsMono.style.fontFamily}, 'Courier New', monospace;
    --font-serif: Georgia, 'Times New Roman', Times, serif;
  }

  .font-sans {
    font-family: var(--font-inter);
  }

  .font-serif {
    font-family: var(--font-playfair);
  }

  .font-mono {
    font-family: var(--font-mono);
  }
`;

// Legacy helpers – made harmless & type-safe so they won't break anything
// If nothing imports these, you can delete them later.

export const fontPreloadLinks = ""; // next/font already handles preloading

export function FontPreloader(): null {
  // Kept as a no-op component to avoid breaking any existing imports/usages.
  return null;
}