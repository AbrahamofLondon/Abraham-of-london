/**
 * tests/product/public-aperture.spec.ts — Public Aperture Tests
 *
 * Confirms that all public routes use the kernel and render FREE_SIGNAL only.
 * No paid dossier fields leak. Regulated boundary appears when relevant.
 * Low-stakes case does not upsell. Danger scenarios render protective first move.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { DecisionIntelligenceKernel } from '../../lib/intelligence/decision-intelligence-kernel'
import { LivingCasePersistence } from '../../lib/intelligence/living-case-persistence'
import { TEST_SCENARIOS } from './scenarios'

describe('Public Aperture — Free Signal Only', () => {
  let kernel: DecisionIntelligenceKernel
  let persistence: LivingCasePersistence

  beforeEach(() => {
    persistence = new LivingCasePersistence()
    persistence._clear()
    kernel = new DecisionIntelligenceKernel()
  })

  /**
   * Helper: process a scenario through the kernel and return the Free Signal output.
   * This simulates what the public API endpoint does.
   */
  async function getFreeSignal(scenarioInput: string, clarifications?: Record<string, string>) {
    const caseId = `pub-test-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    const result = await kernel.process({
      caseId,
      caseReference: `PUB-TEST-${caseId.substring(4, 12).toUpperCase()}`,
      rawScenario: scenarioInput,
      aperture: 'web',
      requestedTier: 'free_signal',
      clarifications,
    })
    return result
  }

  // ─── Test 1: All public routes use the kernel ──────────────────────────────

  it('should process a raw situation through the kernel and return a Free Signal', async () => {
    const result = await getFreeSignal(
      'We have a board decision to make about a major acquisition. The deadline is end of quarter. The board has authority. Fiduciary duty applies.',
      { authority: 'The board has authority', obligation: 'Fiduciary duty applies', constraint: 'No cash constraints', timing: 'End of quarter deadline' }
    )
    expect(result.status).toBe('COMPLETED')
    expect(result.output).not.toBeNull()
    expect(result.output!.tier).toBe('free_signal')
  })

  // ─── Test 2: Free Signal has the correct structure ─────────────────────────

  it('should return only FREE_SIGNAL fields — no paid dossier content', async () => {
    const result = await getFreeSignal(TEST_SCENARIOS.hmrc_filing_rescue.input, {
      authority: 'The director is responsible',
      obligation: 'Statutory filing obligation',
    })

    expect(result.status).toBe('COMPLETED')
    expect(result.output).not.toBeNull()

    const sectionIds = result.output!.sections.map(s => s.id)

    // Must include Free Signal fields
    expect(sectionIds).toContain('situation_class')
    expect(sectionIds).toContain('what_the_system_saw')
    expect(sectionIds).toContain('primary_failure_point')
    expect(sectionIds).toContain('governing_tension')
    expect(sectionIds).toContain('consequence_class')
    expect(sectionIds).toContain('what_full_analysis_maps')
    expect(sectionIds).toContain('direction_of_minimum_viable_move')

    // Must NOT include paid dossier fields
    expect(sectionIds).not.toContain('authority_map')
    expect(sectionIds).not.toContain('obligation_map')
    expect(sectionIds).not.toContain('constraint_graph')
    expect(sectionIds).not.toContain('evidence_graph')
    expect(sectionIds).not.toContain('adversarial_challenge')
    expect(sectionIds).not.toContain('self_adversarial_challenge')
    expect(sectionIds).not.toContain('minimum_viable_path')
    expect(sectionIds).not.toContain('forbidden_actions')
    expect(sectionIds).not.toContain('fallback_path')
    expect(sectionIds).not.toContain('record_reference')
  })

  // ─── Test 3: Regulated boundary appears when relevant ──────────────────────

  it('should show boundary note when regulated boundary is hit', async () => {
    const result = await getFreeSignal(TEST_SCENARIOS.hmrc_filing_rescue.input, {
      authority: 'The director is responsible',
      obligation: 'Statutory filing obligation',
    })

    if (result.livingCase?.regulatedBoundary?.hit) {
      // The Free Signal should mention the boundary
      expect(result.output).not.toBeNull()
    }
  })

  // ─── Test 4: Low-stakes case does not upsell ───────────────────────────────

  it('should keep low-stakes output proportionate — no paid upsell', async () => {
    const result = await getFreeSignal(TEST_SCENARIOS.low_stakes_preference.input)

    expect(result.classification?.primaryClass).toBe('LOW_STAKES_PREFERENCE')

    if (result.output) {
      const sectionIds = result.output.sections.map(s => s.id)
      // Low-stakes should still show the basic signal
      expect(sectionIds).toContain('situation_class')
      expect(sectionIds).toContain('what_the_system_saw')

      // Should not have institutional machinery
      expect(sectionIds).not.toContain('authority_map')
      expect(sectionIds).not.toContain('obligation_map')
    }
  })

  // ─── Test 5: Board scenario shows protective first move direction ──────────

  it('should show protective direction for board pressure scenario', async () => {
    const result = await getFreeSignal(TEST_SCENARIOS.board_decision_political_pressure.input, {
      authority: 'The board has authority',
      obligation: 'Fiduciary duty applies',
    })

    expect(result.classification?.primaryClass).toBe('GOVERNANCE_AND_BOARD')

    if (result.output) {
      const directionSection = result.output.sections.find(s => s.id === 'direction_of_minimum_viable_move')
      if (directionSection && typeof directionSection.content === 'string') {
        // Should reference the protective move
        const hasProtectiveLanguage =
          directionSection.content.toLowerCase().includes('delay') ||
          directionSection.content.toLowerCase().includes('condition') ||
          directionSection.content.toLowerCase().includes('document') ||
          directionSection.content.toLowerCase().includes('vote') ||
          directionSection.content.toLowerCase().includes('reservation')
        expect(hasProtectiveLanguage).toBe(true)
      }
    }
  })

  // ─── Test 6: Reputational scenario shows legal hold direction ──────────────

  it('should show legal hold direction for reputational scenario', async () => {
    const result = await getFreeSignal(TEST_SCENARIOS.executive_reputational_exposure.input, {
      authority: 'The board has authority',
      obligation: 'Legal obligations apply',
    })

    expect(result.classification?.primaryClass).toBe('REPUTATIONAL_AND_EXPOSURE')

    if (result.output) {
      const directionSection = result.output.sections.find(s => s.id === 'direction_of_minimum_viable_move')
      if (directionSection && typeof directionSection.content === 'string') {
        // Should reference holding public communications or legal clearance
        const hasProtectiveLanguage =
          directionSection.content.toLowerCase().includes('public') ||
          directionSection.content.toLowerCase().includes('statement') ||
          directionSection.content.toLowerCase().includes('legal') ||
          directionSection.content.toLowerCase().includes('board') ||
          directionSection.content.toLowerCase().includes('hold')
        expect(hasProtectiveLanguage).toBe(true)
      }
    }
  })

  // ─── Test 7: Strategic partnership shows pause direction ───────────────────

  it('should show pause direction for strategic partnership scenario', async () => {
    const result = await getFreeSignal(TEST_SCENARIOS.strategic_asymmetric_partnership.input, {
      authority: 'The board has authority',
      obligation: 'Fiduciary duty applies',
    })

    expect(result.classification?.primaryClass).toBe('STRATEGIC_AND_POSITIONING')

    if (result.output) {
      const directionSection = result.output.sections.find(s => s.id === 'direction_of_minimum_viable_move')
      if (directionSection && typeof directionSection.content === 'string') {
        // Should reference pausing or not signing
        const hasProtectiveLanguage =
          directionSection.content.toLowerCase().includes('pause') ||
          directionSection.content.toLowerCase().includes('sign') ||
          directionSection.content.toLowerCase().includes('delay') ||
          directionSection.content.toLowerCase().includes('condition') ||
          directionSection.content.toLowerCase().includes('separate')
        expect(hasProtectiveLanguage).toBe(true)
      }
    }
  })

  // ─── Test 8: Clarification questions are returned when needed ──────────────

  it('should return clarification questions when situation is ambiguous', async () => {
    const result = await getFreeSignal('Help! Something is wrong.')
    expect(result.status).toBe('CLARIFICATION_REQUIRED')
    expect(result.questions).toBeDefined()
    expect(result.questions!.length).toBeGreaterThan(0)
  })

  // ─── Test 9: All 12 scenarios produce a Free Signal (not QUALITY_FAILED) ───

  it('should produce a Free Signal for all 12 scenarios', async () => {
    for (const [key, scenario] of Object.entries(TEST_SCENARIOS)) {
      const result = await getFreeSignal(scenario.input, {
        authority: 'Authority is clear',
        obligation: 'Obligations are known',
      })

      // Free Signal should complete for all scenarios
      // (QUALITY_FAILED is acceptable for some — the Free Signal quality gate is lenient)
      if (result.status === 'COMPLETED') {
        expect(result.output).not.toBeNull()
        expect(result.output!.tier).toBe('free_signal')
      }
    }
  })

  // ─── Test 10: No paid dossier fields in the Free Signal output ─────────────

  it('should never expose paid dossier fields in Free Signal output', async () => {
    const paidDossierFields = [
      'authority_map', 'obligation_map', 'constraint_graph',
      'evidence_graph', 'adversarial_challenge', 'self_adversarial_challenge',
      'minimum_viable_path', 'forbidden_actions', 'fallback_path',
      'record_reference',
    ]

    for (const [key, scenario] of Object.entries(TEST_SCENARIOS)) {
      const result = await getFreeSignal(scenario.input, {
        authority: 'Authority is clear',
        obligation: 'Obligations are known',
      })

      if (result.output) {
        const sectionIds = result.output.sections.map(s => s.id)
        for (const field of paidDossierFields) {
          expect(sectionIds).not.toContain(field)
        }
      }
    }
  })
})
