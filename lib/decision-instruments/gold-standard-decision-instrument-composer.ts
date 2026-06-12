export interface DecisionInstrumentInput {
  productCode: string;
  decisionContext: string;
  evidenceBasis: string[];
  currentConstraint: string;
}

export interface DecisionInstrumentOutput {
  productCode: string;
  decisionState: string;
  mainContradictionOrFriction: string;
  consequenceOfInaction: string;
  decisionPressureLevel: "low" | "medium" | "high" | "critical";
  recommendedNextMove: string;
  reasoningBasis: string[];
  escalationCondition: string;
}

export function composeGoldStandardDecisionInstrument(
  input: DecisionInstrumentInput,
): DecisionInstrumentOutput {
  const hasEvidence = input.evidenceBasis.length > 0;
  return {
    productCode: input.productCode,
    decisionState: hasEvidence ? "evidence_formed" : "context_only",
    mainContradictionOrFriction: input.currentConstraint,
    consequenceOfInaction: "Delay preserves the current constraint and increases the chance of a reactive decision.",
    decisionPressureLevel: hasEvidence ? "high" : "medium",
    recommendedNextMove: "Confirm the smallest reversible move that tests the constraint before committing wider resources.",
    reasoningBasis: hasEvidence ? input.evidenceBasis : [input.decisionContext],
    escalationCondition: "Escalate when the next move needs authority, irreversible spend, customer exposure, or governance approval.",
  };
}
