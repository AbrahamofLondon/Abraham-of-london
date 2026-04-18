import {
  deriveConstitutionalAssessment,
  type ConstitutionalIntake,
} from "@/lib/decision/system-constitution";
import { evaluateConstitutionalRoute } from "@/lib/constitution/rules";
import { applyRecommendationGovernance } from "@/lib/decision/recommendation-governance";
import type { MatchedAsset as GovernanceMatchedAsset } from "@/lib/decision/asset-matcher";
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
  assetLimit?: number;
  minAssetScore?: number;
  source?: string;
  options?: {
    assetLimit?: number;
    minAssetScore?: number;
    maxPerKind?: number;
    minDiversityKinds?: number;
    includeDiagnostics?: boolean;
  };
};

/** @deprecated Use ConstitutionalAssemblerOutput */
export type UnifiedGuidancePayload = ConstitutionalAssemblerOutput;

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
    selectedKinds: string[];
    diversitySatisfied: boolean;
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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
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

// Per-directory loader — avoids any webpack-visible reference to
// `contentlayer/generated`. Every static or dynamic import of that
// barrel pulls 16 collections' JSON into the server chunks via
// webpack's `{ type: "json" }` static resolution, and this file was
// transitively reachable from ~12 build-time routes (executive-report-
// service -> ... -> constitutional-guidance-assembler), which was one
// of the primary contributors to the ~127 MB of inlined Contentlayer
// JSON measured in `.next/server/chunks/`.
//
// `eval("require")` hides the fs/path requires from webpack's static
// analyzer; the JSON itself is read at runtime from disk, and Next's
// file tracer copies `.contentlayer/generated/**/_index.json` into the
// deployed function package because the trace-exclude that used to
// strip those files has been removed from next.config.mjs.
const _catalogBucketCache = new Map<string, any[]>();

function loadCatalogBucket(dirName: string): any[] {
  if (typeof window !== "undefined") return [];
  const cached = _catalogBucketCache.get(dirName);
  if (cached) return cached;

  try {
    // eslint-disable-next-line no-eval
    const req = eval("require") as NodeRequire;
    const fs = req("fs") as typeof import("fs");
    const path = req("path") as typeof import("path");

    const filePath = path.join(
      process.cwd(),
      ".contentlayer",
      "generated",
      dirName,
      "_index.json",
    );

    if (!fs.existsSync(filePath)) {
      _catalogBucketCache.set(dirName, []);
      return [];
    }

    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);

    let docs: any[] = [];
    if (Array.isArray(parsed)) docs = parsed;
    else if (parsed && typeof parsed === "object") {
      const obj = parsed as Record<string, unknown>;
      if (Array.isArray(obj.documents)) docs = obj.documents as any[];
      else if (Array.isArray(obj.allDocuments)) docs = obj.allDocuments as any[];
    }

    _catalogBucketCache.set(dirName, docs);
    return docs;
  } catch (error) {
    console.warn(
      `[constitutional-guidance-assembler] failed to load bucket "${dirName}"`,
      error,
    );
    _catalogBucketCache.set(dirName, []);
    return [];
  }
}

function normalizeConstitutionalIntake(
  intake: Record<string, unknown>,
): ConstitutionalIntake {
  const governance = getRecord(intake.governance);
  const economics = getRecord(intake.economics);

  return {
    fullName: safeString(intake.fullName),
    email: safeString(intake.email),
    organisation: safeString(intake.organisation),
    sector: safeString(intake.sector, "institutional"),
    revenueBand: safeString(intake.revenueBand || economics.revenueBand, "SMB"),
    authorityRole: safeString(
      intake.authorityRole || intake.role || governance.sponsorNameOrSeat,
      "Executive sponsor",
    ),
    authorityScope: safeString(
      intake.authorityScope || governance.authorityScope,
      "UNCLEAR",
    ),
    urgencyWindow: safeString(
      intake.urgencyWindow || economics.decisionWindow,
      "NEAR_TERM",
    ),
    problemStatement: safeString(intake.problemStatement),
    symptoms: safeString(intake.symptoms),
    desiredOutcome: safeString(intake.desiredOutcome),
    currentConstraint: safeString(intake.currentConstraint),
    marketExposure: safeString(
      intake.marketExposure || economics.marketExposure,
      "MEDIUM",
    ),
    boardInvolved: safeString(
      intake.boardInvolved || governance.boardInvolved,
      "UNCERTAIN",
    ),
  };
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
  const buckets: Array<{ key: string; docs: any[] }> = [
    { key: "Download", docs: loadCatalogBucket("Download") },
    { key: "Playbook", docs: loadCatalogBucket("Playbook") },
    { key: "Brief", docs: loadCatalogBucket("Brief") },
    { key: "VaultBrief", docs: loadCatalogBucket("VaultBrief") },
    { key: "Intelligence", docs: loadCatalogBucket("Intelligence") },
    { key: "Resource", docs: loadCatalogBucket("Resource") },
    { key: "Book", docs: loadCatalogBucket("Book") },
    { key: "Canon", docs: loadCatalogBucket("Canon") },
    { key: "Strategy", docs: loadCatalogBucket("Strategy") },
    { key: "Vault", docs: loadCatalogBucket("Vault") },
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

function buildConstitutionFromIntake(
  intake: Record<string, unknown>,
): ExecutiveReportConstitution {
  const canonicalIntake = normalizeConstitutionalIntake(intake);
  const derived = deriveConstitutionalAssessment(canonicalIntake);
  const routeDecision = evaluateConstitutionalRoute({
    clarityScore: derived.clarityScore,
    authorityType: derived.authorityType,
    readinessTier: derived.readinessTier,
    posture: derived.orgState,
    failureModeCount: derived.failureModes.length,
    failureModeSeverity: clamp(Math.round(derived.severityScore / 10), 0, 10),
    narrativeCoherence: clamp(
      Math.round(derived.clarityScore * 0.72 + derived.governanceScore * 0.28),
      0,
      100,
    ),
    interventionReadiness: clamp(
      Math.round(
        derived.governanceScore * 0.4 +
          derived.clarityScore * 0.35 +
          derived.authorityScore * 0.25,
      ),
      0,
      100,
    ),
    mandateFit:
      canonicalIntake.problemStatement.length >= 80 &&
      canonicalIntake.desiredOutcome.length >= 30,
    seriousnessScore: clamp(
      Math.round(
        derived.severityScore * 0.45 +
          derived.revenueScore * 0.2 +
          derived.governanceScore * 0.2 +
          derived.clarityScore * 0.15,
      ),
      0,
      100,
    ),
    trustCondition: derived.failureModes.some((mode) => /trust/i.test(mode))
      ? 34
      : 62,
    governanceDiscipline: derived.governanceScore,
  });

  const requiredInterventions = uniqueStrings([
    ...derived.requiredInterventions,
    ...routeDecision.recommendedInterventions,
  ]);

  const rationale = uniqueStrings([
    ...derived.rationale,
    ...routeDecision.rationale,
  ]);

  return {
    route: safeString(routeDecision.route, derived.route || "DIAGNOSTIC") as import("@/lib/admin/reporting/types").ConstitutionalRoute,
    confidence: safeNumber(routeDecision.confidence, 0.5),
    priority: safeString(derived.priority, "MEDIUM") as import("@/lib/admin/reporting/types").ExecutiveReportPriority,
    temperature: safeString(derived.temperature, "WARM") as import("@/lib/admin/reporting/types").ExecutiveReportTemperature,
    orgState: safeString(derived.orgState, "DRIFTING") as import("@/lib/admin/reporting/types").ExecutiveReportState,
    posture: safeString(derived.orgState, "DRIFTING") as import("@/lib/admin/reporting/types").ExecutiveReportState,
    readinessTier: safeString(derived.readinessTier, "EMERGING") as import("@/lib/admin/reporting/types").ExecutiveReportReadinessTier,
    authorityType: safeString(derived.authorityType, "UNCLEAR") as import("@/lib/admin/reporting/types").ExecutiveReportAuthorityType,
    revenueBand: safeString(derived.revenueBand, "SMB") as import("@/lib/admin/reporting/types").ExecutiveReportRevenueBand,
    marketRiskBand: safeString(derived.marketRiskBand, "MODERATE") as import("@/lib/admin/reporting/types").ExecutiveReportMarketRiskBand,
    clarityScore: safeNumber(derived.clarityScore, 50),
    authorityScore: safeNumber(derived.authorityScore, 50),
    governanceScore: safeNumber(derived.governanceScore, 50),
    severityScore: safeNumber(derived.severityScore, 50),
    revenueScore: safeNumber(derived.revenueScore, 50),
    dominantDomains: uniqueStrings(derived.dominantDomains || []),
    failureModes: uniqueStrings(derived.failureModes || []),
    requiredInterventions,
    sponsorTypes: uniqueStrings(derived.sponsorTypes || []),
    worldviewAnchors: uniqueStrings(derived.worldviewAnchors || []),
    disqualifiersTriggered: uniqueStrings(routeDecision.disqualifiersTriggered || []),
    escalationAllowed: Boolean(routeDecision.escalationAllowed),
    narrativeSummary: safeString(derived.narrativeSummary, ""),
    rationale,
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

function scoreAsset(
  asset: CatalogItem,
  constitution: ExecutiveReportConstitution,
): MatchedAsset {
  const haystack = normalizeText(
    [
      asset.title,
      asset.description,
      asset.category,
      ...(asset.tags || []),
      asset.body || "",
    ].join(" "),
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
      score += 16;
      reasons.push("Preferred for strategy route");
    }
    if (asset.kind === "brief" || asset.kind === "intelligence") {
      score += 6;
      reasons.push("Supports strategy escalation");
    }
  }

  if (constitution.route === "DIAGNOSTIC") {
    if (asset.kind === "playbook" || asset.kind === "download") {
      score += 16;
      reasons.push("Preferred for diagnostic route");
    }
    if (asset.kind === "brief" || asset.kind === "intelligence") {
      score += 8;
      reasons.push("Supports diagnostic clarification");
    }
  }

  if (constitution.route === "REJECT") {
    if (asset.kind === "download" || asset.kind === "playbook") {
      score += 10;
      reasons.push("Corrective asset suitable before escalation");
    }
    if (asset.kind === "strategy") {
      score -= 20;
      reasons.push("Strategy asset penalized for reject route");
    }
  }

  if (constitution.readinessTier === "FRAGILE") {
    if (asset.kind === "download" || asset.kind === "playbook") {
      score += 10;
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

function dedupeRecommendations(
  recommendations: ExecutiveReportRecommendation[],
): ExecutiveReportRecommendation[] {
  const seen = new Set<string>();
  const out: ExecutiveReportRecommendation[] = [];

  for (const item of recommendations) {
    const key = `${item.id}::${item.title}::${item.kind}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }

  return out;
}

function summarizeGuidance(
  constitution: ExecutiveReportConstitution,
  recommendations: ExecutiveReportRecommendation[],
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
    rationale: uniqueStrings(constitution.rationale || []),
    nextAction,
    recommendations: dedupeRecommendations(recommendations),
  };
}

export async function assembleConstitutionalGuidance(
  input: ConstitutionalAssemblerInput,
): Promise<ConstitutionalAssemblerOutput> {
  const constitution =
    input.constitution || buildConstitutionFromIntake(input.intake || {});

  const assetLimit =
    input.options?.assetLimit ?? input.assetLimit ?? 6;

  const minAssetScore =
    input.options?.minAssetScore ?? input.minAssetScore ?? 12;

  const maxPerKind = input.options?.maxPerKind ?? 2;
  const minDiversityKinds = input.options?.minDiversityKinds ?? 2;

  const assetCatalog = await loadAssetCatalog();

  const scoredAssets = assetCatalog
    .map((asset) => scoreAsset(asset, constitution))
    .filter((asset) => asset.matchScore >= minAssetScore)
    .sort((a, b) => b.matchScore - a.matchScore);

  const preliminaryRecommendations: ExecutiveReportRecommendation[] =
    scoredAssets.map((asset) => ({
      id: asset.id,
      title: asset.title,
      href: asset.href,
      kind: asset.kind,
      score: asset.matchScore,
      summary: safeString(asset.description, "Governed recommendation."),
      reasons: uniqueStrings(asset.matchReasons),
    }));

  const governanceResult = applyRecommendationGovernance(
    scoredAssets as GovernanceMatchedAsset[],
    constitution as any,
  );

  const kindCounts = new Map<string, number>();
  const selected: ExecutiveReportRecommendation[] = [];

  for (const item of governanceResult.governed) {
    if (selected.length >= assetLimit) break;

    const currentKindCount = kindCounts.get(item.kind) || 0;
    if (currentKindCount >= maxPerKind) continue;

    selected.push(item as any);
    kindCounts.set(item.kind, currentKindCount + 1);
  }

  const selectedKinds = [...new Set(selected.map((item) => item.kind))];
  const diversitySatisfied = selectedKinds.length >= minDiversityKinds;

  const finalRecommendations = diversitySatisfied
    ? selected
    : (governanceResult.governed.slice(0, Math.max(2, assetLimit)) as any[]);

  const guidance = summarizeGuidance(constitution, finalRecommendations as any);

  return {
    ok: true,
    constitution,
    guidance,
    diagnostics: {
      assetPoolSize: assetCatalog.length,
      matchedAssetCount: scoredAssets.length,
      governanceRuleCount: governanceResult.decisions.length,
      governanceSuppressedCount: governanceResult.suppressed.length,
      adaptiveAssetsLoaded: scoredAssets.length,
      contextualAssetsLoaded: finalRecommendations.length,
      selectedKinds,
      diversitySatisfied,
    },
  };
}
