/**
 * tests/intelligence/decision-intelligence-delta.test.ts
 *
 * Tests for the Decision Intelligence Delta comparison logic.
 *
 * Rules:
 *   - Never fabricate changes.
 *   - Never claim a field changed unless before/after differs meaningfully.
 *   - Never overstate LOW significance deltas.
 *   - No internal taxonomy keys or engine IDs appear in serialised delta.
 */

import { describe, it, expect } from 'vitest'
import { deriveDecisionIntelligenceDelta } from '@/lib/intelligence/decision-intelligence-delta'
import type { DecisionIntelligenceResult } from '@/lib/intelligence/decision-intelligence-orchestrator'

// Helper to create a minimal DecisionIntelligenceResult for testing
function makeResult(overrides: Partial<DecisionIntelligenceResult> = {}): DecisionIntelligenceResult {
  return {
    surface: 'fast_diagnostic',
    sessionContext: null,
    situationClass: null,
    situationRead: '',
    vocabularyState: null,
    decisionClass: null,
    classificationConfidence: null,
    alternativeClasses: null,
    detectedSignals: [],
    preservedAmbiguities: [],
    hiddenStakesDetected: false,
    findings: [],
    lensCount: 0,
    primaryContradiction: null,
    contradictionCount: 0,
    contradictionGraph: null,
    constitutionalRoute: null,
    constitutionalReadiness: null,
    constitutionalPosture: null,
    constitutionalAuthority: null,
    failureModes: [],
    disqualifiers: [],
    escalationPermitted: null,
    simulationPaths: [],
    preferredPath: null,
    costOfDelay: null,
    degradationProjection: null,
    interpretedIssue: '',
    authorityState: null,
    evidenceState: '',
    consequenceState: null,
    nextAdmissibleMove: '',
    refusalReason: undefined,
    confidence: 'LOW',
    evidenceBasis: [],
    unresolvedItems: [],
    userLanguageInterpretations: [],
    evidenceTier: '',
    signalContinuity: [],
    ...overrides,
  }
}

// ─── 1. authorityState changed → authority delta produced ───────────────────

describe('authorityState delta', () => {
  it('produces authority delta when authorityState changes from null to specific', () => {
    const delta = deriveDecisionIntelligenceDelta({
      previous: { authorityState: null },
      current: makeResult({ authorityState: 'CFO named as decision owner.' }),
      answeredField: 'decision_owner',
    })

    expect(delta).toBeTruthy()
    expect(delta!.changedFields.some(c => c.field === 'authorityState')).toBe(true)
    expect(delta!.headline).toContain('Authority is now more specific')
  })

  it('produces authority delta when authorityState changes from specific to null', () => {
    const delta = deriveDecisionIntelligenceDelta({
      previous: { authorityState: 'CEO has approval power.' },
      current: makeResult({ authorityState: null }),
      answeredField: 'blocker',
    })

    expect(delta).toBeTruthy()
    expect(delta!.changedFields.some(c => c.field === 'authorityState')).toBe(true)
    expect(delta!.headline).toContain('Authority is no longer')
  })

  it('does not produce authority delta when authorityState is unchanged', () => {
    const delta = deriveDecisionIntelligenceDelta({
      previous: { authorityState: 'CEO has approval power.' },
      current: makeResult({ authorityState: 'CEO has approval power.' }),
    })

    expect(delta).toBeTruthy()
    expect(delta!.changedFields.some(c => c.field === 'authorityState')).toBe(false)
  })
})

// ─── 2. evidenceState changed → evidence delta produced ─────────────────────

describe('evidenceState delta', () => {
  it('produces evidence delta when evidenceState changes', () => {
    const delta = deriveDecisionIntelligenceDelta({
      previous: { evidenceState: 'No signals detected.' },
      current: makeResult({ evidenceState: '3 signal(s) detected.' }),
    })

    expect(delta).toBeTruthy()
    expect(delta!.changedFields.some(c => c.field === 'evidenceState')).toBe(true)
    // evidenceState is MEDIUM significance; headline uses "N aspect(s)" when no HIGH changes
    expect(delta!.headline).toContain('aspect(s) of the reading changed')
  })

  it('does not produce evidence delta when evidenceState is unchanged', () => {
    const delta = deriveDecisionIntelligenceDelta({
      previous: { evidenceState: '3 signal(s) detected.' },
      current: makeResult({ evidenceState: '3 signal(s) detected.' }),
    })

    expect(delta).toBeTruthy()
    expect(delta!.changedFields.some(c => c.field === 'evidenceState')).toBe(false)
  })
})

// ─── 3. consequenceState changed → consequence delta produced ───────────────

describe('consequenceState delta', () => {
  it('produces consequence delta when consequenceState appears', () => {
    const delta = deriveDecisionIntelligenceDelta({
      previous: { consequenceState: null },
      current: makeResult({ consequenceState: 'Financial exposure detected.' }),
    })

    expect(delta).toBeTruthy()
    expect(delta!.changedFields.some(c => c.field === 'consequenceState')).toBe(true)
    // consequenceState is MEDIUM significance; headline uses "N aspect(s)" when no HIGH changes
    expect(delta!.headline).toContain('aspect(s) of the reading changed')
  })

  it('does not produce consequence delta when consequenceState is unchanged', () => {
    const delta = deriveDecisionIntelligenceDelta({
      previous: { consequenceState: 'Financial exposure detected.' },
      current: makeResult({ consequenceState: 'Financial exposure detected.' }),
    })

    expect(delta).toBeTruthy()
    expect(delta!.changedFields.some(c => c.field === 'consequenceState')).toBe(false)
  })
})

// ─── 4. primaryContradiction added → contradiction delta produced ───────────

describe('primaryContradiction delta', () => {
  it('produces contradiction delta when contradiction is detected', () => {
    const delta = deriveDecisionIntelligenceDelta({
      previous: { primaryContradiction: null },
      current: makeResult({ primaryContradiction: 'Authority gap vs execution pressure.' }),
    })

    expect(delta).toBeTruthy()
    expect(delta!.changedFields.some(c => c.field === 'primaryContradiction')).toBe(true)
    expect(delta!.headline).toContain('contradiction was detected')
  })

  it('produces resolved contradiction delta when contradiction is removed', () => {
    const delta = deriveDecisionIntelligenceDelta({
      previous: { primaryContradiction: 'Authority gap vs execution pressure.' },
      current: makeResult({ primaryContradiction: null }),
    })

    expect(delta).toBeTruthy()
    expect(delta!.changedFields.some(c => c.field === 'primaryContradiction')).toBe(true)
    expect(delta!.headline).toContain('previously detected contradiction has been resolved')
  })

  it('produces shifted contradiction delta when contradiction text changes', () => {
    const delta = deriveDecisionIntelligenceDelta({
      previous: { primaryContradiction: 'Authority gap vs execution pressure.' },
      current: makeResult({ primaryContradiction: 'Budget constraint vs timeline.' }),
    })

    expect(delta).toBeTruthy()
    expect(delta!.changedFields.some(c => c.field === 'primaryContradiction')).toBe(true)
    expect(delta!.headline).toContain('primary contradiction has shifted')
  })

  it('does not produce contradiction delta when unchanged', () => {
    const delta = deriveDecisionIntelligenceDelta({
      previous: { primaryContradiction: 'Authority gap.' },
      current: makeResult({ primaryContradiction: 'Authority gap.' }),
    })

    expect(delta).toBeTruthy()
    expect(delta!.changedFields.some(c => c.field === 'primaryContradiction')).toBe(false)
  })
})

// ─── 5. nextAdmissibleMove changed → next move delta produced ───────────────

describe('nextAdmissibleMove delta', () => {
  it('produces next move delta when nextAdmissibleMove changes', () => {
    const delta = deriveDecisionIntelligenceDelta({
      previous: { nextAdmissibleMove: 'Identify the decision owner.' },
      current: makeResult({ nextAdmissibleMove: 'Confirm whether the named owner has approval authority.' }),
    })

    expect(delta).toBeTruthy()
    expect(delta!.changedFields.some(c => c.field === 'nextAdmissibleMove')).toBe(true)
    expect(delta!.headline).toContain('next admissible move changed')
  })

  it('does not produce next move delta when unchanged', () => {
    const delta = deriveDecisionIntelligenceDelta({
      previous: { nextAdmissibleMove: 'Identify the decision owner.' },
      current: makeResult({ nextAdmissibleMove: 'Identify the decision owner.' }),
    })

    expect(delta).toBeTruthy()
    expect(delta!.changedFields.some(c => c.field === 'nextAdmissibleMove')).toBe(false)
  })
})

// ─── 6. unresolvedItems reduced → unresolved-item improvement delta ─────────

describe('unresolvedItems delta', () => {
  it('produces improvement delta when unresolved items are reduced', () => {
    const delta = deriveDecisionIntelligenceDelta({
      previous: { unresolvedItems: ['Authority gap', 'Evidence gap', 'Timeline pressure'] },
      current: makeResult({ unresolvedItems: ['Authority gap', 'Timeline pressure'] }),
    })

    expect(delta).toBeTruthy()
    expect(delta!.changedFields.some(c => c.field === 'unresolvedItems')).toBe(true)
    const unresolvedChange = delta!.changedFields.find(c => c.field === 'unresolvedItems')
    expect(unresolvedChange?.summary).toContain('resolved')
    expect(unresolvedChange?.significance).toBe('HIGH')
  })

  it('produces addition delta when unresolved items increase', () => {
    const delta = deriveDecisionIntelligenceDelta({
      previous: { unresolvedItems: ['Authority gap'] },
      current: makeResult({ unresolvedItems: ['Authority gap', 'Evidence gap', 'Timeline pressure'] }),
    })

    expect(delta).toBeTruthy()
    expect(delta!.changedFields.some(c => c.field === 'unresolvedItems')).toBe(true)
    const unresolvedChange = delta!.changedFields.find(c => c.field === 'unresolvedItems')
    expect(unresolvedChange?.summary).toContain('added')
    expect(unresolvedChange?.significance).toBe('MEDIUM')
  })

  it('does not produce delta when unresolved items are the same set in different order', () => {
    const delta = deriveDecisionIntelligenceDelta({
      previous: { unresolvedItems: ['Authority gap', 'Evidence gap', 'Timeline pressure'] },
      current: makeResult({ unresolvedItems: ['Timeline pressure', 'Evidence gap', 'Authority gap'] }),
    })

    expect(delta).toBeTruthy()
    expect(delta!.changedFields.some(c => c.field === 'unresolvedItems')).toBe(false)
  })

  it('does not produce delta when unresolved items are unchanged', () => {
    const delta = deriveDecisionIntelligenceDelta({
      previous: { unresolvedItems: ['Authority gap', 'Evidence gap'] },
      current: makeResult({ unresolvedItems: ['Authority gap', 'Evidence gap'] }),
    })

    expect(delta).toBeTruthy()
    expect(delta!.changedFields.some(c => c.field === 'unresolvedItems')).toBe(false)
  })
})

// ─── 7. confidence changed → confidence delta produced ──────────────────────

describe('confidence delta', () => {
  it('produces confidence delta when confidence changes', () => {
    const delta = deriveDecisionIntelligenceDelta({
      previous: { confidence: 'LOW' },
      current: makeResult({ confidence: 'MEDIUM' }),
    })

    expect(delta).toBeTruthy()
    expect(delta!.changedFields.some(c => c.field === 'confidence')).toBe(true)
    // confidence is MEDIUM significance; headline uses "N aspect(s)" when no HIGH changes
    expect(delta!.headline).toContain('aspect(s) of the reading changed')
  })

  it('does not produce confidence delta when unchanged', () => {
    const delta = deriveDecisionIntelligenceDelta({
      previous: { confidence: 'MEDIUM' },
      current: makeResult({ confidence: 'MEDIUM' }),
    })

    expect(delta).toBeTruthy()
    expect(delta!.changedFields.some(c => c.field === 'confidence')).toBe(false)
  })
})

// ─── 8. No meaningful difference → no-material-change headline ──────────────

describe('no meaningful difference', () => {
  it('produces no-material-change headline when nothing changed', () => {
    const delta = deriveDecisionIntelligenceDelta({
      previous: {
        situationRead: 'Test reading.',
        interpretedIssue: 'Test issue.',
        primaryContradiction: null,
        authorityState: null,
        evidenceState: 'No signals.',
        consequenceState: null,
        nextAdmissibleMove: 'Identify owner.',
        unresolvedItems: ['Authority gap'],
        confidence: 'LOW',
      },
      current: makeResult({
        situationRead: 'Test reading.',
        interpretedIssue: 'Test issue.',
        primaryContradiction: null,
        authorityState: null,
        evidenceState: 'No signals.',
        consequenceState: null,
        nextAdmissibleMove: 'Identify owner.',
        unresolvedItems: ['Authority gap'],
        confidence: 'LOW',
      }),
      answeredField: 'blocker',
    })

    expect(delta).toBeTruthy()
    expect(delta!.changedFields.length).toBe(0)
    expect(delta!.headline).toContain('did not materially change')
    expect(delta!.headline).toContain('blocker')
  })
})

// ─── 9. Whitespace/case-only differences do not produce false changes ───────

describe('whitespace and case normalisation', () => {
  it('does not report change for trailing whitespace difference', () => {
    const delta = deriveDecisionIntelligenceDelta({
      previous: { authorityState: 'CEO has approval power.' },
      current: makeResult({ authorityState: '  CEO has approval power.  ' }),
    })

    expect(delta).toBeTruthy()
    expect(delta!.changedFields.some(c => c.field === 'authorityState')).toBe(false)
  })

  it('does not report change for internal whitespace differences', () => {
    const delta = deriveDecisionIntelligenceDelta({
      previous: { evidenceState: '3  signal(s)  detected.' },
      current: makeResult({ evidenceState: '3 signal(s) detected.' }),
    })

    expect(delta).toBeTruthy()
    expect(delta!.changedFields.some(c => c.field === 'evidenceState')).toBe(false)
  })

  it('does not report change for case-only differences in unresolved items', () => {
    const delta = deriveDecisionIntelligenceDelta({
      previous: { unresolvedItems: ['Authority Gap', 'Evidence Gap'] },
      current: makeResult({ unresolvedItems: ['authority gap', 'evidence gap'] }),
    })

    expect(delta).toBeTruthy()
    expect(delta!.changedFields.some(c => c.field === 'unresolvedItems')).toBe(false)
  })
})

// ─── 10. Array order differences alone do not produce false delta ───────────

describe('array order independence', () => {
  it('does not report change for reordered unresolved items', () => {
    const delta = deriveDecisionIntelligenceDelta({
      previous: { unresolvedItems: ['A', 'B', 'C'] },
      current: makeResult({ unresolvedItems: ['C', 'A', 'B'] }),
    })

    expect(delta).toBeTruthy()
    expect(delta!.changedFields.some(c => c.field === 'unresolvedItems')).toBe(false)
  })
})

// ─── 11. Null vs empty string is handled safely ─────────────────────────────

describe('null vs empty string handling', () => {
  it('treats null and empty string as equivalent', () => {
    const delta = deriveDecisionIntelligenceDelta({
      previous: { authorityState: null },
      current: makeResult({ authorityState: '' }),
    })

    expect(delta).toBeTruthy()
    expect(delta!.changedFields.some(c => c.field === 'authorityState')).toBe(false)
  })

  it('treats undefined and empty string as equivalent', () => {
    const delta = deriveDecisionIntelligenceDelta({
      previous: {} as any,
      current: makeResult({ authorityState: '' }),
    })

    expect(delta).toBeTruthy()
    expect(delta!.changedFields.some(c => c.field === 'authorityState')).toBe(false)
  })

  it('treats null and undefined as equivalent', () => {
    const delta = deriveDecisionIntelligenceDelta({
      previous: { consequenceState: null },
      current: makeResult({ consequenceState: undefined as any }),
    })

    expect(delta).toBeTruthy()
    expect(delta!.changedFields.some(c => c.field === 'consequenceState')).toBe(false)
  })
})

// ─── 12. No internal taxonomy keys or engine IDs in serialised delta ────────

describe('no internal identifiers in delta', () => {
  it('does not contain engine IDs in headline or summaries', () => {
    const delta = deriveDecisionIntelligenceDelta({
      previous: { nextAdmissibleMove: 'Old move.' },
      current: makeResult({ nextAdmissibleMove: 'New move.' }),
    })

    expect(delta).toBeTruthy()
    const serialised = JSON.stringify(delta)
    // Common engine ID patterns
    expect(serialised).not.toContain('situation-translator')
    expect(serialised).not.toContain('kernel-lens-runner')
    expect(serialised).not.toContain('contradiction-resolver')
    expect(serialised).not.toContain('simulation-gate')
    expect(serialised).not.toContain('synthesis-gate')
  })

  it('does not contain taxonomy keys in headline or summaries', () => {
    const delta = deriveDecisionIntelligenceDelta({
      previous: { situationRead: 'Old.' },
      current: makeResult({ situationRead: 'New.' }),
    })

    expect(delta).toBeTruthy()
    const serialised = JSON.stringify(delta)
    expect(serialised).not.toContain('GOVERNANCE_AND_BOARD')
    expect(serialised).not.toContain('COMPLIANCE_AND_FILING')
  })
})

// ─── 13. Highest-significance change drives headline ────────────────────────

describe('headline priority', () => {
  it('uses HIGH significance change as headline when present', () => {
    const delta = deriveDecisionIntelligenceDelta({
      previous: {
        nextAdmissibleMove: 'Identify owner.',
        evidenceState: 'No signals.',
      },
      current: makeResult({
        nextAdmissibleMove: 'Confirm approval authority.',
        evidenceState: '3 signals detected.',
      }),
    })

    expect(delta).toBeTruthy()
    // nextAdmissibleMove is HIGH, evidenceState is MEDIUM
    expect(delta!.headline).toContain('next admissible move changed')
  })

  it('uses MEDIUM significance when no HIGH changes exist', () => {
    const delta = deriveDecisionIntelligenceDelta({
      previous: {
        evidenceState: 'No signals.',
        consequenceState: null,
      },
      current: makeResult({
        evidenceState: '3 signals detected.',
        consequenceState: 'Financial exposure.',
      }),
    })

    expect(delta).toBeTruthy()
    // Both MEDIUM — headline should say "N aspect(s) of the reading changed"
    expect(delta!.headline).toContain('aspect(s) of the reading changed')
  })
})

// ─── 14. Null previous returns null ─────────────────────────────────────────

describe('null previous', () => {
  it('returns null when no previous snapshot exists', () => {
    const delta = deriveDecisionIntelligenceDelta({
      previous: null,
      current: makeResult({ authorityState: 'CEO.' }),
    })

    expect(delta).toBeNull()
  })

  it('returns null when previous is undefined', () => {
    const delta = deriveDecisionIntelligenceDelta({
      current: makeResult({ authorityState: 'CEO.' }),
    })

    expect(delta).toBeNull()
  })
})

// ─── 15. Multiple simultaneous changes ──────────────────────────────────────

describe('multiple simultaneous changes', () => {
  it('reports all changed fields', () => {
    const delta = deriveDecisionIntelligenceDelta({
      previous: {
        authorityState: null,
        evidenceState: 'No signals.',
        nextAdmissibleMove: 'Identify owner.',
        unresolvedItems: ['Authority gap', 'Evidence gap'],
        confidence: 'LOW',
      },
      current: makeResult({
        authorityState: 'CFO named.',
        evidenceState: '3 signals detected.',
        nextAdmissibleMove: 'Confirm approval authority.',
        unresolvedItems: ['Authority gap'],
        confidence: 'MEDIUM',
      }),
    })

    expect(delta).toBeTruthy()
    expect(delta!.changedFields.length).toBeGreaterThanOrEqual(4)
    // Headline should be from HIGHEST significance change
    // nextAdmissibleMove and authorityState are both HIGH
    expect(delta!.headline).toBeTruthy()
  })
})
