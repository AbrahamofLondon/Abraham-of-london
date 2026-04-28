import "server-only";

import { prisma } from "@/lib/prisma";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES — public-safe only
// ─────────────────────────────────────────────────────────────────────────────

export type CreateDecisionMemoryInput = {
  userId?: string;
  organisationId?: string;
  sessionId?: string;
  source: string;
  state: string;
  headline: string;
  summary: string;
  directive: string;
  recommendations: string[];
  publicSignals?: Record<string, unknown>;
  escalationLabel?: string;
  escalationLevel?: string;
};

export type DecisionMemoryTrend = {
  totalDecisions: number;
  dominantState: string;
  repeatedConditions: string[];
  escalationTrend: "stable" | "rising" | "falling" | "insufficient_data";
  executiveSummary: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────────────────────────────────────────

export async function createDecisionMemory(input: CreateDecisionMemoryInput) {
  return prisma.decisionMemory.create({
    data: {
      userId: input.userId ?? null,
      organisationId: input.organisationId ?? null,
      sessionId: input.sessionId ?? null,
      source: input.source,
      state: input.state,
      headline: input.headline,
      summary: input.summary,
      directive: input.directive,
      recommendations: input.recommendations,
      publicSignals: (input.publicSignals ?? undefined) as Parameters<typeof prisma.decisionMemory.create>[0]["data"]["publicSignals"],
      escalationLabel: input.escalationLabel ?? null,
      escalationLevel: input.escalationLevel ?? null,
    },
  });
}

export async function listDecisionMemoryByUser(userId: string) {
  return prisma.decisionMemory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function listDecisionMemoryByOrganisation(organisationId: string) {
  return prisma.decisionMemory.findMany({
    where: { organisationId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// TREND ANALYSIS — public-safe
// ─────────────────────────────────────────────────────────────────────────────

export function summariseDecisionMemoryTrend(
  records: Array<{ state: string; escalationLevel?: string | null; headline: string; createdAt: Date }>,
): DecisionMemoryTrend {
  if (records.length < 2) {
    return {
      totalDecisions: records.length,
      dominantState: records[0]?.state ?? "unknown",
      repeatedConditions: [],
      escalationTrend: "insufficient_data",
      executiveSummary: records.length === 0
        ? "No decision history available."
        : "Single decision recorded. Trend analysis requires at least two decisions.",
    };
  }

  // Dominant state
  const stateCounts = new Map<string, number>();
  for (const r of records) {
    stateCounts.set(r.state, (stateCounts.get(r.state) ?? 0) + 1);
  }
  const dominantState = [...stateCounts.entries()].sort((a, b) => b[1] - a[1])[0]![0];

  // Repeated conditions (headlines appearing 2+ times)
  const headlineCounts = new Map<string, number>();
  for (const r of records) {
    const key = r.headline.toLowerCase().slice(0, 60);
    headlineCounts.set(key, (headlineCounts.get(key) ?? 0) + 1);
  }
  const repeatedConditions = [...headlineCounts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([headline]) => headline);

  // Escalation trend — compare first half to second half
  const mid = Math.floor(records.length / 2);
  const escalationWeight = (level: string | null | undefined): number => {
    if (!level) return 0;
    const l = level.toLowerCase();
    if (l === "critical" || l === "immediate") return 3;
    if (l === "high" || l === "structural") return 2;
    if (l === "moderate" || l === "medium") return 1;
    return 0;
  };

  const recentAvg = records.slice(0, mid).reduce((s, r) => s + escalationWeight(r.escalationLevel), 0) / Math.max(1, mid);
  const olderAvg = records.slice(mid).reduce((s, r) => s + escalationWeight(r.escalationLevel), 0) / Math.max(1, records.length - mid);

  const escalationTrend: DecisionMemoryTrend["escalationTrend"] =
    recentAvg > olderAvg + 0.3 ? "rising" :
    recentAvg < olderAvg - 0.3 ? "falling" : "stable";

  // Executive summary
  const summaryParts: string[] = [];
  summaryParts.push(`${records.length} decisions recorded.`);
  summaryParts.push(`Dominant condition: ${dominantState}.`);
  if (repeatedConditions.length > 0) {
    summaryParts.push(`${repeatedConditions.length} recurring pattern(s) detected.`);
  }
  if (escalationTrend === "rising") {
    summaryParts.push("Escalation severity is increasing across recent decisions.");
  } else if (escalationTrend === "falling") {
    summaryParts.push("Escalation severity has decreased — conditions may be stabilising.");
  }

  return {
    totalDecisions: records.length,
    dominantState,
    repeatedConditions,
    escalationTrend,
    executiveSummary: summaryParts.join(" "),
  };
}
