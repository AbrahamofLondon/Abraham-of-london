/**
 * lib/intelligence/constitutional-orchestrator-adapter.ts
 *
 * Adapts real constitutional report/decision/routeSummary output into
 * the shape expected by the DecisionIntelligenceOrchestrator's Layer 4.
 *
 * When constitutional_diagnostic surface provides diagnosticResult with
 * real constitutional output, this adapter extracts structured data instead
 * of relying on regex heuristics.
 */

export type ConstitutionalAdapterInput = {
  report?: Record<string, unknown>
  decision?: Record<string, unknown>
  routeSummary?: Record<string, unknown>
}

export type ConstitutionalAdapterResult = {
  constitutionalRoute: string | null
  constitutionalReadiness: string | null
  constitutionalPosture: string | null
  constitutionalAuthority: string | null
  failureModes: string[]
  disqualifiers: string[]
  escalationPermitted: boolean | null
}

/**
 * Check if diagnosticResult contains real constitutional output.
 */
export function hasConstitutionalOutput(diagnosticResult: unknown): diagnosticResult is ConstitutionalAdapterInput {
  if (!diagnosticResult || typeof diagnosticResult !== 'object') return false
  const obj = diagnosticResult as Record<string, unknown>
  return (
    (obj['report'] !== undefined && typeof obj['report'] === 'object') ||
    (obj['decision'] !== undefined && typeof obj['decision'] === 'object')
  )
}

/**
 * Extract constitutional assessment from real constitutional output.
 */
export function adaptConstitutionalOutput(input: ConstitutionalAdapterInput): ConstitutionalAdapterResult {
  const report = (input.report ?? {}) as Record<string, unknown>
  const decision = (input.decision ?? {}) as Record<string, unknown>
  const routeSummary = (input.routeSummary ?? {}) as Record<string, unknown>

  // Extract route from decision
  const route = extractString(decision, 'route') ?? extractString(routeSummary, 'route')

  // Extract confidence
  const confidence = extractString(decision, 'confidence')

  // Extract readiness from report scores or decision
  const readiness = deriveReadiness(report, decision)

  // Extract posture from report
  const posture = derivePosture(report)

  // Extract authority state
  const authority = deriveAuthority(report, decision)

  // Extract failure modes
  const failureModes = extractFailureModes(decision, report)

  // Extract disqualifiers
  const disqualifiers = extractDisqualifiers(decision)

  // Determine escalation
  const escalationPermitted = route === 'STRATEGY' || route === 'DIAGNOSTIC'

  return {
    constitutionalRoute: route,
    constitutionalReadiness: readiness,
    constitutionalPosture: posture,
    constitutionalAuthority: authority,
    failureModes,
    disqualifiers,
    escalationPermitted,
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function extractString(obj: Record<string, unknown>, key: string): string | null {
  const val = obj[key]
  return typeof val === 'string' && val.length > 0 ? val : null
}

function extractNumber(obj: Record<string, unknown>, key: string): number | null {
  const val = obj[key]
  return typeof val === 'number' ? val : null
}

function deriveReadiness(
  report: Record<string, unknown>,
  decision: Record<string, unknown>,
): string | null {
  const route = extractString(decision, 'route')
  const confidence = extractString(decision, 'confidence')

  if (route === 'STRATEGY' && confidence === 'HIGH') return 'EXECUTION_READY'
  if (route === 'STRATEGY') return 'STABILIZING'
  if (route === 'DIAGNOSTIC') return 'EMERGING'
  if (route === 'REJECT') return 'EMERGING'

  // Try to infer from report scores
  const authority = extractNumber(report, 'authority') ?? extractNumber(report, 'authorityScore')
  const coherence = extractNumber(report, 'coherence') ?? extractNumber(report, 'coherenceScore')
  if (authority !== null && coherence !== null) {
    if (authority > 7 && coherence > 7) return 'EXECUTION_READY'
    if (authority > 5 || coherence > 5) return 'STABILIZING'
    return 'EMERGING'
  }

  return null
}

function derivePosture(report: Record<string, unknown>): string | null {
  const pressure = extractNumber(report, 'pressure') ?? extractNumber(report, 'pressureScore')
  const friction = extractNumber(report, 'friction') ?? extractNumber(report, 'frictionScore')

  if (pressure !== null && friction !== null) {
    return (pressure > 6 || friction > 6) ? 'DRIFTING' : 'ORDERED'
  }

  return null
}

function deriveAuthority(
  report: Record<string, unknown>,
  decision: Record<string, unknown>,
): string | null {
  const authorityScore = extractNumber(report, 'authority') ?? extractNumber(report, 'authorityScore')
  const authorityType = extractString(decision, 'authorityType')

  if (authorityType) return authorityType
  if (authorityScore !== null) {
    return authorityScore > 6 ? 'CLEAR' : 'DEFERRED'
  }

  return null
}

function extractFailureModes(
  decision: Record<string, unknown>,
  report: Record<string, unknown>,
): string[] {
  const modes: string[] = []

  // From decision object
  const decisionModes = decision['failureModes']
  if (Array.isArray(decisionModes)) {
    for (const m of decisionModes) {
      if (typeof m === 'string') modes.push(m)
      else if (typeof m === 'object' && m !== null && 'label' in m) modes.push(String((m as Record<string, unknown>)['label']))
    }
  }

  // From decision interventions
  const interventions = decision['interventions']
  if (Array.isArray(interventions)) {
    for (const i of interventions) {
      if (typeof i === 'object' && i !== null && 'trigger' in i) {
        modes.push(String((i as Record<string, unknown>)['trigger']))
      }
    }
  }

  // From report scores — detect implicit failure modes
  const authority = extractNumber(report, 'authority') ?? extractNumber(report, 'authorityScore')
  const coherence = extractNumber(report, 'coherence') ?? extractNumber(report, 'coherenceScore')
  if (authority !== null && authority < 4 && !modes.some(m => m.includes('authority'))) {
    modes.push('authority_ambiguity')
  }
  if (coherence !== null && coherence < 4 && !modes.some(m => m.includes('coherence'))) {
    modes.push('narrative_incoherence')
  }

  return modes
}

function extractDisqualifiers(decision: Record<string, unknown>): string[] {
  const disqualifiers: string[] = []

  const raw = decision['disqualifiers']
  if (Array.isArray(raw)) {
    for (const d of raw) {
      if (typeof d === 'string') disqualifiers.push(d)
      else if (typeof d === 'object' && d !== null && 'label' in d) disqualifiers.push(String((d as Record<string, unknown>)['label']))
    }
  }

  return disqualifiers
}
