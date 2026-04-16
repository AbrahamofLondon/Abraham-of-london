export type FoundationColorScale = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
};

export const foundationColors = {
  neutral: {
    50: "#f7f4ef",
    100: "#ece7df",
    200: "#d9d0c3",
    300: "#bcae9d",
    400: "#958674",
    500: "#726452",
    600: "#55493c",
    700: "#3b332c",
    800: "#221d19",
    900: "#0b0a09",
  } satisfies FoundationColorScale,
  amber: {
    50: "#fff7e6",
    100: "#fdecc6",
    200: "#f8d68b",
    300: "#f0b94f",
    400: "#df9830",
    500: "#c97b1b",
    600: "#9b5d13",
    700: "#71430f",
    800: "#492a0b",
    900: "#241405",
  } satisfies FoundationColorScale,
  steel: {
    50: "#edf2f7",
    100: "#dbe4ee",
    200: "#bccbda",
    300: "#92a9bd",
    400: "#6a869d",
    500: "#51697e",
    600: "#3f5364",
    700: "#2c3946",
    800: "#1a232b",
    900: "#0d1216",
  } satisfies FoundationColorScale,
};

export const spacingScale = {
  0: "0rem",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
  32: "8rem",
} as const;

export const radiusScale = {
  none: "0px",
  sm: "0.375rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.5rem",
  "2xl": "2rem",
  full: "9999px",
} as const;

export const shadowScale = {
  none: "none",
  sm: "0 1px 2px rgba(0,0,0,0.12)",
  md: "0 8px 24px rgba(0,0,0,0.18)",
  lg: "0 18px 48px rgba(0,0,0,0.24)",
  xl: "0 28px 80px rgba(0,0,0,0.30)",
} as const;

export const typography = {
  families: {
    serif: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif',
    sans: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: '"SFMono-Regular", ui-monospace, Menlo, Monaco, Consolas, monospace',
  },
  scale: {
    xs: { fontSize: "0.75rem", lineHeight: 1.4 },
    sm: { fontSize: "0.875rem", lineHeight: 1.55 },
    base: { fontSize: "1rem", lineHeight: 1.7 },
    lg: { fontSize: "1.125rem", lineHeight: 1.7 },
    xl: { fontSize: "1.25rem", lineHeight: 1.5 },
    "2xl": { fontSize: "1.5rem", lineHeight: 1.35 },
    "3xl": { fontSize: "2rem", lineHeight: 1.15 },
    "4xl": { fontSize: "2.75rem", lineHeight: 1.05 },
    "5xl": { fontSize: "3.5rem", lineHeight: 1.02 },
  },
} as const;

export const motion = {
  duration: {
    fast: "120ms",
    base: "180ms",
    slow: "280ms",
  },
  easing: {
    standard: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    entrance: "cubic-bezier(0.16, 1, 0.3, 1)",
    exit: "cubic-bezier(0.7, 0, 0.84, 0)",
  },
} as const;

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

export const zIndex = {
  base: 0,
  content: 10,
  overlay: 20,
  sticky: 30,
  modal: 40,
  toast: 50,
} as const;

export type SemanticTokens = {
  background: string;
  backgroundMuted: string;
  panel: string;
  panelAlt: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  link: string;
  accent: string;
  accentSoft: string;
  success: string;
  warning: string;
  danger: string;
  focusRing: string;
  heroWash: string;
  heroScrim: string;
  cardOverlay: string;
};

export const baseSemanticTokens: SemanticTokens = {
  background: foundationColors.neutral[900],
  backgroundMuted: foundationColors.neutral[800],
  panel: "rgba(255,255,255,0.05)",
  panelAlt: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.10)",
  borderStrong: "rgba(255,255,255,0.16)",
  text: "rgba(255,255,255,0.94)",
  textMuted: "rgba(255,255,255,0.72)",
  textSubtle: "rgba(255,255,255,0.56)",
  link: foundationColors.amber[300],
  accent: foundationColors.amber[400],
  accentSoft: "rgba(240,185,79,0.20)",
  success: "#3fbf75",
  warning: foundationColors.amber[300],
  danger: "#cf4d4d",
  focusRing: "rgba(240,185,79,0.55)",
  heroWash: "radial-gradient(circle at 15% 15%, rgba(240,185,79,0.10), transparent 42%)",
  heroScrim: "linear-gradient(180deg, rgba(7,7,7,0.14), rgba(7,7,7,0.54))",
  cardOverlay: "linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.38))",
};

export const surfaceSemanticRecipes = {
  canon: {
    panel: "rgba(247,244,239,0.92)",
    panelAlt: "rgba(247,244,239,0.82)",
    border: "rgba(59,51,44,0.12)",
    borderStrong: "rgba(59,51,44,0.18)",
    text: foundationColors.neutral[800],
    textMuted: "rgba(59,51,44,0.74)",
    textSubtle: "rgba(59,51,44,0.56)",
    accent: foundationColors.amber[500],
    accentSoft: "rgba(201,123,27,0.14)",
    heroWash: "radial-gradient(circle at 18% 18%, rgba(201,123,27,0.10), transparent 42%)",
    heroScrim: "linear-gradient(180deg, rgba(247,244,239,0.10), rgba(247,244,239,0.70))",
  },
  vault: {
    panel: "rgba(13,18,22,0.86)",
    panelAlt: "rgba(26,35,43,0.86)",
    border: "rgba(188,203,218,0.16)",
    borderStrong: "rgba(188,203,218,0.26)",
    text: "rgba(245,247,250,0.94)",
    textMuted: "rgba(219,228,238,0.76)",
    textSubtle: "rgba(219,228,238,0.56)",
    accent: foundationColors.amber[300],
    accentSoft: "rgba(240,185,79,0.12)",
    heroWash: "linear-gradient(135deg, rgba(81,105,126,0.18), rgba(240,185,79,0.06))",
    heroScrim: "linear-gradient(180deg, rgba(13,18,22,0.18), rgba(13,18,22,0.68))",
  },
} as const;

export function mergeSemanticTokens(
  overrides: Partial<SemanticTokens> = {},
): SemanticTokens {
  return {
    ...baseSemanticTokens,
    ...overrides,
  };
}
