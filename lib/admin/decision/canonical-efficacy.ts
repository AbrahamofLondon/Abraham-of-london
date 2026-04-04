// lib/admin/decision/canonical-efficacy.ts

import type {
  CanonicalSections,
  CanonicalSectionsEnvelope,
  CanonicalRecommendation,
} from "@/lib/decision/canonical-sections";

type UnknownRecord = Record<string, unknown>;

export type CanonicalSnapshotLike =
  | CanonicalSectionsEnvelope
  | {
      schemaVersion?: string;
      capturedAt?: string;
      source?: string;
      sessionKey?: string | null;
      sections?: CanonicalSections;
    }
  | null
  | undefined;

export type CanonicalPerformanceContext = {
  route: string;
  priority: string;
  temperature: string;
  orgState: string;
  readinessTier: string;
  authorityType: string;
  revenueBand: string;
  marketRiskBand: string;

  dominantDomains: string[];
  failureModes: string[];
  requiredInterventions: string[];
  sponsorTypes: string[];
  worldviewAnchors: string[];

  clarityScore: number;
  authorityScore: number;
  governanceScore: number;
  severityScore: number;
  revenueScore: number;
};

export type CanonicalRecommendationExposure = {
  assetId: string;
  title: string;
  href?: string | null;
  kind: string;
  score: number;
  summary: string;
  reasons: string[];
  rank?: number | null;
};

export type CanonicalSessionProjection = {
  sessionKey: string;
  context: CanonicalPerformanceContext;
  recommendations: CanonicalRecommendationExposure[];
};

function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : fallback;
  }
  return fallback;
}

function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function safeStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => safeString(item)).filter(Boolean)
    : [];
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

export function getCanonicalSections(
  snapshot: CanonicalSnapshotLike
): CanonicalSections | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  const record = snapshot as UnknownRecord;
  const sections = record.sections;
  if (!sections || typeof sections !== "object") return null;
  return sections as CanonicalSections;
}

export function getCanonicalPerformanceContext(
  snapshot: CanonicalSnapshotLike
): CanonicalPerformanceContext | null {
  const sections = getCanonicalSections(snapshot);
  if (!sections) return null;

  const posture = asRecord(sections.constitutionalPosture);

  return {
    route: safeString(posture.route, "UNKNOWN"),
    priority: safeString(posture.priority, "UNKNOWN"),
    temperature: safeString(posture.temperature, "UNKNOWN"),
    orgState: safeString(posture.orgState, "UNKNOWN"),
    readinessTier: safeString(posture.readinessTier, "UNKNOWN"),
    authorityType: safeString(posture.authorityType, "UNKNOWN"),
    revenueBand: safeString(posture.revenueBand, "UNKNOWN"),
    marketRiskBand: safeString(posture.marketRiskBand, "UNKNOWN"),

    dominantDomains: safeStringArray(posture.dominantDomains),
    failureModes: safeStringArray(posture.failureModes),
    requiredInterventions: safeStringArray(posture.requiredInterventions),
    sponsorTypes: safeStringArray(posture.sponsorTypes),
    worldviewAnchors: safeStringArray(posture.worldviewAnchors),

    clarityScore: safeNumber(posture.clarityScore),
    authorityScore: safeNumber(posture.authorityScore),
    governanceScore: safeNumber(posture.governanceScore),
    severityScore: safeNumber(posture.severityScore),
    revenueScore: safeNumber(posture.revenueScore),
  };
}

export function getCanonicalRecommendations(
  snapshot: CanonicalSnapshotLike
): CanonicalRecommendationExposure[] {
  const sections = getCanonicalSections(snapshot);
  if (!sections) return [];

  const block = asRecord(sections.governedRecommendations);
  const recommendations = Array.isArray(block.recommendations)
    ? (block.recommendations as CanonicalRecommendation[])
    : [];

  return recommendations.map((item, idx) => {
    const rec = asRecord(item);
    return {
      assetId: safeString(rec.id),
      title: safeString(rec.title, "Untitled asset"),
      href:
        typeof rec.href === "string" && rec.href.trim().length
          ? rec.href.trim()
          : null,
      kind: safeString(rec.kind, "guidance"),
      score: safeNumber(rec.score),
      summary: safeString(rec.summary),
      reasons: safeStringArray(rec.reasons),
      rank: idx + 1,
    };
  });
}

export function projectSessionFromCanonicalSnapshot(args: {
  sessionKey: string;
  snapshot: CanonicalSnapshotLike;
}): CanonicalSessionProjection | null {
  const context = getCanonicalPerformanceContext(args.snapshot);
  if (!context) return null;

  const recommendations = getCanonicalRecommendations(args.snapshot);

  return {
    sessionKey: args.sessionKey,
    context,
    recommendations,
  };
}

export function buildContextualJoinKey(context: CanonicalPerformanceContext): string {
  return [
    context.route || "UNKNOWN",
    context.readinessTier || "UNKNOWN",
    context.authorityType || "UNKNOWN",
    context.revenueBand || "UNKNOWN",
    context.marketRiskBand || "UNKNOWN",
    context.orgState || "UNKNOWN",
  ].join("::");
}

export function buildContextualBreakdown(context: CanonicalPerformanceContext) {
  return {
    route: context.route,
    readinessTier: context.readinessTier,
    authorityType: context.authorityType,
    revenueBand: context.revenueBand,
    marketRiskBand: context.marketRiskBand,
    orgState: context.orgState,
    dominantDomains: context.dominantDomains,
    failureModes: context.failureModes,
    requiredInterventions: context.requiredInterventions,
    sponsorTypes: context.sponsorTypes,
    worldviewAnchors: context.worldviewAnchors,
    clarityScore: context.clarityScore,
    authorityScore: context.authorityScore,
    governanceScore: context.governanceScore,
    severityScore: context.severityScore,
    revenueScore: context.revenueScore,
  };
}