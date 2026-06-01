/**
 * pages/kernel/signal.tsx — Public Kernel Signal Page
 *
 * A minimal public aperture for the Decision Intelligence Kernel.
 * Accepts raw situation text, returns FREE_SIGNAL disclosure only.
 *
 * No persistence. No admin data. No paid entitlement.
 * No Full Dossier. No checkout. No over-selling.
 *
 * This is the controlled public entry point for the kernel.
 */

import React, { useState, useCallback } from 'react'
import Head from 'next/head'
import Layout from '@/components/Layout'
import { FreeSignalResult } from '@/components/kernel/FreeSignalResult'
import type { KernelSignalResponse } from '@/pages/api/public/kernel-signal'

const GOLD = '#C9A96E'

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
}

const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
}

export default function KernelSignalPage() {
  const [situation, setSituation] = useState('')
  const [loading, setLoading] = useState(false)
  const [signal, setSignal] = useState<KernelSignalResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!situation.trim()) return

    setLoading(true)
    setError(null)
    setSignal(null)

    try {
      const res = await fetch('/api/public/kernel-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation: situation.trim() }),
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
  }, [situation])

  const handleReset = useCallback(() => {
    setSignal(null)
    setSituation('')
    setError(null)
  }, [])

  // Show result if we have one
  if (signal) {
    return (
      <>
        <Head>
          <title>Signal — Abraham of London</title>
          <meta name="description" content="Governed decision signal — free perception check" />
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <FreeSignalResult
          signal={signal}
          onReset={handleReset}
          originalSituation={situation}
          onRefined={(updated) => setSignal(updated)}
        />
      </>
    )
  }

  return (
    <Layout
      title="Signal — Abraham of London"
      description="Test a decision against the governed decision intelligence kernel. Free perception check."
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div style={{ backgroundColor: 'rgb(3,3,5)', color: 'white', minHeight: '100vh' }}>
        {/* Internal preview banner */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 text-center">
          <p style={{ ...mono, fontSize: '8px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#F59E0B' }}>
            Internal Preview — Not for public navigation. Use /foundry/decision-test for the canonical public route.
          </p>
        </div>
        <div className="mx-auto max-w-[700px] px-6 pt-[120px] pb-16 md:pt-36">
          {/* Eyebrow */}
          <p style={{ ...mono, fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: `${GOLD}88` }}>
            Governed Decision Signal — Preview
          </p>

          {/* Heading */}
          <h1
            style={{
              ...serif,
              fontSize: 'clamp(2rem, 5vw, 3.2rem)',
              lineHeight: 1.0,
              color: '#F5F5F5',
              fontStyle: 'italic',
              letterSpacing: '-0.03em',
              marginTop: '1rem',
            }}
          >
            Test a decision.
          </h1>
          <p className="mt-4 max-w-[52ch] text-[15px] leading-[1.85] text-white/55">
            Describe a real situation you are facing. The system will return a free
            perception check — what kind of decision this is, where it is most likely
            to fail, and the direction of the minimum viable move.
          </p>
          <p className="mt-2 text-[13px] leading-[1.7] text-white/35">
            This is not professional advice. It is a structured reading.
          </p>

          {/* Input form */}
          <form onSubmit={handleSubmit} className="mt-10">
            <div className="border border-white/[0.10] bg-white/[0.02]">
              <textarea
                value={situation}
                onChange={e => setSituation(e.target.value)}
                placeholder="Describe your situation — what is the decision, what is at stake, what is the deadline or pressure, who is involved, and what constraints exist?"
                rows={6}
                className="w-full border-0 bg-transparent p-5 text-[14px] leading-[1.8] text-white/80 placeholder-white/20 outline-none resize-none"
                style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: '13px' }}
              />
            </div>

            {/* Error */}
            {error && (
              <p className="mt-3 text-[13px] leading-[1.6] text-red-400/80">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !situation.trim()}
              className="mt-5 inline-flex min-h-[48px] items-center gap-2 border px-6 py-3 text-[10px] uppercase tracking-widest transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-30"
              style={{
                borderColor: `${GOLD}40`,
                backgroundColor: loading ? 'transparent' : `${GOLD}10`,
                color: loading ? `${GOLD}60` : '#F5F5F5',
                ...mono,
                letterSpacing: '0.12em',
              }}
            >
              {loading ? 'Processing...' : 'Read the situation'}
            </button>
          </form>

          {/* How it works */}
          <div className="mt-16 border-t border-white/[0.06] pt-8">
            <p style={{ ...mono, fontSize: '7px', letterSpacing: '0.28em', textTransform: 'uppercase', color: `${GOLD}60`, marginBottom: '0.75rem' }}>
              What happens
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                { label: 'Translation', text: 'Your situation is translated into institutional structure. Ambiguity is preserved, not collapsed.' },
                { label: 'Classification', text: 'The decision is classified into one of 12 decision classes. Alternative classifications are noted.' },
                { label: 'Analysis', text: 'Governed lenses assess authority, obligation, constraint, evidence, and adversarial pressure.' },
                { label: 'Signal', text: 'You receive a free signal: the primary failure point, governing tension, and direction of move.' },
              ].map(({ label, text }) => (
                <div key={label} className="border-l-2 border-white/[0.08] pl-3">
                  <p style={{ ...mono, fontSize: '7px', letterSpacing: '0.18em', textTransform: 'uppercase', color: `${GOLD}70`, marginBottom: '0.2rem' }}>{label}</p>
                  <p className="text-[12px] leading-[1.6] text-white/40">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-12 border-t border-white/[0.04] pt-6">
            <p className="text-[11px] leading-[1.7] text-white/25">
              This is not professional, legal, tax, or financial advice. The free signal is a
              perception check only. No decision should be made solely on the basis of this signal.
              Full governed analysis requires an active case with appropriate disclosure tier.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}
