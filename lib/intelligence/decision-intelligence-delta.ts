/**
 * lib/intelligence/decision-intelligence-delta.ts
 *
 * Computes a real before/after comparison between first-pass and second-pass
 * DecisionIntelligenceResult, so the system explains what actually changed
 * after progressive evidence was added.
 *
 * Rules:
 *   - Never fabricate changes.
 *   - Never claim a result changed unless the before/after values differ.
 *   - Never expose engine IDs.
 */

import type { DecisionIntelligenceResult } from '@/lib/intelligence/decision-intelligence-orchestrator'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PreviousDecisionIntelligenceSnapshot = {
  situationRead?: string
  interpretedIssue?: string
  primaryContradiction?: string | null
  authorityState?: string | null
  evidenceState?: string
  consequenceState?: string | null
  nextAdmissibleMove?: string
  unresolvedItems?: string[]
  confidence?: 'LOW' | 'MEDIUM' | 'HIGH'
}

export type DecisionIntelligenceDeltaField =
  | 'situationRead'
  | 'interpretedIssue'
  | 'primaryContradiction'
  | 'authorityState'
  | 'evidenceState'
  | 'consequenceState'
  | 'nextAdmissibleMove'
  | 'unresolvedItems'
  | 'confidence'

export type DecisionIntelligenceDeltaChange = {
  field: DecisionIntelligenceDeltaField
  before?: string | string[] | null
  after?: string | string[] | null
  significance: 'LOW' | 'MEDIUM' | 'HIGH'
  summary: string
}

export type DecisionIntelligenceDelta = {
  changedFields: DecisionIntelligenceDeltaChange[]
  headline: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalise a string value for comparison: trim whitespace, collapse internal
 * whitespace, and convert null/undefined to empty string.
 */
function normaliseString(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value).trim().replace(/\s+/g, ' ')
  return str
}

/**
 * Check if two arrays have the same content as sets (order-independent,
 * case-insensitive, whitespace-normalised).
 */
function arraySetsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const normalisedA = a.map(v => normaliseString(v).toLowerCase())
  const normalisedB = new Set(b.map(v => normaliseString(v).toLowerCase()))
  return normalisedA.every(v => normalisedB.has(v))
}

/**
 * Compare two values and return a significance level.
 */
function compareField(
  field: DecisionIntelligenceDeltaField,
  before: unknown,
  after: unknown,
): { changed: boolean; significance: 'LOW' | 'MEDIUM' | 'HIGH'; summary: string } {
  // Normalise strings first — catches whitespace/case-only differences
  const beforeStr = normaliseString(before)
  const afterStr = normaliseString(after)

  // Normalised string comparison
  if (beforeStr === afterStr) {
    return { changed: false, significance: 'LOW', summary: 'No change.' }
  }

  // Compare arrays (unresolvedItems) as normalised sets — order-independent
  if (Array.isArray(before) && Array.isArray(after)) {
    const beforeNormalised = before.map(v => normaliseString(v)).filter(v => v.length > 0)
    const afterNormalised = after.map(v => normaliseString(v)).filter(v => v.length > 0)

    if (arraySetsEqual(beforeNormalised, afterNormalised)) {
      return { changed: false, significance: 'LOW', summary: 'No change.' }
    }

    const resolved = beforeNormalised.filter(v => !afterNormalised.includes(v))
    const added = afterNormalised.filter(v => !beforeNormalised.includes(v))
    const parts: string[] = []
    if (resolved.length > 0) parts.push(`${resolved.length} item(s) resolved`)
    if (added.length > 0) parts.push(`${added.length} item(s) added`)
    const summary = parts.length > 0 ? parts.join('; ') : 'Unresolved items changed.'
    const significance = resolved.length > 0 ? 'HIGH' : 'MEDIUM'
    return { changed: true, significance, summary }
  }

  // If one is array and other isn't, they're different
  if (Array.isArray(before) !== Array.isArray(after)) {
    return { changed: true, significance: 'MEDIUM', summary: 'Type of value changed.' }
  }

  // Determine significance based on field type
  let significance: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM'
  let summary = ''

  switch (field) {
    case 'nextAdmissibleMove':
      significance = 'HIGH'
      summary = `The next admissible move changed: from "${beforeStr.slice(0, 60)}" to "${afterStr.slice(0, 60)}".`
      break
    case 'primaryContradiction':
      significance = 'HIGH'
      if (!beforeStr && afterStr) {
        summary = 'A contradiction was detected that was not visible before.'
      } else if (beforeStr && !afterStr) {
        summary = 'The previously detected contradiction has been resolved.'
      } else {
        summary = 'The primary contradiction has shifted.'
      }
      break
    case 'authorityState':
      significance = 'HIGH'
      if (!beforeStr && afterStr) {
        summary = `Authority is now more specific: ${afterStr.slice(0, 80)}.`
      } else if (beforeStr && !afterStr) {
        summary = 'Authority is no longer a specific blocker.'
      } else {
        summary = 'The authority assessment has changed.'
      }
      break
    case 'evidenceState':
      significance = 'MEDIUM'
      summary = `Evidence assessment changed: "${beforeStr.slice(0, 60)}" → "${afterStr.slice(0, 60)}".`
      break
    case 'consequenceState':
      significance = 'MEDIUM'
      if (!beforeStr && afterStr) {
        summary = 'A consequence was identified that was not visible before.'
      } else {
        summary = 'The consequence assessment has changed.'
      }
      break
    case 'confidence':
      significance = 'MEDIUM'
      summary = `Confidence changed from ${beforeStr} to ${afterStr}.`
      break
    case 'situationRead':
    case 'interpretedIssue':
      significance = 'LOW'
      summary = 'The interpretation has been refined.'
      break
    default:
      significance = 'LOW'
      summary = `${field.replace(/([A-Z])/g, ' $1').toLowerCase()} changed.`
  }

  return { changed: true, significance, summary }
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

/**
 * Derive a decision intelligence delta by comparing a previous snapshot
 * with the current result.
 *
 * @param params.previous - Client-safe snapshot from the first pass (or null)
 * @param params.current - Full DecisionIntelligenceResult from the second pass
 * @param params.answeredField - The field key that was answered (for context)
 * @returns DecisionIntelligenceDelta or null if no previous snapshot exists
 */
export function deriveDecisionIntelligenceDelta(params: {
  previous?: PreviousDecisionIntelligenceSnapshot | null
  current: DecisionIntelligenceResult
  answeredField?: string
}): DecisionIntelligenceDelta | null {
  if (!params.previous) return null

  const changes: DecisionIntelligenceDeltaChange[] = []
  const current = params.current

  // Compare each tracked field
  const comparisons: Array<{
    field: DecisionIntelligenceDeltaField
    before: unknown
    after: unknown
  }> = [
    { field: 'situationRead', before: params.previous.situationRead, after: current.situationRead },
    { field: 'interpretedIssue', before: params.previous.interpretedIssue, after: current.interpretedIssue },
    { field: 'primaryContradiction', before: params.previous.primaryContradiction, after: current.primaryContradiction },
    { field: 'authorityState', before: params.previous.authorityState, after: current.authorityState },
    { field: 'evidenceState', before: params.previous.evidenceState, after: current.evidenceState },
    { field: 'consequenceState', before: params.previous.consequenceState, after: current.consequenceState },
    { field: 'nextAdmissibleMove', before: params.previous.nextAdmissibleMove, after: current.nextAdmissibleMove },
    { field: 'unresolvedItems', before: params.previous.unresolvedItems, after: current.unresolvedItems },
    { field: 'confidence', before: params.previous.confidence, after: current.confidence },
  ]

  for (const comp of comparisons) {
    const result = compareField(comp.field, comp.before, comp.after)
    if (result.changed) {
      changes.push({
        field: comp.field,
        before: comp.before as string | string[] | null | undefined,
        after: comp.after as string | string[] | null | undefined,
        significance: result.significance,
        summary: result.summary,
      })
    }
  }

  // Build headline
  let headline: string
  if (changes.length === 0) {
    headline = 'The system incorporated the evidence, but the core judgement did not materially change.'
    const fieldLabel = params.answeredField?.replace(/_/g, ' ') ?? 'input'
    headline += ` The remaining gap is still ${fieldLabel} clarity.`
  } else {
    const highChanges = changes.filter(c => c.significance === 'HIGH')
    if (highChanges.length > 0 && highChanges[0]) {
      headline = highChanges[0].summary
    } else {
      headline = `${changes.length} aspect(s) of the reading changed.`
    }
  }

  return {
    changedFields: changes,
    headline,
  }
}