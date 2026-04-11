/* lib/constitution/rule-mutation-engine.ts — V1.2 (Production Grade) */
import { listTribunalCases } from "./observability-store";

export type Mutation = {
  key: string;
  value: number | string | boolean;
  reason: string;
  timestamp: string;
  appliedBy?: string;
};

// Use global to preserve mutations across hot-reloads in Next.js development
const activeMutations: Record<string, Mutation> = {};

/**
 * Get a specific mutation by key
 */
export function getMutation(key: string): Mutation | null {
  return activeMutations[key] ?? null;
}

/**
 * Get all active mutations
 */
export function getAllMutations(): Mutation[] {
  return Object.values(activeMutations);
}

/**
 * Apply a mutation (idempotent)
 */
export function applyMutation(m: Omit<Mutation, "timestamp"> & { timestamp?: string }): void {
  const mutation: Mutation = {
    ...m,
    timestamp: m.timestamp || new Date().toISOString(),
    appliedBy: m.appliedBy || "rule-mutation-engine",
  };

  activeMutations[m.key] = mutation;
  console.log(`[Rule Mutation Applied] ${m.key} = ${m.value} | ${m.reason}`);
}

/**
 * Core mutation engine — analyzes tribunal cases and applies corrective weights
 */
export function runRuleMutationEngine(): void {
  try {
    const tribunals = listTribunalCases();
    const failureCounts: Record<string, number> = {};

    // 1. Aggregate failure patterns from tribunal findings
    for (const tribunal of tribunals) {
      if (!tribunal.findings) continue;
      
      for (const finding of tribunal.findings) {
        const key = finding.title?.toLowerCase().trim() || "unknown";
        failureCounts[key] = (failureCounts[key] || 0) + 1;
      }
    }

    // 2. Threshold Analysis (Trigger point: 5 recurrences)
    Object.entries(failureCounts).forEach(([failureKey, count]) => {
      if (count < 5) return;

      // Logic Mapping: Failure Keyword -> Strategic Mutation
      if (failureKey.includes("clarity") || failureKey.includes("vague")) {
        applyMutation({
          key: "CLARITY_MIN",
          value: 72,
          reason: `Detected ${count} instances of weak clarity.`,
        });
      }

      if (failureKey.includes("authority") || failureKey.includes("misclassification")) {
        applyMutation({
          key: "AUTHORITY_STRICTNESS",
          value: 1.25,
          reason: `Repeated authority drift detected (${count} cases).`,
        });
      }

      if (failureKey.includes("readiness") || failureKey.includes("premature")) {
        applyMutation({
          key: "READINESS_FLOOR",
          value: 68,
          reason: "Raising the floor for premature readiness signals.",
        });
      }

      if (failureKey.includes("narrative") || failureKey.includes("integrity")) {
        applyMutation({
          key: "NARRATIVE_INTEGRITY_WEIGHT",
          value: 1.35,
          reason: "Increasing scoring weight for narrative integrity.",
        });
      }
    });

    console.log(`[Rule Mutation Engine] Cycle Complete. Active Mutations: ${Object.keys(activeMutations).length}`);
  } catch (error) {
    console.error("[Rule Mutation Engine] Critical Failure:", error);
  }
}

/**
 * Reset all mutations
 */
export function resetMutations(): void {
  Object.keys(activeMutations).forEach((key) => delete activeMutations[key]);
  console.log("[Rule Mutation Engine] All mutations purged.");
}

// Side-effect: Bootstrap the engine in server-side contexts
if (typeof window === "undefined") {
  runRuleMutationEngine();
}

const engine = {
  getMutation,
  getAllMutations,
  applyMutation,
  runRuleMutationEngine,
  resetMutations,
};

export default engine;