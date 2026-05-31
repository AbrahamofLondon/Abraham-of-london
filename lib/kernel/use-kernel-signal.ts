/**
 * lib/kernel/use-kernel-signal.ts — React hook for the kernel signal API
 *
 * Shared hook used by all public aperture pages.
 * Calls POST /api/public/kernel-signal and returns FREE_SIGNAL output only.
 */

import { useState, useCallback } from 'react'
import type { KernelSignalResponse } from '@/pages/api/public/kernel-signal'

export interface UseKernelSignalOptions {
  sourceAperture?: string
}

export interface UseKernelSignalReturn {
  signal: KernelSignalResponse | null
  loading: boolean
  error: string | null
  submit: (situation: string, clarifications?: Record<string, string>) => Promise<void>
  reset: () => void
}

export function useKernelSignal(options?: UseKernelSignalOptions): UseKernelSignalReturn {
  const [signal, setSignal] = useState<KernelSignalResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = useCallback(async (situation: string, clarifications?: Record<string, string>) => {
    if (!situation.trim()) return

    setLoading(true)
    setError(null)
    setSignal(null)

    try {
      const res = await fetch('/api/public/kernel-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          situation: situation.trim(),
          clarifications,
          sourceAperture: options?.sourceAperture || 'web',
        }),
      })

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`)
      }

      const data: KernelSignalResponse = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setSignal(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [options?.sourceAperture])

  const reset = useCallback(() => {
    setSignal(null)
    setError(null)
  }, [])

  return { signal, loading, error, submit, reset }
}
