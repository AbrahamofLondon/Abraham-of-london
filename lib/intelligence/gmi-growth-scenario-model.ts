import type { MarketEvidenceClass } from "./market-intelligence-evidence-standard";

export type GrowthForecastSource =
  | "IMF"
  | "OECD"
  | "WORLD_BANK"
  | "GOLDMAN_SACHS"
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
    globalGrowthEstimate: 3.1,
    label: "IMF World Economic Outlook — April 2026",
    sourceDate: "2026-04",
    evidenceClass: "INSTITUTIONAL_SOURCE",
    notes:
      "IMF April 2026 WEO forecast: 3.1% global growth for 2026 — a downgrade from the January WEO Update (3.3%). The Jan-to-April downgrade is itself part of the dispersion signal. Release evidence is locked to the April WEO vintage; do not wait for the July WEO.",
  },
  {
    source: "OECD",
    year: 2026,
    globalGrowthEstimate: 2.8,
    label: "OECD Economic Outlook — June 2026",
    sourceDate: "2026-06",
    evidenceClass: "INSTITUTIONAL_SOURCE",
    notes:
      "OECD June 2026 Economic Outlook: ~2.8% global growth for 2026, below the IMF figure — sits in the lower-middle of the dispersion band. Methodology differs from IMF and is not directly comparable.",
  },
  {
    source: "WORLD_BANK",
    year: 2026,
    globalGrowthEstimate: 2.5,
    label: "World Bank Global Economic Prospects — June 2026",
    sourceDate: "2026-06",
    evidenceClass: "INSTITUTIONAL_SOURCE",
    notes:
      "World Bank June 2026 Global Economic Prospects: ~2.5% global growth for 2026 — the lower bound of the institutional dispersion band. Weights trade friction and EM financing conditions more heavily than the IMF.",
  },
  {
    source: "GOLDMAN_SACHS",
    year: 2026,
    globalGrowthEstimate: 2.8,
    label: "Goldman Sachs Global Investment Research — 2026 Global GDP release-lock value",
    sourceDate: "2026-07-06 data lock",
    evidenceClass: "INSTITUTIONAL_SOURCE",
    notes:
      "Goldman Sachs 2.8% is the release-lock value. No dated retained evidence source directly establishes the earlier 2.9% figure, so 2.9% is not used in the release forecast ledger.",
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
      "AoL constrained-growth scenario: ~2.7% under elevated trade friction, tariff persistence, and selective capital allocation. Must be labelled SCENARIO_ASSUMPTION. It now sits within the lower half of the institutional dispersion band (between the World Bank 2.5% floor and OECD 2.8%), no longer below the entire range — the widening of that band toward AoL's assumption is itself corroborating context, not proof.",
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
      "Institutional forecasts have dispersed rather than converged: 2026 estimates now span roughly 2.5–3.1% (World Bank 2.5%, OECD 2.8%, Goldman Sachs 2.8%, IMF April 3.1%). The strategic signal is the widening spread — divergent assumptions on tariff duration and financial spillovers — not any single point estimate or a settled 'consensus'. The AoL constrained-growth case (~2.7%) sits inside the lower half of this band and remains a scenario assumption.",
  };

  return {
    inputs,
    institutionalRange: range,
    institutionalMidpoint: midpoint,
    aolScenario,
    model,
    releaseNote:
      "Dispersion band spans World Bank 2.5% to IMF April 3.1% (April–June 2026 vintage). Goldman Sachs is locked at 2.8% because no retained dated source directly establishes 2.9%; Morgan Stanley is excluded from the release range. JPMorgan framing may only be used qualitatively.",
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
