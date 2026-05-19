// ─────────────────────────────────────────────────────────────────────────────
// Market Intelligence Confidence Posture
//
// Reusable confidence posture types and per-report seed data.
// Every paid quarterly report must include a confidence posture section
// before the scenario framework.
// ─────────────────────────────────────────────────────────────────────────────

export type MarketConfidenceBand = "HIGH" | "MEDIUM" | "LOW" | "MONITORING";

export type MarketConfidencePostureItem = {
  band: MarketConfidenceBand;
  label: string;
  rationale: string;
  appliesTo: string[];
};

export type MarketConfidencePosture = {
  reportId: string;
  items: MarketConfidencePostureItem[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Q1 2026 confidence posture
// ─────────────────────────────────────────────────────────────────────────────

export const GMI_Q1_2026_CONFIDENCE_POSTURE: MarketConfidencePosture = {
  reportId: "GMI-Q1-2026",
  items: [
    {
      band: "HIGH",
      label: "High Confidence",
      rationale:
        "Structural fragmentation thesis supported by observed tariff escalation (US 145% effective on China; China 125% retaliatory, April 2026), confirmed market repricing in Q1 equity indices and rates, and documented supply chain stress disclosures. These are observed conditions, not modelled projections.",
      appliesTo: [
        "Structural fragmentation thesis",
        "Tariff escalation as regime change, not cyclical friction",
        "Direction of Q1 equity and rates repricing",
        "China-to-US supply chain structural impairment assessment",
      ],
    },
    {
      band: "MEDIUM",
      label: "Medium Confidence",
      rationale:
        "Inflation pass-through range (1–2pp over 2–4 quarters) is a modelled estimate derived from historical tariff episode analysis — the range is plausible but timing and magnitude are sensitive to retailer margin behaviour and demand elasticity. Recession probability (40–60%) reflects institutional median clustering, not a single-model output. Capital-flow interpretation reflects observed but incomplete Q1 data.",
      appliesTo: [
        "Inflation pass-through range (1–2pp, 2–4 quarters)",
        "US recession probability range (40–60%, 12-month window)",
        "Regional capital-flow interpretation",
        "Managed Fragmentation base case probability (43%)",
      ],
    },
    {
      band: "MONITORING",
      label: "Monitoring",
      rationale:
        "Dollar weakness under risk-off conditions is directionally notable and anomalous relative to historical safe-haven behaviour, but sustained observation is required before a structural interpretation can be made. Policy de-escalation pathways require observable trigger signals that are not yet present. Systemic confidence fracture risk remains tail-weighted.",
      appliesTo: [
        "Dollar weakness under risk-off conditions",
        "Policy de-escalation pathway viability",
        "Systemic confidence fracture risk",
      ],
    },
    {
      band: "LOW",
      label: "Low / Scenario-sensitive",
      rationale:
        "Non-linear systemic event probability (12%) and rapid bilateral de-escalation probability (18%) are scenario assumptions within a structured four-scenario model. They represent the tails of the distribution. These are not empirical forecasts — they are scenario probabilities with a documented method basis. The Africa strategic infrastructure thesis is a structural observation at early stage; the Q3 2026 review will be the first meaningful assessment point.",
      appliesTo: [
        "Non-linear systemic event probability (Confidence Fracture, 12%)",
        "Rapid bilateral de-escalation probability (De-escalation, 18%)",
        "Africa as emerging strategic infrastructure layer",
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Registry
// ─────────────────────────────────────────────────────────────────────────────

const CONFIDENCE_POSTURE_REGISTRY: Record<string, MarketConfidencePosture> = {
  "GMI-Q1-2026": GMI_Q1_2026_CONFIDENCE_POSTURE,
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function getConfidencePostureForReport(
  reportId: string,
): MarketConfidencePosture | null {
  return CONFIDENCE_POSTURE_REGISTRY[reportId] ?? null;
}

export function getPostureItemsByBand(
  posture: MarketConfidencePosture,
  band: MarketConfidenceBand,
): MarketConfidencePostureItem[] {
  return posture.items.filter((item) => item.band === band);
}

export function getHighConfidenceItems(
  posture: MarketConfidencePosture,
): MarketConfidencePostureItem[] {
  return getPostureItemsByBand(posture, "HIGH");
}

export function getMonitoringItems(
  posture: MarketConfidencePosture,
): MarketConfidencePostureItem[] {
  return getPostureItemsByBand(posture, "MONITORING");
}

export function getBandLabel(band: MarketConfidenceBand): string {
  switch (band) {
    case "HIGH":       return "High Confidence";
    case "MEDIUM":     return "Medium Confidence";
    case "LOW":        return "Low / Scenario-sensitive";
    case "MONITORING": return "Monitoring";
  }
}

export function getAppliesTo(
  posture: MarketConfidencePosture,
  band: MarketConfidenceBand,
): string[] {
  return getPostureItemsByBand(posture, band).flatMap((item) => item.appliesTo);
}
