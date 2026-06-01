/**
 * lib/product/diagnostic-journey-store.ts
 *
 * Persistence layer for DiagnosticJourneyRecord.
 *
 * Strategy:
 *   - For authenticated users: piggyback on existing DiagnosticJourney +
 *     DiagnosticEvidenceNode Prisma models. Engine events stored as evidence
 *     nodes with kind='engine_event'.
 *   - For anonymous/free-tier: in-memory Map keyed by caseId (ephemeral
 *     within the server process lifetime).
 *   - TODO: Migrate to dedicated DiagnosticJourneyEvent Prisma model for
 *     full first-class support.
 *
 * Rules:
 *   - Never store raw presentation output as source of truth.
 *   - All payloads are JSON-safe engine-readable facts.
 *   - audienceSafe flag must be persisted and respected.
 */

import type {
  DiagnosticJourneySurface,
  DiagnosticJourneyEventType,
  DiagnosticJourneyEvent,
  DiagnosticJourneyRecord,
} from '@/lib/product/diagnostic-journey-record'
import {
  createDiagnosticJourneyRecord,
  createJourneyEvent,
} from '@/lib/product/diagnostic-journey-record'

// ---------------------------------------------------------------------------
// In-memory store (anonymous / free-tier / fallback)
// ---------------------------------------------------------------------------

const memoryStore = new Map<string, DiagnosticJourneyRecord>()

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

/**
 * Attempt to load a journey from Prisma DiagnosticJourney model.
 * Maps existing Prisma data to DiagnosticJourneyRecord shape.
 */
async function loadFromPrisma(caseId: string): Promise<DiagnosticJourneyRecord | null> {
  const prisma = await getPrisma()
  if (!prisma) return null

  try {
    const journey = await prisma.diagnosticJourney.findFirst({
      where: {
        OR: [
          { journeyKey: caseId },
          { id: caseId },
        ],
      },
      include: {
        evidenceNodes: {
          where: { kind: 'engine_event' },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!journey) return null

    const events: DiagnosticJourneyEvent[] = journey.evidenceNodes.map(node => {
      const payload = (node.payload as Record<string, unknown>) ?? {}
      return {
        id: node.id,
        caseId,
        surface: (payload['surface'] as DiagnosticJourneySurface) ?? 'fast_diagnostic',
        type: (payload['eventType'] as DiagnosticJourneyEventType) ?? 'EVIDENCE_CAPTURED',
        occurredAt: node.createdAt.toISOString(),
        engineId: (payload['engineId'] as string) ?? undefined,
        engineVersion: (payload['engineVersion'] as string) ?? undefined,
        inputHash: (payload['inputHash'] as string) ?? undefined,
        summary: node.summary ?? node.label,
        payload: (payload['eventPayload'] as Record<string, unknown>) ?? {},
        audienceSafe: (payload['audienceSafe'] as boolean) ?? true,
      }
    })

    // Determine current surface from latest event or diagnostic type
    const latestEvent = events[events.length - 1]
    const currentSurface: DiagnosticJourneySurface =
      latestEvent?.surface ??
      mapDiagnosticType(journey.diagnosticType) ??
      'fast_diagnostic'

    // Map Prisma status to journey status
    const status = mapJourneyStatus(journey.status)

    return {
      caseId,
      accountId: journey.organisationKey ?? null,
      email: journey.email ?? null,
      createdAt: journey.createdAt.toISOString(),
      updatedAt: journey.updatedAt.toISOString(),
      currentSurface,
      status,
      events,
    }
  } catch {
    return null
  }
}

function mapDiagnosticType(type: string | null): DiagnosticJourneySurface | null {
  if (!type) return null
  const map: Record<string, DiagnosticJourneySurface> = {
    fast_diagnostic: 'fast_diagnostic',
    purpose_alignment: 'purpose_alignment',
    constitutional: 'constitutional_diagnostic',
    constitutional_diagnostic: 'constitutional_diagnostic',
    team_assessment: 'team_assessment',
    enterprise: 'enterprise_assessment',
    enterprise_assessment: 'enterprise_assessment',
    executive_reporting: 'executive_reporting',
    strategy_room: 'strategy_room',
  }
  return map[type] ?? null
}

function mapJourneyStatus(status: string | null): DiagnosticJourneyRecord['status'] {
  if (!status) return 'ACTIVE'
  const map: Record<string, DiagnosticJourneyRecord['status']> = {
    active: 'ACTIVE',
    ACTIVE: 'ACTIVE',
    paused: 'PAUSED',
    PAUSED: 'PAUSED',
    escalated: 'ESCALATED',
    ESCALATED: 'ESCALATED',
    completed: 'RESOLVED',
    resolved: 'RESOLVED',
    RESOLVED: 'RESOLVED',
    stale: 'STALE',
    STALE: 'STALE',
  }
  return map[status] ?? 'ACTIVE'
}

/**
 * Persist an engine event to Prisma as a DiagnosticEvidenceNode with kind='engine_event'.
 */
async function persistEventToPrisma(
  journeyKey: string,
  event: DiagnosticJourneyEvent,
): Promise<boolean> {
  const prisma = await getPrisma()
  if (!prisma) return false

  try {
    const journey = await prisma.diagnosticJourney.findFirst({
      where: {
        OR: [
          { journeyKey },
          { id: journeyKey },
        ],
      },
    })

    if (!journey) return false

    await prisma.diagnosticEvidenceNode.create({
      data: {
        journeyId: journey.id,
        sourceStage: event.surface,
        kind: 'engine_event',
        label: event.type,
        summary: event.summary,
        confidence: 1.0,
        severity: 'medium',
        payload: JSON.parse(JSON.stringify({
          surface: event.surface,
          eventType: event.type,
          engineId: event.engineId ?? null,
          engineVersion: event.engineVersion ?? null,
          inputHash: event.inputHash ?? null,
          audienceSafe: event.audienceSafe,
          eventPayload: event.payload,
        })),
      },
    })

    // Update journey timestamp
    await prisma.diagnosticJourney.update({
      where: { id: journey.id },
      data: { updatedAt: new Date() },
    })

    return true
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get or create a DiagnosticJourneyRecord for a case.
 * Attempts Prisma first, falls back to in-memory store.
 */
export async function getOrCreateDiagnosticJourney(params: {
  caseId: string
  email?: string | null
  accountId?: string | null
  surface: DiagnosticJourneySurface
}): Promise<DiagnosticJourneyRecord> {
  // Check in-memory first (for anonymous / current-process cases)
  const existing = memoryStore.get(params.caseId)
  if (existing) {
    existing.currentSurface = params.surface
    existing.updatedAt = new Date().toISOString()
    return existing
  }

  // Try Prisma
  const fromPrisma = await loadFromPrisma(params.caseId)
  if (fromPrisma) {
    fromPrisma.currentSurface = params.surface
    memoryStore.set(params.caseId, fromPrisma)
    return fromPrisma
  }

  // Create new in-memory record
  const record = createDiagnosticJourneyRecord({
    caseId: params.caseId,
    surface: params.surface,
    email: params.email,
    accountId: params.accountId,
  })
  memoryStore.set(params.caseId, record)
  return record
}

/**
 * Append a diagnostic journey event to a case.
 * Persists to both in-memory store and Prisma (if available).
 */
export async function appendDiagnosticJourneyEvent(params: {
  caseId: string
  surface: DiagnosticJourneySurface
  type: DiagnosticJourneyEventType
  engineId?: string
  engineVersion?: string
  inputHash?: string
  summary: string
  payload: Record<string, unknown>
  audienceSafe?: boolean
}): Promise<DiagnosticJourneyEvent> {
  const event = createJourneyEvent({
    caseId: params.caseId,
    surface: params.surface,
    type: params.type,
    engineId: params.engineId,
    engineVersion: params.engineVersion,
    inputHash: params.inputHash,
    summary: params.summary,
    payload: params.payload,
    audienceSafe: params.audienceSafe,
  })

  // Append to in-memory store
  const record = memoryStore.get(params.caseId)
  if (record) {
    record.events.push(event)
    record.updatedAt = new Date().toISOString()
    record.currentSurface = params.surface
  }

  // Attempt Prisma persistence (fire-and-forget, non-blocking)
  persistEventToPrisma(params.caseId, event).catch(() => {
    // Prisma unavailable — in-memory store is the fallback
  })

  return event
}

/**
 * Get a DiagnosticJourneyRecord by caseId.
 * Checks in-memory first, then Prisma.
 */
export async function getDiagnosticJourney(
  caseId: string,
): Promise<DiagnosticJourneyRecord | null> {
  const inMemory = memoryStore.get(caseId)
  if (inMemory) return inMemory

  const fromPrisma = await loadFromPrisma(caseId)
  if (fromPrisma) {
    memoryStore.set(caseId, fromPrisma)
    return fromPrisma
  }

  return null
}

/**
 * List diagnostic journeys for an actor (email or accountId).
 * Uses Prisma for persistent journeys + in-memory for anonymous.
 */
export async function listDiagnosticJourneysForActor(params: {
  email?: string | null
  accountId?: string | null
  limit?: number
}): Promise<DiagnosticJourneyRecord[]> {
  const limit = params.limit ?? 20
  const results: DiagnosticJourneyRecord[] = []

  // In-memory matches
  for (const record of memoryStore.values()) {
    if (params.email && record.email === params.email) {
      results.push(record)
    } else if (params.accountId && record.accountId === params.accountId) {
      results.push(record)
    }
    if (results.length >= limit) return results
  }

  // Prisma matches
  const prisma = await getPrisma()
  if (prisma) {
    try {
      const where: Record<string, unknown> = {}
      if (params.email) where['email'] = params.email
      if (params.accountId) where['organisationKey'] = params.accountId

      if (Object.keys(where).length > 0) {
        const journeys = await prisma.diagnosticJourney.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          take: limit - results.length,
          include: {
            evidenceNodes: {
              where: { kind: 'engine_event' },
              orderBy: { createdAt: 'asc' },
            },
          },
        })

        for (const journey of journeys) {
          const caseId = journey.journeyKey
          if (results.some(r => r.caseId === caseId)) continue

          const events: DiagnosticJourneyEvent[] = journey.evidenceNodes.map(node => {
            const payload = (node.payload as Record<string, unknown>) ?? {}
            return {
              id: node.id,
              caseId,
              surface: (payload['surface'] as DiagnosticJourneySurface) ?? 'fast_diagnostic',
              type: (payload['eventType'] as DiagnosticJourneyEventType) ?? 'EVIDENCE_CAPTURED',
              occurredAt: node.createdAt.toISOString(),
              engineId: (payload['engineId'] as string) ?? undefined,
              engineVersion: (payload['engineVersion'] as string) ?? undefined,
              inputHash: (payload['inputHash'] as string) ?? undefined,
              summary: node.summary ?? node.label,
              payload: (payload['eventPayload'] as Record<string, unknown>) ?? {},
              audienceSafe: (payload['audienceSafe'] as boolean) ?? true,
            }
          })

          results.push({
            caseId,
            accountId: journey.organisationKey ?? null,
            email: journey.email ?? null,
            createdAt: journey.createdAt.toISOString(),
            updatedAt: journey.updatedAt.toISOString(),
            currentSurface: mapDiagnosticType(journey.diagnosticType) ?? 'fast_diagnostic',
            status: mapJourneyStatus(journey.status),
            events,
          })

          if (results.length >= limit) break
        }
      }
    } catch {
      // Prisma unavailable — return in-memory only
    }
  }

  return results.slice(0, limit)
}

/**
 * Clear in-memory store (for testing).
 */
export function _resetMemoryStore(): void {
  memoryStore.clear()
}
