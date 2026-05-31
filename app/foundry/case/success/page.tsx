/**
 * app/foundry/case/success/page.tsx — Checkout Success Page
 *
 * Shown after successful payment. Controlled message.
 * No auto-delivery. No dossier content. No over-selling.
 */

import React from 'react'
import Link from 'next/link'

const GOLD = '#C9A96E'

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
}

const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
}

interface SuccessPageProps {
  searchParams: {
    caseId?: string
    tier?: string
    session_id?: string
  }
}

export default function CaseSuccessPage({ searchParams }: SuccessPageProps) {
  const { caseId, tier, session_id: sessionId } = searchParams

  return (
    <div style={{ backgroundColor: 'rgb(3,3,5)', color: 'white', minHeight: '100vh' }}>
      <div className="mx-auto max-w-[600px] px-6 pt-[120px] pb-16 md:pt-36">
        <p style={{ ...mono, fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: `${GOLD}88` }}>
          Request Received
        </p>

        <h1
          style={{
            ...serif,
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            lineHeight: 1.0,
            color: '#F5F5F5',
            fontStyle: 'italic',
            letterSpacing: '-0.03em',
            marginTop: '1rem',
          }}
        >
          Your governed dossier request has been received for review.
        </h1>

        <p className="mt-6 text-[15px] leading-[1.85] text-white/60">
          Your payment has been processed. The dossier will be prepared for review
          and delivered once the governed analysis is complete.
        </p>

        {caseId && (
          <div className="mt-6 border border-white/[0.08] bg-white/[0.02] p-4">
            <p style={{ ...mono, fontSize: '8px', letterSpacing: '0.14em', textTransform: 'uppercase', color: `${GOLD}70` }}>
              Case Reference
            </p>
            <p className="mt-1 text-[14px] text-white/70" style={{ ...mono }}>
              {caseId}
            </p>
          </div>
        )}

        {tier && (
          <div className="mt-3 border border-white/[0.08] bg-white/[0.02] p-4">
            <p style={{ ...mono, fontSize: '8px', letterSpacing: '0.14em', textTransform: 'uppercase', color: `${GOLD}70` }}>
              Requested Tier
            </p>
            <p className="mt-1 text-[14px] text-white/70" style={{ ...mono, textTransform: 'uppercase' }}>
              {tier.replace(/_/g, ' ')}
            </p>
          </div>
        )}

        <div className="mt-8 border-t border-white/[0.06] pt-6">
          <p className="text-[13px] leading-[1.7] text-white/40">
            What happens next:
          </p>
          <ol className="mt-3 space-y-2 text-[13px] leading-[1.7] text-white/40">
            <li>1. Your case enters the governed analysis queue.</li>
            <li>2. The dossier is generated and reviewed.</li>
            <li>3. If human review is required, a reviewer assesses the output.</li>
            <li>4. Once approved, the dossier is delivered to you.</li>
          </ol>
        </div>

        <div className="mt-8 border-t border-white/[0.04] pt-6">
          <Link
            href="/foundry/decision-test"
            className="inline-flex items-center gap-2 border px-5 py-3 text-[10px] uppercase tracking-widest transition-all hover:-translate-y-0.5"
            style={{
              borderColor: `${GOLD}30`,
              color: `${GOLD}AA`,
              ...mono,
              letterSpacing: '0.12em',
            }}
          >
            Return to Foundry
          </Link>
        </div>

        <div className="mt-8 border-t border-white/[0.04] pt-6">
          <p className="text-[11px] leading-[1.7] text-white/25">
            This is not professional, legal, tax, or financial advice. The dossier
            is a governed analysis output and does not constitute regulated professional advice.
          </p>
        </div>
      </div>
    </div>
  )
}
