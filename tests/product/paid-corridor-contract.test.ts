import { describe, expect, it } from 'vitest'
import {
  PAID_CORRIDOR_RECORDS,
  getCorridorCapabilities,
  getCorridorRecord,
  type PaidCorridorStage,
} from '@/lib/product/paid-corridor-contract'

const ALL_STAGES: PaidCorridorStage[] = [
  'team_assessment',
  'enterprise_assessment',
  'executive_reporting',
  'boardroom_mode',
  'strategy_room',
  'retainer_oversight',
]

describe('Paid Corridor Contract', () => {
  it('Team starts Operational Decision Intelligence paid corridor', () => {
    expect(PAID_CORRIDOR_RECORDS.map(record => record.stage)).toEqual(ALL_STAGES)
    expect(PAID_CORRIDOR_RECORDS[0]!.stage).toBe('team_assessment')
    expect(PAID_CORRIDOR_RECORDS[0]!.corridorRole.toLowerCase()).toContain('divergence')
  })

  it('Team cannot claim divergence without at least two respondent records', () => {
    const team = getCorridorRecord('team_assessment')!
    const evidence = team.minimumEvidenceRequired.join(' ').toLowerCase()
    const prohibited = team.mustNotShow.join(' ').toLowerCase()

    expect(evidence).toContain('multi-respondent')
    expect(evidence).toContain('minimum 2')
    expect(team.mustShow.some(item => item.toLowerCase().includes('respondent count'))).toBe(true)
    expect(prohibited).toContain('single respondent')
    expect(prohibited).toContain('cross-respondent divergence')
  })

  it('Purpose Alignment is absent from paid corridor', () => {
    expect(PAID_CORRIDOR_RECORDS.map(record => record.stage)).not.toContain('purpose_alignment')
    expect(PAID_CORRIDOR_RECORDS.some(record => record.corridorRole.toLowerCase().includes('purpose alignment'))).toBe(false)
  })

  it('Enterprise has wider/deeper evidence requirements than Team', () => {
    const team = getCorridorRecord('team_assessment')!
    const enterprise = getCorridorRecord('enterprise_assessment')!

    expect(enterprise.minimumEvidenceRequired.length).toBeGreaterThanOrEqual(team.minimumEvidenceRequired.length)
    expect(getCorridorCapabilities('enterprise_assessment').length).toBeGreaterThan(getCorridorCapabilities('team_assessment').length)
    expect(enterprise.minimumEvidenceRequired.some(item => item.toLowerCase().includes('dependency'))).toBe(true)
    expect(enterprise.minimumEvidenceRequired.some(item => item.toLowerCase().includes('scenario'))).toBe(true)
    expect(enterprise.minimumEvidenceRequired.some(item => item.toLowerCase().includes('exposure'))).toBe(true)
    expect(enterprise.minimumEvidenceRequired.some(item => item.toLowerCase().includes('board challenge'))).toBe(true)
    expect(enterprise.mustNotShow.some(item => item.toLowerCase().includes('final board recommendation'))).toBe(true)
    expect(enterprise.upgradeTrigger.toLowerCase()).toMatch(/board-level exposure|executive brief|governed execution/)
  })

  it('Executive Reporting is board-grade judgement, not Enterprise stress testing', () => {
    const exec = getCorridorRecord('executive_reporting')!
    expect(exec.corridorRole.toLowerCase()).toContain('board-grade')
    expect(exec.corridorRole.toLowerCase()).toContain('judgement')
    expect(exec.mustShow.some(item => item.toLowerCase().includes('evidence carry-forward'))).toBe(true)
    expect(exec.mustShow.some(item => item.toLowerCase().includes('known, missing, and gated'))).toBe(true)
    expect(exec.mustNotShow.some(item => item.toLowerCase().includes('enterprise stress-test'))).toBe(true)
    expect(exec.nonOverlapBoundary.toLowerCase()).toContain('judges and packages evidence')
    expect(exec.nonOverlapBoundary.toLowerCase()).toContain('enterprise stress-tests structure')
  })

  it('Boardroom Mode does not duplicate Strategy Room', () => {
    const boardroom = getCorridorRecord('boardroom_mode')!
    const strategy = getCorridorRecord('strategy_room')!

    expect(boardroom.mustNotShow.some(item => item.toLowerCase().includes('execution'))).toBe(true)
    expect(strategy.mustNotShow.some(item => item.toLowerCase().includes('board-grade'))).toBe(true)
    expect(boardroom.nonOverlapBoundary).not.toBe(strategy.nonOverlapBoundary)
  })

  it('Retainer Oversight requires recommendation/outcome memory', () => {
    const retainer = getCorridorRecord('retainer_oversight')!
    const evidence = retainer.minimumEvidenceRequired.join(' ').toLowerCase()
    expect(evidence).toContain('recommendation memory')
    expect(evidence).toContain('outcome memory')
    expect(evidence).toContain('recurrence')
    expect(evidence).toContain('cadence')
    expect(retainer.currentReadiness).toBe('GATED')
    expect(retainer.gatedCapabilities.map(capability => capability.name)).toEqual(
      expect.arrayContaining([
        'Oversight Cadence Engine',
        'Oversight Cycle Comparison',
        'Oversight Review Decision Engine',
      ]),
    )
  })

  it('Boardroom Mode and Strategy Room corridor stages', () => {
    expect(getCorridorRecord('boardroom_mode')!.currentReadiness).toBe('ACTIVE')
    expect(getCorridorRecord('strategy_room')!.currentReadiness).toBe('ACTIVE')
  })

  it('No stage promises dormant-only capability as active', () => {
    for (const record of PAID_CORRIDOR_RECORDS) {
      expect(record.activeCapabilities.every(capability => capability.status === 'ACTIVE' || capability.status === 'PARTIALLY_WIRED')).toBe(true)
      expect(record.activeCapabilities.map(capability => capability.name)).not.toEqual([])
      expect(getCorridorCapabilities(record.stage).length).toBeGreaterThan(0)
    }
  })

  it('Every corridor stage has a non-overlap boundary', () => {
    for (const record of PAID_CORRIDOR_RECORDS) {
      expect(record.nonOverlapBoundary.length).toBeGreaterThan(10)
    }
  })

  it('Every corridor stage has a payment justification', () => {
    for (const record of PAID_CORRIDOR_RECORDS) {
      expect(record.paymentJustification.length).toBeGreaterThan(10)
    }
  })

  it('Every corridor stage has firstImpressionMoment', () => {
    for (const record of PAID_CORRIDOR_RECORDS) {
      expect(record.firstImpressionMoment.length).toBeGreaterThan(10)
    }
  })
})
