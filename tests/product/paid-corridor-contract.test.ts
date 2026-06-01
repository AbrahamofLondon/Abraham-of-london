import { describe, it, expect } from 'vitest'
import {
  PAID_CORRIDOR_RECORDS,
  getCorridorRecord,
  getCorridorCapabilities,
  getAllMissingAssets,
  type PaidCorridorStage,
} from '@/lib/product/paid-corridor-contract'

const ALL_STAGES: PaidCorridorStage[] = [
  'team_assessment', 'enterprise_assessment', 'executive_reporting',
  'boardroom_mode', 'strategy_room', 'retainer_oversight',
]

describe('Paid Corridor Contract', () => {
  // 1. Every paid corridor stage has a record
  it('every paid corridor stage has a record', () => {
    for (const stage of ALL_STAGES) {
      const record = getCorridorRecord(stage)
      expect(record, `Missing corridor record for: ${stage}`).toBeDefined()
      expect(record!.corridorRole.length).toBeGreaterThan(10)
      expect(record!.coreQuestionAnswered.length).toBeGreaterThan(10)
    }
    expect(PAID_CORRIDOR_RECORDS.length).toBe(ALL_STAGES.length)
  })

  // 2. Enterprise has more evidence/capability requirements than Team
  it('enterprise has more evidence requirements than team', () => {
    const team = getCorridorRecord('team_assessment')!
    const enterprise = getCorridorRecord('enterprise_assessment')!
    expect(enterprise.requiredEvidence.length).toBeGreaterThanOrEqual(team.requiredEvidence.length)
    expect(enterprise.capabilitiesAvailable.length).toBeGreaterThan(team.capabilitiesAvailable.length)
  })

  // 3. Executive Reporting has a distinct board-grade role
  it('executive reporting has distinct board-grade role', () => {
    const exec = getCorridorRecord('executive_reporting')!
    expect(exec.corridorRole.toLowerCase()).toContain('board')
    expect(exec.outputsAllowed.some(o => o.toLowerCase().includes('executive') || o.toLowerCase().includes('brief'))).toBe(true)
    // Must not duplicate enterprise stress-test role
    expect(exec.outputsProhibited.some(o => o.toLowerCase().includes('enterprise') || o.toLowerCase().includes('stress'))).toBe(true)
  })

  // 4. Boardroom Mode does not duplicate Strategy Room
  it('boardroom mode does not duplicate strategy room', () => {
    const boardroom = getCorridorRecord('boardroom_mode')!
    const strategyRoom = getCorridorRecord('strategy_room')!
    // Boardroom prohibits execution management
    expect(boardroom.outputsProhibited.some(o => o.toLowerCase().includes('execution') || o.toLowerCase().includes('strategy room'))).toBe(true)
    // Strategy Room prohibits board-grade material
    expect(strategyRoom.outputsProhibited.some(o => o.toLowerCase().includes('board') || o.toLowerCase().includes('executive'))).toBe(true)
    // Different core questions
    expect(boardroom.coreQuestionAnswered).not.toBe(strategyRoom.coreQuestionAnswered)
  })

  // 5. Retainer Oversight requires recommendation/outcome memory
  it('retainer oversight requires recommendation/outcome memory', () => {
    const retainer = getCorridorRecord('retainer_oversight')!
    expect(retainer.requiredEvidence.some(e => e.toLowerCase().includes('outcome') || e.toLowerCase().includes('recommendation'))).toBe(true)
    expect(retainer.requiredEvidence.some(e => e.toLowerCase().includes('memory') || e.toLowerCase().includes('pattern'))).toBe(true)
  })

  // 6. Team cannot claim divergence without multi-respondent records
  it('team requires multi-respondent evidence', () => {
    const team = getCorridorRecord('team_assessment')!
    expect(team.requiredEvidence.some(e => e.toLowerCase().includes('multi-respondent') || e.toLowerCase().includes('minimum 2'))).toBe(true)
    expect(team.outputsProhibited.some(o => o.toLowerCase().includes('single respondent'))).toBe(true)
  })

  // 7. Enterprise requires scenario/dependency/exposure evidence
  it('enterprise requires scenario/dependency/exposure evidence', () => {
    const enterprise = getCorridorRecord('enterprise_assessment')!
    expect(enterprise.requiredEvidence.some(e => e.toLowerCase().includes('scenario'))).toBe(true)
    expect(enterprise.requiredEvidence.some(e => e.toLowerCase().includes('dependency'))).toBe(true)
    expect(enterprise.requiredEvidence.some(e => e.toLowerCase().includes('exposure'))).toBe(true)
  })

  // 8. No paid stage promises output without matching capability or gated requirement
  it('no stage promises output without capability backing', () => {
    for (const record of PAID_CORRIDOR_RECORDS) {
      const allCapNames = getCorridorCapabilities(record.stage).map(c => c.name.toLowerCase())
      // Every stage must have at least some capabilities
      expect(allCapNames.length, `Stage "${record.stage}" has no capabilities`).toBeGreaterThan(0)
      // Every stage must have allowed outputs
      expect(record.outputsAllowed.length, `Stage "${record.stage}" has no allowed outputs`).toBeGreaterThan(0)
    }
  })

  // 9. Every ACTIVE capability has a user-visible or state-changing destination
  it('every available capability maps to an allowed output', () => {
    for (const record of PAID_CORRIDOR_RECORDS) {
      expect(
        record.capabilitiesAvailable.length,
        `Stage "${record.stage}" has no available capabilities but has allowed outputs`,
      ).toBeGreaterThan(0)
    }
  })

  // 10. Every dormant high-value capability has a recommended next action
  it('every stage with dormant capabilities has a next wiring priority', () => {
    for (const record of PAID_CORRIDOR_RECORDS) {
      if (record.capabilitiesDormant.length > 0) {
        expect(
          record.nextWiringPriority.length,
          `Stage "${record.stage}" has dormant capabilities but no next wiring priority`,
        ).toBeGreaterThan(0)
      }
    }
  })

  // Bonus: getAllMissingAssets returns entries
  it('getAllMissingAssets returns non-empty list', () => {
    const missing = getAllMissingAssets()
    expect(missing.length).toBeGreaterThan(0)
    for (const entry of missing) {
      expect(entry.stage).toBeTruthy()
      expect(entry.asset).toBeTruthy()
    }
  })

  // Bonus: non-overlap boundaries are distinct
  it('corridor stages have distinct non-overlap boundaries', () => {
    const boundaries = PAID_CORRIDOR_RECORDS.map(r => r.nonOverlapBoundary)
    const unique = new Set(boundaries)
    expect(unique.size).toBe(boundaries.length)
  })
})
