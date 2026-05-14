import type { NextApiRequest, NextApiResponse } from "next";

import { requireAdminApi } from "@/lib/access/server";
import { canAccessProvenanceOperation } from "@/lib/admin/provenance-access-policy";
import {
  buildProvenanceChainHash,
  type ProvenanceChainAnchorRecord,
} from "@/lib/admin/provenance-chain-ledger";
import {
  createProvenanceRequestId,
  recordProvenanceOperationAudit,
} from "@/lib/admin/provenance-operation-audit";
import { prisma } from "@/lib/prisma.server";

type VerifyAnchorStatus = "VALID" | "CORRUPT" | "UNAVAILABLE";

export type VerifyAnchorResponse = {
  version: 1;
  status: VerifyAnchorStatus;
  anchorId: string;
  scope?: string;
  scopeId?: string;
  storedChainHash?: string | null;
  recomputedChainHash?: string | null;
  storedPreviousRoot?: string | null;
  expectedPreviousRoot?: string | null;
  checkedAt: string;
  requestId?: string;
  failures: Array<{ reason: string }>;
};

function single(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function mapAnchor(row: {
  id: string;
  version: number;
  scope: string;
  scopeId: string;
  leafCount: number;
  merkleRoot: string;
  previousRoot: string | null;
  chainHash: string;
  computedAt: Date | string;
  fromTimestamp?: Date | string | null;
  toTimestamp?: Date | string | null;
}): ProvenanceChainAnchorRecord {
  return {
    id: row.id,
    version: 1,
    scope: row.scope,
    scopeId: row.scopeId,
    leafCount: row.leafCount,
    merkleRoot: row.merkleRoot,
    previousRoot: row.previousRoot ?? null,
    chainHash: row.chainHash,
    computedAt: toIso(row.computedAt) ?? "",
    fromTimestamp: toIso(row.fromTimestamp) ?? null,
    toTimestamp: toIso(row.toTimestamp) ?? null,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VerifyAnchorResponse | { ok: false; error: string }>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const admin = await requireAdminApi(req, res);
  if (!admin) return;

  const policy = canAccessProvenanceOperation(admin, "VERIFY_PROVENANCE_HASH");
  if (!policy.allowed) {
    return res.status(policy.reason === "AUTHENTICATION_REQUIRED" ? 401 : 403).json({
      ok: false,
      error: policy.reason,
    });
  }

  const anchorId = single(req.query.anchorId).trim();
  if (!anchorId) {
    return res.status(400).json({ ok: false, error: "anchorId is required" });
  }

  const requestId = createProvenanceRequestId("anchor");
  const checkedAt = new Date().toISOString();

  const row = await prisma.provenanceChainAnchor.findFirst({
    where: { id: anchorId },
    select: {
      id: true,
      version: true,
      scope: true,
      scopeId: true,
      leafCount: true,
      merkleRoot: true,
      previousRoot: true,
      chainHash: true,
      computedAt: true,
      fromTimestamp: true,
      toTimestamp: true,
    },
  });

  if (!row) {
    await recordProvenanceOperationAudit({
      eventType: "PROVENANCE_CHAIN_VERIFIED",
      requestId,
      source: "PROVENANCE_VERIFY_ANCHOR_API",
      status: "UNAVAILABLE",
      actorId: admin.session?.user?.id ?? null,
      actorEmail: admin.session?.user?.email ?? null,
    });
    return res.status(200).json({
      version: 1,
      status: "UNAVAILABLE",
      anchorId,
      checkedAt,
      requestId,
      failures: [{ reason: "Anchor not found." }],
    });
  }

  const anchor = mapAnchor(row);
  const failures: Array<{ reason: string }> = [];

  const recomputedChainHash = buildProvenanceChainHash({
    version: 1,
    scope: anchor.scope,
    scopeId: anchor.scopeId,
    merkleRoot: anchor.merkleRoot,
    previousRoot: anchor.previousRoot,
    computedAt: anchor.computedAt,
    fromTimestamp: anchor.fromTimestamp ?? null,
    toTimestamp: anchor.toTimestamp ?? null,
  });

  if (recomputedChainHash !== anchor.chainHash) {
    failures.push({ reason: "chainHash does not match recomputed chain hash." });
  }

  // Find the immediately prior anchor in the chain for this scope/scopeId.
  // Chain order is computedAt asc, id asc — so "previous" means largest
  // computedAt/id that is still strictly before the current anchor.
  const previousRow = await prisma.provenanceChainAnchor.findFirst({
    where: {
      scope: anchor.scope,
      scopeId: anchor.scopeId,
      OR: [
        { computedAt: { lt: new Date(anchor.computedAt) } },
        {
          computedAt: { equals: new Date(anchor.computedAt) },
          id: { lt: anchor.id },
        },
      ],
    },
    orderBy: [{ computedAt: "desc" }, { id: "desc" }],
    select: { merkleRoot: true },
  });

  const expectedPreviousRoot = previousRow?.merkleRoot ?? null;
  if (anchor.previousRoot !== expectedPreviousRoot) {
    failures.push({ reason: "previousRoot does not match previous anchor merkleRoot." });
  }

  const status: VerifyAnchorStatus = failures.length === 0 ? "VALID" : "CORRUPT";

  await recordProvenanceOperationAudit({
    eventType: "PROVENANCE_CHAIN_VERIFIED",
    requestId,
    source: "PROVENANCE_VERIFY_ANCHOR_API",
    scope: anchor.scope,
    scopeId: anchor.scopeId,
    merkleRoot: anchor.merkleRoot,
    chainHash: anchor.chainHash,
    status: status === "VALID" ? "SUCCESS" : "FAILED",
    actorId: admin.session?.user?.id ?? null,
    actorEmail: admin.session?.user?.email ?? null,
  });

  return res.status(200).json({
    version: 1,
    status,
    anchorId: anchor.id,
    scope: anchor.scope,
    scopeId: anchor.scopeId,
    storedChainHash: anchor.chainHash,
    recomputedChainHash,
    storedPreviousRoot: anchor.previousRoot,
    expectedPreviousRoot,
    checkedAt,
    requestId,
    failures,
  });
}
