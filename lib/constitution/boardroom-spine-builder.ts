/**
 * lib/constitution/boardroom-spine-builder.ts
 *
 * Builds a canonical IntelligenceSpine from Executive Reporting snapshot data
 * for use by generateBoardroomDossier() and the Boardroom PDF export route.
 *
 * Ensures all fields accessed by generateBoardroomDossier() are present
 * with safe fallbacks, so no undefined/null field leaks into Boardroom output.
 */

import type { IntelligenceSpine } from '@/lib/decision/intelligence-spine'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BoardroomSpineSource = {
  costOfDelay?: unknown
  accuracy?: unknown
  synthesis?: Record<string, unknown>
  conditionClass?: unknown
  decisionText?: unknown
  /** Additional fields that may be available from richer snapshots */
  case?: Record<string, unknown>
  flags?: Record<string, unknown>
  forecast?: Record<string, unknown>
  deterministic?: Record<string, unknown>
  economics?: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Safe accessors
// ---------------------------------------------------------------------------

function s(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function n(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

function b(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function obj(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function arr(value: unknown): string[] {
  return Array.isArray(value) ? value.map(v => s(v)).filter(Boolean) : []
}

// ---------------------------------------------------------------------------
// Canonical spine builder
// ---------------------------------------------------------------------------

/**
 * Build a canonical IntelligenceSpine from available Executive Reporting
 * snapshot data. All fields accessed by generateBoardroomDossier() are
 * populated with safe fallbacks.
 *
 * @param source - Available snapshot data from the Executive Reporting run
 * @returns A partial IntelligenceSpine safe for Boardroom dossier generation
 */
export function buildBoardroomIntelligenceSpine(
  source: BoardroomSpineSource,
): Partial<IntelligenceSpine> {
  const synthesis = obj(source.synthesis)
  const caseData = obj(source.case)
  const flags = obj(source.flags)
  const forecast = obj(source.forecast)
  const deterministic = obj(source.deterministic)
  const economics = obj(source.economics)

  return {
    economics: {
      estimatedMonthlyCost: n(economics.estimatedMonthlyCost ?? source.costOfDelay),
      costOfDelayMonthly: n(economics.costOfDelayMonthly ?? source.costOfDelay),
      decisionOwner: s(economics.decisionOwner ?? caseData.claimedOwner),
      deadline: s(economics.deadline),
    },
    accuracyFeedback: {
      response: (s(source.accuracy) === 'yes' || s(source.accuracy) === 'partial' || s(source.accuracy) === 'no')
        ? s(source.accuracy) as 'yes' | 'partial' | 'no'
        : 'partial',
      capturedAt: new Date().toISOString(),
    },
    synthesis: {
      primaryContradiction: s(synthesis.primaryContradiction ?? synthesis.contradiction),
      concreteMove: s(synthesis.concreteMove ?? synthesis.nextAdmissibleMove),
    } as any,
    deterministic: {
      conditionClass: s(source.conditionClass ?? deterministic.conditionClass ?? 'definition') as any,
      contradictionSet: arr(deterministic.contradictionSet ?? synthesis.contradictions),
      blockerClass: s(deterministic.blockerClass ?? 'unknown'),
      signal: { label: 'Boardroom dossier signal', type: 'boardroom', severity: 'medium' } as any,
    },
    case: {
      blocker: s(caseData.blocker ?? synthesis.blocker),
      forcedAction: s(caseData.forcedAction ?? synthesis.forcedAction),
      claimedOwner: s(caseData.claimedOwner ?? economics.decisionOwner),
      decisionText: s(source.decisionText ?? caseData.decisionText ?? synthesis.decision),
    } as any,
    flags: {
      falseAuthority: b(flags.falseAuthority),
      avoidanceSuspected: b(flags.avoidanceSuspected),
    },
    forecast: {
      optionDecayRate: n(forecast.optionDecayRate, 0.3),
      structuralRiskShift: s(forecast.structuralRiskShift, 'accelerating'),
    } as any,
  }
}
