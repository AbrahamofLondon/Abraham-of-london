export type ProductPriceBand =
  | 0
  | "entry"
  | "mid-tier"
  | "premium"
  | "high-ticket"
  | "custom";

export type ProductLadderStage =
  | "diagnostic"
  | "executive_report"
  | "strategy_room"
  | "advisory";

export type ProductLadderItem = {
  price: ProductPriceBand;
  purpose:
    | "qualification"
    | "insight monetization"
    | "intervention"
    | "implementation";
  buyerState: string;
  primaryOutcome: string;
  escalationTarget?: ProductLadderStage;
  refusalWhen: string[];
};

export const PRODUCT_LADDER: Record<ProductLadderStage, ProductLadderItem> = {
  diagnostic: {
    price: 0,
    purpose: "qualification",
    buyerState: "Problem-aware, seeking signal, not yet fully qualified.",
    primaryOutcome: "Surface decision gravity, seriousness, and route fit.",
    escalationTarget: "executive_report",
    refusalWhen: [
      "The user is seeking entertainment rather than disciplined diagnosis.",
      "The user has no actual decision context or execution stake.",
    ],
  },
  executive_report: {
    price: "mid-tier",
    purpose: "insight monetization",
    buyerState: "Serious buyer needs structured interpretation before intervention.",
    primaryOutcome: "Convert fragmented signal into board-grade interpretation and next-step logic.",
    escalationTarget: "strategy_room",
    refusalWhen: [
      "The buyer lacks the authority to act on the report.",
      "The buyer is attempting to outsource judgment without accepting trade-offs.",
    ],
  },
  strategy_room: {
    price: "premium",
    purpose: "intervention",
    buyerState: "Qualified principal facing a high-stakes decision under constraint.",
    primaryOutcome: "Force a decision architecture with explicit trade-offs, owners, and cadence.",
    escalationTarget: "advisory",
    refusalWhen: [
      "The decision-maker is absent and cannot be brought into the room.",
      "The problem is still too vague for a serious intervention chamber.",
      "The buyer wants brainstorming, therapy, or prestige signaling rather than governed decision-making.",
    ],
  },
  advisory: {
    price: "high-ticket",
    purpose: "implementation",
    buyerState: "Decision is made and now requires sustained execution governance.",
    primaryOutcome: "Support implementation, review cadence, and institutional follow-through.",
    refusalWhen: [
      "No decision has actually been made.",
      "The client wants indefinite access without execution ownership or internal accountability.",
    ],
  },
};

export const PRODUCT_LADDER_ORDER: ProductLadderStage[] = [
  "diagnostic",
  "executive_report",
  "strategy_room",
  "advisory",
];
