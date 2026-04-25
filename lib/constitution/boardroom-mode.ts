/**
 * Boardroom Mode — decision dossier that survives CFO scrutiny,
 * board challenge, and political resistance.
 *
 * Answers: "Why this, why now, and what happens if we don't?"
 *
 * Activation: cost >= £5k, accuracy YES/PARTIAL, or explicit request.
 * Below threshold: "This is not a board-level issue."
 */

import type { IntelligenceSpine } from "@/lib/decision/intelligence-spine";
import type { CohortMetrics } from "@/lib/proof/social-proof-engine";
import { getProofStatements } from "@/lib/proof/social-proof-engine";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type BoardroomSection = {
  id: string;
  label: string;
  content: string;
  tone: "factual" | "confrontational" | "quantified";
};

export type BoardroomDossier = {
  title: string;
  classification: "BOARD_RESTRICTED";
  generatedAt: string;
  qualifiedForBoard: boolean;
  gateMessage: string | null;
  sections: BoardroomSection[];
  objectionHandling: Array<{ objection: string; response: string }>;
  decisionPath: Array<{ option: string; consequence: string; recommended: boolean }>;
};

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVATION GATE
// ─────────────────────────────────────────────────────────────────────────────

export function qualifiesForBoardroom(spine: IntelligenceSpine): { qualified: boolean; reason: string } {
  const cost = spine.economics?.estimatedMonthlyCost ?? 0;
  const accuracy = spine.accuracyFeedback?.response;

  if (cost >= 5000 && (accuracy === "yes" || accuracy === "partial")) {
    return { qualified: true, reason: `Cost >= £5k/month with confirmed accuracy` };
  }
  if (cost >= 20000) {
    return { qualified: true, reason: `Cost >= £20k/month — board-level by default` };
  }

  return { qualified: false, reason: "This is not a board-level issue. Resolve operationally." };
}

// ─────────────────────────────────────────────────────────────────────────────
// DOSSIER GENERATION
// ─────────────────────────────────────────────────────────────────────────────

export function generateBoardroomDossier(
  spine: IntelligenceSpine,
  cohortData?: CohortMetrics[],
): BoardroomDossier {
  const gate = qualifiesForBoardroom(spine);

  if (!gate.qualified) {
    return {
      title: "Boardroom Mode — Not Qualified",
      classification: "BOARD_RESTRICTED",
      generatedAt: new Date().toISOString(),
      qualifiedForBoard: false,
      gateMessage: gate.reason,
      sections: [],
      objectionHandling: [],
      decisionPath: [],
    };
  }

  const cost = spine.economics?.estimatedMonthlyCost ?? 0;
  const condition = spine.deterministic.conditionClass;
  const sections: BoardroomSection[] = [];

  // 1. Decision Statement
  sections.push({
    id: "decision",
    label: "Decision Statement",
    content: `The organisation is currently experiencing a ${condition} condition, driven by a structural contradiction in decision ownership, resulting in £${cost.toLocaleString()}/month exposure.`,
    tone: "factual",
  });

  // 2. Contradiction
  const contradiction = spine.synthesis?.primaryContradiction ?? spine.deterministic.contradictionSet[0];
  if (contradiction) {
    sections.push({
      id: "contradiction",
      label: "Structural Contradiction",
      content: `Stated position: "${spine.case.blocker ?? "position not articulated"}". Operational reality: "${spine.case.forcedAction ?? "forced action not stated"}". This mismatch is the source of drift.`,
      tone: "confrontational",
    });
  }

  // 3. Cost of Delay
  sections.push({
    id: "cost",
    label: "Cost of Delay",
    content: [
      `Monthly cost: £${cost.toLocaleString()}`,
      `90-day projection: £${(cost * 3).toLocaleString()}`,
      `Option decay: ${Math.round((spine.forecast?.optionDecayRate ?? 0.3) * 100)}% per month`,
      `Control shift risk: ${spine.forecast?.structuralRiskShift ?? "accelerating"}`,
    ].join("\n"),
    tone: "quantified",
  });

  // 4. Failure Pattern
  const patterns: Record<string, string> = {
    authority: "Authority unclear — no single owner can make this decision without escalation",
    execution: "Execution avoided — the decision is understood but repeatedly deferred",
    definition: "Definition unstable — stakeholders execute against different interpretations",
    instability: "Instability under pressure — untested assumptions will fail under real load",
  };
  sections.push({
    id: "failure_pattern",
    label: "Failure Pattern",
    content: patterns[condition] ?? "Structural condition detected",
    tone: "factual",
  });

  // 5. Decision Owner
  const owner = spine.case.claimedOwner ?? "not identified";
  const falseAuth = spine.flags?.falseAuthority;
  sections.push({
    id: "owner",
    label: "Decision Owner",
    content: falseAuth
      ? `Stated owner: ${owner}. Assessment: the stated owner does not hold effective authority. The current structure permits this decision to persist without accountability.`
      : `Effective decision owner: ${owner}.`,
    tone: falseAuth ? "confrontational" : "factual",
  });

  // 6. Required Action
  if (spine.synthesis?.concreteMove) {
    sections.push({
      id: "action",
      label: "Required Action",
      content: `Within 72 hours: ${spine.synthesis.concreteMove}`,
      tone: "confrontational",
    });
  }

  // 7. Consequence of Inaction
  sections.push({
    id: "consequence",
    label: "Consequence of Inaction",
    content: `If no action is taken: cost continues at £${cost.toLocaleString()}/month. Probability of resolution decreases. Control shifts to ${condition === "authority" ? "informal authority" : "external conditions"}.`,
    tone: "quantified",
  });

  // 8. Proof Layer
  if (cohortData && cohortData.length > 0) {
    const proofs = getProofStatements(spine, cohortData);
    if (proofs.length > 0) {
      sections.push({
        id: "proof",
        label: "Comparative Evidence",
        content: proofs.map((p) => p.text).join(" "),
        tone: "factual",
      });
    }
  }

  // 9. Certainty Boundary
  sections.push({
    id: "boundary",
    label: "Certainty Boundary",
    content: "This analysis is based on observed decision patterns and respondent-stated data. It does not model external unknowns beyond the current structure.",
    tone: "factual",
  });

  // Objection handling
  const objections = [
    { objection: "We need more data.", response: "Additional data does not resolve structural contradictions. The contradiction is already evidenced." },
    { objection: "This is not urgent.", response: `Delay is currently costing £${cost.toLocaleString()}/month. Further delay must justify that cost.` },
    { objection: "Who authorised this analysis?", response: "The respondent initiated this assessment voluntarily. The output reflects their stated inputs." },
  ];

  // Decision path
  const decisionPath = [
    { option: "Act now", consequence: "Resolve within current cost window. Highest probability of structural change.", recommended: true },
    { option: "Delay 30 days", consequence: `Additional cost: £${cost.toLocaleString()}. Options narrow. Control may shift.`, recommended: false },
    { option: "Accept current state", consequence: `£${(cost * 12).toLocaleString()}/year continues. Pattern embeds as normal.`, recommended: false },
  ];

  return {
    title: `Board Decision Dossier — ${condition.toUpperCase()} condition`,
    classification: "BOARD_RESTRICTED",
    generatedAt: new Date().toISOString(),
    qualifiedForBoard: true,
    gateMessage: null,
    sections,
    objectionHandling: objections,
    decisionPath,
  };
}
