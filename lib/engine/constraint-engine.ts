/**
 * DecisionConstraintEngine — rule-based blocking that enforces conditions.
 *
 * The system can say: "this decision is invalid under current conditions."
 *
 * Integrates into Strategy Room to prevent execution when:
 * - Active contradictions block the decision
 * - Authority is unclear or contested
 * - Required dependencies are unresolved
 * - Signal confidence is below threshold
 * - AI exposure is HIGH/CRITICAL without leverage action
 *
 * This is the enforcement layer that makes the system non-optional.
 */

import type { ContradictionGraph, DependencyChain } from "./contradiction-graph";
import { mapDependencies, detectActiveConflicts, computeGraphHealth } from "./contradiction-graph";
import type { ConfidenceBasis } from "./signal-confidence";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type ConstraintViolation = {
  rule: string;
  severity: "block" | "warn" | "info";
  message: string;
  /** What must change for this constraint to be satisfied */
  resolution: string;
};

export type ConstraintEvaluation = {
  /** Can this decision proceed? */
  canProceed: boolean;
  /** Violations found */
  violations: ConstraintViolation[];
  /** Blocking violations only */
  blocks: ConstraintViolation[];
  /** Warnings (not blocking but flagged) */
  warnings: ConstraintViolation[];
  /** Overall risk level */
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "BLOCKED";
};

// ─────────────────────────────────────────────────────────────────────────────
// CONSTRAINT RULES
// ─────────────────────────────────────────────────────────────────────────────

type ConstraintContext = {
  graph: ContradictionGraph;
  decisionId: string;
  confidence: ConfidenceBasis;
  authorityType?: string;
  aiExposureLevel?: string;
  aiLeverageAction?: string | null;
};

type ConstraintRule = {
  id: string;
  evaluate: (ctx: ConstraintContext) => ConstraintViolation | null;
};

const RULES: ConstraintRule[] = [
  // Rule 1: Blocking contradictions
  {
    id: "blocking_contradictions",
    evaluate: (ctx) => {
      const conflicts = detectActiveConflicts(ctx.graph);
      const blocking = conflicts.filter((c) => c.blocksDecision);
      if (blocking.length === 0) return null;
      return {
        rule: "blocking_contradictions",
        severity: "block",
        message: `${blocking.length} active contradiction${blocking.length > 1 ? "s" : ""} directly block${blocking.length === 1 ? "s" : ""} this decision.`,
        resolution: `Resolve: ${blocking.map((b) => b.nodeA.label).join(", ")}.`,
      };
    },
  },

  // Rule 2: Unresolved dependencies
  {
    id: "unresolved_dependencies",
    evaluate: (ctx) => {
      const chain = mapDependencies(ctx.graph, ctx.decisionId);
      if (!chain || chain.canProceed) return null;
      const blockers = chain.dependencies.filter((d) => !d.satisfied);
      return {
        rule: "unresolved_dependencies",
        severity: "block",
        message: `${blockers.length} dependency condition${blockers.length > 1 ? "s" : ""} unmet.`,
        resolution: blockers.map((b) => b.blockReason).filter(Boolean).join(" "),
      };
    },
  },

  // Rule 3: Insufficient confidence
  {
    id: "insufficient_confidence",
    evaluate: (ctx) => {
      if (ctx.confidence.sufficient) return null;
      return {
        rule: "insufficient_confidence",
        severity: "warn",
        message: `Signal confidence is ${Math.round(ctx.confidence.confidence * 100)}%. ${ctx.confidence.label}.`,
        resolution: ctx.confidence.strengthenWith[0] ?? "Gather additional evidence before proceeding.",
      };
    },
  },

  // Rule 4: Authority unclear
  {
    id: "authority_unclear",
    evaluate: (ctx) => {
      if (ctx.authorityType !== "UNCLEAR") return null;
      return {
        rule: "authority_unclear",
        severity: "block",
        message: "Authority ownership is unclear. This decision cannot be enforced without a named decision owner.",
        resolution: "Name the person authorised to make this decision. Document what they can decide without further permission.",
      };
    },
  },

  // Rule 5: AI exposure without leverage action
  {
    id: "ai_exposure_unaddressed",
    evaluate: (ctx) => {
      if (!ctx.aiExposureLevel || ctx.aiExposureLevel === "LOW" || ctx.aiExposureLevel === "MODERATE") return null;
      if (ctx.aiLeverageAction) return null;
      return {
        rule: "ai_exposure_unaddressed",
        severity: ctx.aiExposureLevel === "CRITICAL" ? "block" : "warn",
        message: `AI exposure is ${ctx.aiExposureLevel}. No AI leverage action defined.`,
        resolution: "Define an AI leverage action (automate, augment, eliminate, or redesign) before this decision can proceed.",
      };
    },
  },

  // Rule 6: Graph staleness
  {
    id: "stale_evidence",
    evaluate: (ctx) => {
      const health = computeGraphHealth(ctx.graph);
      if (health.staleness < 0.3) return null;
      return {
        rule: "stale_evidence",
        severity: "warn",
        message: `${Math.round(health.staleness * 100)}% of evidence nodes are stale (>30 days old).`,
        resolution: "Refresh the diagnostic. Stale evidence produces unreliable projections.",
      };
    },
  },

  // Rule 7: High severity without enforcement
  {
    id: "high_severity_unforced",
    evaluate: (ctx) => {
      const health = computeGraphHealth(ctx.graph);
      if (health.avgSeverity < 7) return null;
      const decisions = ctx.graph.nodes.filter((n) => n.kind === "decision" && n.status === "active");
      const enforced = decisions.filter((d) => {
        const chain = mapDependencies(ctx.graph, d.id);
        return chain && !chain.canProceed;
      });
      if (enforced.length > 0) return null; // already enforced
      return {
        rule: "high_severity_unforced",
        severity: "warn",
        message: "Average contradiction severity exceeds 7.0. No enforcement mechanism is active.",
        resolution: "Enter Strategy Room to sequence intervention and track execution.",
      };
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// EVALUATION
// ─────────────────────────────────────────────────────────────────────────────

export function evaluateConstraints(ctx: ConstraintContext): ConstraintEvaluation {
  const violations: ConstraintViolation[] = [];

  for (const rule of RULES) {
    const violation = rule.evaluate(ctx);
    if (violation) violations.push(violation);
  }

  const blocks = violations.filter((v) => v.severity === "block");
  const warnings = violations.filter((v) => v.severity === "warn");

  const riskLevel: ConstraintEvaluation["riskLevel"] =
    blocks.length > 0 ? "BLOCKED"
    : warnings.length >= 3 ? "HIGH"
    : warnings.length >= 1 ? "MEDIUM"
    : "LOW";

  return {
    canProceed: blocks.length === 0,
    violations,
    blocks,
    warnings,
    riskLevel,
  };
}
