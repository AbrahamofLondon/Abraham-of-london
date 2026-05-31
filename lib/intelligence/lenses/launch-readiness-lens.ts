/**
 * lib/intelligence/lenses/launch-readiness-lens.ts — Launch Readiness Lens
 *
 * Assesses whether a product or service launch is ready to proceed.
 * Produces readiness state, known defects, rollback feasibility,
 * conditional proceed criteria, and hold conditions.
 *
 * Used by: OPERATIONAL_AND_EXECUTION, STRATEGIC_AND_POSITIONING,
 *          TECHNOLOGY_AND_DEPENDENCY (release/launch language)
 */

import type { KernelLensResult, LensFinding, DecisionEvidenceNode, KernelContradiction, DecisionConstraint } from '../types'

export async function launchReadinessLens(rawContext: string): Promise<KernelLensResult> {
  const raw = rawContext.toLowerCase()
  const findings: LensFinding[] = []
  const evidenceNodes: DecisionEvidenceNode[] = []
  const contradictions: KernelContradiction[] = []

  // ── Readiness state ──────────────────────────────────────────────────────
  const hasKnownDefects = raw.includes('bug') || raw.includes('defect') || raw.includes('issue') || raw.includes('problem') || raw.includes('not ready')
  const hasSecurityConcern = raw.includes('security') || raw.includes('vulnerability') || raw.includes('breach') || raw.includes('compliance')
  const hasRevenuePressure = raw.includes('revenue') || raw.includes('quarter') || raw.includes('target') || raw.includes('pre-sold') || raw.includes('committed')
  const hasUserImpact = raw.includes('customer') || raw.includes('user') || raw.includes('client') || raw.includes('public')
  const hasRollbackPlan = raw.includes('rollback') || raw.includes('fallback') || raw.includes('revert') || raw.includes('back out')
  const hasSupportCapacity = raw.includes('support') || raw.includes('team') || raw.includes('on-call') || raw.includes('monitoring')
  const hasApproval = raw.includes('approved') || raw.includes('sign-off') || raw.includes('green light') || raw.includes('go ahead')

  // ── Readiness assessment ─────────────────────────────────────────────────
  const blockers: string[] = []
  const conditions: string[] = []

  if (hasKnownDefects) {
    blockers.push('Known unresolved defects')
    evidenceNodes.push({
      kind: 'readiness_blocker',
      label: 'Blocker: Known unresolved defects',
      summary: 'The product or service has known defects that have not been resolved. Launching with unresolved defects creates customer impact and support burden.',
      severity: 'CRITICAL',
      confidence: 0.8,
      sourceStage: 'kernel',
      sourceLens: 'launch-readiness',
    })
  }

  if (hasSecurityConcern) {
    blockers.push('Unresolved security or compliance concern')
    evidenceNodes.push({
      kind: 'readiness_blocker',
      label: 'Blocker: Security or compliance concern',
      summary: 'A security or compliance concern has been raised and is unresolved. Launching before resolution creates regulatory and reputational risk.',
      severity: 'CRITICAL',
      confidence: 0.9,
      sourceStage: 'kernel',
      sourceLens: 'launch-readiness',
    })
  }

  if (!hasRollbackPlan && hasUserImpact) {
    conditions.push('Rollback plan must be documented and tested before launch')
    evidenceNodes.push({
      kind: 'readiness_condition',
      label: 'Condition: Rollback plan required',
      summary: 'No rollback or fallback plan is referenced. For any customer-facing launch, a tested rollback plan must exist before proceeding.',
      severity: 'HIGH',
      confidence: 0.8,
      sourceStage: 'kernel',
      sourceLens: 'launch-readiness',
    })
  }

  if (!hasSupportCapacity && hasUserImpact) {
    conditions.push('Support capacity must be confirmed before launch')
    evidenceNodes.push({
      kind: 'readiness_condition',
      label: 'Condition: Support capacity required',
      summary: 'No support or monitoring capacity is referenced. Customer-facing launches require confirmed support coverage.',
      severity: 'HIGH',
      confidence: 0.7,
      sourceStage: 'kernel',
      sourceLens: 'launch-readiness',
    })
  }

  if (!hasApproval) {
    conditions.push('Formal launch approval or sign-off must be obtained')
    evidenceNodes.push({
      kind: 'readiness_condition',
      label: 'Condition: Launch approval required',
      summary: 'No launch approval or sign-off is referenced. Launching without authorisation creates accountability exposure.',
      severity: 'MEDIUM',
      confidence: 0.7,
      sourceStage: 'kernel',
      sourceLens: 'launch-readiness',
    })
  }

  // ── Revenue pressure / incentive distortion ──────────────────────────────
  if (hasRevenuePressure && (hasKnownDefects || hasSecurityConcern)) {
    contradictions.push({
      id: 'revenue-vs-readiness',
      between: ['launch-readiness-lens', 'constraint-reality-lens'],
      contradiction: 'Revenue or deadline pressure to launch conflicts with known unresolved readiness issues. The incentive to launch early may be distorting the risk assessment.',
      severity: 'CRITICAL',
      resolutionRule: '',
      outputEffect: '',
    })
    evidenceNodes.push({
      kind: 'incentive_distortion',
      label: 'Incentive distortion: Revenue pressure vs readiness',
      summary: 'Revenue or deadline pressure is present alongside unresolved readiness issues. This creates a known decision bias — the incentive to launch may be overriding the risk assessment.',
      severity: 'HIGH',
      confidence: 0.8,
      sourceStage: 'kernel',
      sourceLens: 'launch-readiness',
    })
  }

  // ── Forbidden actions ────────────────────────────────────────────────────
  if (blockers.length > 0) {
    evidenceNodes.push({
      kind: 'forbidden_action',
      label: 'Forbidden: Launch with unresolved blockers',
      summary: `Do not launch while the following blocker(s) remain unresolved: ${blockers.join(', ')}`,
      severity: 'CRITICAL',
      confidence: 0.9,
      sourceStage: 'kernel',
      sourceLens: 'launch-readiness',
    })
  }

  // ── Summary finding ──────────────────────────────────────────────────────
  if (blockers.length > 0 || conditions.length > 0) {
    let directive: string
    if (blockers.length > 0) {
      directive = 'HOLD — blockers must be resolved before launch can proceed'
    } else if (conditions.length > 2) {
      directive = 'CONDITIONAL_PROCEED — launch may proceed only after all conditions are met'
    } else {
      directive = 'PROCEED_WITH_CAUTION — launch may proceed but conditions should be addressed'
    }

    findings.push({
      domain: 'evidence',
      data: {
        type: 'launch_readiness',
        directive,
        blockers,
        conditions,
        revenuePressurePresent: hasRevenuePressure,
        incentiveDistortionDetected: hasRevenuePressure && (hasKnownDefects || hasSecurityConcern),
      },
    })
  }

  return {
    lensId: 'launch-readiness',
    lensVersion: '1.0.0',
    applied: blockers.length > 0 || conditions.length > 0,
    confidence: blockers.length > 0 ? 'HIGH' : 'MEDIUM',
    findings,
    evidenceNodes,
    contradictions,
    recommendedEvents: [],
  }
}
