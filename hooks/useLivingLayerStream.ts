/**
 * hooks/useLivingLayerStream.ts — Living Layer Streaming Hook
 *
 * Client-side hook for the lab page to consume the streaming endpoint.
 * Uses fetch() with a streaming reader to parse SSE events.
 *
 * No persistence in v1. State is held in-memory and lost on page refresh.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import type { LiveSessionContext } from '@/lib/kernel/live-session-context'
import type { PublicSituationTranslation } from '@/lib/kernel/public-situation-translation'
import type { SimulationGateResult } from '@/lib/kernel/simulation-gate'
import type { SynthesisGateResult } from '@/lib/kernel/synthesis-gate'
import type { LivingLayerViewModel } from '@/lib/kernel/living-layer-view-model'
import type { LivingStreamEvent, LivingStreamStage } from '@/lib/kernel/living-stream-events'
import { readPendingSaveCase, type SaveCasePayload } from '@/lib/product/save-case-continuity'

// ─── Types ───────────────────────────────────────────────────────────────────

export type LivingLayerStreamState = {
  sessionId: string | null
  context: LiveSessionContext | null
  noticed: PublicSituationTranslation | null
  simulation: SimulationGateResult | null
  synthesis: SynthesisGateResult | null
  viewModel: LivingLayerViewModel | null
  events: LivingStreamEvent[]
  currentStage: LivingStreamStage | null
  isStreaming: boolean
  error: string | null
}

// ─── SSE Parser ──────────────────────────────────────────────────────────────

/**
 * Parse a chunk of SSE data into individual events.
 * SSE format: data: {json}\n\n
 */
function parseSSEChunk(chunk: string): LivingStreamEvent[] {
  const events: LivingStreamEvent[] = []
  const lines = chunk.split('\n')

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        const parsed = JSON.parse(line.slice(6)) as LivingStreamEvent
        events.push(parsed)
      } catch {
        // Skip malformed events
      }
    }
  }

  return events
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useLivingLayerStream(): {
  state: LivingLayerStreamState
  submitTurn: (input: string) => Promise<void>
  resetSession: () => void
} {
  const [state, setState] = useState<LivingLayerStreamState>({
    sessionId: null,
    context: null,
    noticed: null,
    simulation: null,
    synthesis: null,
    viewModel: null,
    events: [],
    currentStage: null,
    isStreaming: false,
    error: null,
  })

  // Use a ref to track the latest context for continuity across renders
  const contextRef = useRef<LiveSessionContext | null>(null)
  // Track whether we've attempted to read the carried-forward case
  const carriedForwardReadRef = useRef(false)
  // Store carried-forward case for sending with stream request
  const carriedForwardRef = useRef<SaveCasePayload | null>(null)

  // Read carried-forward case from sessionStorage on mount (client-side only)
  useEffect(() => {
    if (carriedForwardReadRef.current) return
    carriedForwardReadRef.current = true

    const cfc = readPendingSaveCase()
    if (cfc) {
      carriedForwardRef.current = cfc
    }
  }, [])

  const submitTurn = useCallback(async (input: string) => {
    if (!input.trim()) return

    // Reset streaming state
    setState(prev => ({
      ...prev,
      events: [],
      currentStage: null,
      isStreaming: true,
      error: null,
      noticed: null,
      simulation: null,
      synthesis: null,
      viewModel: null,
    }))

    try {
      const response = await fetch('/api/kernel/live-session-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: input.trim(),
          context: contextRef.current ?? undefined,
          sessionId: contextRef.current?.sessionId,
          carriedForwardCase: carriedForwardRef.current,
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(err.error ?? `HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Response body is not readable.')
      }

      const decoder = new TextDecoder()
      let buffer = ''
      let resultEvent: LivingStreamEvent | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Parse complete events from buffer
        const events = parseSSEChunk(buffer)
        if (events.length > 0) {
          // Keep only unprocessed portion of buffer
          const lastEventEnd = buffer.lastIndexOf('\n\n')
          if (lastEventEnd >= 0) {
            buffer = buffer.slice(lastEventEnd + 2)
          }

          for (const event of events) {
            if (event.type === 'result') {
              resultEvent = event
              // Update context ref for next turn
              contextRef.current = event.payload.context

              setState({
                sessionId: event.payload.sessionId,
                context: event.payload.context,
                noticed: event.payload.noticed,
                simulation: event.payload.simulation,
                synthesis: event.payload.synthesis,
                viewModel: event.payload.viewModel,
                events: [],
                currentStage: event.stage,
                isStreaming: false,
                error: null,
              })
            } else if (event.type === 'error') {
              setState(prev => ({
                ...prev,
                isStreaming: false,
                error: event.message,
                currentStage: 'error',
              }))
            } else {
              // Stage or partial event — update current stage
              setState(prev => ({
                ...prev,
                events: [...prev.events, event],
                currentStage: event.stage,
              }))
            }
          }
        }
      }

      // If we never got a result event, something went wrong
      if (!resultEvent) {
        setState(prev => ({
          ...prev,
          isStreaming: false,
          error: 'The stream ended without a result.',
        }))
      }
    } catch (e) {
      setState(prev => ({
        ...prev,
        isStreaming: false,
        error: e instanceof Error ? e.message : 'Failed to process input',
        currentStage: 'error',
      }))
    }
  }, [])

  const resetSession = useCallback(() => {
    contextRef.current = null
    carriedForwardRef.current = null
    carriedForwardReadRef.current = false
    setState({
      sessionId: null,
      context: null,
      noticed: null,
      simulation: null,
      synthesis: null,
      viewModel: null,
      events: [],
      currentStage: null,
      isStreaming: false,
      error: null,
    })
  }, [])

  return { state, submitTurn, resetSession }
}
