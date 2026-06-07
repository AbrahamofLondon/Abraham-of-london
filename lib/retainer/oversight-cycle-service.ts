/**
 * lib/retainer/oversight-cycle-service.ts
 *
 * Oversight Review Cycle management for the Retainer Oversight product.
 *
 * Each retained client gets monthly oversight review cycles.
 * Cycles persist: review state, interventions, drift score, and client health.
 *
 * This service is the authority layer for Retainer Oversight fulfilment.
 * Before calling this, the RetainerContract must exist and be ACTIVE.
 */

import { prisma } from '@/lib/prisma'

// ─── Types ────────────────────────────────────────────────────────────────────

export type DriftCategory = 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
export type ClientHealthStatus = 'HEALTHY' | 'WATCH' | 'DETERIORATING' | 'CRITICAL' | 'UNKNOWN'
export type CycleStatus = 'OPEN' | 'UNDER_REVIEW' | 'COMPLETED' | 'SKIPPED'

export interface InterventionLogEntry {
  timestamp: string
  interventionType: string
  description: string
  performedBy: string
  outcome?: string
}

export interface CreateCycleInput {
  contractId: string
  cycleNumber: number
  periodStart: Date
  periodEnd: Date
  nextCycleDate?: Date
}

export interface CompleteCycleInput {
  runId: string
  reviewedBy: string
  driftScore: number
  driftCategory: DriftCategory
  clientHealthStatus: ClientHealthStatus
  interventionLog?: InterventionLogEntry[]
  outcomeSummary: string
  clientNotes?: string
  internalNotes?: string
  nextCycleDate?: Date
}

export interface AddInterventionInput {
  cycleId: string
  interventionType: string
  description: string
  performedBy: string
  outcome?: string
}

// ─── Errors ───────────────────────────────────────────────────────────────────

export class OversightCycleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OversightCycleError'
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Create a new oversight review cycle for a contract.
 * The cycle number must be unique within the contract.
 */
export async function createOversightCycle(input: CreateCycleInput) {
  const existing = await prisma.oversightReviewCycle.findFirst({
    where: { contractId: input.contractId, cycleNumber: input.cycleNumber },
    select: { id: true },
  })

  if (existing) {
    throw new OversightCycleError(
      `OversightReviewCycle ${input.cycleNumber} already exists for contract ${input.contractId}`,
    )
  }

  return prisma.oversightReviewCycle.create({
    data: {
      contractId: input.contractId,
      cycleNumber: input.cycleNumber,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      status: 'OPEN',
      clientHealthStatus: 'UNKNOWN',
      interventionLog: [],
      nextCycleDate: input.nextCycleDate ?? null,
    },
  })
}

/**
 * Mark a cycle as under review (in progress by the operator).
 */
export async function beginCycleReview(cycleId: string): Promise<void> {
  const cycle = await prisma.oversightReviewCycle.findUnique({
    where: { id: cycleId },
    select: { status: true },
  })

  if (!cycle) {
    throw new OversightCycleError(`OversightReviewCycle ${cycleId} not found`)
  }

  if (cycle.status !== 'OPEN') {
    throw new OversightCycleError(
      `Cannot begin review for cycle ${cycleId}: status is ${cycle.status}, expected OPEN`,
    )
  }

  await prisma.oversightReviewCycle.update({
    where: { id: cycleId },
    data: { status: 'UNDER_REVIEW' },
  })
}

/**
 * Complete a review cycle with drift, health, and intervention data.
 */
export async function completeOversightCycle(input: CompleteCycleInput): Promise<void> {
  const cycle = await prisma.oversightReviewCycle.findUnique({
    where: { id: input.runId },
    select: { status: true },
  })

  if (!cycle) {
    throw new OversightCycleError(`OversightReviewCycle ${input.runId} not found`)
  }

  if (!['OPEN', 'UNDER_REVIEW'].includes(cycle.status)) {
    throw new OversightCycleError(
      `Cannot complete cycle ${input.runId}: status is ${cycle.status}. Expected OPEN or UNDER_REVIEW.`,
    )
  }

  const interventionLog: InterventionLogEntry[] = input.interventionLog ?? []

  await prisma.oversightReviewCycle.update({
    where: { id: input.runId },
    data: {
      status: 'COMPLETED',
      reviewedBy: input.reviewedBy,
      reviewedAt: new Date(),
      driftScore: input.driftScore,
      driftCategory: input.driftCategory,
      clientHealthStatus: input.clientHealthStatus,
      interventionCount: interventionLog.length,
      interventionLog: interventionLog as never,
      outcomeSummary: input.outcomeSummary,
      clientNotes: input.clientNotes ?? null,
      internalNotes: input.internalNotes ?? null,
      nextCycleDate: input.nextCycleDate ?? null,
    },
  })
}

/**
 * Add a single intervention entry to an open or in-progress cycle.
 */
export async function addIntervention(input: AddInterventionInput): Promise<void> {
  const cycle = await prisma.oversightReviewCycle.findUnique({
    where: { id: input.cycleId },
    select: { status: true, interventionLog: true, interventionCount: true },
  })

  if (!cycle) {
    throw new OversightCycleError(`OversightReviewCycle ${input.cycleId} not found`)
  }

  if (cycle.status === 'COMPLETED' || cycle.status === 'SKIPPED') {
    throw new OversightCycleError(
      `Cannot add intervention to cycle ${input.cycleId}: cycle is ${cycle.status}`,
    )
  }

  const existing = Array.isArray(cycle.interventionLog) ? cycle.interventionLog as unknown as InterventionLogEntry[] : []

  const newEntry: InterventionLogEntry = {
    timestamp: new Date().toISOString(),
    interventionType: input.interventionType,
    description: input.description,
    performedBy: input.performedBy,
    outcome: input.outcome,
  }

  await prisma.oversightReviewCycle.update({
    where: { id: input.cycleId },
    data: {
      interventionLog: [...existing, newEntry] as never,
      interventionCount: cycle.interventionCount + 1,
    },
  })
}

/**
 * Get all oversight cycles for a contract, ordered by cycle number.
 */
export async function getCyclesForContract(contractId: string) {
  return prisma.oversightReviewCycle.findMany({
    where: { contractId },
    orderBy: { cycleNumber: 'asc' },
  })
}

/**
 * Get the most recent completed cycle for a contract.
 * Used to determine current client health status.
 */
export async function getLatestCompletedCycle(contractId: string) {
  return prisma.oversightReviewCycle.findFirst({
    where: { contractId, status: 'COMPLETED' },
    orderBy: { cycleNumber: 'desc' },
  })
}

/**
 * Get the current client health for a contract.
 * Returns UNKNOWN if no completed cycles exist.
 */
export async function getClientHealthStatus(contractId: string): Promise<ClientHealthStatus> {
  const latest = await getLatestCompletedCycle(contractId)
  if (!latest) return 'UNKNOWN'
  return (latest.clientHealthStatus as ClientHealthStatus) ?? 'UNKNOWN'
}

/**
 * Skip a cycle (e.g. client requested a pause).
 */
export async function skipCycle(cycleId: string, reason: string): Promise<void> {
  await prisma.oversightReviewCycle.update({
    where: { id: cycleId },
    data: {
      status: 'SKIPPED',
      internalNotes: `Skipped: ${reason}`,
    },
  })
}
