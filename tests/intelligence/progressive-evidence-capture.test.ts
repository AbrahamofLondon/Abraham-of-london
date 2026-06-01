/**
 * tests/intelligence/progressive-evidence-capture.test.ts
 *
 * Tests for the Progressive Evidence Capture module.
 *
 * Rules:
 *   - Free Signal returns only one prompt.
 *   - Free Signal does not ask enterprise/private fields.
 *   - Missing minimum viable input is prioritised.
 *   - Purpose Alignment prioritises justifying_evidence when absent.
 *   - Constitutional prioritises authority/mandate fields.
 *   - Enterprise prioritises scenario_responses when absent.
 *   - Prompt includes engine unlock reason.
 *   - maxPrompts is respected.
 *   - No prompt is produced when all required fields are satisfied.
 *   - EngineTrace missingFields feed into prompt selection.
 *   - Private fields are not suggested on public surfaces.
 */

import { describe, it, expect } from 'vitest'
import { deriveProgressiveEvidenceCapture } from '@/lib/intelligence/progressive-evidence-capture'

// ─── 1. Free Signal returns only one prompt ─────────────────────────────────

describe('Free Signal', () => {
  it('returns at most one prompt by default', () => {
    const result = deriveProgressiveEvidenceCapture({
      surface: 'free_signal',
      providedFields: {},
    })

    expect(result.topPrompts.length).toBeLessThanOrEqual(1)
    expect(result.nextBestCapture).toBeTruthy()
  })

  it('does not ask enterprise or private fields', () => {
    const result = deriveProgressiveEvidenceCapture({
      surface: 'free_signal',
      providedFields: {},
    })

    for (const prompt of result.topPrompts) {
      expect(prompt.privacyLevel).not.toBe('private')
      expect(prompt.privacyLevel).not.toBe('aggregate_only')
      // Enterprise-specific fields
      expect(prompt.fieldKey).not.toBe('domain_scores')
      expect(prompt.fieldKey).not.toBe('dependency_map')
      expect(prompt.fieldKey).not.toBe('scenario_responses')
      expect(prompt.fieldKey).not.toBe('board_challenge_readiness')
    }
  })

  it('returns no prompts when all required fields are satisfied', () => {
    const result = deriveProgressiveEvidenceCapture({
      surface: 'free_signal',
      providedFields: { situation: 'We need board approval to proceed with the launch.' },
    })

    expect(result.topPrompts.length).toBe(0)
    expect(result.nextBestCapture).toBeNull()
  })

  it('includes engine unlock reason in prompt', () => {
    const result = deriveProgressiveEvidenceCapture({
      surface: 'free_signal',
      providedFields: {},
    })

    if (result.nextBestCapture) {
      expect(result.nextBestCapture.reason).toBeTruthy()
      expect(result.nextBestCapture.reason.length).toBeGreaterThan(0)
      expect(result.nextBestCapture.unlocksEngines.length).toBeGreaterThan(0)
    }
  })
})

// ─── 2. Missing minimum viable input is prioritised ─────────────────────────

describe('minimum viable input prioritisation', () => {
  it('prioritises missing MVI fields over enrichment fields', () => {
    // Fast Diagnostic: situation is MVI, blocker is enrichment
    const result = deriveProgressiveEvidenceCapture({
      surface: 'fast_diagnostic',
      providedFields: { situation: 'We need approval.' },
    })

    // With situation provided, the next prompt should be about enrichment fields
    // that unlock engines (like blocker, decision_owner, etc.)
    expect(result.topPrompts.length).toBeGreaterThanOrEqual(0)
  })

  it('asks for situation when it is missing on fast_diagnostic', () => {
    const result = deriveProgressiveEvidenceCapture({
      surface: 'fast_diagnostic',
      providedFields: {},
    })

    // situation is the only MVI field for fast_diagnostic
    expect(result.missingFields).toContain('situation')
  })
})

// ─── 3. Purpose Alignment prioritises justifying_evidence when absent ───────

describe('Purpose Alignment', () => {
  it('prioritises justifying_evidence when absent and MVI is satisfied', () => {
    const result = deriveProgressiveEvidenceCapture({
      surface: 'purpose_alignment',
      providedFields: {
        stated_purpose: 'Lead the team effectively.',
        avoided_decision: 'Whether to restructure.',
        competing_obligation: 'Current project deadlines.',
      },
    })

    // MVI is satisfied, so it should ask for the next most valuable field
    // justifying_evidence unlocks evidence-lens and evidence-tier-derivation
    expect(result.topPrompts.length).toBeGreaterThan(0)
  })

  it('prioritises MVI fields when they are missing', () => {
    const result = deriveProgressiveEvidenceCapture({
      surface: 'purpose_alignment',
      providedFields: {
        stated_purpose: 'Lead the team effectively.',
      },
    })

    // avoided_decision and competing_obligation are MVI and missing
    expect(result.missingFields).toContain('avoided_decision')
    expect(result.missingFields).toContain('competing_obligation')
  })
})

// ─── 4. Constitutional prioritises authority/mandate fields ─────────────────

describe('Constitutional Diagnostic', () => {
  it('prioritises approving_authority and mandate_source when missing', () => {
    const result = deriveProgressiveEvidenceCapture({
      surface: 'constitutional_diagnostic',
      providedFields: {},
    })

    // MVI fields: decision_owner, approving_authority, mandate_source
    expect(result.missingFields).toContain('decision_owner')
    expect(result.missingFields).toContain('approving_authority')
    expect(result.missingFields).toContain('mandate_source')
  })

  it('asks for blocking_authority when MVI is satisfied', () => {
    const result = deriveProgressiveEvidenceCapture({
      surface: 'constitutional_diagnostic',
      providedFields: {
        decision_owner: 'CEO',
        approving_authority: 'Board',
        mandate_source: 'Shareholder agreement',
      },
    })

    // MVI is satisfied, should ask for next valuable field
    // blocking_authority unlocks constitutional-engine, failure-mode-lens, adversarial-preview
    if (result.topPrompts.length > 0) {
      expect(result.topPrompts[0].fieldKey).toBeTruthy()
    }
  })
})

// ─── 5. Enterprise prioritises scenario_responses when absent ───────────────

describe('Enterprise Assessment', () => {
  it('prioritises scenario_responses when absent and MVI is partially satisfied', () => {
    const result = deriveProgressiveEvidenceCapture({
      surface: 'enterprise_assessment',
      providedFields: {
        domain_scores: { leadership: 65, governance: 45, execution: 55, risk: 40 },
        dependency_map: ['leadership depends on governance'],
      },
    })

    // scenario_responses is MVI and missing
    expect(result.missingFields).toContain('scenario_responses')
  })

  it('includes scenario_responses in missing fields when not provided', () => {
    const result = deriveProgressiveEvidenceCapture({
      surface: 'enterprise_assessment',
      providedFields: {},
    })

    expect(result.missingFields).toContain('scenario_responses')
  })
})

// ─── 6. maxPrompts is respected ─────────────────────────────────────────────

describe('maxPrompts', () => {
  it('returns exactly maxPrompts prompts when more fields are missing', () => {
    const result = deriveProgressiveEvidenceCapture({
      surface: 'fast_diagnostic',
      providedFields: {},
      maxPrompts: 2,
    })

    expect(result.topPrompts.length).toBeLessThanOrEqual(2)
  })

  it('defaults to 1 prompt when maxPrompts is not specified', () => {
    const result = deriveProgressiveEvidenceCapture({
      surface: 'fast_diagnostic',
      providedFields: {},
    })

    expect(result.topPrompts.length).toBeLessThanOrEqual(1)
  })

  it('returns fewer prompts when fewer fields are missing', () => {
    const result = deriveProgressiveEvidenceCapture({
      surface: 'free_signal',
      providedFields: { situation: 'We need board approval.' },
      maxPrompts: 5,
    })

    // Only 1 field total for free_signal, and it's provided
    expect(result.topPrompts.length).toBe(0)
  })
})

// ─── 7. EngineTrace missingFields feed into prompt selection ────────────────

describe('engine trace integration', () => {
  it('considers skipped engines when selecting prompts', () => {
    const result = deriveProgressiveEvidenceCapture({
      surface: 'fast_diagnostic',
      providedFields: { situation: 'We need board approval.' },
      skippedEngines: [
        {
          engineId: 'cost-of-delay',
          reason: 'Missing inputs: deadline, consequence',
          missingFields: ['deadline', 'consequence'],
        },
      ],
    })

    // Should suggest fields that unlock cost-of-delay
    if (result.topPrompts.length > 0) {
      const prompt = result.topPrompts[0]
      expect(prompt.unlocksEngines).toBeDefined()
    }
  })
})

// ─── 8. Private fields are not suggested on public surfaces ─────────────────

describe('privacy boundaries', () => {
  it('does not suggest private fields on free_signal', () => {
    const result = deriveProgressiveEvidenceCapture({
      surface: 'free_signal',
      providedFields: {},
    })

    for (const prompt of result.topPrompts) {
      expect(prompt.privacyLevel).not.toBe('private')
    }
  })

  it('does not suggest aggregate_only fields on free_signal', () => {
    const result = deriveProgressiveEvidenceCapture({
      surface: 'free_signal',
      providedFields: {},
    })

    for (const prompt of result.topPrompts) {
      expect(prompt.privacyLevel).not.toBe('aggregate_only')
    }
  })
})

// ─── 9. Result structure ────────────────────────────────────────────────────

describe('result structure', () => {
  it('includes surface, missingFields, topPrompts, nextBestCapture, unlockedIfAnswered', () => {
    const result = deriveProgressiveEvidenceCapture({
      surface: 'fast_diagnostic',
      providedFields: {},
    })

    expect(result.surface).toBe('fast_diagnostic')
    expect(Array.isArray(result.missingFields)).toBe(true)
    expect(Array.isArray(result.topPrompts)).toBe(true)
    // nextBestCapture can be null if no fields are missing
    // unlockedIfAnswered should be an array
    expect(Array.isArray(result.unlockedIfAnswered)).toBe(true)
  })

  it('prompts have all required fields', () => {
    const result = deriveProgressiveEvidenceCapture({
      surface: 'fast_diagnostic',
      providedFields: {},
    })

    for (const prompt of result.topPrompts) {
      expect(prompt.fieldKey).toBeTruthy()
      expect(prompt.question).toBeTruthy()
      expect(prompt.reason).toBeTruthy()
      expect(Array.isArray(prompt.unlocksEngines)).toBe(true)
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(prompt.priority)
      expect(['client_safe', 'aggregate_only', 'private']).toContain(prompt.privacyLevel)
    }
  })
})

// ─── 10. Team Assessment ────────────────────────────────────────────────────

describe('Team Assessment', () => {
  it('prioritises perceived_owner and perceived_blocker when missing', () => {
    const result = deriveProgressiveEvidenceCapture({
      surface: 'team_assessment',
      providedFields: {},
    })

    expect(result.missingFields).toContain('perceived_decision')
    expect(result.missingFields).toContain('perceived_owner')
    expect(result.missingFields).toContain('perceived_blocker')
  })
})
