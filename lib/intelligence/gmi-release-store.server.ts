/**
 * lib/intelligence/gmi-release-store.server.ts
 *
 * DURABLE, TRANSACTIONAL, DISTRIBUTED-SAFE GMI release authority.
 *
 * This is the production system-of-record for mutable GMI release truth:
 * lifecycle state, data lock, candidate/source/content hashes, owner authority,
 * release receipt and predecessor supersession. The static edition DEFINITION
 * (id, title, period, publication target, predecessor/successor, family) stays
 * in market-intelligence-lifecycle.ts — never the mutable release authority.
 *
 * The release operation runs inside ONE PostgreSQL transaction under a
 * transaction-scoped advisory lock (pg_try_advisory_xact_lock). The lock and the
 * writes belong to the same coherent transaction, so two independent connections
 * cannot both release the same edition.
 *
 * In-memory Maps/Sets are NOT used here. See gmi-release-inmemory-adapter.ts for
 * the explicit test-only adapter that preserves the legacy sync contract.
 */
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { Prisma, PrismaClient } from "@prisma/client";
import {
  getPredecessorEditionId,
  isPublicationTargetReached,
} from "./gmi-edition-lifecycle";
import { getMarketIntelligenceRecord } from "./market-intelligence-lifecycle";

// A Prisma client or an interactive-transaction client. Both expose the model
// delegates and $queryRaw used below.
export type GmiDb = PrismaClient | Prisma.TransactionClient;

export interface DurableReleaseState {
  editionId: string;
  lifecycleState: string;
  candidateHash: string | null;
  sourceSnapshotHash: string | null;
  reportContentHash: string | null;
  methodologyVersion: string | null;
  dataLockedAt: Date | null;
  releaseCandidateAt: Date | null;
  publishedAt: Date | null;
  supersedes: string | null;
  supersededBy: string | null;
  publicVisible: boolean;
  purchasable: boolean;
  version: number;
}

export interface DurableAuthority {
  id: string;
  editionId: string;
  candidateHash: string;
  authorizedBy: string;
  authorizedAt: Date;
  authorityScope: string;
  revokedAt: Date | null;
}

export interface DurableReceipt {
  id: string;
  editionId: string;
  candidateHash: string;
  sourceSnapshotHash: string;
  reportContentHash: string;
  methodologyVersion: string;
  pdfHash: string | null;
  releaseChecklistVersion: string;
  authorityId: string;
  publishedAt: Date;
}

export interface ReleaseTransactionInput {
  editionId: string;
  candidateHash: string;
  sourceSnapshotHash: string;
  reportContentHash: string;
  methodologyVersion: string;
  pdfHash: string | null;
  releaseChecklistVersion: string;
}

export type ReleaseFailureReason =
  | "CONCURRENT_RELEASE"
  | "ALREADY_RELEASED"
  | "EDITION_STATE_MISSING"
  | "TEMPORAL_NOT_REACHED"
  | "DATA_LOCK_INCOMPLETE"
  | "LIFECYCLE_NOT_RELEASABLE"
  | "OWNER_AUTHORITY_MISSING"
  | "CANDIDATE_HASH_MISMATCH"
  | "EVIDENCE_GATES_FAILED"
  | "PREDECESSOR_STATE_MISSING";

export interface ReleaseTransactionResult {
  ok: boolean;
  reason: ReleaseFailureReason | null;
  receipt: DurableReceipt | null;
  errors: string[];
  predecessorState: string | null;
  successorState: string | null;
}

/** Evidence-gate resolver injected into the release transaction (see module doc). */
export type GateResolver = (
  editionId: string,
  db: GmiDb,
) => Promise<{ passed: boolean; blockers: string[] }>;

export interface ReleaseDeps {
  db?: PrismaClient;
  gateResolver?: GateResolver;
  now?: () => Date;
  auditSink?: (event: GmiReleaseAuditRecord) => Promise<void>;
}

export interface GmiReleaseAuditRecord {
  editionId: string;
  eventType: string;
  actor: string;
  candidateHash: string | null;
  occurredAt: string;
  safeMetadata: Record<string, unknown>;
}

// ── Advisory lock ────────────────────────────────────────────────────────────

/**
 * Acquire a transaction-scoped PostgreSQL advisory lock for one edition.
 * Non-blocking: returns false immediately if another transaction holds it.
 * The lock auto-releases at COMMIT/ROLLBACK of `tx`.
 */
export async function tryEditionAdvisoryLock(
  tx: GmiDb,
  editionId: string,
): Promise<boolean> {
  const lockKey = `gmi_release_${editionId}`;
  const rows = await tx.$queryRaw<Array<{ locked: boolean }>>`
    SELECT pg_try_advisory_xact_lock(hashtext(${lockKey})) AS locked
  `;
  return rows[0]?.locked === true;
}

// ── Read helpers ─────────────────────────────────────────────────────────────

export async function getDurableReleaseState(
  editionId: string,
  db: GmiDb = prisma,
): Promise<DurableReleaseState | null> {
  const row = await db.gmiEditionReleaseState.findUnique({ where: { editionId } });
  return row as DurableReleaseState | null;
}

export async function getDurableReceipt(
  editionId: string,
  db: GmiDb = prisma,
): Promise<DurableReceipt | null> {
  const row = await db.gmiReleaseReceipt.findUnique({ where: { editionId } });
  return row as DurableReceipt | null;
}

/**
 * The current valid owner authority for an edition + candidate hash: the latest
 * non-revoked authority row whose candidateHash matches. Returns null if none —
 * a projected ownerAuthorizedAt timestamp without such a row must FAIL.
 */
export async function getCurrentValidAuthority(
  editionId: string,
  candidateHash: string,
  db: GmiDb = prisma,
): Promise<DurableAuthority | null> {
  const row = await db.gmiReleaseAuthority.findFirst({
    where: { editionId, candidateHash, revokedAt: null },
    orderBy: { authorizedAt: "desc" },
  });
  return row as DurableAuthority | null;
}

// ── Mutations (non-release) ──────────────────────────────────────────────────

/** Idempotent upsert of durable release state. Used by admin ops. */
export async function upsertReleaseState(
  input: Partial<DurableReleaseState> & { editionId: string; lifecycleState: string },
  db: GmiDb = prisma,
): Promise<DurableReleaseState> {
  const { editionId, ...rest } = input;
  const row = await db.gmiEditionReleaseState.upsert({
    where: { editionId },
    create: { editionId, ...rest },
    update: { ...rest, version: { increment: 1 } },
  });
  return row as DurableReleaseState;
}

/**
 * Create-if-missing seeding of durable release state. Used by bootstrap.
 * NEVER mutates an existing row — a released edition must not be regressed
 * to its bootstrap defaults by a re-run (deploy init, clean-room, tests).
 */
export async function seedReleaseStateIfMissing(
  input: Partial<DurableReleaseState> & { editionId: string; lifecycleState: string },
  db: GmiDb = prisma,
): Promise<DurableReleaseState> {
  const { editionId, ...rest } = input;
  const row = await db.gmiEditionReleaseState.upsert({
    where: { editionId },
    create: { editionId, ...rest },
    update: {},
  });
  return row as DurableReleaseState;
}

/** Record a release candidate: binds the candidate hash and moves to RELEASE_CANDIDATE. */
export async function createReleaseCandidate(
  editionId: string,
  hashes: { candidateHash: string; sourceSnapshotHash: string; reportContentHash: string; methodologyVersion: string },
  db: GmiDb = prisma,
): Promise<DurableReleaseState> {
  const row = await db.gmiEditionReleaseState.update({
    where: { editionId },
    data: {
      lifecycleState: "RELEASE_CANDIDATE",
      candidateHash: hashes.candidateHash,
      sourceSnapshotHash: hashes.sourceSnapshotHash,
      reportContentHash: hashes.reportContentHash,
      methodologyVersion: hashes.methodologyVersion,
      releaseCandidateAt: new Date(),
      version: { increment: 1 },
    },
  });
  return row as DurableReleaseState;
}

/** Record the data lock for an edition. */
export async function recordDataLock(
  editionId: string,
  at: Date = new Date(),
  db: GmiDb = prisma,
): Promise<DurableReleaseState> {
  const row = await db.gmiEditionReleaseState.update({
    where: { editionId },
    data: { dataLockedAt: at, version: { increment: 1 } },
  });
  return row as DurableReleaseState;
}

export async function grantOwnerAuthority(
  input: { editionId: string; candidateHash: string; authorizedBy: string; authorityScope: string },
  db: GmiDb = prisma,
): Promise<DurableAuthority> {
  const row = await db.gmiReleaseAuthority.create({
    data: {
      editionId: input.editionId,
      candidateHash: input.candidateHash,
      authorizedBy: input.authorizedBy,
      authorizedAt: new Date(),
      authorityScope: input.authorityScope,
    },
  });
  return row as DurableAuthority;
}

/** Revoke all active authority rows for an edition (optionally scoped to a candidate hash). */
export async function revokeOwnerAuthority(
  editionId: string,
  revokedBy: string,
  candidateHash?: string,
  db: GmiDb = prisma,
): Promise<number> {
  const res = await db.gmiReleaseAuthority.updateMany({
    where: { editionId, revokedAt: null, ...(candidateHash ? { candidateHash } : {}) },
    data: { revokedAt: new Date(), revokedBy },
  });
  return res.count;
}

// ── The transactional release ────────────────────────────────────────────────

function hashCanonical(obj: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(obj)).digest("hex");
}

export async function recordGmiReleaseAuditEvent(
  event: GmiReleaseAuditRecord,
  db: GmiDb = prisma,
): Promise<void> {
  await db.systemAuditLog.create({
    data: {
      action: event.eventType,
      severity: event.eventType.includes("blocked") || event.eventType.includes("failed") ? "warn" : "info",
      actorType: "system",
      actorId: event.actor,
      resourceType: "gmi_release",
      resourceId: event.editionId,
      resourceName: event.editionId,
      category: "intelligence",
      subCategory: "gmi_release_event",
      status: event.eventType.includes("blocked") || event.eventType.includes("failed") ? "blocked" : "success",
      metadata: JSON.stringify({
        candidateHash: event.candidateHash,
        ...event.safeMetadata,
      }),
      tags: JSON.stringify(["gmi", "release", event.editionId]),
      createdAt: new Date(event.occurredAt),
    },
  });
}

export const GMI_Q2_2026_RELEASE_BOOTSTRAP = {
  editionId: "GMI-Q2-2026",
  candidateHash: "gmi-q2-2026-candidate-20260708-release-lock",
  sourceSnapshotHash: "gmi-q2-2026-source-snapshot-20260708-release-lock",
  reportContentHash: "gmi-q2-2026-report-content-20260708-v1",
  methodologyVersion: "gmi-methodology-v1.0.0",
  pdfHash: "9f584a1a34d2f0a678e2c180c7cc158eab3d3123f09514cc1f16e139204e12df",
  releaseChecklistVersion: "gmi-release-checklist-v1",
  dataLockedAt: new Date("2026-07-08T20:30:00.000Z"),
  releaseCandidateAt: new Date("2026-07-08T20:30:00.000Z"),
  authorizedAt: new Date("2026-07-08T20:40:02.329Z"),
  publishedAt: new Date("2026-07-08T20:45:00.000Z"),
  authorizedBy: "owner:abraham-of-london",
  authorityScope: "GMI_RELEASE_Q2_2026_CURRENT_PUBLIC_PURCHASABLE",
} as const;

export async function bootstrapProtectedGmiReleaseState(db: GmiDb = prisma): Promise<void> {
  await seedReleaseStateIfMissing({
    editionId: "GMI-Q1-2026",
    lifecycleState: "SUPERSEDED",
    candidateHash: null,
    sourceSnapshotHash: null,
    reportContentHash: null,
    methodologyVersion: null,
    dataLockedAt: null,
    releaseCandidateAt: null,
    publishedAt: new Date("2026-04-08T00:00:00.000Z"),
    supersedes: null,
    supersededBy: "GMI-Q2-2026",
    publicVisible: true,
    purchasable: false,
  }, db);

  await seedReleaseStateIfMissing({
    editionId: "GMI-Q2-2026",
    lifecycleState: "ACTIVE_UNTIL_SUPERSEDED",
    candidateHash: GMI_Q2_2026_RELEASE_BOOTSTRAP.candidateHash,
    sourceSnapshotHash: GMI_Q2_2026_RELEASE_BOOTSTRAP.sourceSnapshotHash,
    reportContentHash: GMI_Q2_2026_RELEASE_BOOTSTRAP.reportContentHash,
    methodologyVersion: GMI_Q2_2026_RELEASE_BOOTSTRAP.methodologyVersion,
    dataLockedAt: GMI_Q2_2026_RELEASE_BOOTSTRAP.dataLockedAt,
    releaseCandidateAt: GMI_Q2_2026_RELEASE_BOOTSTRAP.releaseCandidateAt,
    publishedAt: GMI_Q2_2026_RELEASE_BOOTSTRAP.publishedAt,
    supersedes: "GMI-Q1-2026",
    supersededBy: null,
    publicVisible: true,
    purchasable: true,
  }, db);

  const existingAuthority = await db.gmiReleaseAuthority.findFirst({
    where: {
      editionId: GMI_Q2_2026_RELEASE_BOOTSTRAP.editionId,
      candidateHash: GMI_Q2_2026_RELEASE_BOOTSTRAP.candidateHash,
      revokedAt: null,
    },
    orderBy: { authorizedAt: "desc" },
  });

  const authority = existingAuthority ?? await db.gmiReleaseAuthority.create({
    data: {
      editionId: GMI_Q2_2026_RELEASE_BOOTSTRAP.editionId,
      candidateHash: GMI_Q2_2026_RELEASE_BOOTSTRAP.candidateHash,
      authorizedBy: GMI_Q2_2026_RELEASE_BOOTSTRAP.authorizedBy,
      authorizedAt: GMI_Q2_2026_RELEASE_BOOTSTRAP.authorizedAt,
      authorityScope: GMI_Q2_2026_RELEASE_BOOTSTRAP.authorityScope,
    },
  });

  await db.gmiReleaseReceipt.upsert({
    where: { editionId: GMI_Q2_2026_RELEASE_BOOTSTRAP.editionId },
    create: {
      editionId: GMI_Q2_2026_RELEASE_BOOTSTRAP.editionId,
      candidateHash: GMI_Q2_2026_RELEASE_BOOTSTRAP.candidateHash,
      sourceSnapshotHash: GMI_Q2_2026_RELEASE_BOOTSTRAP.sourceSnapshotHash,
      reportContentHash: GMI_Q2_2026_RELEASE_BOOTSTRAP.reportContentHash,
      methodologyVersion: GMI_Q2_2026_RELEASE_BOOTSTRAP.methodologyVersion,
      pdfHash: GMI_Q2_2026_RELEASE_BOOTSTRAP.pdfHash,
      releaseChecklistVersion: GMI_Q2_2026_RELEASE_BOOTSTRAP.releaseChecklistVersion,
      authorityId: authority.id,
      publishedAt: GMI_Q2_2026_RELEASE_BOOTSTRAP.publishedAt,
    },
    update: {},
  });
}

/**
 * Execute an atomic, distributed-safe GMI edition release.
 *
 * One PostgreSQL transaction:
 *   advisory xact lock → read state + predecessor → validate temporal, data lock,
 *   lifecycle, authority, candidate hash, evidence gates → insert unique receipt →
 *   successor ACTIVE_UNTIL_SUPERSEDED + publishedAt → predecessor SUPERSEDED +
 *   supersededBy → bind relationship → COMMIT. Any failure ROLLS BACK, leaving the
 *   successor unreleased, the predecessor active, and no receipt persisted.
 */
export async function releaseGmiEditionDurable(
  input: ReleaseTransactionInput,
  deps: ReleaseDeps = {},
): Promise<ReleaseTransactionResult> {
  const db = deps.db ?? prisma;
  const now = deps.now ?? (() => new Date());
  const gateResolver = deps.gateResolver ?? defaultDurableGateResolver;
  const audit = deps.auditSink;
  const editionId = input.editionId;

  const fail = (
    reason: ReleaseFailureReason,
    errors: string[],
    predecessorState: string | null = null,
  ): ReleaseTransactionResult => ({
    ok: false, reason, receipt: null, errors, predecessorState, successorState: null,
  });

  try {
    const result = await db.$transaction(
      async (tx) => {
        // 1. Distributed-safe transaction-scoped lock
        const locked = await tryEditionAdvisoryLock(tx, editionId);
        if (!locked) {
          return fail("CONCURRENT_RELEASE", [
            "Concurrent release attempt blocked — another release transaction holds the edition lock",
          ]);
        }

        // 2. Read current successor + predecessor state
        const state = await getDurableReleaseState(editionId, tx);
        if (!state) return fail("EDITION_STATE_MISSING", [`No durable release state for ${editionId}`]);

        // Idempotent guard: a receipt already exists → already released
        const existingReceipt = await getDurableReceipt(editionId, tx);
        if (existingReceipt) {
          return fail("ALREADY_RELEASED", [`Edition ${editionId} already has an authoritative release receipt`], state.lifecycleState);
        }

        const predecessorId = getPredecessorEditionId(editionId);
        const predecessor = predecessorId ? await getDurableReleaseState(predecessorId, tx) : null;

        // 3. Temporal gate (from static definition; passes for editions with no def)
        const def = getMarketIntelligenceRecord(editionId);
        if (def && !isPublicationTargetReached(def as any, now())) {
          return fail("TEMPORAL_NOT_REACHED", ["Publication target date not reached"], predecessor?.lifecycleState ?? null);
        }

        // 4. Data lock gate
        if (!state.dataLockedAt) {
          return fail("DATA_LOCK_INCOMPLETE", ["Data lock not complete"], predecessor?.lifecycleState ?? null);
        }

        // 5. Lifecycle gate
        if (state.lifecycleState !== "RELEASE_CANDIDATE" && state.lifecycleState !== "RELEASE_AUTHORIZED") {
          return fail("LIFECYCLE_NOT_RELEASABLE", [`Edition is in ${state.lifecycleState}, not a releasable state`], predecessor?.lifecycleState ?? null);
        }

        // 6. Candidate hash binding
        if (!state.candidateHash || state.candidateHash !== input.candidateHash) {
          return fail("CANDIDATE_HASH_MISMATCH", [
            `Candidate hash mismatch: durable candidate is ${state.candidateHash ?? "none"}, requested ${input.candidateHash}`,
          ], predecessor?.lifecycleState ?? null);
        }

        // 7. Owner authority (durable, hash-bound, non-revoked)
        const authority = await getCurrentValidAuthority(editionId, input.candidateHash, tx);
        if (!authority) {
          return fail("OWNER_AUTHORITY_MISSING", ["No valid owner release authority for the current candidate hash"], predecessor?.lifecycleState ?? null);
        }

        // 8. Evidence gates (injected resolver; production reads durable evidence)
        const gates = await gateResolver(editionId, tx);
        if (!gates.passed) {
          return fail("EVIDENCE_GATES_FAILED", gates.blockers.length ? gates.blockers : ["Evidence gates not satisfied"], predecessor?.lifecycleState ?? null);
        }

        // 9. Predecessor must be present + active if one is expected
        if (predecessorId && !predecessor) {
          return fail("PREDECESSOR_STATE_MISSING", [`Predecessor ${predecessorId} durable state missing`], null);
        }

        const publishedAt = now();

        // 10. Insert the unique authoritative receipt (unique on editionId)
        const receipt = await tx.gmiReleaseReceipt.create({
          data: {
            editionId,
            candidateHash: input.candidateHash,
            sourceSnapshotHash: input.sourceSnapshotHash,
            reportContentHash: input.reportContentHash,
            methodologyVersion: input.methodologyVersion,
            pdfHash: input.pdfHash,
            releaseChecklistVersion: input.releaseChecklistVersion,
            authorityId: authority.id,
            publishedAt,
          },
        });

        // 11. Activate successor
        await tx.gmiEditionReleaseState.update({
          where: { editionId },
          data: {
            lifecycleState: "ACTIVE_UNTIL_SUPERSEDED",
            publishedAt,
            publicVisible: true,
            supersedes: predecessorId ?? null,
            version: { increment: 1 },
          },
        });

        // 12. Supersede predecessor + bind relationship
        if (predecessorId && predecessor) {
          await tx.gmiEditionReleaseState.update({
            where: { editionId: predecessorId },
            data: {
              lifecycleState: "SUPERSEDED",
              supersededBy: editionId,
              version: { increment: 1 },
            },
          });
        }

        const auditRecord: GmiReleaseAuditRecord = {
          editionId, eventType: "gmi_release_succeeded", actor: authority.authorizedBy,
          candidateHash: input.candidateHash, occurredAt: publishedAt.toISOString(),
          safeMetadata: { receiptId: receipt.id, predecessorId, receiptHash: hashCanonical({ editionId, candidateHash: input.candidateHash }) },
        };
        await recordGmiReleaseAuditEvent(auditRecord, tx);
        if (audit) await audit(auditRecord);

        return {
          ok: true,
          reason: null,
          receipt: receipt as DurableReceipt,
          errors: [],
          predecessorState: predecessorId ? "SUPERSEDED" : null,
          successorState: "ACTIVE_UNTIL_SUPERSEDED",
        };
      },
      { timeout: 20000 },
    );
    if (!result.ok) {
      await recordGmiReleaseAuditEvent({
        editionId,
        eventType: "gmi_release_blocked",
        actor: "system",
        candidateHash: input.candidateHash,
        occurredAt: now().toISOString(),
        safeMetadata: { reason: result.reason, errors: result.errors },
      }, db);
    }
    return result;
  } catch (e: any) {
    // Unique-constraint race (P2002) → exactly one receipt wins; loser is a conflict.
    const result = e?.code === "P2002"
      ? fail("ALREADY_RELEASED", ["Release lost the receipt-uniqueness race; another release already produced the authoritative receipt"])
      : fail("CONCURRENT_RELEASE", [`Release transaction rolled back: ${e?.message ?? String(e)}`]);
    await recordGmiReleaseAuditEvent({
      editionId,
      eventType: "gmi_release_failed",
      actor: "system",
      candidateHash: input.candidateHash,
      occurredAt: now().toISOString(),
      safeMetadata: { reason: result.reason, errors: result.errors },
    }, db).catch(() => undefined);
    return result;
  }
}

/**
 * Default evidence-gate resolver: production release readiness from durable +
 * canonical evidence. Delegated to the durable resolver module to avoid a cycle;
 * imported lazily so tests can inject a stub without loading the whole graph.
 */
async function defaultDurableGateResolver(
  editionId: string,
  db: GmiDb,
): Promise<{ passed: boolean; blockers: string[] }> {
  const { resolveDurableEvidenceGates } = await import("./gmi-release-durable-resolver.server");
  return resolveDurableEvidenceGates(editionId, db);
}


