/**
 * lib/diagnostics/consistency-check.ts — Diagnostic consistency guardrail
 *
 * Validates that thread state, decision directive, and narrative
 * do not contradict each other. Logs issues but does not crash the product.
 */

import type { TensionThread } from "./tension-thread";
import type { DecisionDirective } from "./decision-authority";

type ConsistencyInput = {
  thread: TensionThread;
  directive: DecisionDirective;
  narrative: string | null;
};

type ConsistencyResult = {
  ok: boolean;
  issues: string[];
};

/**
 * Validate that the diagnostic system is not contradicting itself.
 * Returns issues found. An empty issues array means consistent.
 */
export function validateDiagnosticConsistency(
  input: ConsistencyInput,
): ConsistencyResult {
  const { thread, directive, narrative } = input;
  const issues: string[] = [];

  // 1. Block directive must not coexist with soft/encouraging narrative
  if (directive.level === "block" && narrative) {
    const softPatterns = [
      "may resolve",
      "early signal",
      "not yet severe",
      "proceeding normally",
      "allowing continuation",
    ];
    for (const pattern of softPatterns) {
      if (narrative.toLowerCase().includes(pattern)) {
        issues.push(
          `CONTRADICTION: directive is "block" but narrative contains soft language: "${pattern}"`,
        );
      }
    }
  }

  // 2. Warn directive should not appear when escalation is intervention_required
  //    and dominant tensions clearly justify restriction
  if (
    directive.level === "warn" &&
    thread.escalationLevel === "intervention_required"
  ) {
    issues.push(
      `UNDERREACTION: escalation is "intervention_required" but directive is only "warn". Expected "restrict" or "block".`,
    );
  }

  // 3. Allow directive should not appear with high-severity tensions
  if (
    directive.level === "allow" &&
    thread.tensions.some(t => t.severity === "high")
  ) {
    issues.push(
      `PERMISSIVE: directive is "allow" but thread contains high-severity tensions.`,
    );
  }

  // 4. Narrative should not ignore dominant trust-linked tensions
  //    when they exist and directive acknowledges risk
  if (
    thread.dominantPatterns.includes("trust_asymmetry") &&
    directive.level !== "allow" &&
    narrative &&
    !narrative.toLowerCase().includes("trust")
  ) {
    issues.push(
      `OMISSION: trust_asymmetry is a dominant pattern but narrative does not mention trust.`,
    );
  }

  // 5. Thread with 3+ severe patterns should not produce casual next-step
  const severeCount = thread.tensions.filter(
    t => t.severity === "high" || t.severity === "medium",
  ).length;
  if (severeCount >= 3 && directive.level === "allow") {
    issues.push(
      `PERMISSIVE: ${severeCount} medium/high signals exist but directive is "allow".`,
    );
  }

  // Log issues in development
  if (issues.length > 0 && typeof console !== "undefined") {
    console.warn("[DIAGNOSTIC_CONSISTENCY]", issues);
  }

  return { ok: issues.length === 0, issues };
}
