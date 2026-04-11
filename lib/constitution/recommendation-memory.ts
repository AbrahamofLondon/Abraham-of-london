import crypto from "crypto";
import type { AdvisoryRecommendation } from "./advisory-types";
import type { RecommendationMemoryRecord, RecommendationOutcome } from "./memory-types";
import { listRecommendationMemory, saveRecommendationMemory } from "./memory-store";

export function recordRecommendations(input: {
  caseKey: string;
  recommendations: AdvisoryRecommendation[];
}): RecommendationMemoryRecord[] {
  const now = new Date().toISOString();

  return input.recommendations.map((rec) =>
    saveRecommendationMemory({
      id: crypto.randomUUID(),
      caseKey: input.caseKey,
      recommendationId: rec.id,
      title: rec.title,
      actionType: rec.actionType,
      createdAt: now,
      outcome: "UNKNOWN",
    }),
  );
}

export function reviewRecommendationOutcome(input: {
  caseKey: string;
  recommendationId: string;
  outcome: RecommendationOutcome;
  outcomeNotes?: string;
}): RecommendationMemoryRecord | null {
  const existing = listRecommendationMemory(input.caseKey).find(
    (x) => x.recommendationId === input.recommendationId,
  );

  if (!existing) return null;

  return saveRecommendationMemory({
    ...existing,
    lastReviewedAt: new Date().toISOString(),
    outcome: input.outcome,
    outcomeNotes: input.outcomeNotes,
  });
}