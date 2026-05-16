/**
 * pages/api/provenance/demo-verify.ts
 *
 * GET /api/provenance/demo-verify
 *
 * Public endpoint. Recomputes the SHA-256 hash of the canonical demo record
 * and compares it to the stored DEMO_PROVENANCE_HASH. Returns the result as JSON.
 *
 * This is NOT a stub. Every call recomputes the hash from scratch. The status
 * field reflects the actual comparison — MATCH only when hashes are identical.
 *
 * Rate-limited to 30 req / min per IP. No auth required.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { verifyDemoProvenance } from "@/lib/product/public-provenance-demo-verify";
import type { PublicDemoVerifyResult } from "@/lib/product/public-provenance-demo-verify";
import { applyRateLimit, getClientIp } from "@/lib/server/apply-rate-limit";

// ─── Handler ────────────────────────────────────────────────────────────────

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublicDemoVerifyResult | { error: string }>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ok = await applyRateLimit(req, res, {
    scope: "PROVENANCE_DEMO_VERIFY",
    identifier: getClientIp(req),
    limit: 10,
    windowSeconds: 60,
  });
  if (!ok) return;

  const result = verifyDemoProvenance();

  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Provenance-Status", result.status);

  return res.status(200).json(result);
}

export const config = {
  api: { bodyParser: false },
};
