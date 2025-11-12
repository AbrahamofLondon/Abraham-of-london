// app/fonts/index.ts
import { Inter, Playfair_Display, JetBrains_Mono } from '...';

// Primary fonts with robust configuration
export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
  fallback: ["system-ui", "arial"],
});

export const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
  preload: true,
});

// Fallback fonts
export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "optional",
});

// Remove problematic Source_Serif_Pro and use system fonts instead
// CSS variable declarations for fallback
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

// Font preloader links as string
export const fontPreloadLinks = `
  <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin="anonymous" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap');
  </style>
`;

// Simple FontPreloader that returns HTML string
export function FontPreloader() {
  return fontPreloadLinks;
}
