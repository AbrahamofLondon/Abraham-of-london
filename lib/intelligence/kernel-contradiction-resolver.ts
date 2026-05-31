/**
 * lib/intelligence/kernel-contradiction-resolver.ts — Contradiction Resolution
 *
 * A category-defining system must detect when its own lenses disagree.
 * High-consequence contradiction forces downgrade, clarification, or human review.
 */

import type { KernelContradiction } from './types'

export class KernelContradictionResolver {
  /**
   * Resolve contradictions between lens outputs.
   *
   * Rules:
   * - HIGH/CRITICAL contradiction forces downgrade, clarification, or human review.
   * - Contradictions between mandatory lenses are more significant than optional.
   * - Evidence-based findings override inferred findings.
   */
  resolve(contradictions: KernelContradiction[]): KernelContradiction[] {
    return contradictions.map(c => ({
      ...c,
      resolutionRule: this.applyRule(c),
      outputEffect: this.determineEffect(c),
    }))
  }

  private applyRule(c: KernelContradiction): string {
    if (this.isEvidenceVsInference(c)) return 'EVIDENCE_OVERRIDES_INFERENCE'
    if (this.isConstraintVsPreference(c)) return 'CONSTRAINT_OVERRIDES_PREFERENCE'
    if (this.isAuthorityVsOpinion(c)) return 'AUTHORITY_OVERRIDES_OPINION'
    if (c.severity === 'CRITICAL' || c.severity === 'HIGH') return 'ADVERSARIAL_CHALLENGE_PRESERVED'
    return 'NOTED_WITHOUT_ACTION'
  }

  private determineEffect(c: KernelContradiction): string {
    if (c.severity === 'CRITICAL') return 'Output blocked until contradiction is resolved by human review.'
    if (c.severity === 'HIGH') return 'Output confidence downgraded. Human review recommended.'
    if (c.severity === 'MEDIUM') return 'Output includes caveat. No blocking action.'
    return 'Recorded for learning trace. No output effect.'
  }

  private isEvidenceVsInference(c: KernelContradiction): boolean {
    return (
      c.between.some(b => b.includes('evidence')) &&
      c.between.some(b => b.includes('inference') || b.includes('market') || b.includes('claim'))
    )
  }

  private isConstraintVsPreference(c: KernelContradiction): boolean {
    return (
      c.between.some(b => b.includes('constraint')) &&
      c.between.some(b => b.includes('preference') || b.includes('desire') || b.includes('want'))
    )
  }

  private isAuthorityVsOpinion(c: KernelContradiction): boolean {
    return (
      c.between.some(b => b.includes('authority')) &&
      c.between.some(b => b.includes('opinion') || b.includes('stakeholder') || b.includes('preference'))
    )
  }
}
