// lib/decision/metadata-normalizer.ts
// ============================================================================
// METADATA NORMALIZER
// Hardens frontmatter / doc metadata into canonical decision metadata
// ============================================================================

import type {
  DecisionMetadata,
  DecisionMetadataParseResult,
  DecisionMetadataValidation,
  NormalizedDecisionMetadata,
  SectorTaxonomy,
} from "@/lib/decision/decision-metadata";
import {
  ASSET_KINDS,
  AUTHORITY_TYPES,
  DOMINANT_DOMAINS,
  FAILURE_MODES,
  ORG_STATES,
  READINESS_TIERS,
  REQUIRED_INTERVENTIONS,
  REVENUE_BANDS,
  RISK_BANDS,
  SECTOR_ALIASES,
  SECTOR_TAXONOMY,
  WORLDVIEW_ANCHORS,
  COMMERCIAL_USE_CASES,
  DECISION_AUDIENCES,
  TRANSFORMATION_STAGES,
  isInEnum,
} from "@/lib/decision/decision-taxonomy";

function safeString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => safeString(v)).filter(Boolean);
  }

  const raw = safeString(value);
  if (!raw) return [];

  if (raw.includes(",")) {
    return raw.split(",").map((v) => v.trim()).filter(Boolean);
  }

  return [raw];
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const value of values) {
    const key = value.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }

  return out;
}

function normalizeEnumList<T extends string>(
  values: string[],
  enumValues: readonly T[],
  opts?: {
    aliases?: Record<string, T>;
    preserveCase?: boolean;
  }
): T[] {
  const out: T[] = [];

  for (const rawValue of values) {
    const raw = opts?.preserveCase ? rawValue.trim() : rawValue.trim().toUpperCase();
    const aliasKey = rawValue.trim().toLowerCase();

    const aliased = opts?.aliases?.[aliasKey];
    if (aliased) {
      out.push(aliased);
      continue;
    }

    if (isInEnum(raw, enumValues)) {
      out.push(raw);
    }
  }

  return [...new Set(out)];
}

function normalizeSectors(values: string[]): SectorTaxonomy[] {
  const normalized = values
    .map((v) => v.trim().toLowerCase())
    .map((v) => SECTOR_ALIASES[v] ?? (SECTOR_TAXONOMY.includes(v as SectorTaxonomy) ? (v as SectorTaxonomy) : null))
    .filter(Boolean) as SectorTaxonomy[];

  return [...new Set(normalized)];
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

export function normalizeDecisionMetadata(input?: DecisionMetadata | null): DecisionMetadataParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const assetKindRaw = safeString(input?.assetKind).toLowerCase();
  const assetKind =
    assetKindRaw && isInEnum(assetKindRaw, ASSET_KINDS)
      ? assetKindRaw
      : undefined;

  if (safeString(input?.assetKind) && !assetKind) {
    warnings.push(`Unknown assetKind "${safeString(input?.assetKind)}" ignored.`);
  }

  const metadata: NormalizedDecisionMetadata = {
    assetKind,
    appliesTo: uniqueStrings(stringList(input?.appliesTo)),
    sectors: normalizeSectors(stringList(input?.sectors)),
    revenueBands: normalizeEnumList(stringList(input?.revenueBands), REVENUE_BANDS),
    orgStates: normalizeEnumList(stringList(input?.orgStates), ORG_STATES),
    readinessTiers: normalizeEnumList(stringList(input?.readinessTiers), READINESS_TIERS),
    failureModes: normalizeEnumList(stringList(input?.failureModes), FAILURE_MODES, { preserveCase: true }),
    dominantDomains: normalizeEnumList(stringList(input?.dominantDomains), DOMINANT_DOMAINS),
    requiredInterventions: normalizeEnumList(
      stringList(input?.requiredInterventions),
      REQUIRED_INTERVENTIONS,
      { preserveCase: true }
    ),
    marketRiskBands: normalizeEnumList(stringList(input?.marketRiskBands), RISK_BANDS),
    priorityWeight: toNumber(input?.priorityWeight, 0),
    confidenceWeight: toNumber(input?.confidenceWeight, 0),
    decisionTags: uniqueStrings(stringList(input?.decisionTags)),
    sponsorTypes: normalizeEnumList(stringList(input?.sponsorTypes), AUTHORITY_TYPES),
    // New fields for moral-philosophical layer
    worldviewAnchors: normalizeEnumList(
      stringList(input?.worldviewAnchors),
      WORLDVIEW_ANCHORS,
      { preserveCase: true }
    ),
    commercialUseCases: normalizeEnumList(
      stringList(input?.commercialUseCases),
      COMMERCIAL_USE_CASES,
      { preserveCase: true }
    ),
    audience: normalizeEnumList(
      stringList(input?.audience),
      DECISION_AUDIENCES,
      { preserveCase: true }
    ),
    transformationStage: normalizeEnumList(
      stringList(input?.transformationStage),
      TRANSFORMATION_STAGES,
      { preserveCase: true }
    ),
    notes: safeString(input?.notes) || undefined,
  };

  if (metadata.priorityWeight < 0 || metadata.priorityWeight > 25) {
    warnings.push("priorityWeight should typically be between 0 and 25.");
  }

  if (metadata.confidenceWeight < 0 || metadata.confidenceWeight > 25) {
    warnings.push("confidenceWeight should typically be between 0 and 25.");
  }

  if (metadata.assetKind === "playbook" && metadata.requiredInterventions.length === 0) {
    warnings.push("Playbook metadata should usually declare requiredInterventions.");
  }

  if (metadata.assetKind === "doctrine" && metadata.failureModes.length === 0) {
    warnings.push("Doctrine metadata should usually declare failureModes.");
  }

  // Warning for doctrine/framework assets that lack worldview anchors
  if (
    (metadata.assetKind === "doctrine" || metadata.assetKind === "framework") &&
    metadata.worldviewAnchors.length === 0
  ) {
    warnings.push(
      "Doctrine/framework metadata should usually declare worldviewAnchors."
    );
  }

  if (
    metadata.orgStates.length === 0 &&
    metadata.failureModes.length === 0 &&
    metadata.dominantDomains.length === 0
  ) {
    warnings.push("Metadata is structurally thin; matching will rely more heavily on heuristics.");
  }

  const validation: DecisionMetadataValidation = {
    valid: errors.length === 0,
    errors,
    warnings,
  };

  return { metadata, validation };
}