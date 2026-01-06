// pages/api/admin/inner-circle/export.ts - CORRECTED IMPORTS
import type { NextApiRequest, NextApiResponse } from "next";
import { getPrivacySafeStats, getPrivacySafeKeyRows } from "@/lib/server/inner-circle-store";
import {
  rateLimitForRequestIp,
  RATE_LIMIT_CONFIGS,
  createRateLimitHeaders,
  getClientIp,
} from "@/lib/server/rateLimit";

type AdminExportRow = {
  created_at: string;
  status: "active" | "revoked";
  key_suffix: string;
  email_hash_prefix: string;
  total_unlocks: number;
};

type AdminExportResponse = {
  ok: boolean;
  rows?: AdminExportRow[];
  stats?: unknown;
  generatedAt?: string;
  error?: string;
};

function normalizeExportRows(input: unknown): AdminExportRow[] {
  const rows = Array.isArray(input) ? input : [];
  return rows
    .map((r: any) => {
      const createdAt = r?.created_at ?? r?.createdAt ?? null;
      const status = r?.status ?? null;
      const keySuffix = r?.key_suffix ?? r?.keySuffix ?? null;
      const emailHashPrefix = r?.email_hash_prefix ?? r?.emailHashPrefix ?? null;
      const totalUnlocks = r?.total_unlocks ?? r?.totalUnlocks ?? 0;

      if (!createdAt || !status || !keySuffix || !emailHashPrefix) return null;

      const statusNorm = String(status).toLowerCase();
      if (statusNorm !== "active" && statusNorm !== "revoked") return null;

      return {
        created_at: typeof createdAt === "string" ? createdAt : new Date(createdAt).toISOString(),
        status: statusNorm,
        key_suffix: String(keySuffix),
        email_hash_prefix: String(emailHashPrefix),
        total_unlocks: Number.isFinite(Number(totalUnlocks)) ? Number(totalUnlocks) : 0,
      } satisfies AdminExportRow;
    })
    .filter(Boolean) as AdminExportRow[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<AdminExportResponse>) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "Method requires GET for secure export." });
  }

  const ADMIN_BEARER_TOKEN = process.env.INNER_CIRCLE_ADMIN_KEY;
  const authHeader = req.headers.authorization;

  if (!ADMIN_BEARER_TOKEN || !authHeader?.startsWith("Bearer ")) {
    // eslint-disable-next-line no-console
    console.error(`[Security Alert] Unauthorized export attempt from IP: ${getClientIp(req)}`);
    return res.status(401).json({ ok: false, error: "Authorization required." });
  }

  const token = authHeader.slice(7);
  if (token !== ADMIN_BEARER_TOKEN) {
    return res.status(401).json({ ok: false, error: "Invalid security credentials." });
  }

  const rateLimitResult = rateLimitForRequestIp(req, "inner-circle-admin-export", RATE_LIMIT_CONFIGS.ADMIN_API);
  const headers = createRateLimitHeaders(rateLimitResult.result);
  for (const [key, value] of Object.entries(headers)) res.setHeader(key, value);

  if (!rateLimitResult.result.allowed) {
    return res.status(429).json({
      ok: false,
      error: "Intelligence requests are throttled. Please wait before re-exporting.",
    });
  }

  try {
    const [stats, rawRows] = await Promise.all([getPrivacySafeStats(), getPrivacySafeKeyRows()]);
    const rows = normalizeExportRows(rawRows);

    return res.status(200).json({
      ok: true,
      stats,
      rows,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[Admin Intelligence] System Exception:", error);
    return res.status(500).json({ ok: false, error: "Export subsystem failure." });
  }
}

