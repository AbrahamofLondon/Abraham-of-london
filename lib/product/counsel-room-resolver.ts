/**
 * lib/product/counsel-room-resolver.ts
 *
 * Counsel Room eligibility resolver.
 * Determines what state the counsel room should be in based on
 * the user's diagnostic evidence, escalation state, and retainer status.
 *
 * Decision rules:
 * - No user / no evidence: NO_EVIDENCE
 * - Fast only: DIAGNOSTIC_REQUIRED
 * - Constitutional complete + escalation level low: EVIDENCE_INSUFFICIENT
 * - Escalation level >= 2: ESCALATION_ELIGIBLE
 * - Repeated unresolved contradiction: COUNSEL_RECOMMENDED
 * - Blocked / abandoned checkpoint: COUNSEL_RECOMMENDED
 * - High financial exposure + insufficient authority: COUNSEL_REQUIRED
 * - Boardroom threshold: COUNSEL_REQUIRED
 * - Active retainer: RETAINER_COVERED
 * - Admin/operator override: OPERATOR_GRANTED
 */

// Server-only module — imported by API routes and server components

import type {
  CounselAccessState,
  CounselEscalationTrigger,
  CounselEvidencePackage,
  CounselRoomState,
} from "@/lib/product/counsel-room-contract";

// ─────────────────────────────────────────────────────────────────────────────
// RESOLVER
// ─────────────────────────────────────────────────────────────────────────────

export async function resolveCounselRoomState(input: {
  userId?: string | null;
  email?: string | null;
  journeyId?: string | null;
  caseId?: string | null;
}): Promise<CounselRoomState> {
  // ── 1. No user / no email → NO_EVIDENCE ──
  if (!input.email && !input.userId) {
    return {
      accessState: "NO_EVIDENCE",
      canRequestCounsel: false,
      canViewEvidencePackage: false,
      canSubmitStructuredIntake: false,
      reason: "Counsel is not yet warranted by the evidence available.",
      evidencePackage: null,
      recommendedPath: "COMPLETE_FAST_DIAGNOSTIC",
    };
  }

  const email = input.email?.toLowerCase() ?? null;
  const { prisma } = await import("@/lib/prisma");

  // ── 2. Gather evidence ──
  let completedStages: string[] = [];
  let escalationLevel = 0;
  let activeContradictions: string[] = [];
  let triggers: CounselEscalationTrigger[] = [];
  let overdueCheckpoints = 0;
  let blockedCheckpoints = 0;
  let estimatedExposure: { amount?: number | null; band?: string | null; caveat: string } | null = null;
  let latestRequiredMove: string | null = null;
  let priorAttempts: string | null = null;
  let recurrenceSummary: string | null = null;
  let suppressionReasons: string[] = [];
  let hasBoardroomQualification = false;
  let hasActiveRetainer = false;
  let hasOperatorOverride = false;
  let journeyId: string | null = null;
  let caseId: string | null = null;

  try {
    // Load journey data
    const { getDiagnosticJourney } = await import("@/lib/diagnostics/journey-store");
    const journey = await getDiagnosticJourney({
      email: email ?? undefined,
      subjectId: input.userId ?? undefined,
    });
    journeyId = journey.journeyKey;

    // Extract completed stages
    completedStages = Object.entries(journey.stages)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key]) => key);

    // Extract escalation level
    escalationLevel = journey.escalationHistory?.length ?? 0;

    // Extract active contradictions from evidence nodes
    activeContradictions = journey.evidenceNodes
      .filter((n) => n.kind === "contradiction")
      .slice(-5)
      .map((n) => n.label);

    // Extract latest decision object for required move
    const latestDecision = journey.decisionObjects?.slice(-1)?.[0];
    if (latestDecision) {
      latestRequiredMove = latestDecision.decisionText ?? null;
      priorAttempts = latestDecision.priorAttemptText ?? null;
    }

    // Check for recurrence
    if (journey.mergedTensionThread?.length > 1) {
      recurrenceSummary = `${journey.mergedTensionThread.length} recurring tension signals detected across the diagnostic journey.`;
    }
  } catch {
    // Journey unavailable — continue with partial data
  }

  // ── 3. Load checkpoint data ──
  try {
    const { loadDueCheckpointsForUser } = await import("@/lib/product/checkpoint-service");
    const checkpoints = await loadDueCheckpointsForUser({ email: email ?? undefined, userId: input.userId ?? undefined });
    overdueCheckpoints = checkpoints.filter((c) => c.status === "OVERDUE").length;
    blockedCheckpoints = checkpoints.filter((c) => c.responseStatus === "BLOCKED" || c.responseStatus === "ABANDONED").length;
  } catch { /* best-effort */ }

  // ── 4. Load financial exposure ──
  try {
    const { loadLatestFinancialExposure } = await import("@/lib/product/financial-exposure-persistence");
    const fe = await loadLatestFinancialExposure({ email: email ?? undefined, subjectId: input.userId ?? undefined });
    if (fe?.estimatedFinancialExposure && fe.estimatedFinancialExposure > 0) {
      estimatedExposure = {
        amount: fe.estimatedFinancialExposure,
        band: fe.exposureBand,
        caveat: "This is an estimate based on diagnostic inputs and has not been independently verified.",
      };
    }
  } catch { /* best-effort */ }

  // ── 5. Check boardroom qualification ──
  try {
    const latestRun = await (prisma as any).executiveReportingRun?.findFirst?.({
      where: { email },
      orderBy: { createdAt: "desc" },
      select: { canonicalSnapshot: true },
    });
    if (latestRun?.canonicalSnapshot) {
      const snapshot = typeof latestRun.canonicalSnapshot === "string"
        ? JSON.parse(latestRun.canonicalSnapshot)
        : latestRun.canonicalSnapshot;
      hasBoardroomQualification = snapshot?.boardroom?.qualified === true;
    }
  } catch { /* best-effort */ }

  // ── 6. Check retainer status ──
  try {
    const retainer = await (prisma as any).retainerOversightAccount?.findFirst?.({
      where: { email },
      select: { id: true, status: true },
    });
    hasActiveRetainer = retainer?.status === "active";
  } catch { /* best-effort */ }

  // ── 7. Check operator override ──
  try {
    const override = await (prisma as any).counselOverride?.findFirst?.({
      where: { email, status: "active" },
    });
    hasOperatorOverride = !!override;
  } catch { /* best-effort */ }

  // ── 8. Determine escalation triggers ──
  if (escalationLevel >= 3 && activeContradictions.length >= 2) {
    triggers.push("SYSTEM_CANNOT_MODEL_CONDITION");
  }
  if (activeContradictions.length >= 3) {
    triggers.push("REPEATED_CONTRADICTION");
  }
  if (blockedCheckpoints >= 2) {
    triggers.push("FAILED_EXECUTION");
  }
  if (estimatedExposure?.band === "high" || estimatedExposure?.band === "critical") {
    triggers.push("HIGH_CONSEQUENCE_EXPOSURE");
  }
  if (hasBoardroomQualification) {
    triggers.push("BOARDROOM_THRESHOLD");
  }
  if (hasActiveRetainer) {
    triggers.push("RETAINER_REVIEW");
  }

  // ── 9. Build evidence package ──
  const evidencePackage: CounselEvidencePackage = {
    userId: input.userId ?? email ?? "unknown",
    journeyId: journeyId ?? undefined,
    caseId: input.caseId ?? undefined,
    completedStages,
    activeContradictions,
    escalationLevel,
    triggers,
    overdueCheckpointCount: overdueCheckpoints,
    blockedCheckpointCount: blockedCheckpoints,
    estimatedExposure,
    latestRequiredMove,
    priorAttempts,
    recurrenceSummary,
    evidencePosture: "SYSTEM_INFERRED",
    suppressionReasons,
  };

  // ── 10. Determine access state ──
  let accessState: CounselAccessState;
  let canRequestCounsel: boolean;
  let canViewEvidencePackage: boolean;
  let canSubmitStructuredIntake: boolean;
  let recommendedPath: CounselRoomState["recommendedPath"];

  if (hasOperatorOverride) {
    accessState = "OPERATOR_GRANTED";
    canRequestCounsel = true;
    canViewEvidencePackage = true;
    canSubmitStructuredIntake = true;
    recommendedPath = "REQUEST_COUNSEL_REVIEW";
  } else if (hasActiveRetainer) {
    accessState = "RETAINER_COVERED";
    canRequestCounsel = true;
    canViewEvidencePackage = true;
    canSubmitStructuredIntake = true;
    recommendedPath = "RETAINER_REVIEW";
  } else if (hasBoardroomQualification || (estimatedExposure?.band === "critical" && escalationLevel >= 2)) {
    accessState = "COUNSEL_REQUIRED";
    canRequestCounsel = true;
    canViewEvidencePackage = true;
    canSubmitStructuredIntake = true;
    recommendedPath = "REQUEST_COUNSEL_REVIEW";
  } else if (triggers.length >= 2 || escalationLevel >= 3) {
    accessState = "COUNSEL_RECOMMENDED";
    canRequestCounsel = true;
    canViewEvidencePackage = true;
    canSubmitStructuredIntake = true;
    recommendedPath = "REQUEST_COUNSEL_REVIEW";
  } else if (escalationLevel >= 2 || triggers.length >= 1) {
    accessState = "ESCALATION_ELIGIBLE";
    canRequestCounsel = true;
    canViewEvidencePackage = true;
    canSubmitStructuredIntake = false;
    recommendedPath = "REQUEST_COUNSEL_REVIEW";
  } else if (completedStages.includes("constitutional")) {
    accessState = "EVIDENCE_INSUFFICIENT";
    canRequestCounsel = false;
    canViewEvidencePackage = true;
    canSubmitStructuredIntake = false;
    recommendedPath = "ENTER_STRATEGY_ROOM";
  } else if (completedStages.includes("purpose_alignment") || completedStages.includes("fast_diagnostic")) {
    accessState = "DIAGNOSTIC_REQUIRED";
    canRequestCounsel = false;
    canViewEvidencePackage = true;
    canSubmitStructuredIntake = false;
    recommendedPath = "COMPLETE_CONSTITUTIONAL";
  } else {
    accessState = "NO_EVIDENCE";
    canRequestCounsel = false;
    canViewEvidencePackage = false;
    canSubmitStructuredIntake = false;
    recommendedPath = "COMPLETE_FAST_DIAGNOSTIC";
  }

  const reason = getReasonForState(accessState, triggers, escalationLevel);

  return {
    accessState,
    canRequestCounsel,
    canViewEvidencePackage,
    canSubmitStructuredIntake,
    reason,
    evidencePackage: canViewEvidencePackage ? evidencePackage : null,
    recommendedPath,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getReasonForState(
  state: CounselAccessState,
  triggers: CounselEscalationTrigger[],
  escalationLevel: number,
): string {
  switch (state) {
    case "NO_EVIDENCE":
      return "Counsel is not yet warranted by the evidence available. Complete a diagnostic first.";
    case "DIAGNOSTIC_REQUIRED":
      return "The system does not yet have enough evidence to recommend counsel. Complete the Constitutional Diagnostic to strengthen the evidence base.";
    case "EVIDENCE_INSUFFICIENT":
      return "The system does not yet have enough evidence to recommend counsel. Consider entering the Strategy Room or completing additional diagnostic stages.";
    case "ESCALATION_ELIGIBLE":
      return `Counsel may be warranted. ${triggers.length > 0 ? `Escalation triggers detected: ${triggers.join(", ")}.` : `Escalation level: ${escalationLevel}.`}`;
    case "COUNSEL_RECOMMENDED":
      return `Counsel Review is recommended. The system has detected ${triggers.length} escalation trigger${triggers.length !== 1 ? "s" : ""} that suggest automated guidance may be insufficient.`;
    case "COUNSEL_REQUIRED":
      return `Counsel Review is required. The conditions detected exceed what the system can safely model alone.`;
    case "RETAINER_COVERED":
      return "Counsel Review is covered under your retained oversight agreement.";
    case "OPERATOR_GRANTED":
      return "Access to Counsel Review has been granted by operator override.";
    default:
      return "Counsel is not yet warranted by the evidence available.";
  }
}
