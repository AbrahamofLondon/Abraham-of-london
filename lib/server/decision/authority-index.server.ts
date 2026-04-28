import "server-only";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES — public-safe interpretive index. No scores, weights, or thresholds.
// ─────────────────────────────────────────────────────────────────────────────

export type DecisionAuthorityIndexInput = {
  state: string;
  escalationRequired?: boolean;
  repeatedConditions?: string[];
  escalationTrend?: string;
};

export type DecisionAuthorityIndexPublic = {
  band: "strong" | "strained" | "weak" | "critical";
  label: string;
  boardMeaning: string;
  nextGovernanceMove: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// ENGINE — interpretive classification, not scoring
// ─────────────────────────────────────────────────────────────────────────────

export function computeAuthorityIndex(input: DecisionAuthorityIndexInput): DecisionAuthorityIndexPublic {
  const state = input.state.toUpperCase();
  const hasRepeatedConditions = (input.repeatedConditions?.length ?? 0) > 0;
  const escalationRising = input.escalationTrend === "rising";

  // Critical: disordered + escalation rising OR repeated conditions
  if (state === "DISORDERED" || (state === "MISALIGNED" && escalationRising && hasRepeatedConditions)) {
    return {
      band: "critical",
      label: "Decision authority has failed",
      boardMeaning: "The governance structure cannot produce or enforce decisions. Board-level intervention is indicated.",
      nextGovernanceMove: "Convene an emergency governance review. Appoint a single decision authority with explicit mandate. Do not delegate further analysis.",
    };
  }

  // Weak: misaligned or disordered-adjacent
  if (state === "MISALIGNED" || (state === "DRIFTING" && hasRepeatedConditions)) {
    return {
      band: "weak",
      label: "Decision authority is structurally compromised",
      boardMeaning: "Decisions are being made but are not holding. Authority exists on paper but not in practice.",
      nextGovernanceMove: "Audit current decision ownership against actual execution. Identify where formal authority is being bypassed. Correct within 30 days.",
    };
  }

  // Strained: drifting
  if (state === "DRIFTING") {
    return {
      band: "strained",
      label: "Decision authority is under pressure",
      boardMeaning: "The governance structure is intact but under strain. Decisions are slower than they should be. Early drift signals are present.",
      nextGovernanceMove: "Tighten the decision cadence. Reduce the number of approvals required for operational decisions. Monitor escalation patterns for 60 days.",
    };
  }

  // Strong: ordered
  return {
    band: "strong",
    label: "Decision authority is functioning",
    boardMeaning: "The governance structure produces and enforces decisions. No structural intervention required at this time.",
    nextGovernanceMove: "Maintain current governance rhythm. Schedule quarterly structural review. Watch for early drift in newly appointed decision owners.",
  };
}
