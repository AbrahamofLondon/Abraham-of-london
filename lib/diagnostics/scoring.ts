/* lib/diagnostics/scoring.ts */

import type { DiagnosticSeverity } from "@/lib/diagnostics/store";

export function percentageScore(answers: Array<number | boolean | null | undefined>): number {
  const normalized = answers
    .map((x) => {
      if (typeof x === "boolean") return x ? 1 : 0;
      if (typeof x === "number" && Number.isFinite(x)) return Math.max(0, Math.min(1, x));
      return null;
    })
    .filter((x): x is number => x !== null);

  if (!normalized.length) return 0;
  const sum = normalized.reduce((a, b) => a + b, 0);
  return Math.round((sum / normalized.length) * 100);
}

export function severityFromScore(score: number): DiagnosticSeverity {
  if (score >= 80) return "low";
  if (score >= 60) return "moderate";
  if (score >= 40) return "high";
  return "critical";
}

export function verdictFromScore(score: number): string {
  if (score >= 80) return "Stable with minor correction points";
  if (score >= 60) return "Recoverable, but drift is present";
  if (score >= 40) return "Material weakness detected";
  return "Immediate correction required";
}