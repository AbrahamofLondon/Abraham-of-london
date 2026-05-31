/**
 * lib/intelligence/outcome-learning/assumption-drift-detector.ts — Assumption Drift Detection
 *
 * At 100+ cases, detect when assumptions that failed before appear again.
 * This is Mechanism 2 of the outcome learning loop.
 */

import type { LivingDecisionCase, DriftReport, DriftPattern, FailedAssumption, ActiveAssumption } from '../types'
import { LivingCasePersistence } from '../living-case-persistence'

export class AssumptionDriftDetector {
  private persistence: LivingCasePersistence

  constructor() {
    this.persistence = new LivingCasePersistence()
  }

  /**
   * Detect assumption drift for a given case.
   */
  async detectDrift(caseId: string): Promise<DriftReport> {
    const caseCount = await this.persistence.count()
    if (caseCount < 100) {
      return { driftDetected: false, reason: 'Insufficient case volume for drift detection (need 100+)', patterns: [] }
    }

    const currentCase = await this.persistence.getById(caseId)
    if (!currentCase) {
      return { driftDetected: false, reason: 'Case not found', patterns: [] }
    }

    const allCases = await this.persistence.list()
    const completedCases = allCases.filter(c => c.outcome !== null && c.id !== caseId)
    const failedCases = completedCases.filter(
      c => c.outcome?.outcomeType === 'escalated' || c.outcome?.outcomeType === 'abandoned'
    )

    const failedAssumptions = this.identifyFailedAssumptions(failedCases)
    const activeAssumptions = this.extractActiveAssumptions(currentCase)

    const drifts: DriftPattern[] = []
    for (const assumption of activeAssumptions) {
      const matchingFailure = failedAssumptions.find(f => f.assumption === assumption.assumption)
      if (matchingFailure) {
        drifts.push({
          assumption: assumption.assumption,
          priorFailureRate: matchingFailure.failureRate,
          currentCaseCount: matchingFailure.instanceCount,
          alert: matchingFailure.failureRate > 0.3,
        })
      }
    }

    return {
      driftDetected: drifts.length > 0,
      reason: drifts.length > 0
        ? `${drifts.length} assumptions have failed in similar prior cases`
        : 'No drift detected',
      patterns: drifts,
    }
  }

  /**
   * Identify assumptions that failed in prior cases.
   */
  private identifyFailedAssumptions(failedCases: LivingDecisionCase[]): FailedAssumption[] {
    const assumptionMap = new Map<string, { count: number; total: number }>()

    for (const failedCase of failedCases) {
      const assumptions = this.extractActiveAssumptions(failedCase)
      for (const a of assumptions) {
        const current = assumptionMap.get(a.assumption) || { count: 0, total: 0 }
        current.count++
        current.total++
        assumptionMap.set(a.assumption, current)
      }
    }

    const result: FailedAssumption[] = []
    for (const [assumption, data] of assumptionMap.entries()) {
      result.push({
        assumption,
        failureRate: data.count / Math.max(data.total, 1),
        instanceCount: data.total,
      })
    }

    return result.sort((a, b) => b.failureRate - a.failureRate)
  }

  /**
   * Extract active assumptions from a case's self-adversarial challenge.
   */
  private extractActiveAssumptions(livingCase: LivingDecisionCase): ActiveAssumption[] {
    if (!livingCase.selfAdversarialChallenge) return []
    return livingCase.selfAdversarialChallenge.loadBearingAssumptions.map(a => ({
      assumption: a.assumption,
      evidenceBasis: a.evidenceBasis,
    }))
  }
}
