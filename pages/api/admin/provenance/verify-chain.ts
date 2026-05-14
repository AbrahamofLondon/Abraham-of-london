import type { NextApiRequest, NextApiResponse } from "next";

import { requireAdminApi } from "@/lib/access/server";
import { canAccessProvenanceOperation } from "@/lib/admin/provenance-access-policy";
import {
  verifyProvenanceChainSequence,
  type ProvenanceChainAnchorRecord,
} from "@/lib/admin/provenance-chain-ledger";
import {
  createProvenanceRequestId,
  recordProvenanceOperationAudit,
} from "@/lib/admin/provenance-operation-audit";
import { prisma } from "@/lib/prisma.server";

type ChainContinuityStatus = "CONTINUOUS" | "BROKEN" | "UNAVAILABLE";

type ChainContinuityResponse = {
  version: 1;
  status: ChainContinuityStatus;
  scope: string;
  scopeId: string;
  anchorCount: number;
  latestMerkleRoot: string | null;
  latestChainHash: string | null;
  checkedAt: string;
  failures: Array<{
    anchorId?: string;
    reason: string;
  }>;
  auditWarning?: string;
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
  res: NextApiResponse<ChainContinuityResponse | { ok: false; error: string }>,
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

  const scope = single(req.query.scope).trim();
  const scopeId = single(req.query.scopeId).trim();
  if (!scope || !scopeId) {
    return res.status(400).json({
      ok: false,
      error: "scope and scopeId are required",
    });
  }

  const rows = await prisma.provenanceChainAnchor.findMany({
    where: {
      scope,
      scopeId,
    },
    orderBy: [
      { computedAt: "asc" },
      { id: "asc" },
    ],
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

  const requestId = createProvenanceRequestId("chain");
  const anchors = rows.map(mapAnchor);
  const latest = anchors.at(-1);
  const verification = anchors.length > 0
    ? verifyProvenanceChainSequence(anchors)
    : { valid: false, failures: [] };
  const status = anchors.length === 0 ? "UNAVAILABLE" : verification.valid ? "CONTINUOUS" : "BROKEN";
  const audit = await recordProvenanceOperationAudit({
    eventType: "PROVENANCE_CHAIN_VERIFIED",
    requestId,
    source: "PROVENANCE_VERIFY_CHAIN_API",
    scope,
    scopeId,
    merkleRoot: latest?.merkleRoot ?? null,
    chainHash: latest?.chainHash ?? null,
    status: status === "CONTINUOUS" ? "SUCCESS" : status === "BROKEN" ? "FAILED" : "UNAVAILABLE",
    actorId: admin.session?.user?.id ?? null,
    actorEmail: admin.session?.user?.email ?? null,
  });

  return res.status(200).json({
    version: 1,
    status,
    scope,
    scopeId,
    anchorCount: anchors.length,
    latestMerkleRoot: latest?.merkleRoot ?? null,
    latestChainHash: latest?.chainHash ?? null,
    checkedAt: new Date().toISOString(),
    failures: verification.failures,
    ...(!audit.ok ? { auditWarning: audit.warning } : {}),
  });
}
