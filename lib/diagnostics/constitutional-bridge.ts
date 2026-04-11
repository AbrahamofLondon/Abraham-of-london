/* ============================================================================
   FILE: lib/diagnostics/constitutional-bridge.ts
   PURPOSE:
   - Translate constitutional intake output into inherited payloads
     for:
       1. team assessment
       2. executive reporting
       3. strategy room
   - Prevent downstream re-asking of what the system already knows
   NOTES:
   - Pure transformation layer
   - No React
   - No database dependency
============================================================================ */

import type {
  ConstitutionalDiagnosticBundle,
  ConstitutionalMicroReport,
} from "@/lib/constitution/constitutional-diagnostic-derivation";
import type { ConstitutionalDecision } from "@/lib/constitution/rules";

export type BridgeNextStage =
  | "team-assessment"
  | "executive-reporting"
  | "strategy-room";

export type TeamAssessmentSeed = {
  source: "constitutional-intake";
  inheritedSignal: {
    authorityScore: number;
    coherenceScore: number;
    pressureScore: number;
    frictionScore: number;
    trustScore: number;
    posture: string;
    readinessTier: string;
    authorityType: string;
    seriousnessScore: number;
  };
  prompts: string[];
  hypotheses: string[];
  recommendedRespondentGroups: string[];
};

export type ExecutiveReportingSeed = {
  source: "constitutional-intake";
  executiveSummary: string;
  headline: string;
  constitutionalRoute: ConstitutionalDecision["route"];
  posture: string;
  readinessTier: string;
  authorityType: string;
  principalRisks: string[];
  priorityInterventions: string[];
  boardLevelQuestion: string;
};

export type StrategyRoomSeed = {
  source: "constitutional-intake";
  escalationFit: {
    route: ConstitutionalDecision["route"];
    confidence: number;
    posture: string;
    readinessTier: string;
    authorityType: string;
    escalationAllowed: boolean;
  };
  mandateDraft: string;
  risksToContainFirst: string[];
  privateChamberRationale: string[];
};

export type ConstitutionalBridgeBundle = {
  teamAssessment: TeamAssessmentSeed;
  executiveReporting: ExecutiveReportingSeed;
  strategyRoom: StrategyRoomSeed;
};

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.map((x) => x.trim()).filter(Boolean)));
}

function buildHeadline(report: ConstitutionalMicroReport): string {
  if (report.posture === "DISORDERED") {
    return "Structural disorder is impairing safe escalation.";
  }
  if (report.posture === "MISALIGNED") {
    return "The signal is real, but the organisation is misaligned.";
  }
  if (report.posture === "DRIFTING") {
    return "Strategic drift is visible, but still governable.";
  }
  return "The signal is meaningful within a comparatively ordered environment.";
}

function buildPrincipalRisks(
  report: ConstitutionalMicroReport,
  decision: ConstitutionalDecision,
): string[] {
  const risks: string[] = [];

  if (report.authorityType === "UNCLEAR") {
    risks.push("Escalation without explicit decision authority.");
  }
  if (report.frictionScore >= 60) {
    risks.push("Execution drag caused by structural friction.");
  }
  if (report.trustScore < 45) {
    risks.push("Trust erosion undermining intervention fit.");
  }
  if (report.narrativeCoherence < 50) {
    risks.push("Weak narrative coherence distorting problem definition.");
  }
  if (report.pressureScore >= 70) {
    risks.push("External pressure forcing premature or reactive choices.");
  }

  return dedupe([...risks, ...decision.disqualifiersTriggered]);
}

function buildTeamAssessmentPrompts(report: ConstitutionalMicroReport): string[] {
  const prompts: string[] = [
    "Where does leadership believe authority sits, and where does execution believe it sits?",
    "Which strategic priority is stated clearly but funded weakly?",
    "Where is coordination drag most visible in practice?",
  ];

  if (report.trustScore < 50) {
    prompts.push("Where has trust between leadership and execution materially weakened?");
  }

  if (report.frictionScore >= 60) {
    prompts.push("Which recurring coordination failures consume the most leadership energy?");
  }

  if (report.coherenceScore < 55) {
    prompts.push("Which parts of the stated strategy are interpreted differently across teams?");
  }

  return dedupe(prompts);
}

function buildTeamAssessmentHypotheses(report: ConstitutionalMicroReport): string[] {
  const hypotheses: string[] = [];

  if (report.authorityType !== "DIRECT") {
    hypotheses.push("Authority may be perceived differently across organisational layers.");
  }
  if (report.coherenceScore < 60) {
    hypotheses.push("Strategic language and operating decisions may be materially out of alignment.");
  }
  if (report.frictionScore >= 60) {
    hypotheses.push("Operational drag is likely structural rather than motivational.");
  }
  if (report.trustScore < 50) {
    hypotheses.push("Trust condition may be reducing execution honesty and escalation quality.");
  }
  if (hypotheses.length === 0) {
    hypotheses.push("The issue may be narrower than it currently appears once team variance is measured.");
  }

  return hypotheses;
}

function buildRecommendedRespondentGroups(report: ConstitutionalMicroReport): string[] {
  const groups = ["Executive leadership", "Mid-level operators"];

  if (report.authorityType !== "DIRECT") {
    groups.push("Decision owners / sponsors");
  }
  if (report.frictionScore >= 55) {
    groups.push("Cross-functional coordinators");
  }
  if (report.trustScore < 55) {
    groups.push("Execution leaders closest to delivery friction");
  }

  return dedupe(groups);
}

function buildBoardLevelQuestion(
  report: ConstitutionalMicroReport,
  decision: ConstitutionalDecision,
): string {
  if (decision.route === "STRATEGY") {
    return "What decision must now be made, by whom, and in what order, to contain downside without widening institutional risk?";
  }
  if (report.posture === "DISORDERED") {
    return "What foundational order must be restored before premium intervention becomes safe and defensible?";
  }
  return "What is the sharpest disciplined reading of this signal before escalation becomes justified?";
}

function buildMandateDraft(
  report: ConstitutionalMicroReport,
  decision: ConstitutionalDecision,
): string {
  const severity =
    report.pressureScore >= 70 || report.frictionScore >= 70
      ? "material"
      : "meaningful";

  return [
    `We are facing a ${severity} structural issue.`,
    `Current posture reads as ${report.posture}.`,
    `Authority type reads as ${report.authorityType}.`,
    `Readiness tier reads as ${report.readinessTier}.`,
    `The constitutional route currently resolves to ${decision.route}.`,
    `We need disciplined interpretation of friction, authority, and decision sequence before proceeding further.`,
  ].join(" ");
}

export function buildConstitutionalBridgeBundle(
  bundle: ConstitutionalDiagnosticBundle,
): ConstitutionalBridgeBundle {
  const { report, decision } = bundle;

  const principalRisks = buildPrincipalRisks(report, decision);
  const priorityInterventions = decision.recommendedInterventions.slice(0, 5);

  return {
    teamAssessment: {
      source: "constitutional-intake",
      inheritedSignal: {
        authorityScore: report.authorityScore,
        coherenceScore: report.coherenceScore,
        pressureScore: report.pressureScore,
        frictionScore: report.frictionScore,
        trustScore: report.trustScore,
        posture: report.posture,
        readinessTier: report.readinessTier,
        authorityType: report.authorityType,
        seriousnessScore: report.seriousnessScore,
      },
      prompts: buildTeamAssessmentPrompts(report),
      hypotheses: buildTeamAssessmentHypotheses(report),
      recommendedRespondentGroups: buildRecommendedRespondentGroups(report),
    },

    executiveReporting: {
      source: "constitutional-intake",
      executiveSummary: report.summary,
      headline: buildHeadline(report),
      constitutionalRoute: decision.route,
      posture: report.posture,
      readinessTier: report.readinessTier,
      authorityType: report.authorityType,
      principalRisks,
      priorityInterventions,
      boardLevelQuestion: buildBoardLevelQuestion(report, decision),
    },

    strategyRoom: {
      source: "constitutional-intake",
      escalationFit: {
        route: decision.route,
        confidence: decision.confidence,
        posture: report.posture,
        readinessTier: report.readinessTier,
        authorityType: report.authorityType,
        escalationAllowed: decision.escalationAllowed,
      },
      mandateDraft: buildMandateDraft(report, decision),
      risksToContainFirst: principalRisks.slice(0, 5),
      privateChamberRationale: decision.rationale.slice(0, 5),
    },
  };
}