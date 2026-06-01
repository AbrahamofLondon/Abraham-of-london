/**
 * lib/product/retainer-review-queue.ts
 *
 * Controlled operator review queue for REVIEW_READY and OVERSIGHT_READY cases.
 *
 * Rules:
 *   - NOT_READY cases cannot create review queue entries.
 *   - DECLINED entries suppress re-creation for the same caseId+readinessStatus.
 *     If readinessStatus has upgraded (e.g. REVIEW_READY → OVERSIGHT_READY), a new
 *     entry is allowed through.
 *   - Creating an entry does NOT activate Retainer Oversight.
 *   - Creating an entry does NOT start a cadence, cycle, or monthly oversight.
 *   - Creating an entry does NOT mark Retainer as ACTIVE.
 *   - Queue entries contain no raw case data.
 *   - Duplicate PENDING_REVIEW entries are deduplicated per caseId+readinessStatus.
 *   - Operator decisions (APPROVED_FOR_CONTACT, DECLINED, NEEDS_MORE_HISTORY) do not
 *     activate Retainer Oversight or any other lifecycle process.
 */

import type { RetainerOversightReadinessStatus } from '@/lib/product/retainer-oversight-readiness'
import type { PrismaClient } from '@prisma/client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RetainerReviewQueueStatus =
  | 'PENDING_REVIEW'
  | 'APPROVED_FOR_CONTACT'
  | 'DECLINED'
  | 'NEEDS_MORE_HISTORY'

export type RetainerReviewQueueEntry = {
  id: string
  caseId: string
  accountId?: string
  readinessStatus: 'REVIEW_READY' | 'OVERSIGHT_READY'
  reasons: string[]
  availableSignals: string[]
  missingRequirements: string[]
  createdAt: string
  updatedAt: string
  reviewedAt?: string
  reviewedBy?: string
  reviewNote?: string
  status: RetainerReviewQueueStatus
}

export type RetainerReviewQueueInput = {
  caseId: string
  accountId?: string
  readinessStatus: RetainerOversightReadinessStatus
  reasons: string[]
  availableSignals: string[]
  missingRequirements: string[]
}

export type RetainerReviewQueueResult =
  | { ok: true; entry: RetainerReviewQueueEntry; created: boolean }
  | { ok: false; reason: string }

// ---------------------------------------------------------------------------
// In-memory store (fallback)
// ---------------------------------------------------------------------------

const queueStore = new Map<string, RetainerReviewQueueEntry[]>()

// ---------------------------------------------------------------------------
// Prisma helper (same pattern as diagnostic-journey-store.ts)
// ---------------------------------------------------------------------------

async function getPrisma(): Promise<PrismaClient | null> {
  try {
    const mod = await import('@/lib/prisma')
    return mod.default as PrismaClient
  } catch {
    return null
  }
}

function mapPrismaToEntry(row: any): RetainerReviewQueueEntry {
  return {
    id: row.id,
    caseId: row.caseId,
    ...(row.accountId != null ? { accountId: row.accountId } : {}),
    readinessStatus: row.readinessStatus,
    reasons: Array.isArray(row.reasons) ? row.reasons : [],
    availableSignals: Array.isArray(row.availableSignals) ? row.availableSignals : [],
    missingRequirements: Array.isArray(row.missingRequirements) ? row.missingRequirements : [],
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
    status: row.status,
    reviewedAt: row.reviewedAt instanceof Date ? row.reviewedAt.toISOString() : row.reviewedAt ?? undefined,
    reviewedBy: row.reviewedBy ?? undefined,
    reviewNote: row.reviewNote ?? undefined,
  }
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * Create a retainer review queue entry for REVIEW_READY or OVERSIGHT_READY cases.
 *
 * NOT_READY cases are rejected. DECLINED entries suppress re-creation unless the
 * readinessStatus has upgraded. Duplicate PENDING_REVIEW entries per
 * caseId+readinessStatus are deduplicated — returns the existing entry.
 *
 * This function does NOT start retained oversight, a cadence, a cycle, or
 * any monthly oversight process. It only creates an operator review queue entry.
 */
export async function createRetainerReviewQueueEntry(
  input: RetainerReviewQueueInput,
): Promise<RetainerReviewQueueResult> {
  if (input.readinessStatus === 'NOT_READY') {
    return {
      ok: false,
      reason: 'Case is NOT_READY for retainer review. Sufficient durable memory history is required.',
    }
  }

  if (input.readinessStatus !== 'REVIEW_READY' && input.readinessStatus !== 'OVERSIGHT_READY') {
    return {
      ok: false,
      reason: `Unrecognised readiness status: ${input.readinessStatus}`,
    }
  }

  // ---- Prisma persistence (preferred) ----
  const prisma = await getPrisma()
  if (prisma) {
    try {
      // Deduplicate: check for existing PENDING_REVIEW with same caseId+readinessStatus
      const existingPending = await prisma.retainerReviewQueueEntry.findFirst({
        where: {
          caseId: input.caseId,
          readinessStatus: input.readinessStatus,
          status: 'PENDING_REVIEW',
        },
      })
      if (existingPending) {
        return { ok: true, entry: mapPrismaToEntry(existingPending), created: false }
      }

      // DECLINED suppression: block re-creation if a DECLINED entry exists for this
      // caseId with the same readinessStatus. If readinessStatus has upgraded, allow through.
      const declined = await prisma.retainerReviewQueueEntry.findFirst({
        where: {
          caseId: input.caseId,
          readinessStatus: input.readinessStatus,
          status: 'DECLINED',
        },
      })
      if (declined) {
        return {
          ok: false,
          reason:
            'A previous review request was declined. Submit a new request only when readiness materially changes.',
        }
      }

      // Create in Prisma
      const created = await prisma.retainerReviewQueueEntry.create({
        data: {
          caseId: input.caseId,
          accountId: input.accountId ?? null,
          orgId: null,
          readinessStatus: input.readinessStatus,
          reasons: input.reasons,
          availableSignals: input.availableSignals,
          missingRequirements: input.missingRequirements,
          status: 'PENDING_REVIEW',
        },
      })

      // Also store in memory for fast reads
      const entry = mapPrismaToEntry(created)
      const memEntries = queueStore.get(input.caseId) ?? []
      memEntries.push(entry)
      queueStore.set(input.caseId, memEntries)
      return { ok: true, entry, created: true }
    } catch {
      // Prisma unavailable — fall through to in-memory
    }
  }

  // ---- In-memory fallback ----
  const existing = queueStore.get(input.caseId) ?? []

  // DECLINED suppression: block re-creation if a DECLINED entry exists for this
  // caseId with the same readinessStatus. If readinessStatus has upgraded, allow through.
  const declinedEntry = existing.find(
    e => e.status === 'DECLINED' && e.readinessStatus === input.readinessStatus,
  )

  if (declinedEntry) {
    return {
      ok: false,
      reason:
        'A previous review request was declined. Submit a new request only when readiness materially changes.',
    }
  }

  // Deduplicate: if a PENDING_REVIEW entry already exists for this caseId+readinessStatus, return it
  const duplicate = existing.find(
    e => e.readinessStatus === input.readinessStatus && e.status === 'PENDING_REVIEW',
  )

  if (duplicate) {
    return { ok: true, entry: duplicate, created: false }
  }

  const now = new Date().toISOString()

  const entry: RetainerReviewQueueEntry = {
    id: `rrq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    caseId: input.caseId,
    ...(input.accountId !== undefined ? { accountId: input.accountId } : {}),
    readinessStatus: input.readinessStatus,
    // Safe signals only — no raw case data
    reasons: input.reasons.slice(),
    availableSignals: input.availableSignals.slice(),
    missingRequirements: input.missingRequirements.slice(),
    createdAt: now,
    updatedAt: now,
    status: 'PENDING_REVIEW',
  }

  existing.push(entry)
  queueStore.set(input.caseId, existing)

  return { ok: true, entry, created: true }
}

/**
 * Get all review queue entries for a case.
 */
export function getRetainerReviewQueueEntries(caseId: string): RetainerReviewQueueEntry[] {
  return queueStore.get(caseId) ?? []
}

/**
 * Find a single review queue entry by its id, searching across all cases.
 * Returns null if not found.
 */
export async function getRetainerReviewQueueEntryById(id: string): Promise<RetainerReviewQueueEntry | null> {
  // Check memory first
  for (const entries of queueStore.values()) {
    const found = entries.find(e => e.id === id)
    if (found !== undefined) {
      return found
    }
  }

  // Fall back to Prisma
  const prisma = await getPrisma()
  if (prisma) {
    try {
      const row = await prisma.retainerReviewQueueEntry.findUnique({ where: { id } })
      if (row) {
        return mapPrismaToEntry(row)
      }
    } catch {
      // Prisma unavailable
    }
  }

  return null
}

// ---------------------------------------------------------------------------
// Operator decision helpers
// ---------------------------------------------------------------------------

/**
 * Mark a review queue entry as APPROVED_FOR_CONTACT.
 *
 * APPROVED_FOR_CONTACT does NOT activate Retainer Oversight or any other
 * lifecycle process. It is a signal for the operator only.
 *
 * Returns the updated entry, or null if the entry was not found.
 */
export async function approveForContact(
  entryId: string,
  reviewer: string,
  note?: string,
): Promise<RetainerReviewQueueEntry | null> {
  const entry = await getRetainerReviewQueueEntryById(entryId)
  if (entry === null) {
    return null
  }

  const now = new Date().toISOString()
  entry.status = 'APPROVED_FOR_CONTACT'
  entry.reviewedBy = reviewer
  entry.reviewedAt = now
  entry.updatedAt = now
  if (note !== undefined) {
    entry.reviewNote = note
  }

  const prisma = await getPrisma()
  if (prisma) {
    try {
      await prisma.retainerReviewQueueEntry.update({
        where: { id: entryId },
        data: {
          status: 'APPROVED_FOR_CONTACT',
          reviewedAt: new Date(),
          reviewedBy: reviewer,
          reviewNote: note?.slice(0, 1000),
        },
      })
    } catch { /* fallback to memory-only */ }
  }

  return entry
}

/**
 * Mark a review queue entry as DECLINED.
 *
 * After declining, re-creation for the same caseId+readinessStatus is suppressed.
 * Does NOT activate Retainer Oversight or any other lifecycle process.
 *
 * Returns the updated entry, or null if the entry was not found.
 */
export async function declineReview(
  entryId: string,
  reviewer: string,
  note?: string,
): Promise<RetainerReviewQueueEntry | null> {
  const entry = await getRetainerReviewQueueEntryById(entryId)
  if (entry === null) {
    return null
  }

  const now = new Date().toISOString()
  entry.status = 'DECLINED'
  entry.reviewedBy = reviewer
  entry.reviewedAt = now
  entry.updatedAt = now
  if (note !== undefined) {
    entry.reviewNote = note
  }

  const prisma = await getPrisma()
  if (prisma) {
    try {
      await prisma.retainerReviewQueueEntry.update({
        where: { id: entryId },
        data: {
          status: 'DECLINED',
          reviewedAt: new Date(),
          reviewedBy: reviewer,
          reviewNote: note?.slice(0, 1000),
        },
      })
    } catch { /* fallback to memory-only */ }
  }

  return entry
}

/**
 * Mark a review queue entry as NEEDS_MORE_HISTORY.
 *
 * Does NOT activate Retainer Oversight or any other lifecycle process.
 *
 * Returns the updated entry, or null if the entry was not found.
 */
export async function requestMoreHistory(
  entryId: string,
  reviewer: string,
  note?: string,
): Promise<RetainerReviewQueueEntry | null> {
  const entry = await getRetainerReviewQueueEntryById(entryId)
  if (entry === null) {
    return null
  }

  const now = new Date().toISOString()
  entry.status = 'NEEDS_MORE_HISTORY'
  entry.reviewedBy = reviewer
  entry.reviewedAt = now
  entry.updatedAt = now
  if (note !== undefined) {
    entry.reviewNote = note
  }

  const prisma = await getPrisma()
  if (prisma) {
    try {
      await prisma.retainerReviewQueueEntry.update({
        where: { id: entryId },
        data: {
          status: 'NEEDS_MORE_HISTORY',
          reviewedAt: new Date(),
          reviewedBy: reviewer,
          reviewNote: note?.slice(0, 1000),
        },
      })
    } catch { /* fallback to memory-only */ }
  }

  return entry
}

/**
 * Clear the queue store (for testing).
 */
export function _resetRetainerReviewQueueStore(): void {
  queueStore.clear()
}
