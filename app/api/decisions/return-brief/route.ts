// app/api/decisions/return-brief/route.ts
//
// Return Brief 2.0 — outcome verification endpoint.
//
// When a decision deadline passes, a Return Brief request is triggered.
// The user submits what happened, and the system records the outcome.
//
// POST { decisionInstrumentRunId? | boardroomDossierId? | decisionObjectId?,
//        outcomeClass, outcomeDetail, ownerCorrect?, evidenceMissing?,
//        evidenceMissingNote?, whatChanged?, carryForward?,
//        decisionDeadline?, outcomeDate? }
//
// GET  ?runId=... | ?dossierId=... — retrieve outcome records for a run/dossier
//
// AUTHORITY RULES:
//   - POST: requires authentication. Only the original run owner may submit
//     (or admin override).
//   - GET: authentication required. Owns-or-admin check.
//   - outcomeClass must be one of: SUCCESS | MITIGATED | PARTIAL | FAILURE | DEFERRED | UNKNOWN
//   - memorySummary is written by system logic (not user input) for future decisions.

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma.server'
import { closeHypothesis } from '@/lib/outcomes/outcome-hypothesis'
import { observePatterns } from '@/lib/memory/pattern-observer'
import { createInternalRegistryEntry } from '@/lib/product/public-decision-registry'
import { z } from 'zod'

// ─── Outcome classification ───────────────────────────────────────────────────

const OUTCOME_CLASSES = ['SUCCESS', 'MITIGATED', 'PARTIAL', 'FAILURE', 'DEFERRED', 'UNKNOWN'] as const
type OutcomeClass = typeof OUTCOME_CLASSES[number]

// ─── Return Brief schema ──────────────────────────────────────────────────────

const ReturnBriefSchema = z.object({
  decisionInstrumentRunId: z.string().optional(),
  boardroomDossierId: z.string().optional(),
  decisionObjectId: z.string().optional(),
  strategySessionId: z.string().optional(),
  outcomeClass: z.enum(OUTCOME_CLASSES),
  outcomeDetail: z.string().min(10, 'Please describe what happened (at least 10 characters)').max(5000),
  ownerCorrect: z.boolean().optional(),
  evidenceMissing: z.boolean().default(false),
  evidenceMissingNote: z.string().max(2000).optional(),
  whatChanged: z.string().max(2000).optional(),
  carryForward: z.string().max(2000).optional(),
  decisionDeadline: z.string().datetime().optional(),
  outcomeDate: z.string().datetime().optional(),
  registryOptIn: z.boolean().optional().default(false),
  registrySectorTaxonomy: z.string().optional(),
  registryCompanySizeBand: z.string().optional(),
  registryRegionTaxonomy: z.string().optional(),
  costOfDelayMethodology: z.string().optional(),
  costOfDelayBand: z.string().optional(),
}).refine(
  (d) => d.decisionInstrumentRunId || d.boardroomDossierId || d.decisionObjectId || d.strategySessionId,
  { message: 'At least one source reference (runId, dossierId, decisionObjectId, sessionId) is required' },
)

// ─── Build memory summary ─────────────────────────────────────────────────────

function buildMemorySummary(outcomeClass: OutcomeClass, detail: string): string {
  const prefix: Record<OutcomeClass, string> = {
    SUCCESS:   'Decision outcome: successful. ',
    MITIGATED: 'Decision outcome: risk mitigated. ',
    PARTIAL:   'Decision outcome: partially resolved. ',
    FAILURE:   'Decision outcome: failed. ',
    DEFERRED:  'Decision outcome: deferred. ',
    UNKNOWN:   'Decision outcome: unverified. ',
  }
  // Truncate to 300 chars for memory note
  const summary = detail.length > 200 ? detail.slice(0, 200) + '…' : detail
  return `${prefix[outcomeClass]}${summary}`
}

// ─── POST — submit Return Brief ───────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json(
      { ok: false, error: 'Authentication required' },
      { status: 401 },
    )
  }

  let body: unknown
  try { body = await request.json() } catch { body = {} }

  const parsed = ReturnBriefSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const data = parsed.data
  const userEmail = session.user.email

  // If linked to a DecisionInstrumentRun, verify ownership
  if (data.decisionInstrumentRunId) {
    const run = await prisma.decisionInstrumentRun.findUnique({
      where: { id: data.decisionInstrumentRunId },
      select: { userEmail: true, userId: true },
    })
    if (!run) {
      return NextResponse.json(
        { ok: false, error: 'Run not found', code: 'RUN_NOT_FOUND' },
        { status: 404 },
      )
    }
    if (run.userEmail !== userEmail) {
      return NextResponse.json(
        { ok: false, error: 'Access denied — run belongs to another account', code: 'OWNERSHIP_DENIED' },
        { status: 403 },
      )
    }
  }

  const hypothesisSourceIds = [
    data.decisionInstrumentRunId,
    data.decisionObjectId,
    data.strategySessionId,
  ].filter((value): value is string => Boolean(value))

  if (data.boardroomDossierId) {
    const dossier = await prisma.boardroomDossier.findUnique({
      where: { id: data.boardroomDossierId },
      select: { clientEmail: true, orderId: true },
    })
    if (!dossier) {
      return NextResponse.json(
        { ok: false, error: 'Dossier not found', code: 'DOSSIER_NOT_FOUND' },
        { status: 404 },
      )
    }
    if (dossier.clientEmail !== userEmail) {
      return NextResponse.json(
        { ok: false, error: 'Access denied — dossier belongs to another account', code: 'OWNERSHIP_DENIED' },
        { status: 403 },
      )
    }
    if (dossier.orderId) hypothesisSourceIds.push(dossier.orderId)
  }

  const memorySummary = buildMemorySummary(data.outcomeClass, data.outcomeDetail)

  const record = await prisma.decisionOutcomeRecord.create({
    data: {
      decisionInstrumentRunId: data.decisionInstrumentRunId,
      boardroomDossierId: data.boardroomDossierId,
      decisionObjectId: data.decisionObjectId,
      strategySessionId: data.strategySessionId,
      submittedByEmail: userEmail,
      outcomeClass: data.outcomeClass,
      outcomeDetail: data.outcomeDetail,
      ownerCorrect: data.ownerCorrect,
      evidenceMissing: data.evidenceMissing,
      evidenceMissingNote: data.evidenceMissingNote,
      whatChanged: data.whatChanged,
      carryForward: data.carryForward,
      decisionDeadline: data.decisionDeadline ? new Date(data.decisionDeadline) : undefined,
      outcomeDate: data.outcomeDate ? new Date(data.outcomeDate) : undefined,
      memorySummary,
    },
    select: { id: true, outcomeClass: true, createdAt: true },
  })

  const hypothesis = hypothesisSourceIds.length > 0
    ? await prisma.outcomeHypothesis.findFirst({
        where: {
          sourceRunId: { in: hypothesisSourceIds },
          userEmail,
          status: { in: ['OPEN', 'RETURN_BRIEF_REQUESTED'] },
        },
        orderBy: { reviewDate: 'asc' },
        select: { hypothesisId: true },
      })
    : null

  if (hypothesis) {
    await closeHypothesis(hypothesis.hypothesisId, record.id)
  }

  const patternResult = await observePatterns({ userEmail }).catch(() => null)
  const returnBriefRequest = hypothesis
    ? await prisma.returnBriefRequest.findFirst({
        where: {
          outcomeHypothesisId: hypothesis.hypothesisId,
          status: { in: ['PENDING', 'SENT'] },
        },
        orderBy: { dueAt: 'asc' },
        select: { id: true },
      })
    : null

  await prisma.returnBriefResponse.create({
    data: {
      requestId: returnBriefRequest?.id ?? null,
      decisionOutcomeRecordId: record.id,
      submittedByEmail: userEmail,
      outcomeClass: data.outcomeClass,
      responsePayload: {
        outcomeDetail: data.outcomeDetail,
        ownerCorrect: data.ownerCorrect ?? null,
        evidenceMissing: data.evidenceMissing,
        evidenceMissingNote: data.evidenceMissingNote ?? null,
        whatChanged: data.whatChanged ?? null,
        carryForward: data.carryForward ?? null,
      },
      evidenceRefs: [
        data.decisionInstrumentRunId ? { sourceType: 'DecisionInstrumentRun', sourceId: data.decisionInstrumentRunId } : null,
        data.boardroomDossierId ? { sourceType: 'BoardroomDossier', sourceId: data.boardroomDossierId } : null,
        data.decisionObjectId ? { sourceType: 'DiagnosticDecisionObject', sourceId: data.decisionObjectId } : null,
        data.strategySessionId ? { sourceType: 'StrategySession', sourceId: data.strategySessionId } : null,
      ].filter(Boolean),
    },
  })

  if (returnBriefRequest) {
    await prisma.returnBriefRequest.update({
      where: { id: returnBriefRequest.id },
      data: { status: 'SUBMITTED', submittedAt: new Date() },
    })
  }

  if (patternResult?.patterns.length) {
    await prisma.outcomePatternObservation.createMany({
      data: patternResult.patterns.map((pattern) => ({
        decisionOutcomeRecordId: record.id,
        userEmail,
        patternType: pattern.patternType,
        riskOfRepeat: pattern.riskOfRepeat,
        observationSummary: pattern.patternDetail,
        sourceRunIds: pattern.sourceRunIds as never,
      })),
    })
  }

  const registryEntry = data.registryOptIn
    ? await createInternalRegistryEntry({
        sourceOutcomeRecordId: record.id,
        productCode: data.decisionInstrumentRunId
          ? 'decision_instruments'
          : data.boardroomDossierId
            ? 'boardroom_brief'
            : data.strategySessionId
              ? 'strategy_room'
              : 'return_brief',
        email: userEmail,
        optInStatus: 'OPTED_IN',
        sectorTaxonomy: data.registrySectorTaxonomy ?? null,
        companySizeBand: data.registryCompanySizeBand ?? null,
        regionTaxonomy: data.registryRegionTaxonomy ?? null,
        outcomeClass: data.outcomeClass,
        costOfDelayMethodology: data.costOfDelayMethodology ?? null,
        costOfDelayBand: data.costOfDelayBand ?? null,
      }).catch(() => null)
    : null

  return NextResponse.json({
    ok: true,
    recordId: record.id,
    outcomeClass: record.outcomeClass,
    memorySummary,
    outcomeHypothesisId: hypothesis?.hypothesisId ?? null,
    patternsObserved: patternResult?.patterns.length ?? 0,
    registryEntryId: registryEntry?.id ?? null,
    submittedAt: record.createdAt.toISOString(),
    message: 'Return Brief recorded. This outcome will inform future decision guidance.',
  }, { status: 201 })
}

// ─── GET — retrieve outcome records ──────────────────────────────────────────

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json(
      { ok: false, error: 'Authentication required' },
      { status: 401 },
    )
  }

  const url = new URL(request.url)
  const runId = url.searchParams.get('runId') ?? undefined
  const dossierId = url.searchParams.get('dossierId') ?? undefined
  const userEmail = session.user.email

  const records = await prisma.decisionOutcomeRecord.findMany({
    where: {
      submittedByEmail: userEmail,
      ...(runId ? { decisionInstrumentRunId: runId } : {}),
      ...(dossierId ? { boardroomDossierId: dossierId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      decisionInstrumentRunId: true,
      boardroomDossierId: true,
      outcomeClass: true,
      outcomeDetail: true,
      ownerCorrect: true,
      evidenceMissing: true,
      whatChanged: true,
      carryForward: true,
      memorySummary: true,
      decisionDeadline: true,
      outcomeDate: true,
      createdAt: true,
    },
  })

  return NextResponse.json({
    ok: true,
    count: records.length,
    records: records.map((r) => ({
      ...r,
      decisionDeadline: r.decisionDeadline?.toISOString() ?? null,
      outcomeDate: r.outcomeDate?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
  })
}
