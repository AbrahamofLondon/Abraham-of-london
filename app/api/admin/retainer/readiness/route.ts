// app/api/admin/retainer/readiness/route.ts
//
// Admin-only retainer readiness evaluation API.
//
// GET  ?userEmail=... | ?organisationId=...
//      Returns latest evaluation for the given subject.
//
// POST { userEmail?, organisationId? }
//      Runs a fresh automated evaluation and persists the result.
//      Returns readinessClass, overallScore, dimensions, gaps.
//
// PATCH { evaluationId, action: "approve", approvedByEmail }
//      Admin approves a REVIEW_READY evaluation → APPROVED.
//
// Rules:
//   - Admin-only: requireAdminAppRoute enforced.
//   - Admin approval is always required; automated evaluation alone cannot activate retainer.
//   - Retainer Oversight remains dormant until both REVIEW_READY and admin APPROVED.

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAppRoute } from '@/lib/admin/admin-route-guard'
import { prisma } from '@/lib/prisma.server'
import {
  evaluateRetainerReadiness,
  persistReadinessEvaluation,
  adminApproveRetainerReadiness,
} from '@/lib/retainer/readiness-evaluator'
import { z } from 'zod'

// ─── GET — latest evaluation for subject ─────────────────────────────────────

export async function GET(request: NextRequest) {
  const adminCheck = await requireAdminAppRoute()
  if (!adminCheck.authorized) return adminCheck.response

  const url = new URL(request.url)
  const userEmail = url.searchParams.get('userEmail') ?? undefined
  const organisationId = url.searchParams.get('organisationId') ?? undefined

  if (!userEmail && !organisationId) {
    return NextResponse.json(
      { ok: false, error: 'userEmail or organisationId is required' },
      { status: 400 },
    )
  }

  const evaluations = await prisma.retainerReadinessEvaluation.findMany({
    where: {
      ...(userEmail ? { userEmail } : {}),
      ...(organisationId ? { organisationId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  return NextResponse.json({ ok: true, evaluations })
}

// ─── POST — run fresh evaluation ─────────────────────────────────────────────

const EvaluateSchema = z.object({
  userEmail: z.string().email().optional(),
  organisationId: z.string().optional(),
}).refine((d) => d.userEmail || d.organisationId, {
  message: 'userEmail or organisationId is required',
})

export async function POST(request: NextRequest) {
  const adminCheck = await requireAdminAppRoute()
  if (!adminCheck.authorized) return adminCheck.response

  let body: unknown
  try { body = await request.json() } catch { body = {} }

  const parsed = EvaluateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const input = parsed.data
  const result = await evaluateRetainerReadiness(input)
  const { id } = await persistReadinessEvaluation(input, result)

  return NextResponse.json({
    ok: true,
    evaluationId: id,
    readinessClass: result.readinessClass,
    overallScore: result.overallScore,
    dimensions: result.dimensions,
    adminApprovalRequired: result.adminApprovalRequired,
    note: result.note,
    evidenceSourceCount: result.evidenceSourceIds.length,
  }, { status: 201 })
}

// ─── PATCH — admin approval ───────────────────────────────────────────────────

const ApproveSchema = z.object({
  evaluationId: z.string().min(1),
  action: z.literal('approve'),
  approvedByEmail: z.string().email(),
})

export async function PATCH(request: NextRequest) {
  const adminCheck = await requireAdminAppRoute()
  if (!adminCheck.authorized) return adminCheck.response

  let body: unknown
  try { body = await request.json() } catch { body = {} }

  const parsed = ApproveSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const { evaluationId, approvedByEmail } = parsed.data

  const evaluation = await prisma.retainerReadinessEvaluation.findUnique({
    where: { id: evaluationId },
  })

  if (!evaluation) {
    return NextResponse.json(
      { ok: false, error: 'Evaluation not found' },
      { status: 404 },
    )
  }

  if (evaluation.readinessClass !== 'REVIEW_READY' && evaluation.readinessClass !== 'APPROVED') {
    return NextResponse.json(
      {
        ok: false,
        error: 'Only REVIEW_READY evaluations can be approved',
        currentClass: evaluation.readinessClass,
      },
      { status: 422 },
    )
  }

  if (evaluation.readinessClass === 'APPROVED') {
    return NextResponse.json(
      { ok: false, error: 'Evaluation already approved' },
      { status: 409 },
    )
  }

  await adminApproveRetainerReadiness(evaluationId, approvedByEmail)

  return NextResponse.json({
    ok: true,
    evaluationId,
    readinessClass: 'APPROVED',
    approvedByEmail,
    approvedAt: new Date().toISOString(),
    message: 'Retainer readiness approved. Retainer Oversight offer may now be extended.',
  })
}
