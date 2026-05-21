import type { NextApiRequest, NextApiResponse } from "next";

import { clearPersistentRateLimit } from "@/lib/server/security/persistent-rate-limit";
import { clearPostgresRateLimitBuckets } from "@/lib/server/security/rate-limit-store.postgres";
import { prisma } from "@/lib/prisma";

const ALLOWED_KEYS = new Set(["admin-verify", "admin-send-link"]);
const ROUTES_BY_KEY: Record<string, string> = {
  "admin-send-link": "/api/admin/auth/send-link",
  "admin-verify": "/api/admin/auth/verify",
};

function clientIp(req: NextApiRequest): string {
  return String(
    req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown",
  );
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized || !normalized.includes("@")) return null;
  return normalized;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function sessionIdentity(req: NextApiRequest, ip: string): string | null {
  const header = req.headers["x-session-id"];
  const sessionId = Array.isArray(header) ? header[0] : header;
  const normalized = String(sessionId || "").trim();
  return normalized ? `${ip}::${normalized}` : null;
}

async function clearShieldState(identityKeys: string[], route: string): Promise<{
  clearedAbuseFingerprints: number;
  clearedBlockedIdentities: number;
  clearedAbuseEvents: number;
  clearedCanaryTripwires: number;
}> {
  const whereIdentity = { identityKey: { in: identityKeys } };
  const [fingerprints, blocked, events, canaries] = await Promise.all([
    prisma.abuseFingerprint.deleteMany({ where: whereIdentity }).catch(() => ({ count: 0 })),
    prisma.blockedIdentity.deleteMany({ where: whereIdentity }).catch(() => ({ count: 0 })),
    prisma.abuseEvent.deleteMany({ where: whereIdentity }).catch(() => ({ count: 0 })),
    prisma.canaryTripwire.deleteMany({
      where: {
        identityKey: { in: identityKeys },
        tripwireId: { startsWith: `${route}:` },
      },
    }).catch(() => ({ count: 0 })),
  ]);

  return {
    clearedAbuseFingerprints: fingerprints.count,
    clearedBlockedIdentities: blocked.count,
    clearedAbuseEvents: events.count,
    clearedCanaryTripwires: canaries.count,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  if (process.env.NODE_ENV !== "development") {
    return res.status(404).json({ ok: false, error: "NOT_FOUND" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const routeKey = typeof req.body?.routeKey === "string" ? req.body.routeKey : "";
  if (!ALLOWED_KEYS.has(routeKey)) {
    return res.status(400).json({ ok: false, error: "INVALID_RATE_LIMIT_KEY" });
  }

  const ip = clientIp(req);
  const email = normalizeEmail(req.body?.email);
  const route = ROUTES_BY_KEY[routeKey] ?? "";
  const identityKeys = unique([
    ip,
    sessionIdentity(req, ip) ?? "",
    email ?? "",
  ]);
  const persistentKeys = unique(identityKeys.map((identity) => `${routeKey}:${identity}`));

  const redisResults = await Promise.all(
    persistentKeys.map((key) => clearPersistentRateLimit(key).catch(() => false)),
  );
  const clearedRedisBuckets = redisResults.filter(Boolean).length;

  const [clearedPostgresBuckets, shield] = await Promise.all([
    clearPostgresRateLimitBuckets({ routeKey, identityKeys }).catch(() => 0),
    clearShieldState(identityKeys, route),
  ]);

  const clearedBuckets = clearedRedisBuckets + clearedPostgresBuckets;
  const clearedShieldEntries =
    shield.clearedAbuseFingerprints +
    shield.clearedBlockedIdentities +
    shield.clearedAbuseEvents +
    shield.clearedCanaryTripwires;
  const cleared = clearedBuckets > 0 || clearedShieldEntries > 0;

  return res.status(200).json({
    ok: true,
    routeKey,
    cleared,
    clearedBuckets,
    clearedRedisBuckets,
    clearedPostgresBuckets,
    clearedAbuseFingerprints: shield.clearedAbuseFingerprints,
    clearedBlockedIdentities: shield.clearedBlockedIdentities,
    clearedAbuseEvents: shield.clearedAbuseEvents,
    clearedCanaryTripwires: shield.clearedCanaryTripwires,
    ...(!cleared
      ? {
          reason: "NO_MATCHING_BUCKETS_FOUND",
          hint: "Throttle may be held in Redis or an abuse fingerprint store that is unavailable locally.",
        }
      : {}),
  });
}
