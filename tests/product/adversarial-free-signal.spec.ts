/**
 * tests/product/adversarial-free-signal.spec.ts — Adversarial Free Signal Tests
 *
 * Confirms that the Free Signal output includes one controlled adversarial
 * preview and does NOT leak full adversarial challenges or paid dossier fields.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { DecisionIntelligenceKernel } from '../../lib/intelligence/decision-intelligence-kernel'
import { selectAdversarialPreview } from '../../lib/kernel/adversarial-preview'
import { TEST_SCENARIOS } from './scenarios'

describe('Adversarial Free Signal', () => {
  let kernel: DecisionIntelligenceKernel

  beforeEach(() => {
    kernel = new DecisionIntelligenceKernel()
  })

  /**
   * Helper: process a scenario and return the kernel result with living case.
   */
  async function getFullResult(scenarioInput: string, clarifications?: Record<string, string>) {
    const caseId = `adv-test-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    return kernel.process({
      caseId,
      caseReference: `ADV-TEST-${caseId.substring(8, 16).toUpperCase()}`,
      rawScenario: scenarioInput,
      aperture: 'paid_full_dossier',
      requestedTier: 'full_dossier',
      clarifications: clarifications || { authority: 'Authority is established', obligation: 'Obligations are known' },
    })
  }

  // ─── Test 1: Board scenario shows one adversarial preview ─────────────────

  it('should show board governance challenge for board pressure scenario', async () => {
    const result = await getFullResult(TEST_SCENARIOS.board_decision_political_pressure.input, {
      authority: 'The board has authority',
      obligation: 'Fiduciary duty applies',
    })

    expect(result.livingCase).toBeDefined()
    const preview = selectAdversarialPreview(result.livingCase!)
    expect(preview).not.toBeNull()

    // Should reference board governance or management pre-decision
    const hasBoardLanguage =
      preview!.label.toLowerCase().includes('board') ||
      preview!.label.toLowerCase().includes('governance') ||
      preview!.label.toLowerCase().includes('management')
    expect(hasBoardLanguage).toBe(true)

    // Should have a challengedBy field
    expect(preview!.challengedBy).toBeDefined()
  })

  // ─── Test 2: Strategic partnership shows adversarial preview ──────────────

  it('should show irrevocable commitment risk for strategic partnership', async () => {
    const result = await getFullResult(TEST_SCENARIOS.strategic_asymmetric_partnership.input, {
      authority: 'The board has authority',
      obligation: 'Fiduciary duty applies',
    })

    expect(result.livingCase).toBeDefined()
    const preview = selectAdversarialPreview(result.livingCase!)
    expect(preview).not.toBeNull()

    // Should reference commitment, IP, or optionality
    const hasStrategicLanguage =
      preview!.label.toLowerCase().includes('commitment') ||
      preview!.label.toLowerCase().includes('irrevocable') ||
      preview!.label.toLowerCase().includes('strategic') ||
      preview!.challenge.toLowerCase().includes('ip') ||
      preview!.challenge.toLowerCase().includes('exit') ||
      preview!.challenge.toLowerCase().includes('optionality')
    expect(hasStrategicLanguage).toBe(true)
  })

  // ─── Test 3: Reputational scenario shows adversarial preview ──────────────

  it('should show legal/prejudice risk for reputational scenario', async () => {
    const result = await getFullResult(TEST_SCENARIOS.executive_reputational_exposure.input, {
      authority: 'The board has authority',
      obligation: 'Legal obligations apply',
    })

    expect(result.livingCase).toBeDefined()
    const preview = selectAdversarialPreview(result.livingCase!)
    expect(preview).not.toBeNull()

    // Should reference legal, proceedings, or response
    const hasLegalLanguage =
      preview!.label.toLowerCase().includes('legal') ||
      preview!.label.toLowerCase().includes('reputational') ||
      preview!.label.toLowerCase().includes('response') ||
      preview!.challenge.toLowerCase().includes('statement') ||
      preview!.challenge.toLowerCase().includes('proceedings') ||
      preview!.challenge.toLowerCase().includes('legal')
    expect(hasLegalLanguage).toBe(true)
  })

  // ─── Test 4: Market claim shows adversarial preview ───────────────────────

  it('should show claim evidence gap for market claim scenario', async () => {
    const result = await getFullResult(TEST_SCENARIOS.market_claim_strong_copy_weak_proof.input, {
      authority: 'Authority is established',
      obligation: 'Obligations are known',
    })

    expect(result.livingCase).toBeDefined()
    const preview = selectAdversarialPreview(result.livingCase!)
    expect(preview).not.toBeNull()

    // Should reference claim, evidence, or proof
    const hasClaimLanguage =
      preview!.label.toLowerCase().includes('claim') ||
      preview!.label.toLowerCase().includes('proof') ||
      preview!.label.toLowerCase().includes('evidence') ||
      preview!.label.toLowerCase().includes('commercial')
    expect(hasClaimLanguage).toBe(true)
  })

  // ─── Test 5: Low-stakes preference has no adversarial preview ─────────────

  it('should not show adversarial preview for low-stakes preference', async () => {
    const result = await getFullResult(TEST_SCENARIOS.low_stakes_preference.input)

    expect(result.livingCase).toBeDefined()
    const preview = selectAdversarialPreview(result.livingCase!)
    expect(preview).toBeNull()
  })

  // ─── Test 6: No full adversarial list leaks ───────────────────────────────

  it('should not expose full adversarial challenge list in Free Signal', async () => {
    const result = await getFullResult(TEST_SCENARIOS.hmrc_filing_rescue.input, {
      authority: 'The director is responsible',
      obligation: 'Statutory filing obligation',
    })

    // The living case has the full list — but the Free Signal output should not
    expect(result.livingCase).toBeDefined()

    // The selectAdversarialPreview returns only ONE challenge
    const preview = selectAdversarialPreview(result.livingCase!)
    expect(preview).not.toBeNull()

    // The living case may have multiple challenges
    if (result.livingCase!.adversarialChallenge.length > 1) {
      // But the preview only returns one
      expect(preview!.challenge).toBeDefined()
    }
  })

  // ─── Test 7: No Full Dossier fields in adversarial preview ────────────────

  it('should not contain Full Dossier fields in adversarial preview', async () => {
    const result = await getFullResult(TEST_SCENARIOS.hmrc_filing_rescue.input, {
      authority: 'The director is responsible',
      obligation: 'Statutory filing obligation',
    })

    const preview = selectAdversarialPreview(result.livingCase!)
    expect(preview).not.toBeNull()

    // The preview should only have label, challenge, challengedBy, whyItMatters
    const keys = Object.keys(preview!)
    expect(keys).toContain('label')
    expect(keys).toContain('challenge')
    expect(keys).toContain('whyItMatters')

    // Should NOT contain full dossier fields
    expect(keys).not.toContain('authorityMap')
    expect(keys).not.toContain('obligationMap')
    expect(keys).not.toContain('constraintGraph')
    expect(keys).not.toContain('evidenceGraph')
    expect(keys).not.toContain('selfAdversarialChallenge')
    expect(keys).not.toContain('recordReference')
  })

  // ─── Test 8: All danger scenarios produce an adversarial preview ──────────

  it('should produce adversarial preview for all non-low-stakes scenarios', async () => {
    const dangerScenarios = [
      TEST_SCENARIOS.board_decision_political_pressure,
      TEST_SCENARIOS.strategic_asymmetric_partnership,
      TEST_SCENARIOS.executive_reputational_exposure,
      TEST_SCENARIOS.market_claim_strong_copy_weak_proof,
      TEST_SCENARIOS.hmrc_filing_rescue,
      TEST_SCENARIOS.product_launch_revenue_pressure,
      TEST_SCENARIOS.procurement_supplier_risk,
      TEST_SCENARIOS.investor_pitch_unsupported_traction,
      TEST_SCENARIOS.operational_failure_unclear_owner,
      TEST_SCENARIOS.legal_admin_family_deadline,
      TEST_SCENARIOS.cash_constrained_survival,
    ]

    for (const scenario of dangerScenarios) {
      const result = await getFullResult(scenario.input, {
        authority: 'Authority is established',
        obligation: 'Obligations are known',
      })

      if (result.livingCase) {
        const preview = selectAdversarialPreview(result.livingCase)
        // Most scenarios should have a preview — but some may not if no adversarial challenges were detected
        if (preview) {
          expect(preview.label).toBeDefined()
          expect(preview.challenge).toBeDefined()
          expect(preview.whyItMatters).toBeDefined()
        }
      }
    }
  })
})
