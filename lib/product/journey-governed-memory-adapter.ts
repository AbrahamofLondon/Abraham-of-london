/**
 * lib/product/journey-governed-memory-adapter.ts
 *
 * Adapts DiagnosticJourneyRecord engine events into GovernedMemoryItem[]
 * for the Decision Centre and Strategy Room governed memory panels.
 *
 * Rules:
 *   - Only uses audience-safe events.
 *   - Never exposes raw event payloads.
 *   - Confidence labels reflect actual evidence quality, not persistence.
 *   - VERIFIED only for verified outcomes, not for mere existence.
 */

import type { DiagnosticJourneyRecord, DiagnosticJourneyEvent } from '@/lib/product/diagnostic-journey-record'
import { getAudienceSafeEvents } from '@/lib/product/diagnostic-journey-record'
import type {
  GovernedMemoryItem,
  GovernedMemorySourceSurface,
  GovernedMemoryEvidenceOrigin,
  GovernedMemoryStatus,
  GovernedMemoryConfidenceLabel,
} from '@/lib/product/governed-memory-contract'

// ---------------------------------------------------------------------------
// Surface mapping
// ---------------------------------------------------------------------------

function mapSurface(surface: string): GovernedMemorySourceSurface {
  const map: Record<string, GovernedMemorySourceSurface> = {
    free_signal: 'FAST_DIAGNOSTIC',
    fast_diagnostic: 'FAST_DIAGNOSTIC',
    purpose_alignment: 'PURPOSE_ALIGNMENT',
    constitutional_diagnostic: 'FAST_DIAGNOSTIC',
    team_assessment: 'TEAM_ASSESSMENT',
    enterprise_assessment: 'ENTERPRISE_ASSESSMENT',
    executive_reporting: 'EXECUTIVE_REPORTING',
    strategy_room: 'STRATEGY_ROOM',
    oversight: 'OVERSIGHT_BRIEF',
  }
  return map[surface] ?? 'DECISION_CENTRE'
}

// ---------------------------------------------------------------------------
// Event → Memory item mapping
// ---------------------------------------------------------------------------

type EventMapping = {
  label: string
  origin: GovernedMemoryEvidenceOrigin
  status: GovernedMemoryStatus
  confidence: GovernedMemoryConfidenceLabel
}

const EVENT_MAPPINGS: Record<string, EventMapping> = {
  SITUATION_TRANSLATED: {
    label: 'Situation captured',
    origin: 'SELF_REPORTED',
    status: 'ACTIVE',
    confidence: 'CAPTURED',
  },
  LENSES_RUN: {
    label: 'Lens analysis completed',
    origin: 'SYSTEM_COMPUTED',
    status: 'ACTIVE',
    confidence: 'CAPTURED',
  },
  CONTRADICTION_DETECTED: {
    label: 'Contradiction detected',
    origin: 'SYSTEM_COMPUTED',
    status: 'UNRESOLVED',
    confidence: 'CAPTURED',
  },
  SIMULATION_RUN: {
    label: 'Simulation completed',
    origin: 'SYSTEM_COMPUTED',
    status: 'ACTIVE',
    confidence: 'CAPTURED',
  },
  SYNTHESIS_GENERATED: {
    label: 'Synthesis generated',
    origin: 'SYSTEM_COMPUTED',
    status: 'ACTIVE',
    confidence: 'CAPTURED',
  },
  ACTION_RECOMMENDED: {
    label: 'Action recommended',
    origin: 'SYSTEM_COMPUTED',
    status: 'ACTIVE',
    confidence: 'CAPTURED',
  },
  REFUSAL_ISSUED: {
    label: 'Governance refusal',
    origin: 'SYSTEM_COMPUTED',
    status: 'ACTIVE',
    confidence: 'CAPTURED',
  },
  EVIDENCE_CAPTURED: {
    label: 'Evidence captured',
    origin: 'STRUCTURED_DIAGNOSTIC',
    status: 'ACTIVE',
    confidence: 'CAPTURED',
  },
  OUTCOME_REPORTED: {
    label: 'Outcome reported',
    origin: 'VERIFIED_OUTCOME',
    status: 'RESOLVED',
    confidence: 'CHECKED',
  },
}

function mapEventToMemoryItem(
  event: DiagnosticJourneyEvent,
  caseId: string,
): GovernedMemoryItem | null {
  const mapping = EVENT_MAPPINGS[event.type]
  if (!mapping) return null

  return {
    id: `jrn_${event.id}`,
    label: mapping.label,
    summary: event.summary,
    sourceSurface: mapSurface(event.surface),
    capturedAt: event.occurredAt,
    evidenceOrigin: mapping.origin,
    status: mapping.status,
    confidenceLabel: mapping.confidence,
    audienceSafe: true,
    relatedCaseId: caseId,
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build governed memory items from a DiagnosticJourneyRecord.
 * Only uses audience-safe events. Never exposes raw payloads.
 */
export function buildGovernedMemoryFromJourney(
  record: DiagnosticJourneyRecord,
): GovernedMemoryItem[] {
  const safeEvents = getAudienceSafeEvents(record)
  const items: GovernedMemoryItem[] = []

  for (const event of safeEvents) {
    const item = mapEventToMemoryItem(event, record.caseId)
    if (item) items.push(item)
  }

  return items
}

/**
 * Build a single summary memory item for a journey.
 * Useful for condensed views.
 */
export function buildJourneySummaryMemoryItem(
  record: DiagnosticJourneyRecord,
): GovernedMemoryItem {
  const safeEvents = getAudienceSafeEvents(record)
  const contradictions = safeEvents.filter(e => e.type === 'CONTRADICTION_DETECTED').length
  const hasOutcome = safeEvents.some(e => e.type === 'OUTCOME_REPORTED')

  return {
    id: `jrn_summary_${record.caseId}`,
    label: 'Journey intelligence summary',
    summary: contradictions > 0
      ? `${safeEvents.length} engine events tracked, ${contradictions} unresolved contradiction(s)`
      : `${safeEvents.length} engine events tracked across ${record.currentSurface}`,
    sourceSurface: mapSurface(record.currentSurface),
    capturedAt: record.updatedAt,
    evidenceOrigin: 'SYSTEM_COMPUTED',
    status: hasOutcome ? 'RESOLVED' : 'ACTIVE',
    confidenceLabel: hasOutcome ? 'CHECKED' : 'CAPTURED',
    audienceSafe: true,
    relatedCaseId: record.caseId,
  }
}
