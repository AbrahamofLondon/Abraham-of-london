/**
 * app/api/checkout/living-case-confirm/route.ts — Living Case Checkout Confirmation
 *
 * Called after successful Stripe payment.
 * Creates entitlement, fulfilment item, and links to LivingDecisionCase.
 * No auto-delivery. No public exposure.
 *
 * Idempotent: duplicate confirmation does not duplicate entitlement.
 */

import { NextRequest, NextResponse } from 'next/server'
import { COMMERCIAL_LADDER, type LadderTier } from '@/lib/commercial/ladder'
import {
  createEntitlement,
  createFulfilmentItem,
  getEntitlementBySessionId,
  cancelEntitlement,
} from '@/lib/commercial/checkout-entitlement'
import type { DecisionClass } from '@/lib/intelligence/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      sessionId,
      caseId,
      caseReference,
      tier,
      decisionClass,
      requiresHumanReview,
      regulatedBoundaryHit,
      amount,
      paymentStatus,
    } = body as {
      sessionId: string
      caseId: string
      caseReference: string
      tier: LadderTier
      decisionClass: DecisionClass
      requiresHumanReview: boolean
      regulatedBoundaryHit: boolean
      amount: number
      paymentStatus: 'complete' | 'failed' | 'canceled'
    }

    if (!sessionId || !caseId) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, caseId' },
        { status: 400 },
      )
    }

    // Handle failed/canceled payment
    if (paymentStatus === 'failed' || paymentStatus === 'canceled') {
      cancelEntitlement(sessionId)
      return NextResponse.json({
        status: 'payment_not_completed',
        message: 'Payment was not completed. No entitlement granted.',
      })
    }

    // Idempotency check: if entitlement already exists for this session, return it
    const existing = getEntitlementBySessionId(sessionId)
    if (existing) {
      return NextResponse.json({
        status: 'entitlement_already_exists',
        entitlement: existing,
        message: 'Entitlement was already granted for this payment.',
      })
    }

    const product = COMMERCIAL_LADDER[tier]
    if (!product) {
      return NextResponse.json(
        { error: `Unknown tier: ${tier}` },
        { status: 400 },
      )
    }

    // Create entitlement
    const entitlement = createEntitlement({
      caseId,
      caseReference,
      tier,
      stripeSessionId: sessionId,
      stripePriceId: product.stripePriceId || null,
      amount: amount || product.price,
      requiresHumanReview: requiresHumanReview || false,
      regulatedBoundaryHit: regulatedBoundaryHit || false,
    })

    // Create fulfilment queue item
    const fulfilmentItem = createFulfilmentItem(entitlement, decisionClass || 'STRATEGIC_AND_POSITIONING')

    console.log('[CHECKOUT_CONFIRM] Entitlement created:', {
      entitlementId: entitlement.id,
      caseId,
      caseReference,
      tier,
      fulfilmentStatus: fulfilmentItem.status,
      requiresHumanReview: entitlement.requiresHumanReview,
    })

    return NextResponse.json({
      status: 'entitlement_granted',
      entitlement: {
        id: entitlement.id,
        caseId: entitlement.caseId,
        caseReference: entitlement.caseReference,
        tier: entitlement.tier,
        grantedAt: entitlement.grantedAt,
        fulfilmentStatus: entitlement.fulfilmentStatus,
      },
      message: entitlement.requiresHumanReview
        ? 'Your governed dossier request has been received for review.'
        : 'Your governed dossier is being prepared.',
    })
  } catch (error) {
    console.error('[CHECKOUT_CONFIRM] Error:', error)
    return NextResponse.json(
      { error: 'An internal error occurred while confirming payment' },
      { status: 500 },
    )
  }
}
