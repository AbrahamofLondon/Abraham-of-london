/**
 * lib/product/diagnostic-journey-record.ts
 *
 * Canonical contract for the Diagnostic Journey Record.
 *
 * This is the engine-readable event ledger that tracks every engine decision,
 * signal, contradiction, simulation, and synthesis across a case lifecycle.
 *
 * Rules:
 *   - Persist engine-readable facts, not presentation output.
 *   - Never expose raw private payload directly to clients.
 *   - audienceSafe must be respected everywhere.
 *   - inputHash preferred over raw text where possible.
 *   - UI must be derived from memory, not stored as memory.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DiagnosticJourneySurface =
  | 'free_signal'
  | 'fast_diagnostic'
  | 'purpose_alignment'
  | 'constitutional_diagnostic'
  | 'team_assessment'
  | 'enterprise_assessment'
  | 'executive_reporting'
  | 'strategy_room'
  | 'oversight'

export type DiagnosticJourneyEventType =
  | 'USER_INPUT_CAPTURED'
  | 'SITUATION_TRANSLATED'
  | 'LENSES_RUN'
  | 'CONTRADICTION_DETECTED'
  | 'SIMULATION_RUN'
  | 'SYNTHESIS_GENERATED'
  | 'REFUSAL_ISSUED'
  | 'EVIDENCE_CAPTURED'
  | 'MEMORY_ITEM_CREATED'
  | 'ACTION_RECOMMENDED'
  | 'CHECKPOINT_CREATED'
  | 'OUTCOME_REPORTED'
  | 'ROUTE_CHANGED'
  | 'ESCALATION_RECOMMENDED'
  | 'DRIFT_DETECTED'

export type DiagnosticJourneyEvent = {
  id: string
  caseId: string
  surface: DiagnosticJourneySurface
  type: DiagnosticJourneyEventType
  occurredAt: string
  engineId?: string
  engineVersion?: string
  inputHash?: string
  summary: string
  payload: Record<string, unknown>
  audienceSafe: boolean
}

export type DiagnosticJourneyStatus =
  | 'ACTIVE'
  | 'PAUSED'
  | 'ESCALATED'
  | 'RESOLVED'
  | 'STALE'

export type DiagnosticJourneyRecord = {
  caseId: string
  accountId?: string | null
  email?: string | null
  createdAt: string
  updatedAt: string
  currentSurface: DiagnosticJourneySurface
  status: DiagnosticJourneyStatus
  events: DiagnosticJourneyEvent[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Hash raw user input to a deterministic short string.
 * Used as inputHash so raw text need not be repeated in every event.
 */
export function hashInput(raw: string): string {
  let hash = 0
  for (let i = 0; i < raw.length; i++) {
    const ch = raw.charCodeAt(i)
    hash = ((hash << 5) - hash + ch) | 0
  }
  return `inp_${Math.abs(hash).toString(36)}`
}

/**
 * Create an empty DiagnosticJourneyRecord.
 */
export function createDiagnosticJourneyRecord(params: {
  caseId: string
  surface: DiagnosticJourneySurface
  email?: string | null
  accountId?: string | null
}): DiagnosticJourneyRecord {
  const now = new Date().toISOString()
  return {
    caseId: params.caseId,
    accountId: params.accountId ?? null,
    email: params.email ?? null,
    createdAt: now,
    updatedAt: now,
    currentSurface: params.surface,
    status: 'ACTIVE',
    events: [],
  }
}

/**
 * Create a DiagnosticJourneyEvent.
 */
export function createJourneyEvent(params: {
  caseId: string
  surface: DiagnosticJourneySurface
  type: DiagnosticJourneyEventType
  engineId?: string
  engineVersion?: string
  inputHash?: string
  summary: string
  payload?: Record<string, unknown>
  audienceSafe?: boolean
}): DiagnosticJourneyEvent {
  return {
    id: `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    caseId: params.caseId,
    surface: params.surface,
    type: params.type,
    occurredAt: new Date().toISOString(),
    engineId: params.engineId,
    engineVersion: params.engineVersion,
    inputHash: params.inputHash,
    summary: params.summary,
    payload: params.payload ?? {},
    audienceSafe: params.audienceSafe ?? true,
  }
}

/**
 * Filter events to only those safe for client display.
 */
export function getAudienceSafeEvents(
  record: DiagnosticJourneyRecord,
): DiagnosticJourneyEvent[] {
  return record.events.filter(e => e.audienceSafe)
}

/**
 * Get the latest event of a given type.
 */
export function getLatestEventOfType(
  record: DiagnosticJourneyRecord,
  type: DiagnosticJourneyEventType,
): DiagnosticJourneyEvent | null {
  for (let i = record.events.length - 1; i >= 0; i--) {
    if (record.events[i]!.type === type) return record.events[i]!
  }
  return null
}

/**
 * Count events by type.
 */
export function countEventsByType(
  record: DiagnosticJourneyRecord,
): Record<DiagnosticJourneyEventType, number> {
  const counts = {} as Record<DiagnosticJourneyEventType, number>
  for (const event of record.events) {
    counts[event.type] = (counts[event.type] ?? 0) + 1
  }
  return counts
}

/**
 * Get all engine IDs that have produced events.
 */
export function getActiveEngineIds(
  record: DiagnosticJourneyRecord,
): string[] {
  const ids = new Set<string>()
  for (const event of record.events) {
    if (event.engineId) ids.add(event.engineId)
  }
  return [...ids]
}

/**
 * Check if a journey has enough history for signal continuity derivation.
 */
export function hasSignalContinuityData(
  record: DiagnosticJourneyRecord,
): boolean {
  return record.events.some(
    e => e.type === 'SITUATION_TRANSLATED' || e.type === 'LENSES_RUN' || e.type === 'EVIDENCE_CAPTURED',
  )
}

/**
 * Check if a journey has enough history for governed memory presentation.
 */
export function hasGovernedMemoryData(
  record: DiagnosticJourneyRecord,
): boolean {
  return record.events.filter(
    e => e.type === 'EVIDENCE_CAPTURED' || e.type === 'MEMORY_ITEM_CREATED',
  ).length >= 1
}

/**
 * Extract all signals from journey events for continuity derivation.
 */
export function extractSignalsFromJourney(
  record: DiagnosticJourneyRecord,
): Array<{ signalKey: string; severity: number; sourceStage: string; occurredAt: string }> {
  const signals: Array<{ signalKey: string; severity: number; sourceStage: string; occurredAt: string }> = []

  for (const event of record.events) {
    if (event.type === 'SITUATION_TRANSLATED' && event.payload['detectedSignals']) {
      const detected = event.payload['detectedSignals'] as Array<{ label: string; severity?: string }>
      for (const s of detected) {
        signals.push({
          signalKey: s.label,
          severity: s.severity === 'CRITICAL' ? 1 : s.severity === 'HIGH' ? 0.75 : s.severity === 'MEDIUM' ? 0.5 : 0.25,
          sourceStage: event.surface,
          occurredAt: event.occurredAt,
        })
      }
    }

    if (event.type === 'LENSES_RUN' && event.payload['findings']) {
      const findings = event.payload['findings'] as Array<{ label: string; severity: string }>
      for (const f of findings) {
        signals.push({
          signalKey: f.label,
          severity: f.severity === 'CRITICAL' ? 1 : f.severity === 'HIGH' ? 0.75 : f.severity === 'MEDIUM' ? 0.5 : 0.25,
          sourceStage: event.surface,
          occurredAt: event.occurredAt,
        })
      }
    }
  }

  return signals
}

/**
 * Extract all contradictions from journey events.
 */
export function extractContradictionsFromJourney(
  record: DiagnosticJourneyRecord,
): Array<{ contradiction: string; severity: string; occurredAt: string }> {
  const contradictions: Array<{ contradiction: string; severity: string; occurredAt: string }> = []

  for (const event of record.events) {
    if (event.type === 'CONTRADICTION_DETECTED' && event.payload['contradictions']) {
      const items = event.payload['contradictions'] as Array<{ summary: string; severity: string }>
      for (const c of items) {
        contradictions.push({
          contradiction: c.summary,
          severity: c.severity,
          occurredAt: event.occurredAt,
        })
      }
    }
  }

  return contradictions
}
