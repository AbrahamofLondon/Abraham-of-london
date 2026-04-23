export type AIExposureLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
export type AIDecisionRiskClassification =
  | "AI_LAG"
  | "AI_MISUSE"
  | "AI_ABSENCE"
  | "AI_PARITY"
  | "AI_ADVANTAGE";

export type AIDecisionRiskInput = {
  decisionText?: string | null;
  constraintText?: string | null;
  priorAttemptText?: string | null;
  costOfDelayText?: string | null;
  affectedDomain?: string | null;
  aiExposureLevel?: AIExposureLevel | string | null;
  aiDisplacementRisk?: boolean | null;
  decisionVelocityScore?: number | null;
};

export type AIDecisionRisk = {
  classification: AIDecisionRiskClassification;
  aiExposureLevel: AIExposureLevel;
  aiDisplacementRisk: boolean;
  decisionVelocityScore: number;
  competitorBaselineScore: number;
  accelerationRiskScore: number;
  requiresAILeverageAction: boolean;
  contradiction: {
    type: "AI_CAPABILITY_CONTRADICTION";
    label: string;
    summary: string;
    severityMultiplier: 1.5;
  } | null;
};

const AUTOMATION_EXPECTED_TERMS = [
  "manual",
  "spreadsheet",
  "handoff",
  "reconciliation",
  "reporting",
  "triage",
  "support",
  "operations",
  "workflow",
  "queue",
  "analysis",
  "forecast",
  "research",
];

const AI_TOOL_PRESENT_TERMS = ["ai", "automation", "model", "agent", "copilot", "llm"];
const MISUSE_TERMS = ["wrong", "unused", "ignored", "failed", "chaotic", "inconsistent", "untrusted"];

function cleanText(input: AIDecisionRiskInput): string {
  return [
    input.decisionText,
    input.constraintText,
    input.priorAttemptText,
    input.costOfDelayText,
    input.affectedDomain,
  ].filter(Boolean).join(" ").toLowerCase();
}

function clampScore(value: number | null | undefined, fallback = 50): number {
  if (!Number.isFinite(value ?? NaN)) return fallback;
  return Math.max(0, Math.min(100, Math.round(value as number)));
}

export function normalizeAIExposureLevel(value: string | null | undefined): AIExposureLevel {
  const normalized = String(value || "").toUpperCase();
  if (normalized === "LOW" || normalized === "MODERATE" || normalized === "HIGH" || normalized === "CRITICAL") {
    return normalized;
  }
  return "MODERATE";
}

export function inferAIExposureLevel(input: AIDecisionRiskInput): AIExposureLevel {
  const explicit = normalizeAIExposureLevel(input.aiExposureLevel);
  if (input.aiExposureLevel) return explicit;

  const text = cleanText(input);
  const automationExpected = AUTOMATION_EXPECTED_TERMS.some((term) => text.includes(term));
  const displacementLanguage = /replace|eliminate|automate|faster|competitor|market|cost|margin|headcount/.test(text);
  const velocity = clampScore(input.decisionVelocityScore, 50);

  if ((automationExpected && displacementLanguage) || velocity < 25) return "HIGH";
  if (automationExpected || displacementLanguage || velocity < 45) return "MODERATE";
  return "LOW";
}

export function classifyAIDecisionRisk(input: AIDecisionRiskInput): AIDecisionRisk {
  const text = cleanText(input);
  const aiExposureLevel = inferAIExposureLevel(input);
  const decisionVelocityScore = clampScore(input.decisionVelocityScore, 50);
  const aiMentioned = AI_TOOL_PRESENT_TERMS.some((term) => text.includes(term));
  const misuseDetected = aiMentioned && MISUSE_TERMS.some((term) => text.includes(term));
  const manualProcessDetected = AUTOMATION_EXPECTED_TERMS.some((term) => text.includes(term));
  const competitorBaselineScore =
    aiExposureLevel === "CRITICAL" ? 85
      : aiExposureLevel === "HIGH" ? 75
        : aiExposureLevel === "MODERATE" ? 62
          : 45;
  const velocityGap = Math.max(0, competitorBaselineScore - decisionVelocityScore);
  const displacementRisk = Boolean(input.aiDisplacementRisk) || (velocityGap >= 25 && manualProcessDetected);

  let classification: AIDecisionRiskClassification = "AI_PARITY";
  if (misuseDetected) classification = "AI_MISUSE";
  else if (!aiMentioned && manualProcessDetected && aiExposureLevel !== "LOW") classification = "AI_ABSENCE";
  else if (velocityGap >= 18 || displacementRisk) classification = "AI_LAG";
  else if (decisionVelocityScore >= competitorBaselineScore + 12) classification = "AI_ADVANTAGE";

  const accelerationRiskScore = Math.max(0, Math.min(100, Math.round(velocityGap * 1.5 + (displacementRisk ? 20 : 0))));
  const requiresAILeverageAction = aiExposureLevel === "HIGH" || aiExposureLevel === "CRITICAL";

  const contradiction = classification === "AI_PARITY" || classification === "AI_ADVANTAGE"
    ? null
    : {
        type: "AI_CAPABILITY_CONTRADICTION" as const,
        label: classification.replace(/_/g, " "),
        summary:
          classification === "AI_MISUSE"
            ? "AI capability is present but not being applied with enough governance to improve decision velocity."
            : classification === "AI_ABSENCE"
              ? "The decision still depends on manual capacity where AI-enabled competitors are likely compressing the cycle."
              : "Decision velocity is below the inferred AI-enabled competitor baseline.",
        severityMultiplier: 1.5 as const,
      };

  return {
    classification,
    aiExposureLevel,
    aiDisplacementRisk: displacementRisk,
    decisionVelocityScore,
    competitorBaselineScore,
    accelerationRiskScore,
    requiresAILeverageAction,
    contradiction,
  };
}

export function aiStatusSignalFromDelta(delta: number): "VELOCITY LOSS" | "PARITY HOLD" | "ACCELERATION GAIN" {
  if (delta <= -5) return "VELOCITY LOSS";
  if (delta >= 5) return "ACCELERATION GAIN";
  return "PARITY HOLD";
}
