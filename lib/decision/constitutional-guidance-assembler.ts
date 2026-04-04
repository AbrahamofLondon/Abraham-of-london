// lib/decision/constitutional-guidance-assembler.ts

import { deriveConstitutionalAssessment } from "@/lib/decision/system-constitution";
import { applyRecommendationGovernance } from "@/lib/decision/recommendation-governance";
import type {
  ExecutiveReportConstitution,
  ExecutiveReportGuidance,
  ExecutiveReportRecommendation,
} from "@/lib/admin/reporting/types";

type AssetKind =
  | "download"
  | "playbook"
  | "brief"
  | "intelligence"
  | "resource"
  | "book"
  | "canon"
  | "strategy"
  | "vault"
  | "unknown";

export type ConstitutionalAssemblerInput = {
  intake?: Record<string, unknown>;
  constitution?: ExecutiveReportConstitution;
  options?: {
    assetLimit?: number;
    minAssetScore?: number;
    maxPerKind?: number;
    minDiversityKinds?: number;
    includeDiagnostics?: boolean;
  };
};

export type ConstitutionalAssemblerOutput = {
  ok: true;
  constitution: ExecutiveReportConstitution;
  guidance: ExecutiveReportGuidance;
  diagnostics: {
    assetPoolSize: number;
    matchedAssetCount: number;
    governanceRuleCount: number;
    governanceSuppressedCount: number;
    adaptiveAssetsLoaded: number;
    contextualAssetsLoaded: number;
  };
};

type CatalogItem = {
  id: string;
  title: string;
  href?: string | null;
  kind: AssetKind;
  description: string;
  tags: string[];
  category?: string;
  body?: string;
};

type MatchedAsset = {
  id: string;
  title: string;
  href?: string | null;
  kind: string;
  description?: string;
  matchScore: number;
  matchReasons: string[];
  rankingTrace?: {
    contextualWeights?: Array<{
      contextType: string;
      contextValue: string;
      weight: number;
      confidenceScore?: number;
    }>;
  };
};

function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : fallback;
  }
  return fallback;
}

function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function normalizeText(value: unknown): string {
  return safeString(value).toLowerCase();
}

function uniqueStrings(values: unknown[]): string[] {
  return [...new Set(values.map((v) => safeString(v)).filter(Boolean))];
}

function kindFromDocType(docType: string): AssetKind {
  const key = normalizeText(docType);
  if (key.includes("download")) return "download";
  if (key.includes("playbook")) return "playbook";
  if (key.includes("brief")) return "brief";
  if (key.includes("intelligence")) return "intelligence";
  if (key.includes("resource")) return "resource";
  if (key.includes("book")) return "book";
  if (key.includes("canon")) return "canon";
  if (key.includes("strategy")) return "strategy";
  if (key.includes("vault")) return "vault";
  return "unknown";
}

async function loadContentlayerGenerated(): Promise<any | null> {
  try {
    return await import("contentlayer/generated");
  } catch {
    try {
      return await import("../../.contentlayer/generated/index.mjs");
    } catch {
      return null;
    }
  }
}

function pickHref(doc: any): string | null {
  return (
    safeString(doc?.hrefSafe) ||
    safeString(doc?.href) ||
    safeString(doc?.slug) ||
    safeString(doc?.url) ||
    null
  );
}

function pickDescription(doc: any): string {
  return (
    safeString(doc?.description) ||
    safeString(doc?.excerpt) ||
    safeString(doc?.summary) ||
    safeString(doc?.subtitle) ||
    ""
  );
}

function normalizeDoc(doc: any, sourceType: string): CatalogItem | null {
  const id =
    safeString(doc?._id) ||
    safeString(doc?.slug) ||
    safeString(doc?.hrefSafe) ||
    safeString(doc?.title);

  const title = safeString(doc?.title);

  if (!id || !title) return null;

  return {
    id,
    title,
    href: pickHref(doc),
    kind: kindFromDocType(sourceType),
    description: pickDescription(doc),
    tags: Array.isArray(doc?.tags) ? uniqueStrings(doc.tags) : [],
    category: safeString(doc?.category),
    body: safeString(doc?.body?.raw || ""),
  };
}

async function loadAssetCatalog(): Promise<CatalogItem[]> {
  const generated = await loadContentlayerGenerated();
  if (!generated) return [];

  const buckets: Array<{ key: string; docs: any[] }> = [
    { key: "Download", docs: generated.allDownloads || [] },
    { key: "Playbook", docs: generated.allPlaybooks || [] },
    { key: "Brief", docs: generated.allBriefs || [] },
    { key: "VaultBrief", docs: generated.allVaultBriefs || [] },
    { key: "Intelligence", docs: generated.allIntelligence || [] },
    { key: "Resource", docs: generated.allResources || [] },
    { key: "Book", docs: generated.allBooks || [] },
    { key: "Canon", docs: generated.allCanon || [] },
    { key: "Strategy", docs: generated.allStrategy || [] },
    { key: "Vault", docs: generated.allVaults || [] },
  ];

  const items: CatalogItem[] = [];
  const seen = new Set<string>();

  for (const bucket of buckets) {
    for (const doc of bucket.docs) {
      const normalized = normalizeDoc(doc, bucket.key);
      if (!normalized) continue;
      if (seen.has(normalized.id)) continue;
      seen.add(normalized.id);
      items.push(normalized);
    }
  }

  return items;
}

function buildConstitutionFromIntake(intake: Record<string, unknown>): ExecutiveReportConstitution {
  const derived = deriveConstitutionalAssessment(intake as any);

  return {
    route: safeString(derived.route, "DIAGNOSTIC"),
    priority: safeString(derived.priority, "MEDIUM"),
    temperature: safeString(derived.temperature, "WARM"),
    orgState: safeString(derived.orgState, "DRIFTING"),
    readinessTier: safeString(derived.readinessTier, "EMERGING"),
    authorityType: safeString(derived.authorityType, "UNCLEAR"),
    revenueBand: safeString(derived.revenueBand, "SMB"),
    marketRiskBand: safeString(derived.marketRiskBand, "MODERATE"),
    clarityScore: safeNumber(derived.clarityScore, 50),
    authorityScore: safeNumber(derived.authorityScore, 50),
    governanceScore: safeNumber(derived.governanceScore, 50),
    severityScore: safeNumber(derived.severityScore, 50),
    revenueScore: safeNumber(derived.revenueScore, 50),
    dominantDomains: Array.isArray(derived.dominantDomains)
      ? uniqueStrings(derived.dominantDomains)
      : [],
    failureModes: Array.isArray(derived.failureModes)
      ? uniqueStrings(derived.failureModes)
      : [],
    requiredInterventions: Array.isArray(derived.requiredInterventions)
      ? uniqueStrings(derived.requiredInterventions)
      : [],
    sponsorTypes: Array.isArray(derived.sponsorTypes)
      ? uniqueStrings(derived.sponsorTypes)
      : [],
    worldviewAnchors: Array.isArray(derived.worldviewAnchors)
      ? uniqueStrings(derived.worldviewAnchors)
      : [],
    narrativeSummary: safeString(derived.narrativeSummary, ""),
    rationale: Array.isArray(derived.rationale)
      ? uniqueStrings(derived.rationale)
      : [],
  };
}

function keywordBag(constitution: ExecutiveReportConstitution): string[] {
  return uniqueStrings([
    constitution.route,
    constitution.priority,
    constitution.temperature,
    constitution.orgState,
    constitution.readinessTier,
    constitution.authorityType,
    constitution.revenueBand,
    constitution.marketRiskBand,
    ...constitution.dominantDomains,
    ...constitution.failureModes,
    ...constitution.requiredInterventions,
    ...constitution.sponsorTypes,
    ...constitution.worldviewAnchors,
  ]);
}

function scoreAsset(asset: CatalogItem, constitution: ExecutiveReportConstitution): MatchedAsset {
  const haystack = normalizeText(
    [
      asset.title,
      asset.description,
      asset.category,
      ...(asset.tags || []),
      asset.body || "",
    ].join(" ")
  );

  const reasons: string[] = [];
  let score = 0;

  const keywords = keywordBag(constitution);

  for (const word of keywords) {
    const keyword = normalizeText(word);
    if (!keyword) continue;

    if (haystack.includes(keyword)) {
      score += 7;
      reasons.push(`Matches constitutional signal: ${word}`);
    }
  }

  if (constitution.route === "STRATEGY") {
    if (asset.kind === "strategy" || asset.kind === "playbook") {
      score += 14;
      reasons.push("Preferred for strategy route");
    }
    if (asset.kind === "download" || asset.kind === "brief") {
      score += 6;
      reasons.push("Useful support asset for strategy route");
    }
  }

  if (constitution.route === "DIAGNOSTIC") {
    if (asset.kind === "playbook" || asset.kind === "download") {
      score += 14;
      reasons.push("Preferred for diagnostic route");
    }
    if (asset.kind === "brief" || asset.kind === "intelligence") {
      score += 7;
      reasons.push("Supports diagnostic clarification");
    }
  }

  if (constitution.route === "REJECT") {
    if (asset.kind === "download" || asset.kind === "playbook") {
      score += 10;
      reasons.push("Corrective asset suitable before escalation");
    }
    if (asset.kind === "strategy") {
      score -= 18;
      reasons.push("Strategy asset penalized for reject route");
    }
  }

  if (constitution.readinessTier === "FRAGILE") {
    if (asset.kind === "download" || asset.kind === "playbook") {
      score += 8;
      reasons.push("Stabilization asset for fragile readiness");
    }
  }

  if (constitution.authorityType === "UNCLEAR" && asset.kind === "strategy") {
    score -= 12;
    reasons.push("Authority unclear for direct strategy asset");
  }

  if (
    haystack.includes("governance") ||
    haystack.includes("stewardship") ||
    haystack.includes("leadership")
  ) {
    score += 5;
    reasons.push("Aligned to governance and stewardship themes");
  }

  if (
    haystack.includes("purpose") ||
    haystack.includes("truth") ||
    haystack.includes("order") ||
    haystack.includes("responsibility")
  ) {
    score += 3;
    reasons.push("Aligned to worldview and moral-order architecture");
  }

  return {
    id: asset.id,
    title: asset.title,
    href: asset.href ?? null,
    kind: asset.kind,
    description: asset.description,
    matchScore: Number(score.toFixed(2)),
    matchReasons: uniqueStrings(reasons),
    rankingTrace: {
      contextualWeights: [
        {
          contextType: "route",
          contextValue: constitution.route,
          weight: constitution.route === "STRATEGY" ? 1.1 : 1,
          confidenceScore: 0.82,
        },
        {
          contextType: "readinessTier",
          contextValue: constitution.readinessTier,
          weight: 1,
          confidenceScore: 0.78,
        },
        {
          contextType: "authorityType",
          contextValue: constitution.authorityType,
          weight: 0.96,
          confidenceScore: 0.74,
        },
      ],
    },
  };
}

function summarizeGuidance(
  constitution: ExecutiveReportConstitution,
  recommendations: ExecutiveReportRecommendation[]
): ExecutiveReportGuidance {
  const nextAction =
    constitution.route === "STRATEGY"
      ? "Proceed to controlled strategy engagement with governance discipline and explicit decision ownership."
      : constitution.route === "DIAGNOSTIC"
      ? "Begin diagnostic correction before escalation, using the highest-fit assets first."
      : "Do not escalate. Stabilize readiness, authority clarity and structural weakness before any strategy access.";

  const summary =
    constitution.narrativeSummary ||
    "Constitutional guidance assembled from route, readiness, authority, failure modes and governed asset fit.";

  return {
    summary,
    rationale: constitution.rationale,
    nextAction,
    recommendations,
  };
}

export async function assembleConstitutionalGuidance(
  input: ConstitutionalAssemblerInput
): Promise<ConstitutionalAssemblerOutput> {
  const constitution = input.constitution || buildConstitutionFromIntake(input.intake || {});
  const options = {
    assetLimit: input.options?.assetLimit ?? 6,
    minAssetScore: input.options?.minAssetScore ?? 12,
    maxPerKind: input.options?.maxPerKind ?? 2,
    minDiversityKinds: input.options?.minDiversityKinds ?? 2,
    includeDiagnostics: input.options?.includeDiagnostics ?? false,
  };

  const assetCatalog = await loadAssetCatalog();
  const scoredAssets: MatchedAsset[] = [];

  for (const asset of assetCatalog) {
    const scored = scoreAsset(asset, constitution);
    if (scored.matchScore >= options.minAssetScore) {
      scoredAssets.push(scored);
    }
  }

  scoredAssets.sort((a, b) => b.matchScore - a.matchScore);

  const selectedAssets: MatchedAsset[] = [];
  const kindCount = new Map<string, number>();

  for (const asset of scoredAssets) {
    if (selectedAssets.length >= options.assetLimit) break;

    const currentKindCount = kindCount.get(asset.kind) || 0;
    if (currentKindCount >= options.maxPerKind) continue;

    selectedAssets.push(asset);
    kindCount.set(asset.kind, currentKindCount + 1);
  }

  const uniqueKinds = new Set(selectedAssets.map((a) => a.kind)).size;
  const diversityMet = uniqueKinds >= options.minDiversityKinds;

  const governanceResult = await applyRecommendationGovernance({
    recommendations: selectedAssets.map((asset) => ({
      id: asset.id,
      title: asset.title,
      href: asset.href,
      kind: asset.kind,
      score: asset.matchScore,
      summary: asset.description || "",
      reasons: asset.matchReasons,
    })),
    constitution,
  });

  const finalRecommendations = diversityMet
    ? governanceResult.filtered
    : governanceResult.filtered.slice(0, Math.max(2, options.assetLimit - 2));

  const guidance = summarizeGuidance(constitution, finalRecommendations);

  return {
    ok: true,
    constitution,
    guidance,
    diagnostics: {
      assetPoolSize: assetCatalog.length,
      matchedAssetCount: scoredAssets.length,
      governanceRuleCount: governanceResult.appliedRules,
      governanceSuppressedCount: governanceResult.suppressedCount,
      adaptiveAssetsLoaded: selectedAssets.length,
      contextualAssetsLoaded: finalRecommendations.length,
    },
  };
}