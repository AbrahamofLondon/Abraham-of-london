// lib/decision/build-decision-signal-profile.ts

import {
  calculateResonanceSync,
  scoreToBand,
  type ResonanceBand,
  type ResonanceInputRecord,
} from "@/lib/ogr/simulation-engine";
import {
  detectDriftAlerts,
  type DriftAlertCandidate,
  type DriftAlertResult,
  type DriftSeverity,
} from "@/lib/decision/recommendation-drift-alerts";

export type DecisionContextType =
  | "sector"
  | "route"
  | "readinessTier"
  | "authorityType"
  | "orgState"
  | "marketRiskBand"
  | "revenueBand"
  | "dominantDomain"
  | "failureMode"
  | string;

export type DecisionAssetContextRow = {
  assetId: string;
  assetTitle: string;
  assetHref?: string | null;
  assetKind: string;

  contextType: DecisionContextType;
  contextValue: string;

  // Performance metrics
  impressions?: number | null;
  clicks?: number | null;
  conversions?: number | null;
  assistedConversions?: number | null;

  // Improvement metrics
  routeImprovements?: number | null;
  readinessImprovements?: number | null;
  clarityGain?: number | null;
  authorityGain?: number | null;

  // Scoring fields (used by buildDecisionSignalProfile)
  contextualWeight?: number | null;
  confidenceScore?: number | null;
  usefulnessScore?: number | null;
  rankingScore?: number | null;
  resonanceScore?: number | null;
  resonanceBand?: string | null;
  governanceRiskScore?: number | null;
  constitutionalSource?: boolean | null;
  totalConversionRate?: number | null;
  topDriftSeverity?: DriftSeverity | null;
  drifts?: DriftAlertResult[] | null;

  metadata?: Record<string, unknown> | string | null;
  updatedAt?: string | Date | null;
};

export type DecisionSignalProfile = {
  assetId: string;
  assetTitle: string;
  assetHref: string | null;
  assetKind: string;

  contextType: string;
  contextValue: string;

  constitutionalSource: boolean;
  governanceGain: number;

  impressions: number;
  clicks: number;
  conversions: number;
  assistedConversions: number;

  routeImprovements: number;
  readinessImprovements: number;
  clarityGain: number;
  authorityGain: number;

  contextualWeight: number;
  confidenceScore: number;
  usefulnessScore: number;

  ctr: number;
  directConversionRate: number;
  assistedConversionRate: number;
  totalConversionRate: number;

  resonanceScore: number;
  resonanceConfidence: number;
  resonanceBand: ResonanceBand;

  drifts: DriftAlertResult[];
  topDriftSeverity: DriftSeverity | null;

  strategicFitScore: number;
  governanceRiskScore: number;
  signalStrengthScore: number;
  rankingScore: number;

  updatedAt: string | null;
};

export type DecisionSignalSummary = {
  totalProfiles: number;
  constitutionalProfiles: number;
  avgRankingScore: number;
  avgResonanceScore: number;
  avgConfidenceScore: number;
  avgContextualWeight: number;
  avgUsefulnessScore: number;
  highRiskProfiles: number;
  criticalDriftProfiles: number;
};

function normalizeString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function roundTo(value: number, places = 6): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // ignore malformed JSON
    }
  }

  return {};
}

function normalizeDate(value: unknown): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function rate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return roundTo((numerator / denominator) * 100, 4);
}

function severityWeight(severity: DriftSeverity | null): number {
  switch (severity) {
    case "CRITICAL":
      return 100;
    case "HIGH":
      return 70;
    case "MEDIUM":
      return 40;
    case "LOW":
      return 15;
    default:
      return 0;
  }
}

function pickTopSeverity(drifts: DriftAlertResult[]): DriftSeverity | null {
  if (!Array.isArray(drifts) || drifts.length === 0) return null;

  const ordered: DriftSeverity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
  for (const severity of ordered) {
    if (drifts.some((drift) => drift.severity === severity)) return severity;
  }

  return null;
}

function buildResonanceInputs(
  row: DecisionAssetContextRow,
  metadata: Record<string, unknown>,
): ResonanceInputRecord[] {
  const impressions = normalizeNumber(row.impressions, 0);
  const clicks = normalizeNumber(row.clicks, 0);
  const conversions = normalizeNumber(row.conversions, 0);
  const assistedConversions = normalizeNumber(row.assistedConversions, 0);
  const routeImprovements = normalizeNumber(row.routeImprovements, 0);
  const readinessImprovements = normalizeNumber(row.readinessImprovements, 0);
  const clarityGain = normalizeNumber(row.clarityGain, 0);
  const authorityGain = normalizeNumber(row.authorityGain, 0);
  const governanceGain = normalizeNumber(metadata.governanceGain, 0);

  return [
    {
      id: "contextualWeight",
      score: normalizeNumber(row.contextualWeight, 1) * 100,
      certainty: clamp(normalizeNumber(row.confidenceScore, 0) / 100, 0, 1),
      weight: 1.5,
    },
    {
      id: "usefulnessScore",
      score: normalizeNumber(row.usefulnessScore, 0),
      certainty: clamp(normalizeNumber(row.confidenceScore, 0) / 100, 0, 1),
      weight: 1.3,
    },
    {
      id: "conversionRate",
      score: rate(conversions + assistedConversions, impressions),
      certainty: clamp(impressions / 25, 0, 1),
      weight: 1.25,
    },
    {
      id: "clickThroughRate",
      score: rate(clicks, impressions),
      certainty: clamp(impressions / 25, 0, 1),
      weight: 0.9,
    },
    {
      id: "routeImprovementRate",
      score: rate(routeImprovements, impressions),
      certainty: clamp(impressions / 20, 0, 1),
      weight: 1.1,
    },
    {
      id: "readinessImprovementRate",
      score: rate(readinessImprovements, impressions),
      certainty: clamp(impressions / 20, 0, 1),
      weight: 1.0,
    },
    {
      id: "clarityGain",
      score: clamp(clarityGain, 0, 100),
      certainty: clamp(impressions / 15, 0, 1),
      weight: 1.15,
    },
    {
      id: "authorityGain",
      score: clamp(authorityGain, 0, 100),
      certainty: clamp(impressions / 15, 0, 1),
      weight: 1.05,
    },
    {
      id: "governanceGain",
      score: clamp(governanceGain, 0, 100),
      certainty: clamp(impressions / 15, 0, 1),
      weight: 1.2,
    },
  ];
}

function buildDriftCandidates(
  row: DecisionAssetContextRow,
  metadata: Record<string, unknown>,
): DriftAlertCandidate[] {
  const candidates: DriftAlertCandidate[] = [];

  const previousContextualWeight = metadata.previousContextualWeight;
  const previousUsefulnessScore = metadata.previousUsefulnessScore;
  const previousConfidenceScore = metadata.previousConfidenceScore;

  if (previousContextualWeight != null) {
    candidates.push({
      metric: "contextualWeight",
      label: `${row.assetTitle} · ${row.contextType} · ${row.contextValue}`,
      previousValue: normalizeNumber(previousContextualWeight, 0),
      currentValue: normalizeNumber(row.contextualWeight, 0),
      warningThreshold: 5,
      criticalThreshold: 15,
    });
  }

  if (previousUsefulnessScore != null) {
    candidates.push({
      metric: "usefulnessScore",
      label: `${row.assetTitle} · ${row.contextType} · ${row.contextValue}`,
      previousValue: normalizeNumber(previousUsefulnessScore, 0),
      currentValue: normalizeNumber(row.usefulnessScore, 0),
      warningThreshold: 5,
      criticalThreshold: 15,
    });
  }

  if (previousConfidenceScore != null) {
    candidates.push({
      metricKey: "confidenceScore",
      label: `${row.assetTitle} · ${row.contextType} · ${row.contextValue}`,
      previousValue: normalizeNumber(previousConfidenceScore, 0),
      currentValue: normalizeNumber(row.confidenceScore, 0),
      warningThreshold: 8,
      criticalThreshold: 20,
    });
  }

  return candidates;
}

export function buildDecisionSignalProfile(
  row: DecisionAssetContextRow,
): DecisionSignalProfile {
  const metadata = asRecord(row.metadata);

  const assetId = normalizeString(row.assetId);
  const assetTitle = normalizeString(row.assetTitle, "Untitled Asset");
  const assetHref = normalizeString(row.assetHref, "") || null;
  const assetKind = normalizeString(row.assetKind, "unknown");
  const contextType = normalizeString(row.contextType, "unknown");
  const contextValue = normalizeString(row.contextValue, "unknown");

  const impressions = normalizeNumber(row.impressions, 0);
  const clicks = normalizeNumber(row.clicks, 0);
  const conversions = normalizeNumber(row.conversions, 0);
  const assistedConversions = normalizeNumber(row.assistedConversions, 0);
  const routeImprovements = normalizeNumber(row.routeImprovements, 0);
  const readinessImprovements = normalizeNumber(row.readinessImprovements, 0);
  const clarityGain = normalizeNumber(row.clarityGain, 0);
  const authorityGain = normalizeNumber(row.authorityGain, 0);

  const contextualWeight = normalizeNumber(row.contextualWeight, 1);
  const confidenceScore = normalizeNumber(row.confidenceScore, 0);
  const usefulnessScore = normalizeNumber(row.usefulnessScore, 0);

  const governanceGain = normalizeNumber(metadata.governanceGain, 0);
  const constitutionalSource = Boolean(metadata.constitutionalSource);

  const ctr = rate(clicks, impressions);
  const directConversionRate = rate(conversions, impressions);
  const assistedConversionRate = rate(assistedConversions, impressions);
  const totalConversionRate = rate(conversions + assistedConversions, impressions);

  const resonance = calculateResonanceSync(buildResonanceInputs(row, metadata), {
    includeConfidence: true,
    calculateBand: true,
  });

  const drifts = detectDriftAlerts(buildDriftCandidates(row, metadata));
  const topDriftSeverity = pickTopSeverity(drifts);

  const signalStrengthScore = roundTo(
    clamp(
      resonance.score * 0.4 +
        usefulnessScore * 0.25 +
        confidenceScore * 0.15 +
        Math.min(impressions, 50) * 0.4,
      0,
      100,
    ),
    4,
  );

  const strategicFitScore = roundTo(
    clamp(
      totalConversionRate * 0.25 +
        ctr * 0.15 +
        routeImprovements * 2.5 +
        readinessImprovements * 2.5 +
        clarityGain * 0.2 +
        authorityGain * 0.2 +
        governanceGain * 0.2 +
        usefulnessScore * 0.25,
      0,
      100,
    ),
    4,
  );

  const governanceRiskScore = roundTo(
    clamp(
      severityWeight(topDriftSeverity) * 0.65 +
        Math.max(0, 100 - confidenceScore) * 0.2 +
        Math.max(0, 100 - usefulnessScore) * 0.15,
      0,
      100,
    ),
    4,
  );

  const rankingScore = roundTo(
    clamp(
      signalStrengthScore * 0.4 +
        strategicFitScore * 0.45 +
        Math.max(0, 100 - governanceRiskScore) * 0.15,
      0,
      100,
    ),
    4,
  );

  return {
    assetId,
    assetTitle,
    assetHref,
    assetKind,
    contextType,
    contextValue,
    constitutionalSource,
    governanceGain,

    impressions,
    clicks,
    conversions,
    assistedConversions,
    routeImprovements,
    readinessImprovements,
    clarityGain,
    authorityGain,

    contextualWeight,
    confidenceScore,
    usefulnessScore,

    ctr,
    directConversionRate,
    assistedConversionRate,
    totalConversionRate,

    resonanceScore: resonance.score,
    resonanceConfidence: resonance.confidence ?? 0,
    resonanceBand: resonance.band ?? scoreToBand(resonance.score),

    drifts,
    topDriftSeverity,

    strategicFitScore,
    governanceRiskScore,
    signalStrengthScore,
    rankingScore,

    updatedAt: normalizeDate(row.updatedAt),
  };
}

export function buildDecisionSignalProfiles(
  rows: DecisionAssetContextRow[],
): DecisionSignalProfile[] {
  if (!Array.isArray(rows)) return [];

  return rows
    .map((row) => buildDecisionSignalProfile(row))
    .sort((a, b) => {
      if (b.rankingScore !== a.rankingScore) {
        return b.rankingScore - a.rankingScore;
      }
      if (b.resonanceScore !== a.resonanceScore) {
        return b.resonanceScore - a.resonanceScore;
      }
      if (b.usefulnessScore !== a.usefulnessScore) {
        return b.usefulnessScore - a.usefulnessScore;
      }
      return b.impressions - a.impressions;
    });
}

export function summarizeDecisionSignalProfiles(
  profiles: DecisionSignalProfile[],
): DecisionSignalSummary {
  if (!Array.isArray(profiles) || profiles.length === 0) {
    return {
      totalProfiles: 0,
      constitutionalProfiles: 0,
      avgRankingScore: 0,
      avgResonanceScore: 0,
      avgConfidenceScore: 0,
      avgContextualWeight: 0,
      avgUsefulnessScore: 0,
      highRiskProfiles: 0,
      criticalDriftProfiles: 0,
    };
  }

  const total = profiles.length;

  const average = (selector: (profile: DecisionSignalProfile) => number) =>
    roundTo(
      profiles.reduce((sum, profile) => sum + selector(profile), 0) / total,
      4,
    );

  return {
    totalProfiles: total,
    constitutionalProfiles: profiles.filter((profile) => profile.constitutionalSource).length,
    avgRankingScore: average((profile) => profile.rankingScore),
    avgResonanceScore: average((profile) => profile.resonanceScore),
    avgConfidenceScore: average((profile) => profile.confidenceScore),
    avgContextualWeight: average((profile) => profile.contextualWeight),
    avgUsefulnessScore: average((profile) => profile.usefulnessScore),
    highRiskProfiles: profiles.filter((profile) => profile.governanceRiskScore >= 70).length,
    criticalDriftProfiles: profiles.filter(
      (profile) => profile.topDriftSeverity === "CRITICAL",
    ).length,
  };
}

// ✅ Helper function to create a minimal context row from constitution data
export function createContextRowFromConstitution(
  constitution: any,
  type: DecisionContextType,
  value?: string,
  overrides?: Partial<DecisionAssetContextRow>
): DecisionAssetContextRow {
  const contextValue = value || constitution[type] || "UNKNOWN";
  
  return {
    assetId: `constitutional_${type}`,
    assetTitle: `${type.replace(/([A-Z])/g, ' $1').trim()} Assessment`,
    assetHref: null,
    assetKind: "constitution",
    contextType: type,
    contextValue,
    contextualWeight: 1.0,
    confidenceScore: 0.8,
    usefulnessScore: 75,
    constitutionalSource: true,
    ...overrides,
  };
}

export default {
  buildDecisionSignalProfile,
  buildDecisionSignalProfiles,
  summarizeDecisionSignalProfiles,
  createContextRowFromConstitution,
};