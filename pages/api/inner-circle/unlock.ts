// pages/api/inner-circle/unlock.ts
import type { NextApiRequest, NextApiResponse } from "next";
import {
  checkRateLimit,
  getClientKeyFromReq,
} from "@/lib/security";

const INNER_CIRCLE_COOKIE_NAME = "innerCircleAccess";

type UnlockPostSuccess = {
  ok: true;
  redirectTo: string;
};

type UnlockPostFailure = {
  ok: false;
  error: string;
};

type UnlockResponse = UnlockPostSuccess | UnlockPostFailure | void;

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<UnlockResponse>,
) {
  const accessKey = process.env.INNER_CIRCLE_ACCESS_KEY;

  if (!accessKey) {
    const msg = "Inner Circle is not configured on the server";
    if (req.method === "POST") {
      return res.status(500).json({ ok: false, error: msg });
    }
    return res.status(500).end(msg);
  }

  // Rate limit both GET & POST unlock attempts: 10 per 10 minutes
  const clientKey = getClientKeyFromReq(req);
  const allowed = checkRateLimit(clientKey + ":inner-circle-unlock", {
    windowMs: 10 * 60 * 1000,
    maxHits: 10,
  });

  if (!allowed) {
    if (req.method === "POST") {
      return res.status(429).json({
        ok: false,
        error:
          "Too many unlock attempts from this device. Please try again later.",
      });
    }
    return res
      .status(429)
      .end("Too many unlock attempts. Please try again later.");
  }

  if (req.method === "GET") {
    return handleGetUnlock(req, res, accessKey);
  }

  if (req.method === "POST") {
    return handlePostUnlock(req, res, accessKey);
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ ok: false, error: "Method not allowed" });
}

// ---------------------------------------------------------------------------
// Internal handlers
// ---------------------------------------------------------------------------

function handleGetUnlock(
  req: NextApiRequest,
  res: NextApiResponse<void>,
  accessKey: string,
) {
  const key = String(req.query.key || "");
  const returnToRaw = String(req.query.returnTo || "/canon");

  if (!key || key !== accessKey) {
    // Bad key → send them back to the join page with an error flag
    return res.status(302).redirect("/inner-circle?error=invalid-key");
  }

  const returnTo = sanitizeReturnTo(returnToRaw);

  res.setHeader("Set-Cookie", buildAccessCookie());
  return res.status(302).redirect(returnTo);
}

function handlePostUnlock(
  req: NextApiRequest,
  res: NextApiResponse<UnlockPostSuccess | UnlockPostFailure>,
  accessKey: string,
) {
  const { key, returnTo: bodyReturnTo } = (req.body ?? {}) as {
    key?: string;
    returnTo?: string;
  };

  if (!key || key !== accessKey) {
    return res.status(400).json({ ok: false, error: "Invalid key" });
  }

  const returnTo = sanitizeReturnTo(bodyReturnTo);

  res.setHeader("Set-Cookie", buildAccessCookie());
  return res.status(200).json({ ok: true, redirectTo: returnTo });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sanitizeReturnTo(target?: string): string {
  if (
    typeof target === "string" &&
    target.startsWith("/") &&
    !target.startsWith("//")
  ) {
    return target;
  }
  return "/canon";
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

  // 30 days – adjust as needed
  const maxAgeSeconds = 60 * 60 * 24 * 30;
  parts.push(`Max-Age=${maxAgeSeconds}`);

  return parts.join("; ");
}