/**
 * lib/intelligence/kernel-quality-gates.ts — Pre-Output Quality Checks
 *
 * Before any output reaches a buyer, run these quality gates.
 * If any fail, the output must be rejected or downgraded.
 */

import type { LivingDecisionCase, QualityGateResult, DisclosureTier } from './types'

export class KernelQualityGates {
  /**
   * Check a Living Decision Case against all quality gates.
   * Returns passed=true only if all gates pass.
   */
  check(livingCase: LivingDecisionCase): QualityGateResult {
    // LOW_STAKES: proportionate checks only — structural requirements do not apply
    if (livingCase.classification?.primaryClass === 'LOW_STAKES_PREFERENCE') {
      return this.checkLowStakes(livingCase)
    }

    const failures: string[] = []

    // 1. Generic advice detection
    if (this.isGenericAdvice(livingCase)) {
      failures.push('GENERIC_ADVICE: Output contains no specific, non-swappable insight')
    }

    // 2. Unsupported certainty
    if (this.hasUnsupportedCertainty(livingCase)) {
      failures.push('UNSUPPORTED_CERTAINTY: Claims made without evidence basis')
    }

    // 3. No authority state
    if (livingCase.authorityMap.length === 0 && this.requiresAuthorityMap(livingCase)) {
      failures.push('MISSING_AUTHORITY_MAP: Authority structure is required for this decision class')
    }

    // 4. No obligation state
    if (livingCase.obligationMap.length === 0 && this.requiresObligationMap(livingCase)) {
      failures.push('MISSING_OBLIGATION_MAP: Obligation landscape is required for this decision class')
    }

    // 5. No constraint state (required for paid tiers only)
    if (livingCase.constraintGraph.length === 0 && this.isPaidTier(livingCase.disclosure.currentTier)) {
      failures.push('MISSING_CONSTRAINT_GRAPH: Constraint landscape is required for paid tiers')
    }

    // 6. No evidence state (required for paid tiers only)
    if (livingCase.evidenceGraph.length === 0 && this.isPaidTier(livingCase.disclosure.currentTier)) {
      failures.push('MISSING_EVIDENCE_GRAPH: Evidence graph is required for paid tiers')
    }

    // 7. No adversarial challenge (required for paid tiers only)
    if (livingCase.adversarialChallenge.length === 0 && this.isPaidTier(livingCase.disclosure.currentTier)) {
      failures.push('MISSING_ADVERSARIAL_CHALLENGE: Adversarial challenge is required for paid tiers')
    }

    // 8. Paid output without self-adversarial challenge
    if (this.isPaidTier(livingCase.disclosure.currentTier) && !livingCase.selfAdversarialChallenge) {
      failures.push('MISSING_SELF_ADVERSARIAL_CHALLENGE: Self-adversarial challenge is required for paid tiers')
    }

    // 9. High-consequence output without human-review assessment
    if (this.isHighConsequence(livingCase) && livingCase.review.state === 'not_required') {
      failures.push('MISSING_HUMAN_REVIEW_ASSESSMENT: High-consequence output requires human review assessment')
    }

    // 10. Regulated boundary crossed but not handled
    if (livingCase.regulatedBoundary.hit && !livingCase.regulatedBoundary.output) {
      failures.push('REGULATED_BOUNDARY_NOT_HANDLED: Regulated boundary identified but not addressed in output')
    }

    // 11. Impossible advice
    if (this.hasImpossibleAdvice(livingCase)) {
      failures.push('IMPOSSIBLE_ADVICE: Recommended path is impossible given identified constraints')
    }

    // 12. False low-stakes classification — cannot fire here (LOW_STAKES returns early above)
    // This check lives in checkLowStakes() instead

    return {
      passed: failures.length === 0,
      failures,
      checkedAt: new Date().toISOString(),
    }
  }

  /**
   * Proportionate quality check for LOW_STAKES_PREFERENCE cases.
   *
   * Low-stakes cases correctly have no authority map, constraint graph,
   * adversarial challenge, or self-adversarial challenge. Applying
   * high-consequence structural checks to them is overengineering.
   *
   * Required: proportionate output, free tier only, no human review,
   * practical lightweight next move, no false-low-stakes classification.
   */
  private checkLowStakes(livingCase: LivingDecisionCase): QualityGateResult {
    const failures: string[] = []

    // Must not have escalated to a paid tier
    if (this.isPaidTier(livingCase.disclosure.currentTier)) {
      failures.push('LOW_STAKES_PAID_ESCALATION: Low-stakes preference decision should not be on a paid tier')
    }

    // Must not have triggered human review
    if (livingCase.review?.state !== 'not_required') {
      failures.push('LOW_STAKES_HUMAN_REVIEW: Low-stakes preference decision should not require human review')
    }

    // Must have at least a minimal minimum viable path
    if (livingCase.minimumViablePath.length === 0) {
      failures.push('LOW_STAKES_MISSING_PATH: Even a low-stakes case must have a minimum viable path')
    }

    // False low-stakes: hidden stakes detected
    if (livingCase.translation?.hiddenStakesDetected) {
      failures.push('FALSE_LOW_STAKES_CLASSIFICATION: Hidden stakes detected — this may not actually be low-stakes')
    }

    return {
      passed: failures.length === 0,
      failures,
      checkedAt: new Date().toISOString(),
    }
  }

  private isGenericAdvice(livingCase: LivingDecisionCase): boolean {
    // Free signal: only require translation and classification
    if (!this.isPaidTier(livingCase.disclosure.currentTier)) {
      if (!livingCase.translation || !livingCase.classification) return true
      if (!livingCase.situationModel?.coreTension) return true
      return false
    }
    // Paid tiers: require evidence
    if (livingCase.evidenceGraph.length === 0) return true

    // A case is non-generic if ANY condition is met:
    // 1. Authority or obligation maps exist
    // 2. Regulated boundary is hit (system defers to professional advice)
    // 3. Specialized lenses produced sufficient evidence (>= 5 nodes) AND constraints mapped
    //    This covers commercial-proof, launch-readiness, supplier-dependency, investor-diligence,
    //    and operational-ownership lenses which produce rich evidence without authority/obligation maps
    const hasAuthorityOrObligation = livingCase.authorityMap.length > 0 || livingCase.obligationMap.length > 0
    const hasRegulatedBoundary = livingCase.regulatedBoundary?.hit === true
    const hasSufficientLensEvidence = livingCase.evidenceGraph.length >= 5 && livingCase.constraintGraph.length > 0

    if (hasAuthorityOrObligation || hasRegulatedBoundary || hasSufficientLensEvidence) {
      if (livingCase.minimumViablePath.length === 0) return true
      return false
    }
    return true
  }

  private hasUnsupportedCertainty(livingCase: LivingDecisionCase): boolean {
    for (const evidence of livingCase.evidenceGraph) {
      if ((evidence.severity === 'HIGH' || evidence.severity === 'CRITICAL') && evidence.confidence < 0.5) {
        return true
      }
    }
    return false
  }

  private requiresAuthorityMap(livingCase: LivingDecisionCase): boolean {
    const classesRequiringAuthority = [
      'GOVERNANCE_AND_BOARD',
      'STRATEGIC_AND_POSITIONING',
      'PEOPLE_AND_AUTHORITY',
      'CONTINUITY_AND_TRANSITION',
      'LEGAL_AND_CONTRACTUAL',
    ]
    return classesRequiringAuthority.includes(livingCase.classification?.primaryClass || '')
  }

  private requiresObligationMap(livingCase: LivingDecisionCase): boolean {
    const classesRequiringObligation = [
      'COMPLIANCE_AND_FILING',
      'GOVERNANCE_AND_BOARD',
      'LEGAL_AND_CONTRACTUAL',
      'PEOPLE_AND_AUTHORITY',
      'CONTINUITY_AND_TRANSITION',
    ]
    return classesRequiringObligation.includes(livingCase.classification?.primaryClass || '')
  }

  private isPaidTier(tier: string): boolean {
    return ['basic_brief', 'full_dossier', 'urgent_operational', 'executive_board'].includes(tier)
  }

  private isHighConsequence(livingCase: LivingDecisionCase): boolean {
    const highConsequenceClasses = [
      'GOVERNANCE_AND_BOARD',
      'REPUTATIONAL_AND_EXPOSURE',
      'FINANCIAL_AND_CAPITAL',
      'LEGAL_AND_CONTRACTUAL',
      'CONTINUITY_AND_TRANSITION',
    ]
    return highConsequenceClasses.includes(livingCase.classification?.primaryClass || '')
  }

  private hasImpossibleAdvice(livingCase: LivingDecisionCase): boolean {
    for (const move of livingCase.minimumViablePath) {
      for (const constraint of livingCase.constraintGraph) {
        if (constraint.severity === 'CRITICAL' && constraint.blocks?.includes(move.action)) {
          return true
        }
      }
    }
    return false
  }
}
