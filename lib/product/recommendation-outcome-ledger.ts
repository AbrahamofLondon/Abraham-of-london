/**
 * lib/product/recommendation-outcome-ledger.ts
 *
 * Contract for tracking what was recommended, whether it was acted on,
 * and what the outcome was.
 *
 * Persistence strategy:
 *   - When Prisma is available (authenticated users): reads/writes to
 *     RecommendationOutcomeLedgerEntry table.
 *   - When Prisma is unavailable (anonymous/free-tier/testing): falls back
 *     to in-memory Map.
 *
 * Rules:
 *   - Persist engine-readable facts about recommendations and outcomes.
 *   - Never mark anything VERIFIED merely because it is persisted.
 *   - verified = true only when outcome verification has been independently confirmed.
 */

import type { DiagnosticJourneySurface } from '@/lib/product/diagnostic-journey-record'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RecommendationOutcomeStatus =
  | 'RECOMMENDED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'ACTED_ON'
  | 'IGNORED'
  | 'BLOCKED'
  | 'ABANDONED'
  | 'SUPERSEDED'
  | 'OUTCOME_REPORTED'

export type RecommendationOutcomeLedgerEntry = {
  id: string
  caseId: string
  recommendationId: string
  surface: DiagnosticJourneySurface
  recommendedAction: string
  evidenceBasis: string[]
  status: RecommendationOutcomeStatus
  createdAt: string
  updatedAt: string
  outcomeSummary?: string
  verified?: boolean
  /** Engine that produced this recommendation */
  sourceEngineId?: string
  /** ID of the journey event that created this recommendation */
  journeyEventId?: string
}

export type RecommendationLedgerSummary = {
  caseId: string
  totalRecommendations: number
  acted: number
  ignored: number
  blocked: number
  abandoned: number
  outcomeReported: number
  verifiedOutcomes: number
  oldestRecommendation: string | null
  latestRecommendation: string | null
  statusBreakdown: Record<RecommendationOutcomeStatus, number>
}

// ---------------------------------------------------------------------------
// In-memory store (fallback)
// ---------------------------------------------------------------------------

const ledgerStore = new Map<string, RecommendationOutcomeLedgerEntry[]>()

// ---------------------------------------------------------------------------
// Prisma helpers
// ---------------------------------------------------------------------------

async function getPrisma() {
  try {
    const mod = await import('@/lib/prisma')
    return mod.default
  } catch {
    return null
  }
}

function fromPrismaRecord(record: any): RecommendationOutcomeLedgerEntry {
  return {
    id: record.id,
    caseId: record.caseId,
    recommendationId: record.recommendationId,
    surface: record.surface as DiagnosticJourneySurface,
    recommendedAction: record.recommendedAction,
    evidenceBasis: Array.isArray(record.evidenceBasisJson)
      ? record.evidenceBasisJson as string[]
      : typeof record.evidenceBasisJson === 'string'
        ? JSON.parse(record.evidenceBasisJson)
        : [],
    status: record.status as RecommendationOutcomeStatus,
    createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
    updatedAt: record.updatedAt instanceof Date ? record.updatedAt.toISOString() : record.updatedAt,
    outcomeSummary: record.outcomeSummary ?? undefined,
    verified: record.verified ?? false,
    sourceEngineId: record.sourceEngineId ?? undefined,
    journeyEventId: record.journeyEventId ?? undefined,
  }
}

function toPrismaCreate(entry: RecommendationOutcomeLedgerEntry) {
  return {
    recommendationId: entry.recommendationId,
    caseId: entry.caseId,
    surface: entry.surface,
    recommendedAction: entry.recommendedAction,
    evidenceBasisJson: entry.evidenceBasis,
    status: entry.status,
    sourceEngineId: entry.sourceEngineId ?? null,
    journeyEventId: entry.journeyEventId ?? null,
    outcomeSummary: entry.outcomeSummary ?? null,
    verified: entry.verified === true,
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a new recommendation ledger entry.
 * Persists to Prisma when available, falls back to in-memory.
 */
export async function createRecommendationEntry(params: {
  caseId: string
  surface: DiagnosticJourneySurface
  recommendedAction: string
  evidenceBasis: string[]
  sourceEngineId?: string
  journeyEventId?: string
}): Promise<RecommendationOutcomeLedgerEntry> {
  const now = new Date().toISOString()
  const entry: RecommendationOutcomeLedgerEntry = {
    id: `rec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    caseId: params.caseId,
    recommendationId: `rec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    surface: params.surface,
    recommendedAction: params.recommendedAction,
    evidenceBasis: params.evidenceBasis,
    status: 'RECOMMENDED',
    createdAt: now,
    updatedAt: now,
    verified: false,
    sourceEngineId: params.sourceEngineId,
    journeyEventId: params.journeyEventId,
  }

  // Always store in-memory (fast path + fallback)
  const existing = ledgerStore.get(params.caseId) ?? []
  existing.push(entry)
  ledgerStore.set(params.caseId, existing)

  // Attempt Prisma persistence (non-blocking)
  const prisma = await getPrisma()
  if (prisma) {
    try {
      await prisma.recommendationOutcomeLedgerEntry.create({
        data: toPrismaCreate(entry),
      })
    } catch {
      // Prisma unavailable — in-memory store is the fallback
    }
  }

  return entry
}

/**
 * Create a recommendation entry only if no duplicate exists for the same
 * case/surface/action combination within the same request scope.
 *
 * Dedup key: caseId + surface + recommendedAction (normalised).
 * Returns the existing entry if a match is found, or the new entry if created.
 */
export async function createOrSkipRecommendationEntry(params: {
  caseId: string
  surface: DiagnosticJourneySurface
  recommendedAction: string
  evidenceBasis: string[]
  sourceEngineId?: string
  journeyEventId?: string
}): Promise<{ entry: RecommendationOutcomeLedgerEntry; created: boolean }> {
  const existing = ledgerStore.get(params.caseId) ?? []
  const normalisedAction = params.recommendedAction.trim().toLowerCase()

  const duplicate = existing.find(
    e =>
      e.surface === params.surface &&
      e.recommendedAction.trim().toLowerCase() === normalisedAction &&
      e.status === 'RECOMMENDED'
  )

  if (duplicate) {
    return { entry: duplicate, created: false }
  }

  const entry = await createRecommendationEntry(params)
  return { entry, created: true }
}

/**
 * Mark a recommendation with a new status.
 * Persists to Prisma when available, falls back to in-memory.
 */
export async function markRecommendationStatus(params: {
  caseId: string
  recommendationId: string
  status: RecommendationOutcomeStatus
  outcomeSummary?: string
  verified?: boolean
}): Promise<RecommendationOutcomeLedgerEntry | null> {
  // Update in-memory
  const entries = ledgerStore.get(params.caseId)
  if (!entries) {
    // Try to load from Prisma first
    const loaded = await loadFromPrisma(params.caseId)
    if (!loaded) return null
  }

  const existingEntries = ledgerStore.get(params.caseId)
  if (!existingEntries) return null

  const entry = existingEntries.find(e => e.recommendationId === params.recommendationId)
  if (!entry) return null

  entry.status = params.status
  entry.updatedAt = new Date().toISOString()
  if (params.outcomeSummary) entry.outcomeSummary = params.outcomeSummary
  if (params.verified !== undefined) entry.verified = params.verified

  // Attempt Prisma persistence (non-blocking)
  const prisma = await getPrisma()
  if (prisma) {
    try {
      await prisma.recommendationOutcomeLedgerEntry.updateMany({
        where: { recommendationId: params.recommendationId },
        data: {
          status: params.status,
          outcomeSummary: params.outcomeSummary ?? null,
          verified: params.verified === true,
        },
      })
    } catch {
      // Prisma unavailable — in-memory store is the fallback
    }
  }

  return entry
}

/**
 * Load recommendations from Prisma for a case, populating the in-memory cache.
 */
async function loadFromPrisma(caseId: string): Promise<RecommendationOutcomeLedgerEntry[]> {
  const prisma = await getPrisma()
  if (!prisma) return []

  try {
    const records = await prisma.recommendationOutcomeLedgerEntry.findMany({
      where: { caseId },
      orderBy: { createdAt: 'asc' },
    })

    const entries = records.map(fromPrismaRecord)
    if (entries.length > 0) {
      ledgerStore.set(caseId, entries)
    }
    return entries
  } catch {
    return []
  }
}

/**
 * Get all ledger entries for a case.
 * Reads from in-memory first, then attempts Prisma load.
 */
export async function getRecommendationLedger(caseId: string): Promise<RecommendationOutcomeLedgerEntry[]> {
  const inMemory = ledgerStore.get(caseId)
  if (inMemory && inMemory.length > 0) return inMemory

  const fromDb = await loadFromPrisma(caseId)
  if (fromDb.length > 0) return fromDb

  return []
}

/**
 * Summarise the recommendation ledger for a case.
 */
export async function summariseRecommendationLedger(caseId: string): Promise<RecommendationLedgerSummary> {
  const entries = await getRecommendationLedger(caseId)

  const statusBreakdown = {} as Record<RecommendationOutcomeStatus, number>
  for (const entry of entries) {
    statusBreakdown[entry.status] = (statusBreakdown[entry.status] ?? 0) + 1
  }

  const sorted = [...entries].sort((a, b) => a.createdAt.localeCompare(b.createdAt))

  return {
    caseId,
    totalRecommendations: entries.length,
    acted: entries.filter(e => e.status === 'ACTED_ON').length,
    ignored: entries.filter(e => e.status === 'IGNORED').length,
    blocked: entries.filter(e => e.status === 'BLOCKED').length,
    abandoned: entries.filter(e => e.status === 'ABANDONED').length,
    outcomeReported: entries.filter(e => e.status === 'OUTCOME_REPORTED').length,
    verifiedOutcomes: entries.filter(e => e.verified === true).length,
    oldestRecommendation: sorted[0]?.createdAt ?? null,
    latestRecommendation: sorted.at(-1)?.createdAt ?? null,
    statusBreakdown,
  }
}

/**
 * Check if a case has enough recommendation history for drift detection.
 * DriftRules requires at least 2 prior recommendations.
 */
export async function hasDriftDetectionData(caseId: string): Promise<boolean> {
  const entries = await getRecommendationLedger(caseId)
  return entries.length >= 2
}

/**
 * Check if a case has enough outcome data for pattern calibration.
 * FailurePatternCalibrator requires at least 1 outcome-reported entry.
 */
export async function hasOutcomeData(caseId: string): Promise<boolean> {
  const entries = await getRecommendationLedger(caseId)
  return entries.some(e => e.status === 'OUTCOME_REPORTED')
}

// ---------------------------------------------------------------------------
// Named status update helpers
// ---------------------------------------------------------------------------

/**
 * Mark a recommendation as ACCEPTED (user confirmed they will act on it).
 * Requires explicit caseId and recommendationId.
 */
export async function markRecommendationAccepted(params: {
  caseId: string
  recommendationId: string
  evidenceSummary?: string
}): Promise<RecommendationOutcomeLedgerEntry | null> {
  return markRecommendationStatus({
    caseId: params.caseId,
    recommendationId: params.recommendationId,
    status: 'ACCEPTED',
    outcomeSummary: params.evidenceSummary,
  })
}

/**
 * Mark a recommendation as REJECTED (user explicitly declined).
 * Requires explicit caseId and recommendationId.
 */
export async function markRecommendationRejected(params: {
  caseId: string
  recommendationId: string
  evidenceSummary?: string
}): Promise<RecommendationOutcomeLedgerEntry | null> {
  return markRecommendationStatus({
    caseId: params.caseId,
    recommendationId: params.recommendationId,
    status: 'REJECTED',
    outcomeSummary: params.evidenceSummary,
  })
}

/**
 * Mark a recommendation as ACTED_ON (user or system has evidence action was taken).
 * Requires explicit caseId and recommendationId.
 * Must NOT be inferred from recommendation being shown.
 */
export async function markRecommendationActedOn(params: {
  caseId: string
  recommendationId: string
  evidenceSummary?: string
}): Promise<RecommendationOutcomeLedgerEntry | null> {
  return markRecommendationStatus({
    caseId: params.caseId,
    recommendationId: params.recommendationId,
    status: 'ACTED_ON',
    outcomeSummary: params.evidenceSummary,
  })
}

/**
 * Mark a recommendation as IGNORED (user did not act and did not explicitly reject).
 * Requires explicit caseId and recommendationId.
 */
export async function markRecommendationIgnored(params: {
  caseId: string
  recommendationId: string
  evidenceSummary?: string
}): Promise<RecommendationOutcomeLedgerEntry | null> {
  return markRecommendationStatus({
    caseId: params.caseId,
    recommendationId: params.recommendationId,
    status: 'IGNORED',
    outcomeSummary: params.evidenceSummary,
  })
}

/**
 * Mark a recommendation as BLOCKED (action was prevented by a constraint, not ignored by choice).
 * BLOCKED is distinct from IGNORED: it records that an external constraint prevented execution.
 * BLOCKED is not verified — it requires independent confirmation like any other outcome.
 */
export async function markRecommendationBlocked(params: {
  caseId: string
  recommendationId: string
  evidenceSummary?: string
}): Promise<RecommendationOutcomeLedgerEntry | null> {
  return markRecommendationStatus({
    caseId: params.caseId,
    recommendationId: params.recommendationId,
    status: 'BLOCKED',
    outcomeSummary: params.evidenceSummary,
    verified: false,
  })
}

/**
 * Mark a recommendation as ABANDONED (action was started but not completed, not merely ignored).
 * ABANDONED is not verified — it requires independent confirmation like any other outcome.
 */
export async function markRecommendationAbandoned(params: {
  caseId: string
  recommendationId: string
  evidenceSummary?: string
}): Promise<RecommendationOutcomeLedgerEntry | null> {
  return markRecommendationStatus({
    caseId: params.caseId,
    recommendationId: params.recommendationId,
    status: 'ABANDONED',
    outcomeSummary: params.evidenceSummary,
    verified: false,
  })
}

/**
 * Mark a recommendation as SUPERSEDED (a newer recommendation replaced it).
 * Requires explicit caseId and recommendationId.
 */
export async function markRecommendationSuperseded(params: {
  caseId: string
  recommendationId: string
  evidenceSummary?: string
}): Promise<RecommendationOutcomeLedgerEntry | null> {
  return markRecommendationStatus({
    caseId: params.caseId,
    recommendationId: params.recommendationId,
    status: 'SUPERSEDED',
    outcomeSummary: params.evidenceSummary,
  })
}

/**
 * Attach an outcome report to a recommendation.
 * This is the only way to reach OUTCOME_REPORTED status.
 * Requires explicit outcomeSummary. verified=true only when independently confirmed.
 */
export async function attachOutcomeReport(params: {
  caseId: string
  recommendationId: string
  outcomeSummary: string
  verified?: boolean
}): Promise<RecommendationOutcomeLedgerEntry | null> {
  if (!params.outcomeSummary || params.outcomeSummary.trim().length === 0) {
    return null
  }
  return markRecommendationStatus({
    caseId: params.caseId,
    recommendationId: params.recommendationId,
    status: 'OUTCOME_REPORTED',
    outcomeSummary: params.outcomeSummary,
    verified: params.verified,
  })
}

// ---------------------------------------------------------------------------
// Client-safe view
// ---------------------------------------------------------------------------

/**
 * Client-safe recommendation state for Decision Centre API exposure.
 * Does not expose raw ledger internals.
 */
export type ClientSafeRecommendation = {
  recommendationId: string
  recommendedAction: string
  status: RecommendationOutcomeStatus
  lastUpdated: string
  outcomeSummary?: string
  verified: boolean
}

/**
 * Get a client-safe view of recommendations for a case.
 * Reads from durable store first, then fallback.
 * Safe to expose to Decision Centre API.
 */
export async function getClientSafeRecommendations(caseId: string): Promise<ClientSafeRecommendation[]> {
  const entries = await getRecommendationLedger(caseId)
  return entries.map(e => ({
    recommendationId: e.recommendationId,
    recommendedAction: e.recommendedAction,
    status: e.status,
    lastUpdated: e.updatedAt,
    outcomeSummary: e.outcomeSummary,
    verified: e.verified === true,
  }))
}

/**
 * Clear the ledger store (for testing).
 */
export function _resetLedgerStore(): void {
  ledgerStore.clear()
}