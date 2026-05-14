import type { NextApiRequest, NextApiResponse } from "next";

import { requireAdminApi } from "@/lib/access/server";
import { canAccessProvenanceOperation } from "@/lib/admin/provenance-access-policy";
import { prisma } from "@/lib/prisma.server";

type ProvenanceAnchorQueryItem = {
  anchorId: string;
  scope: string;
  scopeId: string;
  merkleRoot: string;
  previousRoot: string | null;
  chainHash: string;
  leafCount: number;
  computedAt: string;
};

type ProvenanceAnchorQueryResponse = {
  version: 1;
  items: ProvenanceAnchorQueryItem[];
  limit: number;
};

function single(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function parseLimit(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 50;
  return Math.min(Math.max(parsed, 1), 100);
}

function parseDate(value: string, field: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new Error(`${field} must be a valid date`);
  }
  return date;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProvenanceAnchorQueryResponse | { ok: false; error: string }>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const admin = await requireAdminApi(req, res);
  if (!admin) return;

  const policy = canAccessProvenanceOperation(admin, "VIEW_FULL_PROVENANCE");
  if (!policy.allowed) {
    return res.status(policy.reason === "AUTHENTICATION_REQUIRED" ? 401 : 403).json({
      ok: false,
      error: policy.reason,
    });
  }

  const scope = single(req.query.scope).trim();
  const scopeId = single(req.query.scopeId).trim() || single(req.query.subjectId).trim();
  const hash = single(req.query.hash).trim();
  const limit = parseLimit(single(req.query.limit));

  let dateFrom: Date | null = null;
  let dateTo: Date | null = null;
  try {
    dateFrom = parseDate(single(req.query.dateFrom), "dateFrom");
    dateTo = parseDate(single(req.query.dateTo), "dateTo");
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: error instanceof Error ? error.message : "Invalid date filter",
    });
  }

  const where: Record<string, unknown> = {};
  if (scope) where.scope = scope;
  if (scopeId) where.scopeId = scopeId;
  if (hash) {
    where.OR = [
      { merkleRoot: hash },
      { chainHash: hash },
    ];
  }
  if (dateFrom || dateTo) {
    where.computedAt = {
      ...(dateFrom ? { gte: dateFrom } : {}),
      ...(dateTo ? { lte: dateTo } : {}),
    };
  }

  const rows = await prisma.provenanceChainAnchor.findMany({
    where,
    orderBy: [
      { computedAt: "desc" },
      { createdAt: "desc" },
    ],
    take: limit,
    select: {
      id: true,
      scope: true,
      scopeId: true,
      merkleRoot: true,
      previousRoot: true,
      chainHash: true,
      leafCount: true,
      computedAt: true,
    },
  });

  return res.status(200).json({
    version: 1,
    limit,
    items: rows.map((row) => ({
      anchorId: row.id,
      scope: row.scope,
      scopeId: row.scopeId,
      merkleRoot: row.merkleRoot,
      previousRoot: row.previousRoot,
      chainHash: row.chainHash,
      leafCount: row.leafCount,
      computedAt: row.computedAt.toISOString(),
    })),
  });
}
