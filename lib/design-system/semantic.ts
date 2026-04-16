// Semantic Tokens - CSS variable definitions

import { tokens } from './tokens';

export interface SemanticVariables {
  '--surface-bg': string;
  '--surface-bg-muted': string;
  '--surface-panel': string;
  '--surface-panel-alt': string;
  '--surface-elevated': string;
  '--surface-border': string;
  '--surface-border-strong': string;
  '--surface-border-focus': string;
  '--surface-text': string;
  '--surface-text-muted': string;
  '--surface-text-subtle': string;
  '--surface-text-inverse': string;
  '--surface-link': string;
  '--surface-link-hover': string;
  '--surface-accent': string;
  '--surface-accent-soft': string;
  '--surface-accent-strong': string;
  '--surface-success': string;
  '--surface-warning': string;
  '--surface-error': string;
  '--surface-info': string;
  '--surface-hero-wash': string;
  '--surface-hero-scrim': string;
  '--surface-hero-scrim-strong': string;
  '--surface-hover': string;
  '--surface-active': string;
  '--surface-focus-ring': string;
  '--surface-disabled': string;
  '--gradient-hero-start': string;
  '--gradient-hero-end': string;
  '--gradient-accent-start': string;
  '--gradient-accent-end': string;
}

export const defaultSemanticVariables: SemanticVariables = {
  '--surface-bg': tokens.color.neutral[50],
  '--surface-bg-muted': tokens.color.neutral[100],
  '--surface-panel': tokens.color.neutral[0],
  '--surface-panel-alt': tokens.color.neutral[50],
  '--surface-elevated': tokens.color.neutral[0],
  '--surface-border': tokens.color.neutral[200],
  '--surface-border-strong': tokens.color.neutral[300],
  '--surface-border-focus': tokens.color.primary[500],
  '--surface-text': tokens.color.neutral[900],
  '--surface-text-muted': tokens.color.neutral[600],
  '--surface-text-subtle': tokens.color.neutral[400],
  '--surface-text-inverse': tokens.color.neutral[0],
  '--surface-link': tokens.color.primary[600],
  '--surface-link-hover': tokens.color.primary[700],
  '--surface-accent': tokens.color.primary[500],
  '--surface-accent-soft': tokens.color.primary[100],
  '--surface-accent-strong': tokens.color.primary[700],
  '--surface-success': tokens.color.success.base,
  '--surface-warning': tokens.color.warning.base,
  '--surface-error': tokens.color.error.base,
  '--surface-info': tokens.color.info.base,
  '--surface-hero-wash': `radial-gradient(ellipse at 50% 0%, ${tokens.color.primary[50]} 0%, transparent 70%)`,
  '--surface-hero-scrim': `linear-gradient(to bottom, ${tokens.color.neutral[900]} 0%, transparent 100%)`,
  '--surface-hero-scrim-strong': `linear-gradient(to bottom, ${tokens.color.neutral[900]} 0%, ${tokens.color.neutral[900]} 20%, transparent 100%)`,
  '--surface-hover': tokens.color.neutral[50],
  '--surface-active': tokens.color.neutral[100],
  '--surface-focus-ring': `0 0 0 2px ${tokens.color.primary[500]}`,
  '--surface-disabled': tokens.color.neutral[300],
  '--gradient-hero-start': tokens.color.primary[50],
  '--gradient-hero-end': tokens.color.neutral[0],
  '--gradient-accent-start': tokens.color.primary[100],
  '--gradient-accent-end': tokens.color.primary[200],
};

export function toCSSVariables(variables: Partial<SemanticVariables>): string {
  return Object.entries(variables)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n');
}