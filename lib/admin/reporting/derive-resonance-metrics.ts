/* lib/admin/reporting/derive-resonance-metrics.ts
   ---------------------------------------------------------------------------
   RESONANCE METRICS DERIVATION
   Canonical transformation layer from raw campaign responses into
   decision-grade domain metrics for executive reporting.
   --------------------------------------------------------------------------- */

export type ResonanceCoverage = "LOW" | "MEDIUM" | "HIGH";

export type RawExecutiveResponse = {
  domain?: unknown;
  intent?: unknown;
  score?: unknown;
  value?: unknown;
  rating?: unknown;
  reality?: unknown;
  submittedAt?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type DerivedResonanceMetric = {
  label: string;
  intent: number;
  reality: number;
  dissonance: number;
  coverage: ResonanceCoverage;
  responseCount: number;
};

export type DerivedResonanceTelemetry = {
  metrics: DerivedResonanceMetric[];
  averageDissonance: number;
  strongestDomain: string | null;
  weakestDomain: string | null;
  domainCount: number;
  totalResponses: number;
  isDisordered: boolean;
};

const DEFAULT_INTENT = 85;
const DISORDER_THRESHOLD = 30;

function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function roundTo(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeDomain(value: unknown): string {
  return safeString(value, "UNSPECIFIED")
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "") || "UNSPECIFIED";
}

function deriveCoverage(responseCount: number): ResonanceCoverage {
  if (responseCount >= 5) return "HIGH";
  if (responseCount >= 3) return "MEDIUM";
  return "LOW";
}

function getRealityScore(input: RawExecutiveResponse): number {
  const raw =
    input.reality ??
    input.score ??
    input.value ??
    input.rating ??
    null;

  return clamp(toFiniteNumber(raw, 0), 0, 100);
}

function getIntentScore(input: RawExecutiveResponse): number {
  const raw = input.intent ?? null;
  return clamp(toFiniteNumber(raw, DEFAULT_INTENT), 0, 100);
}

export function deriveResonanceMetricsFromResponses(
  responses: RawExecutiveResponse[]
): DerivedResonanceTelemetry {
  const safeResponses = Array.isArray(responses) ? responses : [];

  const grouped = new Map<
    string,
    { intentTotal: number; realityTotal: number; responseCount: number }
  >();

  for (const response of safeResponses) {
    const domain = normalizeDomain(response?.domain);
    const intent = getIntentScore(response);
    const reality = getRealityScore(response);

    const current = grouped.get(domain) ?? {
      intentTotal: 0,
      realityTotal: 0,
      responseCount: 0,
    };

    current.intentTotal += intent;
    current.realityTotal += reality;
    current.responseCount += 1;

    grouped.set(domain, current);
  }

  const metrics: DerivedResonanceMetric[] = [...grouped.entries()]
    .map(([label, aggregate]) => {
      const intent = roundTo(aggregate.intentTotal / aggregate.responseCount, 2);
      const reality = roundTo(aggregate.realityTotal / aggregate.responseCount, 2);
      const dissonance = roundTo(Math.max(0, intent - reality), 2);

      return {
        label,
        intent,
        reality,
        dissonance,
        coverage: deriveCoverage(aggregate.responseCount),
        responseCount: aggregate.responseCount,
      };
    })
    .sort((a, b) => {
      if (b.dissonance !== a.dissonance) return b.dissonance - a.dissonance;
      return a.label.localeCompare(b.label);
    });

  const domainCount = metrics.length;
  const totalResponses = metrics.reduce((sum, metric) => sum + metric.responseCount, 0);

  const averageDissonance =
    domainCount > 0
      ? roundTo(
          metrics.reduce((sum, metric) => sum + metric.dissonance, 0) / domainCount,
          2
        )
      : 0;

  const strongestDomain =
    [...metrics]
      .sort((a, b) => {
        if (a.dissonance !== b.dissonance) return a.dissonance - b.dissonance;
        return b.reality - a.reality;
      })[0]?.label ?? null;

  const weakestDomain = metrics[0]?.label ?? null;

  return {
    metrics,
    averageDissonance,
    strongestDomain,
    weakestDomain,
    domainCount,
    totalResponses,
    isDisordered: averageDissonance > DISORDER_THRESHOLD,
  };
}