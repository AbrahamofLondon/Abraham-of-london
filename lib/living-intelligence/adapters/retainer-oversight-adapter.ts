/**
 * lib/living-intelligence/adapters/retainer-oversight-adapter.ts
 *
 * Retainer Oversight domain adapter — Phase 5D.
 *
 * Translates retainer oversight accounts, oversight cycles, oversight briefs,
 * and retainer readiness signals into LivingStateObjects.
 *
 * Sources inspected:
 *   lib/product/retainer-oversight-contract.ts   (RetainerOversightAccount, OversightCycle)
 *   lib/product/oversight-brief-contract.ts      (OversightBrief)
 *   lib/product/oversight-signal-builder.ts      (signal derivation)
 *   lib/product/oversight-brief-composer.ts      (brief composition)
 *   lib/product/oversight-account-loader.ts      (account loading)
 *   lib/product/retainer-oversight-readiness.ts  (readiness classifier)
 *   lib/product/retainer-cycle-memory-contract.ts (cycle memory)
 *   lib/product/retainer-readiness-classifier.ts (readiness classification)
 *   lib/product/retainer-review-queue.ts         (review queue)
 *   lib/retainers/retainer-service.ts            (retainer service)
 *   lib/retainers/retainer-pipeline-contracts.ts (pipeline contracts)
 *   components/strategy-room/RetainerEntryGate.tsx
 *   components/strategy-room/ReturnBriefInterruptionBar.tsx
 *
 * Every object answers:
 *   1. What account/oversight object exists?
 *   2. What access boundary applies?
 *   3. Is there enough evidence to generate an oversight brief?
 *   4. Is retainer readiness supported by real signals?
 *   5. Is there recurrence, deterioration, improvement, or unresolved pattern memory?
 *   6. Is there a human/operator review path?
 *   7. Is client/advisor consent or authority boundary required?
 *   8. What cannot be inferred?
 *
 * The system REFUSES to infer:
 *   - retainer readiness from interest alone
 *   - oversight brief readiness without evidence signals
 *   - client outcome verification from advisor notes alone
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

function statusToStage(status: string | undefined): LivingStateStage {
  switch (status) {
    case "PROSPECT":
      return "created";
    case "QUALIFIED":
      return "intake_complete";
    case "ACTIVE":
      return "processing";
    case "AT_RISK":
      return "blocked";
    case "PAUSED":
      return "blocked";
    case "ENDED":
      return "archived";
    default:
      return "created";
  }
}

function cycleStatusToStage(status: string | undefined): LivingStateStage {
  switch (status) {
    case "NOT_STARTED":
      return "created";
    case "IN_PROGRESS":
      return "processing";
    case "BRIEF_READY":
      return "artifact_generated";
    case "ESCALATION_REQUIRED":
      return "awaiting_review";
    case "COMPLETED":
      return "delivered";
    default:
      return "created";
  }
}

function tierToEvidenceStatus(tier: string | undefined): LivingStateEvidenceStatus {
  switch (tier) {
    case "INSTITUTIONAL_COMMAND":
      return "verified";
    case "EXECUTIVE_OVERSIGHT":
      return "strongly_indicated";
    case "GOVERNED_CONTINUITY":
      return "weakly_indicated";
    default:
      return "unverified";
  }
}

function buildCannotInfer(): string[] {
  return [
    "Retainer readiness from interest alone — interest is not evidence of readiness.",
    "Oversight brief readiness without evidence signals — signals must be verified.",
    "Client outcome verification from advisor notes alone — notes are not verified outcomes.",
    "Retainer conversion from entry gate appearance — a gate is not a conversion.",
  ];
}

function detectRetainerBlockers(
  record: Record<string, unknown>,
  stage: LivingStateStage,
): { code: LivingStateBlockerCode; explanation: string; requiredAction: string }[] {
  const blockers: { code: LivingStateBlockerCode; explanation: string; requiredAction: string }[] = [];

  const status = readString(record, "status");
  const signalCount = readNumber(record, "signalCount") ?? 0;
  const activeCaseCount = readNumber(record, "activeCaseCount") ?? 0;
  const hasBrief = readBool(record, "hasOversightBrief") === true;
  const escalationRequired = readBool(record, "escalationRequired") === true;
  const unresolvedCommitments = readNumber(record, "unresolvedCommitments") ?? 0;
  const retainerEligible = readBool(record, "retainerEligible") === true;

  // Oversight account exists without signal basis.
  if ((status === "ACTIVE" || status === "QUALIFIED") && signalCount === 0 && activeCaseCount === 0) {
    blockers.push({
      code: "missing_evidence",
      explanation: "Retainer oversight account has no signal basis and no active cases. Oversight requires evidence signals to generate meaningful briefs.",
      requiredAction: "Associate cases or signals with this oversight account before proceeding.",
    });
  }

  // Retainer readiness exists without evidence signals.
  if (retainerEligible && signalCount === 0) {
    blockers.push({
      code: "missing_evidence",
      explanation: "Retainer eligibility is indicated but no evidence signals support it. Retainer readiness requires demonstrated signal evidence.",
      requiredAction: "Gather evidence signals before confirming retainer readiness.",
    });
  }

  // Escalation required but no review route.
  if (escalationRequired) {
    blockers.push({
      code: "owner_decision_required",
      explanation: "Oversight escalation is required but no operator review path is confirmed.",
      requiredAction: "Assign an operator to review the escalation.",
    });
  }

  // Unresolved commitments without verification path.
  if (unresolvedCommitments > 0 && !hasBrief) {
    blockers.push({
      code: "missing_operator_action",
      explanation: `${unresolvedCommitments} unresolved commitment(s) exist but no oversight brief has been generated to track them.`,
      requiredAction: "Generate an oversight brief to track unresolved commitments.",
    });
  }

  return blockers;
}

function buildOperatorSummary(record: Record<string, unknown>): string {
  const accountId = readString(record, "accountId") ?? "unknown";
  const status = readString(record, "status") ?? "unknown";
  const tier = readString(record, "tier") ?? "unknown";
  const signalCount = readNumber(record, "signalCount") ?? 0;
  const activeCases = readNumber(record, "activeCaseCount") ?? 0;
  const hasBrief = readBool(record, "hasOversightBrief") === true;
  const escalationReq = readBool(record, "escalationRequired") === true;

  const parts: string[] = [
    `Retainer account "${accountId}" — status: ${status}, tier: ${tier}.`,
    `Signals: ${signalCount}, active cases: ${activeCases}.`,
  ];
  if (hasBrief) parts.push("Oversight brief available.");
  if (escalationReq) parts.push("⚠ Escalation required.");
  return parts.join(" ");
}

function buildUserSummary(record: Record<string, unknown>): string {
  const tier = readString(record, "tier") ?? "Retainer";
  const status = readString(record, "status") ?? "unknown";
  if (status === "ACTIVE") return `Your ${tier.replace(/_/g, " ")} retainer is active. Oversight briefs are being generated.`;
  if (status === "PROSPECT" || status === "QUALIFIED") return `Your ${tier.replace(/_/g, " ")} retainer is being prepared.`;
  return `Retainer account — ${status}.`;
}

function mapOne(
  record: Record<string, unknown>,
  input: LivingDomainAdapterInput,
): LivingStateObject {
  const accountId = readString(record, "accountId") ?? readString(record, "id") ?? `ro-${Math.random().toString(36).slice(2, 10)}`;
  const status = readString(record, "status") ?? "PROSPECT";
  const tier = readString(record, "tier") ?? "GOVERNED_CONTINUITY";
  const stage = statusToStage(status);
  const evidenceStatus = tierToEvidenceStatus(tier);
  const retainerBlockers = detectRetainerBlockers(record, stage);
  const hasBrief = readBool(record, "hasOversightBrief") === true;
  const escalationReq = readBool(record, "escalationRequired") === true;

  const id = `retainer-oversight-${accountId}`;
  const title = `${tier.replace(/_/g, " ")} retainer — ${accountId}`;

  return {
    id,
    domain: "retainer_oversight",
    subjectType: "workflow",
    sourceId: accountId,
    productCode: "retainer_core",
    title,
    currentStage: stage,
    statusLabel: `${status} — ${tier}`,
    userVisibleSummary: buildUserSummary(record),
    operatorSummary: buildOperatorSummary(record),
    evidence: {
      status: evidenceStatus,
      supportingEvidence: [
        `Tier: ${tier}`,
        `Status: ${status}`,
        `Signals: ${readNumber(record, "signalCount") ?? 0}`,
      ],
      missingEvidence: [],
      cannotInfer: buildCannotInfer(),
    },
    consent: {
      required: status === "ACTIVE",
      status: status === "ACTIVE" ? "granted" : "not_required",
      supportingEvidence: [],
      missing: [],
    },
    artifact: {
      required: hasBrief || escalationReq,
      status: hasBrief ? "generated" : stage === "processing" ? "draft" : "not_required",
      artifactIds: hasBrief ? [accountId] : [],
      artifactRoutes: hasBrief ? ["/admin/retainer-oversight"] : [],
      missing: [],
    },
    publication: {
      relevant: false,
      allowed: false,
      reason: "Retainer oversight data is private to the operator and client; it is not published.",
      missing: [],
    },
    blockers: retainerBlockers.map((b) => ({
      code: b.code,
      label: b.code === "missing_evidence"
        ? "Required evidence is missing"
        : b.code === "owner_decision_required"
          ? "An explicit owner decision is required"
          : b.code === "missing_operator_action"
            ? "An operator action is required but undefined"
            : "Retainer issue",
      severity: (b.code === "missing_evidence"
        ? "blocker"
        : b.code === "owner_decision_required"
          ? "governed_tension"
          : "warning") as LivingStateSeverity,
      explanation: b.explanation,
      evidence: [
        `accountId=${accountId}`,
        `status=${status}`,
        `tier=${tier}`,
        `signals=${readNumber(record, "signalCount") ?? 0}`,
      ],
      affectedItems: [accountId],
      requiredAction: b.requiredAction,
      actionOwner: (b.code === "owner_decision_required" ? "founder" : "operator") as "founder" | "operator",
      canAutomate: false,
    })),
    nextActions: [
      ...(status === "QUALIFIED" && !hasBrief
        ? [{
            label: "Generate first oversight brief",
            description: `Retainer "${accountId}" is qualified. Generate the first oversight brief to begin tracking.`,
            owner: "operator" as const,
            actionType: "generate_artifact" as const,
            safeToAutomate: false,
            requiredEvidence: [] as string[],
          }]
        : []),
      ...(escalationReq
        ? [{
            label: "Review escalation requirements",
            description: `Retainer "${accountId}" requires escalation review.`,
            owner: "operator" as const,
            actionType: "review_draft" as const,
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
    safeToShowUser: status === "ACTIVE",
    safeToShowOperator: true,
    safeToAutomate: false,
    sourceOfTruth: [
      "lib/product/retainer-oversight-contract.ts",
      "lib/product/oversight-brief-contract.ts",
      "lib/product/oversight-signal-builder.ts",
      "lib/product/retainer-oversight-readiness.ts",
    ],
    raw: {
      accountId,
      status,
      tier,
      signalCount: readNumber(record, "signalCount") ?? 0,
      activeCaseCount: readNumber(record, "activeCaseCount") ?? 0,
      hasOversightBrief: hasBrief,
      escalationRequired: escalationReq,
      unresolvedCommitments: readNumber(record, "unresolvedCommitments") ?? 0,
      retainerEligible: readBool(record, "retainerEligible") === true,
    },
  };
}

function retainerProofRecords(): Record<string, unknown>[] {
  return [
    {
      accountId: "ro-proof-active-oversight",
      status: "ACTIVE",
      tier: "EXECUTIVE_OVERSIGHT",
      signalCount: 12,
      activeCaseCount: 4,
      hasOversightBrief: true,
      escalationRequired: false,
      unresolvedCommitments: 2,
      retainerEligible: true,
    },
    {
      accountId: "ro-proof-escalation-required",
      status: "ACTIVE",
      tier: "INSTITUTIONAL_COMMAND",
      signalCount: 8,
      activeCaseCount: 3,
      hasOversightBrief: true,
      escalationRequired: true,
      unresolvedCommitments: 5,
      retainerEligible: true,
    },
    {
      accountId: "ro-proof-no-signals",
      status: "QUALIFIED",
      tier: "GOVERNED_CONTINUITY",
      signalCount: 0,
      activeCaseCount: 0,
      hasOversightBrief: false,
      escalationRequired: false,
      unresolvedCommitments: 0,
      retainerEligible: true,
    },
  ];
}

export const retainerOversightAdapter: LivingDomainAdapter = {
  domain: "retainer_oversight",
  label: "Retainer Oversight",
  detect(records) {
    return records.some(
      (record) =>
        typeof record["accountId"] === "string" ||
        typeof record["tier"] === "string",
    );
  },
  map(input: LivingDomainAdapterInput) {
    return input.records.map((record) => mapOne(record, input));
  },
};

export default retainerOversightAdapter;
