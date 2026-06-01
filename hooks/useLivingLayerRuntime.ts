/**
 * hooks/useLivingLayerRuntime.ts — Living Layer Runtime Hook
 *
 * Encapsulates client-side state for the lab living case experience.
 * Manages multi-turn continuity, API calls, and view model derivation.
 *
 * No persistence in v1. State is held in-memory and lost on page refresh.
 *
 * v1.6: Reads carried-forward session case from sessionStorage for continuity.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import type { LiveSessionContext } from '@/lib/kernel/live-session-context'
import type { PublicSituationTranslation } from '@/lib/kernel/public-situation-translation'
import type { SimulationGateResult } from '@/lib/kernel/simulation-gate'
import type { SynthesisGateResult } from '@/lib/kernel/synthesis-gate'
import {
  buildLivingLayerViewModel,
  type LivingLayerViewModel,
  type LivingLayerRuntimeInput,
} from '@/lib/kernel/living-layer-view-model'
import { readPendingSaveCase, type SaveCasePayload } from '@/lib/product/save-case-continuity'

// ─── Types ───────────────────────────────────────────────────────────────────

export type LivingLayerRuntimeState = {
  sessionId: string | null
  context: LiveSessionContext | null
  noticed: PublicSituationTranslation | null
  simulation: SimulationGateResult | null
  synthesis: SynthesisGateResult | null
  viewModel: LivingLayerViewModel | null
  carriedForwardCase: SaveCasePayload | null
  isSubmitting: boolean
  error: string | null
}

type ApiResponse = {
  sessionId: string
  context: LiveSessionContext
  noticed: PublicSituationTranslation
  simulation: SimulationGateResult
  synthesis: SynthesisGateResult
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useLivingLayerRuntime(): {
  state: LivingLayerRuntimeState
  submitTurn: (input: string) => Promise<void>
  resetSession: () => void
} {
  const [state, setState] = useState<LivingLayerRuntimeState>({
    sessionId: null,
    context: null,
    noticed: null,
    simulation: null,
    synthesis: null,
    viewModel: null,
    carriedForwardCase: null,
    isSubmitting: false,
    error: null,
  })

  // Use a ref to track the latest context for continuity across renders
  const contextRef = useRef<LiveSessionContext | null>(null)
  // Track whether we've attempted to read the carried-forward case
  const carriedForwardReadRef = useRef(false)

  // Read carried-forward case from sessionStorage on mount (client-side only)
  useEffect(() => {
    if (carriedForwardReadRef.current) return
    carriedForwardReadRef.current = true

    const cfc = readPendingSaveCase()
    if (cfc) {
      setState(prev => ({ ...prev, carriedForwardCase: cfc }))
    }
  }, [])

  const submitTurn = useCallback(async (input: string) => {
    if (!input.trim()) return

    setState(prev => ({ ...prev, isSubmitting: true, error: null }))

    try {
      const res = await fetch('/api/kernel/live-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: input.trim(),
          context: contextRef.current ?? undefined,
          sessionId: contextRef.current?.sessionId,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(err.error ?? `HTTP ${res.status}`)
      }

      const data: ApiResponse = await res.json()

      // Build the view model from the API response, including carried-forward case
      const viewModel = buildLivingLayerViewModel({
        context: data.context,
        noticed: data.noticed,
        simulation: data.simulation,
        synthesis: data.synthesis,
        carriedForwardCase: state.carriedForwardCase,
      })

      // Update ref for next turn
      contextRef.current = data.context

      setState(prev => ({
        sessionId: data.sessionId,
        context: data.context,
        noticed: data.noticed,
        simulation: data.simulation,
        synthesis: data.synthesis,
        viewModel,
        carriedForwardCase: prev.carriedForwardCase,
        isSubmitting: false,
        error: null,
      }))
    } catch (e) {
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        error: e instanceof Error ? e.message : 'Failed to process input',
      }))
    }
  }, [state.carriedForwardCase])

  const resetSession = useCallback(() => {
    contextRef.current = null
    setState({
      sessionId: null,
      context: null,
      noticed: null,
      simulation: null,
      synthesis: null,
      viewModel: null,
      carriedForwardCase: null,
      isSubmitting: false,
      error: null,
    })
    carriedForwardReadRef.current = false
  }, [])

  return { state, submitTurn, resetSession }
}