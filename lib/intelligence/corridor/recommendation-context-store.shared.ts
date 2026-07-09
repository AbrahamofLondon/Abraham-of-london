import crypto from "node:crypto";

export type CorridorAccessMode = "free" | "self_serve" | "controlled" | "manual_billing" | "unavailable" | "none";

export interface RecommendationContextInput {
  recommendationId: string;
  sessionId: string;
  sessionVersion?: number;
  pressureBand: string;
  targetProductCode: string;
  targetLabel: string;
  targetRoute: string;
  accessMode: CorridorAccessMode;
  whyAdmissible: string;
  evidenceBasis: string[];
  established: string[];
  unresolved: {
    contradiction: string | null;
    evidenceGap: string | null;
    ownershipGap: string | null;
    timingPressure: string | null;
    unresolvedCommitment: string | null;
  };
  notYetAppropriate: string | null;
  carryForward: string[];
  stateHash?: string;
}

export interface RecommendationContextRecord extends RecommendationContextInput {
  contextId: string;
  createdAt: string;
  updatedAt: string;
  stateHash: string;
}

export function newRecommendationContextId(): string { return `ctx_${crypto.randomBytes(10).toString("hex")}`; }

export function hashRecommendationState(input: RecommendationContextInput): string {
  return crypto.createHash("sha256").update(JSON.stringify({
    recommendationId: input.recommendationId,
    sessionId: input.sessionId,
    sessionVersion: input.sessionVersion ?? 1,
    pressureBand: input.pressureBand,
    targetProductCode: input.targetProductCode,
    accessMode: input.accessMode,
    evidenceBasis: input.evidenceBasis,
    unresolved: input.unresolved,
  })).digest("hex");
}

export function isRecommendationContextStale(record: RecommendationContextRecord, now = new Date(), maxAgeMs = 24 * 60 * 60 * 1000): boolean {
  const updated = Date.parse(record.updatedAt);
  return !Number.isFinite(updated) || now.getTime() - updated > maxAgeMs;
}
