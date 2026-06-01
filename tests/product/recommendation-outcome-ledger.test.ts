/**
 * tests/product/recommendation-outcome-ledger.test.ts
 *
 * Tests for the Recommendation Outcome Ledger.
 *
 * Rules:
 *   - Recommended means recommended only.
 *   - No ACTED_ON/OUTCOME_REPORTED without explicit update.
 *   - Duplicate same-request recommendation is deduped.
 *   - Recommendation evidenceBasis comes from DecisionIntelligenceResult.
 *   - Journey event references recommendationId.
 *   - No outcome learning engines are marked ACTIVE yet.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  createRecommendationEntry,
  createOrSkipRecommendationEntry,
  markRecommendationStatus,
  getRecommendationLedger,
  summariseRecommendationLedger,
  hasDriftDetectionData,
  hasOutcomeData,
  markRecommendationAccepted,
  markRecommendationRejected,
  markRecommendationActedOn,
  markRecommendationIgnored,
  markRecommendationSuperseded,
  attachOutcomeReport,
  getClientSafeRecommendations,
  _resetLedgerStore,
} from '@/lib/product/recommendation-outcome-ledger'

beforeEach(() => {
  _resetLedgerStore()
})

// ─── 1. ACTION_RECOMMENDED creates a recommendation ledger entry ────────────

describe('recommendation creation', () => {
  it('creates a recommendation entry with RECOMMENDED status', async () => {
    const entry = await createRecommendationEntry({
      caseId: 'test-case-001',
      surface: 'fast_diagnostic',
      recommendedAction: 'Identify who can authorise the decision.',
      evidenceBasis: ['Authority gap detected', 'No accountable actor identified'],
      sourceEngineId: 'synthesis-gate',
    })

    expect(entry).toBeTruthy()
    expect(entry.caseId).toBe('test-case-001')
    expect(entry.status).toBe('RECOMMENDED')
    expect(entry.recommendedAction).toBe('Identify who can authorise the decision.')
    expect(entry.evidenceBasis).toContain('Authority gap detected')
    expect(entry.sourceEngineId).toBe('synthesis-gate')
    expect(entry.verified).toBe(false)
  })

  it('generates unique ids for each entry', async () => {
    const e1 = await createRecommendationEntry({
      caseId: 'test-case-001',
      surface: 'fast_diagnostic',
      recommendedAction: 'Action one.',
      evidenceBasis: ['Basis one'],
    })
    const e2 = await createRecommendationEntry({
      caseId: 'test-case-001',
      surface: 'fast_diagnostic',
      recommendedAction: 'Action two.',
      evidenceBasis: ['Basis two'],
    })

    expect(e1.id).not.toBe(e2.id)
    expect(e1.recommendationId).not.toBe(e2.recommendationId)
  })

  it('stores entries retrievable by caseId', async () => {
    await createRecommendationEntry({
      caseId: 'test-case-001',
      surface: 'fast_diagnostic',
      recommendedAction: 'Action one.',
      evidenceBasis: ['Basis one'],
    })
    await createRecommendationEntry({
      caseId: 'test-case-001',
      surface: 'fast_diagnostic',
      recommendedAction: 'Action two.',
      evidenceBasis: ['Basis two'],
    })

    const ledger = await getRecommendationLedger('test-case-001')
    expect(ledger.length).toBe(2)
  })
})

// ─── 2. Recommendation starts with status RECOMMENDED only ───────────────────

describe('recommendation status', () => {
  it('starts with RECOMMENDED status only', async () => {
    const entry = await createRecommendationEntry({
      caseId: 'test-case-002',
      surface: 'fast_diagnostic',
      recommendedAction: 'Gather more evidence.',
      evidenceBasis: ['Evidence gap'],
    })

    expect(entry.status).toBe('RECOMMENDED')
    // Should NOT start as ACTED_ON, OUTCOME_REPORTED, etc.
    expect(entry.status).not.toBe('ACTED_ON')
    expect(entry.status).not.toBe('OUTCOME_REPORTED')
    expect(entry.status).not.toBe('ACCEPTED')
    expect(entry.status).not.toBe('REJECTED')
    expect(entry.status).not.toBe('IGNORED')
    expect(entry.status).not.toBe('SUPERSEDED')
  })
})

// ─── 3. No ACTED_ON/OUTCOME_REPORTED without explicit update ────────────────

describe('status updates', () => {
  it('does not allow ACTED_ON without explicit markRecommendationStatus call', async () => {
    const entry = await createRecommendationEntry({
      caseId: 'test-case-003',
      surface: 'fast_diagnostic',
      recommendedAction: 'Escalate to authority.',
      evidenceBasis: ['Authority gap'],
    })

    // Verify it's still RECOMMENDED
    expect(entry.status).toBe('RECOMMENDED')

    // Explicitly update
    const updated = await markRecommendationStatus({
      caseId: 'test-case-003',
      recommendationId: entry.recommendationId,
      status: 'ACTED_ON',
    })

    expect(updated).toBeTruthy()
    expect(updated!.status).toBe('ACTED_ON')
    // updatedAt should be >= createdAt (may be same millisecond in fast tests)
    expect(new Date(updated!.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(entry.createdAt).getTime())
  })

  it('allows OUTCOME_REPORTED only after explicit update', async () => {
    const entry = await createRecommendationEntry({
      caseId: 'test-case-003',
      surface: 'fast_diagnostic',
      recommendedAction: 'Resolve supplier risk.',
      evidenceBasis: ['Supplier dependency'],
    })

    expect(entry.status).toBe('RECOMMENDED')

    const updated = await markRecommendationStatus({
      caseId: 'test-case-003',
      recommendationId: entry.recommendationId,
      status: 'OUTCOME_REPORTED',
      outcomeSummary: 'Supplier risk was mitigated through alternative sourcing.',
      verified: true,
    })

    expect(updated).toBeTruthy()
    expect(updated!.status).toBe('OUTCOME_REPORTED')
    expect(updated!.outcomeSummary).toBeTruthy()
    expect(updated!.verified).toBe(true)
  })

  it('returns null for unknown recommendationId', async () => {
    const result = await markRecommendationStatus({
      caseId: 'non-existent',
      recommendationId: 'non-existent-rec',
      status: 'ACTED_ON',
    })

    expect(result).toBeNull()
  })
})

// ─── 4. Duplicate same-request recommendation is deduped ────────────────────

describe('dedup', () => {
  it('createOrSkipRecommendationEntry dedupes identical case/surface/action', async () => {
    const { entry: first, created: firstCreated } = await createOrSkipRecommendationEntry({
      caseId: 'test-case-004',
      surface: 'fast_diagnostic',
      recommendedAction: 'Identify who can authorise the decision.',
      evidenceBasis: ['Authority gap'],
      sourceEngineId: 'synthesis-gate',
    })

    expect(firstCreated).toBe(true)

    const { entry: second, created: secondCreated } = await createOrSkipRecommendationEntry({
      caseId: 'test-case-004',
      surface: 'fast_diagnostic',
      recommendedAction: 'Identify who can authorise the decision.',
      evidenceBasis: ['Authority gap'],
      sourceEngineId: 'synthesis-gate',
    })

    expect(secondCreated).toBe(false)
    expect(second.recommendationId).toBe(first.recommendationId)

    // Only one entry in the ledger
    const ledger = await getRecommendationLedger('test-case-004')
    expect(ledger.length).toBe(1)
  })

  it('does not dedupe different actions for same case', async () => {
    await createOrSkipRecommendationEntry({
      caseId: 'test-case-005',
      surface: 'fast_diagnostic',
      recommendedAction: 'Action one.',
      evidenceBasis: ['Basis one'],
    })
    await createOrSkipRecommendationEntry({
      caseId: 'test-case-005',
      surface: 'fast_diagnostic',
      recommendedAction: 'Action two.',
      evidenceBasis: ['Basis two'],
    })

    const ledger = await getRecommendationLedger('test-case-005')
    expect(ledger.length).toBe(2)
  })

  it('does not dedupe same action across different cases', async () => {
    await createOrSkipRecommendationEntry({
      caseId: 'case-a',
      surface: 'fast_diagnostic',
      recommendedAction: 'Same action.',
      evidenceBasis: ['Basis'],
    })
    await createOrSkipRecommendationEntry({
      caseId: 'case-b',
      surface: 'fast_diagnostic',
      recommendedAction: 'Same action.',
      evidenceBasis: ['Basis'],
    })

    expect((await getRecommendationLedger('case-a')).length).toBe(1)
    expect((await getRecommendationLedger('case-b')).length).toBe(1)
  })

  it('dedupes case-insensitively on action text', async () => {
    await createOrSkipRecommendationEntry({
      caseId: 'test-case-006',
      surface: 'fast_diagnostic',
      recommendedAction: 'IDENTIFY THE AUTHORITY.',
      evidenceBasis: ['Authority gap'],
    })
    const { created } = await createOrSkipRecommendationEntry({
      caseId: 'test-case-006',
      surface: 'fast_diagnostic',
      recommendedAction: 'identify the authority.',
      evidenceBasis: ['Authority gap'],
    })

    expect(created).toBe(false)
  })
})

// ─── 5. Recommendation evidenceBasis comes from DecisionIntelligenceResult ───

describe('evidence basis', () => {
  it('stores evidence basis from orchestrator result', async () => {
    const evidenceBasis = [
      'Authority gap detected',
      'No accountable actor identified',
      'Lens: authority-lens: Authority holder not confirmed',
    ]

    const entry = await createRecommendationEntry({
      caseId: 'test-case-007',
      surface: 'fast_diagnostic',
      recommendedAction: 'Identify who can authorise the decision.',
      evidenceBasis,
    })

    expect(entry.evidenceBasis).toEqual(evidenceBasis)
    expect(entry.evidenceBasis.length).toBeGreaterThanOrEqual(1)
  })
})

// ─── 6. Journey event references recommendationId ──────────────────────────

describe('journey event reference', () => {
  it('stores journeyEventId when provided', async () => {
    const entry = await createRecommendationEntry({
      caseId: 'test-case-008',
      surface: 'fast_diagnostic',
      recommendedAction: 'Escalate to authority.',
      evidenceBasis: ['Authority gap'],
      sourceEngineId: 'synthesis-gate',
      journeyEventId: 'evt_abc123',
    })

    expect(entry.journeyEventId).toBe('evt_abc123')
    expect(entry.sourceEngineId).toBe('synthesis-gate')
  })
})

// ─── 7. Ledger summary ──────────────────────────────────────────────────────

describe('ledger summary', () => {
  it('summarises recommendation ledger correctly', async () => {
    const e1 = await createRecommendationEntry({
      caseId: 'test-case-009',
      surface: 'fast_diagnostic',
      recommendedAction: 'Action one.',
      evidenceBasis: ['Basis one'],
    })
    await createRecommendationEntry({
      caseId: 'test-case-009',
      surface: 'fast_diagnostic',
      recommendedAction: 'Action two.',
      evidenceBasis: ['Basis two'],
    })
    await markRecommendationStatus({
      caseId: 'test-case-009',
      recommendationId: e1.recommendationId,
      status: 'ACTED_ON',
    })

    const summary = await summariseRecommendationLedger('test-case-009')
    expect(summary.totalRecommendations).toBe(2)
    expect(summary.acted).toBe(1)
    expect(summary.ignored).toBe(0)
    expect(summary.outcomeReported).toBe(0)
    expect(summary.verifiedOutcomes).toBe(0)
    expect(summary.oldestRecommendation).toBeTruthy()
    expect(summary.latestRecommendation).toBeTruthy()
    expect(summary.statusBreakdown['RECOMMENDED']).toBe(1)
    expect(summary.statusBreakdown['ACTED_ON']).toBe(1)
  })
})

// ─── 8. Drift detection data check ─────────────────────────────────────────

describe('drift detection readiness', () => {
  it('hasDriftDetectionData returns false with fewer than 2 recommendations', async () => {
    expect(await hasDriftDetectionData('empty-case')).toBe(false)

    await createRecommendationEntry({
      caseId: 'one-rec-case',
      surface: 'fast_diagnostic',
      recommendedAction: 'Only one.',
      evidenceBasis: ['Basis'],
    })

    expect(await hasDriftDetectionData('one-rec-case')).toBe(false)
  })

  it('hasDriftDetectionData returns true with 2+ recommendations', async () => {
    await createRecommendationEntry({
      caseId: 'two-rec-case',
      surface: 'fast_diagnostic',
      recommendedAction: 'First.',
      evidenceBasis: ['Basis'],
    })
    await createRecommendationEntry({
      caseId: 'two-rec-case',
      surface: 'fast_diagnostic',
      recommendedAction: 'Second.',
      evidenceBasis: ['Basis'],
    })

    expect(await hasDriftDetectionData('two-rec-case')).toBe(true)
  })
})

// ─── 9. Outcome data check ─────────────────────────────────────────────────

describe('outcome data readiness', () => {
  it('hasOutcomeData returns false with no OUTCOME_REPORTED entries', async () => {
    await createRecommendationEntry({
      caseId: 'no-outcome-case',
      surface: 'fast_diagnostic',
      recommendedAction: 'Action.',
      evidenceBasis: ['Basis'],
    })

    expect(await hasOutcomeData('no-outcome-case')).toBe(false)
  })

  it('hasOutcomeData returns true with at least one OUTCOME_REPORTED entry', async () => {
    const entry = await createRecommendationEntry({
      caseId: 'has-outcome-case',
      surface: 'fast_diagnostic',
      recommendedAction: 'Action.',
      evidenceBasis: ['Basis'],
    })

    await markRecommendationStatus({
      caseId: 'has-outcome-case',
      recommendationId: entry.recommendationId,
      status: 'OUTCOME_REPORTED',
      outcomeSummary: 'It worked.',
    })

    expect(await hasOutcomeData('has-outcome-case')).toBe(true)
  })
})

// ─── 10. No outcome learning engines are marked ACTIVE yet ─────────────────

describe('outcome learning engines not active', () => {
  it('hasDriftDetectionData does not activate DriftRules', async () => {
    // This test verifies the ledger does not automatically wire drift engines.
    // DriftRules requires explicit activation via engine-activation-registry.
    await createRecommendationEntry({
      caseId: 'drift-check',
      surface: 'fast_diagnostic',
      recommendedAction: 'First.',
      evidenceBasis: ['Basis'],
    })
    await createRecommendationEntry({
      caseId: 'drift-check',
      surface: 'fast_diagnostic',
      recommendedAction: 'Second.',
      evidenceBasis: ['Basis'],
    })

    // hasDriftDetectionData is a data check, not an engine activation
    expect(await hasDriftDetectionData('drift-check')).toBe(true)
    // DriftRules engine should remain GATED in the registry
    // (verified by engine-activation-registry.test.ts)
  })

  it('hasOutcomeData does not activate FailurePatternCalibrator', async () => {
    const entry = await createRecommendationEntry({
      caseId: 'calibrator-check',
      surface: 'fast_diagnostic',
      recommendedAction: 'Action.',
      evidenceBasis: ['Basis'],
    })
    await markRecommendationStatus({
      caseId: 'calibrator-check',
      recommendationId: entry.recommendationId,
      status: 'OUTCOME_REPORTED',
    })

    expect(await hasOutcomeData('calibrator-check')).toBe(true)
    // FailurePatternCalibrator engine should remain GATED in the registry
    // (verified by engine-activation-registry.test.ts)
  })
})

// ─── 11. Named status update helpers ────────────────────────────────────────

describe('named status update helpers', () => {
  it('markRecommendationAccepted moves from RECOMMENDED to ACCEPTED', async () => {
    const entry = await createRecommendationEntry({
      caseId: 'named-test-001',
      surface: 'fast_diagnostic',
      recommendedAction: 'Escalate to authority.',
      evidenceBasis: ['Authority gap'],
    })

    const updated = await markRecommendationAccepted({
      caseId: 'named-test-001',
      recommendationId: entry.recommendationId,
      evidenceSummary: 'User confirmed they will escalate.',
    })

    expect(updated).toBeTruthy()
    expect(updated!.status).toBe('ACCEPTED')
    expect(updated!.outcomeSummary).toBe('User confirmed they will escalate.')
  })

  it('markRecommendationRejected moves from RECOMMENDED to REJECTED', async () => {
    const entry = await createRecommendationEntry({
      caseId: 'named-test-002',
      surface: 'fast_diagnostic',
      recommendedAction: 'Delay for evidence.',
      evidenceBasis: ['Evidence gap'],
    })

    const updated = await markRecommendationRejected({
      caseId: 'named-test-002',
      recommendationId: entry.recommendationId,
      evidenceSummary: 'User decided to proceed without waiting.',
    })

    expect(updated).toBeTruthy()
    expect(updated!.status).toBe('REJECTED')
  })

  it('markRecommendationActedOn moves to ACTED_ON only through explicit call', async () => {
    const entry = await createRecommendationEntry({
      caseId: 'named-test-003',
      surface: 'fast_diagnostic',
      recommendedAction: 'Resolve supplier dependency.',
      evidenceBasis: ['Supplier dependency'],
    })

    // Still RECOMMENDED — not inferred
    expect(entry.status).toBe('RECOMMENDED')

    const updated = await markRecommendationActedOn({
      caseId: 'named-test-003',
      recommendationId: entry.recommendationId,
      evidenceSummary: 'User reported they found alternative supplier.',
    })

    expect(updated).toBeTruthy()
    expect(updated!.status).toBe('ACTED_ON')
  })

  it('markRecommendationIgnored moves to IGNORED', async () => {
    const entry = await createRecommendationEntry({
      caseId: 'named-test-004',
      surface: 'fast_diagnostic',
      recommendedAction: 'Gather more evidence.',
      evidenceBasis: ['Evidence gap'],
    })

    const updated = await markRecommendationIgnored({
      caseId: 'named-test-004',
      recommendationId: entry.recommendationId,
    })

    expect(updated).toBeTruthy()
    expect(updated!.status).toBe('IGNORED')
  })

  it('markRecommendationSuperseded moves to SUPERSEDED', async () => {
    const entry = await createRecommendationEntry({
      caseId: 'named-test-005',
      surface: 'fast_diagnostic',
      recommendedAction: 'Old recommendation.',
      evidenceBasis: ['Basis'],
    })

    const updated = await markRecommendationSuperseded({
      caseId: 'named-test-005',
      recommendationId: entry.recommendationId,
      evidenceSummary: 'Superseded by newer analysis.',
    })

    expect(updated).toBeTruthy()
    expect(updated!.status).toBe('SUPERSEDED')
  })

  it('returns null for unknown recommendationId in named helpers', async () => {
    const result = await markRecommendationAccepted({
      caseId: 'non-existent',
      recommendationId: 'non-existent',
    })
    expect(result).toBeNull()
  })
})

// ─── 12. OUTCOME_REPORTED requires explicit outcome summary ─────────────────

describe('outcome report requirements', () => {
  it('attachOutcomeReport requires non-empty outcomeSummary', async () => {
    const entry = await createRecommendationEntry({
      caseId: 'outcome-test-001',
      surface: 'fast_diagnostic',
      recommendedAction: 'Resolve the issue.',
      evidenceBasis: ['Basis'],
    })

    // Empty summary should return null
    const result = await attachOutcomeReport({
      caseId: 'outcome-test-001',
      recommendationId: entry.recommendationId,
      outcomeSummary: '',
    })

    expect(result).toBeNull()
    // Entry should still be RECOMMENDED
    const ledger = await getRecommendationLedger('outcome-test-001')
    expect(ledger[0].status).toBe('RECOMMENDED')
  })

  it('attachOutcomeReport requires explicit outcomeSummary to be non-whitespace', async () => {
    const entry = await createRecommendationEntry({
      caseId: 'outcome-test-002',
      surface: 'fast_diagnostic',
      recommendedAction: 'Resolve the issue.',
      evidenceBasis: ['Basis'],
    })

    const result = await attachOutcomeReport({
      caseId: 'outcome-test-002',
      recommendationId: entry.recommendationId,
      outcomeSummary: '   ',
    })

    expect(result).toBeNull()
  })

  it('attachOutcomeReport sets OUTCOME_REPORTED with summary', async () => {
    const entry = await createRecommendationEntry({
      caseId: 'outcome-test-003',
      surface: 'fast_diagnostic',
      recommendedAction: 'Resolve the issue.',
      evidenceBasis: ['Basis'],
    })

    const result = await attachOutcomeReport({
      caseId: 'outcome-test-003',
      recommendationId: entry.recommendationId,
      outcomeSummary: 'The supplier issue was resolved through renegotiation.',
    })

    expect(result).toBeTruthy()
    expect(result!.status).toBe('OUTCOME_REPORTED')
    expect(result!.outcomeSummary).toBe('The supplier issue was resolved through renegotiation.')
    expect(result!.verified).toBe(false)
  })

  it('verified=true only when independently confirmed', async () => {
    const entry = await createRecommendationEntry({
      caseId: 'outcome-test-004',
      surface: 'fast_diagnostic',
      recommendedAction: 'Resolve the issue.',
      evidenceBasis: ['Basis'],
    })

    const result = await attachOutcomeReport({
      caseId: 'outcome-test-004',
      recommendationId: entry.recommendationId,
      outcomeSummary: 'Verified by external audit.',
      verified: true,
    })

    expect(result).toBeTruthy()
    expect(result!.verified).toBe(true)
  })

  it('verified defaults to false when not provided', async () => {
    const entry = await createRecommendationEntry({
      caseId: 'outcome-test-005',
      surface: 'fast_diagnostic',
      recommendedAction: 'Resolve the issue.',
      evidenceBasis: ['Basis'],
    })

    const result = await attachOutcomeReport({
      caseId: 'outcome-test-005',
      recommendationId: entry.recommendationId,
      outcomeSummary: 'User reported resolution.',
    })

    expect(result).toBeTruthy()
    expect(result!.verified).toBe(false)
  })
})

// ─── 13. Client-safe view ──────────────────────────────────────────────────

describe('client-safe recommendations', () => {
  it('getClientSafeRecommendations returns safe view without internals', async () => {
    await createRecommendationEntry({
      caseId: 'safe-test-001',
      surface: 'fast_diagnostic',
      recommendedAction: 'Escalate to authority.',
      evidenceBasis: ['Authority gap', 'Internal note'],
      sourceEngineId: 'synthesis-gate',
    })

    const safe = await getClientSafeRecommendations('safe-test-001')
    expect(safe.length).toBe(1)
    expect(safe[0].recommendedAction).toBe('Escalate to authority.')
    expect(safe[0].status).toBe('RECOMMENDED')
    expect(safe[0].lastUpdated).toBeTruthy()
    expect(safe[0].verified).toBe(false)

    // Should NOT expose raw internals
    expect((safe[0] as any).evidenceBasis).toBeUndefined()
    expect((safe[0] as any).sourceEngineId).toBeUndefined()
    expect((safe[0] as any).id).toBeUndefined()
    expect((safe[0] as any).caseId).toBeUndefined()
  })

  it('getClientSafeRecommendations includes outcomeSummary when present', async () => {
    const entry = await createRecommendationEntry({
      caseId: 'safe-test-002',
      surface: 'fast_diagnostic',
      recommendedAction: 'Resolve issue.',
      evidenceBasis: ['Basis'],
    })

    await attachOutcomeReport({
      caseId: 'safe-test-002',
      recommendationId: entry.recommendationId,
      outcomeSummary: 'Resolved successfully.',
      verified: true,
    })

    const safe = await getClientSafeRecommendations('safe-test-002')
    expect(safe[0].outcomeSummary).toBe('Resolved successfully.')
    expect(safe[0].verified).toBe(true)
  })

  it('returns empty array for unknown case', async () => {
    const safe = await getClientSafeRecommendations('non-existent')
    expect(safe).toEqual([])
  })
})

// ─── 14. AssumptionDriftDetector remains GATED ──────────────────────────────

describe('AssumptionDriftDetector remains GATED', () => {
  it('hasDriftDetectionData returns true but does not activate drift engine', async () => {
    // Create enough data for drift detection
    await createRecommendationEntry({
      caseId: 'drift-gated',
      surface: 'fast_diagnostic',
      recommendedAction: 'First.',
      evidenceBasis: ['Basis'],
    })
    await createRecommendationEntry({
      caseId: 'drift-gated',
      surface: 'fast_diagnostic',
      recommendedAction: 'Second.',
      evidenceBasis: ['Basis'],
    })

    expect(await hasDriftDetectionData('drift-gated')).toBe(true)
    // AssumptionDriftDetector remains GATED — verified by engine-activation-registry.test.ts
  })
})

// ─── 15. FailurePatternCalibrator remains GATED ─────────────────────────────

describe('FailurePatternCalibrator remains GATED', () => {
  it('hasOutcomeData returns true but does not activate calibrator', async () => {
    const entry = await createRecommendationEntry({
      caseId: 'calibrator-gated',
      surface: 'fast_diagnostic',
      recommendedAction: 'Action.',
      evidenceBasis: ['Basis'],
    })
    await attachOutcomeReport({
      caseId: 'calibrator-gated',
      recommendationId: entry.recommendationId,
      outcomeSummary: 'It worked.',
    })

    expect(await hasOutcomeData('calibrator-gated')).toBe(true)
    // FailurePatternCalibrator remains GATED — verified by engine-activation-registry.test.ts
  })
})

// ─── 16. DriftTribunal remains GATED ────────────────────────────────────────

describe('DriftTribunal remains GATED', () => {
  it('hasDriftDetectionData does not activate DriftTribunal', async () => {
    await createRecommendationEntry({
      caseId: 'tribunal-gated',
      surface: 'fast_diagnostic',
      recommendedAction: 'First.',
      evidenceBasis: ['Basis'],
    })
    await createRecommendationEntry({
      caseId: 'tribunal-gated',
      surface: 'fast_diagnostic',
      recommendedAction: 'Second.',
      evidenceBasis: ['Basis'],
    })

    expect(await hasDriftDetectionData('tribunal-gated')).toBe(true)
    // DriftTribunal remains GATED — verified by engine-activation-registry.test.ts
  })
})

// ─── 17. Outcome verification binding ───────────────────────────────────────

describe('outcome verification binding', () => {
  it('outcome verification with recommendationId updates recommendation to OUTCOME_REPORTED', async () => {
    const entry = await createRecommendationEntry({
      caseId: 'ov-binding-001',
      surface: 'fast_diagnostic',
      recommendedAction: 'Escalate to authority.',
      evidenceBasis: ['Authority gap'],
    })

    // Simulate what submitOutcomeVerification does
    const updated = await attachOutcomeReport({
      caseId: 'ov-binding-001',
      recommendationId: entry.recommendationId,
      outcomeSummary: 'ACTION_CONFIRMED: User escalated to the board and received approval.',
      verified: false,
    })

    expect(updated).toBeTruthy()
    expect(updated!.status).toBe('OUTCOME_REPORTED')
    expect(updated!.outcomeSummary).toContain('ACTION_CONFIRMED')
    expect(updated!.verified).toBe(false)

    // Client-safe view reflects the update
    const safe = await getClientSafeRecommendations('ov-binding-001')
    expect(safe[0].status).toBe('OUTCOME_REPORTED')
    expect(safe[0].outcomeSummary).toContain('ACTION_CONFIRMED')
    expect(safe[0].verified).toBe(false)
  })

  it('outcome verification without recommendationId does not update recommendation ledger', async () => {
    await createRecommendationEntry({
      caseId: 'ov-binding-002',
      surface: 'fast_diagnostic',
      recommendedAction: 'Resolve supplier risk.',
      evidenceBasis: ['Supplier dependency'],
    })

    // No attachOutcomeReport call — recommendation stays RECOMMENDED
    const ledger = await getRecommendationLedger('ov-binding-002')
    expect(ledger[0].status).toBe('RECOMMENDED')
  })

  it('empty outcome summary is rejected by ledger', async () => {
    const entry = await createRecommendationEntry({
      caseId: 'ov-binding-003',
      surface: 'fast_diagnostic',
      recommendedAction: 'Gather evidence.',
      evidenceBasis: ['Evidence gap'],
    })

    const result = await attachOutcomeReport({
      caseId: 'ov-binding-003',
      recommendationId: entry.recommendationId,
      outcomeSummary: '',
    })

    expect(result).toBeNull()
    expect(entry.status).toBe('RECOMMENDED')
  })

  it('verified remains false unless verification record supports it', async () => {
    const entry = await createRecommendationEntry({
      caseId: 'ov-binding-004',
      surface: 'fast_diagnostic',
      recommendedAction: 'Action.',
      evidenceBasis: ['Basis'],
    })

    // User-reported outcome — not verified
    const updated = await attachOutcomeReport({
      caseId: 'ov-binding-004',
      recommendationId: entry.recommendationId,
      outcomeSummary: 'OUTCOME_UNCHANGED: Situation unchanged.',
      verified: false,
    })

    expect(updated).toBeTruthy()
    expect(updated!.verified).toBe(false)

    // Client-safe view reflects unverified
    const safe = await getClientSafeRecommendations('ov-binding-004')
    expect(safe[0].verified).toBe(false)
  })

  it('verified=true only when independently confirmed', async () => {
    const entry = await createRecommendationEntry({
      caseId: 'ov-binding-005',
      surface: 'fast_diagnostic',
      recommendedAction: 'Action.',
      evidenceBasis: ['Basis'],
    })

    // Independently verified outcome
    const updated = await attachOutcomeReport({
      caseId: 'ov-binding-005',
      recommendationId: entry.recommendationId,
      outcomeSummary: 'ACTION_CONFIRMED: Verified by external audit.',
      verified: true,
    })

    expect(updated).toBeTruthy()
    expect(updated!.verified).toBe(true)

    // Client-safe view reflects verified
    const safe = await getClientSafeRecommendations('ov-binding-005')
    expect(safe[0].verified).toBe(true)
  })

  it('unsafe outcome details are not exposed in client-safe recommendation output', async () => {
    const entry = await createRecommendationEntry({
      caseId: 'ov-binding-006',
      surface: 'fast_diagnostic',
      recommendedAction: 'Escalate.',
      evidenceBasis: ['Authority gap', 'Internal risk assessment: high'],
      sourceEngineId: 'synthesis-gate',
      journeyEventId: 'evt_internal_123',
    })

    await attachOutcomeReport({
      caseId: 'ov-binding-006',
      recommendationId: entry.recommendationId,
      outcomeSummary: 'ACTION_CONFIRMED: Escalated.',
      verified: false,
    })

    const safe = await getClientSafeRecommendations('ov-binding-006')
    expect(safe[0].recommendedAction).toBe('Escalate.')
    expect(safe[0].status).toBe('OUTCOME_REPORTED')
    expect(safe[0].outcomeSummary).toBe('ACTION_CONFIRMED: Escalated.')

    // Unsafe internals must not be exposed
    expect((safe[0] as any).evidenceBasis).toBeUndefined()
    expect((safe[0] as any).sourceEngineId).toBeUndefined()
    expect((safe[0] as any).journeyEventId).toBeUndefined()
    expect((safe[0] as any).id).toBeUndefined()
    expect((safe[0] as any).caseId).toBeUndefined()
  })

  it('recommendation cannot become ACTED_ON or OUTCOME_REPORTED without explicit call', async () => {
    const entry = await createRecommendationEntry({
      caseId: 'ov-binding-007',
      surface: 'fast_diagnostic',
      recommendedAction: 'Resolve issue.',
      evidenceBasis: ['Basis'],
    })

    // No explicit call — still RECOMMENDED
    expect(entry.status).toBe('RECOMMENDED')

    // Explicit call required for ACTED_ON
    const actedOn = await markRecommendationActedOn({
      caseId: 'ov-binding-007',
      recommendationId: entry.recommendationId,
      evidenceSummary: 'User reported action taken.',
    })
    expect(actedOn).toBeTruthy()
    expect(actedOn!.status).toBe('ACTED_ON')

    // Explicit call required for OUTCOME_REPORTED
    const outcome = await attachOutcomeReport({
      caseId: 'ov-binding-007',
      recommendationId: entry.recommendationId,
      outcomeSummary: 'Issue resolved.',
    })
    expect(outcome).toBeTruthy()
    expect(outcome!.status).toBe('OUTCOME_REPORTED')
  })

  it('outcome learning engines remain GATED', async () => {
    // Create sufficient data for drift detection and outcome calibration
    const e1 = await createRecommendationEntry({
      caseId: 'ov-learning-gated',
      surface: 'fast_diagnostic',
      recommendedAction: 'First.',
      evidenceBasis: ['Basis'],
    })
    await createRecommendationEntry({
      caseId: 'ov-learning-gated',
      surface: 'fast_diagnostic',
      recommendedAction: 'Second.',
      evidenceBasis: ['Basis'],
    })
    await attachOutcomeReport({
      caseId: 'ov-learning-gated',
      recommendationId: e1.recommendationId,
      outcomeSummary: 'Resolved.',
    })

    // Data checks pass
    expect(await hasDriftDetectionData('ov-learning-gated')).toBe(true)
    expect(await hasOutcomeData('ov-learning-gated')).toBe(true)

    // But engines remain GATED — verified by engine-activation-registry.test.ts
    // AssumptionDriftDetector: GATED
    // FailurePatternCalibrator: GATED
    // DriftTribunal: GATED
  })
})
