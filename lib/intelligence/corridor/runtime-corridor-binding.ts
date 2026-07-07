/**
 * lib/intelligence/corridor/runtime-corridor-binding.ts
 *
 * §10 — Runtime corridor binding.
 *
 * Records corridor recommendations as runtime interactions.
 * When a recommendation is generated, persist: recommendation ID, tenant, case,
 * twin version, recommendation target, evidence basis, governance result,
 * commercial action, generatedAt.
 *
 * When customer acts: viewed, accepted, declined, deferred, qualification started, completed.
 *
 * A recommendation is a system action, not evidence that the customer adopted it.
 */
import type { CorridorMap, CorridorMove } from "./customer-corridor-map";

export interface RecommendationRecord {
  recommendationId: string;
  tenantId: string;
  caseId: string;
  twinVersion: number;
  targetProductCode: string;
  evidenceBasis: string[];
  governanceResult: string;
  commercialAction: string;
  generatedAt: string;
  customerActions: Array<{
    actionType: "viewed" | "accepted" | "declined" | "deferred" | "qualification_started" | "completed";
    occurredAt: string;
  }>;
}

const recommendations = new Map<string, RecommendationRecord>();

export function recordRecommendation(map: CorridorMap, tenantId: string, caseId: string): RecommendationRecord[] {
  const records: RecommendationRecord[] = [];
  const now = new Date().toISOString();

  for (const move of map.admissibleNextMoves) {
    const rec: RecommendationRecord = {
      recommendationId: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      tenantId,
      caseId,
      twinVersion: map.twinVersion,
      targetProductCode: move.productCode,
      evidenceBasis: move.evidenceBasis,
      governanceResult: move.isAdmissible ? "admissible" : "blocked",
      commercialAction: move.accessMode,
      generatedAt: now,
      customerActions: [],
    };
    recommendations.set(rec.recommendationId, rec);
    records.push(rec);
  }
  return records;
}

export function recordCustomerAction(recommendationId: string, actionType: RecommendationRecord["customerActions"][0]["actionType"]): boolean {
  const rec = recommendations.get(recommendationId);
  if (!rec) return false;
  rec.customerActions.push({ actionType, occurredAt: new Date().toISOString() });
  return true;
}

export function getRecommendationsForCase(tenantId: string, caseId: string): RecommendationRecord[] {
  return Array.from(recommendations.values()).filter(r => r.tenantId === tenantId && r.caseId === caseId);
}
