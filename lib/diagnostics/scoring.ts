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
  if (score >= 90) return "negligible";
  if (score >= 75) return "low";
  if (score >= 55) return "moderate";
  if (score >= 35) return "high";
  if (score >= 15) return "critical";
  return "systemic";
}

export function verdictFromScore(score: number): string {
  if (score >= 90) return "No material condition detected. Maintain current governance rhythm.";
  if (score >= 75) return "Stable with minor correction points";
  if (score >= 55) return "Recoverable, but drift is present";
  if (score >= 35) return "Material weakness detected";
  if (score >= 15) return "Immediate correction required";
  return "Systemic failure — structural intervention required at the governance level";
}