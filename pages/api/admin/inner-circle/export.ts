// pages/api/admin/inner-circle/export.ts
import type { NextApiRequest, NextApiResponse } from "next";

import {
  rateLimit,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
} from "@/lib/server/rateLimit";
import { exportInnerCircleAdminSummary } from "@/lib/innerCircleMembership";

type AdminExportRow = {
  created_at: string;
  status: "active" | "pending" | "revoked";
  key_suffix: string;
  email_hash_prefix: string;
  total_unlocks: number;
};

type AdminExportSuccess = {
  ok: true;
  rows: AdminExportRow[];
};

type AdminExportFailure = {
  ok: false;
  error: string;
};

type AdminExportResponse = AdminExportSuccess | AdminExportFailure;

function getClientIp(req: NextApiRequest): string {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const remote = req.socket.remoteAddress;
  return remote ?? "unknown";
}

function isAuthorised(req: NextApiRequest): boolean {
  const expectedToken = process.env.INNER_CIRCLE_ADMIN_TOKEN;
  if (!expectedToken) return false;

  const incoming =
    (req.headers["x-inner-circle-admin-token"] as string | undefined) ??
    "";

  return incoming.trim().length > 0 && incoming.trim() === expectedToken;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<AdminExportResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res
      .status(405)
      .json({ ok: false, error: "Method not allowed" });
  }

  const ip = getClientIp(req);
  const rlResult = rateLimit(ip, {
    ...RATE_LIMIT_CONFIGS.API_GENERAL,
    keyPrefix: "inner-circle-admin-export",
  });

  const rlHeaders = createRateLimitHeaders(rlResult);
  Object.entries(rlHeaders).forEach(([key, value]) =>
    res.setHeader(key, value),
  );

  if (!rlResult.allowed) {
    return res.status(429).json({
      ok: false,
      error: "Too many admin export attempts. Please try again later.",
    });
  }

  if (!isAuthorised(req)) {
    return res
      .status(401)
      .json({ ok: false, error: "Unauthorised" });
  }

  const rows = exportInnerCircleAdminSummary();

  // Only surface non-identifying, summarised data
  return res.status(200).json({
    ok: true,
    rows,
  });
}