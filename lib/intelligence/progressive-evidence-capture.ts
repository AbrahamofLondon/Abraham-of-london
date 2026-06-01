/**
 * lib/intelligence/progressive-evidence-capture.ts
 *
 * Adaptive follow-up prompt generator based on missing fields, skipped engines,
 * and the next highest-value engine unlock.
 *
 * Rules:
 *   - Never ask for every missing field — ask the one or two most valuable.
 *   - Prioritise fields that unlock the most valuable next engine.
 *   - Do not ask private/team fields on public/free surfaces.
 *   - Do not ask enterprise scenario questions inside free_signal.
 *   - Do not ask for fields prohibited by the Product Operating Matrix.
 *   - If minimum viable input is missing, ask that first.
 *   - If minimum viable input is satisfied, ask the next engine-unlocking question.
 */

import {
  getInstrumentContract,
  getMissingFieldsForEngines,
  isMinimumViableInputSatisfied,
  type SurfaceInstrumentField,
} from '@/lib/intelligence/surface-instrument-contract'
import type { ProductSurface } from '@/lib/intelligence/engine-activation-registry'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EvidenceCapturePrompt = {
  fieldKey: string
  question: string
  reason: string
  unlocksEngines: string[]
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  privacyLevel: 'client_safe' | 'aggregate_only' | 'private'
}

export type ProgressiveEvidenceCaptureResult = {
  surface: ProductSurface
  missingFields: string[]
  topPrompts: EvidenceCapturePrompt[]
  nextBestCapture: EvidenceCapturePrompt | null
  unlockedIfAnswered: string[]
}

// ---------------------------------------------------------------------------
// Priority helpers
// ---------------------------------------------------------------------------

/**
 * Determine the priority of a missing field based on what it unlocks.
 */
function deriveFieldPriority(field: SurfaceInstrumentField): number {
  // Priority tiers:
  // 1. Required minimum viable fields (handled separately)
  // 2. Fields that unlock GATED engines (highest value)
  // 3. Fields that unlock ACTIVE engines
  // 4. Fields that improve evidence strength
  // 5. Fields that enable simulation
  // 6. Fields that enable consequence/authority clarification
  // 7. Lower-value enrichment fields

  const engineIds = new Set(field.requiredForEngines)

  // High priority: unlocks simulation, contradiction, or constitutional engines
  if (engineIds.has('simulation-gate') || engineIds.has('decision-simulation-engine')) return 90
  if (engineIds.has('cost-of-delay')) return 85
  if (engineIds.has('kernel-contradiction-resolver') || engineIds.has('contradiction-graph')) return 80
  if (engineIds.has('constitutional-engine') || engineIds.has('assessment-engine')) return 75
  if (engineIds.has('scenario-stress-test') || engineIds.has('domain-interdependency')) return 70

  // Medium priority: unlocks lens analysis or evidence engines
  if (engineIds.has('authority-lens') || engineIds.has('evidence-lens')) return 60
  if (engineIds.has('failure-mode-lens') || engineIds.has('adversarial-lens')) return 55
  if (engineIds.has('hidden-signals') || engineIds.has('signal-confidence')) return 50
  if (engineIds.has('evidence-tier-derivation')) return 45

  // Lower priority: enrichment
  if (engineIds.has('narrative-service') || engineIds.has('arbitration-service')) return 30
  if (engineIds.has('weighting-service')) return 25
  if (engineIds.has('user-language-interpretation') || engineIds.has('signal-continuity')) return 20

  return 10
}

/**
 * Check if a field is prohibited on a public/free surface.
 */
function isProhibitedOnPublicSurface(field: SurfaceInstrumentField, surface: ProductSurface): boolean {
  if (surface === 'free_signal') {
    // Free Signal must not ask private or enterprise-level fields
    if (field.privacyLevel === 'private') return true
    if (field.privacyLevel === 'aggregate_only') return true
    // Enterprise-specific fields
    if (field.key === 'domain_scores' || field.key === 'dependency_map') return true
    if (field.key === 'scenario_responses' || field.key === 'board_challenge_readiness') return true
  }
  return false
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

/**
 * Derive progressive evidence capture prompts for a surface.
 *
 * @param params.surface - The product surface
 * @param params.providedFields - The fields already provided by the user
 * @param params.skippedEngines - Engines that were skipped (from engineTrace)
 * @param params.maxPrompts - Maximum number of prompts to return (default: 1)
 */
export function deriveProgressiveEvidenceCapture(params: {
  surface: ProductSurface
  providedFields: Record<string, unknown>
  skippedEngines?: Array<{
    engineId: string
    reason?: string
    missingFields?: string[]
  }>
  maxPrompts?: number
}): ProgressiveEvidenceCaptureResult {
  const maxPrompts = params.maxPrompts ?? 1
  const contract = getInstrumentContract(params.surface)
  if (!contract) {
    return {
      surface: params.surface,
      missingFields: [],
      topPrompts: [],
      nextBestCapture: null,
      unlockedIfAnswered: [],
    }
  }

  const providedKeys = new Set(Object.keys(params.providedFields).filter(k => {
    const v = params.providedFields[k]
    return v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0)
  }))

  // Determine which fields are missing
  const allFieldKeys = contract.fields.map(f => f.key)
  const missingFieldKeys = allFieldKeys.filter(k => !providedKeys.has(k))

  // Check minimum viable input
  const mviSatisfied = isMinimumViableInputSatisfied(params.surface, Array.from(providedKeys))

  // Build a map of field key to field
  const fieldMap = new Map(contract.fields.map(f => [f.key, f]))

  // Collect missing fields that are not prohibited
  const eligibleMissingFields = missingFieldKeys
    .map(k => fieldMap.get(k))
    .filter((f): f is SurfaceInstrumentField => f !== undefined)
    .filter(f => !isProhibitedOnPublicSurface(f, params.surface))

  // Separate minimum viable fields from enrichment fields
  const missingMviFields = eligibleMissingFields.filter(
    f => contract.minimumViableInput.includes(f.key)
  )
  const missingEnrichmentFields = eligibleMissingFields.filter(
    f => !contract.minimumViableInput.includes(f.key)
  )

  // Determine which engines are blocked by missing fields
  const blockedEngines = getMissingFieldsForEngines(
    params.surface,
    Array.from(providedKeys)
  )

  // Build a set of engine IDs that are blocked
  const blockedEngineIds = new Set(blockedEngines.map(e => e.engineId))

  // Also consider skipped engines from engineTrace
  if (params.skippedEngines) {
    for (const se of params.skippedEngines) {
      blockedEngineIds.add(se.engineId)
    }
  }

  // Score each missing field
  interface ScoredField {
    field: SurfaceInstrumentField
    score: number
    unlocksEngines: string[]
  }

  const scoredFields: ScoredField[] = []

  // First, score MVI fields
  for (const field of missingMviFields) {
    const basePriority = deriveFieldPriority(field)
    const blockedByThis = blockedEngines.filter(e =>
      e.missingFields.includes(field.key)
    )
    const unlocksEngineIds = blockedByThis.map(e => e.engineId)
    // MVI fields get a big boost
    const score = basePriority + 100 + unlocksEngineIds.length * 15
    scoredFields.push({ field, score, unlocksEngines: unlocksEngineIds })
  }

  // Then, score enrichment fields
  for (const field of missingEnrichmentFields) {
    const basePriority = deriveFieldPriority(field)
    const blockedByThis = blockedEngines.filter(e =>
      e.missingFields.includes(field.key)
    )
    const unlocksEngineIds = blockedByThis.map(e => e.engineId)
    const score = basePriority + unlocksEngineIds.length * 10
    scoredFields.push({ field, score, unlocksEngines: unlocksEngineIds })
  }

  // Sort by score descending
  scoredFields.sort((a, b) => b.score - a.score)

  // Take top N
  const topFields = scoredFields.slice(0, maxPrompts)

  // Build prompts
  const prompts: EvidenceCapturePrompt[] = topFields.map(sf => ({
    fieldKey: sf.field.key,
    question: sf.field.label,
    reason: sf.field.purpose,
    unlocksEngines: sf.unlocksEngines.length > 0
      ? sf.unlocksEngines
      : sf.field.requiredForEngines,
    priority: sf.score >= 150 ? 'HIGH' : sf.score >= 80 ? 'MEDIUM' : 'LOW',
    privacyLevel: sf.field.privacyLevel,
  }))

  // Determine what would be unlocked if the top field is answered
  const unlockedIfAnswered = topFields.length > 0 && topFields[0]
    ? topFields[0].unlocksEngines
    : []

  return {
    surface: params.surface,
    missingFields: missingFieldKeys,
    topPrompts: prompts,
    nextBestCapture: prompts[0] ?? null,
    unlockedIfAnswered,
  }
}
