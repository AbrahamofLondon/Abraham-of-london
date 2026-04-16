// lib/design-system/tokens.ts
// Foundation Tokens — raw values, no semantics.
// DO NOT use these directly in components. Use semantic.ts instead.
// Source of truth: design migration/03-token-model.ts

// -----------------------------------------------------------------------------
// COLOUR FOUNDATIONS
// -----------------------------------------------------------------------------

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
} as const;

// -----------------------------------------------------------------------------
// SPACING
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// BORDER RADIUS
// -----------------------------------------------------------------------------

export const radiusScale = {
  none: "0px",
  sm: "0.375rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.5rem",
  "2xl": "2rem",
  full: "9999px",
} as const;

// -----------------------------------------------------------------------------
// SHADOWS
// -----------------------------------------------------------------------------

export const shadowScale = {
  none: "none",
  sm: "0 1px 2px rgba(0,0,0,0.12)",
  md: "0 8px 24px rgba(0,0,0,0.18)",
  lg: "0 18px 48px rgba(0,0,0,0.24)",
  xl: "0 28px 80px rgba(0,0,0,0.30)",
} as const;

// -----------------------------------------------------------------------------
// TYPOGRAPHY
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// MOTION
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// BREAKPOINTS
// -----------------------------------------------------------------------------

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

// -----------------------------------------------------------------------------
// Z-INDEX
// -----------------------------------------------------------------------------

export const zIndex = {
  base: 0,
  content: 10,
  overlay: 20,
  sticky: 30,
  modal: 40,
  toast: 50,
} as const;
