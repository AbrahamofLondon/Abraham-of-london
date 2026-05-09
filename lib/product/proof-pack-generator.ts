import { prisma } from "@/lib/prisma.server";
import { getLedgerSummary } from "@/lib/decision-ledger/ledger-service";
import { loadCounselCaseForUser } from "@/lib/product/counsel-case-service";
import { buildRetainedOutcomeSummary, type RetainedOutcomeSummary } from "@/lib/product/retained-outcome-summary";
import { createSuppressionInput } from "@/lib/product/suppression-event-helpers";
import { recordSuppression } from "@/lib/product/suppression-ledger";

export type ProofLabel =
  | "USER_REPORTED"
  | "SYSTEM_INFERRED"
  | "OPERATOR_REVIEWED"
  | "VERIFIED"
  | "INSUFFICIENT_EVIDENCE";

export type ProofPackLine = {
  label: string;
  count: number;
  posture: ProofLabel;
  note: string;
};

export type ProofPack = {
  generatedAt: string;
  ownerEmail: string;
  diagnosticsCompleted: ProofPackLine;
  evidenceCaptured: ProofPackLine;
  contradictionsDetected: ProofPackLine;
  checkpointsCreated: ProofPackLine;
  checkpointResponses: ProofPackLine;
  outcomesVerified: ProofPackLine;
  decisionVelocityTrend: ProofPackLine;
  counselReviews: ProofPackLine;
  oversightCycles: ProofPackLine;
  retainedOutcomeHistory: RetainedOutcomeSummary;
  summary: string;
};

function normalizeEmail(value?: string | null): string | null {
  return typeof value === "string" && value.trim()
    ? value.trim().toLowerCase()
    : null;
}

function postureFromOutcomeClassifications(classifications: string[]): ProofLabel {
  if (classifications.length === 0) return "INSUFFICIENT_EVIDENCE";
  if (classifications.some((item) => item === "ACTION_CONFIRMED" || item === "OUTCOME_IMPROVED")) {
    return "VERIFIED";
  }
  return "USER_REPORTED";
}

export async function generateProofPack(input: {
  email: string;
  userId?: string | null;
}): Promise<ProofPack> {
  const email = normalizeEmail(input.email);
  if (!email) {
    throw new Error("Email is required to generate a proof pack.");
  }

  const [
    diagnosticsCompleted,
    evidenceCaptured,
    contradictionNodes,
    allCheckpoints,
    outcomeDiagnostics,
    journeys,
    ledger,
    counselCase,
    oversightArchives,
    retainedOutcomeHistory,
  ] = await Promise.all([
    prisma.diagnosticRecord.count({
      where: {
        userEmail: email,
        diagnosticType: { notIn: ["efficacy_checkpoint", "outcome_verification", "counsel_case"] },
      },
    }),
    prisma.diagnosticEvidenceNode.count({
      where: { email },
    }),
    prisma.diagnosticEvidenceNode.count({
      where: {
        email,
        kind: "contradiction",
      },
    }),
    prisma.diagnosticRecord.findMany({
      where: {
        diagnosticType: "efficacy_checkpoint",
        OR: [
          { userEmail: email },
          ...(input.userId ? [{ userId: input.userId }] : []),
        ],
      },
      select: { responsesJson: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.diagnosticRecord.findMany({
      where: {
        diagnosticType: "outcome_verification",
        OR: [
          { userEmail: email },
          ...(input.userId ? [{ userId: input.userId }] : []),
        ],
      },
      select: { responsesJson: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.diagnosticJourney.findMany({
      where: {
        OR: [
          { email },
          ...(input.userId ? [{ userId: input.userId }] : []),
        ],
      },
      select: { id: true },
    }),
    getLedgerSummary(email),
    loadCounselCaseForUser({ email, userId: input.userId ?? undefined }),
    prisma.auditEvent.findMany({
      where: {
        objectType: "OVERSIGHT_CYCLE_ARCHIVE",
      },
      select: { metadata: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    buildRetainedOutcomeSummary({ email, userId: input.userId ?? null }),
  ]);

  const journeyIds = journeys.map((item) => item.id);
  const verifiedOutcomes = journeyIds.length > 0
    ? await prisma.outcomeVerificationRecord.findMany({
        where: {
          OR: [
            { baselineJourneyId: { in: journeyIds } },
            { followUpJourneyId: { in: journeyIds } },
          ],
        },
        select: { outcomeClassification: true },
      })
    : [];

  const checkpointResponses = allCheckpoints.reduce((total, checkpoint) => {
    try {
      const payload = JSON.parse(checkpoint.responsesJson || "{}") as { responses?: unknown[]; response?: unknown };
      if (Array.isArray(payload.responses)) return total + payload.responses.length;
      return payload.response ? total + 1 : total;
    } catch {
      return total;
    }
  }, 0);

  const outcomeClassifications = outcomeDiagnostics.flatMap((item) => {
    try {
      const payload = JSON.parse(item.responsesJson || "{}") as { outcomeClassification?: string };
      return payload.outcomeClassification ? [payload.outcomeClassification] : [];
    } catch {
      return [];
    }
  });

  const oversightCycleCount = oversightArchives.filter((row) => {
    const metadata = row.metadata && typeof row.metadata === "object"
      ? row.metadata as Record<string, unknown>
      : null;
    return normalizeEmail(typeof metadata?.subjectEmail === "string" ? metadata.subjectEmail : null) === email;
  }).length;

  const averageScoreImpact = ledger.averageScoreImpact;
  const velocityTrendLabel = averageScoreImpact > 0.5
    ? "Decision history is trending upward."
    : averageScoreImpact < -0.5
      ? "Decision history is deteriorating."
      : "Decision history is presently mixed.";

  const pack: ProofPack = {
    generatedAt: new Date().toISOString(),
    ownerEmail: email,
    diagnosticsCompleted: {
      label: "Diagnostics completed",
      count: diagnosticsCompleted,
      posture: diagnosticsCompleted > 0 ? "SYSTEM_INFERRED" : "INSUFFICIENT_EVIDENCE",
      note: "Count of completed diagnostic records attached to this account.",
    },
    evidenceCaptured: {
      label: "Evidence captured",
      count: evidenceCaptured,
      posture: evidenceCaptured > 0 ? "SYSTEM_INFERRED" : "INSUFFICIENT_EVIDENCE",
      note: "Durable evidence nodes stored against the account or journey.",
    },
    contradictionsDetected: {
      label: "Contradictions detected",
      count: contradictionNodes,
      posture: contradictionNodes > 0 ? "SYSTEM_INFERRED" : "INSUFFICIENT_EVIDENCE",
      note: "Contradictions detected and recorded against this account.",
    },
    checkpointsCreated: {
      label: "Checkpoints created",
      count: allCheckpoints.length,
      posture: allCheckpoints.length > 0 ? "SYSTEM_INFERRED" : "INSUFFICIENT_EVIDENCE",
      note: "Durable efficacy checkpoints created for this account.",
    },
    checkpointResponses: {
      label: "Checkpoint responses",
      count: checkpointResponses,
      posture: checkpointResponses > 0 ? "USER_REPORTED" : "INSUFFICIENT_EVIDENCE",
      note: "Responses written back against durable checkpoints.",
    },
    outcomesVerified: {
      label: "Outcomes verified",
      count: verifiedOutcomes.length,
      posture: postureFromOutcomeClassifications([
        ...verifiedOutcomes.map((item) => item.outcomeClassification),
        ...outcomeClassifications,
      ]),
      note: "Outcome verification records linked to the account's journeys.",
    },
    decisionVelocityTrend: {
      label: "Decision velocity trend",
      count: ledger.totalEntries,
      posture: ledger.totalEntries > 0 ? "SYSTEM_INFERRED" : "INSUFFICIENT_EVIDENCE",
      note: velocityTrendLabel,
    },
    counselReviews: {
      label: "Counsel reviews",
      count: counselCase ? 1 : 0,
      posture: counselCase
        ? counselCase.status === "COUNSEL_RESPONSE_READY" || counselCase.status === "CLOSED"
          ? "OPERATOR_REVIEWED"
          : "USER_REPORTED"
        : "INSUFFICIENT_EVIDENCE",
      note: counselCase
        ? `Latest counsel status: ${counselCase.status}.`
        : "No counsel case is currently attached to this account.",
    },
    oversightCycles: {
      label: "Oversight cycles",
      count: oversightCycleCount,
      posture: oversightCycleCount > 0 ? "OPERATOR_REVIEWED" : "INSUFFICIENT_EVIDENCE",
      note: "Archived oversight cycles released for this account or sponsor email.",
    },
    retainedOutcomeHistory,
    summary: [
      `${diagnosticsCompleted} diagnostic record${diagnosticsCompleted === 1 ? "" : "s"} completed.`,
      `${allCheckpoints.length} checkpoint${allCheckpoints.length === 1 ? "" : "s"} created and ${checkpointResponses} response${checkpointResponses === 1 ? "" : "s"} recorded.`,
      `${verifiedOutcomes.length} journey-linked outcome verification record${verifiedOutcomes.length === 1 ? "" : "s"} found.`,
    ].join(" "),
  };

  await recordSuppression(createSuppressionInput({
    scopeId: email,
    scopeType: "ACCOUNT",
    surface: "PROOF_PACK",
    fieldName: "operatorOnlyNotes",
    evidenceSource: "Proof pack evidence rollup",
    evidencePosture: "SOURCE_LABELLED",
    sourceLabel: "Proof pack",
    suppressionReason: "Operator and counsel notes remain withheld.",
    suppressionRule: "OPERATOR_NOTES_WITHHELD",
    suppressionRuleCategory: "ROLE_BOUNDARY",
    operatorReviewAvailable: true,
  })).catch(() => null);

  return pack;
}
