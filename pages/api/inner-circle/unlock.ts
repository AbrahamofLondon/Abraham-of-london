// pages/api/inner-circle/unlock.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { normalizeKey } from "@/lib/server/innerCircleCrypto";
import { validateMemberKey } from "@/lib/server/innerCircleMembership";
import {
  checkRateLimit,
  getClientIp,
} from "@/lib/server/rateLimit";

type UnlockPostSuccess = {
  ok: true;
  redirectTo: string;
};

type UnlockPostFailure = {
  ok: false;
  error: string;
};

const INNER_CIRCLE_COOKIE_NAME = "innerCircleAccess";

function getMasterKey(): string {
  const raw = process.env.INNER_CIRCLE_ACCESS_KEY ?? "";
  return normalizeKey(raw);
}

function buildAccessCookie(): string {
  const isProd = process.env.NODE_ENV === "production";

  const parts = [
    `${INNER_CIRCLE_COOKIE_NAME}=true`,
    "Path=/",
    "SameSite=Lax",
    "HttpOnly",
  ];

  if (isProd) parts.push("Secure");

  const maxAgeSeconds = 60 * 60 * 24 * 30;
  parts.push(`Max-Age=${maxAgeSeconds}`);

  return parts.join("; ");
}

async function checkKeyAgainstStore(key: string): Promise<boolean> {
  const candidate = normalizeKey(key);
  const masterKey = getMasterKey();

  if (masterKey && candidate === masterKey) {
    return true;
  }

  return validateMemberKey(candidate);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UnlockPostSuccess | UnlockPostFailure | void>,
) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  // 🔐 IP rate-limit: max 50 unlock attempts / 10 minutes / IP
  const ip = getClientIp(req);
  const rate = checkRateLimit(ip, "inner-circle-unlock", {
    windowMs: 10 * 60_000,
    max: 50,
  });

  if (!rate.allowed) {
    if (rate.retryAfterMs !== undefined) {
      res.setHeader(
        "Retry-After",
        String(Math.ceil(rate.retryAfterMs / 1000)),
      );
    }

    if (req.method === "GET") {
      return res
        .status(302)
        .redirect("/inner-circle?error=too-many-attempts");
    }

    return res.status(429).json({
      ok: false,
      error: "Too many unlock attempts. Please try again later.",
    });
  }

  const returnToDefault = "/canon";

  try {
    if (req.method === "GET") {
      const keyParam = normalizeKey(String(req.query.key ?? ""));
      const returnToRaw = String(req.query.returnTo ?? returnToDefault);

      const ok = keyParam ? await checkKeyAgainstStore(keyParam) : false;

      if (!ok) {
        return res.status(302).redirect("/inner-circle?error=invalid-key");
      }

      const returnTo =
        returnToRaw.startsWith("/") && !returnToRaw.startsWith("//")
          ? returnToRaw
          : returnToDefault;

      res.setHeader("Set-Cookie", buildAccessCookie());
      return res.status(302).redirect(returnTo);
    }

    const body = (req.body ?? {}) as {
      key?: string;
      returnTo?: string;
    };

    const keyBody = normalizeKey(body.key ?? "");
    const returnToRaw = body.returnTo ?? returnToDefault;

    const ok = keyBody ? await checkKeyAgainstStore(keyBody) : false;

    if (!ok) {
      return res.status(400).json({ ok: false, error: "Invalid key" });
    }

    const returnTo =
      typeof returnToRaw === "string" &&
      returnToRaw.startsWith("/") &&
      !returnToRaw.startsWith("//")
        ? returnToRaw
        : returnToDefault;

    res.setHeader("Set-Cookie", buildAccessCookie());
    return res.status(200).json({ ok: true, redirectTo: returnTo });
  } catch {
    if (req.method === "GET") {
      return res
        .status(302)
        .redirect("/inner-circle?error=server-error");
    }

    return res.status(500).json({
      ok: false,
      error: "Inner Circle unlock is temporarily unavailable",
    });
  }
}