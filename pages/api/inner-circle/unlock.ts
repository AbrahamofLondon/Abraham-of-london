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

type UnlockPostSuccess = {
  ok: true;
  redirectTo: string;
};

type UnlockPostFailure = {
  ok: false;
  error: string;
};

type UnlockResponse = UnlockPostSuccess | UnlockPostFailure | void;

const INNER_CIRCLE_COOKIE_NAME = "innerCircleAccess";

// Optional master override key – lets you share a private “master” code
const MASTER_KEY_ENV = "INNER_CIRCLE_ACCESS_KEY";

function buildAccessCookie(): string {
  const isProd = process.env.NODE_ENV === "production";

  const parts = [
    `${INNER_CIRCLE_COOKIE_NAME}=true`,
    "Path=/",
    "SameSite=Lax",
    "HttpOnly",
  ];

  if (isProd) parts.push("Secure");

  // 30 days – adjust if you like
  const maxAgeSeconds = 60 * 60 * 24 * 30;
  parts.push(`Max-Age=${maxAgeSeconds}`);

  return parts.join("; ");
}

function sanitiseReturnTo(raw: string | undefined): string {
  if (!raw) return "/canon";
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return "/canon";
  return trimmed;
}

function getClientIp(req: NextApiRequest): string {
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length > 0) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const remote = req.socket.remoteAddress;
  return remote ?? "unknown";
}

function isMasterKey(key: string): boolean {
  const master = process.env[MASTER_KEY_ENV];
  return Boolean(master && key === master);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UnlockResponse>,
) {
  const ip = getClientIp(req);
  const rlResult = rateLimit(ip, {
    ...RATE_LIMIT_CONFIGS.AUTHENTICATION,
    keyPrefix: "inner-circle-unlock",
  });

  const rlHeaders = createRateLimitHeaders(rlResult);
  Object.entries(rlHeaders).forEach(([key, value]) =>
    res.setHeader(key, value),
  );

  if (!rlResult.allowed) {
    if (req.method === "POST") {
      return res.status(429).json({
        ok: false,
        error: "Too many attempts. Please try again later.",
      });
    }

    return res
      .status(302)
      .redirect("/inner-circle?error=rate-limited");
  }

  const method = req.method;

  if (method === "GET") {
    const key = String(req.query.key ?? "");
    const returnToRaw = String(req.query.returnTo ?? "/canon");
    const returnTo = sanitiseReturnTo(returnToRaw);

    if (!key) {
      return res
        .status(302)
        .redirect("/inner-circle?error=missing-key");
    }

    const verification = verifyInnerCircleKey(key);
    const isValidKey =
      verification.valid || (!verification.valid && isMasterKey(key));

    if (!isValidKey) {
      return res
        .status(302)
        .redirect("/inner-circle?error=invalid-or-expired-key");
    }

    if (verification.valid) {
      recordInnerCircleUnlock(key, ip);
    }

    res.setHeader("Set-Cookie", buildAccessCookie());
    return res.status(302).redirect(returnTo);
  }

  if (method === "POST") {
    const { key, returnTo: bodyReturnTo } = (req.body ?? {}) as {
      key?: string;
      returnTo?: string;
    };

    const safeKey = typeof key === "string" ? key.trim() : "";
    const returnTo = sanitiseReturnTo(bodyReturnTo);

    if (!safeKey) {
      return res
        .status(400)
        .json({ ok: false, error: "Key is required" });
    }

    const verification = verifyInnerCircleKey(safeKey);
    const isValidKey =
      verification.valid || (!verification.valid && isMasterKey(safeKey));

    if (!isValidKey) {
      return res
        .status(400)
        .json({ ok: false, error: "Invalid or expired key" });
    }

    if (verification.valid) {
      recordInnerCircleUnlock(safeKey, ip);
    }

    res.setHeader("Set-Cookie", buildAccessCookie());
    return res.status(200).json({
      ok: true,
      redirectTo: returnTo,
    });
  }

  res.setHeader("Allow", "GET, POST");
  return res
    .status(405)
    .json({ ok: false, error: "Method not allowed" });
}