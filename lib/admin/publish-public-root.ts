/**
 * lib/admin/publish-public-root.ts
 *
 * Controlled publication of a ProvenanceChainAnchor to the public anchor log.
 *
 * The public anchor log (pages/provenance/anchor-log.tsx) reads AuditEvent rows
 * with objectType "PROVENANCE_ANCHOR". This module is the deliberate bridge from
 * the internal ProvenanceChainAnchor (which carries scopeId and leaf data) to
 * those public log entries.
 *
 * SAFETY CONTRACT:
 * - Only safe fields are written to the public AuditEvent metadata.
 * - scopeId is NEVER published (it identifies internal subjects).
 * - Leaf hashes are NEVER published.
 * - previousRoot is NEVER published (could link to internal chain state).
 * - Actor data (actorId, actorEmail) is stored in the audit trail, not in the
 *   public metadata visible to the anchor-log page.
 * - chainHash is safe: it is a sha256 commitment over scope-level fields with
 *   scopeId hashed in — the scopeId is not recoverable from the chainHash.
 *
 * Published metadata shape (must match toPublicAnchorEntries expectations):
 *   { version, scope, merkleRoot, leafCount, computedAt, chainHash }
 */

import { prisma } from "@/lib/prisma.server";
import type { ProvenanceChainAnchorRecord } from "@/lib/admin/provenance-chain-ledger";
import {
  recordProvenanceOperationAudit,
  createProvenanceRequestId,
} from "@/lib/admin/provenance-operation-audit";

// ── Safe metadata ─────────────────────────────────────────────────────────────

/**
 * The fields written to the public AuditEvent metadata.
 * Must not include scopeId, leaf hashes, previousRoot, or actor data.
 */
export type PublicRootMetadata = {
  version: 1;
  /** Scope category (DAILY | ACCOUNT | ORGANISATION | CYCLE_BATCH) — NOT the scopeId */
  scope: string;
  merkleRoot: string;
  leafCount: number;
  /** ISO timestamp when the internal anchor was computed */
  computedAt: string;
  /** Chain hash — safe to publish; scopeId is hashed in, not exposed raw */
  chainHash: string;
};

export function buildPublicRootMetadata(
  anchor: ProvenanceChainAnchorRecord,
): PublicRootMetadata {
  return {
    version: 1,
    scope: anchor.scope,
    merkleRoot: anchor.merkleRoot,
    leafCount: anchor.leafCount,
    computedAt: anchor.computedAt,
    chainHash: anchor.chainHash,
  };
}

// ── Result types ──────────────────────────────────────────────────────────────

export type PublishPublicRootResult =
  | {
      ok: true;
      auditEventId: string;
      metadata: PublicRootMetadata;
    }
  | {
      ok: false;
      reason:
        | "ANCHOR_NOT_FOUND"
        | "ALREADY_PUBLISHED"
        | "WRITE_FAILED";
      message: string;
    };

// ── Duplicate guard ───────────────────────────────────────────────────────────
//
// Check whether the same merkleRoot is already in the public log.
// We use merkleRoot as the dedup key because it's the primary commitment.

async function isAlreadyPublished(merkleRoot: string): Promise<boolean> {
  try {
    const p = prisma as any;
    const existing = await p.auditEvent.findFirst({
      where: {
        objectType: "PROVENANCE_ANCHOR",
        actionType: "PROVENANCE_PUBLIC_ROOT_PUBLISHED",
        objectId: merkleRoot,
      },
      select: { id: true },
    });
    return existing != null;
  } catch {
    // Best-effort — if the check fails, allow the write to proceed
    return false;
  }
}

// ── Main function ─────────────────────────────────────────────────────────────

export async function publishPublicRoot(input: {
  anchor: ProvenanceChainAnchorRecord;
  actor: { id: string | null; email: string | null };
  requestId?: string;
}): Promise<PublishPublicRootResult> {
  const { anchor, actor } = input;
  const requestId = input.requestId ?? createProvenanceRequestId("publish");

  // Dedup: never publish the same merkleRoot twice
  const alreadyPublished = await isAlreadyPublished(anchor.merkleRoot);
  if (alreadyPublished) {
    return {
      ok: false,
      reason: "ALREADY_PUBLISHED",
      message: `Merkle root ${anchor.merkleRoot.slice(0, 12)}… is already in the public anchor log.`,
    };
  }

  const metadata = buildPublicRootMetadata(anchor);

  try {
    const p = prisma as any;
    const row = await p.auditEvent.create({
      data: {
        actorType: actor.id || actor.email ? "ADMIN" : "SYSTEM",
        actorId: actor.id ?? null,
        objectType: "PROVENANCE_ANCHOR",
        // objectId uses merkleRoot — the primary public identifier, not scopeId
        objectId: anchor.merkleRoot,
        actionType: "PROVENANCE_PUBLIC_ROOT_PUBLISHED",
        summary: `Public provenance anchor root published. Scope: ${anchor.scope}. Leaves: ${anchor.leafCount}.`,
        metadata,
      },
      select: { id: true },
    });

    // Record to the internal provenance operation audit trail (separate from public log)
    await recordProvenanceOperationAudit({
      eventType: "PROVENANCE_PUBLIC_ROOT_PUBLISHED",
      requestId,
      source: "PUBLISH_PUBLIC_ROOT",
      scope: anchor.scope,
      // scopeId is deliberately NOT passed to the operation audit metadata either;
      // the internal chain audit already carries it via the anchor creation event.
      merkleRoot: anchor.merkleRoot,
      chainHash: anchor.chainHash,
      actorId: actor.id,
      actorEmail: actor.email,
      status: "SUCCESS",
    });

    return { ok: true, auditEventId: row.id, metadata };
  } catch (error) {
    return {
      ok: false,
      reason: "WRITE_FAILED",
      message: error instanceof Error ? error.message : "Public root write failed.",
    };
  }
}
