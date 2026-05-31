/**
 * app/api/admin/intelligence-foundry/living-case-fulfilment/route.ts
 *
 * Canonical admin API for the Living Case fulfilment queue.
 * Returns fulfilment items and entitlements from the in-memory store.
 *
 * In production, this would read from Prisma (LivingCaseEntitlement + FulfilmentQueueItem).
 */

import { NextResponse } from 'next/server'
import { getFulfilmentQueue } from '@/lib/commercial/checkout-entitlement'

export async function GET() {
  try {
    const fulfilmentItems = getFulfilmentQueue()

    // In production, entitlements would also come from Prisma.
    // For now, we derive them from fulfilment items.
    const entitlements = fulfilmentItems.map(item => ({
      id: `ent-${item.id}`,
      caseId: item.caseId,
      caseReference: item.caseReference,
      tier: item.tier,
      grantedAt: item.paidAt,
      grantType: 'purchase' as const,
      amount: 0, // Would come from Stripe in production
      active: item.status !== 'cancelled',
      requiresHumanReview: item.requiresHumanReview,
      regulatedBoundaryHit: item.regulatedBoundaryHit,
      fulfilmentStatus: item.status,
    }))

    return NextResponse.json({
      fulfilmentItems,
      entitlements,
    })
  } catch (error) {
    console.error('[ADMIN_FULFILMENT] Error:', error)
    return NextResponse.json(
      { error: 'Failed to load fulfilment data' },
      { status: 500 },
    )
  }
}
