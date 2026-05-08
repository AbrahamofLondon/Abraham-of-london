/**
 * lib/strategy-room/admission.ts — Server-side Strategy Room admission enforcement.
 *
 * A user may not enter Strategy Room unless server-side admission confirms:
 * - prior diagnostic evidence exists, or a valid governed intake record exists
 * - decision statement is specific enough
 * - authority signal is present and validated
 * - live decision exists
 * - readiness/pre-commitment is present
 * - admission directive permits Strategy Room
 * - restriction/refusal reasons are returned if not admitted
 *
 * Client-side advisory checks are not enough.
 * This module is the hard gate.
 */

import { getDiagnosticJourney } from "@/lib/diagnostics/journey-store";
import { enforceStrategyRoomAccess } from "@/lib/diagnostics/authority-enforcement";
import type { EvidenceTier } from "@/lib/product/living-intelligence-spine";
import type { DiagnosticJourneyStage } from "@/lib/diagnostics/journey-store";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type StrategyRoomAdmissionResult =
  | {
      status: "ADMITTED";
      caseId: string;
      decisionId: string | null;
      evidenceTier: EvidenceTier;
      directive: string;
      reasons: string[];
      nextAction: string;
    }
  | {
      status: "RESTRICTED";
      reasons: string[];
      missingEvidence: string[];
      repairActions: string[];
      returnPath: string;
    };

export type StrategyRoomAdmissionContext = {
  email?: string | null;
  subjectId?: string | null;
  campaignId?: string | null;
  /** Client-supplied tension thread JSON (supplemental, server takes precedence) */
  clientThreadJson?: unknown;
  /** Decision statement from intake form */
  decisionStatement?: string | null;
  /** Pre-commitment acknowledgement */
  preCommitment?: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const MINIMUM_DECISION_LENGTH = 20;

const REQUIRED_STAGES_FOR_STRATEGY: DiagnosticJourneyStage[] = [
  "constitutional",
];

const PREFERRED_STAGES: DiagnosticJourneyStage[] = [
  "constitutional",
  "team",
  "enterprise",
];

// ─────────────────────────────────────────────────────────────────────────────
// EVIDENCE TIER DERIVATION
// ─────────────────────────────────────────────────────────────────────────────

function deriveEvidenceTier(stagesCompleted: string[]): EvidenceTier {
  if (stagesCompleted.length >= 3) return "multi_source";
  if (stagesCompleted.length >= 1) return "single_source";
  return "insufficient";
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMISSION LOGIC
// ─────────────────────────────────────────────────────────────────────────────

export async function evaluateStrategyRoomAdmission(
  context: StrategyRoomAdmissionContext,
): Promise<StrategyRoomAdmissionResult> {
  const missingEvidence: string[] = [];
  const repairActions: string[] = [];
  const reasons: string[] = [];

  // ── 1. Retrieve diagnostic journey (server-side, not sessionStorage) ──
  const journey = await getDiagnosticJourney({
    email: context.email,
    subjectId: context.subjectId,
    campaignId: context.campaignId,
  });

  const completedStages = Object.keys(journey.stages) as DiagnosticJourneyStage[];
  const evidenceTier = deriveEvidenceTier(completedStages);

  // ── 2. Check minimum evidence requirement ──
  const hasRequiredStages = REQUIRED_STAGES_FOR_STRATEGY.every(
    (stage) => completedStages.includes(stage),
  );

  if (!hasRequiredStages) {
    const missing = REQUIRED_STAGES_FOR_STRATEGY.filter(
      (s) => !completedStages.includes(s),
    );
    missingEvidence.push(
      ...missing.map((s) => `Required diagnostic stage not completed: ${s}`),
    );
    repairActions.push("Complete the Constitutional Diagnostic to establish structural evidence.");
  }

  if (evidenceTier === "insufficient") {
    missingEvidence.push("No diagnostic evidence exists for this identity.");
    repairActions.push("Start with the Constitutional Diagnostic at /diagnostics/constitutional-diagnostic");
  }

  // ── 3. Check for STRATEGY route decision ──
  const hasStrategyRoute = journey.routeDecisions.some((decision) => {
    if (!decision || typeof decision !== "object") return false;
    const route = String((decision as Record<string, unknown>).route || "").toUpperCase();
    return route === "STRATEGY";
  });

  if (!hasStrategyRoute && hasRequiredStages) {
    // Has required stages but no STRATEGY route — check if any route decision exists
    const hasAnyRoute = journey.routeDecisions.length > 0;
    if (hasAnyRoute) {
      missingEvidence.push("Constitutional routing did not issue STRATEGY directive.");
      repairActions.push("The current evidence does not support escalation to Strategy Room. Strengthen the evidence base or re-assess.");
    }
  }

  // ── 4. Check decision specificity ──
  const decisionText = context.decisionStatement?.trim() || "";
  if (decisionText.length < MINIMUM_DECISION_LENGTH) {
    missingEvidence.push("Decision statement is too vague or missing.");
    repairActions.push("Provide a specific decision statement (minimum 20 characters) naming the decision, owner, and consequence.");
  }

  // ── 5. Check authority signal ──
  const hasAuthoritySignal = journey.stages.constitutional
    ? Boolean(
        (journey.stages.constitutional as Record<string, unknown>)?.authorityType ||
        (journey.stages.constitutional as Record<string, unknown>)?.readinessTier,
      )
    : false;

  if (!hasAuthoritySignal && hasRequiredStages) {
    missingEvidence.push("Authority signal not present in constitutional evidence.");
    repairActions.push("Complete Constitutional Diagnostic to establish authority type and readiness tier.");
  }

  // ── 6. Check pre-commitment ──
  if (!context.preCommitment) {
    missingEvidence.push("Pre-commitment not acknowledged.");
    repairActions.push("Confirm readiness to act on governed intervention before entering Strategy Room.");
  }

  // ── 7. Run authority enforcement (server-side durable thread) ──
  const enforcement = await enforceStrategyRoomAccess(
    context.email,
    context.clientThreadJson,
  );

  if (!enforcement.allowed) {
    reasons.push(`Authority enforcement: ${enforcement.reason}`);
    if (enforcement.recommendedPath) {
      repairActions.push(`Follow recommended path: ${enforcement.recommendedPath}`);
    }
  }

  // ── 8. Evaluate admission ──
  const hasBlockingIssues = missingEvidence.length > 0 || !enforcement.allowed;

  if (hasBlockingIssues) {
    return {
      status: "RESTRICTED",
      reasons: [
        ...reasons,
        ...missingEvidence,
      ],
      missingEvidence,
      repairActions: repairActions.length > 0
        ? repairActions
        : ["Return to the diagnostics hub to build the evidence base."],
      returnPath: enforcement.recommendedPath || "/diagnostics",
    };
  }

  // ── 9. Admitted ──
  const admissionReasons: string[] = [];
  if (hasStrategyRoute) admissionReasons.push("STRATEGY route issued by constitutional engine.");
  if (evidenceTier === "multi_source") admissionReasons.push("Multi-source evidence established.");
  if (enforcement.threadSource === "server") admissionReasons.push("Server-side authority thread verified.");
  admissionReasons.push(`Evidence tier: ${evidenceTier}`);
  admissionReasons.push(`Completed stages: ${completedStages.join(", ")}`);

  // Find decision object if available
  const decisionId = journey.decisionObjects.length > 0
    ? (journey.decisionObjects[0] as { decisionKey?: string })?.decisionKey || null
    : null;

  return {
    status: "ADMITTED",
    caseId: journey.journeyKey,
    decisionId,
    evidenceTier,
    directive: enforcement.directive.level,
    reasons: admissionReasons,
    nextAction: "Enter Strategy Room execution chamber.",
  };
}
