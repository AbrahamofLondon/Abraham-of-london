import { describe, it, expect } from 'vitest'
import {
  PRODUCT_OPERATING_MATRIX,
  getOperatingRecord,
  getAllowedEnginesForSurface,
  assertSurfaceMayUseEngine,
  getRequiredJourneyEvents,
  getFutureEnginePreparation,
  assertMatrixCoversRegistry,
} from '@/lib/intelligence/product-operating-matrix'
import {
  ENGINE_ACTIVATION_REGISTRY,
  type ProductSurface,
} from '@/lib/intelligence/engine-activation-registry'

const ALL_SURFACES: ProductSurface[] = [
  'free_signal', 'fast_diagnostic', 'purpose_alignment',
  'constitutional_diagnostic', 'team_assessment', 'enterprise_assessment',
  'executive_reporting', 'decision_centre', 'strategy_room',
  'oversight', 'admin',
]

describe('Product Operating Matrix', () => {
  // 1. Every known ProductSurface has a matrix record
  it('every known ProductSurface has a matrix record', () => {
    for (const surface of ALL_SURFACES) {
      const record = getOperatingRecord(surface)
      expect(record, `Missing matrix record for surface: ${surface}`).toBeDefined()
      expect(record!.surface).toBe(surface)
      expect(record!.purpose.length).toBeGreaterThan(0)
    }
    expect(PRODUCT_OPERATING_MATRIX.length).toBe(ALL_SURFACES.length)
  })

  // 2. Every ACTIVE engine is allowed by at least one surface
  it('every ACTIVE engine is allowed by at least one surface', () => {
    const activeEngines = ENGINE_ACTIVATION_REGISTRY.filter(e => e.status === 'ACTIVE')
    const allAllowed = new Set<string>()
    for (const record of PRODUCT_OPERATING_MATRIX) {
      for (const id of record.engines.allowed) allAllowed.add(id)
    }
    for (const engine of activeEngines) {
      expect(allAllowed.has(engine.engineId), `ACTIVE engine "${engine.engineId}" not allowed by any surface`).toBe(true)
    }
  })

  // 3. GATED engines are named in futureEnginePreparation
  it('GATED engines are in futureEnginePreparation or have clear gated reason', () => {
    const gatedEngines = ENGINE_ACTIVATION_REGISTRY.filter(e => e.status === 'GATED')
    const allFuture = new Set<string>()
    for (const record of PRODUCT_OPERATING_MATRIX) {
      for (const id of record.futureEnginePreparation) allFuture.add(id)
    }
    for (const engine of gatedEngines) {
      const inFuture = allFuture.has(engine.engineId)
      const hasReason = Boolean(engine.gatedReason)
      expect(inFuture || hasReason, `GATED engine "${engine.engineId}" not in futureEnginePreparation and no gatedReason`).toBe(true)
    }
  })

  // 4. fast_diagnostic requires journey events
  it('fast_diagnostic requires journey events', () => {
    const events = getRequiredJourneyEvents('fast_diagnostic')
    expect(events.length).toBeGreaterThan(0)
    expect(events).toContain('SITUATION_TRANSLATED')
    expect(events).toContain('SYNTHESIS_GENERATED')
  })

  // 5. purpose_alignment requires journey events and recommendation preparation
  it('purpose_alignment requires journey events and recommendation preparation', () => {
    const record = getOperatingRecord('purpose_alignment')!
    expect(record.persistence.requiredJourneyEvents.length).toBeGreaterThan(0)
    expect(record.persistence.requiredJourneyEvents).toContain('ACTION_RECOMMENDED')
    expect(record.persistence.requiresRecommendationLedger).toBe(true)
  })

  // 6. constitutional_diagnostic requires constitutional outputs and route/refusal conditions
  it('constitutional_diagnostic requires constitutional outputs and refusal conditions', () => {
    const record = getOperatingRecord('constitutional_diagnostic')!
    expect(record.outputs.requiredUserVisibleOutputs).toContain('constitutional_route')
    expect(record.outputs.requiredUserVisibleOutputs).toContain('constitutional_readiness')
    expect(record.outputs.requiredUserVisibleOutputs).toContain('failure_modes')
    expect(record.outputs.refusalConditions.length).toBeGreaterThan(0)
    expect(record.engines.allowed).toContain('constitutional-engine')
    expect(record.engines.allowed).toContain('assessment-engine')
  })

  // 7. team_assessment prepares cross-respondent and contradiction engines
  it('team_assessment prepares contradiction engines', () => {
    const record = getOperatingRecord('team_assessment')!
    expect(record.futureEnginePreparation).toContain('contradiction-forcing')
    expect(record.engines.allowed).toContain('kernel-contradiction-resolver')
    expect(record.engines.allowed).toContain('contradiction-graph')
  })

  // 8. enterprise_assessment prepares scenario stress and domain interdependency
  it('enterprise_assessment prepares scenario stress and domain interdependency', () => {
    const record = getOperatingRecord('enterprise_assessment')!
    expect(record.engines.allowed).toContain('scenario-stress-test')
    expect(record.futureEnginePreparation).not.toContain('scenario-stress-test')
    expect(record.engines.allowed).toContain('domain-interdependency')
    expect(record.engines.allowed).toContain('decision-simulation-engine')
  })

  // 9. decision_centre requires journey/memory/continuity outputs
  it('decision_centre requires journey/memory/continuity outputs', () => {
    const record = getOperatingRecord('decision_centre')!
    expect(record.outputs.requiredUserVisibleOutputs).toContain('governed_memory_panel')
    expect(record.outputs.requiredUserVisibleOutputs).toContain('continuity_status')
    expect(record.outputs.requiredUserVisibleOutputs).toContain('case_card')
    expect(record.persistence.memorySources.length).toBeGreaterThan(0)
    expect(record.persistence.memorySources).toContain('journey_events')
    expect(record.persistence.memorySources).toContain('governed_memory')
  })

  // 10. strategy_room requires recommendation/outcome ledger preparation
  it('strategy_room requires recommendation/outcome ledger preparation', () => {
    const record = getOperatingRecord('strategy_room')!
    expect(record.persistence.requiresRecommendationLedger).toBe(true)
    expect(record.persistence.memorySources).toContain('recommendation_ledger')
    expect(record.persistence.memorySources).toContain('outcome_verification')
    expect(record.persistence.requiredJourneyEvents).toContain('OUTCOME_REPORTED')
    expect(record.persistence.requiredJourneyEvents).toContain('ACTION_RECOMMENDED')
  })

  // 11. assertSurfaceMayUseEngine blocks prohibited engine usage
  it('assertSurfaceMayUseEngine blocks prohibited engines', () => {
    // free_signal prohibits lens engines
    expect(() => assertSurfaceMayUseEngine('free_signal', 'authority-lens')).toThrow('prohibits')
    // free_signal allows situation-translator
    expect(() => assertSurfaceMayUseEngine('free_signal', 'situation-translator')).not.toThrow()
    // fast_diagnostic prohibits decision-simulation-engine
    expect(() => assertSurfaceMayUseEngine('fast_diagnostic', 'decision-simulation-engine')).toThrow()
    // constitutional_diagnostic allows constitutional-engine
    expect(() => assertSurfaceMayUseEngine('constitutional_diagnostic', 'constitutional-engine')).not.toThrow()
  })

  // 12. No surface has empty requiredUserVisibleOutputs if client-facing
  it('no client-facing surface has empty requiredUserVisibleOutputs', () => {
    const clientFacing: ProductSurface[] = [
      'free_signal', 'fast_diagnostic', 'purpose_alignment',
      'constitutional_diagnostic', 'team_assessment', 'enterprise_assessment',
      'executive_reporting', 'decision_centre', 'strategy_room',
    ]
    for (const surface of clientFacing) {
      const record = getOperatingRecord(surface)!
      expect(
        record.outputs.requiredUserVisibleOutputs.length,
        `Client-facing surface "${surface}" has empty requiredUserVisibleOutputs`,
      ).toBeGreaterThan(0)
    }
  })

  // Bonus: assertMatrixCoversRegistry passes
  it('assertMatrixCoversRegistry passes without errors', () => {
    expect(() => assertMatrixCoversRegistry()).not.toThrow()
  })

  // Bonus: prohibited engines cannot be in allowed list
  it('no surface has an engine in both allowed and prohibited', () => {
    for (const record of PRODUCT_OPERATING_MATRIX) {
      const overlap = record.engines.allowed.filter(e => record.engines.prohibited.includes(e))
      expect(overlap, `Surface "${record.surface}" has engines in both allowed and prohibited: ${overlap.join(', ')}`).toEqual([])
    }
  })

  // Bonus: every surface has a purpose
  it('every surface has a non-empty purpose', () => {
    for (const record of PRODUCT_OPERATING_MATRIX) {
      expect(record.purpose.length).toBeGreaterThan(10)
    }
  })

  it('every surface declares product line authority and evidence policy', () => {
    for (const record of PRODUCT_OPERATING_MATRIX) {
      expect(record.productLine).toBeTruthy()
      expect(record.allowedEvidenceTypes.length).toBeGreaterThan(0)
      expect(record.contributionPolicy.length).toBeGreaterThan(10)
      expect(record.prohibitedClaims.length).toBeGreaterThan(0)
    }
  })

  it('Purpose Alignment is separate from the Operational Decision Intelligence corridor', () => {
    const purpose = getOperatingRecord('purpose_alignment')!
    expect(purpose.productLine).toBe('PURPOSE_ALIGNMENT')
    expect(purpose.corridorStage).toBeUndefined()
    expect(purpose.allowedEvidenceTypes).toEqual([
      'personal_pattern',
      'behavioural_contract',
      'contract_breach',
      'avoided_decision',
      'recurrence',
    ])
    expect(purpose.prohibitedClaims.join(' ')).toMatch(/corporate diagnosis/i)
  })

  it('corporate surfaces use Operational Decision Intelligence evidence policy', () => {
    for (const surface of ['team_assessment', 'enterprise_assessment', 'executive_reporting', 'strategy_room'] as const) {
      const record = getOperatingRecord(surface)!
      expect(record.productLine).toBe('OPERATIONAL_DECISION_INTELLIGENCE')
      expect(record.allowedEvidenceTypes).toContain('case_decision')
      expect(record.allowedEvidenceTypes).toContain('stakeholder')
      expect(record.allowedEvidenceTypes).toContain('outcome')
      expect(record.allowedEvidenceTypes).toContain('authority_structure')
      expect(record.allowedEvidenceTypes).toContain('scenario_stress')
      expect(record.allowedEvidenceTypes).toContain('evidence_lineage')
      expect(record.prohibitedClaims.join(' ')).not.toMatch(/requires purpose alignment/i)
    }
  })
})
