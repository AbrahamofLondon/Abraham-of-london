import { describe, it, expect, beforeEach } from 'vitest'
import {
  getOrCreateDiagnosticJourney,
  appendDiagnosticJourneyEvent,
  getDiagnosticJourney,
  _resetMemoryStore,
} from '@/lib/product/diagnostic-journey-store'
import {
  getAudienceSafeEvents,
  hasSignalContinuityData,
  hasGovernedMemoryData,
  extractSignalsFromJourney,
  extractContradictionsFromJourney,
} from '@/lib/product/diagnostic-journey-record'
import {
  getEnginesForSurface,
  getGatedEngines,
  ENGINE_ACTIVATION_REGISTRY,
} from '@/lib/intelligence/engine-activation-registry'

beforeEach(() => {
  _resetMemoryStore()
})

describe('decision centre journey continuity', () => {
  it('journey with engine events provides signal continuity data', async () => {
    await getOrCreateDiagnosticJourney({
      caseId: 'dc-test-001',
      email: 'test@example.com',
      surface: 'fast_diagnostic',
    })

    await appendDiagnosticJourneyEvent({
      caseId: 'dc-test-001',
      surface: 'fast_diagnostic',
      type: 'SITUATION_TRANSLATED',
      engineId: 'situation-translator',
      summary: 'Classified as GOVERNANCE_AND_BOARD',
      payload: {
        decisionClass: 'GOVERNANCE_AND_BOARD',
        detectedSignals: [
          { label: 'authority_gap', severity: 'HIGH' },
          { label: 'evidence_gap', severity: 'MEDIUM' },
        ],
      },
    })

    const journey = await getDiagnosticJourney('dc-test-001')
    expect(hasSignalContinuityData(journey!)).toBe(true)

    const signals = extractSignalsFromJourney(journey!)
    expect(signals.length).toBe(2)
    expect(signals[0]!.signalKey).toBe('authority_gap')
  })

  it('decision centre does not expose unsafe event payloads', async () => {
    await getOrCreateDiagnosticJourney({
      caseId: 'dc-test-002',
      surface: 'constitutional_diagnostic',
    })

    await appendDiagnosticJourneyEvent({
      caseId: 'dc-test-002',
      surface: 'constitutional_diagnostic',
      type: 'SYNTHESIS_GENERATED',
      summary: 'Safe synthesis output',
      payload: { interpretedIssue: 'Authority gap detected' },
      audienceSafe: true,
    })

    await appendDiagnosticJourneyEvent({
      caseId: 'dc-test-002',
      surface: 'constitutional_diagnostic',
      type: 'DRIFT_DETECTED',
      summary: 'Internal drift metric',
      payload: { internalScore: 0.92, rawModelOutput: 'sensitive data' },
      audienceSafe: false,
    })

    const journey = await getDiagnosticJourney('dc-test-002')
    const safeEvents = getAudienceSafeEvents(journey!)

    expect(safeEvents.length).toBe(1)
    expect(safeEvents[0]!.type).toBe('SYNTHESIS_GENERATED')

    // No unsafe payload should leak through audience-safe filter
    const safeStr = JSON.stringify(safeEvents)
    expect(safeStr).not.toContain('rawModelOutput')
    expect(safeStr).not.toContain('sensitive data')
  })

  it('registry reflects SignalContinuity as ACTIVE for decision_centre', () => {
    const dcEngines = getEnginesForSurface('decision_centre')
    const signalContinuity = dcEngines.find(e => e.engineId === 'signal-continuity')
    expect(signalContinuity).toBeTruthy()
    expect(signalContinuity!.status).toBe('ACTIVE')
  })

  it('gated engines remain gated where thresholds/stores are still missing', () => {
    const gated = getGatedEngines()

    // These should still be GATED — they require outcome history
    const assumptionDrift = gated.find(e => e.engineId === 'assumption-drift-detector')
    const failurePattern = gated.find(e => e.engineId === 'failure-pattern-calibrator')
    const driftRules = gated.find(e => e.engineId === 'drift-rules')
    const driftTribunal = gated.find(e => e.engineId === 'drift-tribunal')

    expect(assumptionDrift).toBeTruthy()
    expect(failurePattern).toBeTruthy()
    expect(driftRules).toBeTruthy()
    expect(driftTribunal).toBeTruthy()

    // Each should have a reason explaining what's missing
    expect(assumptionDrift!.gatedReason).toBeTruthy()
    expect(failurePattern!.gatedReason).toBeTruthy()
    expect(driftRules!.gatedReason).toBeTruthy()
    expect(driftTribunal!.gatedReason).toBeTruthy()
  })

  it('journey with evidence events enables governed memory data', async () => {
    await getOrCreateDiagnosticJourney({
      caseId: 'dc-test-003',
      surface: 'purpose_alignment',
    })

    // No evidence yet
    let journey = await getDiagnosticJourney('dc-test-003')
    expect(hasGovernedMemoryData(journey!)).toBe(false)

    // Add evidence event
    await appendDiagnosticJourneyEvent({
      caseId: 'dc-test-003',
      surface: 'purpose_alignment',
      type: 'EVIDENCE_CAPTURED',
      engineId: 'evidence-tier-derivation',
      summary: 'Evidence captured from purpose alignment',
      payload: { evidenceTier: 'single_source' },
    })

    journey = await getDiagnosticJourney('dc-test-003')
    expect(hasGovernedMemoryData(journey!)).toBe(true)
  })

  it('contradiction extraction from journey events works correctly', async () => {
    await getOrCreateDiagnosticJourney({
      caseId: 'dc-test-004',
      surface: 'fast_diagnostic',
    })

    await appendDiagnosticJourneyEvent({
      caseId: 'dc-test-004',
      surface: 'fast_diagnostic',
      type: 'CONTRADICTION_DETECTED',
      engineId: 'kernel-contradiction-resolver',
      summary: 'Authority vs execution contradiction',
      payload: {
        contradictions: [
          { summary: 'Authority gap blocks execution', severity: 'HIGH' },
          { summary: 'Evidence insufficient for decision', severity: 'MEDIUM' },
        ],
      },
    })

    const journey = await getDiagnosticJourney('dc-test-004')
    const contradictions = extractContradictionsFromJourney(journey!)
    expect(contradictions.length).toBe(2)
    expect(contradictions[0]!.contradiction).toBe('Authority gap blocks execution')
    expect(contradictions[0]!.severity).toBe('HIGH')
  })
})
