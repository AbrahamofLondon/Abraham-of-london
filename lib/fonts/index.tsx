// lib/fonts/index.ts

// ------------------------------------------------------------------------------------
// Types
// ------------------------------------------------------------------------------------

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

export interface FontLike {
  className: string;
  variable: string;
  style: {
    fontFamily: string;
  };
}

// ------------------------------------------------------------------------------------
// System-font config (no network calls, no next/font/google)
// ------------------------------------------------------------------------------------

export const fontConfig: Record<FontFamilyKey, string> = {
  sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  serif: "Georgia, 'Times New Roman', Times, serif",
  mono: "'JetBrains Mono', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  display:
    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  "serif-alt": "Georgia, 'Times New Roman', Times, serif",
  custom:
    "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
};

export const fontWeights: Record<FontWeightKey, number> = {
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
};

// ------------------------------------------------------------------------------------
// Fake “font objects” that look like next/font but are 100% local
// ------------------------------------------------------------------------------------

function makeFont(variable: string, fontFamily: string): FontLike {
  return {
    className: variable.replace("--", "").replace("font-", "font-"),
    variable,
    style: { fontFamily },
  };
}

export const inter = makeFont("--font-inter", fontConfig.sans);
export const playfair = makeFont("--font-playfair", fontConfig.serif);
export const jetbrainsMono = makeFont("--font-mono", fontConfig.mono);
export const sourceSerif = makeFont("--font-serif-alt", fontConfig["serif-alt"]);
export const spaceGrotesk = makeFont("--font-display", fontConfig.display);
export const customFont = makeFont("--font-custom", fontConfig.custom);

// Grouped export (useful for any “fonts” import)
export const fonts = {
  inter,
  playfair,
  jetbrainsMono,
  sourceSerif,
  spaceGrotesk,
  customFont,
} as const;

// ------------------------------------------------------------------------------------
// CSS variable generator – used in layout or global styles
// ------------------------------------------------------------------------------------

export function generateFontCSSVariables(): string {
  const weightVars = Object.entries(fontWeights)
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
    weightVars,
    "}",
  ]
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

export const fontCSS = generateFontCSSVariables();

// ------------------------------------------------------------------------------------
// Default export (handy for generic imports)
// ------------------------------------------------------------------------------------

const fontModule = {
  fonts,
  config: fontConfig,
  weights: fontWeights,
  presets: {}, // keep empty unless you really need the old fontPresets mapping
  generateFontCSSVariables,
  fontCSS,
};

export default fontModule;