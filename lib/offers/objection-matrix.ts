export type ObjectionType =
  | "financial_hesitation"
  | "internal_misalignment"
  | "authority_gap"
  | "fear_of_change";

export type ObjectionEntry = {
  type: ObjectionType;
  rootCause: string;
  responseStrategy: string;
  escalationRisk: string;
};

export const OBJECTION_MATRIX: Record<ObjectionType, ObjectionEntry> = {
  financial_hesitation: {
    type: "financial_hesitation",
    rootCause: "The buyer has not fully priced the cost of drift, delay, or bad decisions.",
    responseStrategy:
      "Re-anchor on consequence, irreversibility, and the financial or institutional cost of indecision instead of defending line items.",
    escalationRisk:
      "If handled poorly, the offer starts sounding like a premium service bundle rather than a decision-grade intervention.",
  },
  internal_misalignment: {
    type: "internal_misalignment",
    rootCause: "The people involved do not agree on the problem, the stakes, or the decision rights.",
    responseStrategy:
      "Clarify whether the right next step is interpretation, alignment work, or refusal until the organization can produce one accountable locus of decision-making.",
    escalationRisk:
      "Moving too quickly can push an unready buyer into Strategy Room theater without any actual authority coherence.",
  },
  authority_gap: {
    type: "authority_gap",
    rootCause: "The person in the conversation cannot commit the institution or convene the true authority-holder.",
    responseStrategy:
      "Require the real decision-maker, or re-scope the conversation to preparatory interpretation rather than intervention.",
    escalationRisk:
      "Without authority, the system becomes a spectator sport and execution credibility collapses.",
  },
  fear_of_change: {
    type: "fear_of_change",
    rootCause: "The buyer suspects the real answer will require loss, trade-offs, or identity disruption.",
    responseStrategy:
      "Name the trade-off honestly, reduce false comfort, and keep the focus on governed consequence rather than emotional reassurance.",
    escalationRisk:
      "If softened too much, the system drifts into coaching language and loses seriousness.",
  },
};
