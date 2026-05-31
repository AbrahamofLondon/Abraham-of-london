/**
 * lib/intelligence/living-case-persistence.ts — Persistence Layer
 *
 * Saves and retrieves Living Decision Cases from storage.
 * Uses typed relational index fields + versioned serialized state.
 *
 * This is a thin wrapper that will connect to Prisma once the schema is migrated.
 * For now, it uses an in-memory store for development and testing.
 */

import type { LivingDecisionCase, LivingCaseRecord } from './types'

/**
 * In-memory store for development and testing.
 * Replace with Prisma implementation after schema migration.
 */
const memoryStore = new Map<string, LivingDecisionCase>()

export class LivingCasePersistence {
  /**
   * Save a Living Decision Case.
   */
  async save(livingCase: LivingDecisionCase): Promise<void> {
    memoryStore.set(livingCase.id, { ...livingCase })
  }

  /**
   * Retrieve a Living Decision Case by ID.
   */
  async getById(id: string): Promise<LivingDecisionCase | null> {
    return memoryStore.get(id) || null
  }

  /**
   * Retrieve a Living Decision Case by case reference.
   */
  async getByReference(caseReference: string): Promise<LivingDecisionCase | null> {
    for (const livingCase of memoryStore.values()) {
      if (livingCase.caseReference === caseReference) return livingCase
    }
    return null
  }

  /**
   * List all Living Decision Cases, optionally filtered.
   */
  async list(filter?: {
    primaryClass?: string
    caseStatus?: string
    createdBy?: string
  }): Promise<LivingDecisionCase[]> {
    let results = Array.from(memoryStore.values())

    if (filter?.primaryClass) {
      results = results.filter(c => c.classification?.primaryClass === filter.primaryClass)
    }
    if (filter?.caseStatus) {
      results = results.filter(c => c.caseStatus === filter.caseStatus)
    }
    if (filter?.createdBy) {
      results = results.filter(c => c.source.createdBy === filter.createdBy)
    }

    return results.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    )
  }

  /**
   * Delete a Living Decision Case by ID (admin only).
   */
  async delete(id: string): Promise<boolean> {
    return memoryStore.delete(id)
  }

  /**
   * Get total case count.
   */
  async count(): Promise<number> {
    return memoryStore.size
  }

  /**
   * Convert a LivingDecisionCase to a Prisma-compatible record.
   */
  toRecord(livingCase: LivingDecisionCase): LivingCaseRecord {
    return {
      id: livingCase.id,
      caseReference: livingCase.caseReference,
      contractVersion: livingCase.contractVersion,
      kernelVersion: livingCase.kernelVersion,
      ontologyVersion: livingCase.ontologyVersion,
      sourceAperture: livingCase.source.aperture,
      createdById: livingCase.source.createdBy || null,
      organisationId: livingCase.source.organisationId || null,
      consentState: livingCase.source.consentState,
      primaryClass: livingCase.classification?.primaryClass || 'UNCLASSIFIED',
      alternativeClasses: livingCase.classification?.alternativeClasses || [],
      classificationConfidence: livingCase.classification?.confidence || 'LOW',
      translationState: livingCase.translation ? 'completed' : 'pending',
      caseStatus: livingCase.caseStatus || 'open',
      currentTier: livingCase.disclosure.currentTier,
      regulatedBoundaryHit: livingCase.regulatedBoundary?.hit || false,
      regulatedBoundaryType: livingCase.regulatedBoundary?.type || null,
      requiresHumanReview: livingCase.review?.state !== 'not_required',
      humanReviewTier: livingCase.review?.tier || null,
      humanReviewState: livingCase.review?.state || 'not_required',
      qualityStandardPassed: null,
      qualityStandardFailure: null,
      serializedCase: livingCase,
      createdAt: new Date(livingCase.createdAt || Date.now()),
      updatedAt: new Date(livingCase.updatedAt || Date.now()),
      completedAt: null,
      closedAt: livingCase.caseStatus === 'closed' ? new Date() : null,
    }
  }

  /**
   * Clear the store (for testing only).
   */
  _clear(): void {
    memoryStore.clear()
  }
}
