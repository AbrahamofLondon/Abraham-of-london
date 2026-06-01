/**
 * lib/product/evidence-tier-derivation.ts — Canonical Evidence Tier Derivation
 *
 * Single source of truth for deriving evidence strength from production data.
 * Used by the Decision Centre adapter and the Living Layer view model.
 *
 * Rules:
 * - verified only when actual verified evidence exists (confidenceLabel === VERIFIED)
 * - repeated user statements alone must not become verified
 * - carried-forward diagnostic material can support single_source or multi_source
 * - corroborated requires at least two distinct evidence origins or a structured diagnostic plus supporting material
 * - if uncertain, downgrade
 */

import type { GovernedMemoryItem } from '@/lib/product/governed-memory-contract'
import type { SaveCasePayload } from '@/lib/product/save-case-continuity'

// ─── Types ───────────────────────────────────────────────────────────────────

export type EvidenceLevel = 'none' | 'single_source' | 'multi_source' | 'corroborated' | 'verified'

export type EvidenceTierDerivationInput = {
  governedMemory?: GovernedMemoryItem[]
  completedStages?: string[]
  carriedForwardCase?: SaveCasePayload | null
  currentSessionSignals?: Array<{ signal: string; occurrences?: number }>
}

export type EvidenceTierDerivationResult = {
  level: EvidenceLevel
  summary: string
  gaps: string[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Check if a governed memory item has verified evidence.
 */
function hasVerifiedEvidence(item: GovernedMemoryItem): boolean {
  return item.confidenceLabel === 'VERIFIED' && item.audienceSafe && item.status !== 'SUPPRESSED'
}

/**
 * Check if a governed memory item comes from a structured diagnostic.
 */
function isStructuredDiagnostic(item: GovernedMemoryItem): boolean {
  return (
    item.evidenceOrigin === 'STRUCTURED_DIAGNOSTIC' ||
    item.evidenceOrigin === 'AGGREGATED_RESPONDENT' ||
    item.evidenceOrigin === 'BEHAVIOURAL' ||
    item.evidenceOrigin === 'OPERATOR_REVIEWED'
  ) && item.audienceSafe && item.status !== 'SUPPRESSED'
}

/**
 * Check if a governed memory item is self-reported.
 */
function isSelfReported(item: GovernedMemoryItem): boolean {
  return item.evidenceOrigin === 'SELF_REPORTED' && item.audienceSafe && item.status !== 'SUPPRESSED'
}

/**
 * Count distinct evidence origins from governed memory.
 */
function countDistinctOrigins(items: GovernedMemoryItem[]): Set<string> {
  const origins = new Set<string>()
  for (const item of items) {
    if (item.audienceSafe && item.status !== 'SUPPRESSED') {
      origins.add(item.evidenceOrigin)
    }
  }
  return origins
}

// ─── Main Derivation ─────────────────────────────────────────────────────────

export function deriveEvidenceTierFromInputs(
  params: EvidenceTierDerivationInput,
): EvidenceTierDerivationResult {
  const { governedMemory = [], completedStages = [], carriedForwardCase, currentSessionSignals = [] } = params
  const gaps: string[] = []

  // ── Check for verified evidence first ──────────────────────────────────
  const verifiedItems = governedMemory.filter(hasVerifiedEvidence)
  if (verifiedItems.length > 0) {
    return {
      level: 'verified',
      summary: `Verified evidence exists from ${verifiedItems.length} item(s). This is the strongest evidence tier.`,
      gaps: [],
    }
  }

  // ── Count distinct origins ─────────────────────────────────────────────
  const distinctOrigins = countDistinctOrigins(governedMemory)
  const structuredCount = governedMemory.filter(isStructuredDiagnostic).length
  const selfReportedCount = governedMemory.filter(isSelfReported).length
  const hasCarriedForward = Boolean(carriedForwardCase)
  const hasSessionSignals = currentSessionSignals.length > 0
  const hasCompletedStages = completedStages.length > 0

  // ── Corroborated: two distinct evidence origins, or structured + supporting ──
  if (distinctOrigins.size >= 2 || (structuredCount >= 1 && (selfReportedCount >= 1 || hasCarriedForward))) {
    return {
      level: 'corroborated',
      summary: 'Evidence is corroborated by multiple distinct sources — structured diagnostics and supporting material.',
      gaps: [],
    }
  }

  // ── Multi-source: structured diagnostic or multiple self-reported items ──
  if (structuredCount >= 1 || selfReportedCount >= 2 || (selfReportedCount >= 1 && hasCarriedForward)) {
    return {
      level: 'multi_source',
      summary: 'Multiple signals and evidence items have been identified, building a multi-source picture.',
      gaps: [],
    }
  }

  // ── Single source: one self-reported item, carried-forward case, or session signals ──
  if (selfReportedCount >= 1 || hasCarriedForward || hasSessionSignals || hasCompletedStages) {
    if (!selfReportedCount && !hasCarriedForward && !hasCompletedStages) {
      gaps.push('Evidence is based on session signals only — no diagnostic record yet')
    }
    return {
      level: 'single_source',
      summary: 'The system has a single coherent description of the situation with identifiable evidence.',
      gaps,
    }
  }

  // ── None ───────────────────────────────────────────────────────────────
  gaps.push('No decision actors or evidence identified')
  return {
    level: 'none',
    summary: 'The situation is not yet clear enough to assess evidence strength.',
    gaps,
  }
}
