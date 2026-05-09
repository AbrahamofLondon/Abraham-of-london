import { prisma } from "@/lib/prisma.server";
import type { InstitutionalMemoryArchive, InstitutionalMemoryCycleSnapshot } from "@/lib/product/institutional-memory-contract";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export async function loadInstitutionalMemoryArchive(accountId: string): Promise<InstitutionalMemoryArchive> {
  const rows = await prisma.auditEvent.findMany({
    where: {
      objectType: "OVERSIGHT_CYCLE_ARCHIVE",
    },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: { metadata: true },
  });

  const cycleSnapshots: InstitutionalMemoryCycleSnapshot[] = rows
    .map((row) => asRecord(row.metadata))
    .filter((metadata) => metadata.accountId === accountId)
    .map((metadata) => {
      const brief = asRecord(metadata.internalBrief);
      const verification = asRecord(brief.verification);
      const boardroom = asRecord(brief.boardroomArchive);
      const counsel = asRecord(brief.counselHistory);
      const cost = asRecord(brief.costOfInaction);
      const recurrence = asRecord(brief.patternRecurrence);
      const irreversibility = asRecord(brief.irreversibility);
      const activeCases = Array.isArray(brief.activeCases) ? brief.activeCases : [];

      return {
        cycleId: typeof metadata.cycleId === "string" ? metadata.cycleId : "unknown",
        periodStart: typeof metadata.periodStart === "string" ? metadata.periodStart : new Date().toISOString(),
        periodEnd: typeof metadata.periodEnd === "string" ? metadata.periodEnd : new Date().toISOString(),
        decisionsUnderGovernance: activeCases.length,
        recurringPatterns: typeof recurrence.priorCount === "number" ? recurrence.priorCount : 0,
        unresolvedCommitments: typeof verification.unresolvedBreaches === "number" ? verification.unresolvedBreaches : 0,
        verifiedCommitments: typeof verification.commitmentsVerified === "number" ? verification.commitmentsVerified : 0,
        boardroomEscalations: typeof boardroom.totalDossiers === "number" ? boardroom.totalDossiers : 0,
        counselEscalations: typeof counsel.totalEvents === "number" ? counsel.totalEvents : 0,
        costTracked: typeof cost.totalEstimated === "number" ? cost.totalEstimated : 0,
        irreversibilityScore: typeof irreversibility.score === "number" ? irreversibility.score : undefined,
      };
    });

  const first = cycleSnapshots[0];
  const last = cycleSnapshots[cycleSnapshots.length - 1];
  const monthsOfMemory = first && last
    ? Math.max(1, Math.round((new Date(last.periodEnd).getTime() - new Date(first.periodStart).getTime()) / 2_592_000_000))
    : 0;

  return {
    accountId,
    monthsOfMemory,
    cycleCount: cycleSnapshots.length,
    recurringPatternCount: cycleSnapshots.reduce((sum, item) => sum + item.recurringPatterns, 0),
    unresolvedCommitmentCount: cycleSnapshots.reduce((sum, item) => sum + item.unresolvedCommitments, 0),
    verifiedOutcomeCount: cycleSnapshots.reduce((sum, item) => sum + item.verifiedCommitments, 0),
    boardroomEscalationCount: cycleSnapshots.reduce((sum, item) => sum + item.boardroomEscalations, 0),
    counselEscalationCount: cycleSnapshots.reduce((sum, item) => sum + item.counselEscalations, 0),
    costHistoryTracked: cycleSnapshots.reduce((sum, item) => sum + item.costTracked, 0),
    latestIrreversibilityScore: last?.irreversibilityScore,
    cycleSnapshots,
  };
}
