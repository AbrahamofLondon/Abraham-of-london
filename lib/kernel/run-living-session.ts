/**
 * lib/kernel/run-living-session.ts — Shared Living Session Runtime
 *
 * Centralises the Living Layer runtime logic so both the non-streaming
 * and streaming API routes use the same pipeline.
 *
 * Steps:
 * 1. Create or retrieve session context
 * 2. Translate input using pressure signal adapter
 * 3. Build public translation
 * 4. Update session context
 * 5. Run simulation gate
 * 6. Run synthesis gate
 * 7. Append system turn
 * 8. Build view model
 */

import { buildPressureSignalTranslation } from '@/lib/kernel/public-situation-translation'
import {
  createLiveSessionContext,
  appendUserTurn,
  appendSystemTurn,
  type LiveSessionContext,
} from '@/lib/kernel/live-session-context'
import { runSimulationGate } from '@/lib/kernel/simulation-gate'
import { runSynthesisGate } from '@/lib/kernel/synthesis-gate'
import {
  buildLivingLayerViewModel,
  type LivingLayerViewModel,
  type LivingLayerRuntimeInput,
} from '@/lib/kernel/living-layer-view-model'
import type { PublicSituationTranslation } from '@/lib/kernel/public-situation-translation'
import type { SimulationGateResult } from '@/lib/kernel/simulation-gate'
import type { SynthesisGateResult } from '@/lib/kernel/synthesis-gate'
import type { SaveCasePayload } from '@/lib/product/save-case-continuity'

// ─── Types ───────────────────────────────────────────────────────────────────

export type RunLivingSessionParams = {
  sessionId?: string
  caseId?: string
  input: string
  context?: LiveSessionContext
  carriedForwardCase?: SaveCasePayload | null
}

export type RunLivingSessionResult = {
  sessionId: string
  context: LiveSessionContext
  noticed: PublicSituationTranslation
  simulation: SimulationGateResult
  synthesis: SynthesisGateResult
  viewModel: LivingLayerViewModel
}

// ─── Lightweight translation (mirrors computeSignal from decision-pressure) ──

type LightweightTranslation = {
  pressureBand: string
  frictionLabel: string
  consequence: string
  minimumViableMove: string
  adversarialChallenge: string
}

function translateInput(input: string): LightweightTranslation {
  const lower = input.toLowerCase()
  const trimmed = input.trim()

  // Pressure indicators
  const urgencyWords = /\b(urgent|immediate|today|tomorrow|deadline|critical|emergency|ASAP|overdue)\b/gi
  const urgencyMatches = (trimmed.match(urgencyWords) || []).length

  const stakeWords = /\b(board|investor|regulator|client|revenue|legal|compliance|reputation|existential)\b/gi
  const stakeMatches = (trimmed.match(stakeWords) || []).length

  const stuckWords = /\b(stuck|blocked|avoiding|delaying|circling|stalled|frozen|can't decide|unresolved)\b/gi
  const stuckMatches = (trimmed.match(stuckWords) || []).length

  const compositeScore = urgencyMatches * 3 + stakeMatches * 2 + stuckMatches * 2

  const pressureBand =
    compositeScore >= 10 ? 'CRITICAL' :
    compositeScore >= 6 ? 'ESCALATING' :
    compositeScore >= 3 ? 'LIVE' :
    'LOW'

  // Friction detection
  const hasEvidenceGap = /\b(not sure|don't know|unsure|unclear|unknown|no evidence|missing|assume|guess)\b/i.test(trimmed)
  const hasAuthorityGap = /\b(who|approval|permission|sign.?off|authority|mandate|escalat)\b/i.test(trimmed)
  const hasExecutionDrift = /\b(plan|execute|action|implement|done|progress|stalled|stuck|delay)\b/i.test(trimmed)
  const hasIncentiveConflict = /\b(but|however|conflict|disagree|oppose|resist|politics|agenda)\b/i.test(trimmed)
  const hasTimingPressure = /\b(time|deadline|urgent|soon|quick|fast|immediate|overdue|late)\b/i.test(trimmed)

  const frictions: Array<{ label: string; score: number }> = [
    { label: 'Evidence gap', score: hasEvidenceGap ? 3 : 0 },
    { label: 'Authority gap', score: hasAuthorityGap ? 4 : 0 },
    { label: 'Execution drift', score: hasExecutionDrift ? 2 : 0 },
    { label: 'Incentive conflict', score: hasIncentiveConflict ? 3 : 0 },
    { label: 'Timing pressure', score: hasTimingPressure ? 1 : 0 },
  ]
  frictions.sort((a, b) => b.score - a.score)
  const frictionLabel = frictions[0]?.label ?? 'Authority gap'

  // Consequence
  const CONSEQUENCES: Record<string, string[]> = {
    LOW: ['This decision is not yet under pressure, but unresolved low-stakes decisions compound into structural problems.'],
    LIVE: ['This will not fail because the idea is weak. It will fail because ownership is unclear.'],
    ESCALATING: ['The cost of delay is now measurable. In 30 days, it will be materially higher than it is today.'],
    CRITICAL: ['The consequence window is closing. What is at stake may no longer be recoverable if delayed further.'],
  }
  const consequenceList: string[] = CONSEQUENCES[pressureBand] ?? CONSEQUENCES['LOW'] ?? []
  const consequence: string = consequenceList[0] ?? ''

  // Minimum viable move
  const MOVES: Record<string, string[]> = {
    'Evidence gap': ['Name the evidence that would change this decision. Then find it before deciding.'],
    'Authority gap': ['Confirm in writing who holds the authority to decide and who can block.'],
    'Execution drift': ['Assign one accountable owner and one deadline.'],
    'Incentive conflict': ['Surface the conflicting incentives openly before attempting to resolve the decision.'],
    'Timing pressure': ['Separate genuine deadlines from manufactured urgency.'],
  }
  const moveList: string[] = MOVES[frictionLabel] ?? MOVES['Authority gap'] ?? []
  const minimumViableMove: string = moveList[0] ?? ''

  // Adversarial challenge
  const CHALLENGES: Record<string, string[]> = {
    LOW: ['A reviewer would ask: "What evidence supports the claim that this decision needs attention at all?"'],
    LIVE: ['A reviewer would ask: "Who specifically owns this decision, and what authority do they have to execute it?"'],
    ESCALATING: ['A reviewer would ask: "What has changed in the last 30 days that makes this more urgent than it was?"'],
    CRITICAL: ['A reviewer would ask: "Why has this not been resolved already, and is the reason still valid today?"'],
  }
  const challengeList: string[] = CHALLENGES[pressureBand] ?? CHALLENGES['LOW'] ?? []
  const adversarialChallenge: string = challengeList[0] ?? ''

  return { pressureBand, frictionLabel, consequence, minimumViableMove, adversarialChallenge }
}

// ─── Main Runtime Function ───────────────────────────────────────────────────

export async function runLivingSession(
  params: RunLivingSessionParams,
): Promise<RunLivingSessionResult> {
  const { sessionId, caseId, input, context: existingContext, carriedForwardCase } = params

  // ── Step 1: Create or retrieve session context ─────────────────────────
  let context: LiveSessionContext
  if (existingContext) {
    context = {
      ...existingContext,
      updatedAt: new Date().toISOString(),
    }
  } else {
    context = createLiveSessionContext({
      sessionId,
      caseId,
      initialInput: input,
    })
  }

  // ── Step 2: Translate input using pressure signal adapter ──────────────
  const translation = translateInput(input)

  // ── Step 3: Build public translation ───────────────────────────────────
  const noticed = buildPressureSignalTranslation(
    input,
    translation.pressureBand,
    translation.frictionLabel,
    translation.consequence,
    translation.minimumViableMove,
    translation.adversarialChallenge,
  )

  // ── Step 4: Update session context ─────────────────────────────────────
  context = appendUserTurn({
    context,
    input,
    translation: noticed,
  })

  // ── Step 5: Run simulation gate ────────────────────────────────────────
  const simulation = runSimulationGate({ context })

  // ── Step 6: Run synthesis gate ─────────────────────────────────────────
  const synthesis = runSynthesisGate({ context, simulation })

  // ── Step 7: Append system turn ─────────────────────────────────────────
  const systemContent = [
    synthesis.situationRead,
    synthesis.whatChanged,
    synthesis.simulationSummary,
    synthesis.nextQuestion ? `\n\n${synthesis.nextQuestion}` : '',
    `\n\nNext admissible move: ${synthesis.nextAdmissibleMove}`,
  ].filter(Boolean).join('\n\n')

  context = appendSystemTurn({
    context,
    content: systemContent,
  })

  // ── Step 8: Build view model ───────────────────────────────────────────
  const viewModel = buildLivingLayerViewModel({
    context,
    noticed,
    simulation,
    synthesis,
    carriedForwardCase,
  })

  return {
    sessionId: context.sessionId,
    context,
    noticed,
    simulation,
    synthesis,
    viewModel,
  }
}
