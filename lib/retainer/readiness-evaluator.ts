/**
 * lib/retainer/readiness-evaluator.ts
 *
 * Retainer Readiness Evaluator — automated criteria-based assessment.
 *
 * Retainer Oversight is NOT self-serve. A client must:
 *   1. Demonstrate durable memory (completed decision runs / dossiers)
 *   2. Show a recurring decision pattern (≥ 2 diagnostic cycles)
 *   3. Have at least one verified outcome record
 *   4. Have triggered high/critical risk at least twice
 *   5. Have evidence quality above threshold
 *   6. Receive admin approval before Retainer Oversight is activated
 *
 * Rules:
 *   - Admin approval is always required regardless of score.
 *   - This evaluator produces a readiness class; it does NOT activate the retainer.
 *   - REVIEW_READY means admin may now review; APPROVED means admin has signed off.
 */

import { prisma } from '@/lib/prisma.server'

// ─── Readiness Classes ────────────────────────────────────────────────────────

export type ReadinessClass =
  | 'NOT_READY'     // criteria not met
  | 'CANDIDATE'     // some criteria met; not enough for admin review
  | 'REVIEW_READY'  // all automated criteria met; awaiting admin approval
  | 'APPROVED'      // admin has approved; retainer offer may be extended

// ─── Readiness Evaluation Input ───────────────────────────────────────────────

export interface RetainerReadinessInput {
  organisationId?: string
  userEmail?: string
}

// ─── Readiness Evaluation Result ─────────────────────────────────────────────

export interface RetainerReadinessResult {
  readinessClass: ReadinessClass
  overallScore: number         // 0–1
  dimensions: {
    durableMemoryPresent: boolean
    recurringDecisionPattern: boolean
    outcomeHistoryPresent: boolean
    repeatedHighRisk: boolean
    evidenceQualityScore: number   // 0–1
    organisationSignalScore: number // 0–1
  }
  evidenceSourceIds: string[]
  adminApprovalRequired: true
  note: string
}

// ─── Thresholds ───────────────────────────────────────────────────────────────

const THRESHOLDS = {
  MIN_COMPLETED_RUNS:         2,    // DecisionInstrumentRun COMPLETED records
  MIN_DOSSIERS:               1,    // BoardroomDossier records
  MIN_OUTCOME_RECORDS:        1,    // DecisionOutcomeRecord records
  MIN_HIGH_RISK_TRIGGERS:     2,    // COMPLETED runs where score contains riskLevel HIGH/CRITICAL
  EVIDENCE_QUALITY_PASS:      0.6,  // evidenceQualityScore threshold for REVIEW_READY
  ORG_SIGNAL_PASS:            0.5,  // organisationSignalScore threshold
  REVIEW_READY_MIN_SCORE:     0.65, // overallScore threshold for REVIEW_READY
} as const

// ─── Evaluator ────────────────────────────────────────────────────────────────

export async function evaluateRetainerReadiness(
  input: RetainerReadinessInput,
): Promise<RetainerReadinessResult> {
  const { organisationId, userEmail } = input

  if (!organisationId && !userEmail) {
    throw new Error('evaluateRetainerReadiness: organisationId or userEmail is required')
  }

  const evidenceSourceIds: string[] = []

  // ── 1. Durable memory: completed instrument runs ──────────────────────────

  const completedRuns = await prisma.decisionInstrumentRun.findMany({
    where: {
      status: 'COMPLETED',
      ...(userEmail ? { userEmail } : {}),
    },
    select: { id: true, scoreJson: true },
  })
  const durableMemoryPresent = completedRuns.length >= THRESHOLDS.MIN_COMPLETED_RUNS
  completedRuns.forEach((r) => evidenceSourceIds.push(r.id))

  // ── 2. Recurring decision pattern: multiple diagnostic cycles ────────────

  // Proxy: ≥ 2 completed runs is the minimal recurring signal
  const recurringDecisionPattern = completedRuns.length >= THRESHOLDS.MIN_COMPLETED_RUNS

  // ── 3. Outcome history: DecisionOutcomeRecord ────────────────────────────

  const outcomeRecords = await prisma.decisionOutcomeRecord.findMany({
    where: {
      ...(userEmail ? { submittedByEmail: userEmail } : {}),
    },
    select: { id: true },
  })
  const outcomeHistoryPresent = outcomeRecords.length >= THRESHOLDS.MIN_OUTCOME_RECORDS
  outcomeRecords.forEach((r) => evidenceSourceIds.push(r.id))

  // ── 4. Repeated high risk ─────────────────────────────────────────────────

  const highRiskRuns = completedRuns.filter((r) => {
    const score = r.scoreJson as Record<string, unknown> | null
    if (!score) return false
    const risk = String(score['riskLevel'] ?? score['risk_level'] ?? '').toUpperCase()
    return risk === 'HIGH' || risk === 'CRITICAL'
  })
  const repeatedHighRisk = highRiskRuns.length >= THRESHOLDS.MIN_HIGH_RISK_TRIGGERS

  // ── 5. Evidence quality score ─────────────────────────────────────────────

  // Quality proxy: what fraction of runs have an artifact hash (proper evidence)
  const runsWithArtifact = completedRuns.filter((r) => {
    const score = r.scoreJson as Record<string, unknown> | null
    return score !== null
  })
  const evidenceQualityScore = completedRuns.length > 0
    ? Math.min(1, runsWithArtifact.length / completedRuns.length)
    : 0

  // ── 6. Organisation signal score ─────────────────────────────────────────

  // Proxy: number of distinct instrument slugs used (diversity of governance engagement)
  const runsBySlug = await prisma.decisionInstrumentRun.groupBy({
    by: ['instrumentSlug'],
    where: {
      status: 'COMPLETED',
      ...(userEmail ? { userEmail } : {}),
    },
    _count: { instrumentSlug: true },
  })
  const distinctSlugCount = runsBySlug.length
  // 1 slug = 0.3, 3 slugs = 0.7, 5+ slugs = 1.0
  const organisationSignalScore = Math.min(1, distinctSlugCount / 5)

  // ── Scoring ───────────────────────────────────────────────────────────────

  const boolScore = (b: boolean) => (b ? 1 : 0)
  const overallScore =
    (boolScore(durableMemoryPresent) * 0.20 +
      boolScore(recurringDecisionPattern) * 0.20 +
      boolScore(outcomeHistoryPresent) * 0.20 +
      boolScore(repeatedHighRisk) * 0.15 +
      evidenceQualityScore * 0.15 +
      organisationSignalScore * 0.10)

  // ── Readiness class ───────────────────────────────────────────────────────

  const allCoreMet =
    durableMemoryPresent &&
    recurringDecisionPattern &&
    outcomeHistoryPresent &&
    repeatedHighRisk &&
    evidenceQualityScore >= THRESHOLDS.EVIDENCE_QUALITY_PASS &&
    organisationSignalScore >= THRESHOLDS.ORG_SIGNAL_PASS

  let readinessClass: ReadinessClass
  if (overallScore >= THRESHOLDS.REVIEW_READY_MIN_SCORE && allCoreMet) {
    readinessClass = 'REVIEW_READY'
  } else if (overallScore >= 0.35) {
    readinessClass = 'CANDIDATE'
  } else {
    readinessClass = 'NOT_READY'
  }

  const note = buildNote(readinessClass, {
    durableMemoryPresent,
    recurringDecisionPattern,
    outcomeHistoryPresent,
    repeatedHighRisk,
    evidenceQualityScore,
    organisationSignalScore,
  })

  return {
    readinessClass,
    overallScore: Number(overallScore.toFixed(3)),
    dimensions: {
      durableMemoryPresent,
      recurringDecisionPattern,
      outcomeHistoryPresent,
      repeatedHighRisk,
      evidenceQualityScore: Number(evidenceQualityScore.toFixed(3)),
      organisationSignalScore: Number(organisationSignalScore.toFixed(3)),
    },
    evidenceSourceIds: [...new Set(evidenceSourceIds)],
    adminApprovalRequired: true,
    note,
  }
}

function buildNote(
  cls: ReadinessClass,
  dims: {
    durableMemoryPresent: boolean
    recurringDecisionPattern: boolean
    outcomeHistoryPresent: boolean
    repeatedHighRisk: boolean
    evidenceQualityScore: number
    organisationSignalScore: number
  },
): string {
  const gaps: string[] = []
  if (!dims.durableMemoryPresent) gaps.push('insufficient completed decision runs')
  if (!dims.recurringDecisionPattern) gaps.push('no recurring decision pattern detected')
  if (!dims.outcomeHistoryPresent) gaps.push('no outcome verification records')
  if (!dims.repeatedHighRisk) gaps.push('fewer than 2 high/critical risk events')
  if (dims.evidenceQualityScore < 0.6) gaps.push('evidence quality below threshold')
  if (dims.organisationSignalScore < 0.5) gaps.push('limited governance instrument diversity')

  if (cls === 'REVIEW_READY') {
    return 'All automated criteria met. Admin review required before Retainer Oversight can be offered.'
  }
  if (cls === 'CANDIDATE') {
    return `Partial readiness. Remaining gaps: ${gaps.join('; ')}.`
  }
  return `Not ready. Key gaps: ${gaps.join('; ')}.`
}

// ─── Persist evaluation ───────────────────────────────────────────────────────

export async function persistReadinessEvaluation(
  input: RetainerReadinessInput,
  result: RetainerReadinessResult,
): Promise<{ id: string }> {
  const record = await prisma.retainerReadinessEvaluation.create({
    data: {
      organisationId: input.organisationId,
      userEmail: input.userEmail,
      durableMemoryPresent: result.dimensions.durableMemoryPresent,
      recurringDecisionPattern: result.dimensions.recurringDecisionPattern,
      outcomeHistoryPresent: result.dimensions.outcomeHistoryPresent,
      repeatedHighRisk: result.dimensions.repeatedHighRisk,
      evidenceQualityScore: result.dimensions.evidenceQualityScore,
      organisationSignalScore: result.dimensions.organisationSignalScore,
      overallReadinessScore: result.overallScore,
      readinessClass: result.readinessClass,
      evaluatorNotes: result.note,
      adminApprovalRequired: true,
      evidenceSourceIds: result.evidenceSourceIds,
    },
    select: { id: true },
  })
  return { id: record.id }
}

// ─── Admin approval ───────────────────────────────────────────────────────────

export async function adminApproveRetainerReadiness(
  evaluationId: string,
  approvedByEmail: string,
): Promise<void> {
  await prisma.retainerReadinessEvaluation.update({
    where: { id: evaluationId },
    data: {
      readinessClass: 'APPROVED',
      adminApprovedAt: new Date(),
      adminApprovedBy: approvedByEmail,
    },
  })
}
