import { CLAIM_THRESHOLDS } from "@/lib/claims/claim-governor";

export type BenchmarkMetricFact = {
  metric: string;
  value: number;
};

export type BenchmarkSubject = {
  id: string;
  metrics: BenchmarkMetricFact[];
  dimensions?: Record<string, string | number | boolean | null | undefined>;
};

export type BenchmarkFact = BenchmarkSubject & {
  recordedAt?: string;
  anonymized: true;
};

export type BenchmarkCohortFilters = {
  sector?: string;
  revenueBand?: string;
  headcountBand?: string;
  geography?: string;
  maturity?: string;
  assessmentType?: string;
};

export type BenchmarkCohortSnapshot = {
  id: string;
  filters: BenchmarkCohortFilters;
  sampleSize: number;
  facts: BenchmarkFact[];
};

export type BenchmarkPosition = {
  available: boolean;
  cohort: {
    id: string;
    filters: BenchmarkCohortFilters;
    sampleSize: number;
  };
  confidence: number;
  insufficientReason?: string;
  deviations: Array<{
    metric: string;
    subjectValue: number;
    percentile: number;
    cohortMedian: number;
    varianceFromCohort: number;
    confidence: number;
  }>;
};

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[mid] ?? 0;
  return Math.round(((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2);
}

function percentile(value: number, cohortValues: number[]): number {
  if (!cohortValues.length) return 0;
  const lessOrEqual = cohortValues.filter((candidate) => candidate <= value).length;
  return Math.round((lessOrEqual / cohortValues.length) * 100);
}

function matchesFilters(fact: BenchmarkFact, filters: BenchmarkCohortFilters): boolean {
  const dimensions = fact.dimensions || {};
  return Object.entries(filters).every(([key, wanted]) => {
    if (!wanted) return true;
    return String(dimensions[key] || "").toLowerCase() === String(wanted).toLowerCase();
  });
}

export function resolveBenchmarkCohort(
  filters: BenchmarkCohortFilters,
  facts: BenchmarkFact[] = [],
): BenchmarkCohortSnapshot {
  const scopedFacts = facts.filter((fact) => fact.anonymized && matchesFilters(fact, filters));
  const key = Object.entries(filters)
    .filter(([, value]) => value)
    .map(([k, v]) => `${k}:${v}`)
    .join("|") || "all-internal";

  return {
    id: `internal:${key}`,
    filters,
    sampleSize: scopedFacts.length,
    facts: scopedFacts,
  };
}

export function computeBenchmarkPosition(
  subject: BenchmarkSubject,
  cohort: BenchmarkCohortSnapshot,
): BenchmarkPosition {
  if (cohort.sampleSize < CLAIM_THRESHOLDS.benchmarkSampleSize) {
    return {
      available: false,
      cohort: {
        id: cohort.id,
        filters: cohort.filters,
        sampleSize: cohort.sampleSize,
      },
      confidence: 0,
      insufficientReason: `Internal cohort sample ${cohort.sampleSize} is below threshold ${CLAIM_THRESHOLDS.benchmarkSampleSize}.`,
      deviations: [],
    };
  }

  const deviations = subject.metrics.map((metric) => {
    const cohortValues = cohort.facts
      .map((fact) => fact.metrics.find((candidate) => candidate.metric === metric.metric)?.value)
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    const cohortMedian = median(cohortValues);
    const sampleConfidence = Math.min(95, Math.round(40 + cohortValues.length * 8));

    return {
      metric: metric.metric,
      subjectValue: metric.value,
      percentile: percentile(metric.value, cohortValues),
      cohortMedian,
      varianceFromCohort: Math.round(metric.value - cohortMedian),
      confidence: sampleConfidence,
    };
  });

  return {
    available: true,
    cohort: {
      id: cohort.id,
      filters: cohort.filters,
      sampleSize: cohort.sampleSize,
    },
    confidence: Math.min(95, Math.round(35 + cohort.sampleSize * 7)),
    deviations,
  };
}
