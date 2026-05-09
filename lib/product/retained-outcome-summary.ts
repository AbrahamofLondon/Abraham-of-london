import { prisma } from "@/lib/prisma.server";

export type RetainedOutcomeSummary = {
  confirmedOutcomes: number;
  blockedOutcomes: number;
  abandonedOutcomes: number;
  disputedFindings: number;
  latestOutcomeDate?: string | null;
  evidencePosture: "VERIFIED" | "USER_REPORTED" | "INSUFFICIENT_EVIDENCE";
  thinState: boolean;
  historyState: "THIN" | "SUFFICIENT";
  sourceLabel: "Retained Outcome History";
};

function normalizeEmail(value?: string | null) {
  return typeof value === "string" && value.trim() ? value.trim().toLowerCase() : null;
}

export async function buildRetainedOutcomeSummary(input: {
  email?: string | null;
  userId?: string | null;
  organisationId?: string | null;
}): Promise<RetainedOutcomeSummary> {
  const email = normalizeEmail(input.email);

  const diagnosticRecords = await prisma.diagnosticRecord.findMany({
    where: {
      diagnosticType: "outcome_verification",
      OR: [
        ...(email ? [{ userEmail: email }] : []),
        ...(input.userId ? [{ userId: input.userId }] : []),
      ],
    },
    select: {
      responsesJson: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const parsed = diagnosticRecords.map((row) => {
    try {
      return JSON.parse(row.responsesJson || "{}") as {
        outcomeClassification?: string;
        checkpointResponseStatus?: string;
        createdAt?: string;
      };
    } catch {
      return {};
    }
  });

  const confirmedOutcomes = parsed.filter((item) =>
    item.outcomeClassification === "ACTION_CONFIRMED" || item.outcomeClassification === "OUTCOME_IMPROVED"
  ).length;
  const blockedOutcomes = parsed.filter((item) =>
    item.outcomeClassification === "ACTION_BLOCKED"
  ).length;
  const abandonedOutcomes = parsed.filter((item) =>
    item.checkpointResponseStatus === "ABANDONED"
  ).length;
  const disputedFindings = parsed.filter((item) =>
    item.outcomeClassification === "SYSTEM_FINDING_DISPUTED"
  ).length;

  const latestOutcomeDate = diagnosticRecords[0]?.createdAt?.toISOString?.() ?? null;
  const total = confirmedOutcomes + blockedOutcomes + abandonedOutcomes + disputedFindings;

  return {
    confirmedOutcomes,
    blockedOutcomes,
    abandonedOutcomes,
    disputedFindings,
    latestOutcomeDate,
    evidencePosture: confirmedOutcomes > 0 ? "VERIFIED" : total > 0 ? "USER_REPORTED" : "INSUFFICIENT_EVIDENCE",
    thinState: total < 3,
    historyState: total < 3 ? "THIN" : "SUFFICIENT",
    sourceLabel: "Retained Outcome History",
  };
}
