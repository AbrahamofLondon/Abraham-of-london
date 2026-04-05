// lib/security/rateLimit.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { anonymizeIp, getClientIp } from "@/lib/server/ip";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

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

export type ConsumeRateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
  key: string;
};

function now() {
  return Date.now();
}

function getOrInitBucket(key: string, windowMs: number): Bucket {
  const t = now();
  const existing = buckets.get(key);

  if (!existing || t > existing.resetAt) {
    const fresh = { count: 0, resetAt: t + windowMs };
    buckets.set(key, fresh);
    return fresh;
  }

  return existing;
}

/**
 * IP-based limiter (privacy-safe via anonymization)
 * - Use per-route prefix to avoid cross-route interference
 */
export function limitIp(
  req: NextApiRequest,
  prefix: string,
  config: LimitConfig,
): LimitResult {
  const ip = getClientIp(req);
  const anon = anonymizeIp(ip);
  const key = `${prefix}:${anon}`;

  const bucket = getOrInitBucket(key, config.windowMs);
  bucket.count += 1;

  const allowed = bucket.count <= config.max;
  const remaining = Math.max(0, config.max - bucket.count);

  return {
    allowed,
    remaining,
    resetAt: bucket.resetAt,
    limit: config.max,
    key,
  };
}

/**
 * Optional helper to expose standard-ish rate limit headers
 */
export function setRateLimitHeaders(
  res: NextApiResponse,
  result: LimitResult | ConsumeRateLimitResult,
) {
  res.setHeader("X-RateLimit-Limit", String(result.limit));
  res.setHeader("X-RateLimit-Remaining", String(result.remaining));
  res.setHeader("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));
}

/**
 * Email-based limiter (prevents resend abuse by identity)
 * - Use normalized email in key
 */
export function limitEmail(
  email: string,
  prefix: string,
  config: LimitConfig,
): LimitResult {
  const normalized = (email || "").trim().toLowerCase();
  const key = `${prefix}:email:${normalized || "unknown"}`;

  const bucket = getOrInitBucket(key, config.windowMs);
  bucket.count += 1;

  const allowed = bucket.count <= config.max;
  const remaining = Math.max(0, config.max - bucket.count);

  return {
    allowed,
    remaining,
    resetAt: bucket.resetAt,
    limit: config.max,
    key,
  };
}

/* -----------------------------------------------------------------------------
   Compatibility layer for newer diagnostics routes
----------------------------------------------------------------------------- */

export function consumeRateLimit(args: {
  key: string;
  limit: number;
  windowMs: number;
}): ConsumeRateLimitResult {
  const key = String(args.key || "").trim();
  const limit = Math.max(1, Number(args.limit || 1));
  const windowMs = Math.max(1000, Number(args.windowMs || 60_000));

  const bucket = getOrInitBucket(key, windowMs);
  bucket.count += 1;

  const ok = bucket.count <= limit;
  const remaining = Math.max(0, limit - bucket.count);

  return {
    ok,
    remaining,
    resetAt: bucket.resetAt,
    limit,
    key,
  };
}

export function attachRateLimitHeaders(
  res: NextApiResponse,
  result: ConsumeRateLimitResult,
) {
  setRateLimitHeaders(res, result);
}