import { describe, expect, it } from 'vitest'
import {
  OPERATIONAL_DECISION_INTELLIGENCE_IDENTITY,
  PURPOSE_ALIGNMENT_IDENTITY,
  assertContributionAllowed,
  getAllowedContributionTypes,
  getProductLineIdentity,
  isOperationalDecisionSurface,
  isPurposeAlignmentSurface,
  type ProductLineContribution,
} from '@/lib/product/product-line-contract'
import { PAID_CORRIDOR_RECORDS } from '@/lib/product/paid-corridor-contract'

function contribution(overrides: Partial<ProductLineContribution> = {}): ProductLineContribution {
  return {
    source: 'PURPOSE_ALIGNMENT',
    target: 'OPERATIONAL_DECISION_INTELLIGENCE',
    evidenceType: 'avoided_decision',
    confidence: 0.8,
    summary: 'User identified an avoided decision with behavioural consequences.',
    createdAt: new Date('2026-06-01T00:00:00.000Z'),
    bridge: 'purpose_to_operational_decision',
    ...overrides,
  }
}

describe('Product Line Contract', () => {
  it('Purpose Alignment is not Operational Decision Intelligence', () => {
    expect(PURPOSE_ALIGNMENT_IDENTITY.productLine).not.toBe(OPERATIONAL_DECISION_INTELLIGENCE_IDENTITY.productLine)
    expect(getProductLineIdentity('PURPOSE_ALIGNMENT').role).toBe('PERSONAL_PATTERN_ENFORCEMENT')
    expect(getProductLineIdentity('OPERATIONAL_DECISION_INTELLIGENCE').role).toBe('CORPORATE_DECISION_ENFORCEMENT')
  })

  it('Purpose Alignment is not a paid corridor stage', () => {
    expect(PAID_CORRIDOR_RECORDS.map(record => record.stage)).not.toContain('purpose_alignment')
    expect(PURPOSE_ALIGNMENT_IDENTITY.isPaidCorridorStage).toBe(false)
  })

  it('Operational Decision Intelligence does not depend on Purpose Alignment', () => {
    expect(OPERATIONAL_DECISION_INTELLIGENCE_IDENTITY.dependsOn).not.toContain('PURPOSE_ALIGNMENT')
  })

  it('Purpose Alignment can contribute avoided_decision evidence', () => {
    expect(() => assertContributionAllowed(contribution({ evidenceType: 'avoided_decision' }))).not.toThrow()
  })

  it('Purpose Alignment can contribute personal_pattern evidence', () => {
    expect(() => assertContributionAllowed(contribution({ evidenceType: 'personal_pattern' }))).not.toThrow()
  })

  it('Purpose Alignment can contribute recurrence evidence only through typed bridge', () => {
    expect(() => assertContributionAllowed(contribution({ evidenceType: 'recurrence' }))).not.toThrow()
    expect(() => assertContributionAllowed(contribution({ evidenceType: 'recurrence', bridge: undefined }))).toThrow(/bridge/i)
  })

  it('Purpose Alignment cannot directly contribute stakeholder evidence', () => {
    expect(() => assertContributionAllowed(contribution({ evidenceType: 'stakeholder' }))).toThrow(/not allowed/i)
  })

  it('Purpose Alignment cannot directly contribute corporate outcome evidence', () => {
    expect(() => assertContributionAllowed(contribution({ evidenceType: 'outcome' }))).toThrow(/not allowed/i)
  })

  it('Operational Decision Intelligence can consume recurrence evidence when target is explicit', () => {
    expect(getAllowedContributionTypes('PURPOSE_ALIGNMENT', 'OPERATIONAL_DECISION_INTELLIGENCE')).toContain('recurrence')
    expect(() => assertContributionAllowed(contribution({ evidenceType: 'recurrence', target: 'OPERATIONAL_DECISION_INTELLIGENCE' }))).not.toThrow()
  })

  it('ProductLineContribution requires source, evidenceType, confidence, summary, createdAt', () => {
    expect(() => assertContributionAllowed({ ...contribution(), source: undefined as any })).toThrow(/source/)
    expect(() => assertContributionAllowed({ ...contribution(), evidenceType: undefined as any })).toThrow(/evidenceType/)
    expect(() => assertContributionAllowed({ ...contribution(), confidence: undefined as any })).toThrow(/confidence/)
    expect(() => assertContributionAllowed({ ...contribution(), summary: '' })).toThrow(/summary/)
    expect(() => assertContributionAllowed({ ...contribution(), createdAt: undefined as any })).toThrow(/createdAt/)
  })

  it('assertContributionAllowed rejects invalid source/target/evidence combinations', () => {
    expect(() => assertContributionAllowed(contribution({ source: 'COMMERCIAL_GROWTH', evidenceType: 'case_decision' }))).toThrow()
  })

  it('classifies purpose and operational surfaces distinctly', () => {
    expect(isPurposeAlignmentSurface('purpose_alignment')).toBe(true)
    expect(isOperationalDecisionSurface('purpose_alignment')).toBe(false)
    expect(isOperationalDecisionSurface('enterprise_assessment')).toBe(true)
  })
})
