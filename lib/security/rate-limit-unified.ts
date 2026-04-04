/* lib/security/rate-limit-unified.ts
   Extends your current design without breaking it.
*/

import type { NextApiRequest, NextApiResponse } from "next";
import { anonymizeIp, getClientIp } from "@/lib/server/ip";

/* -------------------------------------------------------------------------- */
/* STORE ABSTRACTION (Memory now → Redis later)                               */
/* -------------------------------------------------------------------------- */

type Bucket = { count: number; resetAt: number };

interface Store {
  get(key: string): Bucket | null;
  set(key: string, value: Bucket): void;
  delete(key: string): void;
}

class MemoryStore implements Store {
  private buckets = new Map<string, Bucket>();

  get(key: string): Bucket | null {
    const b = this.buckets.get(key);
    if (!b) return null;

    if (Date.now() > b.resetAt) {
      this.buckets.delete(key);
      return null;
    }

    return b;
  }

  set(key: string, value: Bucket) {
    this.buckets.set(key, value);
  }

  delete(key: string) {
    this.buckets.delete(key);
  }
}

const store: Store = new MemoryStore();

/* -------------------------------------------------------------------------- */
/* CORE LOGIC                                                                 */
/* -------------------------------------------------------------------------- */

function getOrInit(key: string, windowMs: number): Bucket {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing) {
    const fresh = { count: 0, resetAt: now + windowMs };
    store.set(key, fresh);
    return fresh;
  }

  return existing;
}

export function limitIp(
  req: NextApiRequest,
  prefix: string,
  config: { windowMs: number; max: number }
) {
  const ip = anonymizeIp(getClientIp(req));
  const key = `${prefix}:ip:${ip}`;

  const bucket = getOrInit(key, config.windowMs);
  bucket.count++;

  return buildResult(bucket, config.max, key);
}

export function limitEmail(
  email: string,
  prefix: string,
  config: { windowMs: number; max: number }
) {
  const normalized = (email || "").trim().toLowerCase();
  const key = `${prefix}:email:${normalized || "unknown"}`;

  const bucket = getOrInit(key, config.windowMs);
  bucket.count++;

  return buildResult(bucket, config.max, key);
}

function buildResult(bucket: Bucket, max: number, key: string) {
  return {
    allowed: bucket.count <= max,
    remaining: Math.max(0, max - bucket.count),
    resetAt: bucket.resetAt,
    limit: max,
    key,
  };
}

export function setRateLimitHeaders(res: NextApiResponse, result: any) {
  res.setHeader("X-RateLimit-Limit", result.limit);
  res.setHeader("X-RateLimit-Remaining", result.remaining);
  res.setHeader("X-RateLimit-Reset", Math.ceil(result.resetAt / 1000));
}