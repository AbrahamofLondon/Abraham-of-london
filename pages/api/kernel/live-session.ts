/**
 * pages/api/kernel/live-session.ts — Living Layer v1 API (non-streaming)
 *
 * Exposes the live case loop: accept user input, translate, simulate, synthesise,
 * and return the updated context and user-facing result.
 *
 * Uses the shared runLivingSession runtime from lib/kernel/run-living-session.ts.
 *
 * No database persistence in v1. Request-scoped and client-held context.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { runLivingSession } from '@/lib/kernel/run-living-session'
import type { LiveSessionContext } from '@/lib/kernel/live-session-context'
import type { PublicSituationTranslation } from '@/lib/kernel/public-situation-translation'
import type { SimulationGateResult } from '@/lib/kernel/simulation-gate'
import type { SynthesisGateResult } from '@/lib/kernel/synthesis-gate'

// ─── Types ───────────────────────────────────────────────────────────────────

type LiveSessionRequest = {
  sessionId?: string
  caseId?: string
  input: string
  context?: LiveSessionContext
}

type LiveSessionResponse = {
  sessionId: string
  context: LiveSessionContext
  noticed: PublicSituationTranslation
  simulation: SimulationGateResult
  synthesis: SynthesisGateResult
}

type ErrorResponse = {
  error: string
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LiveSessionResponse | ErrorResponse>,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' })
  }

  const { sessionId, caseId, input, context: existingContext } = req.body as LiveSessionRequest

  if (!input || typeof input !== 'string' || !input.trim()) {
    return res.status(400).json({ error: 'Input is required and must be a non-empty string.' })
  }

  try {
    const result = await runLivingSession({
      sessionId,
      caseId,
      input,
      context: existingContext,
    })

    return res.status(200).json({
      sessionId: result.sessionId,
      context: result.context,
      noticed: result.noticed,
      simulation: result.simulation,
      synthesis: result.synthesis,
    })
  } catch (error) {
    console.error('[live-session] Error:', error)
    return res.status(500).json({ error: 'Internal error processing the live session.' })
  }
}