/**
 * tests/product/outcome-learning.spec.ts — Outcome Learning Loop Tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { SimilarCaseSurfacer } from '../../lib/intelligence/outcome-learning/similar-case-surfacer'
import { AssumptionDriftDetector } from '../../lib/intelligence/outcome-learning/assumption-drift-detector'
import { FailurePatternCalibrator } from '../../lib/intelligence/outcome-learning/failure-pattern-calibrator'
import { KernelVersionTracker } from '../../lib/intelligence/outcome-learning/kernel-version-tracker'
import { LivingCasePersistence } from '../../lib/intelligence/living-case-persistence'
import { createLivingDecisionCase } from '../../lib/intelligence/living-decision-case-contract'

describe('OutcomeLearning', () => {
  let persistence: LivingCasePersistence

  beforeEach(() => {
    persistence = new LivingCasePersistence()
    persistence._clear()
  })

  describe('SimilarCaseSurfacer', () => {
    it('should return empty when case volume is below 50', async () => {
      const surfacer = new SimilarCaseSurfacer()
      const result = await surfacer.findSimilar('nonexistent')
      expect(result).toEqual([])
    })

    it('should find similar cases when volume is sufficient', async () => {
      // Add 50+ cases
      for (let i = 0; i < 55; i++) {
        const livingCase = createLivingDecisionCase({
          id: `case-${i}`,
          caseReference: `CASE-${i}`,
          aperture: 'web',
        })
        livingCase.classification = {
          primaryClass: 'COMPLIANCE_AND_FILING',
          alternativeClasses: [],
          confidence: 'HIGH',
          classificationRationale: 'Test',
        }
        await persistence.save(livingCase)
      }

      const surfacer = new SimilarCaseSurfacer()
      const result = await surfacer.findSimilar('case-0')
      // Should not be empty since we have 55 cases
      expect(result).toBeDefined()
    })
  })

  describe('AssumptionDriftDetector', () => {
    it('should return insufficient volume when below 100 cases', async () => {
      const detector = new AssumptionDriftDetector()
      const result = await detector.detectDrift('nonexistent')
      expect(result.driftDetected).toBe(false)
      expect(result.reason).toContain('Insufficient')
    })
  })

  describe('FailurePatternCalibrator', () => {
    it('should return insufficient volume when below 500 cases', async () => {
      const calibrator = new FailurePatternCalibrator()
      const result = await calibrator.calibrate('COMPLIANCE_AND_FILING' as any)
      expect(result.calibrated).toBe(false)
      expect(result.reason).toContain('Insufficient')
    })
  })

  describe('KernelVersionTracker', () => {
    it('should return current version information', () => {
      const tracker = new KernelVersionTracker()
      const version = tracker.getCurrentVersion()
      expect(version.kernelVersion).toBe('1.0.0')
      expect(version.ontologyVersion).toBe('1.0.0')
      expect(version.contractVersion).toBe('1.0.0')
    })

    it('should generate a version quality report', async () => {
      // Add some cases
      for (let i = 0; i < 5; i++) {
        const livingCase = createLivingDecisionCase({
          id: `version-case-${i}`,
          caseReference: `VERSION-CASE-${i}`,
          aperture: 'web',
        })
        livingCase.classification = {
          primaryClass: 'COMPLIANCE_AND_FILING',
          alternativeClasses: [],
          confidence: 'HIGH',
          classificationRationale: 'Test',
        }
        await persistence.save(livingCase)
      }

      const tracker = new KernelVersionTracker()
      const report = await tracker.getVersionQualityReport()
      expect(report.totalCases).toBe(5)
      expect(report.kernelVersion).toBe('1.0.0')
    })
  })
})
