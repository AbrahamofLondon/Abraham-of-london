/**
 * lib/intelligence/human-review-protocol.ts — Human Review Protocol
 *
 * Human review is not a patch. It is a tiered product control.
 * Review tiers: STANDARD, URGENT, EXECUTIVE, FOUNDER
 *
 * Review law:
 * - Reviewer amendments are append-only events.
 * - No silent override.
 * - No hidden correction.
 * - No untracked founder judgement.
 */

import type { LivingDecisionCase, HumanReviewState, HumanReviewTrigger, HumanReviewTier } from './types'

export class HumanReviewProtocol {
  /**
   * Determine human review requirements for a Living Decision Case.
   */
  determine(livingCase: LivingDecisionCase): HumanReviewState {
    const triggers = this.checkMandatoryTriggers(livingCase)

    if (triggers.length === 0) {
      return { state: 'not_required', tier: null, triggers: [] }
    }

    const highestTier = this.determineHighestTier(triggers)

    return {
      state: 'pending',
      tier: highestTier,
      triggers,
    }
  }

  /**
   * Check all mandatory human review triggers.
   */
  private checkMandatoryTriggers(livingCase: LivingDecisionCase): HumanReviewTrigger[] {
    const triggers: HumanReviewTrigger[] = []
    const primaryClass = livingCase.classification?.primaryClass

    if (primaryClass === 'GOVERNANCE_AND_BOARD') {
      triggers.push({ type: 'board_fiduciary_exposure', severity: 'HIGH' })
    }

    if (livingCase.regulatedBoundary?.hit) {
      triggers.push({ type: 'regulated_boundary', severity: 'HIGH' })
    }

    const penaltyEvidence = livingCase.evidenceGraph.filter(
      e => e.label.toLowerCase().includes('penalty') || e.label.toLowerCase().includes('fine')
    )
    if (penaltyEvidence.length > 0) {
      triggers.push({ type: 'penalty_exposure', severity: 'HIGH' })
    }

    if (primaryClass === 'REPUTATIONAL_AND_EXPOSURE') {
      triggers.push({ type: 'active_reputational_crisis', severity: 'URGENT' })
    }

    if (primaryClass === 'LEGAL_AND_CONTRACTUAL') {
      triggers.push({ type: 'legal_dispute', severity: 'HIGH' })
    }

    if (primaryClass === 'FINANCIAL_AND_CAPITAL') {
      triggers.push({ type: 'investment_financial_promotion_risk', severity: 'HIGH' })
    }

    if (primaryClass === 'CONTINUITY_AND_TRANSITION') {
      triggers.push({ type: 'continuity_and_transition', severity: 'EXECUTIVE' })
    }

    if (livingCase.translation?.translationConfidence === 'LOW') {
      triggers.push({ type: 'low_confidence_on_primitives', severity: 'STANDARD' })
    }

    const hasCriticalContradiction = livingCase.adversarialChallenge.some(
      c => c.severity === 'HIGH' || c.severity === 'CRITICAL'
    )
    if (hasCriticalContradiction) {
      triggers.push({ type: 'kernel_contradiction_high_or_critical', severity: 'STANDARD' })
    }

    return triggers
  }

  /**
   * Determine the highest review tier from triggers.
   */
  private determineHighestTier(triggers: HumanReviewTrigger[]): HumanReviewTier {
    const tierOrder: HumanReviewTier[] = ['FOUNDER', 'EXECUTIVE', 'URGENT', 'STANDARD']
    for (const tier of tierOrder) {
      if (triggers.some(t => t.severity === tier)) return tier
    }
    return 'STANDARD'
  }
}
