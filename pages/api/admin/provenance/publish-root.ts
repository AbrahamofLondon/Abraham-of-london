import type { NextApiRequest, NextApiResponse } from "next";

import { requireAdminApi } from "@/lib/access/server";
import { canAccessProvenanceOperation } from "@/lib/admin/provenance-access-policy";
import { prisma } from "@/lib/prisma.server";
import { publishPublicRoot } from "@/lib/admin/publish-public-root";
import { createProvenanceRequestId } from "@/lib/admin/provenance-operation-audit";
import type { ProvenanceChainAnchorRecord } from "@/lib/admin/provenance-chain-ledger";

type PublishRootResponse =
  | {
      ok: true;
      auditEventId: string;
      published: {
        version: number;
        scope: string;
        merkleRoot: string;
        leafCount: number;
        computedAt: string;
        chainHash: string;
      };
    }
  | { ok: false; error: string; reason?: string };

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublishRootResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const admin = await requireAdminApi(req, res);
  if (!admin) return;

  const policy = canAccessProvenanceOperation(admin, "PUBLISH_PUBLIC_ROOT");
  if (!policy.allowed) {
    return res.status(policy.reason === "AUTHENTICATION_REQUIRED" ? 401 : 403).json({
      ok: false,
      error: policy.reason,
    });
  }

  const body = req.body && typeof req.body === "object" ? req.body as Record<string, unknown> : {};
  const anchorId = typeof body.anchorId === "string" ? body.anchorId.trim() : null;

  if (!anchorId) {
    return res.status(400).json({ ok: false, error: "anchorId is required" });
  }

  // Look up the internal ProvenanceChainAnchor — this is the only place we read scopeId,
  // and we never pass it forward into the public metadata.
  const row = await prisma.provenanceChainAnchor.findUnique({
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
  }).catch(() => null);

  if (!row) {
    return res.status(404).json({ ok: false, error: "Anchor not found" });
  }

  const computedAt = toIso(row.computedAt);
  if (!computedAt) {
    return res.status(500).json({ ok: false, error: "Anchor has invalid computedAt" });
  }

  const anchor: ProvenanceChainAnchorRecord = {
    id: row.id,
    version: 1,
    scope: row.scope,
    scopeId: row.scopeId,
    leafCount: row.leafCount,
    merkleRoot: row.merkleRoot,
    previousRoot: row.previousRoot ?? null,
    chainHash: row.chainHash,
    computedAt,
    fromTimestamp: toIso(row.fromTimestamp) ?? null,
    toTimestamp: toIso(row.toTimestamp) ?? null,
  };

  const requestId = createProvenanceRequestId("publish");
  const result = await publishPublicRoot({
    anchor,
    actor: {
      id: admin.session?.user?.id ?? null,
      email: admin.session?.user?.email ?? null,
    },
    requestId,
  });

  if (!result.ok) {
    const status = result.reason === "ALREADY_PUBLISHED" ? 409 : 500;
    return res.status(status).json({
      ok: false,
      error: result.message,
      reason: result.reason,
    });
  }

  return res.status(200).json({
    ok: true,
    auditEventId: result.auditEventId,
    published: result.metadata,
  });
}
