// lib/fonts/index.ts
import {
  Inter,
  Playfair_Display,
  JetBrains_Mono,
  Source_Serif_4,
  Space_Grotesk,
} from "next/font/google";
import localFont from "next/font/local";

/** ---------------- Types & scales (server-safe) ---------------- */
export type FontFamilyKey =
  | "sans"
  | "serif"
  | "mono"
  | "display"
  | "serif-alt"
  | "custom";

export type FontWeightKey =
  | "light"
  | "normal"
  | "medium"
  | "semibold"
  | "bold"
  | "extrabold"
  | "black";

export type FontPresetKey = keyof typeof fontPresets;

export const fontConfig = {
  sans: `var(--font-inter), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`,
  serif: `var(--font-playfair), Georgia, 'Times New Roman', serif`,
  mono: `var(--font-mono), 'JetBrains Mono', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace`,
  display: `var(--font-display), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
  "serif-alt": `var(--font-serif-alt), Georgia, 'Times New Roman', serif`,
  custom: `var(--font-custom), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
} as const;

export const fontWeights = {
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
} as const;

/** ---------------- Font objects (server-safe) ------------------ */
export const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  adjustFontFallback: true,
  preload: true,
  variable: "--font-inter",
  fallback: [
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Helvetica Neue",
    "Arial",
    "sans-serif",
  ],
});

export const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  adjustFontFallback: true,
  preload: true,
  variable: "--font-playfair",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  adjustFontFallback: true,
  preload: false,
  variable: "--font-mono",
  fallback: [
    "Menlo",
    "Monaco",
    "Consolas",
    "Liberation Mono",
    "Courier New",
    "monospace",
  ],
});

export const sourceSerif = Source_Serif_4({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  adjustFontFallback: true,
  preload: false,
  variable: "--font-serif-alt",
  fallback: ["Georgia", "Times New Roman", "serif"],
  weight: ["400", "600", "700"],
});

export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  adjustFontFallback: true,
  preload: false,
  variable: "--font-display",
  fallback: [
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "sans-serif",
  ],
  weight: ["300", "400", "500", "600", "700"],
});

/**
 * Note: path is relative to THIS FILE (lib/fonts/index.ts → ../../public/fonts)
 * If you don’t have these files yet, either add them or remove this block.
 */
export const customFont = localFont({
  src: [
    { path: "../../public/fonts/CustomFont-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../public/fonts/CustomFont-Medium.woff2",  weight: "500", style: "normal" },
    { path: "../../public/fonts/CustomFont-Bold.woff2",    weight: "700", style: "normal" },
    { path: "../../public/fonts/CustomFont-Italic.woff2",  weight: "400", style: "italic" },
  ],
  variable: "--font-custom",
  display: "swap",
  preload: true,
  fallback: [
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "sans-serif",
  ],
});

/** --------------- Presets (pure class strings) ----------------- */
export const fontPresets = {
  h1: `font-serif font-bold text-5xl lg:text-6xl leading-tight tracking-tight`,
  h2: `font-serif font-semibold text-4xl lg:text-5xl leading-snug tracking-normal`,
  h3: `font-serif font-medium text-3xl lg:text-4xl leading-snug tracking-normal`,
  h4: `font-sans font-semibold text-2xl lg:text-3xl leading-relaxed tracking-normal`,
  h5: `font-sans font-medium text-xl lg:text-2xl leading-relaxed tracking-normal`,
  h6: `font-sans font-medium text-lg lg:text-xl leading-relaxed tracking-normal`,
  body: `font-sans font-normal text-base leading-relaxed tracking-normal`,
  bodyLarge: `font-sans font-normal text-lg leading-relaxed tracking-normal`,
  bodySmall: `font-sans font-normal text-sm leading-relaxed tracking-normal`,
  button: `font-sans font-medium text-base leading-none tracking-wide`,
  label: `font-sans font-medium text-sm leading-tight tracking-wide`,
  caption: `font-sans font-normal text-xs leading-tight tracking-wide`,
  code: `font-mono font-normal text-sm leading-relaxed tracking-normal`,
  codeBlock: `font-mono font-normal text-sm leading-loose tracking-normal`,
  display: `font-display font-bold text-6xl lg:text-7xl leading-tight tracking-tight`,
} as const;

/** --------------- CSS variables generator (server) -------------- */
export function generateFontCSSVariables(): string {
  const weights = Object.entries(fontWeights)
    .map(([k, v]) => `--font-weight-${k}: ${v};`)
    .join(" ");

  return [
    ":root{",
    `--font-sans:${fontConfig.sans};`,
    `--font-serif:${fontConfig.serif};`,
    `--font-mono:${fontConfig.mono};`,
    `--font-display:${fontConfig.display};`,
    `--font-serif-alt:${fontConfig["serif-alt"]};`,
    `--font-custom:${fontConfig.custom};`,
    weights,
    "}",
  ]
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

/** --------------- Convenient grouped export -------------------- */
export const fonts = {
  inter,
  playfair,
  jetbrainsMono,
  sourceSerif,
  spaceGrotesk,
  customFont,
} as const;

export const fontCSS = generateFontCSSVariables();

export default {
  fonts,
  config: fontConfig,
  weights: fontWeights,
  presets: fontPresets,
  generateFontCSSVariables,
};