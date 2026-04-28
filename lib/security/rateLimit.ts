import type { NextApiRequest, NextApiResponse } from "next";
import { anonymizeIp, getClientIp } from "@/lib/server/ip";
import { consumePersistentRateLimit } from "@/lib/server/security/persistent-rate-limit";

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

function buildResult(result: Awaited<ReturnType<typeof consumePersistentRateLimit>>): LimitResult {
  return {
    allowed: result.allowed,
    remaining: result.remaining,
    resetAt: result.resetAt,
    limit: result.limit,
    key: result.key,
  };
}

export async function limitIp(
  req: NextApiRequest,
  prefix: string,
  config: LimitConfig,
): Promise<LimitResult> {
  const ip = getClientIp(req);
  const anon = anonymizeIp(ip);
  const key = `${prefix}:${anon}`;

  const result = await consumePersistentRateLimit({
    key,
    limit: config.max,
    windowMs: config.windowMs,
    failClosed: true,
  });

  return buildResult(result);
}

export function setRateLimitHeaders(
  res: NextApiResponse,
  result: LimitResult | ConsumeRateLimitResult,
) {
  res.setHeader("X-RateLimit-Limit", String(result.limit));
  res.setHeader("X-RateLimit-Remaining", String(result.remaining));
  res.setHeader("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));
}

export async function limitEmail(
  email: string,
  prefix: string,
  config: LimitConfig,
): Promise<LimitResult> {
  const normalized = (email || "").trim().toLowerCase();
  const key = `${prefix}:email:${normalized || "unknown"}`;

  const result = await consumePersistentRateLimit({
    key,
    limit: config.max,
    windowMs: config.windowMs,
    failClosed: true,
  });

  return buildResult(result);
}

export async function consumeRateLimit(args: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<ConsumeRateLimitResult> {
  const key = String(args.key || "").trim();
  const limit = Math.max(1, Number(args.limit || 1));
  const windowMs = Math.max(1000, Number(args.windowMs || 60_000));

  const result = await consumePersistentRateLimit({
    key,
    limit,
    windowMs,
    failClosed: true,
  });

  return {
    ok: result.allowed,
    remaining: result.remaining,
    resetAt: result.resetAt,
    limit: result.limit,
    key: result.key,
  };
}

export function attachRateLimitHeaders(
  res: NextApiResponse,
  result: ConsumeRateLimitResult,
) {
  setRateLimitHeaders(res, result);
}
