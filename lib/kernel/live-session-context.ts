/**
 * lib/kernel/live-session-context.ts — Live Session Context
 *
 * Tracks what the system knows about a decision across multiple turns.
 * Accumulates actors, signals, ambiguities, hidden stakes, and accepted/rejected
 * assumptions. Detects what changed between turns.
 *
 * This is the memory layer for the Living Case Loop.
 * Not a chat log — a governed case state that evolves with each turn.
 */

import type { PublicSituationTranslation } from '@/lib/kernel/public-situation-translation'

// ─── Types ───────────────────────────────────────────────────────────────────

export type LiveSessionTurnRole = 'user' | 'system'

export type LiveSessionTurn = {
  id: string
  role: LiveSessionTurnRole
  content: string
  createdAt: string
}

export type LiveSessionSignal = {
  key: string
  label: string
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  firstSeenTurnId: string
  lastSeenTurnId: string
  occurrences: number
}

export type LiveSessionActor = {
  name: string
  role?: string
  firstSeenTurnId: string
  lastSeenTurnId: string
  occurrences: number
}

export type LiveSessionDelta = {
  newActors: string[]
  removedActors: string[]
  repeatedActors: string[]
  newSignals: string[]
  repeatedSignals: string[]
  newAmbiguities: string[]
  resolvedAmbiguities: string[]
  newlyDetectedHiddenStakes: string[]
  pressureChanged: boolean
  summary: string
}

export type LiveSessionContext = {
  sessionId: string
  caseId?: string
  createdAt: string
  updatedAt: string
  turns: LiveSessionTurn[]
  actors: LiveSessionActor[]
  signals: LiveSessionSignal[]
  ambiguities: string[]
  hiddenStakes: string[]
  acceptedAssumptions: string[]
  rejectedAssumptions: string[]
  currentSummary: string
  lastDelta?: LiveSessionDelta
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

let turnCounter = 0

function nextTurnId(): string {
  turnCounter++
  return `turn-${turnCounter}-${Date.now()}`
}

function now(): string {
  return new Date().toISOString()
}

function generateSessionId(): string {
  return `live-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

// ─── Create ──────────────────────────────────────────────────────────────────

export function createLiveSessionContext(params: {
  sessionId?: string
  caseId?: string
  initialInput?: string
}): LiveSessionContext {
  const sessionId = params.sessionId ?? generateSessionId()
  const turns: LiveSessionTurn[] = []

  if (params.initialInput) {
    turns.push({
      id: nextTurnId(),
      role: 'user',
      content: params.initialInput,
      createdAt: now(),
    })
  }

  return {
    sessionId,
    caseId: params.caseId,
    createdAt: now(),
    updatedAt: now(),
    turns,
    actors: [],
    signals: [],
    ambiguities: [],
    hiddenStakes: [],
    acceptedAssumptions: [],
    rejectedAssumptions: [],
    currentSummary: '',
  }
}

// ─── Append user turn ────────────────────────────────────────────────────────

export function appendUserTurn(params: {
  context: LiveSessionContext
  input: string
  translation: PublicSituationTranslation
}): LiveSessionContext {
  const { context, input, translation } = params
  const turnId = nextTurnId()
  const timestamp = now()

  // Preserve previous state for delta computation
  const prevActorNames = context.actors.map(a => a.name.toLowerCase())
  const prevSignalKeys = context.signals.map(s => s.key)
  const prevAmbiguities = [...context.ambiguities]
  const prevHiddenStakes = [...context.hiddenStakes]

  // ── Merge actors ────────────────────────────────────────────────────────
  const mergedActors: LiveSessionActor[] = [...context.actors]
  for (const actorName of translation.actors) {
    const existing = mergedActors.find(a => a.name.toLowerCase() === actorName.toLowerCase())
    if (existing) {
      existing.lastSeenTurnId = turnId
      existing.occurrences++
    } else {
      mergedActors.push({
        name: actorName,
        firstSeenTurnId: turnId,
        lastSeenTurnId: turnId,
        occurrences: 1,
      })
    }
  }

  // ── Merge signals ───────────────────────────────────────────────────────
  const mergedSignals: LiveSessionSignal[] = [...context.signals]
  for (const signal of translation.detectedSignals) {
    const existing = mergedSignals.find(s => s.key === signal.value)
    if (existing) {
      existing.lastSeenTurnId = turnId
      existing.occurrences++
    } else {
      mergedSignals.push({
        key: signal.value,
        label: signal.label,
        severity: signal.severity,
        firstSeenTurnId: turnId,
        lastSeenTurnId: turnId,
        occurrences: 1,
      })
    }
  }

  // ── Merge ambiguities ───────────────────────────────────────────────────
  // New ambiguities from this turn
  const mergedAmbiguities = [...context.ambiguities]
  for (const amb of translation.ambiguities) {
    if (!mergedAmbiguities.includes(amb)) {
      mergedAmbiguities.push(amb)
    }
  }
  // Remove ambiguities that are no longer present (resolved by new input)
  const resolvedAmbiguities = prevAmbiguities.filter(a => !translation.ambiguities.includes(a))
  const activeAmbiguities = mergedAmbiguities.filter(a => !resolvedAmbiguities.includes(a))

  // ── Merge hidden stakes ─────────────────────────────────────────────────
  const mergedHiddenStakes = [...context.hiddenStakes]
  for (const hs of translation.hiddenStakes) {
    if (!mergedHiddenStakes.includes(hs)) {
      mergedHiddenStakes.push(hs)
    }
  }

  // ── Compute delta ───────────────────────────────────────────────────────
  const currentActorNames = mergedActors.map(a => a.name.toLowerCase())
  const currentSignalKeys = mergedSignals.map(s => s.key)

  const newActors = currentActorNames.filter(a => !prevActorNames.includes(a))
  const removedActors = prevActorNames.filter(a => !currentActorNames.includes(a))
  const repeatedActors = currentActorNames.filter(a => prevActorNames.includes(a) && translation.actors.some(ta => ta.toLowerCase() === a))

  const newSignals = currentSignalKeys.filter(s => !prevSignalKeys.includes(s))
  const repeatedSignals = currentSignalKeys.filter(s => prevSignalKeys.includes(s) && translation.detectedSignals.some(ds => ds.value === s))

  const newAmbiguitiesList = translation.ambiguities.filter(a => !prevAmbiguities.includes(a))
  const newlyDetectedHiddenStakes = translation.hiddenStakes.filter(h => !prevHiddenStakes.includes(h))

  // Build delta summary
  const summaryParts: string[] = []
  if (newActors.length > 0) {
    summaryParts.push(`new actors introduced: ${newActors.join(', ')}`)
  }
  if (removedActors.length > 0) {
    summaryParts.push(`actors no longer mentioned: ${removedActors.join(', ')}`)
  }
  if (repeatedActors.length > 0) {
    summaryParts.push(`${repeatedActors[0]} mentioned again`)
  }
  if (newSignals.length > 0) {
    summaryParts.push(`new signals detected: ${newSignals.map(s => {
      const sig = mergedSignals.find(sg => sg.key === s)
      return sig?.label ?? s
    }).join(', ')}`)
  }
  if (resolvedAmbiguities.length > 0) {
    summaryParts.push(`ambiguity resolved: ${resolvedAmbiguities.length} area(s) now clearer`)
  }
  if (newlyDetectedHiddenStakes.length > 0) {
    summaryParts.push(`possible hidden stake surfaced`)
  }

  const delta: LiveSessionDelta = {
    newActors,
    removedActors,
    repeatedActors,
    newSignals,
    repeatedSignals,
    newAmbiguities: newAmbiguitiesList,
    resolvedAmbiguities,
    newlyDetectedHiddenStakes,
    pressureChanged: false,
    summary: summaryParts.length > 0
      ? summaryParts.join('; ') + '.'
      : 'No significant change detected.',
  }

  // ── Build new context ───────────────────────────────────────────────────
  return {
    ...context,
    updatedAt: timestamp,
    turns: [
      ...context.turns,
      { id: turnId, role: 'user', content: input, createdAt: timestamp },
    ],
    actors: mergedActors,
    signals: mergedSignals,
    ambiguities: activeAmbiguities,
    hiddenStakes: mergedHiddenStakes,
    currentSummary: translation.situationSummary,
    lastDelta: delta,
  }
}

// ─── Append system turn ──────────────────────────────────────────────────────

export function appendSystemTurn(params: {
  context: LiveSessionContext
  content: string
}): LiveSessionContext {
  const { context, content } = params
  const turnId = nextTurnId()
  const timestamp = now()

  return {
    ...context,
    updatedAt: timestamp,
    turns: [
      ...context.turns,
      { id: turnId, role: 'system', content, createdAt: timestamp },
    ],
  }
}
