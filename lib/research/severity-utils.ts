/**
 * lib/research/severity-utils.ts
 *
 * Central severity ordering and utility functions for the Intelligence Foundry.
 * All adapters, components, and routes should import from here — not re-declare inline.
 *
 * Severity order (ascending): INFO < LOW < MEDIUM < HIGH < CRITICAL
 */

import type { RunSeverity } from "./foundry-contract";

// ─── Order ───────────────────────────────────────────────────────────────────

export const SEVERITY_ORDER: readonly RunSeverity[] = [
  "INFO",
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
] as const;

/**
 * Returns the numeric rank of a severity level.
 * Higher rank = more severe. INFO = 0, CRITICAL = 4.
 * Unknown values map to -1 (treated as less severe than INFO).
 */
export function severityRank(severity: string): number {
  const idx = SEVERITY_ORDER.indexOf(severity as RunSeverity);
  return idx; // -1 for unknown
}

/**
 * Compare two severities.
 * Returns negative if a < b, 0 if equal, positive if a > b.
 */
export function compareSeverity(a: string, b: string): number {
  return severityRank(a) - severityRank(b);
}

/**
 * Return the most severe level from an array.
 * Falls back to "INFO" if the array is empty.
 */
export function maxSeverity(severities: string[]): RunSeverity {
  return severities.reduce<RunSeverity>((max, s) => {
    return compareSeverity(s, max) > 0 ? (s as RunSeverity) : max;
  }, "INFO");
}

/**
 * Return true if a is at least as severe as threshold.
 * e.g. isAtLeast("HIGH", "MEDIUM") === true
 */
export function isAtLeast(severity: string, threshold: RunSeverity): boolean {
  return severityRank(severity) >= severityRank(threshold);
}

/**
 * Guard: ensure a string is a valid RunSeverity; falls back to default.
 */
export function coerceSeverity(
  value: string | null | undefined,
  fallback: RunSeverity = "LOW",
): RunSeverity {
  if (value && SEVERITY_ORDER.includes(value as RunSeverity)) {
    return value as RunSeverity;
  }
  return fallback;
}

// ─── Display helpers ─────────────────────────────────────────────────────────

/**
 * Canonical RGBA colour strings for each severity level.
 * Consistent across all Foundry surfaces.
 */
export const SEVERITY_COLORS: Record<RunSeverity, string> = {
  CRITICAL: "rgba(239,68,68,0.85)",
  HIGH: "rgba(249,115,22,0.85)",
  MEDIUM: "rgba(251,191,36,0.80)",
  LOW: "rgba(110,231,183,0.70)",
  INFO: "rgba(255,255,255,0.40)",
};

export const SEVERITY_BG: Record<RunSeverity, string> = {
  CRITICAL: "rgba(239,68,68,0.05)",
  HIGH: "rgba(249,115,22,0.05)",
  MEDIUM: "rgba(251,191,36,0.04)",
  LOW: "rgba(110,231,183,0.03)",
  INFO: "rgba(255,255,255,0.02)",
};

export const SEVERITY_BORDER: Record<RunSeverity, string> = {
  CRITICAL: "rgba(239,68,68,0.25)",
  HIGH: "rgba(249,115,22,0.25)",
  MEDIUM: "rgba(251,191,36,0.20)",
  LOW: "rgba(110,231,183,0.15)",
  INFO: "rgba(255,255,255,0.08)",
};

export function severityColor(severity: string): string {
  return SEVERITY_COLORS[severity as RunSeverity] ?? SEVERITY_COLORS.INFO;
}

export function severityBg(severity: string): string {
  return SEVERITY_BG[severity as RunSeverity] ?? SEVERITY_BG.INFO;
}

export function severityBorder(severity: string): string {
  return SEVERITY_BORDER[severity as RunSeverity] ?? SEVERITY_BORDER.INFO;
}

/**
 * Human-readable label for display.
 */
export function severityLabel(severity: string): string {
  switch (severity) {
    case "CRITICAL": return "Critical";
    case "HIGH": return "High";
    case "MEDIUM": return "Medium";
    case "LOW": return "Low";
    case "INFO": return "Info";
    default: return String(severity || "Unknown");
  }
}
