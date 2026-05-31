/**
 * tests/product/regulated-boundary.spec.ts — Regulated Boundary Protocol Tests
 */

import { describe, it, expect } from 'vitest'
import { RegulatedBoundaryProtocol } from '../../lib/intelligence/regulated-boundary-protocol'
import { createLivingDecisionCase } from '../../lib/intelligence/living-decision-case-contract'

describe('RegulatedBoundaryProtocol', () => {
  const protocol = new RegulatedBoundaryProtocol()

  it('should detect legal advice boundary', () => {
    const livingCase = createLivingDecisionCase({
      id: 'test-rb-001',
      caseReference: 'TEST-RB-001',
      aperture: 'web',
    })
    livingCase.classification = {
      primaryClass: 'LEGAL_AND_CONTRACTUAL',
      alternativeClasses: [],
      confidence: 'HIGH',
      classificationRationale: 'Test',
    }
    livingCase.situationModel = {
      rawContext: 'I need to respond to a letter before claim from a former business partner.',
      buyerLanguageSummary: 'Test',
      institutionalInterpretation: 'Test',
      coreTension: 'Test',
    }

    const result = protocol.check(livingCase)
    expect(result.hit).toBe(true)
    expect(result.type).toBe('legal-advice')
    expect(result.output).toBeDefined()
    expect(result.output!.professionalBrief.suggestedProfession).toContain('solicitor')
  })

  it('should detect tax advice boundary', () => {
    const livingCase = createLivingDecisionCase({
      id: 'test-rb-002',
      caseReference: 'TEST-RB-002',
      aperture: 'web',
    })
    livingCase.classification = {
      primaryClass: 'COMPLIANCE_AND_FILING',
      alternativeClasses: [],
      confidence: 'HIGH',
      classificationRationale: 'Test',
    }
    livingCase.situationModel = {
      rawContext: 'We have a tax filing due at HMRC.',
      buyerLanguageSummary: 'Test',
      institutionalInterpretation: 'Test',
      coreTension: 'Test',
    }

    const result = protocol.check(livingCase)
    expect(result.hit).toBe(true)
    expect(result.output!.professionalBrief.suggestedProfession).toContain('tax')
  })

  it('should not trigger for low-stakes situations', () => {
    const livingCase = createLivingDecisionCase({
      id: 'test-rb-003',
      caseReference: 'TEST-RB-003',
      aperture: 'web',
    })
    livingCase.classification = {
      primaryClass: 'LOW_STAKES_PREFERENCE',
      alternativeClasses: [],
      confidence: 'HIGH',
      classificationRationale: 'Test',
    }
    livingCase.situationModel = {
      rawContext: 'Which project management software should we use?',
      buyerLanguageSummary: 'Test',
      institutionalInterpretation: 'Test',
      coreTension: 'Test',
    }

    const result = protocol.check(livingCase)
    expect(result.hit).toBe(false)
  })

  it('should generate a professional brief with actionable items', () => {
    const livingCase = createLivingDecisionCase({
      id: 'test-rb-004',
      caseReference: 'TEST-RB-004',
      aperture: 'web',
    })
    livingCase.classification = {
      primaryClass: 'LEGAL_AND_CONTRACTUAL',
      alternativeClasses: [],
      confidence: 'HIGH',
      classificationRationale: 'Test',
    }
    livingCase.situationModel = {
      rawContext: 'I am in a legal dispute with a former partner.',
      buyerLanguageSummary: 'Test',
      institutionalInterpretation: 'Test',
      coreTension: 'Test',
    }

    const result = protocol.check(livingCase)
    expect(result.output!.whatWeCanStillMap.length).toBeGreaterThan(0)
    expect(result.output!.whatToDoNext.length).toBeGreaterThan(0)
    expect(result.output!.professionalBrief.whatToBring.length).toBeGreaterThan(0)
    expect(result.output!.professionalBrief.questionsToAsk.length).toBeGreaterThan(0)
  })
})
