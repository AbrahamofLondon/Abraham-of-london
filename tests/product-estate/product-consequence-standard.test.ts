/**
 * tests/product-estate/product-consequence-standard.test.ts
 *
 * Phase 9 — Consequence Standard authority tests.
 * Validates the 7-dimension ConsequenceRecord and ConsequenceEvaluation functions.
 */

import { describe, it, expect } from 'vitest'
import {
  CONSEQUENCE_REGISTRY,
  evaluateProductConsequence,
  evaluateAllConsequence,
  getConsequenceFailures,
  getConsequenceSummary,
  type ConsequenceRecord,
  type ConsequenceEvaluation,
} from '@/lib/product/product-consequence-standard'

// ─── Registry completeness ─────────────────────────────────────────────────────

describe('CONSEQUENCE_REGISTRY', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(CONSEQUENCE_REGISTRY)).toBe(true)
    expect(CONSEQUENCE_REGISTRY.length).toBeGreaterThan(0)
  })

  it('every record has a unique surfaceId', () => {
    const ids = CONSEQUENCE_REGISTRY.map((r) => r.surfaceId)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('every record declares all 7 consequence dimensions as non-empty strings', () => {
    const dims: (keyof ConsequenceRecord)[] = [
      'buyerType',
      'pressureMoment',
      'testQuestion',
      'outputArtifact',
      'gateCondition',
      'nextAdmissibleMove',
      'proofOfAuthority',
    ]
    for (const record of CONSEQUENCE_REGISTRY) {
      for (const dim of dims) {
        const value = record[dim]
        expect(typeof value, `${record.surfaceId}.${dim}`).toBe('string')
        expect((value as string).trim().length, `${record.surfaceId}.${dim} is empty`).toBeGreaterThan(0)
      }
    }
  })

  it('every record has a valid commercialStatus', () => {
    const valid = ['free', 'paid', 'contracted', 'manual_billing', 'internal_only', 'inactive'] as const
    for (const record of CONSEQUENCE_REGISTRY) {
      expect(valid, `${record.surfaceId} has invalid commercialStatus: ${record.commercialStatus}`).toContain(record.commercialStatus)
    }
  })

  it('every record has a maturityScore between 0 and 10', () => {
    for (const record of CONSEQUENCE_REGISTRY) {
      expect(record.maturityScore, `${record.surfaceId}`).toBeGreaterThanOrEqual(0)
      expect(record.maturityScore, `${record.surfaceId}`).toBeLessThanOrEqual(10)
    }
  })

  it('every record has non-empty adminState and userState', () => {
    for (const record of CONSEQUENCE_REGISTRY) {
      expect(record.adminState.trim().length, `${record.surfaceId}.adminState empty`).toBeGreaterThan(0)
      expect(record.userState.trim().length, `${record.surfaceId}.userState empty`).toBeGreaterThan(0)
    }
  })
})

// ─── evaluateProductConsequence ────────────────────────────────────────────────

describe('evaluateProductConsequence', () => {
  it('returns a ConsequenceEvaluation for a known surfaceId', () => {
    const result = evaluateProductConsequence('decision_pressure_signal')
    expect(result).toBeDefined()
    expect(result.surfaceId).toBe('decision_pressure_signal')
  })

  it('returns consequenceScore between 0 and 10', () => {
    for (const record of CONSEQUENCE_REGISTRY) {
      const result = evaluateProductConsequence(record.surfaceId)
      expect(result.consequenceScore, `${record.surfaceId}`).toBeGreaterThanOrEqual(0)
      expect(result.consequenceScore, `${record.surfaceId}`).toBeLessThanOrEqual(10)
    }
  })

  it('returns boolean flags for all gap types', () => {
    const flags: (keyof ConsequenceEvaluation)[] = [
      'missingBuyerSignal',
      'missingGate',
      'missingOutput',
      'missingProof',
      'missingNextMove',
      'commercialConfusion',
      'hasCriticalGap',
    ]
    for (const record of CONSEQUENCE_REGISTRY) {
      const result = evaluateProductConsequence(record.surfaceId)
      for (const flag of flags) {
        expect(typeof result[flag], `${record.surfaceId}.${flag}`).toBe('boolean')
      }
    }
  })

  it('returns a non-empty recommendation', () => {
    for (const record of CONSEQUENCE_REGISTRY) {
      const result = evaluateProductConsequence(record.surfaceId)
      expect(result.recommendation.trim().length, `${record.surfaceId} recommendation empty`).toBeGreaterThan(0)
    }
  })

  it('hasCriticalGap is true when any flag is true', () => {
    for (const record of CONSEQUENCE_REGISTRY) {
      const result = evaluateProductConsequence(record.surfaceId)
      const anyFlag =
        result.missingBuyerSignal ||
        result.missingGate ||
        result.missingOutput ||
        result.missingProof ||
        result.missingNextMove ||
        result.commercialConfusion
      if (anyFlag) {
        expect(result.hasCriticalGap, `${record.surfaceId}: anyFlag=true but hasCriticalGap=false`).toBe(true)
      }
    }
  })

  it('returns a zero-score evaluation for an unknown surfaceId (does not throw)', () => {
    const result = evaluateProductConsequence('__nonexistent_surface__')
    expect(result).toBeDefined()
    expect(result.surfaceId).toBe('__nonexistent_surface__')
    expect(result.consequenceScore).toBe(0)
    expect(result.hasCriticalGap).toBe(true)
  })
})

// ─── evaluateAllConsequence ────────────────────────────────────────────────────

describe('evaluateAllConsequence', () => {
  it('returns an array with at least CONSEQUENCE_REGISTRY.length entries', () => {
    // evaluateAllConsequence includes CONSEQUENCE_REGISTRY surfaces + unregistered
    // PRODUCT_SURFACE_REGISTRY surfaces. Total may exceed CONSEQUENCE_REGISTRY count.
    const results = evaluateAllConsequence()
    expect(results.length).toBeGreaterThanOrEqual(CONSEQUENCE_REGISTRY.length)
  })

  it('includes all CONSEQUENCE_REGISTRY surfaceIds', () => {
    const results = evaluateAllConsequence()
    const resultIds = new Set(results.map((r) => r.surfaceId))
    for (const record of CONSEQUENCE_REGISTRY) {
      expect(resultIds.has(record.surfaceId), `Missing surfaceId: ${record.surfaceId}`).toBe(true)
    }
  })

  it('all surfaceIds appear exactly once', () => {
    const results = evaluateAllConsequence()
    const ids = new Set(results.map((r) => r.surfaceId))
    expect(ids.size).toBe(results.length)
  })
})

// ─── getConsequenceFailures ────────────────────────────────────────────────────

describe('getConsequenceFailures', () => {
  it('returns an array (may be empty at default threshold 7)', () => {
    const failures = getConsequenceFailures()
    expect(Array.isArray(failures)).toBe(true)
  })

  it('all returned surfaces have consequenceScore below threshold', () => {
    const threshold = 7
    const failures = getConsequenceFailures(threshold)
    for (const f of failures) {
      expect(f.consequenceScore, `${f.surfaceId} should be below ${threshold}`).toBeLessThan(threshold)
    }
  })

  it('at least CONSEQUENCE_REGISTRY.length surfaces are included when threshold is 11', () => {
    // evaluateAllConsequence includes unregistered surfaces too (score 0, below 11)
    const failures = getConsequenceFailures(11)
    expect(failures.length).toBeGreaterThanOrEqual(CONSEQUENCE_REGISTRY.length)
  })

  it('no surfaces fail when threshold is 0', () => {
    const failures = getConsequenceFailures(0)
    expect(failures.length).toBe(0)
  })
})

// ─── getConsequenceSummary ─────────────────────────────────────────────────────

describe('getConsequenceSummary', () => {
  // Actual fields: totalEvaluated, passing, failing, averageScore,
  //                surfacesWithoutRecord, highestPriorityRecommendation
  it('returns an object with expected shape', () => {
    const summary = getConsequenceSummary()
    expect(typeof summary.totalEvaluated).toBe('number')
    expect(typeof summary.passing).toBe('number')
    expect(typeof summary.failing).toBe('number')
    expect(typeof summary.averageScore).toBe('number')
    expect(typeof summary.surfacesWithoutRecord).toBe('number')
    expect(typeof summary.highestPriorityRecommendation).toBe('string')
  })

  it('totalEvaluated is at least CONSEQUENCE_REGISTRY count', () => {
    const summary = getConsequenceSummary()
    expect(summary.totalEvaluated).toBeGreaterThanOrEqual(CONSEQUENCE_REGISTRY.length)
  })

  it('passing + failing does not exceed totalEvaluated', () => {
    const summary = getConsequenceSummary()
    expect(summary.passing + summary.failing).toBeLessThanOrEqual(summary.totalEvaluated)
  })

  it('averageScore is between 0 and 10', () => {
    const summary = getConsequenceSummary()
    expect(summary.averageScore).toBeGreaterThanOrEqual(0)
    expect(summary.averageScore).toBeLessThanOrEqual(10)
  })
})
