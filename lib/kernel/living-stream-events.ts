/**
 * lib/kernel/living-stream-events.ts — Living Layer Stream Event Contract
 *
 * Defines the governed stage events that the streaming API route emits.
 * These are not chat tokens — they are disciplined process state events.
 *
 * The purpose is to make the Living Layer feel alive, reliable, and institutional
 * before persistence is added. The eventual database ledger can later persist
 * these same event stages.
 *
 * Rules:
 * - Never stream private chain-of-thought
 * - Never expose raw scoring, thresholds, or internal taxonomy keys
 * - Never use vague phrases like "Thinking..." or "Analysing..."
 * - Use disciplined stage labels like "Interpreting situation", "Signals detected"
 */

import type { LiveSessionContext } from '@/lib/kernel/live-session-context'
import type { PublicSituationTranslation } from '@/lib/kernel/public-situation-translation'
import type { SimulationGateResult } from '@/lib/kernel/simulation-gate'
import type { SynthesisGateResult } from '@/lib/kernel/synthesis-gate'
import type { LivingLayerViewModel } from '@/lib/kernel/living-layer-view-model'

// ─── Types ───────────────────────────────────────────────────────────────────

export type LivingStreamStage =
  | 'received'
  | 'interpreting'
  | 'signals_detected'
  | 'continuity_checked'
  | 'simulation_running'
  | 'synthesis_running'
  | 'completed'
  | 'refused'
  | 'error'

export type LivingStreamEvent =
  | {
      type: 'stage'
      stage: LivingStreamStage
      label: string
      detail?: string
      timestamp: string
    }
  | {
      type: 'partial'
      stage: LivingStreamStage
      label: string
      detail: string
      timestamp: string
    }
  | {
      type: 'result'
      stage: 'completed' | 'refused'
      payload: {
        sessionId: string
        context: LiveSessionContext
        noticed: PublicSituationTranslation
        simulation: SimulationGateResult
        synthesis: SynthesisGateResult
        viewModel: LivingLayerViewModel
      }
      timestamp: string
    }
  | {
      type: 'error'
      stage: 'error'
      message: string
      timestamp: string
    }

// ─── SSE Encoding ────────────────────────────────────────────────────────────

/**
 * Encode a stream event as a Server-Sent Events data frame.
 */
export function encodeLivingStreamEvent(event: LivingStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`
}

/**
 * Create a stage event with the current timestamp.
 */
export function createStageEvent(
  stage: LivingStreamStage,
  label: string,
  detail?: string,
): LivingStreamEvent {
  return {
    type: 'stage',
    stage,
    label,
    detail,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Create a partial event with the current timestamp.
 */
export function createPartialEvent(
  stage: LivingStreamStage,
  label: string,
  detail: string,
): LivingStreamEvent {
  return {
    type: 'partial',
    stage,
    label,
    detail,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Create a result event with the current timestamp.
 */
export function createResultEvent(
  stage: 'completed' | 'refused',
  payload: LivingStreamEvent & { type: 'result' } extends { payload: infer P } ? P : never,
): LivingStreamEvent {
  return {
    type: 'result',
    stage,
    payload: payload as any,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Create an error event with the current timestamp.
 * Does not expose stack traces or raw error objects.
 */
export function createErrorEvent(message: string): LivingStreamEvent {
  return {
    type: 'error',
    stage: 'error',
    message,
    timestamp: new Date().toISOString(),
  }
}
