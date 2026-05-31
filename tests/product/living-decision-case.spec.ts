/**
 * tests/product/living-decision-case.spec.ts — Living Decision Case Tests
 */

import { describe, it, expect } from 'vitest'
import { createLivingDecisionCase, validateCaseForTier, summarizeCase } from '../../lib/intelligence/living-decision-case-contract'

describe('LivingDecisionCase', () => {
  it('should create a valid empty case', () => {
    const livingCase = createLivingDecisionCase({
      id: 'test-001',
      caseReference: 'TEST-001',
      aperture: 'web',
    })

    expect(livingCase.id).toBe('test-001')
    expect(livingCase.caseReference).toBe('TEST-001')
    expect(livingCase.contractVersion).toBe('1.0.0')
    expect(livingCase.kernelVersion).toBe('1.0.0')
    expect(livingCase.source.aperture).toBe('web')
    expect(livingCase.caseStatus).toBe('open')
    expect(livingCase.disclosure.currentTier).toBe('free_signal')
    expect(livingCase.review.state).toBe('not_required')
    expect(livingCase.regulatedBoundary.hit).toBe(false)
  })

  it('should validate required fields for different tiers', () => {
    const livingCase = createLivingDecisionCase({
      id: 'test-002',
      caseReference: 'TEST-002',
      aperture: 'web',
    })

    // Free signal should only require translation and classification
    const freeSignalMissing = validateCaseForTier(livingCase, 'free_signal')
    expect(freeSignalMissing).toContain('translation')
    expect(freeSignalMissing).toContain('classification')

    // Full dossier should require much more
    const fullDossierMissing = validateCaseForTier(livingCase, 'full_dossier')
    expect(fullDossierMissing.length).toBeGreaterThan(3)
  })

  it('should generate a summary', () => {
    const livingCase = createLivingDecisionCase({
      id: 'test-003',
      caseReference: 'TEST-003',
      aperture: 'web',
    })

    const summary = summarizeCase(livingCase)
    expect(summary).toContain('TEST-003')
    expect(summary).toContain('Unclassified')
    expect(summary).toContain('open')
  })
})
