/**
 * lib/product/decision-loss-register.ts — Decision Loss Register.
 *
 * Tracks value that has been permanently lost due to delayed or
 * failed decision execution. Unlike cost-of-inaction (which projects
 * accumulating cost), the loss register records realised, irreversible
 * losses — opportunities that closed, positions that deteriorated
 * beyond recovery, or consequences that materialised.
 *
 * Sources: outcome verification records, execution failure events,
 * cost-of-delay projections that passed their window.
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type DecisionLossCategory =
  | "OPPORTUNITY_CLOSED"
  | "POSITION_DETERIORATED"
  | "CONSEQUENCE_MATERIALISED"
  | "AUTHORITY_LOST"
  | "TRUST_ERODED"
  | "OPTION_EXPIRED";

export type DecisionLossEntry = {
  id: string;
  caseId: string;
  decisionText: string;
  category: DecisionLossCategory;
  description: string;
  estimatedValue?: number | null;
  currency?: string;
  occurredAt: string;
  evidenceBasis: string;
  reversible: boolean;
};

export type DecisionLossRegister = {
  entries: DecisionLossEntry[];
  totalEstimatedLoss: number;
  currency: string;
  unreversibleCount: number;
  mostRecentLoss?: DecisionLossEntry | null;
  summary: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// ASSEMBLY
// ─────────────────────────────────────────────────────────────────────────────

export type DecisionLossInput = {
  caseId: string;
  decisionText: string;
  category: DecisionLossCategory;
  description: string;
  estimatedValue?: number | null;
  occurredAt: string;
  evidenceBasis: string;
  reversible?: boolean;
};

/**
 * Assemble a Decision Loss Register from recorded loss entries.
 * Does not invent losses — only assembles from provided evidence.
 */
export function assembleDecisionLossRegister(
  entries: DecisionLossInput[],
): DecisionLossRegister {
  const processed: DecisionLossEntry[] = entries.map((e, i) => ({
    id: `loss_${i}_${Date.now().toString(36)}`,
    caseId: e.caseId,
    decisionText: e.decisionText,
    category: e.category,
    description: e.description,
    estimatedValue: e.estimatedValue ?? null,
    currency: "GBP",
    occurredAt: e.occurredAt,
    evidenceBasis: e.evidenceBasis,
    reversible: e.reversible ?? false,
  }));

  const totalEstimatedLoss = processed.reduce(
    (sum, e) => sum + (e.estimatedValue ?? 0),
    0,
  );

  const unreversibleCount = processed.filter((e) => !e.reversible).length;
  const sorted = [...processed].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );

  return {
    entries: processed,
    totalEstimatedLoss,
    currency: "GBP",
    unreversibleCount,
    mostRecentLoss: sorted[0] ?? null,
    summary: processed.length === 0
      ? "No decision losses recorded."
      : `${processed.length} decision loss${processed.length !== 1 ? "es" : ""} recorded. ${unreversibleCount} irreversible. Estimated total: £${totalEstimatedLoss.toLocaleString()}.`,
  };
}
