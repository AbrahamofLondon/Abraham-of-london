/* ============================================================================
   FILE: lib/diagnostics/client.ts
   DIAGNOSTIC CLIENT HELPERS
   Purpose:
   - preserve the existing contract
   - provide safe scoring utilities
   - keep submit flow stable across all diagnostic UIs
============================================================================ */

import type {
  DiagnosticAnswer,
  DiagnosticAnswerValue,
  DiagnosticScoreBand,
  DiagnosticSectionScore,
  DiagnosticSeverity,
  DiagnosticSubmissionPayload,
  DiagnosticSubmitResponse,
} from "@/lib/diagnostics/types";

export function clampAnswerValue(value: number): DiagnosticAnswerValue {
  if (!Number.isFinite(value)) return 3;
  if (value <= 1) return 1;
  if (value >= 5) return 5;
  return Math.round(value) as DiagnosticAnswerValue;
}

export function computePct(score: number, maxScore: number): number {
  if (!Number.isFinite(score) || !Number.isFinite(maxScore) || maxScore <= 0) {
    return 0;
  }

  const pct = Math.round((score / maxScore) * 100);
  return Math.max(0, Math.min(100, pct));
}

export function severityFromPct(pct: number): DiagnosticSeverity {
  const safePct = Math.max(0, Math.min(100, Math.round(pct)));

  if (safePct >= 80) return "low";
  if (safePct >= 60) return "moderate";
  if (safePct >= 40) return "high";
  return "critical";
}

export function bandFromPct(pct: number): DiagnosticScoreBand {
  const safePct = Math.max(0, Math.min(100, Math.round(pct)));

  if (safePct >= 80) return "stable";
  if (safePct >= 60) return "watch";
  if (safePct >= 40) return "fragile";
  return "escalate";
}

export function buildSectionScore(args: {
  sectionId: string;
  title: string;
  answers: DiagnosticAnswer[];
}): DiagnosticSectionScore {
  const safeAnswers = Array.isArray(args.answers) ? args.answers : [];

  const score = safeAnswers.reduce((sum, answer) => {
    const value = Number(answer?.value || 0);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

  const maxScore = safeAnswers.length * 5;
  const pct = computePct(score, maxScore);

  return {
    sectionId: args.sectionId,
    title: args.title,
    score,
    maxScore,
    pct,
  };
}

export function scoreToneClass(pct: number): string {
  const safePct = Math.max(0, Math.min(100, Math.round(pct)));

  if (safePct >= 80) return "text-emerald-300";
  if (safePct >= 60) return "text-amber-300";
  if (safePct >= 40) return "text-orange-300";
  return "text-red-300";
}

export function scoreBarClass(pct: number): string {
  const safePct = Math.max(0, Math.min(100, Math.round(pct)));

  if (safePct >= 80) return "bg-emerald-400";
  if (safePct >= 60) return "bg-amber-300";
  if (safePct >= 40) return "bg-orange-300";
  return "bg-red-400";
}

export function getRecommendedDiagnosticPath(args: {
  kind: string;
  pct: number;
}): string {
  const kind = String(args.kind || "").toLowerCase();
  const pct = Math.max(0, Math.min(100, Math.round(args.pct)));

  if (kind === "initial-assessment" || kind === "directional-integrity") {
    if (pct >= 80) return "/diagnostics/team-alignment";
    if (pct >= 60) return "/diagnostics/team-alignment";
    if (pct >= 40) return "/diagnostics/team-alignment";
    return "/diagnostics/team-alignment";
  }

  if (kind === "team-alignment") {
    if (pct >= 80) return "/diagnostics/enterprise";
    if (pct >= 60) return "/diagnostics/enterprise";
    if (pct >= 40) return "/diagnostics/enterprise";
    return "/diagnostics/enterprise";
  }

  if (kind === "enterprise") {
    return "/consulting/strategy-room";
  }

  return "/diagnostics";
}

export async function submitDiagnostic(
  payload: DiagnosticSubmissionPayload,
): Promise<DiagnosticSubmitResponse> {
  try {
    const res = await fetch("/api/diagnostics/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    });

    const json = (await res.json().catch(() => null)) as DiagnosticSubmitResponse | null;

    if (!json) {
      return { ok: false, error: "INVALID_RESPONSE" };
    }

    if (!res.ok || !json.ok) {
      return { ok: false, error: json.ok ? "UNKNOWN_ERROR" : json.error };
    }

    return json;
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "SUBMIT_FAILED",
    };
  }
}