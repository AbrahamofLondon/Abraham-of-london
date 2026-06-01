/**
 * app/api/retainer/review-queue/route.ts
 *
 * POST: Create or return existing PENDING_REVIEW entry for a case.
 *
 * Requires a valid user session. Unauthenticated requests are rejected.
 *
 * Rules:
 *   - Does not activate Retainer Oversight.
 *   - Does not start cadence, cycle, or monthly oversight.
 *   - Returns safe status messages only — no raw case data.
 *   - NOT_READY cases are rejected with 422.
 *   - DECLINED entries are rejected with 422 unless readiness level has upgraded.
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import {
  createRetainerReviewQueueEntry,
  type RetainerReviewQueueInput,
} from '@/lib/product/retainer-review-queue'
import type { RetainerOversightReadinessStatus } from '@/lib/product/retainer-oversight-readiness'

type ReviewQueueRequestBody = {
  caseId: string
  readinessStatus: RetainerOversightReadinessStatus
  reasons?: string[]
  availableSignals?: string[]
  missingRequirements?: string[]
  accountId?: string
}

const SAFE_STATUS_MESSAGES: Record<string, string> = {
  PENDING_REVIEW: 'Review request received. Pending operator review.',
  APPROVED_FOR_CONTACT: 'Review approved. An operator will be in contact.',
  DECLINED: 'Review request was not approved at this time.',
  NEEDS_MORE_HISTORY: 'More case history is required before a review can proceed.',
}

export async function POST(request: Request): Promise<NextResponse> {
  // ── Auth guard ──────────────────────────────────────────────────────────
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json(
      { ok: false, error: 'Authentication required' },
      { status: 401 },
    )
  }

  let body: ReviewQueueRequestBody
  try {
    body = await request.json() as ReviewQueueRequestBody
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body.' }, { status: 400 })
  }

  const { caseId, readinessStatus, reasons, availableSignals, missingRequirements, accountId } = body

  if (!caseId || typeof caseId !== 'string') {
    return NextResponse.json({ ok: false, error: 'caseId is required.' }, { status: 400 })
  }

  if (!readinessStatus) {
    return NextResponse.json({ ok: false, error: 'readinessStatus is required.' }, { status: 400 })
  }

  const input: RetainerReviewQueueInput = {
    caseId: caseId.trim(),
    readinessStatus,
    reasons: Array.isArray(reasons) ? reasons : [],
    availableSignals: Array.isArray(availableSignals) ? availableSignals : [],
    missingRequirements: Array.isArray(missingRequirements) ? missingRequirements : [],
    accountId: typeof accountId === 'string' ? accountId : undefined,
  }

  const result = await createRetainerReviewQueueEntry(input)

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.reason }, { status: 422 })
  }

  const safeStatusMessage = SAFE_STATUS_MESSAGES[result.entry.status] ?? 'Review request received.'

  return NextResponse.json(
    {
      ok: true,
      entryId: result.entry.id,
      status: result.entry.status,
      readinessStatus: result.entry.readinessStatus,
      statusMessage: safeStatusMessage,
      created: result.created,
    },
    { status: result.created ? 201 : 200 },
  )
}
