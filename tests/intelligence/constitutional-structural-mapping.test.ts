/**
 * tests/intelligence/constitutional-structural-mapping.test.ts
 *
 * Tests for the Constitutional Structural Mapping module.
 *
 * Rules:
 *   - Never fabricate structural facts from scores.
 *   - Never claim authority is established unless approvingAuthority or
 *     mandateSource supports it.
 *   - Never treat decisionOwner as approvingAuthority.
 *   - Never treat low resonance/certainty score as a named authority.
 *   - Never expose raw unsafe answer text.
 *   - Use unresolved language when fields are missing.
 */

import { describe, it, expect } from 'vitest'
import { mapConstitutionalAnswersToStructuralInput } from '@/lib/intelligence/constitutional-structural-mapping'

// ─── 1. Explicit answer ID mapping ──────────────────────────────────────────

describe('explicit answer ID mapping', () => {
  it('maps authority_clarity to decisionOwner', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      userAnswers: {
        authority_clarity: { text: 'The CEO owns this decision.' },
      },
    })
    expect(result.decisionOwner).toBe('The CEO owns this decision.')
  })

  it('maps authority_owner to decisionOwner', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      userAnswers: {
        authority_owner: { text: 'The board owns this.' },
      },
    })
    expect(result.decisionOwner).toBe('The board owns this.')
  })

  it('maps authority_approval to approvingAuthority', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      userAnswers: {
        authority_approval: { text: 'The CFO must approve.' },
      },
    })
    expect(result.approvingAuthority).toBe('The CFO must approve.')
  })

  it('maps authority_blocker to blockingAuthority', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      userAnswers: {
        authority_blocker: { text: 'The legal team can block.' },
      },
    })
    expect(result.blockingAuthority).toBe('The legal team can block.')
  })

  it('maps authority_mandate to mandateSource', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      userAnswers: {
        authority_mandate: { text: 'Shareholder agreement.' },
      },
    })
    expect(result.mandateSource).toBe('Shareholder agreement.')
  })

  it('maps authority_route to currentRoute', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      userAnswers: {
        authority_route: { text: 'Current approach is escalation.' },
      },
    })
    expect(result.currentRoute).toBe('Current approach is escalation.')
  })

  it('maps constraint_boundary to nonNegotiableConstraint', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      userAnswers: {
        constraint_boundary: { text: 'Cannot exceed budget.' },
      },
    })
    expect(result.nonNegotiableConstraint).toBe('Cannot exceed budget.')
  })

  it('maps failure_mode to failureMode', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      userAnswers: {
        failure_mode: { text: 'Authority ambiguity.' },
      },
    })
    expect(result.failureMode).toBe('Authority ambiguity.')
  })

  it('maps repair_condition to repairCondition', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      userAnswers: {
        repair_condition: { text: 'Clear mandate needed.' },
      },
    })
    expect(result.repairCondition).toBe('Clear mandate needed.')
  })
})

// ─── 2. Prompt text pattern mapping ─────────────────────────────────────────

describe('prompt text pattern mapping', () => {
  it('maps "who owns this decision" prompt to decisionOwner', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      userAnswers: {
        q1: { prompt: 'Who owns this decision?', text: 'The CEO.' },
      },
    })
    expect(result.decisionOwner).toBe('The CEO.')
  })

  it('maps "who can approve this decision" prompt to approvingAuthority', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      userAnswers: {
        q2: { prompt: 'Who can approve this decision?', text: 'The board.' },
      },
    })
    expect(result.approvingAuthority).toBe('The board.')
  })

  it('maps "who can block this decision" prompt to blockingAuthority', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      userAnswers: {
        q3: { prompt: 'Who can block this decision?', text: 'Legal counsel.' },
      },
    })
    expect(result.blockingAuthority).toBe('Legal counsel.')
  })

  it('does not override explicit ID mapping with prompt pattern for the same field', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      userAnswers: {
        authority_approval: { text: 'Explicit approving authority.' },
        q_extra: { prompt: 'Who can approve this decision?', text: 'Should not override.' },
      },
    })
    // Explicit ID takes priority
    expect(result.approvingAuthority).toBe('Explicit approving authority.')
    // Prompt pattern for the same field should not override
    expect(result.approvingAuthority).toBe('Explicit approving authority.')
  })
})

// ─── 3. Report/decision/routeSummary fallback ───────────────────────────────

describe('report/decision/routeSummary fallback', () => {
  it('extracts decisionOwner from decision object', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      decision: { decisionOwner: 'CEO' },
    })
    expect(result.decisionOwner).toBe('CEO')
  })

  it('extracts approvingAuthority from decision authorityType', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      decision: { authorityType: 'Board approval required' },
    })
    expect(result.approvingAuthority).toBe('Board approval required')
  })

  it('extracts route from decision', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      decision: { route: 'STRATEGY' },
    })
    expect(result.currentRoute).toBe('STRATEGY')
  })

  it('extracts route from routeSummary', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      routeSummary: { route: 'DIAGNOSTIC' },
    })
    expect(result.currentRoute).toBe('DIAGNOSTIC')
  })

  it('extracts failureMode from decision failureModes array', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      decision: { failureModes: ['authority_ambiguity', 'narrative_incoherence'] },
    })
    expect(result.failureMode).toBe('authority_ambiguity')
  })

  it('extracts failureMode from decision disqualifiersTriggered', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      decision: { disqualifiersTriggered: ['authority_gap'] },
    })
    expect(result.failureMode).toBe('authority_gap')
  })
})

// ─── 4. Score-only input does not fabricate ─────────────────────────────────

describe('score-only input safety', () => {
  it('does not fabricate authority from resonance/certainty scores', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      userAnswers: {
        q1: { resonance: 3, certainty: 2 },
        q2: { resonance: 8, certainty: 7 },
      },
    })
    expect(result.decisionOwner).toBeUndefined()
    expect(result.approvingAuthority).toBeUndefined()
    expect(result.blockingAuthority).toBeUndefined()
    expect(result.mandateSource).toBeUndefined()
  })

  it('does not fabricate mandate from low scores', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      userAnswers: {
        authority_mandate: { resonance: 2, certainty: 1 },
      },
    })
    // resonance/certainty answers don't have text — should not extract
    expect(result.mandateSource).toBeUndefined()
  })

  it('does not fabricate any structural field from empty input', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      userAnswers: {},
    })
    expect(result.decisionOwner).toBeUndefined()
    expect(result.approvingAuthority).toBeUndefined()
    expect(result.blockingAuthority).toBeUndefined()
    expect(result.mandateSource).toBeUndefined()
    expect(result.currentRoute).toBeUndefined()
    expect(result.nonNegotiableConstraint).toBeUndefined()
    expect(result.failureMode).toBeUndefined()
    expect(result.repairCondition).toBeUndefined()
  })
})

// ─── 5. Partial data leaves missing fields undefined ────────────────────────

describe('partial data handling', () => {
  it('leaves missing fields undefined when only decisionOwner is provided', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      userAnswers: {
        authority_owner: { text: 'CEO' },
      },
    })
    expect(result.decisionOwner).toBe('CEO')
    expect(result.approvingAuthority).toBeUndefined()
    expect(result.blockingAuthority).toBeUndefined()
    expect(result.mandateSource).toBeUndefined()
    expect(result.currentRoute).toBeUndefined()
    expect(result.nonNegotiableConstraint).toBeUndefined()
    expect(result.failureMode).toBeUndefined()
    expect(result.repairCondition).toBeUndefined()
  })

  it('handles empty answers object gracefully', () => {
    const result = mapConstitutionalAnswersToStructuralInput({})
    expect(result.decisionOwner).toBeUndefined()
    expect(result.approvingAuthority).toBeUndefined()
  })

  it('handles null userAnswers gracefully', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      userAnswers: undefined,
    })
    expect(result.decisionOwner).toBeUndefined()
  })
})

// ─── 6. Answer value extraction ─────────────────────────────────────────────

describe('answer value extraction', () => {
  it('extracts from "value" field', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      userAnswers: {
        authority_owner: { value: 'CEO' },
      },
    })
    expect(result.decisionOwner).toBe('CEO')
  })

  it('extracts from "label" field', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      userAnswers: {
        authority_owner: { label: 'Chief Executive Officer' },
      },
    })
    expect(result.decisionOwner).toBe('Chief Executive Officer')
  })

  it('extracts from "answer" field', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      userAnswers: {
        authority_owner: { answer: 'The CEO' },
      },
    })
    expect(result.decisionOwner).toBe('The CEO')
  })
})

// ─── 7. decisionOwner vs approvingAuthority distinction ─────────────────────

describe('decisionOwner vs approvingAuthority distinction', () => {
  it('does not treat decisionOwner as approvingAuthority', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      userAnswers: {
        authority_owner: { text: 'CEO' },
      },
    })
    expect(result.decisionOwner).toBe('CEO')
    expect(result.approvingAuthority).toBeUndefined()
  })

  it('keeps decisionOwner and approvingAuthority separate when both provided', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      userAnswers: {
        authority_owner: { text: 'CEO' },
        authority_approval: { text: 'Board of Directors' },
      },
    })
    expect(result.decisionOwner).toBe('CEO')
    expect(result.approvingAuthority).toBe('Board of Directors')
  })
})

// ─── 8. structuralFacts override (Priority 0) ────────────────────────────────

describe('structuralFacts override (Priority 0)', () => {
  it('structuralFacts override answer ID mapping', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      userAnswers: {
        authority_owner: { text: 'CEO from answer' },
      },
      structuralFacts: {
        decisionOwner: 'CEO from structural facts',
      },
    })
    // structuralFacts has highest priority
    expect(result.decisionOwner).toBe('CEO from structural facts')
  })

  it('structuralFacts override report/decision fallback', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      decision: { decisionOwner: 'CEO from decision' },
      structuralFacts: {
        decisionOwner: 'CEO from structural facts',
      },
    })
    expect(result.decisionOwner).toBe('CEO from structural facts')
  })

  it('approvingAuthority from structuralFacts sets authority state', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      structuralFacts: {
        approvingAuthority: 'Board of Directors',
      },
    })
    expect(result.approvingAuthority).toBe('Board of Directors')
  })

  it('decisionOwner alone does not establish approving authority', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      structuralFacts: {
        decisionOwner: 'CEO',
      },
    })
    expect(result.decisionOwner).toBe('CEO')
    expect(result.approvingAuthority).toBeUndefined()
  })

  it('blockingAuthority from structuralFacts is captured', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      structuralFacts: {
        blockingAuthority: 'Legal counsel',
      },
    })
    expect(result.blockingAuthority).toBe('Legal counsel')
  })

  it('mandateSource from structuralFacts is captured', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      structuralFacts: {
        mandateSource: 'Board instruction',
      },
    })
    expect(result.mandateSource).toBe('Board instruction')
  })

  it('currentRoute from structuralFacts is captured', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      structuralFacts: {
        currentRoute: 'Leadership review',
      },
    })
    expect(result.currentRoute).toBe('Leadership review')
  })

  it('failureMode from structuralFacts is captured', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      structuralFacts: {
        failureMode: 'unclear ownership',
      },
    })
    expect(result.failureMode).toBe('unclear ownership')
  })

  it('repairCondition from structuralFacts is captured', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      structuralFacts: {
        repairCondition: 'Confirm mandate from board',
      },
    })
    expect(result.repairCondition).toBe('Confirm mandate from board')
  })

  it('all 7 structural fields can be set simultaneously', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      structuralFacts: {
        decisionOwner: 'CEO',
        approvingAuthority: 'Board',
        blockingAuthority: 'Legal',
        mandateSource: 'Shareholder agreement',
        currentRoute: 'Board / executive approval',
        failureMode: 'missing approval',
        repairCondition: 'Get board sign-off',
      },
    })
    expect(result.decisionOwner).toBe('CEO')
    expect(result.approvingAuthority).toBe('Board')
    expect(result.blockingAuthority).toBe('Legal')
    expect(result.mandateSource).toBe('Shareholder agreement')
    expect(result.currentRoute).toBe('Board / executive approval')
    expect(result.failureMode).toBe('missing approval')
    expect(result.repairCondition).toBe('Get board sign-off')
  })
})

// ─── 9. Missing structuralFacts falls back safely ────────────────────────────

describe('missing structuralFacts fallback', () => {
  it('falls back to answer IDs when structuralFacts is undefined', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      userAnswers: {
        authority_owner: { text: 'CEO from answer' },
      },
    })
    expect(result.decisionOwner).toBe('CEO from answer')
  })

  it('falls back to report/decision when no answers or structuralFacts', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      decision: { route: 'STRATEGY' },
    })
    expect(result.currentRoute).toBe('STRATEGY')
  })

  it('returns empty result when nothing is provided', () => {
    const result = mapConstitutionalAnswersToStructuralInput({})
    expect(result.decisionOwner).toBeUndefined()
    expect(result.approvingAuthority).toBeUndefined()
    expect(result.blockingAuthority).toBeUndefined()
    expect(result.mandateSource).toBeUndefined()
    expect(result.currentRoute).toBeUndefined()
    expect(result.failureMode).toBeUndefined()
    expect(result.repairCondition).toBeUndefined()
  })
})

// ─── 10. Score-only input does not fabricate structural facts ────────────────

describe('score-only input does not fabricate', () => {
  it('does not fabricate any structural field from resonance/certainty scores', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      userAnswers: {
        q1: { resonance: 3, certainty: 2 },
        q2: { resonance: 8, certainty: 7 },
        q3: { resonance: 1, certainty: 1 },
      },
    })
    expect(result.decisionOwner).toBeUndefined()
    expect(result.approvingAuthority).toBeUndefined()
    expect(result.blockingAuthority).toBeUndefined()
    expect(result.mandateSource).toBeUndefined()
    expect(result.currentRoute).toBeUndefined()
    expect(result.failureMode).toBeUndefined()
    expect(result.repairCondition).toBeUndefined()
  })

  it('does not fabricate authority from low scores', () => {
    const result = mapConstitutionalAnswersToStructuralInput({
      report: { authorityScore: 2 },
    })
    // Low score should not fabricate a named authority
    expect(result.approvingAuthority).toBeUndefined()
    expect(result.decisionOwner).toBeUndefined()
  })
})
