/**
 * app/api/admin/intelligence-foundry/living-case-fulfilment/[id]/route.ts
 *
 * Admin actions for a specific fulfilment item.
 * Supports: generate, approve, amend, return, reject, deliver
 * Each action creates an append-only event.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getFulfilmentQueue } from '@/lib/commercial/checkout-entitlement'

interface ActionRequest {
  action: 'generate' | 'approve' | 'amend' | 'return' | 'reject' | 'deliver'
  notes?: string
  actorId?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params
    const body: ActionRequest = await request.json()
    const { action, notes, actorId } = body

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    const validActions = ['generate', 'approve', 'amend', 'return', 'reject', 'deliver']
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 })
    }

    // In production, this would update Prisma and record events.
    // For now, we simulate the action and return success.
    const eventType = action === 'generate' ? 'DOSSIER_GENERATED'
      : action === 'approve' ? 'HUMAN_REVIEW_COMPLETED'
      : action === 'amend' ? 'HUMAN_REVIEW_AMENDMENT'
      : action === 'return' ? 'QUALITY_STANDARD_FAILED'
      : action === 'reject' ? 'CASE_CLOSED'
      : 'CASE_DELIVERED'

    console.log('[ADMIN_FULFILMENT_ACTION]', {
      fulfilmentId: id,
      action,
      eventType,
      actorId: actorId || 'admin@abraham.com',
      notes: notes || '',
    })

    return NextResponse.json({
      success: true,
      fulfilmentId: id,
      action,
      eventType,
      message: `${action} completed for fulfilment item ${id}`,
    })
  } catch (error) {
    console.error('[ADMIN_FULFILMENT_ACTION] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 },
    )
  }
}
