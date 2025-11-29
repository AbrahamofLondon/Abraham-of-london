// lib/fonts.ts
// Central, tree-shakeable font utility (no React imports)

export type FontKey =
  | "button"
  | "button-sm"
  | "button-lg"
  | "h1"
  | "h2"
  | "h3"
  | "subtitle"
  | "articleBody"
  | "body"
  | "caption";

// Backwards-compatible alias for consumers expecting FontFamilyKey
export type FontFamilyKey = FontKey;

/** Map semantic keys to Tailwind classes for typography. */
const FONT_MAP: Record<FontKey, string> = {
  // Button styles
  "button-sm": "font-sans text-sm tracking-wide",
  button: "font-sans text-base tracking-wide",
  "button-lg": "font-sans text-lg tracking-wide",

  // Heading styles
  h1: "text-4xl md:text-5xl font-bold font-serif tracking-tight",
  h2: "text-3xl md:text-4xl font-semibold font-serif tracking-tight",
  h3: "text-2xl md:text-3xl font-semibold font-serif",

  // Text styles
  subtitle: "text-lg md:text-xl font-sans text-deepCharcoal/80",
  articleBody: "text-lg font-sans leading-relaxed md:leading-loose",
  body: "text-base font-sans leading-relaxed",
  caption: "text-sm font-sans text-deepCharcoal/70",
};
