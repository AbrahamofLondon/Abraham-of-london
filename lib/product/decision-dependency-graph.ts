/**
 * lib/product/decision-dependency-graph.ts — Decision Dependency Graph contract.
 *
 * Tracks relationships between decisions — where one decision cannot
 * proceed until another is resolved, or where resolution of one decision
 * affects the viability of another.
 *
 * Sources: canonical decision objects, constraint text, stakeholder text,
 * execution records, Living Case evidence nodes.
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type DependencyType =
  | "BLOCKS"
  | "REQUIRES"
  | "INVALIDATES"
  | "ENABLES"
  | "COMPOUNDS";

export type DependencyStatus =
  | "ACTIVE"
  | "RESOLVED"
  | "BROKEN"
  | "UNKNOWN";

export type DecisionDependency = {
  id: string;
  fromDecisionId: string;
  fromDecisionText: string;
  toDecisionId: string;
  toDecisionText: string;
  type: DependencyType;
  status: DependencyStatus;
  description: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  evidenceBasis?: string | null;
};

export type DecisionDependencyGraph = {
  dependencies: DecisionDependency[];
  totalCount: number;
  activeBlockers: number;
  criticalChains: number;
  summary: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// ASSEMBLY
// ─────────────────────────────────────────────────────────────────────────────

export type DecisionDependencyInput = {
  fromDecisionId: string;
  fromDecisionText: string;
  toDecisionId: string;
  toDecisionText: string;
  type: DependencyType;
  status?: DependencyStatus;
  description: string;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  evidenceBasis?: string | null;
};

/**
 * Assemble a Decision Dependency Graph from provided dependency entries.
 * Does not invent dependencies — only assembles from evidence.
 */
export function assembleDecisionDependencyGraph(
  inputs: DecisionDependencyInput[],
): DecisionDependencyGraph {
  const dependencies: DecisionDependency[] = inputs.map((d, i) => ({
    id: `dep_${i}_${Date.now().toString(36)}`,
    ...d,
    status: d.status ?? "ACTIVE",
    severity: d.severity ?? "MEDIUM",
  }));

  const activeBlockers = dependencies.filter(
    (d) => d.status === "ACTIVE" && d.type === "BLOCKS",
  ).length;

  const criticalChains = dependencies.filter(
    (d) => d.severity === "CRITICAL" && d.status === "ACTIVE",
  ).length;

  return {
    dependencies,
    totalCount: dependencies.length,
    activeBlockers,
    criticalChains,
    summary: dependencies.length === 0
      ? "No decision dependencies recorded."
      : `${dependencies.length} decision dependenc${dependencies.length !== 1 ? "ies" : "y"} tracked. ${activeBlockers} active blocker${activeBlockers !== 1 ? "s" : ""}. ${criticalChains} critical chain${criticalChains !== 1 ? "s" : ""}.`,
  };
}
