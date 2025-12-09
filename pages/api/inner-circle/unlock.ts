// pages/api/inner-circle/unlock.ts - Inline stub
import type { NextApiRequest, NextApiResponse } from "next";

// Stub functions
const verifyInnerCircleKey = async (key: string): Promise<{
  valid: boolean;
  reason?: string;
  memberId?: string;
  accessToken?: string;
  message?: string;
}> => {
  console.log("Stub: verifyInnerCircleKey called for key:", key.substring(0, 8) + "...");
  
  // Check for bootstrap key
  const BOOTSTRAP_KEY = process.env.INNER_CIRCLE_BOOTSTRAP_KEY ?? "FOUNDERS-ARC-2025";
  if (key === BOOTSTRAP_KEY) {
    return { valid: true, message: "Bootstrap key accepted" };
  }
  
  // Simple validation - accept keys that look like they have correct format
  if (key && key.length > 10) {
    return { valid: true, message: "Key accepted (stub)" };
  }
  
  return { valid: false, reason: "Invalid key format" };
};

const recordInnerCircleUnlock = async (key: string): Promise<void> => {
  console.log("Stub: recordInnerCircleUnlock called for key:", key.substring(0, 8) + "...");
};

function setAccessCookie(res: NextApiResponse, secure: boolean): void {
  const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
  const parts = [
    "innerCircleAccess=true",
    `Max-Age=${COOKIE_MAX_AGE_SECONDS}`,
    "Path=/",
    "SameSite=Lax",
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
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const { key, returnTo } = req.query;
  const rawKey = typeof key === "string" ? key : "";
  const trimmedKey = rawKey.trim();

  if (!trimmedKey) {
    res.status(400).json({ ok: false, error: "Missing key parameter" });
    return;
  }

  try {
    const result = await verifyInnerCircleKey(trimmedKey);

    if (!result.valid) {
      res.status(403).json({
        ok: false,
        error: "Invalid or expired key",
        message: result.reason,
      });
      return;
    }

    await recordInnerCircleUnlock(trimmedKey);
    
    // Set access cookie
    const secure = isHttps(req);
    setAccessCookie(res, secure);
    
    if (typeof returnTo === "string" && returnTo.startsWith("/")) {
      res.status(200).json({ ok: true, redirectTo: returnTo });
    } else {
      res.status(200).json({ ok: true, message: "Access granted" });
    }
  } catch (error) {
    console.error("Error verifying inner circle key:", error);
    res.status(500).json({ ok: false, error: "Internal server error" });
  }
}
