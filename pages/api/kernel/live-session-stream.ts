/**
 * pages/api/kernel/live-session-stream.ts — Living Layer Streaming API
 *
 * Exposes the same Living Layer runtime as /api/kernel/live-session,
 * but streamed as governed stage events via Server-Sent Events.
 *
 * Streams disciplined process state events — not chat tokens.
 * Never exposes private chain-of-thought, raw scores, or internal taxonomy keys.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { runLivingSession } from '@/lib/kernel/run-living-session'
import {
  encodeLivingStreamEvent,
  createStageEvent,
  createErrorEvent,
  type LivingStreamEvent,
} from '@/lib/kernel/living-stream-events'
import type { LiveSessionContext } from '@/lib/kernel/live-session-context'
import type { SaveCasePayload } from '@/lib/product/save-case-continuity'

// ─── Types ───────────────────────────────────────────────────────────────────

type LiveSessionStreamRequest = {
  sessionId?: string
  caseId?: string
  input: string
  context?: LiveSessionContext
  carriedForwardCase?: SaveCasePayload | null
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' })
    return
  }

  const { sessionId, caseId, input, context: existingContext, carriedForwardCase } = req.body as LiveSessionStreamRequest

  if (!input || typeof input !== 'string' || !input.trim()) {
    res.status(400).json({ error: 'Input is required and must be a non-empty string.' })
    return
  }

  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
  })

  // Helper to emit an event
  const emit = (event: LivingStreamEvent) => {
    res.write(encodeLivingStreamEvent(event))
  }

  try {
    // ── Stage 1: Received ────────────────────────────────────────────────
    emit(createStageEvent('received', 'Input received', 'The system has received the decision description.'))

    // ── Stage 2: Interpreting ────────────────────────────────────────────
    emit(createStageEvent('interpreting', 'Interpreting situation', 'The system is translating the user\'s language into a structured decision case.'))

    // ── Run the shared runtime ───────────────────────────────────────────
    const result = await runLivingSession({
      sessionId,
      caseId,
      input,
      context: existingContext,
      carriedForwardCase,
    })

    // ── Stage 3: Signals detected ────────────────────────────────────────
    const signalCount = result.noticed.detectedSignals.length
    emit(createStageEvent(
      'signals_detected',
      'Signals detected',
      `${signalCount} signal(s) detected from the current input.`,
    ))

    // ── Stage 4: Continuity checked ──────────────────────────────────────
    emit(createStageEvent(
      'continuity_checked',
      'Continuity checked',
      'The system checked whether this is a new, repeated, or carried-forward pattern.',
    ))

    // ── Stage 5: Simulation running ──────────────────────────────────────
    emit(createStageEvent(
      'simulation_running',
      'Comparing possible paths',
      'The system is comparing bounded decision paths rather than assuming one answer.',
    ))

    // ── Stage 6: Synthesis running ───────────────────────────────────────
    emit(createStageEvent(
      'synthesis_running',
      'Synthesising next admissible move',
      'The system is converting the case state into a responsible next move.',
    ))

    // ── Stage 7: Result ──────────────────────────────────────────────────
    const resultStage = result.synthesis.shouldRefuse ? 'refused' : 'completed'

    emit({
      type: 'result',
      stage: resultStage,
      payload: {
        sessionId: result.sessionId,
        context: result.context,
        noticed: result.noticed,
        simulation: result.simulation,
        synthesis: result.synthesis,
        viewModel: result.viewModel,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    // Do not leak stack traces or raw error objects
    console.error('[live-session-stream] Error:', error)
    emit(createErrorEvent('The living session could not be completed safely.'))
  } finally {
    res.end()
  }
}
