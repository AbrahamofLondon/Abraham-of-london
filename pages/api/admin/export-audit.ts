/* pages/api/admin/export-audit.ts — INSTITUTIONAL AUDIT EXPORT (SCHEMA-ALIGNED) */
import type { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/react";
import prisma from "@/lib/prisma";
import { jsonErr } from "@/lib/server/http";

type AuditRow = {
  createdAt: Date;
  actorType: string | null;
  actorEmail: string | null;
  action: string;
  resourceType: string | null;
  resourceName: string | null;
  status: string | null;
  severity: string;
  ipAddress: string | null;
  requestId: string | null;
  sessionId: string | null;
  category: string | null;
  subCategory: string | null;
  durationMs: number | null;
  errorMessage: string | null;
  metadata: unknown;
  tags: unknown;
};

type AuditExportResponse =
  | {
      ok: true;
      meta: {
        count: number;
        range: { start: string; end: string };
        exportedBy: string;
        schema: "SystemAuditLog.metadata";
      };
      data: AuditRow[];
    }
  | {
      ok?: false;
      error?: string;
      code?: string;
      message?: string;
    };

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __aolAdminAuditExportRateLimit:
    | Map<string, RateLimitBucket>
    | undefined;
}

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 10;
const MAX_RANGE_DAYS = 31;

function getRateLimitStore(): Map<string, RateLimitBucket> {
  if (!global.__aolAdminAuditExportRateLimit) {
    global.__aolAdminAuditExportRateLimit = new Map<string, RateLimitBucket>();
  }
  return global.__aolAdminAuditExportRateLimit;
}

function getClientIp(req: NextApiRequest): string {
  const xf = req.headers["x-forwarded-for"];
  const raw =
    typeof xf === "string"
      ? xf
      : Array.isArray(xf)
      ? xf[0]
      : req.socket?.remoteAddress || "0.0.0.0";

  return String(raw).split(",")[0]?.trim() || "0.0.0.0";
}

function applyRateLimit(
  key: string
): { ok: true; remaining: number; resetAt: number } | { ok: false; resetAt: number } {
  const store = getRateLimitStore();
  const now = Date.now();
  const current = store.get(key);

  if (!current || now >= current.resetAt) {
    const resetAt = now + RATE_LIMIT_WINDOW_MS;
    store.set(key, { count: 1, resetAt });
    return { ok: true, remaining: RATE_LIMIT_MAX - 1, resetAt };
  }

  if (current.count >= RATE_LIMIT_MAX) {
    return { ok: false, resetAt: current.resetAt };
  }

  current.count += 1;
  store.set(key, current);

  return {
    ok: true,
    remaining: Math.max(0, RATE_LIMIT_MAX - current.count),
    resetAt: current.resetAt,
  };
}

function normalizeDateInput(value: string | string[] | undefined): Date | null {
  if (!value) return null;
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function validateDateRange(
  startDate: Date,
  endDate: Date,
  maxDays: number
): { ok: true } | { ok: false; message: string } {
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return { ok: false, message: "Invalid date input." };
  }

  if (startDate > endDate) {
    return { ok: false, message: "The start date cannot be after the end date." };
  }

  const diffMs = endDate.getTime() - startDate.getTime();
  const diffDays = diffMs / (24 * 60 * 60 * 1000);

  if (diffDays > maxDays) {
    return {
      ok: false,
      message: `Date range exceeds maximum of ${maxDays} days.`,
    };
  }

  return { ok: true };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AuditExportResponse>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return jsonErr(res, 405, "METHOD_NOT_ALLOWED", "Use GET for exports.");
  }

  const session = await getSession({ req });
  const adminEmail =
    process.env.INITIAL_ADMIN_EMAIL || "admin@abrahamoflondon.com";

  if (!session || session.user?.email !== adminEmail) {
    return jsonErr(res, 403, "UNAUTHORIZED", "Administrative access required.");
  }

  const rateKey = `${String(session.user.email).toLowerCase()}|${getClientIp(req)}`;
  const rl = applyRateLimit(rateKey);

  if (!rl.ok) {
    res.setHeader(
      "Retry-After",
      String(Math.ceil((rl.resetAt - Date.now()) / 1000))
    );
    return jsonErr(
      res,
      429,
      "RATE_LIMITED",
      "Too many export attempts. Try again later."
    );
  }

  res.setHeader("X-RateLimit-Limit", String(RATE_LIMIT_MAX));
  res.setHeader("X-RateLimit-Remaining", String(rl.remaining));
  res.setHeader("X-RateLimit-Reset", String(rl.resetAt));

  const sinceQuery = normalizeDateInput(req.query.since);
  const untilQuery = normalizeDateInput(req.query.until);

  const startDate =
    sinceQuery || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const endDate = untilQuery || new Date();

  const rangeCheck = validateDateRange(startDate, endDate, MAX_RANGE_DAYS);
  if (!rangeCheck.ok) {
    return jsonErr(res, 400, "INVALID_RANGE", rangeCheck.message);
  }

  try {
    const logs = await prisma.systemAuditLog.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: "desc" },
      select: {
        createdAt: true,
        actorType: true,
        actorEmail: true,
        action: true,
        resourceType: true,
        resourceName: true,
        status: true,
        severity: true,
        ipAddress: true,
        requestId: true,
        sessionId: true,
        category: true,
        subCategory: true,
        durationMs: true,
        errorMessage: true,
        metadata: true,
        tags: true,
      },
    });

    return res.status(200).json({
      ok: true,
      meta: {
        count: logs.length,
        range: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        exportedBy: String(session.user.email || adminEmail),
        schema: "SystemAuditLog.metadata",
      },
      data: logs,
    });
  } catch (error) {
    console.error("[CRITICAL_EXPORT_FAILURE]", error);
    return jsonErr(
      res,
      500,
      "INTERNAL_ERROR",
      "Could not compile institutional logs."
    );
  }
}