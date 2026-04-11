import crypto from "crypto";
import type { ConstitutionalDecision } from "./rules";
import type { InstitutionalMemoryRecord } from "./memory-types";
import { upsertCaseMemory } from "./memory-store";

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

export function updateCaseMemory(input: {
  caseKey: string;
  operatorKey: string;
  decision: ConstitutionalDecision;
  readinessScore: number;
  seriousness: number;
  trajectory: string;
  warnings?: string[];
  tags?: string[];
}): InstitutionalMemoryRecord {
  const now = new Date().toISOString();

  return upsertCaseMemory(input.caseKey, (existing) => {
    const route = input.decision.route;

    return {
      id: existing?.id ?? crypto.randomUUID(),
      caseKey: input.caseKey,
      operatorKey: input.operatorKey,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,

      latestRoute: route,
      latestConfidence: input.decision.confidence,
      latestReadinessScore: input.readinessScore,
      latestSeriousness: input.seriousness,
      latestTrajectory: input.trajectory,

      submissionCount: (existing?.submissionCount ?? 0) + 1,
      escalationCount:
        (existing?.escalationCount ?? 0) + (route === "STRATEGY" ? 1 : 0),
      diagnosticCount:
        (existing?.diagnosticCount ?? 0) + (route === "DIAGNOSTIC" ? 1 : 0),
      rejectionCount:
        (existing?.rejectionCount ?? 0) + (route === "REJECT" ? 1 : 0),

      outcomeStatus: existing?.outcomeStatus ?? "OPEN",
      warnings: unique([...(existing?.warnings ?? []), ...(input.warnings ?? [])]),
      tags: unique([...(existing?.tags ?? []), ...(input.tags ?? [])]),
    };
  });
}