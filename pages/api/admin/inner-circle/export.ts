// pages/api/admin/inner-circle/export.ts
import type { NextApiRequest, NextApiResponse } from "next";
import {
  getInnerCirclePool,
  type InnerCircleMemberStatus,
} from "@/lib/server/innerCircleMembership";
import {
  checkRateLimit,
  getClientIp,
} from "@/lib/server/rateLimit";

interface ExportRow {
  emailHashPrefix: string;
  status: InnerCircleMemberStatus;
  totalKeys: number;
  firstIssuedAt: string;
  lastIssuedAt: string;
  latestKeySuffix: string;
}

type ExportResponse =
  | { ok: true; rows: ExportRow[]; generatedAt: string }
  | { ok: false; error: string };

function requireAdminToken(req: NextApiRequest): boolean {
  const expected = process.env.INNER_CIRCLE_ADMIN_TOKEN;
  if (!expected) return false;

  const headerValue = req.headers["x-admin-token"];
  if (typeof headerValue !== "string") return false;

  return headerValue === expected;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ExportResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!requireAdminToken(req)) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  // Rate-limit exports to avoid abuse (even with token)
  const ip = getClientIp(req);
  const rate = checkRateLimit(ip, "inner-circle-admin-export", {
    windowMs: 60_000,
    max: 10,
  });

  if (!rate.allowed) {
    if (rate.retryAfterMs !== undefined) {
      res.setHeader(
        "Retry-After",
        String(Math.ceil(rate.retryAfterMs / 1000)),
      );
    }
    return res
      .status(429)
      .json({ ok: false, error: "Too many export attempts. Try later." });
  }

  try {
    const pool = getInnerCirclePool();

    const query = `
      SELECT
        agg.email_hash_prefix,
        agg.status,
        agg.total_keys,
        agg.first_issued_at,
        agg.last_issued_at,
        latest.key_suffix AS latest_key_suffix
      FROM (
        SELECT
          LEFT(email_hash, 12) AS email_hash_prefix,
          status,
          COUNT(*)       AS total_keys,
          MIN(created_at) AS first_issued_at,
          MAX(created_at) AS last_issued_at
        FROM inner_circle_members
        GROUP BY LEFT(email_hash, 12), status
      ) AS agg
      JOIN LATERAL (
        SELECT key_suffix
        FROM inner_circle_members m2
        WHERE LEFT(m2.email_hash, 12) = agg.email_hash_prefix
          AND m2.status = agg.status
        ORDER BY m2.created_at DESC
        LIMIT 1
      ) AS latest ON TRUE
      ORDER BY agg.last_issued_at DESC
      LIMIT 2000;
    `;

    const dbRes = await pool.query<{
      email_hash_prefix: string;
      status: InnerCircleMemberStatus;
      total_keys: number;
      first_issued_at: Date;
      last_issued_at: Date;
      latest_key_suffix: string;
    }>(query);

    const rows: ExportRow[] = dbRes.rows.map((row) => ({
      emailHashPrefix: row.email_hash_prefix,
      status: row.status,
      totalKeys: Number(row.total_keys),
      firstIssuedAt: row.first_issued_at.toISOString(),
      lastIssuedAt: row.last_issued_at.toISOString(),
      latestKeySuffix: row.latest_key_suffix,
    }));

    return res.status(200).json({
      ok: true,
      rows,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    // No PII in logs, just high-level signal
    // (the DB layer already logs deeper details if needed)
    return res.status(500).json({
      ok: false,
      error: "Failed to generate Inner Circle export",
    });
  }
}