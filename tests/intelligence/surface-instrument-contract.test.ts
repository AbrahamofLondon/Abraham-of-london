import { describe, it, expect } from 'vitest'
import {
  SURFACE_INSTRUMENT_CONTRACTS,
  getInstrumentContract,
  getEngineUnlocks,
  getUnlockableEngines,
  getMissingFieldsForEngines,
  isMinimumViableInputSatisfied,
  getRecommendedNextFields,
} from '@/lib/intelligence/surface-instrument-contract'
import { ENGINE_ACTIVATION_REGISTRY } from '@/lib/intelligence/engine-activation-registry'
import { getOperatingRecord } from '@/lib/intelligence/product-operating-matrix'

const INSTRUMENTED_SURFACES = [
  'free_signal', 'fast_diagnostic', 'purpose_alignment',
  'constitutional_diagnostic', 'team_assessment', 'enterprise_assessment',
] as const

describe('Surface Instrument Contract', () => {
  // 1. Every surface has an instrument contract
  it('every instrumented surface has a contract', () => {
    for (const surface of INSTRUMENTED_SURFACES) {
      const contract = getInstrumentContract(surface)
      expect(contract, `Missing instrument contract for: ${surface}`).toBeDefined()
      expect(contract!.surface).toBe(surface)
      expect(contract!.primaryUserQuestion.length).toBeGreaterThan(10)
      expect(contract!.fields.length).toBeGreaterThan(0)
    }
    expect(SURFACE_INSTRUMENT_CONTRACTS.length).toBe(INSTRUMENTED_SURFACES.length)
  })

  // 2. Every ACTIVE/GATED engine has at least one field that can unlock or prepare it
  it('every ACTIVE or GATED engine has at least one unlock field across all surfaces', () => {
    const allUnlockEngineIds = new Set<string>()
    for (const contract of SURFACE_INSTRUMENT_CONTRACTS) {
      for (const unlock of contract.engineUnlocks) {
        allUnlockEngineIds.add(unlock.engineId)
      }
    }

    const activeOrGated = ENGINE_ACTIVATION_REGISTRY.filter(
      e => e.status === 'ACTIVE' || e.status === 'GATED',
    )

    // INTERNAL engines are exempt — they don't need user input
    for (const engine of activeOrGated) {
      expect(
        allUnlockEngineIds.has(engine.engineId),
        `Engine "${engine.engineId}" (${engine.status}) has no unlock field in any surface instrument contract`,
      ).toBe(true)
    }
  })

  // 3. ScenarioStressTest requires scenarioResponses
  it('scenario-stress-test requires scenario_responses', () => {
    const enterprise = getInstrumentContract('enterprise_assessment')!
    const stressUnlock = enterprise.engineUnlocks.find(u => u.engineId === 'scenario-stress-test')
    expect(stressUnlock).toBeDefined()
    expect(stressUnlock!.requiredFields).toContain('scenario_responses')
  })

  // 4. DomainInterdependency requires domainScores and dependency map
  it('domain-interdependency requires domain_scores and dependency_map', () => {
    const enterprise = getInstrumentContract('enterprise_assessment')!
    const domainUnlock = enterprise.engineUnlocks.find(u => u.engineId === 'domain-interdependency')
    expect(domainUnlock).toBeDefined()
    expect(domainUnlock!.requiredFields).toContain('domain_scores')
    expect(domainUnlock!.requiredFields).toContain('dependency_map')
  })

  // 5. ContradictionForcing requires diagnostic answer patterns
  it('contradiction-forcing requires answer-pattern fields', () => {
    // Check across surfaces that have contradiction-forcing in unlocks
    const surfacesWithForcing = SURFACE_INSTRUMENT_CONTRACTS.filter(
      c => c.engineUnlocks.some(u => u.engineId === 'contradiction-forcing'),
    )
    expect(surfacesWithForcing.length).toBeGreaterThan(0)

    for (const contract of surfacesWithForcing) {
      const forcing = contract.engineUnlocks.find(u => u.engineId === 'contradiction-forcing')!
      expect(forcing.requiredFields.length).toBeGreaterThan(0)
    }
  })

  // 6. Team cross-respondent output requires respondentCount > 1
  it('team_assessment refusal conditions require multiple respondents', () => {
    const team = getInstrumentContract('team_assessment')!
    const hasRespondentRefusal = team.refusalConditions.some(
      c => c.toLowerCase().includes('respondent') || c.toLowerCase().includes('single'),
    )
    expect(hasRespondentRefusal).toBe(true)
  })

  // 7. Free Signal does not require long form input
  it('free_signal has only one required field', () => {
    const free = getInstrumentContract('free_signal')!
    const requiredFields = free.fields.filter(f => f.required)
    expect(requiredFields.length).toBe(1)
    expect(requiredFields[0]!.key).toBe('situation')
  })

  // 8. Enterprise requires scenario questions
  it('enterprise_assessment requires scenario_responses in minimumViableInput', () => {
    const enterprise = getInstrumentContract('enterprise_assessment')!
    expect(enterprise.minimumViableInput).toContain('scenario_responses')
  })

  // 9. Constitutional requires authority/mandate fields
  it('constitutional_diagnostic requires authority and mandate fields', () => {
    const constitutional = getInstrumentContract('constitutional_diagnostic')!
    expect(constitutional.minimumViableInput).toContain('decision_owner')
    expect(constitutional.minimumViableInput).toContain('approving_authority')
    expect(constitutional.minimumViableInput).toContain('mandate_source')
  })

  // 10. No wowOutputRequirement exists without supporting fields
  it('every wowOutputRequirement has supporting engine unlocks', () => {
    for (const contract of SURFACE_INSTRUMENT_CONTRACTS) {
      expect(
        contract.engineUnlocks.length,
        `Surface "${contract.surface}" has wowOutputRequirements but no engine unlocks`,
      ).toBeGreaterThan(0)
      expect(
        contract.wowOutputRequirements.length,
        `Surface "${contract.surface}" has no wowOutputRequirements`,
      ).toBeGreaterThan(0)
    }
  })

  // 11. No field captures private respondent text unless privacyLevel is private or aggregate_only
  it('private respondent text fields have correct privacy level', () => {
    for (const contract of SURFACE_INSTRUMENT_CONTRACTS) {
      for (const field of contract.fields) {
        if (field.key.includes('respondent') || field.key.includes('leadership_avoidance')) {
          expect(
            field.privacyLevel === 'private' || field.privacyLevel === 'aggregate_only',
            `Field "${field.key}" in "${contract.surface}" captures sensitive data but has privacyLevel "${field.privacyLevel}"`,
          ).toBe(true)
        }
      }
    }
  })

  // 12. Operating matrix and instrument contract agree on allowed engines
  it('instrument engine unlocks are subset of matrix allowed engines', () => {
    for (const contract of SURFACE_INSTRUMENT_CONTRACTS) {
      const matrixRecord = getOperatingRecord(contract.surface)
      if (!matrixRecord) continue

      const matrixAllowed = new Set([
        ...matrixRecord.engines.allowed,
        ...matrixRecord.futureEnginePreparation,
      ])

      for (const unlock of contract.engineUnlocks) {
        expect(
          matrixAllowed.has(unlock.engineId),
          `Engine "${unlock.engineId}" in instrument contract for "${contract.surface}" not in matrix allowed or futurePrep`,
        ).toBe(true)
      }
    }
  })

  // Bonus: getUnlockableEngines works correctly
  it('getUnlockableEngines returns engines when fields are present', () => {
    const unlocked = getUnlockableEngines('fast_diagnostic', ['situation'])
    expect(unlocked.length).toBeGreaterThan(5)

    const empty = getUnlockableEngines('fast_diagnostic', [])
    expect(empty.length).toBe(0)
  })

  // Bonus: getMissingFieldsForEngines identifies gaps
  it('getMissingFieldsForEngines identifies what is needed', () => {
    const missing = getMissingFieldsForEngines('enterprise_assessment', ['domain_scores'])
    const domainDep = missing.find(m => m.engineId === 'domain-interdependency')
    expect(domainDep).toBeDefined()
    expect(domainDep!.missingFields).toContain('dependency_map')
  })

  // Bonus: isMinimumViableInputSatisfied
  it('isMinimumViableInputSatisfied works correctly', () => {
    expect(isMinimumViableInputSatisfied('free_signal', ['situation'])).toBe(true)
    expect(isMinimumViableInputSatisfied('free_signal', [])).toBe(false)
    expect(isMinimumViableInputSatisfied(
      'constitutional_diagnostic',
      ['decision_owner', 'approving_authority', 'mandate_source'],
    )).toBe(true)
    expect(isMinimumViableInputSatisfied(
      'constitutional_diagnostic',
      ['decision_owner'],
    )).toBe(false)
  })

  // Bonus: getRecommendedNextFields sorts by impact
  it('getRecommendedNextFields suggests high-impact fields first', () => {
    const next = getRecommendedNextFields('fast_diagnostic', ['situation'])
    expect(next.length).toBeGreaterThan(0)
    // First recommendation should unlock more engines than last
    if (next.length >= 2) {
      expect(next[0]!.requiredForEngines.length).toBeGreaterThanOrEqual(
        next[next.length - 1]!.requiredForEngines.length,
      )
    }
  })
})
