/* lib/constitution/constitutional-diagnostic-derivation.ts */
import {
  evaluateConstitutionalRoute,
  type ConstitutionalDecision,
} from "@/lib/constitution/rules";

export type LikertValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type DiagnosticAnswer = {
  resonance: LikertValue;
  certainty: LikertValue;
};

/** @deprecated Use DiagnosticAnswer */
export type DiagnosticAnswerValue = DiagnosticAnswer;

export type DiagnosticAnswers = Record<string, DiagnosticAnswer>;

export type DiagnosticQuestion = {
  id: string;
  text: string;
  domain: string;
  reverse?: boolean;
};

export const DEFAULT_DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  { id: "q1", text: "Our strategic intent and how we actually spend resources are aligned.", domain: "IDENTITY" },
  { id: "q2", text: "There is a clear reason this organisation exists — and decisions are made because of it.", domain: "IDENTITY" },
  { id: "q3", text: "Leadership communicates consistent signals about what matters most.", domain: "IDENTITY" },
  { id: "q4", text: "The organisation has a clearly defined identity that is understood across levels.", domain: "IDENTITY" },
  { id: "q5", text: "Everyone knows who has the final say — and that person actually decides.", domain: "DECISION" },
  { id: "q6", text: "Decisions are made at the right level — they do not keep getting pushed upward.", domain: "DECISION" },
  { id: "q7", text: "For every major initiative, there is one person who is clearly responsible for making it succeed.", domain: "DECISION" },
  { id: "q8", text: "High-stakes decisions are made with sufficient information and appropriate speed.", domain: "DECISION" },
  { id: "q9", text: "The operating environment has changed faster than our capacity to adapt.", domain: "ENVIRONMENT", reverse: true },
  { id: "q10", text: "External pressures (market, regulatory, competitive) are actively forcing attention.", domain: "ENVIRONMENT" },
  { id: "q11", text: "The organisation responds to environmental signals before they become crises.", domain: "ENVIRONMENT" },
  { id: "q12", text: "We have enough situational awareness to act with confidence.", domain: "ENVIRONMENT" },
  { id: "q13", text: "Our stated values are reflected in day-to-day behaviour across leadership.", domain: "BEHAVIOUR" },
  { id: "q14", text: "There is a growing gap between what leadership says and what actually happens.", domain: "BEHAVIOUR", reverse: true },
  { id: "q15", text: "Bureaucracy, misalignment, and unnecessary delay are seriously slowing things down.", domain: "BEHAVIOUR", reverse: true },
  { id: "q16", text: "The way people actually behave matches what the organisation says it is trying to do.", domain: "BEHAVIOUR" },
  { id: "q17", text: "There is a clear and compelling sense of why this organisation exists.", domain: "PURPOSE" },
  { id: "q18", text: "Getting this wrong — or doing nothing — would cause real, significant damage. And people know it.", domain: "PURPOSE" },
  { id: "q19", text: "We are not sacrificing long-term direction to hit short-term targets.", domain: "PURPOSE" },
  { id: "q20", text: "People throughout the organisation can articulate what success looks like.", domain: "PURPOSE" },
  { id: "q21", text: "Trust between leadership and execution layers is intact.", domain: "RELATIONSHIP" },
  { id: "q22", text: "Internal relationships support rather than obstruct execution.", domain: "RELATIONSHIP" },
  { id: "q23", text: "We actively manage the relationships that matter — they are not left to drift.", domain: "RELATIONSHIP" },
  { id: "q24", text: "When there is a disagreement, it gets raised and dealt with — not buried.", domain: "RELATIONSHIP" },
  { id: "q25", text: "We have tried to fix deep problems before and failed — not for lack of effort, but because the root cause was never addressed.", domain: "LEGACY", reverse: true },
  { id: "q26", text: "The organisation's history and experience help us make better decisions — rather than trapping us in old patterns.", domain: "LEGACY" },
  { id: "q27", text: "The organisation has demonstrated resilience and adaptation over its history.", domain: "LEGACY" },
  { id: "q28", text: "Old commitments and obligations are not blocking the changes we need to make.", domain: "LEGACY" },
];

export type ConstitutionalDiagnosticReport = {
  completionPercent: number;
  totalQuestions: number;
  answeredQuestions: number;
  averageResonance: number;
  averageCertainty: number;
  overallClarityScore: number;
  posture: "ORDERED" | "DRIFTING" | "MISALIGNED" | "DISORDERED";
  seriousnessScore: number; // 0-100
  readinessTier: "SOVEREIGN" | "EXECUTION_READY" | "STABILIZING" | "EMERGING" | "FRAGILE";
  authorityType: "DIRECT" | "PROXY" | "UNCLEAR";
  temperature: "COLD" | "COOL" | "WARM" | "HOT";
  dominantDomains: string[];
  failureModes: string[];
  summary: string;
  // Domain signal scores (0-100) used by constitutional bridge
  authorityScore: number;
  coherenceScore: number;
  pressureScore: number;
  frictionScore: number;
  trustScore: number;
  narrativeCoherence: number;
  interventionReadiness: number;
};

/** @deprecated Use ConstitutionalDiagnosticReport */
export type ConstitutionalMicroReport = ConstitutionalDiagnosticReport;

/** @deprecated Use DiagnosticBundle */
export type ConstitutionalDiagnosticBundle = DiagnosticBundle;

export type DiagnosticBundle = {
  report: ConstitutionalDiagnosticReport;
  constitutionalInput: {
    clarityScore: number;
    authorityType: string;
    readinessTier: string;
    posture: string;
    failureModeCount: number;
    failureModeSeverity: number;
    narrativeCoherence: number;
    interventionReadiness: number;
  };
  decision: ConstitutionalDecision;
  routeSummary: {
    route: string;
    confidence: number;
    message: string;
  };
};

const DOMAIN_WEIGHTS: Record<string, number> = {
  IDENTITY: 1.4,
  DECISION: 1.35,
  ENVIRONMENT: 1.1,
  BEHAVIOUR: 1.2,
  PURPOSE: 1.5,
  RELATIONSHIP: 1.25,
  LEGACY: 1.3,
};

function calculateOverallClarity(answers: DiagnosticAnswers): number {
  if (Object.keys(answers).length === 0) return 0;

  let total = 0;
  let count = 0;

  Object.values(answers).forEach(({ resonance, certainty }) => {
    const weighted = resonance * (certainty / 10);
    total += weighted;
    count++;
  });

  return Math.round((total / count) * 10);
}

function determinePosture(clarityScore: number, failureModeCount: number): "ORDERED" | "DRIFTING" | "MISALIGNED" | "DISORDERED" {
  if (clarityScore >= 85 && failureModeCount <= 1) return "ORDERED";
  if (clarityScore >= 65 && failureModeCount <= 3) return "DRIFTING";
  if (clarityScore >= 45) return "MISALIGNED";
  return "DISORDERED";
}

function calculateSeriousnessScore(clarity: number, failureCount: number): number {
  const clarityPenalty = 100 - clarity;
  const failurePenalty = failureCount * 18;
  return Math.min(100, Math.round(clarityPenalty * 0.6 + failurePenalty * 0.4));
}

export function deriveConstitutionalDiagnosticBundle(
  answers: DiagnosticAnswers,
  metadata: { operatorKey?: string; operatorOverrideRequested?: boolean } = {}
): DiagnosticBundle {
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = 28; // assuming full diagnostic has ~28 questions
  const completionPercent = Math.round((answeredCount / totalQuestions) * 100);

  const clarityScore = calculateOverallClarity(answers);
  const failureModeCount = Math.max(0, Math.floor((100 - clarityScore) / 18));
  const failureModeSeverity = failureModeCount * 22;

  const posture = determinePosture(clarityScore, failureModeCount);
  const seriousnessScore = calculateSeriousnessScore(clarityScore, failureModeCount);

  const constitutionalInput = {
    clarityScore,
    authorityType: (clarityScore > 75 ? "DIRECT" : clarityScore > 55 ? "PROXY" : "UNCLEAR") as "DIRECT" | "PROXY" | "UNCLEAR",
    readinessTier: (clarityScore > 80 ? "EXECUTION_READY" : clarityScore > 65 ? "STABILIZING" : clarityScore > 45 ? "EMERGING" : "FRAGILE") as "SOVEREIGN" | "EXECUTION_READY" | "STABILIZING" | "EMERGING" | "FRAGILE",
    posture,
    failureModeCount,
    failureModeSeverity,
    narrativeCoherence: Math.round(clarityScore * 0.85),
    interventionReadiness: Math.round(100 - (failureModeCount * 14)),
  };

  const decision = evaluateConstitutionalRoute(constitutionalInput);

  const routeSummary = {
    route: decision.route,
    confidence: decision.confidence,
    message: decision.route === "STRATEGY"
      ? "Strong signal — ready for strategic guidance"
      : decision.route === "DIAGNOSTIC"
      ? "Moderate signal — diagnostic refinement recommended"
      : "Weak signal — foundational realignment needed",
  };

  const report: ConstitutionalDiagnosticReport = {
    completionPercent,
    totalQuestions,
    answeredQuestions: answeredCount,
    averageResonance: Math.round(clarityScore / 10),
    averageCertainty: Math.round(Object.values(answers).reduce((sum, a) => sum + a.certainty, 0) / answeredCount || 5),
    overallClarityScore: clarityScore,
    posture,
    seriousnessScore,
    readinessTier: constitutionalInput.readinessTier as any,
    authorityType: constitutionalInput.authorityType as any,
    temperature: seriousnessScore > 75 ? "HOT" : seriousnessScore > 50 ? "WARM" : "COOL",
    dominantDomains: ["IDENTITY", "PURPOSE", "DECISION"], // can be enhanced later
    failureModes: failureModeCount > 3 ? ["Structural drift", "Conviction erosion", "Governance fatigue"] : [],
    summary: posture === "ORDERED"
      ? "The organisation demonstrates strong constitutional alignment and decision clarity."
      : posture === "DRIFTING"
      ? "The organisation is drifting from its constitutional alignment — early intervention is advised."
      : posture === "MISALIGNED"
      ? "Significant misalignment detected. Diagnostic intervention is required before escalation."
      : "Critical disorder detected. Foundational realignment must precede any strategic action.",
    // Domain signal scores derived from clarity
    authorityScore: Math.round(clarityScore * (clarityScore > 75 ? 0.95 : 0.70)),
    coherenceScore: Math.round(clarityScore * 0.85),
    pressureScore: Math.round(100 - clarityScore * 0.6),
    frictionScore: Math.round(100 - clarityScore * 0.9),
    trustScore: Math.round(clarityScore * 0.80),
    narrativeCoherence: constitutionalInput.narrativeCoherence,
    interventionReadiness: constitutionalInput.interventionReadiness,
  };

  return {
    report,
    constitutionalInput,
    decision,
    routeSummary,
  };
}