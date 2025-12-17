// pages/api/inner-circle/unlock.ts
import type { NextApiRequest, NextApiResponse } from "next";
// NOTE: Ensure these exist in your lib/inner-circle engine
import { 
  verifyInnerCircleKey, 
  recordInnerCircleUnlock 
} from "@/lib/inner-circle"; 

const INNER_CIRCLE_COOKIE_NAME = "innerCircleAccess";

/**
 * THE UNLOCK ENGINE - Unified Production Version
 * Hardened for persistent access and institutional security.
 */

function setAccessCookie(res: NextApiResponse, secure: boolean): void {
  const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 Year Persistence
  const parts = [
    `${INNER_CIRCLE_COOKIE_NAME}=true`,
    `Max-Age=${COOKIE_MAX_AGE_SECONDS}`,
    "Path=/",
    "SameSite=Lax",
    "HttpOnly=false", // Must be readable by client-side hydration checks
  ];

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

type UnlockJsonResponse =
  | { ok: true; message?: string; redirectTo?: string }
  | { ok: false; error: string; message?: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UnlockJsonResponse>
): Promise<void> {
  // 1. Method Authority (GET for link clicks, POST for form submissions)
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ ok: false, error: "System requires GET or POST for authorization." });
  }

  // 2. Multi-source Input Resolution (Query or Body)
  const key = req.method === "GET" ? req.query.key : req.body.key;
  const returnTo = req.method === "GET" ? req.query.returnTo : req.body.returnTo;

  const rawKey = typeof key === "string" ? key : "";
  const trimmedKey = rawKey.trim();

  if (!trimmedKey) {
    return res.status(400).json({ ok: false, error: "Security key is required for entry." });
  }

  try {
    // 3. Persistent Database Verification
    const result = await verifyInnerCircleKey(trimmedKey);

    if (!result.valid) {
      console.warn(`[Security Alert] Invalid key attempt: ${trimmedKey.substring(0, 8)}...`);
      return res.status(403).json({
        ok: false,
        error: "Invalid or expired key.",
        message: result.reason || "Key does not match current vault records.",
      });
    }

    // 4. Intelligence Logging
    await recordInnerCircleUnlock(trimmedKey);
    
    // 5. Secure Session Persistence
    const secure = isHttps(req);
    setAccessCookie(res, secure);
    
    // 6. Intelligent Redirection Contract
    // Ensures returnTo is a local path to prevent open-redirect vulnerabilities
    const safeRedirect = typeof returnTo === "string" && returnTo.startsWith("/") ? returnTo : "/canon";

    return res.status(200).json({ 
      ok: true, 
      message: "Vault authorized.", 
      redirectTo: safeRedirect 
    });

  } catch (error) {
    console.error("[System Exception] Vault unlock failure:", error);
    return res.status(500).json({ ok: false, error: "Authorization subsystem offline." });
  }
}