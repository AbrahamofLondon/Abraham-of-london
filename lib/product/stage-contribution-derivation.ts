/**
 * lib/product/stage-contribution-derivation.ts
 *
 * Derives bespoke per-stage contribution text from available evidence data.
 * Every completed stage should answer: "What did this stage actually contribute?"
 *
 * Rules:
 * - Use actual summaries where available.
 * - Prefer evidence node summaries over generic stage labels.
 * - Exclude audience-unsafe memory.
 * - Do not fabricate numbers.
 * - If no meaningful data exists, return null.
 */

import type { StageEntry } from '@/lib/product/evidence-stage-contract'

// ─── Types ───────────────────────────────────────────────────────────────────

export type StageContributionInput = {
  stageKey: string
  evidenceNodes?: Array<{
    stage?: string
    sourceStage?: string
    summary?: string
    label?: string
    kind?: string
    severity?: string
  }>
  governedMemory?: Array<{
    sourceSurface?: string
    summary?: string
    status?: string
    confidenceLabel?: string
    audienceSafe?: boolean
  }>
  contradictions?: Array<{
    summary?: string
    contradiction?: string
    severity?: string
  }>
  resultData?: Record<string, unknown>
}

// ─── Stage Contribution Templates ────────────────────────────────────────────
//
// These are used only when no specific data is available for a stage.
// They describe what the stage generically contributes.

const STAGE_CONTRIBUTIONS: Record<string, string> = {
  fast_diagnostic: 'Identified the primary contradiction between the stated decision and the constraint blocking action.',
  purpose_alignment: 'Detected the pattern driving drift and identified the first correction required.',
  constitutional: 'Mapped the authority posture and whether the decision can proceed through the current route.',
  team: 'Identified perception gaps and the team condition affecting execution.',
  enterprise: 'Mapped organisational risk exposure and escalation readiness.',
  executive_reporting: 'Converted diagnostic evidence into an executive priority stack.',
  strategy_room: 'Recorded governed intervention activity and the current consequence trend.',
  outcome_verification: 'Captured outcome data for calibration and continuity.',
}

// ─── Main Derivation ─────────────────────────────────────────────────────────

export function deriveStageContribution(input: StageContributionInput): string | null {
  const { stageKey, evidenceNodes = [], governedMemory = [], contradictions = [] } = input

  // ── 1. Try evidence nodes first (most specific) ─────────────────────────
  // Map stage keys to source stage names used in evidence nodes
  const stageKeyToSource: Record<string, string[]> = {
    fast_diagnostic: ['fast_diagnostic', 'purpose_alignment'],
    purpose_alignment: ['purpose_alignment'],
    constitutional: ['constitutional'],
    team: ['team'],
    enterprise: ['enterprise'],
    executive_reporting: ['executive_reporting'],
    strategy_room: ['strategy_room'],
    outcome_verification: ['outcome_verification'],
  }

  const sourceStages = stageKeyToSource[stageKey] ?? [stageKey]

  // Find evidence nodes for this stage
  const stageNodes = evidenceNodes.filter(n =>
    sourceStages.includes(n.sourceStage ?? n.stage ?? '')
  )

  // Prefer contradiction nodes — they're the most bespoke
  const contradictionNodes = stageNodes.filter(n => n.kind === 'contradiction')
  if (contradictionNodes.length > 0) {
    const first = contradictionNodes[0]
    if (first?.summary) {
      const count = contradictionNodes.length
      return count > 1
        ? `${first.summary} (plus ${count - 1} other contradiction${count - 1 > 1 ? 's' : ''})`
        : first.summary
    }
  }

  // Use first evidence node summary
  if (stageNodes.length > 0) {
    const first = stageNodes[0]
    if (first?.summary) {
      const count = stageNodes.length
      return count > 1
        ? `${first.summary} (${count} evidence node${count > 1 ? 's' : ''})`
        : first.summary
    }
  }

  // ── 2. Try contradictions from input ────────────────────────────────────
  if (contradictions.length > 0) {
    const first = contradictions[0]
    if (first?.summary || first?.contradiction) {
      const text = first.summary ?? first.contradiction ?? ''
      const count = contradictions.length
      return count > 1
        ? `${text} (${count} contradiction${count > 1 ? 's' : ''})`
        : text
    }
  }

  // ── 3. Try governed memory ──────────────────────────────────────────────
  const stageSurfaceMap: Record<string, string[]> = {
    purpose_alignment: ['PURPOSE_ALIGNMENT'],
    constitutional: ['CONSTITUTIONAL_DIAGNOSTIC'],
    team: ['TEAM_ASSESSMENT'],
    enterprise: ['ENTERPRISE_ASSESSMENT'],
    executive_reporting: ['EXECUTIVE_REPORTING'],
    strategy_room: ['STRATEGY_ROOM'],
    outcome_verification: ['OUTCOME_VERIFICATION'],
  }

  const surfaces = stageSurfaceMap[stageKey] ?? []
  const safeMemory = governedMemory.filter(m =>
    m.audienceSafe !== false &&
    surfaces.includes(m.sourceSurface ?? '')
  )

  if (safeMemory.length > 0) {
    const first = safeMemory[0]
    if (first?.summary) {
      return first.summary.length > 120
        ? first.summary.slice(0, 117) + '...'
        : first.summary
    }
  }

  // ── 4. Fall back to generic stage contribution ──────────────────────────
  const generic = STAGE_CONTRIBUTIONS[stageKey]
  if (generic) return generic

  return null
}

/**
 * Derive contributions for all stages in a checklist.
 * Populates the contribution field on each completed stage.
 */
export function deriveStageContributions(
  stages: StageEntry[],
  input: StageContributionInput,
): StageEntry[] {
  return stages.map(stage => {
    if (stage.status !== 'completed') return stage
    if (stage.contribution) return stage // Don't overwrite existing

    const contribution = deriveStageContribution({
      ...input,
      stageKey: stage.key,
    })

    return contribution ? { ...stage, contribution } : stage
  })
}
