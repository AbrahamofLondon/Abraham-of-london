// lib/ai/predictive-deal-engine.ts
// ============================================================================
// PREDICTIVE DEAL ENGINE — REVENUE, WIN, PRIORITY, AND PIPELINE INTELLIGENCE
// Institutional-grade, deterministic-first, AI-assisted, production-safe.
// ============================================================================

export type DealRoute = "REJECT" | "DIAGNOSTIC" | "STRATEGY";
export type DealQuality = "LOW" | "MID" | "HIGH" | "ELITE";
export type DealIntent = "growth" | "crisis" | "exploration";
export type DealPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type PipelineTemperature = "COLD" | "WARM" | "HOT";

export interface PredictiveDealInput {
  id?: string;
  createdAt?: string | Date | null;
  name?: string | null;
  email?: string | null;

  revenue: number | string;
  problem: string;
  urgency: string;
  authority: string;

  // Existing scoring layers
  ruleScore?: number | null;
  aiScore?: number | null;
  aiConfidence?: number | null;
  aiIntent?: DealIntent | string | null;
  aiDealQuality?: DealQuality | string | null;

  // Behaviour
  sessionDepth?: number | null;
  timeOnSite?: number | null; // seconds
  returnVisitor?: boolean | null;

  // Lifecycle / historic hints
  route?: DealRoute | string | null;
  status?: string | null; // NEW, CONTACTED, CLOSED, LOST
}

export interface PredictiveDealResult {
  normalizedRevenue: number;
  blendedScore: number;
  winProbability: number; // 0..100
  closeVelocityDays: number;
  expectedRevenue: number;
  pipelineTemperature: PipelineTemperature;
  priority: DealPriority;
  intent: DealIntent;
  quality: DealQuality;
  nextBestAction:
    | "REJECT_OR_NURTURE"
    | "SEND_TO_DIAGNOSTIC"
    | "FAST_TRACK_STRATEGY"
    | "MANUAL_REVIEW";
  rationale: string[];
}

function safeString(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function safeNumber(v: unknown, fallback = 0): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : fallback;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function roundTo(n: number, digits = 2): number {
  return Number(n.toFixed(digits));
}

function normalizeAuthority(input: string): boolean {
  const s = safeString(input).trim().toLowerCase();
  return ["yes", "y", "true", "1", "owner", "founder", "decision maker", "decision-maker"].includes(s);
}

function normalizeIntent(input: unknown, problem: string): DealIntent {
  const raw = safeString(input).trim().toLowerCase();
  if (raw === "growth" || raw === "crisis" || raw === "exploration") return raw;

  const p = problem.toLowerCase();
  if (
    /\b(crisis|urgent|broken|stuck|failure|burnout|collapse|attrition|decline|loss|chaos)\b/.test(
      p
    )
  ) {
    return "crisis";
  }
  if (/\b(scale|growth|expand|expansion|market|raise|restructure|launch)\b/.test(p)) {
    return "growth";
  }
  return "exploration";
}

function normalizeQuality(input: unknown, score: number): DealQuality {
  const raw = safeString(input).trim().toUpperCase();
  if (raw === "LOW" || raw === "MID" || raw === "HIGH" || raw === "ELITE") {
    return raw as DealQuality;
  }
  if (score >= 85) return "ELITE";
  if (score >= 70) return "HIGH";
  if (score >= 50) return "MID";
  return "LOW";
}

function inferTemperature(winProbability: number): PipelineTemperature {
  if (winProbability >= 75) return "HOT";
  if (winProbability >= 45) return "WARM";
  return "COLD";
}

function inferPriority(
  winProbability: number,
  normalizedRevenue: number,
  intent: DealIntent,
  authority: boolean
): DealPriority {
  let score = 0;

  if (winProbability >= 80) score += 40;
  else if (winProbability >= 65) score += 28;
  else if (winProbability >= 50) score += 18;

  if (normalizedRevenue >= 1_000_000) score += 30;
  else if (normalizedRevenue >= 500_000) score += 22;
  else if (normalizedRevenue >= 250_000) score += 14;
  else if (normalizedRevenue >= 100_000) score += 8;

  if (intent === "crisis") score += 18;
  if (authority) score += 12;

  if (score >= 78) return "CRITICAL";
  if (score >= 58) return "HIGH";
  if (score >= 34) return "MEDIUM";
  return "LOW";
}

function inferNextBestAction(
  winProbability: number,
  quality: DealQuality,
  authority: boolean
): PredictiveDealResult["nextBestAction"] {
  if (winProbability < 35) return "REJECT_OR_NURTURE";
  if (winProbability >= 75 && (quality === "HIGH" || quality === "ELITE") && authority) {
    return "FAST_TRACK_STRATEGY";
  }
  if (winProbability >= 45) return "SEND_TO_DIAGNOSTIC";
  return "MANUAL_REVIEW";
}

export function predictDealOutcome(input: PredictiveDealInput): PredictiveDealResult {
  const rationale: string[] = [];

  const revenue = Math.max(0, safeNumber(input.revenue, 0));
  const problem = safeString(input.problem).trim();
  const urgency = safeString(input.urgency).trim().toLowerCase();
  const authority = normalizeAuthority(input.authority);

  const ruleScore = clamp(safeNumber(input.ruleScore, 0), 0, 100);
  const aiScore = clamp(safeNumber(input.aiScore, 0), 0, 100);
  const aiConfidence = clamp(safeNumber(input.aiConfidence, 0.5), 0, 1);

  const sessionDepth = clamp(safeNumber(input.sessionDepth, 0), 0, 1000);
  const timeOnSite = clamp(safeNumber(input.timeOnSite, 0), 0, 86400);
  const returnVisitor = Boolean(input.returnVisitor);

  // Weighted blend — deterministic score remains dominant, AI score gets confidence-weighted.
  const aiWeighted = aiScore * (0.25 + aiConfidence * 0.75);
  const blendedScore = roundTo(clamp(ruleScore * 0.58 + aiWeighted * 0.42, 0, 100), 2);

  if (ruleScore > 0) rationale.push(`Rule score contributed ${roundTo(ruleScore, 1)} points.`);
  if (aiScore > 0) rationale.push(`AI score contributed ${roundTo(aiWeighted, 1)} weighted points.`);

  const intent = normalizeIntent(input.aiIntent, problem);
  const quality = normalizeQuality(input.aiDealQuality, blendedScore);

  if (intent === "crisis") rationale.push("Problem language suggests active operational or structural pressure.");
  if (intent === "growth") rationale.push("Problem language suggests growth or expansion pressure.");
  if (authority) rationale.push("Buyer indicates direct decision authority.");
  else rationale.push("Decision authority is weak or unclear.");

  // Behaviour multipliers
  let behaviouralLift = 0;
  if (sessionDepth >= 5) behaviouralLift += 6;
  else if (sessionDepth >= 3) behaviouralLift += 3;

  if (timeOnSite >= 600) behaviouralLift += 7;
  else if (timeOnSite >= 240) behaviouralLift += 4;
  else if (timeOnSite >= 90) behaviouralLift += 2;

  if (returnVisitor) behaviouralLift += 8;

  if (behaviouralLift > 0) {
    rationale.push(`Behavioural engagement added ${behaviouralLift} points of buyer seriousness.`);
  }

  // Revenue leverage
  let revenueLift = 0;
  if (revenue >= 2_500_000) revenueLift += 15;
  else if (revenue >= 1_000_000) revenueLift += 12;
  else if (revenue >= 500_000) revenueLift += 8;
  else if (revenue >= 250_000) revenueLift += 5;
  else if (revenue >= 100_000) revenueLift += 2;

  if (revenueLift > 0) rationale.push(`Revenue scale added ${revenueLift} points of commercial weight.`);

  // Urgency lift
  let urgencyLift = 0;
  if (urgency.includes("week")) urgencyLift += 10;
  else if (urgency.includes("month")) urgencyLift += 6;
  else if (urgency.includes("quarter")) urgencyLift += 2;

  if (urgencyLift > 0) rationale.push(`Timeline urgency added ${urgencyLift} points.`);

  // Problem richness
  let problemLift = 0;
  if (problem.length >= 300) problemLift += 8;
  else if (problem.length >= 180) problemLift += 5;
  else if (problem.length >= 90) problemLift += 2;

  if (problemLift > 0) rationale.push("Problem description shows non-trivial thought and context depth.");

  // Final probability
  let winProbability =
    blendedScore * 0.55 +
    behaviouralLift +
    revenueLift +
    urgencyLift +
    problemLift +
    (authority ? 8 : -4) +
    (intent === "crisis" ? 6 : intent === "growth" ? 4 : 0);

  winProbability = roundTo(clamp(winProbability, 0, 99), 1);

  // Close velocity — lower is faster
  let closeVelocityDays = 45;
  if (winProbability >= 85) closeVelocityDays = 7;
  else if (winProbability >= 75) closeVelocityDays = 12;
  else if (winProbability >= 65) closeVelocityDays = 18;
  else if (winProbability >= 50) closeVelocityDays = 28;
  else if (winProbability >= 35) closeVelocityDays = 45;
  else closeVelocityDays = 75;

  if (intent === "crisis") closeVelocityDays = Math.max(5, closeVelocityDays - 5);
  if (!authority) closeVelocityDays += 10;

  closeVelocityDays = Math.round(closeVelocityDays);

  // Expected revenue — conservative proxy for advisory potential, not company turnover.
  let baseServiceValue = 0;
  if (revenue >= 2_500_000) baseServiceValue = 45_000;
  else if (revenue >= 1_000_000) baseServiceValue = 25_000;
  else if (revenue >= 500_000) baseServiceValue = 15_000;
  else if (revenue >= 250_000) baseServiceValue = 8_500;
  else if (revenue >= 100_000) baseServiceValue = 4_500;
  else baseServiceValue = 1_200;

  const expectedRevenue = Math.round(baseServiceValue * (winProbability / 100));
  const pipelineTemperature = inferTemperature(winProbability);
  const priority = inferPriority(winProbability, revenue, intent, authority);
  const nextBestAction = inferNextBestAction(winProbability, quality, authority);

  if (winProbability >= 75) rationale.push("Deal shows serious commercial and execution potential.");
  else if (winProbability >= 45) rationale.push("Deal is viable but should be educated or qualified further.");
  else rationale.push("Deal is weak, early, or misrouted relative to premium intervention.");

  return {
    normalizedRevenue: revenue,
    blendedScore,
    winProbability,
    closeVelocityDays,
    expectedRevenue,
    pipelineTemperature,
    priority,
    intent,
    quality,
    nextBestAction,
    rationale,
  };
}