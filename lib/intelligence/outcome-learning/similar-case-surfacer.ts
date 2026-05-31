/**
 * lib/intelligence/outcome-learning/similar-case-surfacer.ts — Similar Case Detection
 *
 * At 50+ cases, surface similar prior cases internally.
 * At 100+ cases, detect when assumptions that failed before appear again.
 * At 500+ cases, calibrate decision-class failure patterns.
 */

import type { LivingDecisionCase, SimilarCase, DecisionClass } from '../types'
import { LivingCasePersistence } from '../living-case-persistence'

export class SimilarCaseSurfacer {
  private persistence: LivingCasePersistence

  constructor() {
    this.persistence = new LivingCasePersistence()
  }

  /**
   * Find similar cases to a given case.
   * Only active when case volume exceeds 50.
   */
  async findSimilar(caseId: string, limit: number = 5): Promise<SimilarCase[]> {
    const caseCount = await this.persistence.count()
    if (caseCount < 50) return []

    const currentCase = await this.persistence.getById(caseId)
    if (!currentCase) return []

    const allCases = await this.persistence.list()
    const similar: SimilarCase[] = []

    for (const otherCase of allCases) {
      if (otherCase.id === caseId) continue
      const score = this.calculateSimilarity(currentCase, otherCase)
      if (score > 0.3) {
        similar.push({
          caseId: otherCase.id,
          caseReference: otherCase.caseReference,
          primaryClass: otherCase.classification?.primaryClass || 'STRATEGIC_AND_POSITIONING',
          similarityScore: score,
          outcome: otherCase.outcome,
        })
      }
    }

    return similar.sort((a, b) => b.similarityScore - a.similarityScore).slice(0, limit)
  }

  /**
   * Calculate similarity between two cases based on shared attributes.
   */
  private calculateSimilarity(a: LivingDecisionCase, b: LivingDecisionCase): number {
    let score = 0
    let factors = 0

    // Same decision class
    if (a.classification?.primaryClass === b.classification?.primaryClass) {
      score += 0.4
    }
    factors += 0.4

    // Same vocabulary state
    if (a.translation?.vocabularyState === b.translation?.vocabularyState) {
      score += 0.15
    }
    factors += 0.15

    // Shared authority patterns
    const aAuthorities = a.authorityMap.map(au => au.holder).join(',')
    const bAuthorities = b.authorityMap.map(au => au.holder).join(',')
    if (aAuthorities && bAuthorities && aAuthorities === bAuthorities) {
      score += 0.15
    }
    factors += 0.15

    // Shared constraint types
    const aConstraints = a.constraintGraph.map(c => c.type).join(',')
    const bConstraints = b.constraintGraph.map(c => c.type).join(',')
    if (aConstraints && bConstraints && aConstraints === bConstraints) {
      score += 0.15
    }
    factors += 0.15

    // Both have regulated boundaries
    if (a.regulatedBoundary?.hit && b.regulatedBoundary?.hit) {
      score += 0.15
    }
    factors += 0.15

    return factors > 0 ? score / factors : 0
  }
}
