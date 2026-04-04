/* lib/security/rate-limit-v2.ts */

import type { NextApiRequest, NextApiResponse } from "next";
import { anonymizeIp, getClientIp } from "@/lib/server/ip";
import { kvGet, kvSet } from "@/lib/resilience/kv-store";

type Bucket = { count: number; resetAt: number };

export type LimitConfig = {
  windowMs: number;
  max: number;
};

export type LimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
  key: string;
};

async function getOrInitBucket(key: string, windowMs: number): Promise<Bucket> {
  const raw = await kvGet(key);
  const now = Date.now();

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Bucket;
      if (parsed.resetAt > now) return parsed;
    } catch {
      // ignore corruption and reset
    }
  }

  const fresh = { count: 0, resetAt: now + windowMs };
  await kvSet(key, JSON.stringify(fresh), windowMs);
  return fresh;
}

async function saveBucket(key: string, bucket: Bucket) {
  const ttl = Math.max(1, bucket.resetAt - Date.now());
  await kvSet(key, JSON.stringify(bucket), ttl);
}

export async function limitIp(
  req: NextApiRequest,
  prefix: string,
  config: LimitConfig
): Promise<LimitResult> {
  const ip = anonymizeIp(getClientIp(req));
  const key = `${prefix}:ip:${ip}`;

  const bucket = await getOrInitBucket(key, config.windowMs);
  bucket.count += 1;
  await saveBucket(key, bucket);

  return {
    allowed: bucket.count <= config.max,
    remaining: Math.max(0, config.max - bucket.count),
    resetAt: bucket.resetAt,
    limit: config.max,
    key,
  };
}

export async function limitEmail(
  email: string,
  prefix: string,
  config: LimitConfig
): Promise<LimitResult> {
  const normalized = (email || "").trim().toLowerCase();
  const key = `${prefix}:email:${normalized || "unknown"}`;

  const bucket = await getOrInitBucket(key, config.windowMs);
  bucket.count += 1;
  await saveBucket(key, bucket);

  return {
    allowed: bucket.count <= config.max,
    remaining: Math.max(0, config.max - bucket.count),
    resetAt: bucket.resetAt,
    limit: config.max,
    key,
  };
}

export function setRateLimitHeaders(res: NextApiResponse, result: LimitResult) {
  res.setHeader("X-RateLimit-Limit", String(result.limit));
  res.setHeader("X-RateLimit-Remaining", String(result.remaining));
  res.setHeader("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));
}