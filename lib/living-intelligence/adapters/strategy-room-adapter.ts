/**
 * lib/living-intelligence/adapters/strategy-room-adapter.ts
 *
 * Strategy Room domain adapter — Phase 5C.
 *
 * Translates Strategy Room session records into LivingStateObjects. Each
 * session represents a governed execution session for a user's decision case.
 *
 * Sources inspected:
 *   lib/strategy-room/room-state-contract.ts     (StrategyRoomState contract)
 *   lib/strategy-room/execution-record.ts        (execution records)
 *   lib/strategy-room/execution-feedback.ts      (feedback loop)
 *   lib/strategy-room/canonical-snapshot.ts      (canonical snapshots)
 *   lib/strategy-room/session-service.ts         (session management)
 *   lib/strategy-room/admission.ts               (admission gating)
 *   lib/strategy-room/persistence.ts             (persistence layer)
 *   lib/strategy-room/enrol-core.ts              (enrolment)
 *   lib/strategy-room/client-trackers.ts         (client tracking)
 *   components/strategy-room/**                  (UI components)
 *   reports/living-product-view-model.json       (product truth)
 *   reports/living-state-objects.json            (prior objects)
 *
 * Every object answers:
 *   1. What session exists?
 *   2. What stage is it in?
 *   3. What evidence supports it?
 *   4. What contradiction or tension has been detected?
 *   5. What next governed action exists?
 *   6. Is there an execution record?
 *   7. Is there a return brief or feedback path?
 *   8. Is there an intervention path?
 *   9. What cannot be inferred?
 *
 * The system REFUSES to infer:
 *   - execution from recommendation
 *   - evidence verification from session activity
 *   - memory continuity from session existence
 *   - intervention readiness from diagnosis alone
 *   - retainer readiness without real signal evidence
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
  LivingStateSeverity,
  LivingStateStage,
} from "@/lib/living-intelligence/living-state-object-contract";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Map execution state to a living stage.
 */
function executionStateToStage(executionState: string | undefined): LivingStateStage {
  switch (executionState) {
    case "PENDING":
      return "started";
    case "ACTIVE":
      return "processing";
    case "STALLED":
      return "blocked";
    case "COMPLETED":
      return "delivered";
    case "FAILED":
      return "failed";
    default:
      return "started";
  }
}

/**
 * Map admission status to a living stage.
 */
function admissionToStage(admissionStatus: string | undefined): LivingStateStage {
  switch (admissionStatus) {
    case "ADMITTED":
      return "processing";
    case "RESTRICTED":
      return "blocked";
    case "BLOCKED":
      return "blocked";
    default:
      return "created";
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
    "Execution from recommendation — a recommendation is not an executed action.",
    "Evidence verification from session activity — activity does not verify evidence.",
    "Memory continuity from session existence — a session is not durable memory.",
    "Intervention readiness from diagnosis alone — diagnosis does not confirm readiness.",
    "Retainer readiness without real signal evidence — signals must be verified.",
  ];
}

/**
 * Detect Strategy Room blockers from a session record.
 */
function SRBlockers(
  record: Record<string, unknown>,
  stage: LivingStateStage,
): { code: LivingStateBlockerCode; explanation: string; requiredAction: string }[] {
  const blockers: { code: LivingStateBlockerCode; explanation: string; requiredAction: string }[] = [];

  const admissionStatus = readString(record, "admissionStatus");
  const executionState = readString(record, "executionState");
  const decisionStatement = readString(record, "decisionStatement");
  const evidenceTier = readString(record, "evidenceTier");
  const hasReturnBrief = readBool(record, "returnBriefAvailable") === true;
  const hasExecutionRecord = readBool(record, "hasExecutionRecord") === true;
  const signalPressureLocked = readBool(record, "signalPressureLocked") === true;
  const retainerEligible = readBool(record, "retainerEligible") === true;
  const escalationTriggers = readNumber(record, "escalationTriggerCount") ?? 0;
  const artifactCount = readNumber(record, "artifactCount") ?? 0;

  // Session exists without canonical snapshot / decision statement.
  if (!decisionStatement) {
    blockers.push({
      code: "missing_artifact",
      explanation: "Strategy Room session has no decision statement. A decision must be stated before execution can proceed.",
      requiredAction: "Complete the intake to establish a decision statement.",
    });
  }

  // Session exists without admission state.
  if (!admissionStatus || admissionStatus === "BLOCKED") {
    blockers.push({
      code: "missing_operator_action",
      explanation: `Strategy Room session has no admission state or is blocked (status: "${admissionStatus ?? "none"}"). The session cannot proceed without admission.`,
      requiredAction: "Resolve admission gating for this session.",
    });
  }

  // Result exists without execution flow.
  if (executionState && executionState !== "PENDING" && executionState !== "COMPLETED" && !hasExecutionRecord) {
    blockers.push({
      code: "status_contradiction",
      explanation: `Strategy Room session execution state is "${executionState}" but no execution record exists. Execution state cannot be claimed without a record.`,
      requiredAction: "Create an execution record matching the claimed execution state.",
    });
  }

  // Intervention suggested without evidence or authority boundary.
  if (signalPressureLocked && evidenceTier === "insufficient") {
    blockers.push({
      code: "unverified_evidence",
      explanation: "Signal pressure is locking the execution path but evidence is insufficient to support intervention. Intervention cannot proceed without verified evidence.",
      requiredAction: "Gather sufficient evidence before proceeding with intervention.",
    });
  }

  // Return brief exists without execution record.
  if (hasReturnBrief && !hasExecutionRecord) {
    blockers.push({
      code: "delivery_claim_without_artifact",
      explanation: "A return brief is available but no execution record exists. A return brief requires an execution record.",
      requiredAction: "Complete the execution record before delivering the return brief.",
    });
  }

  // Escalation trigger exists without operator/human review path.
  if (escalationTriggers > 0) {
    blockers.push({
      code: "owner_decision_required",
      explanation: `${escalationTriggers} escalation trigger(s) exist for this session but no operator review path is confirmed.`,
      requiredAction: "Assign an operator to review the escalation triggers.",
    });
  }

  // Retainer entry gate appears without retainer readiness signal.
  if (retainerEligible && !hasExecutionRecord) {
    blockers.push({
      code: "missing_evidence",
      explanation: "Retainer eligibility is indicated but no execution record exists to support retainer readiness. Retainer conversion requires demonstrated execution.",
      requiredAction: "Complete an execution session before evaluating retainer readiness.",
    });
  }

  // Artifact grid lists artifact but no artifact route exists.
  if (artifactCount > 0) {
    const artifactRoutes = readStringArray(record, "artifactRoutes");
    if (artifactRoutes.length === 0) {
      blockers.push({
        code: "stub_artifact_only",
        explanation: `${artifactCount} artifact(s) listed but no artifact routes exist. Artifacts are stubs without delivery paths.`,
        requiredAction: "Generate artifact routes for the listed artifacts.",
      });
    }
  }

  return blockers;
}

/**
 * Build operator summary.
 */
function buildOperatorSummary(record: Record<string, unknown>): string {
  const sessionId = readString(record, "sessionId") ?? "unknown";
  const admissionStatus = readString(record, "admissionStatus") ?? "unknown";
  const executionState = readString(record, "executionState") ?? "unknown";
  const evidenceTier = readString(record, "evidenceTier") ?? "none";
  const hasReturnBrief = readBool(record, "returnBriefAvailable") === true;
  const hasExecutionRecord = readBool(record, "hasExecutionRecord") === true;
  const signalLocked = readBool(record, "signalPressureLocked") === true;

  const parts: string[] = [
    `Strategy Room session "${sessionId}" — admission: ${admissionStatus}, execution: ${executionState}, evidence: ${evidenceTier}.`,
  ];
  if (hasReturnBrief) parts.push("Return brief available.");
  if (hasExecutionRecord) parts.push("Execution record exists.");
  if (signalLocked) parts.push("⚠ Signal pressure is locking the execution path.");
  return parts.join(" ");
}

/**
 * Build user-visible summary.
 */
function buildUserSummary(record: Record<string, unknown>): string {
  const decisionStatement = readString(record, "decisionStatement");
  if (decisionStatement) {
    return `Strategy Room session for: "${decisionStatement}".`;
  }
  return "Your Strategy Room session is being prepared.";
}

// ─── Map one session record ───────────────────────────────────────────────────

function mapOne(
  record: Record<string, unknown>,
  input: LivingDomainAdapterInput,
): LivingStateObject {
  const sessionId = readString(record, "sessionId") ?? readString(record, "id") ?? `sr-${Math.random().toString(36).slice(2, 10)}`;
  const caseId = readString(record, "caseId") ?? "unknown";
  const admissionStatus = readString(record, "admissionStatus") ?? "PENDING";
  const executionState = readString(record, "executionState") ?? "PENDING";
  const evidenceTier = readString(record, "evidenceTier");
  const decisionStatement = readString(record, "decisionStatement");

  // Stage: use execution state if available, otherwise admission.
  const stage = executionState
    ? executionStateToStage(executionState)
    : admissionToStage(admissionStatus);

  const evidenceStatus = evidenceTierToStatus(evidenceTier);
  const srBlockers = SRBlockers(record, stage);
  const hasReturnBrief = readBool(record, "returnBriefAvailable") === true;
  const hasExecutionRecord = readBool(record, "hasExecutionRecord") === true;
  const signalLocked = readBool(record, "signalPressureLocked") === true;

  const id = `strategy-room-${sessionId}`;
  const title = decisionStatement
    ? `Strategy Room: "${decisionStatement.slice(0, 60)}${decisionStatement.length > 60 ? "..." : ""}"`
    : `Strategy Room session ${sessionId}`;

  // Detect component underwiring from duplicate folders.
  const componentUnderwired = readBool(record, "componentUnderwired") === true;

  return {
    id,
    domain: "strategy_room",
    subjectType: "session",
    sourceId: sessionId,
    productCode: "strategy_room",
    title,
    currentStage: stage,
    statusLabel: `${executionState ?? admissionStatus} — ${evidenceTier ?? "no evidence"}`,
    userVisibleSummary: buildUserSummary(record),
    operatorSummary: buildOperatorSummary(record),
    evidence: {
      status: evidenceStatus,
      supportingEvidence: evidenceTier
        ? [`Evidence tier: ${evidenceTier}`, `Admission: ${admissionStatus}`]
        : [],
      missingEvidence: !evidenceTier || evidenceTier === "insufficient"
        ? ["Established evidence baseline"]
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
      required: hasReturnBrief || hasExecutionRecord,
      status: hasReturnBrief ? "generated" : hasExecutionRecord ? "generated" : stage === "processing" ? "draft" : "not_required",
      artifactIds: hasReturnBrief ? [sessionId] : [],
      artifactRoutes: readStringArray(record, "artifactRoutes"),
      missing: hasReturnBrief && !hasExecutionRecord
        ? ["Execution record for return brief"]
        : [],
    },
    publication: {
      relevant: false,
      allowed: false,
      reason: "A Strategy Room session is private to the user; it is not published.",
      missing: [],
    },
        blockers: [
          ...srBlockers.map((b) => ({
            code: b.code,
            label: b.code === "missing_artifact"
              ? "Required artifact is missing"
              : b.code === "missing_operator_action"
                ? "An operator action is required but undefined"
                : b.code === "status_contradiction"
                  ? "Status contradicts the evidence"
                  : b.code === "unverified_evidence"
                    ? "Evidence is not yet verified"
                  : b.code === "delivery_claim_without_artifact"
                    ? "Delivery claimed without artifact"
                  : b.code === "owner_decision_required"
                    ? "An explicit owner decision is required"
                  : b.code === "missing_evidence"
                    ? "Required evidence is missing"
                  : b.code === "stub_artifact_only"
                    ? "Only a stub artifact exists"
                    : "Session issue",
            severity: (b.code === "missing_artifact" || b.code === "status_contradiction" || b.code === "delivery_claim_without_artifact"
              ? "blocker"
              : b.code === "owner_decision_required"
                ? "governed_tension"
                : "warning") as LivingStateSeverity,        explanation: b.explanation,
        evidence: [
          `sessionId=${sessionId}`,
          `caseId=${caseId}`,
          `admission=${admissionStatus}`,
          `execution=${executionState}`,
          `evidenceTier=${evidenceTier ?? "none"}`,
        ],
        affectedItems: [sessionId],
        requiredAction: b.requiredAction,
        actionOwner: (b.code === "owner_decision_required" ? "founder" : "operator") as "founder" | "operator",
        canAutomate: false,
      })),
      ...(componentUnderwired
        ? [{
            code: "component_without_live_state" as LivingStateBlockerCode,
            label: "Living component has no live state binding",
            severity: "warning" as const,
            explanation: "Strategy Room has duplicate component folders (components/strategy-room and components/StrategyRoom) creating ambiguity. Some components may be underwired.",
            evidence: ["Duplicate StrategyRoom/strategy-room folders"],
            affectedItems: ["components/strategy-room", "components/StrategyRoom"],
            requiredAction: "Consolidate Strategy Room components into a single folder structure.",
            actionOwner: "operator" as const,
            canAutomate: false,
          }]
        : []),
    ],
    nextActions: [
      ...(admissionStatus === "ADMITTED" && executionState === "PENDING"
        ? [{
            label: "Begin execution session",
            description: "Admission is granted. Start the execution session to proceed.",
            owner: "user" as const,
            actionType: "open_case" as const,
            route: "/strategy-room",
            safeToAutomate: false,
            requiredEvidence: [] as string[],
          }]
        : []),
      ...(hasReturnBrief && !hasExecutionRecord
        ? [{
            label: "Complete execution record",
            description: "A return brief is available but requires an execution record first.",
            owner: "user" as const,
            actionType: "generate_artifact" as const,
            safeToAutomate: false,
            requiredEvidence: [] as string[],
          }]
        : []),
      ...(signalLocked
        ? [{
            label: "Resolve signal pressure before proceeding",
            description: "Signal pressure is locking the execution path. Resolve the governing signals before continuing.",
            owner: "operator" as const,
            actionType: "verify_evidence" as const,
            safeToAutomate: false,
            requiredEvidence: [] as string[],
          }]
        : []),
    ],
    memory: {
      recurrenceCount: 1,
      currentStage: stage,
      regressionDetected: false,
      resolvedSinceLastRun: false,
    },
    safeToShowUser: admissionStatus === "ADMITTED",
    safeToShowOperator: true,
    safeToAutomate: false,
    sourceOfTruth: [
      "lib/strategy-room/room-state-contract.ts",
      "lib/strategy-room/execution-record.ts",
      "lib/strategy-room/execution-feedback.ts",
      "lib/strategy-room/canonical-snapshot.ts",
      "lib/strategy-room/admission.ts",
      "lib/strategy-room/session-service.ts",
    ],
    raw: {
      sessionId,
      caseId,
      admissionStatus,
      executionState,
      evidenceTier,
      hasReturnBrief,
      hasExecutionRecord,
      signalPressureLocked: signalLocked,
      escalationTriggerCount: readNumber(record, "escalationTriggerCount") ?? 0,
      retainerEligible: readBool(record, "retainerEligible") === true,
      artifactCount: readNumber(record, "artifactCount") ?? 0,
      componentUnderwired,
    },
  };
}

// ─── Proof-case records ───────────────────────────────────────────────────────

function srProofRecords(): Record<string, unknown>[] {
  return [
    {
      sessionId: "sr-proof-pending-admission",
      caseId: "dc-proof-signal-discovery",
      admissionStatus: "PENDING",
      executionState: "PENDING",
      evidenceTier: "user_reported",
      decisionStatement: "",
      returnBriefAvailable: false,
      hasExecutionRecord: false,
      signalPressureLocked: false,
      escalationTriggerCount: 0,
      retainerEligible: false,
      artifactCount: 0,
      artifactRoutes: [],
      componentUnderwired: false,
    },
    {
      sessionId: "sr-proof-active-execution",
      caseId: "dc-proof-structural-recognition",
      admissionStatus: "ADMITTED",
      executionState: "ACTIVE",
      evidenceTier: "single_source",
      decisionStatement: "Restructure the decision authority before Q3 planning cycle.",
      returnBriefAvailable: false,
      hasExecutionRecord: true,
      signalPressureLocked: false,
      escalationTriggerCount: 1,
      retainerEligible: false,
      artifactCount: 2,
      artifactRoutes: ["/strategy-room/artifacts/1", "/strategy-room/artifacts/2"],
      componentUnderwired: false,
    },
    {
      sessionId: "sr-proof-signal-locked",
      caseId: "dc-proof-counsel-warranted",
      admissionStatus: "ADMITTED",
      executionState: "STALLED",
      evidenceTier: "insufficient",
      decisionStatement: "Resolve founder identity lock before delegation.",
      returnBriefAvailable: true,
      hasExecutionRecord: false,
      signalPressureLocked: true,
      escalationTriggerCount: 3,
      retainerEligible: true,
      artifactCount: 1,
      artifactRoutes: [],
      componentUnderwired: true,
    },
    {
      sessionId: "sr-proof-completed",
      caseId: "dc-proof-execution-governance",
      admissionStatus: "ADMITTED",
      executionState: "COMPLETED",
      evidenceTier: "multi_source",
      decisionStatement: "Execute the governance restructuring plan.",
      returnBriefAvailable: true,
      hasExecutionRecord: true,
      signalPressureLocked: false,
      escalationTriggerCount: 0,
      retainerEligible: true,
      artifactCount: 3,
      artifactRoutes: ["/strategy-room/artifacts/1", "/strategy-room/artifacts/2", "/strategy-room/artifacts/3"],
      componentUnderwired: true,
    },
  ];
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

export const strategyRoomAdapter: LivingDomainAdapter = {
  domain: "strategy_room",
  label: "Strategy Room",
  detect(records) {
    return records.some(
      (record) =>
        typeof record["sessionId"] === "string" ||
        typeof record["admissionStatus"] === "string" ||
        typeof record["executionState"] === "string",
    );
  },
  map(input: LivingDomainAdapterInput) {
    return input.records.map((record) => mapOne(record, input));
  },
};

export default strategyRoomAdapter;
