/**
 * GMI Benchmark Service
 * Guards public benchmark claims behind actual data existence.
 * No "we beat consensus" claim without at least one real benchmark row.
 */

import { prisma } from "@/lib/prisma";

export type GmiBenchmarkEntryInput = {
  editionId: string;
  callId?: string | null;
  benchmarkType: string;
  providerName: string;
  benchmarkStatement: string;
  benchmarkValue?: string | null;
  actualValue?: string | null;
  gmiValue?: string | null;
  evaluationWindow: string;
  resultSummary?: string | null;
  sourceReference: string;
};

/**
 * Returns true only if at least one GmiBenchmarkEntry exists for the edition.
 * Public benchmark claims must not be shown without data.
 */
export async function canShowBenchmarkClaims(editionId: string): Promise<boolean> {
  const count = await prisma.gmiBenchmarkEntry.count({
    where: { editionId },
  });
  return count > 0;
}

/**
 * Adds a benchmark entry manually. Admin-only operation.
 */
export async function addBenchmarkEntry(data: GmiBenchmarkEntryInput) {
  return prisma.gmiBenchmarkEntry.create({ data });
}

/**
 * Returns all benchmark entries for an edition.
 */
export async function getBenchmarksByEdition(editionId: string) {
  return prisma.gmiBenchmarkEntry.findMany({
    where: { editionId },
    orderBy: { createdAt: "desc" },
  });
}
