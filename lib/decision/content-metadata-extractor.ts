// lib/decision/content-metadata-extractor.ts
// ============================================================================
// CONTENT METADATA EXTRACTOR
// Reads decision metadata from real Contentlayer docs, with fallbacks
// ============================================================================

import type { DecisionMetadata, DecisionMetadataParseResult } from "@/lib/decision/decision-metadata";
import { normalizeDecisionMetadata } from "@/lib/decision/metadata-normalizer";

type UnknownDoc = Record<string, unknown>;

function readField<T = unknown>(doc: UnknownDoc, key: string): T | undefined {
  return doc[key] as T | undefined;
}

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
  if (raw.includes(",")) return raw.split(",").map((v) => v.trim()).filter(Boolean);
  return [raw];
}

export function extractDecisionMetadataFromDoc(doc: UnknownDoc): DecisionMetadataParseResult {
  const nested =
    (readField<DecisionMetadata>(doc, "decisionMetadata") ??
      readField<DecisionMetadata>(doc, "decision") ??
      null);

  if (nested) {
    return normalizeDecisionMetadata(nested);
  }

  const flat: DecisionMetadata = {
    assetKind: safeString(readField(doc, "assetKind")) as DecisionMetadata["assetKind"],
    appliesTo: stringList(readField(doc, "appliesTo")),
    sectors: stringList(readField(doc, "sectors")) as DecisionMetadata["sectors"],
    revenueBands: stringList(readField(doc, "revenueBands")) as DecisionMetadata["revenueBands"],
    orgStates: stringList(readField(doc, "orgStates")) as DecisionMetadata["orgStates"],
    readinessTiers: stringList(readField(doc, "readinessTiers")) as DecisionMetadata["readinessTiers"],
    failureModes: stringList(readField(doc, "failureModes")) as DecisionMetadata["failureModes"],
    dominantDomains: stringList(readField(doc, "dominantDomains")) as DecisionMetadata["dominantDomains"],
    requiredInterventions: stringList(readField(doc, "requiredInterventions")) as DecisionMetadata["requiredInterventions"],
    marketRiskBands: stringList(readField(doc, "marketRiskBands")) as DecisionMetadata["marketRiskBands"],
    priorityWeight: readField<number>(doc, "priorityWeight"),
    confidenceWeight: readField<number>(doc, "confidenceWeight"),
    decisionTags: stringList(readField(doc, "decisionTags")),
    sponsorTypes: stringList(readField(doc, "sponsorTypes")) as DecisionMetadata["sponsorTypes"],
    notes: safeString(readField(doc, "decisionNotes")),
  };

  return normalizeDecisionMetadata(flat);
}