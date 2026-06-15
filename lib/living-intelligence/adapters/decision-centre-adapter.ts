/**
 * lib/living-intelligence/adapters/decision-centre-adapter.ts
 *
 * Decision Centre domain adapter — Phase 5C.
 *
 * Translates Decision Centre case records into LivingStateObjects. Each case
 * represents a user's governed decision journey — the core object is the Living
 * Case, not the diagnostic record.
 *
 * Sources inspected:
 *   lib/product/decision-centre-contract.ts   (DecisionCentreCase contract)
 *   pages/decision-centre.tsx                 (user surface)
 *   components/decision-centre/**             (UI components)
 *   reports/living-product-view-model.json    (product truth)
 *   reports/living-state-objects.json         (prior objects)
 *
 * Every object answers:
 *   1. What decision/case exists?
 *   2. What stage is it in?
 *   3. What evidence supports it?
 *   4. What contradiction or tension has been detected?
 *   5. What next governed action exists?
 *   6. Is memory/continuity written?
 *   7. Is there an execution record?
 *   8. Is there a return brief or feedback path?
 *   9. Is there an intervention path?
 *  10. What cannot be inferred?
 *
 * The system REFUSES to infer:
 *   - completion from case creation
 *   - execution from recommendation
 *   - decision quality from user submission alone
 *   - evidence strength from answer length
 *   - continuity from session existence
 *   - intervention readiness from diagnosis alone
 */

import {
  readString,
  readBool,
  readNumber,
  readStringArray,
  type LivingDomainAdapter,
  type LivingDomainAdapterInput,
} from "@/lib/living-intelligence/living-domain-adapter-contract";
import type {
  LivingStateArtifactStatus,
  LivingStateBlockerCode,
  LivingStateConsentStatus,
  LivingStateEvidenceStatus,
  LivingStateObject,
  LivingStateStage,
} from "@/lib/living-intelligence/living-state-object-contract";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Map cognitive state to a living stage.
 */
function cognitiveStateToStage(cognitiveState: string | undefined): LivingStateStage {
  switch (cognitiveState) {
    case "SIGNAL_DISCOVERY":
      return "started";
    case "STRUCTURAL_RECOGNITION":
      return "processing";
    case "CONSEQUENCE_REALISATION":
      return "artifact_generated";
    case "INTERVENTION_READINESS":
      return "ready_for_review";
    case "EXECUTION_GOVERNANCE":
      return "approved";
    case "INSTITUTIONAL_INTELLIGENCE":
      return "delivered";
    default:
      return "started";
  }
}

/**
 * Map evidence tier to living evidence status.
 */
function evidenceTierToStatus(tier: string | undefined): LivingStateEvidenceStatus {
  switch (tier) {
    case "outcome_verified":
    case "human_reviewed":
      return "verified";
    case "multi_source":
      return "strongly_indicated";
    case "single_source":
      return "weakly_indicated";
    case "user_reported":
      return "inferred";
    case "insufficient":
      return "unverified";
    default:
      return "unverified";
  }
}

/**
 * Build the list of things the system refuses to infer.
 */
function buildCannotInfer(): string[] {
  return [
    "Completion from case creation — a created case is not a completed decision.",
    "Execution from recommendation — a recommendation is not an executed action.",
    "Decision quality from user submission alone — submission does not verify quality.",
    "Evidence strength from answer length — verbosity is not evidence.",
    "Continuity from session existence — a session is not durable memory.",
    "Intervention readiness from diagnosis alone — diagnosis does not confirm readiness.",
  ];
}

/**
 * Detect Decision Centre blockers from a case record.
 */
function detectDCBlockers(
  record: Record<string, unknown>,
  stage: LivingStateStage,
): { code: LivingStateBlockerCode; explanation: string; requiredAction: string }[] {
  const blockers: { code: LivingStateBlockerCode; explanation: string; requiredAction: string }[] = [];

  const cognitiveState = readString(record, "cognitiveState");
  const evidenceTier = readString(record, "evidenceTier");
  const unresolvedContradictions = readNumber(record, "unresolvedContradictions") ?? 0;
  const nextRequiredAction = readString(record, "nextRequiredAction");
  const strategyRoomActive = readBool(record, "strategyRoomActive") === true;
  const returnBriefTriggered = readBool(record, "returnBriefTriggered") === true;
  const counselWarranted = readBool(record, "counselWarranted") === true;

  // Case exists without evidence posture.
  if (!evidenceTier || evidenceTier === "insufficient") {
    blockers.push({
      code: "missing_evidence",
      explanation: `Case has no or insufficient evidence posture (tier: "${evidenceTier ?? "none"}"). A decision case requires evidence to progress.`,
      requiredAction: "Complete a diagnostic to establish an evidence baseline for this case.",
    });
  }

  // Case has contradiction/tension but no repair or escalation path.
  if (unresolvedContradictions > 0) {
    blockers.push({
      code: "status_contradiction",
      explanation: `Case has ${unresolvedContradictions} unresolved contradiction(s). These must be addressed before the case can advance.`,
      requiredAction: "Review and resolve the identified contradictions before proceeding.",
    });
  }

  // Case claims continuity but no memory reference exists.
  const continuityStatus = readString(record, "continuityStatus");
  if (continuityStatus && continuityStatus !== "NEW" && continuityStatus !== "UNKNOWN") {
    const priorOccurrences = readNumber(record, "priorOccurrences") ?? 0;
    if (priorOccurrences === 0) {
      blockers.push({
        code: "assessment_without_memory",
        explanation: `Case claims continuity status "${continuityStatus}" but has no prior occurrence count. Continuity cannot be asserted without memory.`,
        requiredAction: "Write continuity memory or correct the continuity status.",
      });
    }
  }

  // Case requires human review but no review route exists.
  if (counselWarranted) {
    blockers.push({
      code: "owner_decision_required",
      explanation: "Counsel escalation is warranted for this case but no operator review path is confirmed.",
      requiredAction: "Assign an operator or advisor to review this case.",
    });
  }

  // Strategy Room is active but no return brief path.
  if (strategyRoomActive && !returnBriefTriggered) {
    blockers.push({
      code: "missing_operator_action",
      explanation: "Strategy Room is active for this case but no return brief has been triggered. An execution record may be incomplete.",
      requiredAction: "Complete the Strategy Room execution session and trigger the return brief.",
    });
  }

  // Case has no next governed action.
  if (!nextRequiredAction && stage !== "delivered") {
    blockers.push({
      code: "missing_operator_action",
      explanation: `Case is at stage "${stage}" but has no next required action defined. The case cannot progress without a governed next move.`,
      requiredAction: "Define the next governed action for this case.",
    });
  }

  return blockers;
}

/**
 * Build operator summary.
 */
function buildOperatorSummary(record: Record<string, unknown>): string {
  const title = readString(record, "title") ?? "Untitled case";
  const cognitiveState = readString(record, "cognitiveState") ?? "unknown";
  const evidenceTier = readString(record, "evidenceTier") ?? "none";
  const contradictions = readNumber(record, "unresolvedContradictions") ?? 0;
  const nextAction = readString(record, "nextRequiredAction") ?? "none defined";
  const srActive = readBool(record, "strategyRoomActive") === true;

  const parts: string[] = [
    `Case "${title}" — cognitive: ${cognitiveState}, evidence: ${evidenceTier}, contradictions: ${contradictions}.`,
    `Next action: ${nextAction}.`,
  ];
  if (srActive) parts.push("Strategy Room session is active.");
  return parts.join(" ");
}

/**
 * Build user-visible summary.
 */
function buildUserSummary(record: Record<string, unknown>): string {
  const title = readString(record, "title") ?? "Your case";
  const finding = readString(record, "primaryFinding");
  const implication = readString(record, "governanceImplication");

  if (finding) {
    return implication
      ? `${title} — ${finding}. ${implication}`
      : `${title} — ${finding}`;
  }
  return `${title} — your governed decision case.`;
}

// ─── Map one case record ──────────────────────────────────────────────────────

function mapOne(
  record: Record<string, unknown>,
  input: LivingDomainAdapterInput,
): LivingStateObject {
  const caseId = readString(record, "caseId") ?? readString(record, "id") ?? `dc-${Math.random().toString(36).slice(2, 10)}`;
  const title = readString(record, "title") ?? "Decision Centre case";
  const cognitiveState = readString(record, "cognitiveState");
  const evidenceTier = readString(record, "evidenceTier");
  const stage = cognitiveStateToStage(cognitiveState);
  const evidenceStatus = evidenceTierToStatus(evidenceTier);
  const dcBlockers = detectDCBlockers(record, stage);
  const strategyRoomActive = readBool(record, "strategyRoomActive") === true;
  const returnBriefTriggered = readBool(record, "returnBriefTriggered") === true;
  const nextRequiredAction = readString(record, "nextRequiredAction");

  const id = `decision-centre-${caseId}`;

  return {
    id,
    domain: "decision_centre",
    subjectType: "case",
    sourceId: caseId,
    productCode: readString(record, "sourceType") ?? "decision_centre",
    title,
    currentStage: stage,
    statusLabel: `${cognitiveState ?? "unknown"} — ${evidenceTier ?? "no evidence"}`,
    userVisibleSummary: buildUserSummary(record),
    operatorSummary: buildOperatorSummary(record),
    evidence: {
      status: evidenceStatus,
      supportingEvidence: evidenceTier
        ? [`Evidence tier: ${evidenceTier}`, `Cognitive state: ${cognitiveState ?? "unknown"}`]
        : [],
      missingEvidence: !evidenceTier || evidenceTier === "insufficient"
        ? ["Established evidence baseline for this case"]
        : [],
      cannotInfer: buildCannotInfer(),
    },
    consent: {
      required: false,
      status: "not_required",
      supportingEvidence: [],
      missing: [],
    },
    artifact: {
      required: stage === "delivered" || stage === "approved",
      status: stage === "delivered" ? "delivered" : stage === "approved" ? "generated" : stage === "artifact_generated" ? "draft" : "not_required",
      artifactIds: [caseId],
      artifactRoutes: strategyRoomActive ? ["/strategy-room"] : [],
      missing: [],
    },
    publication: {
      relevant: false,
      allowed: false,
      reason: "A Decision Centre case is private to the user; it is not published.",
      missing: [],
    },
    blockers: dcBlockers.map((b) => ({
      code: b.code,
      label: b.code === "missing_evidence"
        ? "Required evidence is missing"
        : b.code === "status_contradiction"
          ? "Status contradicts the evidence"
          : b.code === "assessment_without_memory"
            ? "Continuity promised but no memory written"
            : b.code === "owner_decision_required"
              ? "An explicit owner decision is required"
              : b.code === "missing_operator_action"
                ? "An operator action is required but undefined"
                : "Case issue",
      severity: b.code === "missing_evidence"
        ? "blocker"
        : b.code === "status_contradiction"
          ? "blocker"
          : b.code === "assessment_without_memory"
            ? "blocker"
            : b.code === "owner_decision_required"
              ? "governed_tension"
              : "warning",
      explanation: b.explanation,
      evidence: [
        `caseId=${caseId}`,
        `cognitiveState=${cognitiveState ?? "unknown"}`,
        `evidenceTier=${evidenceTier ?? "none"}`,
      ],
      affectedItems: [caseId],
      requiredAction: b.requiredAction,
      actionOwner: b.code === "owner_decision_required" ? "founder" : "operator",
      canAutomate: false,
    })),
    nextActions: [
      ...(nextRequiredAction
        ? [{
            label: nextRequiredAction,
            description: `Next governed action for case "${title}".`,
            owner: "user" as const,
            actionType: "open_case" as const,
            route: "/decision-centre",
            safeToAutomate: false,
            requiredEvidence: [] as string[],
          }]
        : []),
      ...(strategyRoomActive && !returnBriefTriggered
        ? [{
            label: "Complete Strategy Room session",
            description: `Strategy Room is active for case "${title}". Complete the execution session to trigger the return brief.`,
            owner: "user" as const,
            actionType: "open_case" as const,
            route: "/strategy-room",
            safeToAutomate: false,
            requiredEvidence: [] as string[],
          }]
        : []),
    ],
    memory: {
      recurrenceCount: readNumber(record, "priorOccurrences") ?? 1,
      currentStage: stage,
      regressionDetected: false,
      resolvedSinceLastRun: false,
    },
    safeToShowUser: true,
    safeToShowOperator: true,
    safeToAutomate: false,
    sourceOfTruth: [
      "lib/product/decision-centre-contract.ts",
      "pages/decision-centre.tsx",
    ],
    raw: {
      caseId,
      cognitiveState,
      evidenceTier,
      unresolvedContradictions: readNumber(record, "unresolvedContradictions") ?? 0,
      strategyRoomActive,
      returnBriefTriggered,
      counselWarranted: readBool(record, "counselWarranted") === true,
      continuityStatus: readString(record, "continuityStatus"),
    },
  };
}

// ─── Proof-case records ───────────────────────────────────────────────────────

function dcProofRecords(): Record<string, unknown>[] {
  return [
    {
      caseId: "dc-proof-signal-discovery",
      title: "Decision under pressure — signal discovery phase",
      cognitiveState: "SIGNAL_DISCOVERY",
      evidenceTier: "user_reported",
      unresolvedContradictions: 0,
      nextRequiredAction: "Complete a Fast Diagnostic to establish evidence baseline",
      primaryFinding: "A consequential decision is being delayed past the point where delay itself becomes the dominant risk.",
      governanceImplication: "Without a governed next move, exposure compounds while no party owns the decision.",
      strategyRoomActive: false,
      returnBriefTriggered: false,
      counselWarranted: false,
      continuityStatus: "NEW",
      priorOccurrences: 0,
    },
    {
      caseId: "dc-proof-structural-recognition",
      title: "Organisational drift — structural recognition",
      cognitiveState: "STRUCTURAL_RECOGNITION",
      evidenceTier: "single_source",
      unresolvedContradictions: 1,
      nextRequiredAction: "Resolve identified contradiction before advancing",
      primaryFinding: "Multiple stakeholders are operating under different mandates.",
      governanceImplication: "Authority diffusion is preventing structural progress.",
      strategyRoomActive: false,
      returnBriefTriggered: false,
      counselWarranted: false,
      continuityStatus: "REPEATED",
      priorOccurrences: 2,
    },
    {
      caseId: "dc-proof-execution-governance",
      title: "Strategy Room execution — active governance",
      cognitiveState: "EXECUTION_GOVERNANCE",
      evidenceTier: "multi_source",
      unresolvedContradictions: 0,
      nextRequiredAction: "Complete Strategy Room execution and trigger return brief",
      primaryFinding: "Execution path identified but not yet confirmed.",
      governanceImplication: "Strategy Room session is active but return brief has not been triggered.",
      strategyRoomActive: true,
      returnBriefTriggered: false,
      counselWarranted: false,
      continuityStatus: "WORSENING",
      priorOccurrences: 3,
    },
    {
      caseId: "dc-proof-counsel-warranted",
      title: "Founder identity lock — counsel sensitivity",
      cognitiveState: "INTERVENTION_READINESS",
      evidenceTier: "multi_source",
      unresolvedContradictions: 2,
      nextRequiredAction: "Assign operator review for counsel escalation",
      primaryFinding: "Founder identity is operationally embedded.",
      governanceImplication: "Counsel escalation is warranted but no review path exists.",
      strategyRoomActive: false,
      returnBriefTriggered: false,
      counselWarranted: true,
      continuityStatus: "VERIFIED_PATTERN",
      priorOccurrences: 5,
    },
  ];
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

export const decisionCentreAdapter: LivingDomainAdapter = {
  domain: "decision_centre",
  label: "Decision Centre",
  detect(records) {
    return records.some(
      (record) =>
        typeof record["caseId"] === "string" ||
        typeof record["cognitiveState"] === "string",
    );
  },
  map(input: LivingDomainAdapterInput) {
    return input.records.map((record) => mapOne(record, input));
  },
};

export default decisionCentreAdapter;
