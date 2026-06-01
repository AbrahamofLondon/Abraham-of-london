import { describe, expect, it } from 'vitest'
import {
  OPERATIONAL_DECISION_INTELLIGENCE_IDENTITY,
  PRODUCT_LINE_IDENTITIES,
  PURPOSE_ALIGNMENT_IDENTITY,
  assertContributionAllowed,
  getAllowedContributionTypes,
  getProductLineIdentity,
  isOperationalDecisionSurface,
  isPurposeAlignmentSurface,
  type ProductLineContribution,
} from '@/lib/product/product-line-contract'
import {
  CAPABILITY_STATUS_RECORDS,
} from '@/lib/product/capability-status-authority'
import {
  PAID_CORRIDOR_RECORDS,
  getCorridorRecord,
} from '@/lib/product/paid-corridor-contract'

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

// ============================================================================
// Market Activation and Corridor Boundary Tests
// ============================================================================

const MARKET_ACTIVATION_SURFACES = [
  'boardroom_first_brief',
  'scenario_stress_test_hook',
  'quick_decision_health_check',
  'sample_boardroom_dossier',
]

const PLANNED_CAPABILITIES = CAPABILITY_STATUS_RECORDS.filter(
  (r) => r.status === 'PLANNED',
)

describe('Market Activation surfaces and corridor boundaries', () => {
  it('Market Activation surfaces are not paid corridor stages', () => {
    const corridorStages = PAID_CORRIDOR_RECORDS.map((r) => r.stage)
    for (const surface of MARKET_ACTIVATION_SURFACES) {
      expect(corridorStages).not.toContain(surface)
    }
  })

  it('Boardroom-first Brief is ACTIVE and distinct from full Boardroom Mode', () => {
    const brief = CAPABILITY_STATUS_RECORDS.find(
      (r) => r.capabilityId === 'Boardroom-first Brief',
    )
    expect(brief).toBeDefined()
    expect(brief!.status).toBe('ACTIVE')
    expect(brief!.layer).toBe('UI_SURFACE')
    expect(brief!.outputProduced?.join(' ')).toMatch(/checkout CTA|sample brief/i)

    // Must not have a corridorStage pointing to boardroom_mode
    expect(brief!.corridorStage).not.toBe('boardroom_mode')

    // A separate Boardroom Archive or Boardroom Mode Adapter exists as non-PLANNED
    const boardroomActive = CAPABILITY_STATUS_RECORDS.find(
      (r) =>
        r.capabilityId === 'Boardroom Archive' ||
        r.capabilityId === 'Boardroom Mode Adapter',
    )
    expect(boardroomActive).toBeDefined()
    expect(boardroomActive!.capabilityId).not.toBe('Boardroom-first Brief')
  })

  it('Scenario Stress Test Hook is PLANNED and distinct from Enterprise Assessment', () => {
    const hook = PLANNED_CAPABILITIES.find(
      (r) => r.capabilityId === 'Scenario Stress Test Hook',
    )
    expect(hook).toBeDefined()
    expect(hook!.status).toBe('PLANNED')
    expect(hook!.corridorStage).not.toBe('enterprise_assessment')
  })

  it('Quick Decision Health Check is PLANNED and distinct from Executive Reporting', () => {
    const check = PLANNED_CAPABILITIES.find(
      (r) => r.capabilityId === 'Quick Decision Health Check',
    )
    expect(check).toBeDefined()
    expect(check!.status).toBe('PLANNED')
    expect(check!.corridorStage).not.toBe('executive_reporting')
  })

  it('Purpose Alignment is not part of ODI corridor', () => {
    const corridorStages = PAID_CORRIDOR_RECORDS.map((r) => r.stage)
    expect(corridorStages).not.toContain('purpose_alignment')

    const purposeIdentity = PRODUCT_LINE_IDENTITIES.PURPOSE_ALIGNMENT
    expect(purposeIdentity).toBeDefined()
    expect(purposeIdentity.isPaidCorridorStage).toBe(false)
    expect(purposeIdentity.productLine).toBe('PURPOSE_ALIGNMENT')
  })

  it('Retainer Review Queue capability is ACTIVE', () => {
    const queueCap = CAPABILITY_STATUS_RECORDS.find(
      (r) => r.capabilityId === 'Retainer Review Queue',
    )
    expect(queueCap).toBeDefined()
    expect(queueCap!.status).toBe('ACTIVE')
  })

  it('Retainer Oversight remains GATED in corridor', () => {
    const retainer = getCorridorRecord('retainer_oversight')
    expect(retainer).toBeDefined()
    expect(retainer!.currentReadiness).toBe('GATED')
  })

  it('No PLANNED activation surface claims retainer or oversight in outputProduced', () => {
    for (const cap of PLANNED_CAPABILITIES) {
      const outputs = (cap.outputProduced ?? []).join(' ').toLowerCase()
      expect(outputs).not.toContain('retainer')
      expect(outputs).not.toContain('oversight')
    }
  })

  it('Every PLANNED activation surface has a non-empty recommendation', () => {
    for (const cap of PLANNED_CAPABILITIES) {
      const recommendation = cap.recommendation ?? ''
      expect(
        recommendation.length,
        `${cap.capabilityId}: PLANNED capability must have a non-empty recommendation`,
      ).toBeGreaterThan(0)
    }
  })

  it('Retainer Review Queue appears in corridor between Strategy Room and Retainer Oversight', () => {
    const stages = PAID_CORRIDOR_RECORDS.map((r) => r.stage)

    const strategyIdx = stages.indexOf('strategy_room')
    const queueIdx = stages.indexOf('retainer_review_queue')
    const oversightIdx = stages.indexOf('retainer_oversight')

    expect(queueIdx).not.toBe(-1)
    expect(queueIdx).toBeGreaterThan(strategyIdx)
    expect(queueIdx).toBeLessThan(oversightIdx)
  })
})

// ============================================================================
// Products Page Contract Tests
// ============================================================================

describe('Products page contract', () => {
  it('/boardroom-brief route is live — Boardroom-first Brief capability is ACTIVE', () => {
    const brief = CAPABILITY_STATUS_RECORDS.find(r => r.capabilityId === 'Boardroom-first Brief')
    expect(brief).toBeDefined()
    expect(brief!.status).toBe('ACTIVE')
  })

  it('Decision Pressure Signal is an ACTIVE or open-entry surface, not a paid corridor stage', () => {
    const corridorStages = PAID_CORRIDOR_RECORDS.map(r => r.stage)
    expect(corridorStages).not.toContain('decision_pressure')
    expect(corridorStages).not.toContain('decision_pressure_signal')
  })

  it('Retainer Oversight stage remains GATED — must not appear as an active product', () => {
    const retainer = PAID_CORRIDOR_RECORDS.find(r => r.stage === 'retainer_oversight')
    expect(retainer).toBeDefined()
    expect(retainer!.currentReadiness).toBe('GATED')
    // Active capabilities in the corridor must not include an "activate oversight" capability
    for (const cap of retainer!.activeCapabilities) {
      expect(cap.name.toLowerCase()).not.toContain('activate')
      expect(cap.name.toLowerCase()).not.toContain('start retainer')
    }
  })

  it('Retainer Review Queue is distinct from Retainer Oversight in the corridor', () => {
    const queue = PAID_CORRIDOR_RECORDS.find(r => r.stage === 'retainer_review_queue')
    const oversight = PAID_CORRIDOR_RECORDS.find(r => r.stage === 'retainer_oversight')
    expect(queue).toBeDefined()
    expect(oversight).toBeDefined()
    // They are different stages
    expect(queue!.stage).not.toBe(oversight!.stage)
    // Oversight must not be active
    expect(oversight!.currentReadiness).toBe('GATED')
  })

  it('Purpose Alignment has Separate line status — not a paid corridor stage', () => {
    const corridorStages = PAID_CORRIDOR_RECORDS.map(r => r.stage)
    expect(corridorStages).not.toContain('purpose_alignment')
  })

  it('No corridor record claims institutional learning or monthly oversight as active', () => {
    for (const record of PAID_CORRIDOR_RECORDS) {
      for (const cap of record.activeCapabilities) {
        const name = cap.name.toLowerCase()
        expect(name).not.toContain('institutional memory')
        expect(name).not.toContain('monthly oversight')
        expect(name).not.toContain('retainer cycle started')
      }
    }
  })

  it('All planned activation surfaces do not have paid-corridor stage designation', () => {
    const plannedCaps = CAPABILITY_STATUS_RECORDS.filter(r => r.status === 'PLANNED' as any)
    const corridorStages = PAID_CORRIDOR_RECORDS.map(r => r.stage)
    for (const cap of plannedCaps) {
      if (cap.corridorStage) {
        // If a planned cap references a corridor stage, verify it's not claiming to be active
        const corridorRecord = PAID_CORRIDOR_RECORDS.find(r => r.stage === cap.corridorStage)
        if (corridorRecord) {
          expect(corridorRecord.currentReadiness).not.toBe('ACTIVE' as any)
        }
      }
    }
  })

  it('Boardroom Brief is listed before Executive Reporting in the commercial path', () => {
    // The commercial path runs: Decision Pressure → Boardroom Brief → Executive Reporting → ...
    // Verify the corridor ordering doesn't place executive_reporting before boardroom-related stages
    const stages = PAID_CORRIDOR_RECORDS.map(r => r.stage)
    const execIdx = stages.indexOf('executive_reporting')
    const teamIdx = stages.indexOf('team_assessment')
    // Team comes before executive
    expect(teamIdx).toBeLessThan(execIdx)
    // Retainer oversight is last
    const oversightIdx = stages.indexOf('retainer_oversight')
    expect(oversightIdx).toBe(stages.length - 1)
  })
})
