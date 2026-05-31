/**
 * tests/product/checkout-entitlement.spec.ts — Checkout Entitlement Tests
 *
 * Tests the checkout entitlement flow:
 * 1. Successful checkout creates entitlement
 * 2. Failed checkout creates no entitlement
 * 3. Duplicate confirmation is idempotent
 * 4. Low-stakes case cannot buy dossier
 * 5. Regulated-boundary case requires review
 * 6. Admin fulfilment item is created after payment
 * 7. No raw sensitive text in Stripe metadata
 * 8. No auto-delivery after payment
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  validateCheckoutRequest,
  buildStripeMetadata,
  createEntitlement,
  createFulfilmentItem,
  getEntitlementBySessionId,
  getEntitlementByCaseId,
  hasActiveEntitlement,
  cancelEntitlement,
  getFulfilmentQueue,
  _clearStores,
} from '../../lib/commercial/checkout-entitlement'
import type { LadderTier } from '../../lib/commercial/ladder'

describe('Checkout Entitlement', () => {
  beforeEach(() => {
    _clearStores()
  })

  // ─── Test 1: Successful checkout creates entitlement ───────────────────────

  it('should create entitlement after successful payment', () => {
    const entitlement = createEntitlement({
      caseId: 'test-case-001',
      caseReference: 'TEST-CASE-001',
      tier: 'full_dossier',
      stripeSessionId: 'cs_test_123',
      stripePriceId: 'price_123',
      amount: 29500,
      requiresHumanReview: false,
      regulatedBoundaryHit: false,
    })

    expect(entitlement).toBeDefined()
    expect(entitlement.caseId).toBe('test-case-001')
    expect(entitlement.tier).toBe('full_dossier')
    expect(entitlement.active).toBe(true)
    expect(entitlement.grantType).toBe('purchase')
    expect(entitlement.stripeSessionId).toBe('cs_test_123')
    expect(entitlement.amount).toBe(29500)
  })

  // ─── Test 2: Failed checkout creates no entitlement ────────────────────────

  it('should not create entitlement for failed payment', () => {
    // Simulate failed payment — cancel should work even without prior entitlement
    const result = cancelEntitlement('cs_test_failed')
    // No entitlement existed, so cancel returns false
    expect(result).toBe(false)

    // Verify no entitlement exists
    const entitlement = getEntitlementBySessionId('cs_test_failed')
    expect(entitlement).toBeNull()
  })

  // ─── Test 3: Duplicate confirmation is idempotent ──────────────────────────

  it('should not duplicate entitlement on duplicate confirmation', () => {
    // Create first entitlement
    const first = createEntitlement({
      caseId: 'test-case-003',
      caseReference: 'TEST-CASE-003',
      tier: 'full_dossier',
      stripeSessionId: 'cs_test_dup',
      stripePriceId: 'price_123',
      amount: 29500,
      requiresHumanReview: false,
      regulatedBoundaryHit: false,
    })

    // Simulate duplicate confirmation — should find existing
    const duplicate = getEntitlementBySessionId('cs_test_dup')
    expect(duplicate).toBeDefined()
    expect(duplicate!.id).toBe(first.id)
    expect(duplicate!.caseId).toBe('test-case-003')
  })

  // ─── Test 4: Low-stakes case cannot buy dossier ────────────────────────────

  it('should reject checkout for low-stakes case', () => {
    const validation = validateCheckoutRequest({
      caseId: 'test-low-stakes',
      caseReference: 'TEST-LOW',
      tier: 'full_dossier',
      sourceAperture: 'web',
      decisionClass: 'LOW_STAKES_PREFERENCE',
      requiresHumanReview: false,
      regulatedBoundaryHit: false,
      successPath: '/success',
      cancelPath: '/cancel',
    })

    expect(validation.valid).toBe(false)
    expect(validation.reason).toContain('Low-stakes')
  })

  // ─── Test 5: Regulated-boundary case requires review ───────────────────────

  it('should flag regulated-boundary case for human review', () => {
    const entitlement = createEntitlement({
      caseId: 'test-regulated',
      caseReference: 'TEST-REG',
      tier: 'full_dossier',
      stripeSessionId: 'cs_test_reg',
      stripePriceId: 'price_123',
      amount: 29500,
      requiresHumanReview: true,
      regulatedBoundaryHit: true,
    })

    expect(entitlement.requiresHumanReview).toBe(true)
    expect(entitlement.regulatedBoundaryHit).toBe(true)
    expect(entitlement.fulfilmentStatus).toBe('pending')
  })

  // ─── Test 6: Admin fulfilment item is created after payment ────────────────

  it('should create fulfilment queue item after payment', () => {
    const entitlement = createEntitlement({
      caseId: 'test-fulfilment',
      caseReference: 'TEST-FULFIL',
      tier: 'full_dossier',
      stripeSessionId: 'cs_test_fulfil',
      stripePriceId: 'price_123',
      amount: 29500,
      requiresHumanReview: true,
      regulatedBoundaryHit: false,
    })

    const fulfilmentItem = createFulfilmentItem(entitlement, 'GOVERNANCE_AND_BOARD')

    expect(fulfilmentItem).toBeDefined()
    expect(fulfilmentItem.caseId).toBe('test-fulfilment')
    expect(fulfilmentItem.tier).toBe('full_dossier')
    expect(fulfilmentItem.decisionClass).toBe('GOVERNANCE_AND_BOARD')
    expect(fulfilmentItem.status).toBe('paid_pending_review') // requires human review
    expect(fulfilmentItem.requiresHumanReview).toBe(true)

    // Verify it appears in the queue
    const queue = getFulfilmentQueue()
    expect(queue.length).toBe(1)
    expect(queue[0].caseId).toBe('test-fulfilment')
  })

  // ─── Test 7: No raw sensitive text in Stripe metadata ──────────────────────

  it('should not include raw scenario text in Stripe metadata', () => {
    const metadata = buildStripeMetadata({
      caseId: 'test-case-007',
      caseReference: 'TEST-CASE-007',
      tier: 'full_dossier',
      sourceAperture: 'web',
      decisionClass: 'COMPLIANCE_AND_FILING',
      requiresHumanReview: false,
      regulatedBoundaryHit: false,
      successPath: '/success',
      cancelPath: '/cancel',
    })

    // Metadata should contain only structural fields
    expect(metadata.caseId).toBe('test-case-007')
    expect(metadata.caseReference).toBe('TEST-CASE-007')
    expect(metadata.tier).toBe('full_dossier')
    expect(metadata.decisionClass).toBe('COMPLIANCE_AND_FILING')

    // Should NOT contain raw scenario text
    expect(Object.keys(metadata)).not.toContain('rawScenario')
    expect(Object.keys(metadata)).not.toContain('situation')
    expect(Object.keys(metadata)).not.toContain('input')
  })

  // ─── Test 8: No auto-delivery after payment ────────────────────────────────

  it('should not auto-deliver dossier after payment', () => {
    const entitlement = createEntitlement({
      caseId: 'test-auto-delivery',
      caseReference: 'TEST-AUTO',
      tier: 'full_dossier',
      stripeSessionId: 'cs_test_auto',
      stripePriceId: 'price_123',
      amount: 29500,
      requiresHumanReview: false,
      regulatedBoundaryHit: false,
    })

    // Entitlement should be pending, not delivered
    expect(entitlement.fulfilmentStatus).toBe('pending')

    const fulfilmentItem = createFulfilmentItem(entitlement, 'OPERATIONAL_AND_EXECUTION')

    // Fulfilment should be in_review, not delivered
    expect(fulfilmentItem.status).not.toBe('delivered')
    expect(fulfilmentItem.status).toBe('in_review')
  })

  // ─── Test 9: Free signal cannot be purchased ───────────────────────────────

  it('should reject checkout for free signal tier', () => {
    const validation = validateCheckoutRequest({
      caseId: 'test-free',
      caseReference: 'TEST-FREE',
      tier: 'free_signal',
      sourceAperture: 'web',
      decisionClass: 'COMPLIANCE_AND_FILING',
      requiresHumanReview: false,
      regulatedBoundaryHit: false,
      successPath: '/success',
      cancelPath: '/cancel',
    })

    expect(validation.valid).toBe(false)
    expect(validation.reason).toContain('Free signal')
  })

  // ─── Test 10: Duplicate active entitlement is detected ─────────────────────

  it('should detect duplicate active entitlement', () => {
    createEntitlement({
      caseId: 'test-dup-case',
      caseReference: 'TEST-DUP',
      tier: 'full_dossier',
      stripeSessionId: 'cs_test_dup1',
      stripePriceId: 'price_123',
      amount: 29500,
      requiresHumanReview: false,
      regulatedBoundaryHit: false,
    })

    const hasDuplicate = hasActiveEntitlement('test-dup-case', 'full_dossier')
    expect(hasDuplicate).toBe(true)

    // Different tier should not be detected as duplicate
    const hasDifferentTier = hasActiveEntitlement('test-dup-case', 'basic_brief')
    expect(hasDifferentTier).toBe(false)
  })
})
