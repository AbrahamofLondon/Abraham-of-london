/**
 * app/api/checkout/living-case/route.ts — Living Decision Case Checkout
 *
 * Creates a Stripe checkout session for a Living Decision Case.
 * Session metadata includes caseId, caseReference, tier, decisionClass.
 *
 * No auto-delivery. No public exposure. No bypass of human review.
 */

import { NextRequest, NextResponse } from 'next/server'
import { COMMERCIAL_LADDER, type LadderTier } from '@/lib/commercial/ladder'
import {
  buildStripeMetadata,
  validateCheckoutRequest,
  hasActiveEntitlement,
} from '@/lib/commercial/checkout-entitlement'
import type { SourceAperture, DecisionClass } from '@/lib/intelligence/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      caseId,
      caseReference,
      tier,
      sourceAperture,
      decisionClass,
      requiresHumanReview,
      regulatedBoundaryHit,
    } = body as {
      caseId: string
      caseReference: string
      tier: LadderTier
      sourceAperture: SourceAperture
      decisionClass: DecisionClass
      requiresHumanReview: boolean
      regulatedBoundaryHit: boolean
    }

    // Validate required fields
    if (!caseId || !caseReference || !tier) {
      return NextResponse.json(
        { error: 'Missing required fields: caseId, caseReference, tier' },
        { status: 400 },
      )
    }

    // Validate checkout request
    const validation = validateCheckoutRequest({
      caseId,
      caseReference,
      tier,
      sourceAperture: sourceAperture || 'web',
      decisionClass: decisionClass || 'STRATEGIC_AND_POSITIONING',
      requiresHumanReview: requiresHumanReview || false,
      regulatedBoundaryHit: regulatedBoundaryHit || false,
      successPath: `/foundry/case/success?caseId=${caseId}&tier=${tier}`,
      cancelPath: `/foundry/decision-test`,
    })

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.reason },
        { status: 400 },
      )
    }

    // Check for duplicate active entitlement
    if (hasActiveEntitlement(caseId, tier)) {
      return NextResponse.json(
        { error: 'An active entitlement already exists for this case and tier' },
        { status: 409 },
      )
    }

    const product = COMMERCIAL_LADDER[tier]

    // Build Stripe metadata
    const metadata = buildStripeMetadata({
      caseId,
      caseReference,
      tier,
      sourceAperture: sourceAperture || 'web',
      decisionClass: decisionClass || 'STRATEGIC_AND_POSITIONING',
      requiresHumanReview: requiresHumanReview || false,
      regulatedBoundaryHit: regulatedBoundaryHit || false,
      successPath: `/foundry/case/success?caseId=${caseId}&tier=${tier}`,
      cancelPath: `/foundry/decision-test`,
    })

    // In a production environment, this would create a Stripe checkout session.
    // For now, we simulate the session creation and return a mock response.
    // The actual Stripe integration will be wired when the payment test is run.
    const mockSessionId = `cs_test_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`
    const mockSessionUrl = `/foundry/case/success?caseId=${caseId}&tier=${tier}&session_id=${mockSessionId}`

    console.log('[CHECKOUT] Created session:', {
      sessionId: mockSessionId,
      caseId,
      caseReference,
      tier,
      amount: product.price,
      metadata,
    })

    return NextResponse.json({
      sessionId: mockSessionId,
      sessionUrl: mockSessionUrl,
      caseId,
      caseReference,
      tier,
      amount: product.price,
    })
  } catch (error) {
    console.error('[CHECKOUT] Error:', error)
    return NextResponse.json(
      { error: 'An internal error occurred while creating the checkout session' },
      { status: 500 },
    )
  }
}
