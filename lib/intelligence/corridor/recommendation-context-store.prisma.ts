import { prisma } from "@/lib/prisma";
import {
  hashRecommendationState,
  newRecommendationContextId,
  isRecommendationContextStale,
  type RecommendationContextInput,
  type RecommendationContextRecord,
  type CorridorAccessMode,
} from "./recommendation-context-store.shared";

export { isRecommendationContextStale };
export type { RecommendationContextInput, RecommendationContextRecord, CorridorAccessMode };

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : [];
}

function toRecord(row: {
  recommendationId: string; contextId: string; sessionId: string; sessionVersion: number; pressureBand: string; targetProductCode: string;
  targetLabel: string; targetRoute: string; accessMode: string; whyAdmissible: string; evidenceBasisJson: unknown; establishedJson: unknown;
  unresolvedJson: unknown; notYetAppropriate: string | null; carryForwardJson: unknown; stateHash: string; createdAt: Date; updatedAt: Date;
}): RecommendationContextRecord {
  return {
    recommendationId: row.recommendationId,
    contextId: row.contextId,
    sessionId: row.sessionId,
    sessionVersion: row.sessionVersion,
    pressureBand: row.pressureBand,
    targetProductCode: row.targetProductCode,
    targetLabel: row.targetLabel,
    targetRoute: row.targetRoute,
    accessMode: row.accessMode as CorridorAccessMode,
    whyAdmissible: row.whyAdmissible,
    evidenceBasis: asStringArray(row.evidenceBasisJson),
    established: asStringArray(row.establishedJson),
    unresolved: row.unresolvedJson as RecommendationContextRecord["unresolved"],
    notYetAppropriate: row.notYetAppropriate,
    carryForward: asStringArray(row.carryForwardJson),
    stateHash: row.stateHash,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function saveRecommendationContext(input: RecommendationContextInput, now = new Date().toISOString()): Promise<RecommendationContextRecord> {
  if (!/^rec_[A-Za-z0-9_-]{6,}$/.test(input.recommendationId)) throw new Error("Invalid recommendation id");
  if (!input.sessionId || input.sessionId.length > 96) throw new Error("Invalid session id");
  const existing = await prisma.corridorRecommendationContext.findUnique({ where: { recommendationId: input.recommendationId } });
  const stateHash = input.stateHash ?? hashRecommendationState(input);
  const row = await prisma.corridorRecommendationContext.upsert({
    where: { recommendationId: input.recommendationId },
    create: {
      recommendationId: input.recommendationId,
      contextId: newRecommendationContextId(),
      sessionId: input.sessionId,
      sessionVersion: input.sessionVersion ?? 1,
      pressureBand: input.pressureBand,
      targetProductCode: input.targetProductCode,
      targetLabel: input.targetLabel,
      targetRoute: input.targetRoute,
      accessMode: input.accessMode,
      whyAdmissible: input.whyAdmissible,
      evidenceBasisJson: input.evidenceBasis.slice(0, 8),
      establishedJson: input.established.slice(0, 8),
      unresolvedJson: input.unresolved,
      notYetAppropriate: input.notYetAppropriate,
      carryForwardJson: input.carryForward.slice(0, 8),
      stateHash,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    },
    update: {
      contextId: existing?.contextId ?? newRecommendationContextId(),
      sessionId: input.sessionId,
      sessionVersion: input.sessionVersion ?? 1,
      pressureBand: input.pressureBand,
      targetProductCode: input.targetProductCode,
      targetLabel: input.targetLabel,
      targetRoute: input.targetRoute,
      accessMode: input.accessMode,
      whyAdmissible: input.whyAdmissible,
      evidenceBasisJson: input.evidenceBasis.slice(0, 8),
      establishedJson: input.established.slice(0, 8),
      unresolvedJson: input.unresolved,
      notYetAppropriate: input.notYetAppropriate,
      carryForwardJson: input.carryForward.slice(0, 8),
      stateHash,
      updatedAt: new Date(now),
    },
  });
  return toRecord(row);
}

export async function getRecommendationContext(recommendationId: string): Promise<RecommendationContextRecord | null> {
  const row = await prisma.corridorRecommendationContext.findUnique({ where: { recommendationId } });
  return row ? toRecord(row) : null;
}

export async function listRecommendationContextsForSession(sessionId: string): Promise<RecommendationContextRecord[]> {
  const rows = await prisma.corridorRecommendationContext.findMany({ where: { sessionId }, orderBy: { updatedAt: "desc" } });
  return rows.map(toRecord);
}
