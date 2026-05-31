/**
 * tests/product/kernel-classification.spec.ts
 *
 * Targeted tests for the two systemic failures identified in the
 * Kernel Reality Proof Pack:
 *
 *   1. No alternative class where ambiguity exists (11/12 scenarios)
 *   2. High-consequence case without adversarial challenge (4/12 scenarios)
 *
 * These tests verify the fixes are structurally sound and prevent
 * regression.
 */

import { describe, it, expect } from 'vitest'
import { SituationTranslator } from '../../lib/intelligence/situation-translator'
import { DecisionClassTaxonomy } from '../../lib/intelligence/decision-class-taxonomy'
import { KernelLensRunner } from '../../lib/intelligence/kernel-lens-runner'

const translator = new SituationTranslator()
const taxonomy = new DecisionClassTaxonomy()
const lensRunner = new KernelLensRunner()

// ─── Gap 1: Alternative classes when ambiguity exists ────────────────────────

describe('Gap 1 — Alternative classes must be preserved when ambiguity exists', () => {

  async function classifyWith(input: string) {
    const translation = await translator.translate(input)
    return taxonomy.classify({
      decisionClass: translation.decisionClass,
      translationConfidence: translation.translationConfidence,
      hiddenStakesDetected: translation.hiddenStakesDetected,
      alternativeClasses: translation.alternativeClasses,
      preservedAmbiguities: translation.preservedAmbiguities,
    })
  }

  it('HMRC filing rescue — authority ambiguity → at least one alternative class', async () => {
    const result = await classifyWith(
      'We have a company accounts filing due at Companies House in 14 days. The accountant has resigned. The director is unwell. There are no funds to pay for an emergency filing. The company is solvent but cash-poor.',
    )
    expect(result.alternativeClasses.length).toBeGreaterThan(0)
  })

  it('Board decision under political pressure — authority ambiguity → alternatives', async () => {
    const result = await classifyWith(
      'The board is divided about approving the acquisition. The CEO is in favour but two NEDs have reservations. Not sure who ultimately has the deciding vote.',
    )
    expect(result.alternativeClasses.length).toBeGreaterThan(0)
  })

  it('Market claim — weak evidence → alternatives', async () => {
    const result = await classifyWith(
      'We want to launch a market claim that we are the industry-leading solution. We have strong messaging but our team has not independently validated the claims.',
    )
    expect(result.alternativeClasses.length).toBeGreaterThan(0)
  })

  it('Cash-constrained survival — multiple ambiguities → alternatives', async () => {
    const result = await classifyWith(
      'We have 6 weeks of runway left. No investor has committed. Payroll is due in 3 weeks.',
    )
    expect(result.alternativeClasses.length).toBeGreaterThan(0)
  })

  it('Strategic partnership — authority + timing → alternatives', async () => {
    const result = await classifyWith(
      'We have an exclusive distribution deal on the table. Board has not reviewed. We need to respond within 10 days.',
    )
    expect(result.alternativeClasses.length).toBeGreaterThan(0)
  })

  it('Executive reputational exposure — no plan → alternatives', async () => {
    const result = await classifyWith(
      'Our CEO made a public statement that has been misinterpreted. Media coverage is increasing. Legal has not reviewed the proposed response.',
    )
    expect(result.alternativeClasses.length).toBeGreaterThan(0)
  })

  it('Legal deadline with no solicitor — cash + obligation → alternatives', async () => {
    const result = await classifyWith(
      "I need to respond to a court notice by next Friday. I don't have a solicitor and I'm not sure I can afford one.",
    )
    expect(result.alternativeClasses.length).toBeGreaterThan(0)
  })

  it('Low-stakes preference — no ambiguity → zero alternatives is acceptable', async () => {
    const result = await classifyWith(
      'Should we move our team standup from Monday to Wednesday? The team lead has approved it.',
    )
    // Low-stakes with no ambiguity may legitimately have no alternatives
    expect(result.primaryClass).toBe('LOW_STAKES_PREFERENCE')
    // Not an error if alternatives.length is 0 for genuine low-stakes
    expect(Array.isArray(result.alternativeClasses)).toBe(true)
  })

  it('Alternative classes never include the primary class', async () => {
    const result = await classifyWith(
      'We have a compliance filing due next week and no professional help available.',
    )
    const altClasses = result.alternativeClasses.map(a => a.decisionClass)
    expect(altClasses).not.toContain(result.primaryClass)
  })

  it('classify() accepts alternativeClasses and preservedAmbiguities', () => {
    // Structural: verify the method signature accepts the new fields without throwing
    expect(() => taxonomy.classify({
      decisionClass: 'COMPLIANCE_AND_FILING',
      translationConfidence: 'MEDIUM',
      hiddenStakesDetected: false,
      alternativeClasses: [{ decisionClass: 'LEGAL_AND_CONTRACTUAL', confidence: 'LOW', reason: 'test' }],
      preservedAmbiguities: ['authority_structure'],
    })).not.toThrow()
  })
})

// ─── Gap 2: Adversarial challenges for high-consequence scenarios ─────────────

describe('Gap 2 — Adversarial challenges for high-consequence scenarios', () => {

  function makeLivingCase(rawContext: string) {
    return {
      situationModel: { rawContext },
      constraintGraph: [],
      evidenceGraph: [],
      obligationMap: [],
      authorityMap: [],
      adversarialChallenge: [],
      selfAdversarialChallenge: null,
      minimumViablePath: [],
      forbiddenActions: [],
      classification: { primaryClass: 'GOVERNANCE_AND_BOARD' },
    } as any
  }

  it('Board decision with internal reservations → adversarial challenge', async () => {
    const lc = makeLivingCase('The board is divided. The CEO wants to acquire but NEDs have reservations about strategic fit.')
    const result = await lensRunner.run(lc, ['adversarial'])
    const contradictions = result.flatMap(r => r.contradictions)
    expect(contradictions.length).toBeGreaterThan(0)
    expect(contradictions.some(c => c.id === 'board-pressure-vs-reservations' || c.severity === 'HIGH')).toBe(true)
  })

  it('Cash runway + no committed investor → adversarial challenge', async () => {
    const lc = makeLivingCase('We have 6 weeks of runway left. No investor has committed. Payroll is due in 3 weeks.')
    const result = await lensRunner.run(lc, ['adversarial'])
    const contradictions = result.flatMap(r => r.contradictions)
    expect(contradictions.length).toBeGreaterThan(0)
    const ids = contradictions.map(c => c.id)
    expect(ids.includes('runway-vs-funding-delay') || contradictions.some(c => c.severity === 'CRITICAL')).toBe(true)
  })

  it('Strategic exclusive deal + capability loss → adversarial challenge', async () => {
    const lc = makeLivingCase('A competitor has offered us an exclusive distribution deal. We would lose our ability to sell direct.')
    const result = await lensRunner.run(lc, ['adversarial'])
    const contradictions = result.flatMap(r => r.contradictions)
    expect(contradictions.length).toBeGreaterThan(0)
    expect(contradictions.some(c => c.id === 'strategic-commitment-vs-capability')).toBe(true)
  })

  it('Reputational crisis + no reviewed response plan → adversarial challenge', async () => {
    const lc = makeLivingCase('Our CEO made a statement that has been misinterpreted. Media coverage is increasing. Legal has not reviewed the proposed response.')
    const result = await lensRunner.run(lc, ['adversarial'])
    const contradictions = result.flatMap(r => r.contradictions)
    expect(contradictions.length).toBeGreaterThan(0)
    expect(contradictions.some(c => c.id === 'reputational-threat-vs-response-gap')).toBe(true)
  })

  it('Revenue pressure + incomplete readiness → adversarial challenge', async () => {
    const lc = makeLivingCase('We need to launch next week. A major client contract depends on this. Testing is in progress and sign-off is not complete.')
    const result = await lensRunner.run(lc, ['adversarial'])
    const contradictions = result.flatMap(r => r.contradictions)
    expect(contradictions.some(c => c.id === 'revenue-vs-readiness')).toBe(true)
  })

  it('Investor pitch + unvalidated projections → adversarial challenge', async () => {
    const lc = makeLivingCase('We are pitching to investors. Our figures are based on internal projections that have not been validated externally.')
    const result = await lensRunner.run(lc, ['adversarial'])
    const contradictions = result.flatMap(r => r.contradictions)
    expect(contradictions.some(c => c.id === 'investor-claim-vs-evidence')).toBe(true)
  })

  it('HMRC obligation + no funds → original patterns still fire', async () => {
    const lc = makeLivingCase('We have a filing deadline in 14 days. We have no funds to pay the accountant.')
    const result = await lensRunner.run(lc, ['adversarial'])
    const contradictions = result.flatMap(r => r.contradictions)
    expect(contradictions.some(c => c.id === 'obligation-vs-resources' || c.id === 'deadline-vs-cash')).toBe(true)
  })
})

// ─── Product rule: No false LOW on high-consequence ──────────────────────────

describe('Product rule — classify() never returns empty alternatives on high-consequence ambiguous cases', () => {

  const highConsequenceInputs = [
    'We need to file tax accounts. No accountant. Deadline in 10 days.',
    'Board has not approved the acquisition. CEO wants to proceed.',
    'Market claim is unsupported. No customer validation.',
    'We have 4 weeks of runway. No funding secured.',
    'CEO statement misinterpreted. Media covering it. No legal review.',
  ]

  for (const input of highConsequenceInputs) {
    it(`has alternatives for: "${input.slice(0, 60)}..."`, async () => {
      const translation = await translator.translate(input)
      const classification = taxonomy.classify({
        decisionClass: translation.decisionClass,
        translationConfidence: translation.translationConfidence,
        hiddenStakesDetected: translation.hiddenStakesDetected,
        alternativeClasses: translation.alternativeClasses,
        preservedAmbiguities: translation.preservedAmbiguities,
      })

      // High-consequence non-low-stakes cases must produce alternatives
      if (classification.primaryClass !== 'LOW_STAKES_PREFERENCE') {
        expect(classification.alternativeClasses.length).toBeGreaterThan(0)
      }
    })
  }
})
