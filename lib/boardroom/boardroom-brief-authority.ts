/**
 * lib/boardroom/boardroom-brief-authority.ts
 *
 * Authority gate for Boardroom Brief paid delivery.
 *
 * Rules:
 *   1. Paid delivery must NEVER use fixture data (boardroom-dev-spine.ts).
 *   2. Every paid dossier must have a real spineId pointing to a live DB record.
 *   3. sourceType must be EXECUTIVE_REPORT | DIAGNOSTIC_RUN | ER_BOARDROOM_BRIDGE_RUN — never MANUAL_SYNTHETIC_SAMPLE.
 *   4. The fixture spine ID "fixture-qualifying-001" is banned from paid delivery.
 *   5. An inputSnapshotHash must be recorded before generation to prove the input is stable.
 *   6. An artifactHash must be recorded after generation to prove the output is stable.
 *
 * This service is the enforcement layer. Import it in the admin delivery route
 * and call assertPaidDeliveryAuthorised() before generating any paid dossier.
 */

import crypto from 'node:crypto'

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * The fixture spine ID from boardroom-dev-spine.ts.
 * This ID is permanently banned from paid delivery.
 */
export const DEV_SPINE_FIXTURE_ID = 'fixture-qualifying-001'

/**
 * Banned sourceType values for paid delivery.
 */
export const BANNED_SOURCE_TYPES_FOR_PAID = new Set([
  'MANUAL_SYNTHETIC_SAMPLE',
])

/**
 * Allowed sourceType values for paid delivery.
 */
export const ALLOWED_SOURCE_TYPES_FOR_PAID = [
  'EXECUTIVE_REPORT',
  'DIAGNOSTIC_RUN',
  'ER_BOARDROOM_BRIDGE_RUN',
] as const

export type AllowedPaidSourceType = typeof ALLOWED_SOURCE_TYPES_FOR_PAID[number]

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaidDeliveryInput {
  /** ID of the IntelligenceSpine or source record being used */
  spineId: string
  /** Source type — must not be MANUAL_SYNTHETIC_SAMPLE */
  sourceType: string
  /** Whether this is flagged as a sample/demo dossier */
  isSample: boolean
  /** Optional: the raw input object to hash for provenance */
  inputObject?: unknown
}

export interface PaidDeliveryAuthorityResult {
  authorised: boolean
  violations: string[]
  inputSnapshotHash: string | null
}

// ─── Errors ───────────────────────────────────────────────────────────────────

export class BoardroomDeliveryAuthorityError extends Error {
  constructor(violations: string[]) {
    super(
      `Boardroom Brief paid delivery authority check failed:\n` +
      violations.map((v) => `  - ${v}`).join('\n'),
    )
    this.name = 'BoardroomDeliveryAuthorityError'
  }
}

// ─── Hash Utilities ───────────────────────────────────────────────────────────

/**
 * SHA-256 hash of a JSON-serialisable input object.
 * Used to prove input snapshot stability at generation time.
 */
export function hashInputSnapshot(input: unknown): string {
  const json = JSON.stringify(input, Object.keys(input as object).sort())
  return crypto.createHash('sha256').update(json).digest('hex')
}

/**
 * SHA-256 hash of a JSON-serialisable output object (the dossier artifact).
 * Used to prove the generated artifact has not changed after delivery.
 */
export function hashArtifact(artifact: unknown): string {
  const json = JSON.stringify(artifact)
  return crypto.createHash('sha256').update(json).digest('hex')
}

// ─── Authority Check ──────────────────────────────────────────────────────────

/**
 * Check whether the given paid delivery input is authorised.
 * Returns a result with all violations found.
 */
export function checkPaidDeliveryAuthority(input: PaidDeliveryInput): PaidDeliveryAuthorityResult {
  const violations: string[] = []

  // 1. Dev-spine fixture ID banned
  if (input.spineId === DEV_SPINE_FIXTURE_ID) {
    violations.push(
      `spineId "${DEV_SPINE_FIXTURE_ID}" is the development fixture from boardroom-dev-spine.ts. ` +
      `Paid delivery must use a real IntelligenceSpine loaded from the database.`,
    )
  }

  // 2. MANUAL_SYNTHETIC_SAMPLE banned
  if (BANNED_SOURCE_TYPES_FOR_PAID.has(input.sourceType)) {
    violations.push(
      `sourceType "${input.sourceType}" is not allowed for paid delivery. ` +
      `Use one of: ${ALLOWED_SOURCE_TYPES_FOR_PAID.join(', ')}.`,
    )
  }

  // 3. isSample must be false for paid delivery
  if (input.isSample) {
    violations.push(
      `isSample is true. Paid delivery must not produce sample/demo dossiers. ` +
      `Set isSample=false for real paid output.`,
    )
  }

  // 4. spineId must look like a real ID, not a fixture prefix
  if (input.spineId.startsWith('fixture-') || input.spineId.startsWith('demo-') || input.spineId.startsWith('sample-')) {
    violations.push(
      `spineId "${input.spineId}" has a fixture/demo/sample prefix. ` +
      `Paid delivery requires a real DB-sourced spine ID.`,
    )
  }

  // 5. sourceType must be an allowed value
  const isAllowedType = ALLOWED_SOURCE_TYPES_FOR_PAID.includes(input.sourceType as AllowedPaidSourceType)
  if (!BANNED_SOURCE_TYPES_FOR_PAID.has(input.sourceType) && !isAllowedType) {
    violations.push(
      `sourceType "${input.sourceType}" is unrecognised. ` +
      `Allowed values: ${ALLOWED_SOURCE_TYPES_FOR_PAID.join(', ')}.`,
    )
  }

  const inputSnapshotHash = input.inputObject != null ? hashInputSnapshot(input.inputObject) : null

  return {
    authorised: violations.length === 0,
    violations,
    inputSnapshotHash,
  }
}

/**
 * Assert that a paid delivery is authorised. Throws if not.
 * Call this in the admin delivery route before generating any paid dossier.
 */
export function assertPaidDeliveryAuthorised(input: PaidDeliveryInput): { inputSnapshotHash: string | null } {
  const result = checkPaidDeliveryAuthority(input)
  if (!result.authorised) {
    throw new BoardroomDeliveryAuthorityError(result.violations)
  }
  return { inputSnapshotHash: result.inputSnapshotHash }
}

// ─── Delivery State Machine ───────────────────────────────────────────────────

export type BoardroomDossierState =
  | 'DRAFT'           // Generated, not yet approved for delivery
  | 'APPROVED'        // Admin-approved for customer delivery
  | 'DELIVERED'       // Access token sent; customer has received access
  | 'VIEWED'          // Customer has viewed the dossier
  | 'CONFIRMED'       // Customer has confirmed receipt
  | 'REVOKED'         // Access revoked (refund, dispute, or error)

/**
 * Valid state transitions for a Boardroom Dossier.
 * Prevents illegal state jumps (e.g. DRAFT → CONFIRMED).
 */
export const DOSSIER_STATE_TRANSITIONS: Record<BoardroomDossierState, BoardroomDossierState[]> = {
  DRAFT:     ['APPROVED', 'REVOKED'],
  APPROVED:  ['DELIVERED', 'REVOKED'],
  DELIVERED: ['VIEWED', 'REVOKED'],
  VIEWED:    ['CONFIRMED', 'REVOKED'],
  CONFIRMED: ['REVOKED'],
  REVOKED:   [], // terminal
}

/**
 * Assert that a state transition is valid.
 * Throws if the transition is not allowed.
 */
export function assertDossierStateTransition(
  currentState: BoardroomDossierState,
  nextState: BoardroomDossierState,
): void {
  const allowed = DOSSIER_STATE_TRANSITIONS[currentState]
  if (!allowed.includes(nextState)) {
    throw new Error(
      `Invalid dossier state transition: ${currentState} → ${nextState}. ` +
      `Allowed transitions from ${currentState}: ${allowed.join(', ') || 'none (terminal state)'}`,
    )
  }
}
