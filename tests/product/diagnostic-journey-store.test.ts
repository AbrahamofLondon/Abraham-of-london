import { describe, it, expect, beforeEach } from 'vitest'
import {
  getOrCreateDiagnosticJourney,
  appendDiagnosticJourneyEvent,
  getDiagnosticJourney,
  getTeamAssessmentRespondentData,
  listDiagnosticJourneysForActor,
  _resetMemoryStore,
} from '@/lib/product/diagnostic-journey-store'
import {
  getAudienceSafeEvents,
  hashInput,
  hasSignalContinuityData,
  extractSignalsFromJourney,
} from '@/lib/product/diagnostic-journey-record'

beforeEach(() => {
  _resetMemoryStore()
})

describe('journey creation', () => {
  it('creates a new journey for a new caseId', async () => {
    const journey = await getOrCreateDiagnosticJourney({
      caseId: 'test-case-001',
      surface: 'fast_diagnostic',
    })

    expect(journey.caseId).toBe('test-case-001')
    expect(journey.currentSurface).toBe('fast_diagnostic')
    expect(journey.status).toBe('ACTIVE')
    expect(journey.events).toEqual([])
    expect(journey.createdAt).toBeTruthy()
    expect(journey.updatedAt).toBeTruthy()
  })

  it('returns existing journey for same caseId', async () => {
    const first = await getOrCreateDiagnosticJourney({
      caseId: 'test-case-002',
      surface: 'fast_diagnostic',
    })
    const second = await getOrCreateDiagnosticJourney({
      caseId: 'test-case-002',
      surface: 'purpose_alignment',
    })

    expect(first.caseId).toBe(second.caseId)
    expect(second.currentSurface).toBe('purpose_alignment')
  })
})

describe('event appending', () => {
  it('appends events in order', async () => {
    await getOrCreateDiagnosticJourney({
      caseId: 'test-case-003',
      surface: 'fast_diagnostic',
    })

    const event1 = await appendDiagnosticJourneyEvent({
      caseId: 'test-case-003',
      surface: 'fast_diagnostic',
      type: 'SITUATION_TRANSLATED',
      engineId: 'situation-translator',
      summary: 'Classified as GOVERNANCE_AND_BOARD',
      payload: { decisionClass: 'GOVERNANCE_AND_BOARD', detectedSignals: [] },
    })

    const event2 = await appendDiagnosticJourneyEvent({
      caseId: 'test-case-003',
      surface: 'fast_diagnostic',
      type: 'LENSES_RUN',
      engineId: 'kernel-lens-runner',
      summary: '5 lenses produced 12 findings',
      payload: { lensCount: 5, findingCount: 12 },
    })

    const journey = await getDiagnosticJourney('test-case-003')
    expect(journey).toBeTruthy()
    expect(journey!.events.length).toBe(2)
    expect(journey!.events[0]!.type).toBe('SITUATION_TRANSLATED')
    expect(journey!.events[1]!.type).toBe('LENSES_RUN')
    expect(event1.id).toBeTruthy()
    expect(event2.id).toBeTruthy()
  })

  it('event payloads are JSON-safe', async () => {
    await getOrCreateDiagnosticJourney({
      caseId: 'test-case-004',
      surface: 'fast_diagnostic',
    })

    await appendDiagnosticJourneyEvent({
      caseId: 'test-case-004',
      surface: 'fast_diagnostic',
      type: 'SIMULATION_RUN',
      engineId: 'simulation-gate',
      summary: '3 paths simulated',
      payload: {
        pathCount: 3,
        paths: [
          { label: 'Proceed', riskShift: 'HIGHER', admissible: false },
          { label: 'Delay', riskShift: 'LOWER', admissible: true },
        ],
      },
    })

    const journey = await getDiagnosticJourney('test-case-004')
    const serialized = JSON.stringify(journey!.events[0]!.payload)
    expect(() => JSON.parse(serialized)).not.toThrow()
  })

  it('raw input is not exposed in public journey output', async () => {
    const rawInput = 'We need board approval to proceed with the confidential acquisition.'
    await getOrCreateDiagnosticJourney({
      caseId: 'test-case-005',
      surface: 'fast_diagnostic',
    })

    await appendDiagnosticJourneyEvent({
      caseId: 'test-case-005',
      surface: 'fast_diagnostic',
      type: 'SITUATION_TRANSLATED',
      engineId: 'situation-translator',
      inputHash: hashInput(rawInput),
      summary: 'Classified as GOVERNANCE_AND_BOARD',
      payload: { decisionClass: 'GOVERNANCE_AND_BOARD' },
      audienceSafe: true,
    })

    const journey = await getDiagnosticJourney('test-case-005')
    const safeEvents = getAudienceSafeEvents(journey!)
    const fullPayloadStr = JSON.stringify(safeEvents)
    expect(fullPayloadStr).not.toContain(rawInput)
    expect(safeEvents[0]!.inputHash).toBeTruthy()
    expect(safeEvents[0]!.inputHash).not.toBe(rawInput)
  })
})

describe('audience safety', () => {
  it('filters unsafe events from audience-safe output', async () => {
    await getOrCreateDiagnosticJourney({
      caseId: 'test-case-006',
      surface: 'constitutional_diagnostic',
    })

    await appendDiagnosticJourneyEvent({
      caseId: 'test-case-006',
      surface: 'constitutional_diagnostic',
      type: 'SYNTHESIS_GENERATED',
      summary: 'Safe synthesis',
      payload: {},
      audienceSafe: true,
    })

    await appendDiagnosticJourneyEvent({
      caseId: 'test-case-006',
      surface: 'constitutional_diagnostic',
      type: 'DRIFT_DETECTED',
      summary: 'Internal drift detection',
      payload: { internalMetric: 0.95 },
      audienceSafe: false,
    })

    const journey = await getDiagnosticJourney('test-case-006')
    expect(journey!.events.length).toBe(2)

    const safeEvents = getAudienceSafeEvents(journey!)
    expect(safeEvents.length).toBe(1)
    expect(safeEvents[0]!.type).toBe('SYNTHESIS_GENERATED')
  })
})

describe('journey retrieval', () => {
  it('returns null for non-existent journey', async () => {
    const journey = await getDiagnosticJourney('non-existent')
    expect(journey).toBeNull()
  })

  it('lists journeys by email', async () => {
    await getOrCreateDiagnosticJourney({
      caseId: 'case-a',
      email: 'test@example.com',
      surface: 'fast_diagnostic',
    })
    await getOrCreateDiagnosticJourney({
      caseId: 'case-b',
      email: 'test@example.com',
      surface: 'purpose_alignment',
    })
    await getOrCreateDiagnosticJourney({
      caseId: 'case-c',
      email: 'other@example.com',
      surface: 'fast_diagnostic',
    })

    const journeys = await listDiagnosticJourneysForActor({
      email: 'test@example.com',
    })
    expect(journeys.length).toBe(2)
    expect(journeys.map(j => j.caseId).sort()).toEqual(['case-a', 'case-b'])
  })

  it('retrieves aggregate-only team respondentData by caseId', async () => {
    await getOrCreateDiagnosticJourney({
      caseId: 'team-shared-case',
      surface: 'team_assessment',
    })

    await appendDiagnosticJourneyEvent({
      caseId: 'team-shared-case',
      surface: 'team_assessment',
      type: 'EVIDENCE_CAPTURED',
      summary: 'Team respondent evidence captured.',
      payload: {
        respondentData: {
          respondentRole: 'CEO',
          perceivedDecision: 'Approve the operating model',
          perceivedOwner: 'CEO',
          perceivedBlocker: 'Budget',
          authorityClarity: 80,
          evidenceClarity: 75,
          executionConfidence: 70,
          consequenceAwareness: 85,
          leadershipAvoidanceSignal: 'low',
        },
        audienceSafe: 'aggregate_only',
      },
      audienceSafe: false,
    })

    const respondents = await getTeamAssessmentRespondentData('team-shared-case')
    expect(respondents).toEqual([
      expect.objectContaining({
        respondentRole: 'CEO',
        perceivedOwner: 'CEO',
        perceivedBlocker: 'Budget',
        authorityClarity: 80,
      }),
    ])
  })
})

describe('signal continuity data extraction', () => {
  it('detects signal continuity data availability', async () => {
    const journey = await getOrCreateDiagnosticJourney({
      caseId: 'test-case-007',
      surface: 'fast_diagnostic',
    })

    expect(hasSignalContinuityData(journey)).toBe(false)

    await appendDiagnosticJourneyEvent({
      caseId: 'test-case-007',
      surface: 'fast_diagnostic',
      type: 'SITUATION_TRANSLATED',
      engineId: 'situation-translator',
      summary: 'Classified as COMPLIANCE_AND_FILING',
      payload: { detectedSignals: [{ label: 'authority_gap', severity: 'HIGH' }] },
    })

    const updated = await getDiagnosticJourney('test-case-007')
    expect(hasSignalContinuityData(updated!)).toBe(true)
  })

  it('extracts signals from journey events', async () => {
    await getOrCreateDiagnosticJourney({
      caseId: 'test-case-008',
      surface: 'fast_diagnostic',
    })

    await appendDiagnosticJourneyEvent({
      caseId: 'test-case-008',
      surface: 'fast_diagnostic',
      type: 'SITUATION_TRANSLATED',
      engineId: 'situation-translator',
      summary: 'Test classification',
      payload: {
        detectedSignals: [
          { label: 'authority_gap', severity: 'HIGH' },
          { label: 'evidence_gap', severity: 'MEDIUM' },
        ],
      },
    })

    const journey = await getDiagnosticJourney('test-case-008')
    const signals = extractSignalsFromJourney(journey!)
    expect(signals.length).toBe(2)
    expect(signals[0]!.signalKey).toBe('authority_gap')
    expect(signals[0]!.severity).toBe(0.75)
    expect(signals[1]!.signalKey).toBe('evidence_gap')
    expect(signals[1]!.severity).toBe(0.5)
  })
})

describe('hashInput', () => {
  it('produces deterministic hash', () => {
    const hash1 = hashInput('test input')
    const hash2 = hashInput('test input')
    expect(hash1).toBe(hash2)
    expect(hash1).toMatch(/^inp_/)
  })

  it('produces different hashes for different inputs', () => {
    const hash1 = hashInput('input one')
    const hash2 = hashInput('input two')
    expect(hash1).not.toBe(hash2)
  })
})
