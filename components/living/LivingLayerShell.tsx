/**
 * components/living/LivingLayerShell.tsx — Living Layer Orchestrator
 *
 * Renders the existing living components from one view model.
 * This is the orchestration layer — not a new component set.
 *
 * If an existing component's prop shape does not match exactly,
 * small local adapter functions are used inside this file.
 *
 * No hardcoded fake business data. Use fallbacks only where runtime
 * data is genuinely absent, and label them as unresolved rather than invented.
 *
 * v1.6: Added ContinuityStatement rendering with signal continuity data.
 * v1.7: Added variant support for dark/light theme.
 *
 * Order: SpineProgress → EvidenceMeter → ContinuityStatement → GovernedAction
 *        → WhatChanged → AdvantageSummary → NextLayer → Memory → HumanReview
 */

import React from 'react'
import type { LivingLayerViewModel } from '@/lib/kernel/living-layer-view-model'
import type { LivingThemeVariant } from '@/lib/product/living-theme'

import LivingSpineProgress, { buildStageProgress } from '@/components/living/LivingSpineProgress'
import EvidenceStrengthMeter from '@/components/living/EvidenceStrengthMeter'
import GovernedActionPanel from '@/components/living/GovernedActionPanel'
import WhatChangedPanel from '@/components/living/WhatChangedPanel'
import DecisionAdvantageSummary from '@/components/living/DecisionAdvantageSummary'
import NextLayerUnlockedPanel from '@/components/living/NextLayerUnlockedPanel'
import OutcomeMemoryPreview from '@/components/living/OutcomeMemoryPreview'
import HumanReviewPrompt from '@/components/living/HumanReviewPrompt'
import ContinuityStatement from '@/components/product/ContinuityStatement'

// ─── Types ───────────────────────────────────────────────────────────────────

export type LivingLayerShellProps = {
  viewModel: LivingLayerViewModel
  variant?: LivingThemeVariant
}

// ─── Adapter: Evidence Level → EvidenceTierLevel ─────────────────────────────
//
// The EvidenceStrengthMeter expects an EvidenceTierLevel from the contract.
// Map our view model's evidence level to the closest matching tier.

function mapEvidenceLevel(level: LivingLayerViewModel['evidence']['level']): 'insufficient' | 'single_source' | 'multi_source' | 'outcome_verified' | 'human_reviewed' {
  switch (level) {
    case 'none':
      return 'insufficient'
    case 'single_source':
      return 'single_source'
    case 'multi_source':
      return 'multi_source'
    case 'corroborated':
      return 'multi_source'
    case 'verified':
      return 'outcome_verified'
  }
}

// ─── Adapter: Confidence Band ────────────────────────────────────────────────
//
// DecisionAdvantageSummary expects 'low' | 'medium' | 'high'

function mapConfidenceBand(band: 'LOW' | 'MEDIUM' | 'HIGH'): 'low' | 'medium' | 'high' {
  switch (band) {
    case 'LOW':
      return 'low'
    case 'MEDIUM':
      return 'medium'
    case 'HIGH':
      return 'high'
  }
}

// ─── Adapter: Memory Entries → OutcomeMemoryPreview format ───────────────────

function mapMemoryEntries(entries: LivingLayerViewModel['memory']['entries']) {
  return entries.map(entry => ({
    stage: entry.label,
    date: entry.timestamp,
    finding: entry.summary,
  }))
}

// ─── Adapter: Changes → WhatChangedPanel format ──────────────────────────────

function mapDeltas(deltas: LivingLayerViewModel['changes']['deltas']) {
  return deltas.map(d => ({
    metric: d.label,
    before: d.before ?? null,
    after: d.after,
    direction: d.significance === 'HIGH' ? 'improved' as const : 'stable' as const,
  }))
}

// ─── Adapter: Escalation Trend ───────────────────────────────────────────────

function mapEscalationTrend(trend: string | null): 'stable' | 'rising' | 'falling' | 'insufficient_data' | null {
  if (!trend) return null
  if (trend === 'rising') return 'rising'
  if (trend === 'falling') return 'falling'
  if (trend === 'stable') return 'stable'
  return 'insufficient_data'
}

// ─── Adapter: Signal Continuity → ContinuityStatement props ──────────────────

function pickMostSignificantSignal(
  signals: LivingLayerViewModel['continuity']['signalContinuity'],
): LivingLayerViewModel['continuity']['signalContinuity'][number] | null {
  if (signals.length === 0) return null

  const priority: Record<string, number> = {
    'WORSENING': 5,
    'REPEATED': 4,
    'IMPROVING': 3,
    'NEW': 2,
    'UNKNOWN': 1,
  }

  const first = signals[0]
  if (!first) return null

  let best = first
  let bestPriority = priority[best.status] ?? 0

  for (const s of signals) {
    const p = priority[s.status] ?? 0
    if (p > bestPriority) {
      best = s
      bestPriority = p
    }
  }

  return best
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function LivingLayerShell({ viewModel, variant = 'dark' }: LivingLayerShellProps) {
  const { progress, evidence, governedAction, advantage, nextLayer, memory, changes, review, continuity } = viewModel

  // Build spine progress stages
  const completedKeys: string[] = []
  const canonicalKeys = [
    'fast_diagnostic',
    'purpose_alignment',
    'constitutional',
    'team',
    'enterprise',
    'executive_reporting',
    'strategy_room',
    'outcome_verification',
  ]

  // Map our 8 stages to canonical keys (first N completed)
  for (let i = 0; i < progress.stagesCompleted && i < canonicalKeys.length; i++) {
    const key = canonicalKeys[i]
    if (key) completedKeys.push(key)
  }

  const spineStages = buildStageProgress(completedKeys)

  // Build evidence stage entries
  const evidenceStages = progress.stageLabels.map((label, i) => ({
    key: canonicalKeys[i] ?? `stage_${i}`,
    label,
    status: i < progress.stagesCompleted ? 'completed' as const : 'not_started' as const,
  }))

  // Build advantages for DecisionAdvantageSummary
  const advantages = advantage.advantages.map(a => ({
    label: 'Insight',
    description: a,
  }))

  // Pick the most significant signal for ContinuityStatement
  const topSignal = pickMostSignificantSignal(continuity.signalContinuity)

  // Determine if we should show a carried-forward case context
  const hasCarriedForward = continuity.carriedForwardCase?.available

  return (
    <div className="space-y-4">
      {/* 1. Living Spine Progress */}
      <LivingSpineProgress stages={spineStages} variant={variant} />

      {/* 2. Evidence Strength Meter */}
      <EvidenceStrengthMeter
        level={mapEvidenceLevel(evidence.level)}
        stagesCompleted={evidence.stagesCompleted}
        totalStages={8}
        stages={evidenceStages}
        whatWouldStrengthen={
          evidence.gaps.length > 0
            ? `What would strengthen the evidence: ${evidence.gaps.join('; ')}.`
            : undefined
        }
        variant={variant}
      />

      {/* 3. Continuity Statement — most significant signal continuity */}
      {topSignal && (
        <ContinuityStatement
          continuity={topSignal.status}
          reason={topSignal.summary}
          compact={false}
          variant={variant}
        />
      )}

      {/* 4. Governed Action Panel */}
      <GovernedActionPanel
        requiredAction={governedAction.requiredAction}
        whyThisAction={governedAction.whyThisAction || null}
        whatProvesProgress={governedAction.whatProvesProgress || null}
        whatHappensNext={governedAction.whatHappensNext || null}
        evidenceBasis={governedAction.evidenceBasis}
        variant={variant}
      />

      {/* 5. What Changed Panel */}
      <WhatChangedPanel
        deltas={mapDeltas(changes.deltas)}
        newEvidence={changes.newEvidence.length > 0 ? changes.newEvidence : undefined}
        variant={variant}
      />

      {/* 6. Decision Advantage Summary */}
      <DecisionAdvantageSummary
        advantages={advantages}
        confidenceBand={mapConfidenceBand(advantage.confidenceBand)}
        limitations={advantage.limitations.length > 0 ? advantage.limitations : undefined}
        variant={variant}
      />

      {/* 7. Next Layer Unlocked Panel */}
      <NextLayerUnlockedPanel
        currentStage={nextLayer.currentStage}
        nextStage={{
          name: nextLayer.nextStage,
          href: '#',
          whatItDetects: nextLayer.unlockReason,
          whyContinue: `Completing "${nextLayer.nextStage}" builds a more complete decision case and strengthens the evidence base.`,
        }}
        unresolvedItems={nextLayer.unresolvedItems.length > 0 ? nextLayer.unresolvedItems : undefined}
        variant={variant}
      />

      {/* 8. Outcome Memory Preview */}
      <OutcomeMemoryPreview
        entries={mapMemoryEntries(memory.entries)}
        dominantPattern={memory.dominantPattern}
        escalationTrend={mapEscalationTrend(memory.escalationTrend)}
        variant={variant}
      />

      {/* 9. Carried-forward case context — shown when a prior diagnostic exists */}
      {hasCarriedForward && continuity.carriedForwardCase && (
        <div className="p-4" style={{
          border: `1px solid ${variant === 'dark' ? 'rgba(251,191,36,0.15)' : 'rgba(180,130,30,0.20)'}`,
          backgroundColor: variant === 'dark' ? 'rgba(251,191,36,0.03)' : 'rgba(180,130,30,0.04)',
        }}>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{
            color: variant === 'dark' ? 'rgba(251,191,36,0.60)' : 'rgba(180,130,30,0.70)',
          }}>
            Carried-forward case context
          </div>
          <p className="text-sm leading-6" style={{
            color: variant === 'dark' ? 'rgba(255,255,255,0.55)' : 'rgba(64,64,64,0.65)',
          }}>
            {continuity.carriedForwardCase.summary}
          </p>
          <p className="mt-2 text-xs leading-5" style={{
            color: variant === 'dark' ? 'rgba(255,255,255,0.30)' : 'rgba(64,64,64,0.40)',
          }}>
            A prior diagnostic result is available in this browser session. The system can use it as carried-forward context, but it is not yet durable institutional memory.
          </p>
        </div>
      )}

      {/* 10. Human Review Prompt */}
      {review.required && (
        <HumanReviewPrompt
          context="Living Case"
          showChallenge={true}
          showHumanReview={true}
          showDoesNotFit={true}
          variant={variant}
        />
      )}
    </div>
  )
}
