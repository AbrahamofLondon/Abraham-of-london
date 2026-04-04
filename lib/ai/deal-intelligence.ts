// lib/ai/deal-intelligence.ts
export type DealRoute = "REJECT" | "DIAGNOSTIC" | "STRATEGY";

export interface DealAiInput {
  revenue?: number | string;
  problem?: string;
  urgency?: string;
  authority?: string | boolean;
  sessionDepth?: number;
  timeOnSite?: number;
  returnVisitor?: boolean;
}

export interface DealAiResult {
  score: number;
  confidence: number;
  routeHint: DealRoute;
  rationale: string[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.-]/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function normalizeAuthority(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  const raw = String(value ?? "").trim().toLowerCase();
  return ["yes", "y", "true", "1", "founder", "owner", "decision maker", "decision-maker"].includes(raw);
}

function normalizeUrgency(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

export function fuseScores(ruleScore: number, aiScore: number): DealRoute {
  const final = ruleScore * 0.6 + aiScore * 0.4;

  if (final >= 85) return "STRATEGY";
  if (final >= 60) return "DIAGNOSTIC";
  return "REJECT";
}

/**
 * Backward-compatible AI evaluator.
 * Your /pages/api/deal-flow/qualify.ts currently imports evaluateDealAI.
 */
export function evaluateDealAI(input: DealAiInput): DealAiResult {
  const rationale: string[] = [];
  let score = 35;

  const revenue = safeNumber(input.revenue, 0);
  const authority = normalizeAuthority(input.authority);
  const urgency = normalizeUrgency(input.urgency);
  const problem = String(input.problem ?? "").trim();
  const sessionDepth = safeNumber(input.sessionDepth, 0);
  const timeOnSite = safeNumber(input.timeOnSite, 0);

  if (revenue >= 1_000_000) {
    score += 20;
    rationale.push("Revenue band indicates enterprise-grade buying capacity.");
  } else if (revenue >= 500_000) {
    score += 14;
    rationale.push("Revenue band indicates meaningful budget capacity.");
  } else if (revenue >= 250_000) {
    score += 8;
    rationale.push("Revenue band indicates moderate commercial capacity.");
  }

  if (authority) {
    score += 12;
    rationale.push("Decision authority signal is positive.");
  } else {
    rationale.push("Decision authority is not clearly confirmed.");
  }

  if (urgency.includes("week")) {
    score += 12;
    rationale.push("Urgency indicates immediate decision window.");
  } else if (urgency.includes("month")) {
    score += 8;
    rationale.push("Urgency indicates near-term commercial pressure.");
  } else if (urgency.includes("quarter")) {
    score += 4;
    rationale.push("Urgency indicates medium-horizon decision cycle.");
  }

  if (problem.length >= 250) {
    score += 10;
    rationale.push("Problem statement is well-developed.");
  } else if (problem.length >= 100) {
    score += 6;
    rationale.push("Problem statement is reasonably developed.");
  } else if (problem.length >= 30) {
    score += 2;
    rationale.push("Problem statement is present but shallow.");
  }

  if (sessionDepth >= 5) {
    score += 4;
    rationale.push("Deep session behaviour suggests strong intent.");
  } else if (sessionDepth >= 3) {
    score += 2;
  }

  if (timeOnSite >= 600) {
    score += 4;
    rationale.push("High dwell time suggests serious evaluation.");
  } else if (timeOnSite >= 180) {
    score += 2;
  }

  if (input.returnVisitor) {
    score += 3;
    rationale.push("Return-visitor behaviour detected.");
  }

  const finalScore = clamp(Math.round(score), 0, 100);
  const routeHint =
    finalScore >= 85 ? "STRATEGY" : finalScore >= 60 ? "DIAGNOSTIC" : "REJECT";

  const confidence = clamp(
    55 +
      (authority ? 10 : 0) +
      (problem.length >= 100 ? 8 : 0) +
      (input.returnVisitor ? 5 : 0),
    45,
    95
  );

  return {
    score: finalScore,
    confidence,
    routeHint,
    rationale,
  };
}