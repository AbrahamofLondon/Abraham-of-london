/**
 * app/admin/intelligence-foundry/living-case-fulfilment/page.tsx
 *
 * Canonical Living Case admin fulfilment queue.
 * Shows all paid entitlements with fulfilment status.
 * Admin can generate, review, amend, approve, and deliver dossiers.
 *
 * This is the canonical fulfilment surface. The legacy brief-orders page
 * is archived and should not be used for new Living Case fulfilment.
 */

import React from 'react'
import LivingCaseFulfilmentClient from './FulfilmentClient'

export const dynamic = 'force-dynamic'

export default function LivingCaseFulfilmentPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(3,3,5)', color: 'white' }}>
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8">
          <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-amber-400/70">
            Intelligence Foundry
          </p>
          <h1 className="font-serif text-3xl font-light italic text-white/90 mt-2">
            Living Case Fulfilment
          </h1>
          <p className="mt-2 text-[13px] text-white/40 max-w-2xl">
            Canonical fulfilment queue for paid Living Decision Cases.
            Generate dossiers, review, amend, approve, and deliver.
          </p>
          <div className="mt-3 inline-block border border-amber-500/20 bg-amber-500/5 px-3 py-1.5">
            <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-amber-400/60">
              Canonical — replaces legacy brief-orders
            </p>
          </div>
        </div>

        <LivingCaseFulfilmentClient />
      </div>
    </div>
  )
}
