import { describe, expect, it } from 'vitest'
import {
  CAPABILITY_STATUS_RECORDS,
  getCapabilitiesForCorridorStage,
  getCapabilityRecord,
  validateCapabilityStatusAuthority,
} from '@/lib/product/capability-status-authority'

describe('Capability Status Authority', () => {
  it('ScenarioStressTest status reflects current wiring and is not stale', () => {
    const record = getCapabilityRecord('ScenarioStressTest')
    expect(record).toBeDefined()
    expect(record!.status).toBe('PARTIALLY_WIRED')
    expect(record!.usedBy).toContain('lib/intelligence/decision-intelligence-orchestrator.ts')
    expect(record!.outputDestination?.join(' ')).toMatch(/findings|engineTrace/i)
    expect(record!.gatingReason).toMatch(/downstream executive\/reporting/i)
  })

  it('DomainInterdependency remains GATED', () => {
    const record = getCapabilityRecord('DomainInterdependency')
    expect(record).toBeDefined()
    expect(record!.status).toBe('GATED')
    expect(record!.gatingReason).toMatch(/contradictionGraph/)
  })

  it('Team Respondent Aggregation is ACTIVE after explicit respondent persistence wiring', () => {
    const record = getCapabilityRecord('Team Respondent Aggregation')
    expect(record).toBeDefined()
    expect(record!.status).toBe('ACTIVE')
    expect(record!.usedBy).toContain('pages/api/diagnostics/submit.ts')
    expect(record!.outputProduced?.join(' ')).toMatch(/aggregate-only|single-respondent gate/i)
  })

  it('Evidence Carry-Forward Presenter is ACTIVE only when production Executive Reporting wiring is proven', () => {
    const record = getCapabilityRecord('Evidence Carry-Forward Presenter')
    expect(record).toBeDefined()

    if (record!.status === 'ACTIVE') {
      const productionWiring = [...(record!.usedBy ?? []), ...(record!.outputDestination ?? [])].join(' ')
      expect(productionWiring).toMatch(/executive_reporting|Executive Reporting/i)
      expect(productionWiring).toMatch(/pages\/api|public DTO|public result|report output/i)
    } else {
      expect(record!.status).toBe('PARTIALLY_WIRED')
      expect(record!.gatingReason).toMatch(/Executive Reporting integration|public Executive Reporting integration|before claiming active/i)
    }
  })

  it('Retainer/Oversight capabilities are not marked ACTIVE unless production wired', () => {
    const retained = CAPABILITY_STATUS_RECORDS.filter(record => record.corridorStage === 'retainer_oversight')
    expect(retained.length).toBeGreaterThan(0)
    for (const record of retained) {
      if (record.status === 'ACTIVE') {
        expect(record.outputDestination?.length || record.outputProduced?.length).toBeTruthy()
      } else {
        expect(['PARTIALLY_WIRED', 'GATED', 'DORMANT']).toContain(record.status)
      }
    }
    expect(getCapabilityRecord('Oversight Cadence Engine')!.status).toBe('GATED')
    expect(getCapabilityRecord('Oversight Cycle Comparison')!.status).toBe('GATED')
    // Operator decision path (approveForContact/declineReview/requestMoreHistory) is now wired
    expect(getCapabilityRecord('Oversight Review Decision Engine')!.status).toBe('PARTIALLY_WIRED')
    // Review queue is ACTIVE: Prisma client generated, typed (no any casts), auth routes present
    expect(getCapabilityRecord('Retainer Review Queue')!.status).toBe('ACTIVE')
  })

  it('Boardroom Mode and Strategy Room remain partially wired, not retained history claims', () => {
    // Boardroom Archive is ACTIVE because dossier generation is production-wired from Executive Reporting
    expect(getCapabilityRecord('Boardroom Archive')!.status).toBe('ACTIVE')
    // Boardroom Mode Adapter (Foundry simulation) remains PARTIALLY_WIRED
    expect(getCapabilityRecord('Boardroom Mode Adapter')!.status).toBe('PARTIALLY_WIRED')
    // Strategy Room Adapter (Foundry simulation) remains PARTIALLY_WIRED
    expect(getCapabilityRecord('Strategy Room Adapter')!.status).toBe('PARTIALLY_WIRED')
    // Strategy Room execution record persistence is now ACTIVE (end-to-end loop proven)
    expect(getCapabilityRecord('Strategy Room execution record persistence')!.status).toBe('ACTIVE')

    // Both corridor stages still have PARTIALLY_WIRED capabilities (Foundry adapters)
    expect(getCapabilitiesForCorridorStage('boardroom_mode').some(record => record.status === 'PARTIALLY_WIRED')).toBe(true)
    expect(getCapabilitiesForCorridorStage('strategy_room').some(record => record.status === 'PARTIALLY_WIRED')).toBe(true)
  })

  it('Every ACTIVE capability has outputDestination or state-changing effect', () => {
    for (const record of CAPABILITY_STATUS_RECORDS.filter(record => record.status === 'ACTIVE')) {
      expect(
        Boolean(record.outputDestination?.length || record.outputProduced?.length),
        `${record.capabilityId} lacks outputDestination/outputProduced`,
      ).toBe(true)
    }
  })

  it('Every GATED capability has gatingReason', () => {
    for (const record of CAPABILITY_STATUS_RECORDS.filter(record => record.status === 'GATED')) {
      expect(record.gatingReason, `${record.capabilityId} missing gatingReason`).toBeTruthy()
    }
  })

  it('Research/Foundry adapters are not automatically treated as production corridor capabilities', () => {
    const record = getCapabilityRecord('Research Foundry adapters')
    expect(record).toBeDefined()
    expect(record!.productLine).toBe('RESEARCH_FOUNDRY')
    expect(record!.status).toBe('INTERNAL')
    expect(record!.corridorStage).toBeUndefined()
  })

  it('Predictive engines are not treated as active production corridor unless invoked by production path', () => {
    const record = getCapabilityRecord('Predictive scenario/time-series/trajectory engines')
    expect(record).toBeDefined()
    expect(record!.productLine).toBe('RESEARCH_FOUNDRY')
    expect(record!.status).toBe('GATED')
    expect(record!.corridorStage).toBeUndefined()
  })

  it('validates authority invariants', () => {
    expect(validateCapabilityStatusAuthority()).toEqual([])
  })
})
