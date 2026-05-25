/**
 * lib/platform/content-governance-events.ts
 *
 * Content governance event service.
 * Provides callable functions for content/editorial flows to emit standard
 * GovernanceEvents without requiring full runtime DB access.
 *
 * Passing style check can be audit-light.
 * Failure should create FoundryFinding or ResearchRun only when strict mode
 * is used or content is release-bound.
 */

import "server-only";

import { routeGovernanceEvent } from "./governance-event-bus";

export type ContentCheckResult = {
  ok: boolean;
  slug: string;
  title?: string;
  warnings?: string[];
  errors?: string[];
  strictMode?: boolean;
  releaseBound?: boolean;
};

/**
 * Record that content passed editorial style check.
 * Audit-light by default — only writes lineage, not full audit.
 */
export async function recordContentStyleChecked(result: ContentCheckResult) {
  return routeGovernanceEvent({
    eventType: "CONTENT_STYLE_CHECKED",
    sourceSurface: "editorials",
    canonicalRecordType: "ContentAsset",
    canonicalRecordId: result.slug,
    severity: result.ok ? "LOW" : "MEDIUM",
    payload: {
      slug: result.slug,
      title: result.title,
      ok: result.ok,
      warnings: result.warnings,
      errors: result.errors,
      strictMode: result.strictMode,
    },
    shouldWriteAudit: !result.ok || (result.strictMode === true),
    shouldWriteLineage: true,
    shouldCreateResearchRun: !result.ok && (result.strictMode === true || result.releaseBound === true),
  });
}

/**
 * Record that content metadata was validated.
 * Always writes audit for metadata validation.
 */
export async function recordContentMetadataValidated(result: ContentCheckResult) {
  return routeGovernanceEvent({
    eventType: "CONTENT_METADATA_VALIDATED",
    sourceSurface: "editorials",
    canonicalRecordType: "ContentAsset",
    canonicalRecordId: result.slug,
    severity: result.ok ? "LOW" : "MEDIUM",
    payload: {
      slug: result.slug,
      title: result.title,
      ok: result.ok,
      errors: result.errors,
    },
    shouldWriteAudit: true,
    shouldWriteLineage: true,
    shouldCreateResearchRun: !result.ok && result.strictMode === true,
  });
}

/**
 * Record that content was marked as outbound-eligible.
 * This does not mean published to social — only that internal eligibility checks passed.
 */
export async function recordContentOutboundEligible(result: ContentCheckResult) {
  return routeGovernanceEvent({
    eventType: "CONTENT_OUTBOUND_ELIGIBLE",
    sourceSurface: "editorials",
    canonicalRecordType: "ContentAsset",
    canonicalRecordId: result.slug,
    severity: result.ok ? "LOW" : "HIGH",
    payload: {
      slug: result.slug,
      title: result.title,
      ok: result.ok,
      warnings: result.warnings,
    },
    shouldWriteAudit: true,
    shouldWriteLineage: true,
    shouldCreateResearchRun: !result.ok,
  });
}
