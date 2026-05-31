/**
 * lib/intelligence/outcome-learning/failure-pattern-calibrator.ts — Failure Pattern Calibration
 *
 * At 500+ cases, calibrate decision-class failure patterns.
 * This is Mechanism 3 of the outcome learning loop.
 */

import type { LivingDecisionCase, DecisionClass, CalibrationReport, FailurePattern } from '../types'
import { LivingCasePersistence } from '../living-case-persistence'

export class FailurePatternCalibrator {
  private persistence: LivingCasePersistence

  constructor() {
    this.persistence = new LivingCasePersistence()
  }

  /**
   * Calibrate failure patterns for a given decision class.
   */
  async calibrate(decisionClass: DecisionClass): Promise<CalibrationReport> {
    const caseCount = await this.persistence.count()
    if (caseCount < 500) {
      return { calibrated: false, reason: 'Insufficient case volume for calibration (need 500+)', patterns: [] }
    }

    const allCases = await this.persistence.list()
    const classCases = allCases.filter(c => c.classification?.primaryClass === decisionClass)
    const outcomes = classCases.filter(c => c.outcome !== null)
    const failures = outcomes.filter(
      c => c.outcome?.outcomeType === 'escalated' || c.outcome?.outcomeType === 'abandoned'
    )

    const failureReasons = this.extractFailureReasons(failures)
    const patterns: FailurePattern[] = []

    for (const [reason, count] of Object.entries(failureReasons)) {
      const frequency = count / Math.max(failures.length, 1)
      patterns.push({
        pattern: reason,
        frequency,
        instanceCount: count,
        recommendation: this.generateRecommendation(reason, frequency),
      })
    }

    return {
      calibrated: true,
      decisionClass,
      totalCases: classCases.length,
      failureRate: failures.length / Math.max(outcomes.length, 1),
      patterns: patterns.sort((a, b) => b.frequency - a.frequency),
    }
  }

  /**
   * Extract failure reasons from failed cases.
   */
  private extractFailureReasons(failures: LivingDecisionCase[]): Record<string, number> {
    const reasons: Record<string, number> = {}
    for (const f of failures) {
      const reason = f.outcome?.outcomeSummary || 'Unknown failure reason'
      reasons[reason] = (reasons[reason] || 0) + 1
    }
    return reasons
  }

  /**
   * Generate a recommendation based on pattern frequency.
   */
  private generateRecommendation(pattern: string, frequency: number): string {
    if (frequency > 0.3) {
      return `CRITICAL: Pattern "${pattern}" appears in ${Math.round(frequency * 100)}% of failures. Consider updating kernel lens for this decision class.`
    }
    if (frequency > 0.1) {
      return `NOTABLE: Pattern "${pattern}" appears in ${Math.round(frequency * 100)}% of failures. Monitor in next calibration cycle.`
    }
    return `INFORMATIONAL: Pattern "${pattern}" appears in ${Math.round(frequency * 100)}% of failures.`
  }
}
