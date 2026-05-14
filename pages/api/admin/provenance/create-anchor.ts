import type { NextApiRequest, NextApiResponse } from "next";

import { requireAdminApi } from "@/lib/access/server";
import { canAccessProvenanceOperation } from "@/lib/admin/provenance-access-policy";
import {
  createOversightProvenanceAnchor,
  type CreateOversightProvenanceAnchorInput,
} from "@/lib/admin/provenance-anchor-runner";

type CreateAnchorResponse = {
  version: 1;
  status: "ANCHORED" | "UNAVAILABLE";
  scope: CreateOversightProvenanceAnchorInput["scope"];
  scopeId: string;
  requestedCount: number;
  leafCount: number;
  unavailableCount: number;
  anchor: {
    id: string;
    version: 1;
    scope: string;
    scopeId: string;
    leafCount: number;
    merkleRoot: string;
    previousRoot: string | null;
    chainHash: string;
    computedAt: string;
    fromTimestamp?: string | null;
    toTimestamp?: string | null;
  } | null;
  reason?: string;
};

const SCOPES = new Set<CreateOversightProvenanceAnchorInput["scope"]>([
  "DAILY",
  "ACCOUNT",
  "ORGANISATION",
  "CYCLE_BATCH",
]);

function bodyString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function bodyNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateAnchorResponse | { ok: false; error: string }>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const admin = await requireAdminApi(req, res);
  if (!admin) return;

  const policy = canAccessProvenanceOperation(admin, "CREATE_PROVENANCE_ANCHOR");
  if (!policy.allowed) {
    return res.status(policy.reason === "AUTHENTICATION_REQUIRED" ? 401 : 403).json({
      ok: false,
      error: policy.reason,
    });
  }

  const body = req.body && typeof req.body === "object" ? req.body as Record<string, unknown> : {};
  const scope = bodyString(body.scope) as CreateOversightProvenanceAnchorInput["scope"];
  const scopeId = bodyString(body.scopeId);
  if (!SCOPES.has(scope) || !scopeId) {
    return res.status(400).json({
      ok: false,
      error: "scope and scopeId are required",
    });
  }

  const result = await createOversightProvenanceAnchor({
    scope,
    scopeId,
    limit: bodyNumber(body.limit),
    fromTimestamp: bodyString(body.fromTimestamp) || undefined,
    toTimestamp: bodyString(body.toTimestamp) || undefined,
  });

  return res.status(200).json({
    version: 1,
    status: result.status,
    scope: result.scope,
    scopeId: result.scopeId,
    requestedCount: result.requestedCount,
    leafCount: result.leafCount,
    unavailableCount: result.unavailableCount,
    anchor: result.anchor,
    ...(result.status === "UNAVAILABLE" ? { reason: result.reason } : {}),
  });
}
