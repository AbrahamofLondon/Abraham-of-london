export type MarketEvidenceClass =
  | "PRIMARY_DATA"
  | "INSTITUTIONAL_SOURCE"
  | "MARKET_IMPLIED_SIGNAL"
  | "MODELLED_ESTIMATE"
  | "SCENARIO_ASSUMPTION"
  | "OPERATOR_JUDGEMENT";

const EVIDENCE_CLASS_LABELS: Record<MarketEvidenceClass, string> = {
  PRIMARY_DATA:           "Primary Data",
  INSTITUTIONAL_SOURCE:   "Institutional Source",
  MARKET_IMPLIED_SIGNAL:  "Market-Implied Signal",
  MODELLED_ESTIMATE:      "Modelled Estimate",
  SCENARIO_ASSUMPTION:    "Scenario Assumption",
  OPERATOR_JUDGEMENT:     "Operator Judgement",
};

const EVIDENCE_CLASS_DISCLOSURES: Record<MarketEvidenceClass, string> = {
  PRIMARY_DATA:
    "Sourced from primary datasets. Source reference required.",
  INSTITUTIONAL_SOURCE:
    "Sourced from a recognised institutional publication. Source reference required.",
  MARKET_IMPLIED_SIGNAL:
    "Derived from market pricing or positioning data. Date and window reference required.",
  MODELLED_ESTIMATE:
    "Output of a quantitative model or estimate. Method label required. Not a confirmed figure.",
  SCENARIO_ASSUMPTION:
    "Forward-looking scenario assumption. Method note required. Not a forecast or fact.",
  OPERATOR_JUDGEMENT:
    "Synthesised operator interpretation. Confidence band required.",
};

export function getEvidenceClassLabel(cls: MarketEvidenceClass): string {
  return EVIDENCE_CLASS_LABELS[cls];
}

export function getEvidenceClassDisclosure(cls: MarketEvidenceClass): string {
  return EVIDENCE_CLASS_DISCLOSURES[cls];
}

export function requiresSourceReference(cls: MarketEvidenceClass): boolean {
  return cls === "PRIMARY_DATA" || cls === "INSTITUTIONAL_SOURCE";
}

export function requiresConfidenceBand(cls: MarketEvidenceClass): boolean {
  return (
    cls === "MODELLED_ESTIMATE" ||
    cls === "SCENARIO_ASSUMPTION" ||
    cls === "OPERATOR_JUDGEMENT"
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Confidence posture
// ─────────────────────────────────────────────────────────────────────────────

export type MarketConfidenceBand = "HIGH" | "MEDIUM" | "LOW" | "MONITORING";

export type MarketConfidenceItem = {
  band: MarketConfidenceBand;
  label: string;
  examples: string[];
};

export type MarketConfidencePosture = {
  items: MarketConfidenceItem[];
};

export function buildMarketConfidencePosture(): MarketConfidencePosture {
  return {
    items: [
      {
        band: "HIGH",
        label: "High Confidence",
        examples: [
          "Structural thesis",
          "Observed market movements",
          "Documented policy changes",
        ],
      },
      {
        band: "MEDIUM",
        label: "Medium Confidence",
        examples: [
          "Inflation pass-through ranges",
          "Recession probability ranges",
          "Capital-flow interpretation",
        ],
      },
      {
        band: "LOW",
        label: "Low Confidence",
        examples: [
          "Early-stage scenario assumptions",
          "Non-linear event modelling",
          "Contested macro interpretations",
        ],
      },
      {
        band: "MONITORING",
        label: "Monitoring",
        examples: [
          "FX anomaly signals",
          "Political de-escalation pathways",
          "Systemic fracture risk",
        ],
      },
    ],
  };
}
