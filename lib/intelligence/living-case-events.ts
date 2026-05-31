/**
 * lib/intelligence/living-case-events.ts — Append-only event ledger
 *
 * Every state change in a Living Decision Case is recorded as an event.
 * No silent overwrite. No untracked amendment.
 */

import type { LivingCaseEventType, LivingCaseEventDraft } from './types'

export const ALL_EVENT_TYPES: LivingCaseEventType[] = [
  'CASE_CREATED',
  'TRANSLATION_COMPLETED',
  'CLARIFICATION_REQUESTED',
  'CLARIFICATION_RECEIVED',
  'CASE_CLASSIFIED',
  'LENS_APPLIED',
  'SELF_ADVERSARIAL_COMPLETED',
  'ADVERSARIAL_CHALLENGE_ADDED',
  'REGULATED_BOUNDARY_HIT',
  'PROFESSIONAL_BRIEF_GENERATED',
  'TIER_DISCLOSED',
  'PAYMENT_RECEIVED',
  'ENTITLEMENT_GRANTED',
  'HUMAN_REVIEW_TRIGGERED',
  'HUMAN_REVIEW_AMENDMENT',
  'HUMAN_REVIEW_COMPLETED',
  'QUALITY_STANDARD_FAILED',
  'QUALITY_STANDARD_PASSED',
  'DOSSIER_GENERATED',
  'STRATEGY_ROOM_SESSION_STARTED',
  'STRATEGY_ROOM_UPDATE',
  'STRATEGY_ROOM_SESSION_COMPLETED',
  'VERIFICATION_REFERENCE_ISSUED',
  'OUTCOME_RECORDED',
  'DRIFT_DETECTED',
  'CALIBRATION_UPDATED',
  'CASE_CLOSED',
]

export const EVENT_VERSIONS: Record<LivingCaseEventType, string> = {
  CASE_CREATED: '1.0.0',
  TRANSLATION_COMPLETED: '1.0.0',
  CLARIFICATION_REQUESTED: '1.0.0',
  CLARIFICATION_RECEIVED: '1.0.0',
  CASE_CLASSIFIED: '1.0.0',
  LENS_APPLIED: '1.0.0',
  SELF_ADVERSARIAL_COMPLETED: '1.0.0',
  ADVERSARIAL_CHALLENGE_ADDED: '1.0.0',
  REGULATED_BOUNDARY_HIT: '1.0.0',
  PROFESSIONAL_BRIEF_GENERATED: '1.0.0',
  TIER_DISCLOSED: '1.0.0',
  PAYMENT_RECEIVED: '1.0.0',
  ENTITLEMENT_GRANTED: '1.0.0',
  HUMAN_REVIEW_TRIGGERED: '1.0.0',
  HUMAN_REVIEW_AMENDMENT: '1.0.0',
  HUMAN_REVIEW_COMPLETED: '1.0.0',
  QUALITY_STANDARD_FAILED: '1.0.0',
  QUALITY_STANDARD_PASSED: '1.0.0',
  DOSSIER_GENERATED: '1.0.0',
  STRATEGY_ROOM_SESSION_STARTED: '1.0.0',
  STRATEGY_ROOM_UPDATE: '1.0.0',
  STRATEGY_ROOM_SESSION_COMPLETED: '1.0.0',
  VERIFICATION_REFERENCE_ISSUED: '1.0.0',
  OUTCOME_RECORDED: '1.0.0',
  DRIFT_DETECTED: '1.0.0',
  CALIBRATION_UPDATED: '1.0.0',
  CASE_CLOSED: '1.0.0',
}

export class LivingCaseEventLedger {
  private events: LivingCaseEventDraft[] = []

  /**
   * Record an event. Events are append-only — no deletion, no modification.
   */
  record(
    caseId: string,
    eventType: LivingCaseEventType,
    payload?: Record<string, unknown>,
    metadata?: Record<string, unknown>,
    actorId?: string,
    actorType?: 'system' | 'buyer' | 'admin' | 'reviewer',
  ): LivingCaseEventDraft {
    const event: LivingCaseEventDraft = {
      eventType,
      payload,
      metadata: {
        ...metadata,
        caseId,
        timestamp: new Date().toISOString(),
      },
      actorId,
      actorType: actorType || 'system',
    }

    this.events.push(event)
    return event
  }

  /**
   * Get all recorded events.
   */
  getEvents(): LivingCaseEventDraft[] {
    return [...this.events]
  }

  /**
   * Get events filtered by type.
   */
  getEventsByType(eventType: LivingCaseEventType): LivingCaseEventDraft[] {
    return this.events.filter(e => e.eventType === eventType)
  }

  /**
   * Get the most recent event of a given type.
   */
  getLatestEventByType(eventType: LivingCaseEventType): LivingCaseEventDraft | null {
    const filtered = this.getEventsByType(eventType)
    return filtered[filtered.length - 1] || null
  }

  /**
   * Check if a specific event type has been recorded.
   */
  hasEvent(eventType: LivingCaseEventType): boolean {
    return this.events.some(e => e.eventType === eventType)
  }

  /**
   * Get event count.
   */
  get count(): number {
    return this.events.length
  }

  /**
   * Clear all events (for testing only).
   */
  _clear(): void {
    this.events = []
  }
}

/**
 * Validate that an event type is a known, allowed type.
 */
export function isValidEventType(type: string): type is LivingCaseEventType {
  return ALL_EVENT_TYPES.includes(type as LivingCaseEventType)
}

/**
 * Get the version for a given event type.
 */
export function getEventVersion(eventType: LivingCaseEventType): string {
  return EVENT_VERSIONS[eventType] || '0.0.0'
}