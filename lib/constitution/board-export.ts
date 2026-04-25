/**
 * Board Export Mode — output that survives scrutiny from people
 * who didn't take the assessment.
 *
 * Removes interpretation language. Shows:
 * contradiction, evidence chain, cost, decision owner, action required.
 *
 * Tone: "The current structure permits this failure without ownership."
 */

import type { IntelligenceSpine } from "@/lib/decision/intelligence-spine";
import type { EvidenceLedger } from "./evidence-ledger";

export type BoardExportSection = {
  label: string;
  content: string;
};

export type BoardExport = {
  title: string;
  generatedAt: string;
  sections: BoardExportSection[];
  classification: "CONFIDENTIAL" | "RESTRICTED" | "INTERNAL";
};

/**
 * Generate board-grade export from spine + ledger.
 * No soft language. No interpretation. Evidence and structure only.
 */
export function generateBoardExport(
  spine: IntelligenceSpine,
  ledger?: EvidenceLedger,
): BoardExport {
  const sections: BoardExportSection[] = [];

  // 1. Decision Under Review
  sections.push({
    label: "Decision Under Review",
    content: spine.case.decision,
  });

  // 2. Structural Contradiction
  const contradiction = spine.synthesis?.primaryContradiction ?? spine.deterministic.contradictionSet[0];
  if (contradiction) {
    sections.push({
      label: "Structural Contradiction Identified",
      content: contradiction,
    });
  }

  // 3. Decision Ownership
  sections.push({
    label: "Decision Ownership",
    content: spine.case.claimedOwner
      ? spine.flags?.falseAuthority
        ? `Stated owner: ${spine.case.claimedOwner}. System assessment: the stated owner does not hold effective authority over this decision. The current structure permits this decision to remain unresolved without accountability.`
        : `Stated owner: ${spine.case.claimedOwner}. Authority assessment: ${spine.deterministic.conditionClass === "authority" ? "authority is structurally unclear" : "ownership is nominally established"}.`
      : "No decision owner has been identified. The current structure permits this decision to persist without designated accountability.",
  });

  // 4. Blocker Assessment
  if (spine.case.blocker) {
    const bypassable = spine.case.forcedAction ? "The stated blocker can be bypassed — as evidenced by the respondent's own forced-action answer." : "";
    sections.push({
      label: "Stated Blocker",
      content: `${spine.case.blocker}. ${bypassable}`.trim(),
    });
  }

  // 5. Cost Exposure
  const cost = spine.economics?.estimatedMonthlyCost;
  if (cost && cost > 0) {
    sections.push({
      label: "Cost Exposure (Respondent-Stated)",
      content: `Estimated monthly cost: £${cost.toLocaleString()}. Projected 90-day exposure: £${(cost * 3).toLocaleString()}. Annual exposure if unresolved: £${(cost * 12).toLocaleString()}.`,
    });
  }

  // 6. Required Action
  if (spine.synthesis?.concreteMove) {
    sections.push({
      label: "Required Action",
      content: spine.synthesis.concreteMove,
    });
  }

  // 7. Default Path
  if (spine.forecast) {
    sections.push({
      label: "Default Path If No Action Taken",
      content: `30 days: ${spine.forecast.thirtyDays} 90 days: ${spine.forecast.ninetyDays}`,
    });
  }

  // 8. Execution Status
  if (spine.execution) {
    const status = spine.execution.actionTaken
      ? `Action taken${spine.execution.verifiedImpact ? ` — verified impact: ${spine.execution.verifiedImpact}` : ""}.`
      : spine.execution.breach
        ? `Committed action was not executed. Breach count: ${spine.execution.breachCount ?? 1}.`
        : "Execution status: pending.";
    sections.push({ label: "Execution Status", content: status });
  }

  // 9. System Confidence
  sections.push({
    label: "System Confidence",
    content: `C3 specificity: ${(spine.c3.specificityScore * 100).toFixed(0)}% (${spine.c3.confidenceBand}). Integrity score: ${((spine.integrityScore ?? 1) * 100).toFixed(0)}%. Condition class: ${spine.deterministic.conditionClass}.`,
  });

  // 10. Evidence Trail
  if (ledger && ledger.entries.length > 0) {
    sections.push({
      label: "Evidence Trail",
      content: ledger.entries.map((e) =>
        `${e.stage} (${new Date(e.timestamp).toLocaleDateString()}): pressure=${e.pressureIndex}, integrity=${(e.integrityScore * 100).toFixed(0)}%${e.actionTaken ? " — action taken" : e.verifiedImpact === "no_change" ? " — no change" : ""}`,
      ).join(". "),
    });
  }

  return {
    title: `Board Decision Brief — ${spine.deterministic.conditionClass.toUpperCase()} condition`,
    generatedAt: new Date().toISOString(),
    sections,
    classification: "RESTRICTED",
  };
}
