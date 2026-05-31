/**
 * lib/commercial/checkout-entitlement.ts — Checkout Entitlement Wiring
 *
 * Wires payment to Living Decision Case entitlement.
 * Checkout session includes caseId, caseReference, tier, decisionClass.
 * Payment creates entitlement and admin fulfilment item.
 * No auto-delivery. No public exposure. No bypass of human review.
 */

import type { DisclosureTier, SourceAperture, DecisionClass } from '../intelligence/types'
import { COMMERCIAL_LADDER, type LadderTier } from './ladder'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CheckoutSessionRequest {
  caseId: string
  caseReference: string
  tier: LadderTier
  sourceAperture: SourceAperture
  decisionClass: DecisionClass
  requiresHumanReview: boolean
  regulatedBoundaryHit: boolean
  successPath: string
  cancelPath: string
}

export interface CheckoutSessionResponse {
  sessionId: string
  sessionUrl: string
  caseId: string
  caseReference: string
  tier: LadderTier
  amount: number
}

export interface EntitlementRecord {
  id: string
  caseId: string
  caseReference: string
  tier: LadderTier
  grantedAt: string
  grantType: 'purchase' | 'admin_grant' | 'earned' | 'retainer'
  stripeSessionId: string
  stripePriceId: string | null
  amount: number
  currency: string
  active: boolean
  requiresHumanReview: boolean
  regulatedBoundaryHit: boolean
  fulfilmentStatus: 'pending' | 'in_review' | 'approved' | 'delivered' | 'cancelled'
}

export interface FulfilmentQueueItem {
  id: string
  caseId: string
  caseReference: string
  tier: LadderTier
  decisionClass: DecisionClass
  status: 'paid_pending_review' | 'in_review' | 'approved' | 'delivered' | 'cancelled'
  requiresHumanReview: boolean
  regulatedBoundaryHit: boolean
  paidAt: string
  completedAt: string | null
  notes: string[]
}

// ─── In-memory stores (replace with Prisma after migration) ──────────────────

const entitlementStore = new Map<string, EntitlementRecord>()
const fulfilmentQueue: FulfilmentQueueItem[] = []

// ─── Checkout Session Creation ───────────────────────────────────────────────

/**
 * Build Stripe metadata for a Living Decision Case checkout.
 * No raw scenario text. No sensitive data.
 */
export function buildStripeMetadata(request: CheckoutSessionRequest): Record<string, string> {
  return {
    caseId: request.caseId,
    caseReference: request.caseReference,
    tier: request.tier,
    sourceAperture: request.sourceAperture,
    decisionClass: request.decisionClass,
    requiresHumanReview: String(request.requiresHumanReview),
    regulatedBoundaryHit: String(request.regulatedBoundaryHit),
  }
}

/**
 * Validate that a checkout request is permissible.
 */
export function validateCheckoutRequest(request: CheckoutSessionRequest): {
  valid: boolean
  reason?: string
} {
  const product = COMMERCIAL_LADDER[request.tier]
  if (!product) {
    return { valid: false, reason: `Unknown tier: ${request.tier}` }
  }

  // Low-stakes cases cannot purchase full dossier
  if (request.decisionClass === 'LOW_STAKES_PREFERENCE' && request.tier !== 'free_signal') {
    return { valid: false, reason: 'Low-stakes preference decisions do not require a paid dossier' }
  }

  // Free signal cannot be purchased
  if (request.tier === 'free_signal') {
    return { valid: false, reason: 'Free signal does not require payment' }
  }

  // Must have a Stripe price ID
  if (!product.stripePriceId && product.accessType !== 'free') {
    return { valid: false, reason: `No Stripe price configured for tier: ${request.tier}` }
  }

  return { valid: true }
}

/**
 * Create an entitlement record after successful payment.
 */
export function createEntitlement(params: {
  caseId: string
  caseReference: string
  tier: LadderTier
  stripeSessionId: string
  stripePriceId: string | null
  amount: number
  requiresHumanReview: boolean
  regulatedBoundaryHit: boolean
}): EntitlementRecord {
  const record: EntitlementRecord = {
    id: `ent-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    caseId: params.caseId,
    caseReference: params.caseReference,
    tier: params.tier,
    grantedAt: new Date().toISOString(),
    grantType: 'purchase',
    stripeSessionId: params.stripeSessionId,
    stripePriceId: params.stripePriceId,
    amount: params.amount,
    currency: 'gbp',
    active: true,
    requiresHumanReview: params.requiresHumanReview,
    regulatedBoundaryHit: params.regulatedBoundaryHit,
    fulfilmentStatus: 'pending',
  }

  entitlementStore.set(record.id, record)
  return record
}

/**
 * Create a fulfilment queue item after entitlement is granted.
 */
export function createFulfilmentItem(
  entitlement: EntitlementRecord,
  decisionClass: DecisionClass,
): FulfilmentQueueItem {
  const item: FulfilmentQueueItem = {
    id: `fulfil-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    caseId: entitlement.caseId,
    caseReference: entitlement.caseReference,
    tier: entitlement.tier,
    decisionClass,
    status: entitlement.requiresHumanReview ? 'paid_pending_review' : 'in_review',
    requiresHumanReview: entitlement.requiresHumanReview,
    regulatedBoundaryHit: entitlement.regulatedBoundaryHit,
    paidAt: entitlement.grantedAt,
    completedAt: null,
    notes: [],
  }

  fulfilmentQueue.push(item)
  return item
}

/**
 * Get all fulfilment queue items.
 */
export function getFulfilmentQueue(): FulfilmentQueueItem[] {
  return [...fulfilmentQueue]
}

/**
 * Get entitlement by case ID.
 */
export function getEntitlementByCaseId(caseId: string): EntitlementRecord | null {
  for (const record of entitlementStore.values()) {
    if (record.caseId === caseId) return record
  }
  return null
}

/**
 * Get entitlement by Stripe session ID.
 */
export function getEntitlementBySessionId(sessionId: string): EntitlementRecord | null {
  for (const record of entitlementStore.values()) {
    if (record.stripeSessionId === sessionId) return record
  }
  return null
}

/**
 * Check if a case already has an active entitlement for a given tier.
 */
export function hasActiveEntitlement(caseId: string, tier: LadderTier): boolean {
  for (const record of entitlementStore.values()) {
    if (record.caseId === caseId && record.tier === tier && record.active) return true
  }
  return false
}

/**
 * Cancel an entitlement (for failed/disputed payments).
 */
export function cancelEntitlement(sessionId: string): boolean {
  const record = getEntitlementBySessionId(sessionId)
  if (!record) return false
  record.active = false
  record.fulfilmentStatus = 'cancelled'
  return true
}

/**
 * Clear all stores (for testing).
 */
export function _clearStores(): void {
  entitlementStore.clear()
  fulfilmentQueue.length = 0
}
