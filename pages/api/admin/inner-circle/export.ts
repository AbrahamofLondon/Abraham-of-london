// pages/api/admin/inner-circle/export.ts — PRODUCTION STABLE (NO GHOST EXPORTS)
import "server-only";

import type { NextApiRequest, NextApiResponse } from "next";
import { safeSlice } from "@/lib/utils/safe";

import {
  normalizeTier,
  getActiveKeys,
  getKeysByTier,
  getKeysByMember,
  getPrivacySafeStats,
  isExpired,
} from "@/lib/inner-circle/exports.server";

type AdminExportRow = {
  id: string;
  created_at: string;
  status: "active" | "revoked" | "expired" | "pending";
  key_suffix: string;
  email_hash_prefix: string;
  total_unlocks: number;
  last_used_at?: string;
  member_name?: string;
  tier?: string;
};

type AdminStats = {
  totalMembers: number;
  activeMembers: number;
  pendingMembers: number;
  totalKeys: number;
  activeKeys: number;
  revokedKeys: number;
  totalUnlocks: number;
  averageUnlocksPerMember: number;
  dataRetentionDays: number;
  estimatedMemoryBytes: number;
  lastCleanup: string;
  storageType: string;
  uptimeDays: number;
  dailyActiveMembers: number;
  weeklyGrowthRate?: number;
};

type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type RateLimitMeta = {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: number;
};

type AdminExportResponse = {
  ok: boolean;
  rows?: AdminExportRow[];
  stats?: AdminStats;
  pagination?: PaginationMeta;
  generatedAt?: string;
  error?: string;
  rateLimit?: RateLimitMeta;
};

const ADMIN_ENV_KEY = "INNER_CIRCLE_ADMIN_KEY";

// best-effort in-memory rate limit
type Bucket = { count: number; resetAt: number };
const BUCKETS = new Map<string, Bucket>();

function getClientIp(req: NextApiRequest): string {
  const xf = req.headers["x-forwarded-for"];
  if (Array.isArray(xf)) return (xf[0] || "").split(",")[0]?.trim() || "unknown";
  if (typeof xf === "string") return xf.split(",")[0]?.trim() || "unknown";
  return req.socket.remoteAddress || "unknown";
}

function rateLimit(req: NextApiRequest, limit = 20, windowMs = 60_000): RateLimitMeta {
  const ip = getClientIp(req);
  const now = Date.now();
  const key = `admin-export:${ip}`;

  const b = BUCKETS.get(key);
  if (!b || b.resetAt <= now) {
    BUCKETS.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, limit, resetAt: now + windowMs };
  }

  if (b.count >= limit) return { allowed: false, remaining: 0, limit, resetAt: b.resetAt };

  b.count += 1;
  BUCKETS.set(key, b);
  return { allowed: true, remaining: Math.max(0, limit - b.count), limit, resetAt: b.resetAt };
}

function setRateLimitHeaders(res: NextApiResponse, rl: RateLimitMeta) {
  res.setHeader("X-RateLimit-Limit", String(rl.limit));
  res.setHeader("X-RateLimit-Remaining", String(rl.remaining));
  res.setHeader("X-RateLimit-Reset", String(Math.floor(rl.resetAt / 1000)));
}

function assertAdmin(req: NextApiRequest) {
  const expected = process.env[ADMIN_ENV_KEY];
  if (!expected) throw new Error(`Server misconfigured: ${ADMIN_ENV_KEY} not set`);

  const authHeader = String(req.headers.authorization || "");
  const headerKey = String(req.headers["x-inner-circle-admin-key"] || "");

  if (authHeader.startsWith("Bearer ")) {
    const token = safeSlice(authHeader, 7);
    if (token && token === expected) return;
  }
  if (headerKey && headerKey === expected) return;

  throw new Error("Unauthorized");
}

function toInt(v: unknown, fallback: number, min: number, max: number) {
  const n = typeof v === "string" ? parseInt(v, 10) : typeof v === "number" ? Math.floor(v) : NaN;
  const x = Number.isFinite(n) ? (n as number) : fallback;
  return Math.max(min, Math.min(max, x));
}

function suffixFromKey(key: unknown): string {
  const k = String(key || "").trim();
  if (!k) return "";
  const tail = k.slice(-6);
  return tail ? `…${tail}` : "";
}

function prefixFromEmailHash(h: unknown): string {
  const s = String(h || "").trim();
  return s ? s.slice(0, 10) : "";
}

function statusFromRecord(r: any): AdminExportRow["status"] {
  const raw = String(r?.status || "").toLowerCase();
  if (raw === "revoked") return "revoked";
  if (raw === "pending") return "pending";
  if (raw === "expired") return "expired";
  try {
    if (typeof isExpired === "function" && isExpired(r?.expiresAt)) return "expired";
  } catch {}
  return r?.revoked ? "revoked" : "active";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<AdminExportResponse>) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "Method requires GET.", generatedAt: new Date().toISOString() });
  }

  const rl = rateLimit(req);
  setRateLimitHeaders(res, rl);
  if (!rl.allowed) {
    return res.status(429).json({ ok: false, error: "Rate limit exceeded.", generatedAt: new Date().toISOString(), rateLimit: rl });
  }

  try {
    assertAdmin(req);
  } catch {
    await new Promise((r) => setTimeout(r, 150));
    return res.status(401).json({ ok: false, error: "Authorization required.", generatedAt: new Date().toISOString(), rateLimit: rl });
  }

  try {
    const page = toInt(req.query.page, 1, 1, 10_000);
    const limit = toInt(req.query.limit, 50, 1, 500);
    const status = String(req.query.status || "").toLowerCase().trim();
    const search = String(req.query.search || "").toLowerCase().trim();
    const tier = String(req.query.tier || "").trim();
    const memberId = String(req.query.memberId || "").trim();

    let keys: any[] = [];

    if (memberId) keys = await getKeysByMember(memberId);
    else if (tier) keys = await getKeysByTier(normalizeTier(tier));
    else keys = await getActiveKeys();

    if (!Array.isArray(keys)) keys = [];

    let rows: AdminExportRow[] = keys.map((k: any) => ({
      id: String(k?.id || k?._id || k?.keyId || ""),
      created_at: String(k?.createdAt || k?.created_at || k?.issuedAt || k?.issued_at || new Date().toISOString()),
      status: statusFromRecord(k),
      key_suffix: String(k?.keySuffix || "") || suffixFromKey(k?.key),
      email_hash_prefix: String(k?.emailHashPrefix || "") || prefixFromEmailHash(k?.emailHash),
      total_unlocks: Number(k?.usedCount ?? k?.totalUnlocks ?? k?.total_unlocks ?? 0) || 0,
      last_used_at: k?.lastUsedAt ? String(k.lastUsedAt) : undefined,
      member_name: k?.memberName ? String(k.memberName) : undefined,
      tier: k?.tier ? String(k.tier) : undefined,
    }));

    if (status) rows = rows.filter((r) => r.status === status);

    if (search) {
      rows = rows.filter((r) => {
        const hay = [r.member_name, r.tier, r.key_suffix, r.email_hash_prefix, r.status, r.id].join(" ").toLowerCase();
        return hay.includes(search);
      });
    }

    const total = rows.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * limit;
    const paged = rows.slice(start, start + limit);

    const statsRaw: any = await getPrivacySafeStats();
    const stats: AdminStats = {
      totalMembers: Number(statsRaw?.totalMembers ?? 0) || 0,
      activeMembers: Number(statsRaw?.activeMembers ?? 0) || 0,
      pendingMembers: Number(statsRaw?.pendingMembers ?? 0) || 0,
      totalKeys: Number(statsRaw?.totalKeys ?? 0) || 0,
      activeKeys: Number(statsRaw?.activeKeys ?? 0) || 0,
      revokedKeys: Number(statsRaw?.revokedKeys ?? 0) || 0,
      totalUnlocks: Number(statsRaw?.totalUnlocks ?? 0) || 0,
      averageUnlocksPerMember: Number(statsRaw?.averageUnlocksPerMember ?? 0) || 0,
      dataRetentionDays: Number(statsRaw?.dataRetentionDays ?? 0) || 0,
      estimatedMemoryBytes: Number(statsRaw?.estimatedMemoryBytes ?? 0) || 0,
      lastCleanup: String(statsRaw?.lastCleanup || new Date().toISOString()),
      storageType: String(statsRaw?.storageType || "unknown"),
      uptimeDays: Number(statsRaw?.uptimeDays ?? 0) || 0,
      dailyActiveMembers: Number(statsRaw?.dailyActiveMembers ?? 0) || 0,
      weeklyGrowthRate: typeof statsRaw?.weeklyGrowthRate === "number" ? statsRaw.weeklyGrowthRate : undefined,
    };

    return res.status(200).json({
      ok: true,
      rows: paged,
      stats,
      pagination: { total, page: safePage, limit, totalPages },
      generatedAt: new Date().toISOString(),
      rateLimit: rl,
    });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || "Export failed.", generatedAt: new Date().toISOString(), rateLimit: rl });
  }
}