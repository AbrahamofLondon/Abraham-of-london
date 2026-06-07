/**
 * lib/decision-instruments/instrument-run-authority.ts
 *
 * Authority gate for Decision Instrument runs.
 *
 * Rules:
 *   1. Every paid instrument run must verify entitlement before execution.
 *   2. Every run must persist a DecisionInstrumentRun record immediately on start.
 *   3. If persistence fails, the run must be abandoned — not silently continued.
 *   4. Artifact generation (PDF) requires artifactState=GENERATING before starting.
 *   5. The instrument slug must match a known catalog entitlement.
 *   6. Anonymous runs (no userId and no userEmail) are blocked for paid instruments.
 *
 * This service is the enforcement layer. Call verifyInstrumentEntitlement() before
 * executing any paid instrument.
 */

import { prisma } from '@/lib/prisma'
import crypto from 'node:crypto'

// ─── Known instrument slugs ───────────────────────────────────────────────────

/**
 * Known instrument slugs and their catalog entitlement slugs.
 * Source: lib/product/product-estate-contract.ts governed_instruments family.
 */
export const INSTRUMENT_ENTITLEMENTS: Record<string, string> = {
  'decision-exposure-instrument':        'decision_exposure_instrument',
  'mandate-clarity-framework':           'mandate_clarity_framework',
  'intervention-path-selector':          'intervention_path_selector',
  'escalation-readiness-scorecard':      'escalation_readiness_scorecard',
  'structural-failure-diagnostic-canvas':'structural_failure_diagnostic_canvas',
  'execution-risk-index':                'execution_risk_index',
  'team-alignment-gap-map':              'team_alignment_gap_map',
  'governance-drift-detector':           'governance_drift_detector',
  'strategic-priority-stack-builder':    'strategic_priority_stack_builder',
  'board-brief-builder':                 'board_brief_builder',
  'operator-decision-pack':              'operator_decision_pack',
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InstrumentRunStartInput {
  instrumentSlug: string
  userId?: string
  userEmail?: string
  entitlementSlug: string
  inputObject?: unknown
}

export interface InstrumentRunRecord {
  id: string
  instrumentSlug: string
  status: string
  entitlementVerified: boolean
  inputSnapshotHash: string | null
  createdAt: Date
}

// ─── Errors ───────────────────────────────────────────────────────────────────

export class InstrumentEntitlementError extends Error {
  constructor(instrumentSlug: string, reason: string) {
    super(`Instrument entitlement denied for "${instrumentSlug}": ${reason}`)
    this.name = 'InstrumentEntitlementError'
  }
}

export class InstrumentRunPersistenceError extends Error {
  constructor(instrumentSlug: string, cause: unknown) {
    super(
      `Failed to persist DecisionInstrumentRun for "${instrumentSlug}". ` +
      `Run must be abandoned — not silently continued. Cause: ${cause}`,
    )
    this.name = 'InstrumentRunPersistenceError'
  }
}

// ─── Hash utility ─────────────────────────────────────────────────────────────

export function hashRunInput(input: unknown): string {
  const json = JSON.stringify(input)
  return crypto.createHash('sha256').update(json).digest('hex')
}

// ─── Entitlement verification ─────────────────────────────────────────────────

/**
 * Verify that an instrument run has a valid entitlement.
 * Throws InstrumentEntitlementError if verification fails.
 *
 * This does NOT check the live Stripe/DB entitlement — that is done by the
 * checkout flow. This verifies that:
 *   1. The instrument slug is recognised
 *   2. The entitlement slug matches the expected value for this instrument
 *   3. The run has a user identity (userId or userEmail)
 *
 * Actual entitlement DB check is delegated to the checkout/entitlement service.
 */
export function verifyInstrumentEntitlement(input: {
  instrumentSlug: string
  userId?: string | null
  userEmail?: string | null
  entitlementSlug: string
}): void {
  const expectedEntitlement = INSTRUMENT_ENTITLEMENTS[input.instrumentSlug]
  if (!expectedEntitlement) {
    throw new InstrumentEntitlementError(
      input.instrumentSlug,
      `"${input.instrumentSlug}" is not a recognised instrument slug. ` +
      `Known slugs: ${Object.keys(INSTRUMENT_ENTITLEMENTS).join(', ')}`,
    )
  }

  if (input.entitlementSlug !== expectedEntitlement) {
    throw new InstrumentEntitlementError(
      input.instrumentSlug,
      `entitlementSlug "${input.entitlementSlug}" does not match expected "${expectedEntitlement}"`,
    )
  }

  const hasIdentity = Boolean(input.userId) || Boolean(input.userEmail)
  if (!hasIdentity) {
    throw new InstrumentEntitlementError(
      input.instrumentSlug,
      `anonymous runs are not allowed for paid instruments. Provide userId or userEmail.`,
    )
  }
}

// ─── Run persistence ──────────────────────────────────────────────────────────

/**
 * Start a Decision Instrument run.
 * 1. Verifies entitlement
 * 2. Persists a DecisionInstrumentRun record with status=STARTED
 * 3. Returns the persisted record ID
 *
 * If persistence fails, throws InstrumentRunPersistenceError.
 * The caller must NOT continue the run if this throws.
 */
export async function startInstrumentRun(
  input: InstrumentRunStartInput,
): Promise<InstrumentRunRecord> {
  verifyInstrumentEntitlement(input)

  const inputSnapshotHash = input.inputObject != null ? hashRunInput(input.inputObject) : null

  let record: InstrumentRunRecord
  try {
    record = await prisma.decisionInstrumentRun.create({
      data: {
        instrumentSlug: input.instrumentSlug,
        userId: input.userId ?? null,
        userEmail: input.userEmail ?? null,
        entitlementSlug: input.entitlementSlug,
        entitlementVerified: true,
        inputSnapshotHash,
        status: 'STARTED',
        artifactState: 'NONE',
      },
      select: {
        id: true,
        instrumentSlug: true,
        status: true,
        entitlementVerified: true,
        inputSnapshotHash: true,
        createdAt: true,
      },
    })
  } catch (err) {
    throw new InstrumentRunPersistenceError(input.instrumentSlug, err)
  }

  return record
}

/**
 * Mark an instrument run as completed with its score result.
 */
export async function completeInstrumentRun(
  runId: string,
  result: {
    scoreJson: unknown
    runDurationMs?: number
    nextRouteSlug?: string
  },
): Promise<void> {
  await prisma.decisionInstrumentRun.update({
    where: { id: runId },
    data: {
      status: 'COMPLETED',
      scoreJson: result.scoreJson as never,
      runDurationMs: result.runDurationMs ?? null,
      nextRouteSlug: result.nextRouteSlug ?? null,
      completedAt: new Date(),
    },
  })
}

/**
 * Mark an instrument run as failed.
 */
export async function failInstrumentRun(runId: string, errorMessage: string): Promise<void> {
  await prisma.decisionInstrumentRun.update({
    where: { id: runId },
    data: {
      status: 'FAILED',
      errorMessage,
    },
  })
}

/**
 * Begin artifact generation for a completed run.
 * Sets artifactState=GENERATING.
 */
export async function beginArtifactGeneration(runId: string): Promise<void> {
  await prisma.decisionInstrumentRun.update({
    where: { id: runId },
    data: { artifactState: 'GENERATING' },
  })
}

/**
 * Record a generated artifact for a run.
 */
export async function recordArtifact(
  runId: string,
  artifact: { artifactUrl: string; artifactHash: string },
): Promise<void> {
  await prisma.decisionInstrumentRun.update({
    where: { id: runId },
    data: {
      artifactState: 'READY',
      artifactUrl: artifact.artifactUrl,
      artifactHash: artifact.artifactHash,
    },
  })
}

/**
 * Get all runs for a user by email.
 * Admin use only.
 */
export async function getRunsByEmail(userEmail: string) {
  return prisma.decisionInstrumentRun.findMany({
    where: { userEmail },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}
