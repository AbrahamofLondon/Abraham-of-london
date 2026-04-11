import crypto from "crypto";
import { listCaseMemories, listRecommendationMemory } from "./memory-store";
import { saveDriftFlag } from "./observability-store";
import type {
  ConstitutionalDriftFlag,
  ConstitutionalSeverity,
  DriftCategory,
} from "./observability-types";

function severityFor(score: number): ConstitutionalSeverity {
  if (score >= 90) return "CRITICAL";
  if (score >= 70) return "BREACH";
  if (score >= 45) return "WARNING";
  if (score >= 20) return "NOTICE";
  return "INFO";
}

function makeFlag(input: {
  category: DriftCategory;
  score: number;
  title: string;
  detail: string;
  affectedCaseKeys?: string[];
  metadata?: Record<string, unknown>;
}): ConstitutionalDriftFlag {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    category: input.category,
    severity: severityFor(input.score),
    title: input.title,
    detail: input.detail,
    affectedCaseKeys: input.affectedCaseKeys ?? [],
    metadata: input.metadata,
  };
}

export function detectSystemDrift(): ConstitutionalDriftFlag[] {
  const cases = listCaseMemories();
  const flags: ConstitutionalDriftFlag[] = [];

  if (!cases.length) return [];

  const total = cases.length;
  const escalations = cases.filter((x) => x.latestRoute === "STRATEGY");
  const diagnostics = cases.filter((x) => x.latestRoute === "DIAGNOSTIC");
  const rejections = cases.filter((x) => x.latestRoute === "REJECT");

  const escalationRate = escalations.length / total;
  const diagnosticRate = diagnostics.length / total;
  const rejectionRate = rejections.length / total;

  if (escalationRate > 0.45) {
    flags.push(
      makeFlag({
        category: "OVER_ESCALATION",
        score: 78,
        title: "Escalation rate exceeds constitutional comfort band",
        detail:
          "Too many cases are reaching STRATEGY. The gate may be overselling readiness or under-enforcing constitutional brakes.",
        affectedCaseKeys: escalations.slice(0, 12).map((x) => x.caseKey),
        metadata: { escalationRate, totalCases: total },
      }),
    );
  }

  if (diagnosticRate < 0.15) {
    flags.push(
      makeFlag({
        category: "WEAK_DIAGNOSTIC_HOLDING",
        score: 62,
        title: "Diagnostic holding layer appears underused",
        detail:
          "The estate may be skipping the proper middle layer and forcing premature binary outcomes.",
        affectedCaseKeys: cases.slice(0, 12).map((x) => x.caseKey),
        metadata: { diagnosticRate, totalCases: total },
      }),
    );
  }

  if (rejectionRate > 0.55) {
    flags.push(
      makeFlag({
        category: "UNDER_ESCALATION",
        score: 67,
        title: "Rejection density suggests constitutional harshness",
        detail:
          "The estate may be blocking too aggressively, reducing healthy conversion and suppressing valid cases.",
        affectedCaseKeys: rejections.slice(0, 12).map((x) => x.caseKey),
        metadata: { rejectionRate, totalCases: total },
      }),
    );
  }

  const repeatedWeak = cases.filter(
    (x) => x.rejectionCount >= 3 && x.latestRoute === "REJECT",
  );
  if (repeatedWeak.length > 0) {
    flags.push(
      makeFlag({
        category: "OPERATOR_GAMING",
        score: repeatedWeak.length >= 5 ? 71 : 48,
        title: "Repeated weak-signal operator behaviour detected",
        detail:
          "Some operators appear to be repeatedly testing the gate without improving signal quality.",
        affectedCaseKeys: repeatedWeak.map((x) => x.caseKey),
        metadata: { repeatedWeakCount: repeatedWeak.length },
      }),
    );
  }

  const allRecs = cases.flatMap((x) => listRecommendationMemory(x.caseKey));
  const reviewed = allRecs.filter((x) => x.outcome !== "UNKNOWN");
  const failed = reviewed.filter(
    (x) => x.outcome === "FAILED" || x.outcome === "IGNORED",
  );

  if (reviewed.length >= 8 && failed.length / reviewed.length > 0.5) {
    flags.push(
      makeFlag({
        category: "RECOMMENDATION_DECAY",
        score: 74,
        title: "Recommendation layer is showing efficacy decay",
        detail:
          "Too many reviewed recommendations are being ignored or failing in downstream use.",
        metadata: {
          reviewedCount: reviewed.length,
          failedCount: failed.length,
        },
      }),
    );
  }

  return flags.map(saveDriftFlag);
}