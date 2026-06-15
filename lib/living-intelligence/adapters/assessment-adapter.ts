/**
 * lib/living-intelligence/adapters/assessment-adapter.ts
 *
 * Assessment / diagnostic domain adapter — the user-facing proof that the same
 * reusable architecture serves end-user surfaces, not just operator ones.
 *
 * It maps the canonical governed AssessmentResult (Fast Diagnostic, Purpose
 * Alignment, Constitutional, Team, Enterprise) into a LivingStateObject. The
 * engine then enforces the user-facing rules:
 *   - a result must carry an evidence posture (else diagnostic_without_evidence_posture)
 *   - continuity promised without a durable memory write is a blocker
 *     (assessment_without_memory) — surfaced to the operator, while the user is
 *     given the governed move to retain their result.
 *
 * Source of truth:
 *   - lib/diagnostics/assessment-result-contract.ts (AssessmentResult)
 */

import {
  readString,
  type LivingDomainAdapter,
  type LivingDomainAdapterInput,
} from "@/lib/living-intelligence/living-domain-adapter-contract";
import type {
  LivingStateEvidenceStatus,
  LivingStateObject,
  LivingStateStage,
} from "@/lib/living-intelligence/living-state-object-contract";

// AssessmentResult.evidencePosture → living evidence status.
function mapEvidencePosture(raw: string | undefined): LivingStateEvidenceStatus {
  switch (raw) {
    case "OPERATOR_VERIFIED":
      return "verified";
    case "THIRD_PARTY":
      return "strongly_indicated";
    case "SYSTEM_INFERRED":
      return "inferred";
    case "USER_REPORTED":
      return "weakly_indicated";
    default:
      return "unverified";
  }
}

// AssessmentResult.recordStatus.level → lifecycle stage.
function mapRecordStage(level: string | undefined): LivingStateStage {
  switch (level) {
    case "GOVERNED_CASE":
      return "delivered";
    case "ACCOUNT_RECORD":
      return "artifact_generated";
    case "SESSION_PREVIEW":
    default:
      return "draft_generated";
  }
}

function mapOne(record: Record<string, unknown>): LivingStateObject {
  const kind = readString(record, "kind") ?? "ASSESSMENT";
  const id =
    readString(record, "caseId") ??
    readString(record, "id") ??
    `assessment-${kind.toLowerCase()}-${Math.random().toString(36).slice(2, 8)}`;

  const title = readString(record, "title") ?? "Assessment result";
  const band = readString(record, "band") ?? "";
  const primaryFinding = readString(record, "primaryFinding") ?? "";
  const failurePattern = readString(record, "failurePattern") ?? "";
  const governanceImplication = readString(record, "governanceImplication") ?? "";
  const recommendedNextMove = readString(record, "recommendedNextMove") ?? "";

  const evidenceStatus = mapEvidencePosture(readString(record, "evidencePosture"));

  // recordStatus may be nested; read level/caseId defensively.
  const recordStatus =
    (record["recordStatus"] as Record<string, unknown> | undefined) ?? {};
  const recordLevel = readString(recordStatus, "level");
  const stage = mapRecordStage(recordLevel);

  // earnedRoute may be nested.
  const earnedRoute =
    (record["earnedRoute"] as Record<string, unknown> | undefined) ?? {};
  const earnedHref = readString(earnedRoute, "href");
  const earnedLabel = readString(earnedRoute, "label") ?? recommendedNextMove;

  // Continuity is promised by the product doctrine; durability depends on the
  // persistence level. A session preview has no durable memory.
  const continuityPromised = true;
  const memoryWritten = recordLevel === "GOVERNED_CASE" || recordLevel === "ACCOUNT_RECORD";

  // What the system "heard" / concluded — honest, no raw user PII.
  const supportingEvidence = [primaryFinding, failurePattern].filter(
    (s): s is string => typeof s === "string" && s.length > 0,
  );

  return {
    id,
    domain: "assessment",
    subjectType: "assessment_result",
    sourceId: id,
    productCode: kind,
    title,
    currentStage: stage,
    statusLabel: band ? `${band} — assessment result` : "Assessment result",
    userVisibleSummary: primaryFinding || "Your assessment result is ready.",
    operatorSummary:
      `${kind} result "${title}"${band ? ` (band ${band})` : ""}. ` +
      (governanceImplication ? `Governance implication: ${governanceImplication}` : "") +
      (memoryWritten ? "" : " Continuity promised but this is not yet a durable record."),
    evidence: {
      status: evidenceStatus,
      supportingEvidence,
      missingEvidence: memoryWritten
        ? []
        : ["A durable, signed-in record to carry this result forward."],
      cannotInfer: [
        "Whether you will act on this — the outcome has not been observed yet.",
        "A verified outcome — this is a forward projection, not a measured result.",
      ],
    },
    consent: {
      required: false,
      status: "not_required",
      supportingEvidence: [],
      missing: [],
    },
    artifact: {
      required: false,
      status: "not_required",
      artifactIds: [],
      artifactRoutes: earnedHref ? [earnedHref] : [],
      missing: [],
    },
    publication: {
      relevant: false,
      allowed: false,
      reason: "An assessment result is private to the user; it is not published.",
      missing: [],
    },
    blockers: [],
    nextActions: [
      {
        label: earnedLabel || "Continue to your next governed move",
        description: governanceImplication || recommendedNextMove,
        owner: "user",
        actionType: "show_user_result",
        ...(earnedHref ? { route: earnedHref } : {}),
        safeToAutomate: false,
        requiredEvidence: [],
      },
      ...(memoryWritten
        ? []
        : [
            {
              label: "Sign in to retain this result as a durable record",
              description:
                "This result is currently a session preview. Signing in writes it to your Decision Centre so the system can compound context across decisions.",
              owner: "user" as const,
              actionType: "open_case" as const,
              route: "/decision-centre",
              safeToAutomate: false,
              requiredEvidence: [],
            },
          ]),
    ],
    memory: {
      recurrenceCount: 1,
      currentStage: stage,
      regressionDetected: false,
      resolvedSinceLastRun: false,
    },
    // The user's own result is safe to show the user.
    safeToShowUser: true,
    safeToShowOperator: true,
    safeToAutomate: false,
    sourceOfTruth: ["lib/diagnostics/assessment-result-contract.ts"],
    raw: {
      kind,
      band,
      recordLevel: recordLevel ?? null,
      continuityPromised,
      memoryWritten,
    },
  };
}

export const assessmentAdapter: LivingDomainAdapter = {
  domain: "assessment",
  label: "Assessment / Diagnostic",
  detect(records) {
    return records.some(
      (record) =>
        typeof record["evidencePosture"] === "string" ||
        typeof record["primaryFinding"] === "string" ||
        typeof record["kind"] === "string",
    );
  },
  map(input: LivingDomainAdapterInput) {
    return input.records.map((record) => mapOne(record));
  },
};

export default assessmentAdapter;
