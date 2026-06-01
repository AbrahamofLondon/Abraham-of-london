/**
 * lib/product/living-theme.ts
 *
 * Shared theme configuration for living components.
 * Provides consistent color tokens for dark and light variants.
 *
 * Dark variant: used in Decision Centre, lab, and institutional surfaces.
 * Light variant: used in diagnostic result surfaces (Purpose Alignment, etc.).
 */

export type LivingThemeVariant = 'dark' | 'light'

export type LivingThemeColors = {
  /** Container background */
  bg: string
  /** Container border */
  border: string
  /** Primary heading text */
  heading: string
  /** Body text */
  body: string
  /** Muted/secondary text */
  muted: string
  /** Very muted text (labels, metadata) */
  dim: string
  /** Accent color for gold elements */
  accent: string
  /** Accent color for amber elements */
  amber: string
  /** Accent color for emerald (positive) */
  emerald: string
  /** Accent color for red (negative) */
  red: string
  /** Divider/border color */
  divider: string
  /** Link/hover color */
  link: string
  /** Button border */
  buttonBorder: string
}

const DARK: LivingThemeColors = {
  bg: 'rgba(255,255,255,0.02)',
  border: 'rgba(255,255,255,0.10)',
  heading: 'rgba(255,255,255,0.85)',
  body: 'rgba(255,255,255,0.65)',
  muted: 'rgba(255,255,255,0.40)',
  dim: 'rgba(255,255,255,0.20)',
  accent: 'rgba(201,169,110,0.60)',
  amber: 'rgba(251,191,36,0.55)',
  emerald: 'rgba(110,231,183,0.60)',
  red: 'rgba(252,165,165,0.65)',
  divider: 'rgba(255,255,255,0.08)',
  link: 'rgba(201,169,110,0.80)',
  buttonBorder: 'rgba(201,169,110,0.20)',
}

const LIGHT: LivingThemeColors = {
  bg: 'rgba(201,169,110,0.04)',
  border: 'rgba(201,169,110,0.20)',
  heading: 'rgba(64,64,64,0.90)',
  body: 'rgba(64,64,64,0.75)',
  muted: 'rgba(64,64,64,0.50)',
  dim: 'rgba(64,64,64,0.35)',
  accent: 'rgba(138,106,47,0.70)',
  amber: 'rgba(180,130,30,0.65)',
  emerald: 'rgba(22,130,80,0.65)',
  red: 'rgba(180,50,50,0.70)',
  divider: 'rgba(138,106,47,0.15)',
  link: 'rgba(138,106,47,0.85)',
  buttonBorder: 'rgba(138,106,47,0.25)',
}

export function getLivingTheme(variant: LivingThemeVariant): LivingThemeColors {
  return variant === 'light' ? LIGHT : DARK
}
