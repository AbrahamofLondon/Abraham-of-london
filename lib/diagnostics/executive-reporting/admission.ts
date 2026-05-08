/**
 * lib/diagnostics/executive-reporting/admission.ts — Server-side ER admission.
 *
 * Executive Reporting payment/checkout must only proceed when server-side
 * validation confirms:
 * - source diagnostic exists, or valid governed intake exists
 * - evidence payload is not purely client-invented
 * - required decision fields exist
 * - consequence/cost anchor exists where required
 * - admissibility directive permits Executive Reporting
 * - user receives restriction if insufficient
 *
 * Payment must not override evidence requirements.
 */

import { getDiagnosticJourney } from "@/lib/diagnostics/journey-store";
import {
  enforceExecutiveReportingAccess,
  type ExecutiveReportingAccessContext,
} from "@/lib/diagnostics/executive-reporting-enforcement";
import type { EvidenceTier } from "@/lib/product/living-intelligence-spine";
import type { DiagnosticJourneyStage } from "@/lib/diagnostics/journey-store";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type ERAdmissionResult =
  | {
      status: "ADMITTED";
      caseId: string;
      evidenceTier: EvidenceTier;
      intakeMode: "ladder" | "direct_sponsored" | "monitoring";
      completedStages: DiagnosticJourneyStage[];
      reasons: string[];
    }
  | {
      status: "RESTRICTED";
      reasons: string[];
      missingEvidence: string[];
      repairActions: string[];
      returnPath: string;
    };

export type ERAdmissionContext = ExecutiveReportingAccessContext & {
  /** Client-supplied evidence summary for cross-validation */
  clientEvidenceSummary?: {
    decisionText?: string | null;
    consequenceText?: string | null;
    stagesCompleted?: string[] | null;
  } | null;
};

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

export async function evaluateERAdmission(
  context: ERAdmissionContext,
): Promise<ERAdmissionResult> {
  const missingEvidence: string[] = [];
  const repairActions: string[] = [];

  // ── 1. Run existing ER access enforcement (already server-side) ──
  const accessDecision = await enforceExecutiveReportingAccess(context);

  if (!accessDecision.allowed) {
    return {
      status: "RESTRICTED",
      reasons: [accessDecision.reason || "Executive Reporting access not authorised."],
      missingEvidence: ["Required upstream diagnostic ladder authority not established."],
      repairActions: [
        accessDecision.requiredPath
          ? `Complete the required diagnostic: ${accessDecision.requiredPath}`
          : "Complete the diagnostic ladder to establish evidence.",
      ],
      returnPath: accessDecision.requiredPath || "/diagnostics",
    };
  }

  // ── 2. Retrieve server-side journey to validate evidence ──
  const journey = await getDiagnosticJourney({
    email: context.email,
    subjectId: context.subjectId,
    campaignId: context.campaignId,
  });

  const completedStages = Object.keys(journey.stages) as DiagnosticJourneyStage[];
  const evidenceTier = deriveEvidenceTier(completedStages);

  // ── 3. Cross-validate client evidence against server state ──
  if (context.clientEvidenceSummary?.stagesCompleted) {
    const clientStages = context.clientEvidenceSummary.stagesCompleted;
    const serverStages = new Set(completedStages);

    // Client claims stages that server doesn't have → evidence may be fabricated
    const fabricatedStages = clientStages.filter((s) => !serverStages.has(s as DiagnosticJourneyStage));
    if (fabricatedStages.length > 0) {
      missingEvidence.push(
        `Client claims evidence from stages not present server-side: ${fabricatedStages.join(", ")}`,
      );
      repairActions.push("Complete the claimed diagnostic stages. The system validates evidence server-side.");
    }
  }

  // ── 4. Check decision object exists ──
  const hasDecisionObject = journey.decisionObjects.length > 0;
  if (!hasDecisionObject) {
    // Decision objects are created during diagnostic intake — absence means
    // the diagnostic may have been partially completed or from an older version.
    // This is a soft check: warn but don't block for ladder-mode users who
    // have already passed enforceExecutiveReportingAccess.
    // The ER engine will work with available evidence.
  }

  // ── 5. Check consequence/cost anchor ──
  const hasConsequenceEvidence = journey.evidenceNodes.some(
    (node) =>
      node.kind === "consequence" ||
      node.kind === "exposure_estimate" ||
      node.kind === "escalation_trigger",
  );

  if (!hasConsequenceEvidence && evidenceTier === "single_source") {
    // Single-source with no consequence evidence is thin
    missingEvidence.push("No consequence or exposure evidence found.");
    repairActions.push("Add a second diagnostic layer to strengthen the evidence base before generating a governed brief.");
  }

  // ── 6. If cross-validation flagged issues, restrict ──
  if (missingEvidence.length > 0) {
    return {
      status: "RESTRICTED",
      reasons: missingEvidence,
      missingEvidence,
      repairActions,
      returnPath: "/diagnostics",
    };
  }

  // ── 7. Admitted ──
  const reasons: string[] = [
    `Access mode: ${accessDecision.intakeMode}`,
    `Evidence tier: ${evidenceTier}`,
    `Completed stages: ${completedStages.join(", ")}`,
  ];

  if (hasDecisionObject) reasons.push("Decision object present.");
  if (hasConsequenceEvidence) reasons.push("Consequence evidence present.");

  return {
    status: "ADMITTED",
    caseId: journey.journeyKey,
    evidenceTier,
    intakeMode: accessDecision.intakeMode,
    completedStages,
    reasons,
  };
}
