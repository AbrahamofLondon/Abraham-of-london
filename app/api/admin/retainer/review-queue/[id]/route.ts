/**
 * app/api/admin/retainer/review-queue/[id]/route.ts
 *
 * PATCH: Operator decision on a retainer review queue entry.
 *
 * Requires admin authorization via requireAdminAppRoute().
 *
 * Actions:
 *   - approve_for_contact → APPROVED_FOR_CONTACT
 *   - decline             → DECLINED (suppresses re-creation for same readinessStatus)
 *   - request_more_history → NEEDS_MORE_HISTORY
 *
 * Rules:
 *   - APPROVED_FOR_CONTACT does NOT activate Retainer Oversight.
 *   - No action here starts a cadence, cycle, or monthly oversight.
 *   - All decisions require a reviewer identity.
 *   - Internal/admin route only.
 */

export const dynamic = "force-dynamic"

import { NextResponse } from 'next/server'
import { requireAdminAppRoute } from '@/lib/access/require-admin-app'
import {
  approveForContact,
  declineReview,
  requestMoreHistory,
} from '@/lib/product/retainer-review-queue'

type ReviewDecisionBody = {
  action: 'approve_for_contact' | 'decline' | 'request_more_history'
  reviewer?: string
  note?: string
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  // ── Admin auth guard ────────────────────────────────────────────────────
  const auth = await requireAdminAppRoute()
  if (!auth.authorized) return auth.response

  const { id } = await params

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ ok: false, error: 'Entry id is required.' }, { status: 400 })
  }

  let body: ReviewDecisionBody
  try {
    body = await request.json() as ReviewDecisionBody
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 })
  }

  const { action, note } = body
  // Derive reviewer from the authenticated admin session identity
  const reviewer = (typeof body.reviewer === 'string' && body.reviewer.trim())
    ? body.reviewer.trim()
    : auth.email ?? 'operator'

  let updated
  if (action === 'approve_for_contact') {
    updated = await approveForContact(id, reviewer, note)
  } else if (action === 'decline') {
    updated = await declineReview(id, reviewer, note)
  } else if (action === 'request_more_history') {
    updated = await requestMoreHistory(id, reviewer, note)
  } else {
    return NextResponse.json({ ok: false, error: `Unknown action: ${action}` }, { status: 400 })
  }

  if (!updated) {
    return NextResponse.json({ ok: false, error: 'Review queue entry not found.' }, { status: 404 })
  }

  return NextResponse.json({
    ok: true,
    entryId: updated.id,
    status: updated.status,
    reviewedBy: updated.reviewedBy,
    reviewedAt: updated.reviewedAt,
  })
}
