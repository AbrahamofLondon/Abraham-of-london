/**
 * lib/intelligence/outcome-learning/kernel-version-tracker.ts — Kernel Version Accountability
 *
 * Every case records kernelVersion, ontologyVersion, contractVersion.
 * Future calibration can identify which version produced which quality of judgement.
 */

import type { LivingDecisionCase, CalibrationReport } from '../types'
import { LivingCasePersistence } from '../living-case-persistence'
import { KERNEL_VERSION, ONTOLOGY_VERSION, CONTRACT_VERSION } from '../living-decision-case-contract'

export interface VersionQualityReport {
  kernelVersion: string
  ontologyVersion: string
  contractVersion: string
  totalCases: number
  completedCases: number
  failureRate: number
  averageConfidence: string
  commonFailurePatterns: string[]
}

export class KernelVersionTracker {
  private persistence: LivingCasePersistence

  constructor() {
    this.persistence = new LivingCasePersistence()
  }

  /**
   * Get the current kernel version information.
   */
  getCurrentVersion(): { kernelVersion: string; ontologyVersion: string; contractVersion: string } {
    return {
      kernelVersion: KERNEL_VERSION,
      ontologyVersion: ONTOLOGY_VERSION,
      contractVersion: CONTRACT_VERSION,
    }
  }

  /**
   * Generate a quality report for the current kernel version.
   */
  async getVersionQualityReport(): Promise<VersionQualityReport> {
    const allCases = await this.persistence.list()
    const versionCases = allCases.filter(c => c.kernelVersion === KERNEL_VERSION)
    const completedCases = versionCases.filter(c => c.outcome !== null)
    const failedCases = completedCases.filter(
      c => c.outcome?.outcomeType === 'escalated' || c.outcome?.outcomeType === 'abandoned'
    )

    // Extract common failure patterns
    const failurePatterns = new Map<string, number>()
    for (const f of failedCases) {
      const reason = f.outcome?.outcomeSummary || 'Unknown'
      failurePatterns.set(reason, (failurePatterns.get(reason) || 0) + 1)
    }

    const sortedPatterns = [...failurePatterns.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pattern]) => pattern)

    // Calculate average confidence
    const confidences = versionCases.map(c => c.classification?.confidence || 'LOW')
    const highCount = confidences.filter(c => c === 'HIGH').length
    const medCount = confidences.filter(c => c === 'MEDIUM').length
    const lowCount = confidences.filter(c => c === 'LOW').length
    const total = confidences.length
    const avgConfidence = total > 0
      ? (highCount * 3 + medCount * 2 + lowCount * 1) / total
      : 0

    return {
      kernelVersion: KERNEL_VERSION,
      ontologyVersion: ONTOLOGY_VERSION,
      contractVersion: CONTRACT_VERSION,
      totalCases: versionCases.length,
      completedCases: completedCases.length,
      failureRate: completedCases.length > 0 ? failedCases.length / completedCases.length : 0,
      averageConfidence: avgConfidence > 2.5 ? 'HIGH' : avgConfidence > 1.5 ? 'MEDIUM' : 'LOW',
      commonFailurePatterns: sortedPatterns,
    }
  }

  /**
   * Compare quality across kernel versions.
   */
  async compareVersions(): Promise<Array<{ version: string; totalCases: number; failureRate: number }>> {
    const allCases = await this.persistence.list()
    const versionMap = new Map<string, { total: number; failed: number }>()

    for (const c of allCases) {
      const entry = versionMap.get(c.kernelVersion) || { total: 0, failed: 0 }
      entry.total++
      if (c.outcome?.outcomeType === 'escalated' || c.outcome?.outcomeType === 'abandoned') {
        entry.failed++
      }
      versionMap.set(c.kernelVersion, entry)
    }

    return [...versionMap.entries()].map(([version, data]) => ({
      version,
      totalCases: data.total,
      failureRate: data.total > 0 ? data.failed / data.total : 0,
    }))
  }
}
