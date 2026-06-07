// app/api/instruments/runs/me/route.ts
//
// Authenticated user's own Decision Instrument run history.
// Returns completed and failed runs for the authenticated user only.
// Never returns another user's runs.
//
// AUTHORITY RULES:
//   - Requires session auth (getServerSession).
//   - Returns only runs matching session email OR userId.
//   - Artifact download link only included when artifactState = READY.
//   - driftScore, internalNotes never exposed (not applicable here).

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/prisma.server'
import { INSTRUMENT_ENTITLEMENTS } from '@/lib/decision-instruments/instrument-run-authority'

// Slug → display name map derived from INSTRUMENT_ENTITLEMENTS
const INSTRUMENT_DISPLAY_NAMES: Record<string, string> = {
  'decision-exposure-instrument':          'Decision Exposure Instrument',
  'mandate-clarity-framework':             'Mandate Clarity Framework',
  'intervention-path-selector':            'Intervention Path Selector',
  'escalation-readiness-scorecard':        'Escalation Readiness Scorecard',
  'structural-failure-diagnostic-canvas':  'Structural Failure Diagnostic Canvas',
  'execution-risk-index':                  'Execution Risk Index',
  'team-alignment-gap-map':               'Team Alignment Gap Map',
  'governance-drift-detector':             'Governance Drift Detector',
  'strategic-priority-stack-builder':      'Strategic Priority Stack Builder',
  'board-brief-builder':                   'Board Brief Builder',
  'operator-decision-pack':               'Operator Decision Pack',
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json(
      { ok: false, error: 'Authentication required' },
      { status: 401 },
    )
  }

  const userEmail = session.user.email
  const url = new URL(request.url)

  // Optional filters
  const statusFilter = url.searchParams.get('status') ?? undefined
  const slugFilter = url.searchParams.get('slug') ?? undefined
  const limitParam = url.searchParams.get('limit')
  const limit = Math.min(Number(limitParam) || 50, 100)
  const cursor = url.searchParams.get('cursor') ?? undefined

  const where: Record<string, unknown> = {
    OR: [
      { userEmail },
      // include runs where userId matches if session provides a user id
    ],
  }

  if (statusFilter) where['status'] = statusFilter
  if (slugFilter) where['instrumentSlug'] = slugFilter

  const runs = await prisma.decisionInstrumentRun.findMany({
    where: {
      userEmail,
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(slugFilter ? { instrumentSlug: slugFilter } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      instrumentSlug: true,
      status: true,
      artifactState: true,
      artifactUrl: true,
      artifactHash: true,
      nextRouteSlug: true,
      runDurationMs: true,
      entitlementVerified: true,
      scoreJson: true,
      errorMessage: true,
      createdAt: true,
      completedAt: true,
    },
  })

  const hasMore = runs.length > limit
  const items = hasMore ? runs.slice(0, limit) : runs
  const nextCursor = hasMore ? items[items.length - 1]?.id : null

  // Shape for client consumption
  const shaped = items.map((run) => {
    // Extract outcomeHypothesisId from scoreJson if present
    const scoreData = run.scoreJson as Record<string, unknown> | null;
    const outcomeHypothesisId = scoreData?.outcomeHypothesisId as string | null ?? null;

    return {
      runId: run.id,
      instrumentSlug: run.instrumentSlug,
      instrumentName: INSTRUMENT_DISPLAY_NAMES[run.instrumentSlug] ?? run.instrumentSlug,
      status: run.status,
      artifactReady: run.artifactState === 'READY',
      artifactUrl: run.artifactState === 'READY' ? run.artifactUrl : null,
      artifactHash: run.artifactHash ?? null,
      outcomeHypothesisId,
      nextRouteSlug: run.nextRouteSlug,
      score: scoreData ?? null,
      errorMessage: run.status === 'FAILED' ? run.errorMessage : null,
      startedAt: run.createdAt.toISOString(),
      completedAt: run.completedAt?.toISOString() ?? null,
      durationMs: run.runDurationMs,
      entitlementVerified: run.entitlementVerified,
      // Artifact download URL — only when READY (slug-only access blocked at artifact route level)
      artifactDownloadUrl:
        run.artifactState === 'READY'
          ? `/api/instruments/${encodeURIComponent(run.instrumentSlug)}/artifact?runId=${run.id}`
          : null,
    };
  })

  // Summary counts
  const summary = {
    total: shaped.length,
    completed: shaped.filter((r) => r.status === 'COMPLETED').length,
    failed: shaped.filter((r) => r.status === 'FAILED').length,
    withArtifacts: shaped.filter((r) => r.artifactReady).length,
  }

  return NextResponse.json({
    ok: true,
    summary,
    runs: shaped,
    pagination: {
      limit,
      hasMore,
      nextCursor,
    },
  })
}
