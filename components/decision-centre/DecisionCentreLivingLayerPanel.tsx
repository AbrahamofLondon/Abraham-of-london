/**
 * components/decision-centre/DecisionCentreLivingLayerPanel.tsx
 *
 * Production-safe Living Layer panel for the Decision Centre.
 * Renders the LivingLayerShell from adapted Decision Centre case data.
 *
 * Requirements:
 * - No debug block
 * - No lab wording
 * - No streaming trace
 * - No "session memory" unless the data is truly session-only
 * - Use "case memory" when backed by Decision Centre/governed memory
 * - Use "carried-forward case context" where sessionStorage continuity is present
 * - No raw engine details
 */

import React from 'react'
import type { LivingLayerViewModel } from '@/lib/kernel/living-layer-view-model'
import LivingLayerShell from '@/components/living/LivingLayerShell'

// ─── Types ───────────────────────────────────────────────────────────────────

export type DecisionCentreLivingLayerPanelProps = {
  viewModel: LivingLayerViewModel
  caseTitle: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DecisionCentreLivingLayerPanel({
  viewModel,
  caseTitle,
}: DecisionCentreLivingLayerPanelProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="border-b border-white/[0.06] pb-3 mb-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-500/60">
          Living case view
        </div>
        <p className="mt-1 text-[13px] leading-[1.6] text-zinc-500">
          Governed view of &ldquo;{caseTitle.length > 80 ? caseTitle.slice(0, 77) + '...' : caseTitle}&rdquo;
        </p>
      </div>

      {/* Living Layer Shell — renders all living components from view model */}
      <LivingLayerShell viewModel={viewModel} />

      {/* Footer note */}
      <div className="mt-4 border-t border-white/[0.04] pt-3">
        <p className="font-mono text-[8px] tracking-[0.12em] text-zinc-600">
          This view is derived from available case data and governed memory. Evidence language is conservative by design.
        </p>
      </div>
    </div>
  )
}
