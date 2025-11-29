// pages/api/inner-circle/unlock.ts
import type { NextApiRequest, NextApiResponse } from "next";
import {
  verifyInnerCircleKey,
  recordInnerCircleUnlock,
} from "@/lib/innerCircleMembership";

// 1 year in seconds
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

// Optional bootstrap key so your standby code works
const BOOTSTRAP_KEY =
  process.env.INNER_CIRCLE_BOOTSTRAP_KEY ?? "FOUNDERS-ARC-2025";

type UnlockJsonResponse =
  | { ok: true; message?: string; redirectTo?: string }
  | { ok: false; error: string };

function setAccessCookie(res: NextApiResponse, secure: boolean): void {
  const parts = [
    "innerCircleAccess=true",
    `Max-Age=${COOKIE_MAX_AGE_SECONDS}`,
    "Path=/",
    "SameSite=Lax",
  ];

  // We cannot mark HttpOnly because the frontend checks document.cookie
  if (secure) {
    parts.push("Secure");
  }

  res.setHeader("Set-Cookie", parts.join("; "));
}

function isHttps(req: NextApiRequest): boolean {
  const proto = req.headers["x-forwarded-proto"] || req.headers["x-forwarded-protocol"];
  if (typeof proto === "string") {
    return proto.split(",")[0].trim() === "https";
  }
  return req.headers.host?.startsWith("localhost") ? false : true;
}

async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse<UnlockJsonResponse>,
): Promise<void> {
  const { key, returnTo } = (req.body ?? {}) as {
    key?: string;
    returnTo?: string;
  };

  const trimmedKey = (key ?? "").trim();
  if (!trimmedKey) {
    res.status(400).json({ ok: false, error: "Key is required." });
    return;
  }

  let valid = false;

  // First, check bootstrap key
  if (trimmedKey === BOOTSTRAP_KEY) {
    valid = true;
  } else {
    const result = verifyInnerCircleKey(trimmedKey);
    if (!result.valid) {
      res.status(400).json({
        ok: false,
        error: "This key is not recognised or has expired.",
      });
      return;
    }
    valid = true;
  }

  if (!valid) {
    res
      .status(400)
      .json({ ok: false, error: "This key is not recognised or has expired." });
    return;
  }

  setAccessCookie(res, isHttps(req));

  // Record unlock only for non-bootstrap keys
  if (trimmedKey !== BOOTSTRAP_KEY) {
    try {
      recordInnerCircleUnlock(trimmedKey);
    } catch {
      // best-effort only – never break unlock
    }
  }

  const safeReturnTo =
    typeof returnTo === "string" &&
    returnTo.startsWith("/") &&
    !returnTo.startsWith("//")
      ? returnTo
      : "/canon";

  res.status(200).json({
    ok: true,
    message: "This device is now unlocked for Canon Inner Circle access.",
    redirectTo: safeReturnTo,
  });
}

function handleGet(
  req: NextApiRequest,
  res: NextApiResponse,
): void {
  const { key, returnTo } = req.query;
  const rawKey = typeof key === "string" ? key : "";
  const trimmedKey = rawKey.trim();

  const safeReturnTo =
    typeof returnTo === "string" &&
    returnTo.startsWith("/") &&
    !returnTo.startsWith("//")
      ? returnTo
      : "/canon";

  if (!trimmedKey) {
    res.status(400).send("Key is required.");
    return;
  }

  let valid = false;

  if (trimmedKey === BOOTSTRAP_KEY) {
    valid = true;
  } else {
    const result = verifyInnerCircleKey(trimmedKey);
    if (!result.valid) {
      res.status(400).send("This key is not recognised or has expired.");
      return;
    }
    valid = true;
  }

  if (!valid) {
    res.status(400).send("This key is not recognised or has expired.");
    return;
  }

  setAccessCookie(res, isHttps(req));

  if (trimmedKey !== BOOTSTRAP_KEY) {
    try {
      recordInnerCircleUnlock(trimmedKey);
    } catch {
      // ignore
    }
  }

  res.writeHead(302, { Location: safeReturnTo });
  res.end();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UnlockJsonResponse | string>,
): Promise<void> {
  if (req.method === "POST") {
    await handlePost(req, res as NextApiResponse<UnlockJsonResponse>);
    return;
  }

  if (req.method === "GET") {
    handleGet(req, res);
    return;
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).json({ ok: false, error: "Method not allowed" });
}