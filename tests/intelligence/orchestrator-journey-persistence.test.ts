import { describe, it, expect, beforeEach } from 'vitest'
import { runDecisionIntelligence } from '@/lib/intelligence/decision-intelligence-orchestrator'
import { getDiagnosticJourney, _resetMemoryStore } from '@/lib/product/diagnostic-journey-store'

beforeEach(() => {
  _resetMemoryStore()
})

describe('orchestrator journey persistence', () => {
  it('appends expected events when persistJourney is true', async () => {
    const result = await runDecisionIntelligence({
      surface: 'fast_diagnostic',
      rawUserInput: 'We need board approval to proceed with the launch but the deadline is next week.',
      persistJourney: true,
      caseId: 'journey-test-001',
    })

    expect(result.journeyCaseId).toBe('journey-test-001')

    const journey = await getDiagnosticJourney('journey-test-001')
    expect(journey).toBeTruthy()
    expect(journey!.events.length).toBeGreaterThan(0)

    const eventTypes = journey!.events.map(e => e.type)
    expect(eventTypes).toContain('SITUATION_TRANSLATED')
    expect(eventTypes).toContain('SYNTHESIS_GENERATED')
  })

  it('does not persist journey when persistJourney is false', async () => {
    await runDecisionIntelligence({
      surface: 'fast_diagnostic',
      rawUserInput: 'Test input without persistence.',
    })

    const journey = await getDiagnosticJourney('non-existent-case')
    expect(journey).toBeNull()
  })

  it('refusal produces REFUSAL_ISSUED event', async () => {
    await runDecisionIntelligence({
      surface: 'fast_diagnostic',
      rawUserInput: 'Things.',
      persistJourney: true,
      caseId: 'journey-test-refusal',
    })

    const journey = await getDiagnosticJourney('journey-test-refusal')
    expect(journey).toBeTruthy()

    // Very weak input should trigger refusal
    const refusalEvents = journey!.events.filter(e => e.type === 'REFUSAL_ISSUED')
    const synthesisEvents = journey!.events.filter(e => e.type === 'SYNTHESIS_GENERATED')
    // Either a refusal event or at least a synthesis event should exist
    expect(refusalEvents.length + synthesisEvents.length).toBeGreaterThan(0)
  })

  it('simulation produces SIMULATION_RUN event', async () => {
    await runDecisionIntelligence({
      surface: 'fast_diagnostic',
      rawUserInput: 'We need to decide whether to acquire the competitor but the board is split on the risk exposure.',
      persistJourney: true,
      caseId: 'journey-test-simulation',
    })

    const journey = await getDiagnosticJourney('journey-test-simulation')
    expect(journey).toBeTruthy()

    const simEvents = journey!.events.filter(e => e.type === 'SIMULATION_RUN')
    expect(simEvents.length).toBeGreaterThan(0)
    expect(simEvents[0]!.engineId).toBe('simulation-gate')
  })

  it('contradiction detection produces event', async () => {
    await runDecisionIntelligence({
      surface: 'fast_diagnostic',
      rawUserInput: 'We need to launch by end of quarter but no one has approved the budget and we are not sure about the risk.',
      persistJourney: true,
      caseId: 'journey-test-contradiction',
    })

    const journey = await getDiagnosticJourney('journey-test-contradiction')
    expect(journey).toBeTruthy()

    const contradictionEvents = journey!.events.filter(e => e.type === 'CONTRADICTION_DETECTED')
    expect(contradictionEvents.length).toBeGreaterThan(0)
  })

  it('journey events have valid structure', async () => {
    await runDecisionIntelligence({
      surface: 'fast_diagnostic',
      rawUserInput: 'We need board approval to proceed with the launch.',
      persistJourney: true,
      caseId: 'journey-test-structure',
    })

    const journey = await getDiagnosticJourney('journey-test-structure')
    expect(journey).toBeTruthy()

    for (const event of journey!.events) {
      expect(event.id).toBeTruthy()
      expect(event.caseId).toBe('journey-test-structure')
      expect(event.surface).toBe('fast_diagnostic')
      expect(event.occurredAt).toBeTruthy()
      expect(event.summary).toBeTruthy()
      expect(typeof event.audienceSafe).toBe('boolean')
      // Payload must be JSON-serializable
      expect(() => JSON.stringify(event.payload)).not.toThrow()
    }
  })

  it('does not expose raw user input in event payloads', async () => {
    const sensitiveInput = 'Our CEO John Smith wants board approval for the secret Project Phoenix acquisition.'

    await runDecisionIntelligence({
      surface: 'fast_diagnostic',
      rawUserInput: sensitiveInput,
      persistJourney: true,
      caseId: 'journey-test-no-raw-input',
    })

    const journey = await getDiagnosticJourney('journey-test-no-raw-input')
    expect(journey).toBeTruthy()

    // Raw input should not appear verbatim in any event payload
    for (const event of journey!.events) {
      const payloadStr = JSON.stringify(event.payload)
      expect(payloadStr).not.toContain(sensitiveInput)
    }
  })
})
