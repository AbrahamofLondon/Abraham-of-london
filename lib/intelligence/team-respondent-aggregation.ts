/**
 * lib/intelligence/team-respondent-aggregation.ts
 *
 * Aggregates multiple Team Assessment submissions under the same caseId
 * into cross-respondent divergence analysis.
 *
 * Rules:
 *   - respondentCount < 2 → no divergence claim.
 *   - respondentCount >= 2 → allow aggregate divergence analysis.
 *   - Never expose individual respondent raw text.
 *   - Never identify individual respondents in output.
 *   - Use aggregate-only language.
 *   - High variance in perceivedOwner → ownership divergence.
 *   - High variance in perceivedBlocker → blocker divergence.
 *   - Wide spread in authorityClarity → authority perception gap.
 *   - Wide spread in evidenceClarity → evidence confidence gap.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TeamRespondentInput = {
  respondentRole?: string
  perceivedDecision?: string
  perceivedOwner?: string
  perceivedBlocker?: string
  authorityClarity?: number
  evidenceClarity?: number
  executionConfidence?: number
  consequenceAwareness?: number
  leadershipAvoidanceSignal?: string
}

export type TeamRespondentAggregation = {
  /** Number of respondents included in this aggregation */
  respondentCount: number
  /** Distribution of roles across respondents (aggregate only) */
  roleDistribution: Record<string, number>
  /** Whether ownership divergence was detected */
  ownerVariance: {
    detected: boolean
    summary: string
    uniqueOwners: number
  }
  /** Whether blocker divergence was detected */
  blockerVariance: {
    detected: boolean
    summary: string
    uniqueBlockers: number
  }
  /** Whether decision-definition divergence was detected */
  decisionVariance: {
    detected: boolean
    summary: string
    uniqueDecisions: number
  }
  /** Spread of authority clarity scores */
  authorityClaritySpread: {
    detected: boolean
    summary: string
    min: number | null
    max: number | null
    spread: number | null
  }
  /** Spread of evidence clarity scores */
  evidenceClaritySpread: {
    detected: boolean
    summary: string
    min: number | null
    max: number | null
    spread: number | null
  }
  /** Spread of execution confidence scores */
  executionConfidenceSpread: {
    detected: boolean
    summary: string
    min: number | null
    max: number | null
    spread: number | null
  }
  /** Spread of consequence awareness scores */
  consequenceAwarenessSpread: {
    detected: boolean
    summary: string
    min: number | null
    max: number | null
    spread: number | null
  }
  /** Key disagreement themes identified across respondents */
  disagreementThemes: string[]
  /** Findings safe for aggregate-only output */
  aggregateOnlyFindings: string[]
  /** Privacy-safe summary for client-facing output */
  privacySafeSummary: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Threshold for "wide spread" in numeric scores (0-100) */
const WIDE_SPREAD_THRESHOLD = 25

/** Threshold for "moderate spread" */
const MODERATE_SPREAD_THRESHOLD = 15

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeRole(role: string): string {
  const r = role.trim().toLowerCase()
  if (/ceo|chief executive/i.test(r)) return 'executive'
  if (/cfo|chief financial/i.test(r)) return 'executive'
  if (/cto|chief technology|chief technical/i.test(r)) return 'executive'
  if (/coo|chief operating/i.test(r)) return 'executive'
  if (/director|head of/i.test(r)) return 'director'
  if (/manager|lead/i.test(r)) return 'manager'
  if (/board|chair/i.test(r)) return 'board'
  if (/consultant|advisor/i.test(r)) return 'advisor'
  if (/engineer|developer|analyst|associate/i.test(r)) return 'individual_contributor'
  return 'other'
}

function computeSpread(values: number[]): { min: number; max: number; spread: number } | null {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  return { min, max, spread: max - min }
}

function uniqueStrings(strings: (string | undefined)[]): string[] {
  return [...new Set(strings.filter((s): s is string => s !== undefined && s.trim().length > 0))]
}

// ---------------------------------------------------------------------------
// Aggregation function
// ---------------------------------------------------------------------------

/**
 * Aggregate multiple Team Assessment respondent inputs into cross-respondent
 * divergence analysis.
 *
 * @param params.caseId - The case identifier for grouping
 * @param params.responses - Array of respondent inputs to aggregate
 * @returns TeamRespondentAggregation with aggregate-only findings
 */
export function aggregateTeamRespondents(params: {
  caseId: string
  responses: TeamRespondentInput[]
}): TeamRespondentAggregation {
  const { responses } = params
  const count = responses.length

  // Default: insufficient respondents
  if (count < 2) {
    return {
      respondentCount: count,
      roleDistribution: {},
      ownerVariance: { detected: false, summary: 'Single respondent only; team divergence cannot yet be assessed.', uniqueOwners: 0 },
      blockerVariance: { detected: false, summary: 'Single respondent only; team divergence cannot yet be assessed.', uniqueBlockers: 0 },
      decisionVariance: {
        detected: false,
        summary: 'Single respondent only; decision-definition divergence cannot yet be assessed.',
        uniqueDecisions: 0,
      },
      authorityClaritySpread: { detected: false, summary: 'Single respondent only; team divergence cannot yet be assessed.', min: null, max: null, spread: null },
      evidenceClaritySpread: { detected: false, summary: 'Single respondent only; team divergence cannot yet be assessed.', min: null, max: null, spread: null },
      executionConfidenceSpread: { detected: false, summary: 'Single respondent only; team divergence cannot yet be assessed.', min: null, max: null, spread: null },
      consequenceAwarenessSpread: { detected: false, summary: 'Single respondent only; team divergence cannot yet be assessed.', min: null, max: null, spread: null },
      disagreementThemes: [],
      aggregateOnlyFindings: ['Single respondent only; team divergence cannot yet be assessed.'],
      privacySafeSummary: 'Single respondent only. Additional respondents are needed to assess team divergence.',
    }
  }

  // ── Role distribution ──────────────────────────────────────────────
  const roleDistribution: Record<string, number> = {}
  for (const r of responses) {
    if (r.respondentRole) {
      const normalized = normalizeRole(r.respondentRole)
      roleDistribution[normalized] = (roleDistribution[normalized] ?? 0) + 1
    }
  }

  // ── Owner variance ─────────────────────────────────────────────────
  const uniqueOwners = uniqueStrings(responses.map(r => r.perceivedOwner))
  const ownerVariance: TeamRespondentAggregation['ownerVariance'] = {
    detected: uniqueOwners.length > 1,
    summary: uniqueOwners.length > 1
      ? `${uniqueOwners.length} different owner(s) identified across ${count} respondent(s).`
      : `All ${count} respondent(s) identified the same owner.`,
    uniqueOwners: uniqueOwners.length,
  }

  // ── Blocker variance ───────────────────────────────────────────────
  const uniqueBlockers = uniqueStrings(responses.map(r => r.perceivedBlocker))
  const blockerVariance: TeamRespondentAggregation['blockerVariance'] = {
    detected: uniqueBlockers.length > 1,
    summary: uniqueBlockers.length > 1
      ? `${uniqueBlockers.length} different blocker(s) identified across ${count} respondent(s).`
      : `All ${count} respondent(s) identified the same blocker.`,
    uniqueBlockers: uniqueBlockers.length,
  }

  // ── Decision variance ──────────────────────────────────────────────
  const uniqueDecisions = new Set(
    responses
      .map(r => r.perceivedDecision?.trim().toLowerCase())
      .filter((d): d is string => Boolean(d)),
  )
  const decisionVariance = {
    detected: uniqueDecisions.size > 1,
    summary: uniqueDecisions.size > 1
      ? `${uniqueDecisions.size} different decision definition(s) identified across ${responses.length} respondent(s).`
      : responses.length < 2
        ? 'Single respondent only; decision-definition divergence cannot yet be assessed.'
        : 'Respondents describe the same decision.',
    uniqueDecisions: uniqueDecisions.size,
  }

  // ── Authority clarity spread ───────────────────────────────────────
  const authorityValues = responses.map(r => r.authorityClarity).filter((v): v is number => v !== undefined)
  const authoritySpread = computeSpread(authorityValues)
  const authorityClaritySpread: TeamRespondentAggregation['authorityClaritySpread'] = {
    detected: authoritySpread !== null && authoritySpread.spread >= WIDE_SPREAD_THRESHOLD,
    summary: authoritySpread !== null
      ? authoritySpread.spread >= WIDE_SPREAD_THRESHOLD
        ? `Wide spread in authority clarity (${authoritySpread.min}–${authoritySpread.max}, spread: ${authoritySpread.spread}). Respondents perceive authority differently.`
        : authoritySpread.spread >= MODERATE_SPREAD_THRESHOLD
          ? `Moderate spread in authority clarity (${authoritySpread.min}–${authoritySpread.max}, spread: ${authoritySpread.spread}). Some variation in authority perception.`
          : `Narrow spread in authority clarity (${authoritySpread.min}–${authoritySpread.max}, spread: ${authoritySpread.spread}). Respondents broadly agree on authority clarity.`
      : 'Authority clarity scores not available for comparison.',
    min: authoritySpread?.min ?? null,
    max: authoritySpread?.max ?? null,
    spread: authoritySpread?.spread ?? null,
  }

  // ── Evidence clarity spread ────────────────────────────────────────
  const evidenceValues = responses.map(r => r.evidenceClarity).filter((v): v is number => v !== undefined)
  const evidenceSpread = computeSpread(evidenceValues)
  const evidenceClaritySpread: TeamRespondentAggregation['evidenceClaritySpread'] = {
    detected: evidenceSpread !== null && evidenceSpread.spread >= WIDE_SPREAD_THRESHOLD,
    summary: evidenceSpread !== null
      ? evidenceSpread.spread >= WIDE_SPREAD_THRESHOLD
        ? `Wide spread in evidence confidence (${evidenceSpread.min}–${evidenceSpread.max}, spread: ${evidenceSpread.spread}). Evidence perception varies significantly across respondents.`
        : evidenceSpread.spread >= MODERATE_SPREAD_THRESHOLD
          ? `Moderate spread in evidence confidence (${evidenceSpread.min}–${evidenceSpread.max}, spread: ${evidenceSpread.spread}). Some variation in evidence perception.`
          : `Narrow spread in evidence confidence (${evidenceSpread.min}–${evidenceSpread.max}, spread: ${evidenceSpread.spread}). Respondents broadly agree on evidence quality.`
      : 'Evidence clarity scores not available for comparison.',
    min: evidenceSpread?.min ?? null,
    max: evidenceSpread?.max ?? null,
    spread: evidenceSpread?.spread ?? null,
  }

  // ── Execution confidence spread ────────────────────────────────────
  const executionValues = responses.map(r => r.executionConfidence).filter((v): v is number => v !== undefined)
  const executionSpread = computeSpread(executionValues)
  const executionConfidenceSpread: TeamRespondentAggregation['executionConfidenceSpread'] = {
    detected: executionSpread !== null && executionSpread.spread >= WIDE_SPREAD_THRESHOLD,
    summary: executionSpread !== null
      ? executionSpread.spread >= WIDE_SPREAD_THRESHOLD
        ? `Wide spread in execution confidence (${executionSpread.min}–${executionSpread.max}, spread: ${executionSpread.spread}). Confidence in execution varies significantly.`
        : executionSpread.spread >= MODERATE_SPREAD_THRESHOLD
          ? `Moderate spread in execution confidence (${executionSpread.min}–${executionSpread.max}, spread: ${executionSpread.spread}). Some variation in execution confidence.`
          : `Narrow spread in execution confidence (${executionSpread.min}–${executionSpread.max}, spread: ${executionSpread.spread}). Respondents broadly agree on execution capability.`
      : 'Execution confidence scores not available for comparison.',
    min: executionSpread?.min ?? null,
    max: executionSpread?.max ?? null,
    spread: executionSpread?.spread ?? null,
  }

  // ── Consequence awareness spread ───────────────────────────────────
  const consequenceValues = responses.map(r => r.consequenceAwareness).filter((v): v is number => v !== undefined)
  const consequenceSpread = computeSpread(consequenceValues)
  const consequenceAwarenessSpread: TeamRespondentAggregation['consequenceAwarenessSpread'] = {
    detected: consequenceSpread !== null && consequenceSpread.spread >= WIDE_SPREAD_THRESHOLD,
    summary: consequenceSpread !== null
      ? consequenceSpread.spread >= WIDE_SPREAD_THRESHOLD
        ? `Wide spread in consequence awareness (${consequenceSpread.min}-${consequenceSpread.max}, spread: ${consequenceSpread.spread}). Respondents perceive consequences differently.`
        : consequenceSpread.spread >= MODERATE_SPREAD_THRESHOLD
          ? `Moderate spread in consequence awareness (${consequenceSpread.min}-${consequenceSpread.max}, spread: ${consequenceSpread.spread}). Some variation in consequence perception.`
          : `Narrow spread in consequence awareness (${consequenceSpread.min}-${consequenceSpread.max}, spread: ${consequenceSpread.spread}). Respondents broadly agree on consequence awareness.`
      : 'Consequence awareness scores not available for comparison.',
    min: consequenceSpread?.min ?? null,
    max: consequenceSpread?.max ?? null,
    spread: consequenceSpread?.spread ?? null,
  }

  // ── Disagreement themes ────────────────────────────────────────────
  const disagreementThemes: string[] = []
  if (ownerVariance.detected) {
    disagreementThemes.push(`Ownership divergence: respondents identified ${uniqueOwners.length} different owner(s).`)
  }
  if (blockerVariance.detected) {
    disagreementThemes.push(`Blocker divergence: respondents identified ${uniqueBlockers.length} different blocker(s).`)
  }
  if (decisionVariance.detected) {
    disagreementThemes.push('Respondents are not describing the same decision.')
  }
  if (authorityClaritySpread.detected) {
    disagreementThemes.push(`Authority perception gap: authority clarity scores range from ${authoritySpread!.min} to ${authoritySpread!.max}.`)
  }
  if (evidenceClaritySpread.detected) {
    disagreementThemes.push(`Evidence confidence gap: evidence clarity scores range from ${evidenceSpread!.min} to ${evidenceSpread!.max}.`)
  }
  if (executionConfidenceSpread.detected) {
    disagreementThemes.push(`Execution confidence gap: execution confidence scores range from ${executionSpread!.min} to ${executionSpread!.max}.`)
  }
  if (consequenceAwarenessSpread.detected) {
    disagreementThemes.push(`Consequence awareness gap: consequence awareness scores range from ${consequenceSpread!.min} to ${consequenceSpread!.max}.`)
  }

  // ── Aggregate-only findings ────────────────────────────────────────
  const aggregateOnlyFindings: string[] = []
  aggregateOnlyFindings.push(`${count} respondent(s) assessed.`)
  if (Object.keys(roleDistribution).length > 0) {
    const roleSummary = Object.entries(roleDistribution)
      .map(([role, num]) => `${num} ${role}`)
      .join(', ')
    aggregateOnlyFindings.push(`Role distribution: ${roleSummary}.`)
  }
  if (ownerVariance.detected) {
    aggregateOnlyFindings.push(ownerVariance.summary)
  }
  if (blockerVariance.detected) {
    aggregateOnlyFindings.push(blockerVariance.summary)
  }
  if (authorityClaritySpread.detected) {
    aggregateOnlyFindings.push(authorityClaritySpread.summary)
  }
  if (evidenceClaritySpread.detected) {
    aggregateOnlyFindings.push(evidenceClaritySpread.summary)
  }
  if (executionConfidenceSpread.detected) {
    aggregateOnlyFindings.push(executionConfidenceSpread.summary)
  }
  if (consequenceAwarenessSpread.detected) {
    aggregateOnlyFindings.push(consequenceAwarenessSpread.summary)
  }

  // ── Privacy-safe summary ───────────────────────────────────────────
  const divergenceCount = disagreementThemes.length
  let privacySafeSummary: string
  if (divergenceCount === 0) {
    privacySafeSummary = `All ${count} respondent(s) broadly agree on the decision definition, ownership, blockers, authority clarity, evidence confidence, and consequence awareness.`
  } else {
    privacySafeSummary = `${count} respondent(s) assessed with ${divergenceCount} area(s) of divergence identified. ${disagreementThemes.slice(0, 3).join(' ')}`
  }

  return {
    respondentCount: count,
    roleDistribution,
    ownerVariance,
    blockerVariance,
    decisionVariance,
    authorityClaritySpread,
    evidenceClaritySpread,
    executionConfidenceSpread,
    consequenceAwarenessSpread,
    disagreementThemes,
    aggregateOnlyFindings,
    privacySafeSummary,
  }
}
