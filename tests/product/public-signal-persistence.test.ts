import { describe, expect, it, beforeEach } from 'vitest'
import { runDecisionIntelligence } from '@/lib/intelligence/decision-intelligence-orchestrator'
import { getDiagnosticJourney, _resetMemoryStore } from '@/lib/product/diagnostic-journey-store'
import { persistPublicSignalFromDecisionIntelligence } from '@/lib/product/public-signal-persistence'

beforeEach(() => {
  _resetMemoryStore()
})

describe('public signal persistence', () => {
  it('persists only public-safe derived events for an anonymous public case', async () => {
    const rawInput = 'We need board approval for a launch next week, but budget ownership is unclear.'
    const result = await runDecisionIntelligence({
      surface: 'fast_diagnostic',
      rawUserInput: rawInput,
      persistJourney: false,
      caseId: 'pub-safe-persistence-001',
    })

    const persisted = await persistPublicSignalFromDecisionIntelligence({
      caseId: 'pub-safe-persistence-001',
      rawInput,
      result,
    })

    expect(persisted.caseId).toBe('pub-safe-persistence-001')
    expect(persisted.inputHash).toMatch(/^inp_/)
    expect(persisted.eventsWritten).toBeGreaterThan(0)

    const journey = await getDiagnosticJourney('pub-safe-persistence-001')
    expect(journey).toBeTruthy()
    expect(journey!.currentSurface).toBe('free_signal')
    expect(journey!.events.every((event) => event.audienceSafe)).toBe(true)
    expect(journey!.events.every((event) => event.surface === 'free_signal')).toBe(true)

    const eventTypes = journey!.events.map((event) => event.type)
    expect(eventTypes).toContain('SITUATION_TRANSLATED')
    expect(eventTypes).toContain('SYNTHESIS_GENERATED')
  })

  it('does not persist raw situation text or paid/internal structures', async () => {
    const rawInput = 'Our CEO John Smith wants secret Project Phoenix acquisition approval before Monday.'
    const result = await runDecisionIntelligence({
      surface: 'fast_diagnostic',
      rawUserInput: rawInput,
      persistJourney: false,
      caseId: 'pub-safe-persistence-no-raw',
    })

    await persistPublicSignalFromDecisionIntelligence({
      caseId: 'pub-safe-persistence-no-raw',
      rawInput,
      result,
    })

    const journey = await getDiagnosticJourney('pub-safe-persistence-no-raw')
    expect(journey).toBeTruthy()

    const serialized = JSON.stringify(journey!.events)
    expect(serialized).not.toContain(rawInput)
    expect(serialized).not.toContain('John Smith')
    expect(serialized).not.toContain('Project Phoenix')
    expect(serialized).not.toContain('authorityMap')
    expect(serialized).not.toContain('constraintGraph')
    expect(serialized).not.toContain('evidenceGraph')
    expect(serialized).not.toContain('contradictionGraph')
    expect(serialized).not.toContain('prediction')
    expect(serialized).not.toContain('checkoutUrl')
  })

  it('is idempotent for the same caseId and input hash', async () => {
    const rawInput = 'We need to decide whether to pause the release until ownership is clear.'
    const result = await runDecisionIntelligence({
      surface: 'fast_diagnostic',
      rawUserInput: rawInput,
      persistJourney: false,
      caseId: 'pub-safe-persistence-idempotent',
    })

    const first = await persistPublicSignalFromDecisionIntelligence({
      caseId: 'pub-safe-persistence-idempotent',
      rawInput,
      result,
    })
    const second = await persistPublicSignalFromDecisionIntelligence({
      caseId: 'pub-safe-persistence-idempotent',
      rawInput,
      result,
    })

    const journey = await getDiagnosticJourney('pub-safe-persistence-idempotent')
    expect(journey).toBeTruthy()
    expect(first.eventsWritten).toBeGreaterThan(0)
    expect(second.eventsWritten).toBe(0)
    expect(journey!.events.length).toBe(first.eventsWritten)
  })
})
