// lib/decision/content-asset-adapter.ts
// ============================================================================
// CONTENT ASSET ADAPTER — HARDENED
// Real repo content -> decision assets with metadata precedence + confidence
// ============================================================================

import * as Generated from "contentlayer/generated";
import type { MatchedAsset } from "@/lib/decision/asset-matcher";
import type {
  AssetKind,
  DecisionFailureMode,
  DecisionIntervention,
  DominantDomain,
  OrgState,
  ReadinessTier,
  RevenueBand,
  RiskBand,
  SectorTaxonomy,
  WorldviewAnchor,
  CommercialUseCase,
  DecisionAudience,
  TransformationStage,
} from "@/lib/decision/decision-metadata";
import { extractDecisionMetadataFromDoc } from "@/lib/decision/content-metadata-extractor";

export interface DecisionAsset {
  id: string;
  title: string;
  kind: AssetKind;
  href?: string;
  summary?: string;

  appliesTo?: string[];
  sectors?: SectorTaxonomy[];
  revenueBands?: RevenueBand[];
  orgStates?: OrgState[];
  readinessTiers?: ReadinessTier[];
  failureModes?: DecisionFailureMode[];
  dominantDomains?: DominantDomain[];
  requiredInterventions?: DecisionIntervention[];
  marketRiskBands?: RiskBand[];
  priorityWeight?: number;
  confidenceWeight?: number;
  tags?: string[];

  // New fields for moral-philosophical layer
  worldviewAnchors?: WorldviewAnchor[];
  commercialUseCases?: CommercialUseCase[];
  audience?: DecisionAudience[];
  transformationStage?: TransformationStage[];

  metadataConfidence: number;
  metadataWarnings?: string[];
}

type UnknownDoc = Record<string, unknown>;

type SourceBucketName =
  | "allBriefs"
  | "allVaultBriefs"
  | "allPlaybooks"
  | "allStrategy"
  | "allCanon"
  | "allIntelligence"
  | "allResources"
  | "allDownloads";

const BUCKET_KIND_MAP: Record<SourceBucketName, AssetKind> = {
  allBriefs: "brief",
  allVaultBriefs: "brief",
  allPlaybooks: "playbook",
  allStrategy: "framework",
  allCanon: "doctrine",
  allIntelligence: "brief",
  allResources: "framework",
  allDownloads: "report-module",
};

const SOURCE_BUCKETS: SourceBucketName[] = [
  "allBriefs",
  "allVaultBriefs",
  "allPlaybooks",
  "allStrategy",
  "allCanon",
  "allIntelligence",
  "allResources",
  "allDownloads",
];

const HEURISTIC_FAILURE_MODE_MAP: Array<{ needle: string; value: DecisionFailureMode }> = [
  { needle: "misalignment", value: "Strategic-operational misalignment" },
  { needle: "disorder", value: "Systemic structural disorder" },
  { needle: "burnout", value: "Execution fragility" },
  { needle: "attrition", value: "Execution fragility" },
  { needle: "authority", value: "Decision-rights ambiguity" },
  { needle: "governance", value: "Governance breakdown" },
  { needle: "cadence", value: "Operating cadence decay" },
  { needle: "trust", value: "Trust erosion" },
  { needle: "capital", value: "Capital allocation distortion" },
  { needle: "narrative", value: "Narrative incoherence" },
];

const HEURISTIC_INTERVENTION_MAP: Array<{ needle: string; value: DecisionIntervention }> = [
  { needle: "stabilize", value: "Stabilize operating environment" },
  { needle: "clarify", value: "Clarify decision owner and sponsor" },
  { needle: "priority", value: "Re-sequence strategic priorities" },
  { needle: "burnout", value: "Reduce execution strain before transformation load" },
  { needle: "volatility", value: "Adjust decision horizon for external volatility" },
  { needle: "strategy room", value: "Escalate to strategy-room review" },
  { needle: "diagnostic", value: "Run guided diagnostic before escalation" },
  { needle: "governance", value: "Restore governance discipline" },
  { needle: "cadence", value: "Tighten operating cadence" },
];

const HEURISTIC_DOMAIN_MAP: Array<{ needle: string; value: DominantDomain }> = [
  { needle: "strategic intent", value: "STRATEGIC_INTENT" },
  { needle: "operational clarity", value: "OPERATIONAL_CLARITY" },
  { needle: "leadership trust", value: "LEADERSHIP_TRUST" },
  { needle: "cultural cohesion", value: "CULTURAL_COHESION" },
  { needle: "governance", value: "GOVERNANCE" },
  { needle: "board", value: "BOARD" },
  { needle: "cadence", value: "OPERATING_CADENCE" },
  { needle: "decision", value: "DECISION_QUALITY" },
  { needle: "trust", value: "TRUST" },
  { needle: "execution", value: "EXECUTION" },
  { needle: "alignment", value: "ALIGNMENT" },
];

function safeString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function safeArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => safeString(v).trim()).filter(Boolean);
  }
  const raw = safeString(value).trim();
  if (!raw) return [];
  if (raw.includes(",")) return raw.split(",").map((v) => v.trim()).filter(Boolean);
  return [raw];
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function getDocId(doc: UnknownDoc): string {
  return (
    safeString(doc.id) ||
    safeString(doc._id) ||
    safeString(doc.slugSafe) ||
    safeString(doc.slug) ||
    safeString(doc.hrefSafe) ||
    safeString(doc.href) ||
    safeString(doc.titleSafe) ||
    safeString(doc.title) ||
    "untitled-asset"
  );
}

function getDocTitle(doc: UnknownDoc): string {
  return (
    safeString(doc.titleSafe).trim() ||
    safeString(doc.title).trim() ||
    safeString(doc.term).trim() ||
    "Untitled Asset"
  );
}

function getDocHref(doc: UnknownDoc): string | undefined {
  const href =
    safeString(doc.hrefSafe).trim() ||
    safeString(doc.href).trim();
  return href || undefined;
}

function getDocSummary(doc: UnknownDoc): string {
  return (
    safeString(doc.excerptSafe).trim() ||
    safeString(doc.excerpt).trim() ||
    safeString(doc.description).trim() ||
    safeString(doc.subtitle).trim()
  );
}

function getDocCorpus(doc: UnknownDoc): string {
  return [
    safeString(doc.titleSafe),
    safeString(doc.title),
    safeString(doc.subtitle),
    safeString(doc.description),
    safeString(doc.excerpt),
    safeString(doc.excerptSafe),
    safeArray(doc.tags).map((v) => safeString(v)).join(" "),
    safeArray(doc.signals).map((v) => safeString(v)).join(" "),
    safeArray(doc.outputs).map((v) => safeString(v)).join(" "),
    safeArray(doc.phases).map((v) => safeString(v)).join(" "),
    safeString(doc.framework),
    safeString(doc.playbookType),
    safeString(doc.docKind),
    safeString(doc.category),
  ]
    .join(" ")
    .toLowerCase();
}

function inferFailureModes(corpus: string): DecisionFailureMode[] {
  return unique(
    HEURISTIC_FAILURE_MODE_MAP
      .filter((row) => corpus.includes(row.needle))
      .map((row) => row.value)
  );
}

function inferRequiredInterventions(corpus: string): DecisionIntervention[] {
  return unique(
    HEURISTIC_INTERVENTION_MAP
      .filter((row) => corpus.includes(row.needle))
      .map((row) => row.value)
  );
}

function inferDominantDomains(corpus: string): DominantDomain[] {
  return unique(
    HEURISTIC_DOMAIN_MAP
      .filter((row) => corpus.includes(row.needle))
      .map((row) => row.value)
  );
}

export function inferMetadataConfidence(args: {
  hasExplicitMetadata: boolean;
  fieldCount: number;
  warningsCount: number;
}): number {
  let score = 0;

  if (args.hasExplicitMetadata) score += 55;
  score += Math.min(35, args.fieldCount * 5);
  score -= Math.min(20, args.warningsCount * 4);

  return Math.max(0, Math.min(100, score));
}

function countMetadataFields(metadata: {
  appliesTo?: unknown[];
  sectors?: unknown[];
  revenueBands?: unknown[];
  orgStates?: unknown[];
  readinessTiers?: unknown[];
  failureModes?: unknown[];
  dominantDomains?: unknown[];
  requiredInterventions?: unknown[];
  marketRiskBands?: unknown[];
  sponsorTypes?: unknown[];
  worldviewAnchors?: unknown[];
  commercialUseCases?: unknown[];
  audience?: unknown[];
  transformationStage?: unknown[];
}): number {
  const values = [
    metadata.appliesTo,
    metadata.sectors,
    metadata.revenueBands,
    metadata.orgStates,
    metadata.readinessTiers,
    metadata.failureModes,
    metadata.dominantDomains,
    metadata.requiredInterventions,
    metadata.marketRiskBands,
    metadata.sponsorTypes,
    metadata.worldviewAnchors,
    metadata.commercialUseCases,
    metadata.audience,
    metadata.transformationStage,
  ];

  return values.filter((v) => Array.isArray(v) && v.length > 0).length;
}

function buildAssetFromDoc(doc: UnknownDoc, kind: AssetKind): DecisionAsset {
  const parsed = extractDecisionMetadataFromDoc(doc);
  const normalized = parsed.metadata;
  const corpus = getDocCorpus(doc);
  const explicitTagList = stringList(doc.tags);

  const fieldCount = countMetadataFields(normalized);

  const failureModes =
    normalized.failureModes.length > 0
      ? normalized.failureModes
      : inferFailureModes(corpus);

  const requiredInterventions =
    normalized.requiredInterventions.length > 0
      ? normalized.requiredInterventions
      : inferRequiredInterventions(corpus);

  const dominantDomains =
    normalized.dominantDomains.length > 0
      ? normalized.dominantDomains
      : inferDominantDomains(corpus);

  const hasExplicitMetadata =
    fieldCount > 0 || typeof normalized.assetKind !== "undefined";

  return {
    id: getDocId(doc),
    title: getDocTitle(doc),
    kind: normalized.assetKind ?? kind,
    href: getDocHref(doc),
    summary: getDocSummary(doc),
    appliesTo: normalized.appliesTo,
    sectors: normalized.sectors,
    revenueBands: normalized.revenueBands,
    orgStates: normalized.orgStates,
    readinessTiers: normalized.readinessTiers,
    failureModes,
    dominantDomains,
    requiredInterventions,
    marketRiskBands: normalized.marketRiskBands,
    priorityWeight: normalized.priorityWeight,
    confidenceWeight: normalized.confidenceWeight,
    tags: explicitTagList,
    // New fields for moral-philosophical layer
    worldviewAnchors: normalized.worldviewAnchors,
    commercialUseCases: normalized.commercialUseCases,
    audience: normalized.audience,
    transformationStage: normalized.transformationStage,
    metadataConfidence: inferMetadataConfidence({
      hasExplicitMetadata,
      fieldCount,
      warningsCount: parsed.validation.warnings.length,
    }),
    metadataWarnings: parsed.validation.warnings,
  };
}

function getBucketDocs(bucketName: SourceBucketName): UnknownDoc[] {
  const bucket = (Generated as Record<string, unknown>)[bucketName];
  return Array.isArray(bucket) ? (bucket as UnknownDoc[]) : [];
}

export function getAllDecisionAssetsFromContent(): DecisionAsset[] {
  const out: DecisionAsset[] = [];
  const seen = new Set<string>();

  for (const bucketName of SOURCE_BUCKETS) {
    const docs = getBucketDocs(bucketName);
    const defaultKind = BUCKET_KIND_MAP[bucketName];

    for (const doc of docs) {
      const asset = buildAssetFromDoc(doc, defaultKind);
      const key = `${asset.kind}:${asset.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(asset);
    }
  }

  return out;
}

export function getDecisionAssetsWithLowConfidence(threshold = 50): DecisionAsset[] {
  return getAllDecisionAssetsFromContent()
    .filter((asset) => asset.metadataConfidence < threshold)
    .sort((a, b) => a.metadataConfidence - b.metadataConfidence);
}
