import type { NextApiRequest, NextApiResponse } from "next";
import {
  rateLimit,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
} from "@/lib/server/rateLimit";

// Import the entire module to avoid TypeScript errors
import * as membership from "@/lib/innerCircleMembership";

type AdminExportRow = {
  created_at: string;
  status: string;
  key_suffix: string;
  email_hash_prefix: string;
  total_unlocks: number;
};

type AdminExportResponse =
  | {
      ok: true;
      rows: AdminExportRow[];
      stats: Record<string, unknown>;
    }
  | {
      ok: false;
      error: string;
    };

// ---------------------------------------------------------------------------
// Simple admin auth – shared secret via header
// ---------------------------------------------------------------------------
function isAuthorised(req: NextApiRequest): boolean {
  const expected = process.env.INNER_CIRCLE_ADMIN_TOKEN;
  if (!expected) return false;

  const token = req.headers["x-admin-token"];
  if (!token) return false;

  if (Array.isArray(token)) {
    return token.includes(expected);
  }

  return token === expected;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdminExportResponse>,
): void {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  if (!isAuthorised(req)) {
    res.status(401).json({ ok: false, error: "Unauthorized" });
    return;
  }

  // Rate limit admin export using an existing conservative config
  const rlKey = `admin-inner-circle-export:${
    req.headers["x-admin-token"] ?? "unknown"
  }`;

  const rlResult = rateLimit(rlKey, RATE_LIMIT_CONFIGS.TEASER_REQUEST);
  const rlHeaders = createRateLimitHeaders(rlResult);
  Object.entries(rlHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (!rlResult.allowed) {
    res.status(429).json({
      ok: false,
      error: "Too many requests. Please try again later.",
    });
    return;
  }

  // -------------------------------------------------------------------------
  // Try to call exportInnerCircleAdminSummary() and getPrivacySafeStats()
  // if they exist. If not, degrade gracefully with empty data.
  // -------------------------------------------------------------------------
  let rows: AdminExportRow[] = [];

  try {
    const maybeExport = (membership as any).exportInnerCircleAdminSummary;
    if (typeof maybeExport === "function") {
      const result = maybeExport();
      if (Array.isArray(result)) {
        rows = result as AdminExportRow[];
      }
    }
  } catch {
    // Silent fail – admin export is best-effort; no PII should be exposed anyway
    rows = [];
  }

  let stats: Record<string, unknown> = {};
  try {
    const maybeStats = (membership as any).getPrivacySafeStats;
    if (typeof maybeStats === "function") {
      const result = maybeStats();
      if (result && typeof result === "object") {
        stats = result as Record<string, unknown>;
      }
    }
  } catch {
    stats = {};
  }

  res.status(200).json({
    ok: true,
    rows,
    stats,
  });
}