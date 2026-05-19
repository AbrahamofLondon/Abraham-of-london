import type { MarketEvidenceClass } from "./market-intelligence-evidence-standard";

export type GrowthForecastSource =
  | "IMF"
  | "GOLDMAN_SACHS"
  | "MORGAN_STANLEY"
  | "JPMORGAN"
  | "AOL_SCENARIO";

export type GrowthScenarioInput = {
  source: GrowthForecastSource;
  year: 2026;
  globalGrowthEstimate: number | null;
  label: string;
  sourceDate?: string;
  evidenceClass: Extract<
    MarketEvidenceClass,
    | "INSTITUTIONAL_SOURCE"
    | "MARKET_IMPLIED_SIGNAL"
    | "MODELLED_ESTIMATE"
    | "SCENARIO_ASSUMPTION"
  >;
  notes: string;
};

export type GrowthScenarioModel = {
  baseRange: string;
  downsideRange: string;
  upsideOffset: string;
  aiProductivityOffset: "LOW" | "MEDIUM" | "HIGH";
  tradeHeadwindSeverity: "LOW" | "MEDIUM" | "HIGH";
  interpretation: string;
};

export type GrowthScenarioComparison = {
  inputs: readonly GrowthScenarioInput[];
  institutionalRange: { low: number; high: number };
  institutionalMidpoint: number;
  aolScenario: GrowthScenarioInput | null;
  model: GrowthScenarioModel;
  releaseNote: string;
};

// ─────────────────────────────────────────────────────────────────────────────
// Seeded institutional forecast inputs for 2026
// ─────────────────────────────────────────────────────────────────────────────

export const GMI_2026_GROWTH_INPUTS: readonly GrowthScenarioInput[] = [
  {
    source: "IMF",
    year: 2026,
    globalGrowthEstimate: 3.3,
    label: "IMF World Economic Outlook — January 2026",
    sourceDate: "2026-01",
    evidenceClass: "INSTITUTIONAL_SOURCE",
    notes:
      "IMF January 2026 WEO Update forecast. 3.3% global growth for 2026. Trade policy shifts described as offset by other growth forces. July 2026 WEO revision pending — required before Q2 release.",
  },
  {
    source: "GOLDMAN_SACHS",
    year: 2026,
    globalGrowthEstimate: 2.8,
    label: "Goldman Sachs Global Investment Research — 2026 Global GDP",
    sourceDate: "2026-Q1",
    evidenceClass: "INSTITUTIONAL_SOURCE",
    notes:
      "Goldman Sachs ~2.8% global GDP growth estimate for 2026. Source confirmation required — do not cite without confirmed publication reference and date.",
  },
  {
    source: "MORGAN_STANLEY",
    year: 2026,
    globalGrowthEstimate: 3.2,
    label: "Morgan Stanley Global Economics — 2026 Global GDP",
    sourceDate: "2026-Q1",
    evidenceClass: "INSTITUTIONAL_SOURCE",
    notes:
      "Morgan Stanley ~3.2% global GDP estimate. Source confirmation required — use as bracket alongside IMF figure once confirmed.",
  },
  {
    source: "JPMORGAN",
    year: 2026,
    globalGrowthEstimate: null,
    label: "JPMorgan Research — AI-supported global resilience framing",
    sourceDate: "2026-Q1",
    evidenceClass: "OPERATOR_JUDGEMENT" as Extract<
      MarketEvidenceClass,
      | "INSTITUTIONAL_SOURCE"
      | "MARKET_IMPLIED_SIGNAL"
      | "MODELLED_ESTIMATE"
      | "SCENARIO_ASSUMPTION"
    >,
    notes:
      "JPMorgan qualitative framing of AI-driven productivity as resilience offset to trade headwinds. No confirmed GDP point estimate at time of seeding. Do not use as a hard GDP number — treat as qualitative offset signal if confirmed.",
  },
  {
    source: "AOL_SCENARIO",
    year: 2026,
    globalGrowthEstimate: 2.7,
    label: "AoL GMI Q2 — Constrained growth scenario assumption",
    evidenceClass: "SCENARIO_ASSUMPTION",
    notes:
      "AoL downside-of-consensus scenario: constrained ~2.7% growth under elevated trade friction, tariff persistence, and selective capital allocation. Must be labelled SCENARIO_ASSUMPTION — it sits below the institutional consensus range and must not be presented as settled until supported by confirmed Q2 evidence.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Model builder
// ─────────────────────────────────────────────────────────────────────────────

function buildInstitutionalRange(
  inputs: readonly GrowthScenarioInput[],
): { low: number; high: number } {
  const confirmed = inputs
    .filter(
      (i) =>
        i.source !== "AOL_SCENARIO" &&
        i.globalGrowthEstimate !== null &&
        i.evidenceClass !== "SCENARIO_ASSUMPTION",
    )
    .map((i) => i.globalGrowthEstimate as number);

  if (confirmed.length === 0) return { low: 0, high: 0 };
  return {
    low: Math.min(...confirmed),
    high: Math.max(...confirmed),
  };
}

export function buildGrowthScenarioComparison(
  inputs: readonly GrowthScenarioInput[] = GMI_2026_GROWTH_INPUTS,
): GrowthScenarioComparison {
  const range = buildInstitutionalRange(inputs);
  const confirmedValues = inputs
    .filter(
      (i) =>
        i.source !== "AOL_SCENARIO" &&
        i.globalGrowthEstimate !== null &&
        i.evidenceClass !== "SCENARIO_ASSUMPTION",
    )
    .map((i) => i.globalGrowthEstimate as number);

  const midpoint =
    confirmedValues.length > 0
      ? Math.round(
          (confirmedValues.reduce((a, b) => a + b, 0) / confirmedValues.length) * 100,
        ) / 100
      : 0;

  const aolScenario = inputs.find((i) => i.source === "AOL_SCENARIO") ?? null;

  const model: GrowthScenarioModel = {
    baseRange: `${range.low.toFixed(1)}–${range.high.toFixed(1)}%`,
    downsideRange: aolScenario?.globalGrowthEstimate
      ? `~${aolScenario.globalGrowthEstimate.toFixed(1)}% (AoL scenario assumption)`
      : "Pending",
    upsideOffset: "AI productivity contribution — qualitative only at this stage",
    aiProductivityOffset: "LOW",
    tradeHeadwindSeverity: "HIGH",
    interpretation:
      "Institutional forecasts support a constrained low-3% global growth environment rather than a confirmed sub-3% base case. The AoL downside case may sit below consensus, but must be labelled as scenario assumption unless supported by later Q2 evidence.",
  };

  return {
    inputs,
    institutionalRange: range,
    institutionalMidpoint: midpoint,
    aolScenario,
    model,
    releaseNote:
      "IMF July 2026 WEO revision is required before the Q2 report is published. Goldman Sachs and Morgan Stanley estimates require confirmed source references. JPMorgan framing may only be used qualitatively.",
  };
}

export function getGrowthInputBySource(
  source: GrowthForecastSource,
): GrowthScenarioInput | null {
  return GMI_2026_GROWTH_INPUTS.find((i) => i.source === source) ?? null;
}

export function getConfirmedInstitutionalInputs(): GrowthScenarioInput[] {
  return GMI_2026_GROWTH_INPUTS.filter(
    (i) => i.source !== "AOL_SCENARIO" && i.globalGrowthEstimate !== null,
  );
}

export function getAolScenarioInput(): GrowthScenarioInput | null {
  return getGrowthInputBySource("AOL_SCENARIO");
}
