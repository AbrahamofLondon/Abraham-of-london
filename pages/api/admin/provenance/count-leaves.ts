import type { NextApiRequest, NextApiResponse } from "next";

import { requireAdminApi } from "@/lib/access/server";
import { canAccessProvenanceOperation } from "@/lib/admin/provenance-access-policy";
import {
  countOversightProvenanceLeaves,
  type CountOversightProvenanceLeavesResult,
} from "@/lib/admin/provenance-anchor-runner";

const SCOPES = new Set(["DAILY", "ACCOUNT", "ORGANISATION", "CYCLE_BATCH"]);

function single(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function queryNumber(value: string | string[] | undefined): number | undefined {
  const str = single(value);
  if (!str) return undefined;
  const parsed = Number.parseInt(str, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CountOversightProvenanceLeavesResult | { ok: false; error: string }>,
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
  if (!SCOPES.has(scope) || !scopeId) {
    return res.status(400).json({ ok: false, error: "scope and scopeId are required" });
  }

  const result = await countOversightProvenanceLeaves({
    scope: scope as "DAILY" | "ACCOUNT" | "ORGANISATION" | "CYCLE_BATCH",
    scopeId,
    limit: queryNumber(req.query.limit),
  });

  return res.status(200).json(result);
}
