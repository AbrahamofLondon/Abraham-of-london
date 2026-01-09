// lib/fonts.ts
// Updated to work with CSS modules instead of Tailwind

export type FontKey =
  | "button"
  | "button-sm"
  | "button-lg"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "subtitle"
  | "articleBody"
  | "body"
  | "caption"
  | "code"
  | "mono";

// Backwards-compatible alias for consumers expecting FontFamilyKey
export type FontFamilyKey = FontKey;

/** Map semantic keys to CSS module class names */
export const FONT_MAP: Record<FontKey, string> = {
  // Button styles
  "button-sm": "btn btnSmall",
  "button": "btn",
  "button-lg": "btn btnLarge",

  // Heading styles
  "h1": "h1",
  "h2": "h2", 
  "h3": "h3",
  "h4": "h4",

  // Text styles
  "subtitle": "p textSecondary",
  "articleBody": "legacyContent p",
  "body": "p",
  "caption": "pSmall",

  // Code/mono styles
  "code": "codeInline",
  "mono": "codeBlock",
};

/** Helper function to get font class names */
export function getFontClass(key: FontKey): string {
  return FONT_MAP[key] || "";
}

/** Typography scale for consistent sizing */
export const TYPOGRAPHY_SCALE = {
  h1: "clamp(3rem, 8vw, 4.5rem)",
  h2: "clamp(2.5rem, 5vw, 3.5rem)",
  h3: "clamp(1.875rem, 4vw, 2.5rem)",
  h4: "clamp(1.5rem, 3vw, 1.875rem)",
  body: "1.125rem",
  small: "1rem",
  caption: "0.875rem",
} as const;