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

// ─── Rate limiting ──────────────────────────────────────────────────────────

const requests = new Map<string, { count: number; windowStart: number }>();
const MAX_REQUESTS = 30;
const WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = requests.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    requests.set(ip, { count: 1, windowStart: now });
    return false;
  }

  if (entry.count >= MAX_REQUESTS) return true;
  entry.count++;
  return false;
}

// ─── Handler ────────────────────────────────────────────────────────────────

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<PublicDemoVerifyResult | { error: string }>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip =
    (Array.isArray(req.headers["x-forwarded-for"])
      ? req.headers["x-forwarded-for"][0]
      : req.headers["x-forwarded-for"]) ||
    req.socket.remoteAddress ||
    "unknown";

  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Too many requests. Please wait before verifying again." });
  }

  const result = verifyDemoProvenance();

  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Provenance-Status", result.status);

  return res.status(200).json(result);
}

export const config = {
  api: { bodyParser: false },
};
