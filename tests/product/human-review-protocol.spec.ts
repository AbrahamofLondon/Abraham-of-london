/**
 * tests/product/human-review-protocol.spec.ts — Human Review Protocol Tests
 */

import { describe, it, expect } from 'vitest'
import { HumanReviewProtocol } from '../../lib/intelligence/human-review-protocol'
import { createLivingDecisionCase } from '../../lib/intelligence/living-decision-case-contract'

describe('HumanReviewProtocol', () => {
  const protocol = new HumanReviewProtocol()

  it('should not require review for low-stakes situations', () => {
    const livingCase = createLivingDecisionCase({
      id: 'test-hr-001',
      caseReference: 'TEST-HR-001',
      aperture: 'web',
    })
    livingCase.classification = {
      primaryClass: 'LOW_STAKES_PREFERENCE',
      alternativeClasses: [],
      confidence: 'HIGH',
      classificationRationale: 'Test',
    }
    livingCase.translation = { translationConfidence: 'HIGH' } as any

    const result = protocol.determine(livingCase)
    expect(result.state).toBe('not_required')
  })

  it('should require STANDARD review for governance decisions', () => {
    const livingCase = createLivingDecisionCase({
      id: 'test-hr-002',
      caseReference: 'TEST-HR-002',
      aperture: 'web',
    })
    livingCase.classification = {
      primaryClass: 'GOVERNANCE_AND_BOARD',
      alternativeClasses: [],
      confidence: 'HIGH',
      classificationRationale: 'Test',
    }

    const result = protocol.determine(livingCase)
    expect(result.state).toBe('pending')
    expect(result.triggers.length).toBeGreaterThan(0)
  })

  it('should require URGENT review for reputational crises', () => {
    const livingCase = createLivingDecisionCase({
      id: 'test-hr-003',
      caseReference: 'TEST-HR-003',
      aperture: 'web',
    })
    livingCase.classification = {
      primaryClass: 'REPUTATIONAL_AND_EXPOSURE',
      alternativeClasses: [],
      confidence: 'HIGH',
      classificationRationale: 'Test',
    }

    const result = protocol.determine(livingCase)
    expect(result.tier).toBe('URGENT')
  })

  it('should require EXECUTIVE review for continuity decisions', () => {
    const livingCase = createLivingDecisionCase({
      id: 'test-hr-004',
      caseReference: 'TEST-HR-004',
      aperture: 'web',
    })
    livingCase.classification = {
      primaryClass: 'CONTINUITY_AND_TRANSITION',
      alternativeClasses: [],
      confidence: 'HIGH',
      classificationRationale: 'Test',
    }

    const result = protocol.determine(livingCase)
    expect(result.tier).toBe('EXECUTIVE')
  })

  it('should trigger on low translation confidence', () => {
    const livingCase = createLivingDecisionCase({
      id: 'test-hr-005',
      caseReference: 'TEST-HR-005',
      aperture: 'web',
    })
    livingCase.classification = {
      primaryClass: 'OPERATIONAL_AND_EXECUTION',
      alternativeClasses: [],
      confidence: 'LOW',
      classificationRationale: 'Test',
    }
    livingCase.translation = { translationConfidence: 'LOW' } as any

    const result = protocol.determine(livingCase)
    expect(result.triggers.some(t => t.type === 'low_confidence_on_primitives')).toBe(true)
  })

  it('should trigger on critical contradictions', () => {
    const livingCase = createLivingDecisionCase({
      id: 'test-hr-006',
      caseReference: 'TEST-HR-006',
      aperture: 'web',
    })
    livingCase.classification = {
      primaryClass: 'OPERATIONAL_AND_EXECUTION',
      alternativeClasses: [],
      confidence: 'HIGH',
      classificationRationale: 'Test',
    }
    livingCase.adversarialChallenge = [
      {
        id: 'critical-contradiction',
        between: ['lens-a', 'lens-b'],
        contradiction: 'Critical contradiction',
        severity: 'CRITICAL',
        resolutionRule: '',
        outputEffect: '',
      },
    ]

    const result = protocol.determine(livingCase)
    expect(result.triggers.some(t => t.type === 'kernel_contradiction_high_or_critical')).toBe(true)
  })
})
