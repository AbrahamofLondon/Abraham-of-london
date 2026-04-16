// lib/design-system/semantic.ts
// Semantic Token Layer — maps foundation tokens to meaning.
// Components consume these, not raw foundation values.
// Source of truth: design migration/03-token-model.ts

import { foundationColors } from "./tokens";

// -----------------------------------------------------------------------------
// SEMANTIC TOKEN TYPE
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// BASE SEMANTIC TOKENS (dark-first default)
// -----------------------------------------------------------------------------

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
  heroWash:
    "radial-gradient(circle at 15% 15%, rgba(240,185,79,0.10), transparent 42%)",
  heroScrim:
    "linear-gradient(180deg, rgba(7,7,7,0.14), rgba(7,7,7,0.54))",
  cardOverlay:
    "linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.38))",
};

// -----------------------------------------------------------------------------
// SURFACE SEMANTIC RECIPES
// Per-surface overrides that layer on top of baseSemanticTokens.
// -----------------------------------------------------------------------------

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
    heroWash:
      "radial-gradient(circle at 18% 18%, rgba(201,123,27,0.10), transparent 42%)",
    heroScrim:
      "linear-gradient(180deg, rgba(247,244,239,0.10), rgba(247,244,239,0.70))",
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
    heroWash:
      "linear-gradient(135deg, rgba(81,105,126,0.18), rgba(240,185,79,0.06))",
    heroScrim:
      "linear-gradient(180deg, rgba(13,18,22,0.18), rgba(13,18,22,0.68))",
  },
} as const;

// -----------------------------------------------------------------------------
// MERGE HELPER
// Apply surface-specific or ad-hoc overrides on top of base tokens.
// -----------------------------------------------------------------------------

export function mergeSemanticTokens(
  overrides: Partial<SemanticTokens> = {},
): SemanticTokens {
  return {
    ...baseSemanticTokens,
    ...overrides,
  };
}

// -----------------------------------------------------------------------------
// CSS VARIABLE MAP
// Maps SemanticTokens keys to CSS custom property names.
// Used by the CSS variable bridge and surface-class generator.
// -----------------------------------------------------------------------------

const TOKEN_TO_CSS_VAR: Record<keyof SemanticTokens, string> = {
  background: "--ds-background",
  backgroundMuted: "--ds-background-muted",
  panel: "--ds-panel",
  panelAlt: "--ds-panel-alt",
  border: "--ds-border",
  borderStrong: "--ds-border-strong",
  text: "--ds-text",
  textMuted: "--ds-text-muted",
  textSubtle: "--ds-text-subtle",
  link: "--ds-link",
  accent: "--ds-accent",
  accentSoft: "--ds-accent-soft",
  success: "--ds-success",
  warning: "--ds-warning",
  danger: "--ds-danger",
  focusRing: "--ds-focus-ring",
  heroWash: "--ds-hero-wash",
  heroScrim: "--ds-hero-scrim",
  cardOverlay: "--ds-card-overlay",
};

/**
 * Convert a SemanticTokens object to a CSS variable string.
 * Useful for inline style injection or build-time CSS generation.
 */
export function semanticTokensToCSSVars(
  tokens: Partial<SemanticTokens>,
): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [key, value] of Object.entries(tokens)) {
    const cssVar = TOKEN_TO_CSS_VAR[key as keyof SemanticTokens];
    if (cssVar && value) {
      vars[cssVar] = value;
    }
  }
  return vars;
}
