// pages/api/inner-circle/unlock.ts
import type { NextApiRequest, NextApiResponse } from "next";

import {
  rateLimit,
  createRateLimitHeaders,
  RATE_LIMIT_CONFIGS,
} from "@/lib/server/rateLimit";
import {
  verifyInnerCircleKey,
  recordInnerCircleUnlock,
} from "@/lib/innerCircleMembership";
import { getClientIpWithAnalysis } from "@/lib/server/ip";

type UnlockSuccess = {
  ok: true;
  message?: string;
  redirectTo?: string;
};

type UnlockFailure = {
  ok: false;
  error: string;
};

export type UnlockResponse = UnlockSuccess | UnlockFailure;

const INNER_CIRCLE_COOKIE_NAME = "innerCircleAccess";
const INNER_CIRCLE_COOKIE_VALUE = "true";
const INNER_CIRCLE_COOKIE_DAYS = 365;

function logUnlock(action: string, meta: Record<string, unknown> = {}): void {
  // eslint-disable-next-line no-console
  console.log(`[InnerCircle:Unlock] ${action}`, {
    ts: new Date().toISOString(),
    ...meta,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UnlockResponse>
): Promise<void> {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const key =
    (req.method === "GET"
      ? (req.query.key as string | undefined)
      : (req.body?.key as string | undefined)) ?? "";

  const returnToRaw =
    (req.method === "GET"
      ? (req.query.returnTo as string | undefined)
      : (req.body?.returnTo as string | undefined)) ?? "/canon";

  const ipInfo = getClientIpWithAnalysis(req);
  const ip = ipInfo.ip;

  // Rate limit
  const rl = rateLimit(
    `inner-circle-unlock:${ip}`,
    RATE_LIMIT_CONFIGS.INNER_CIRCLE_UNLOCK
  );
  const rlHeaders = createRateLimitHeaders(rl);
  Object.entries(rlHeaders).forEach(([k, v]) => res.setHeader(k, v));

  if (!rl.allowed) {
    logUnlock("rate_limited", { ip });
    res.status(429).json({
      ok: false,
      error: "Too many unlock attempts. Please try again later.",
    });
    return;
  }

  if (!key.trim()) {
    res.status(400).json({ ok: false, error: "Access key is required." });
    return;
  }

  // Sanitize return target
  const returnTo =
    typeof returnToRaw === "string" &&
    returnToRaw.startsWith("/") &&
    !returnToRaw.startsWith("//")
      ? returnToRaw
      : "/canon";

  try {
    const verifyResult = await verifyInnerCircleKey(key);

    if (!verifyResult.valid) {
      logUnlock("invalid_key", { reason: verifyResult.reason, ip });
      res.status(400).json({
        ok: false,
        error: "The access key is invalid or expired.",
      });
      return;
    }

    await recordInnerCircleUnlock(key, ip);

    // Set cookie
    const maxAgeSeconds = INNER_CIRCLE_COOKIE_DAYS * 24 * 60 * 60;
    res.setHeader("Set-Cookie", [
      `${INNER_CIRCLE_COOKIE_NAME}=${INNER_CIRCLE_COOKIE_VALUE}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax; HttpOnly=false; Secure=${
        process.env.NODE_ENV === "production"
      }`,
    ]);

    logUnlock("success", {
      keySuffix: verifyResult.keySuffix,
      ip,
      redirectTo: returnTo,
    });

    res.status(200).json({
      ok: true,
      message: "Inner Circle access has been unlocked on this device.",
      redirectTo: returnTo,
    });
  } catch (err) {
    logUnlock("error", {
      ip,
      error: err instanceof Error ? err.message : "unknown",
    });
    res.status(500).json({
      ok: false,
      error: "Something went wrong unlocking your access.",
    });
  }
}
