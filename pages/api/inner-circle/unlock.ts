import type { NextApiRequest, NextApiResponse } from "next";
import { verifyInnerCircleKey, recordInnerCircleUnlock, getClientIp } from "@/lib/inner-circle";

const COOKIE_NAME = "innerCircleAccess";

type UnlockJsonResponse =
  | { ok: true; message: string; redirectTo: string }
  | { ok: false; error: string; message?: string };

function isSecureRequest(req: NextApiRequest): boolean {
  const proto = req.headers["x-forwarded-proto"];
  if (typeof proto === "string") return proto.split(",")[0].trim() === "https";
  return !(req.headers.host || "").includes("localhost");
}

function setAccessCookie(res: NextApiResponse, secure: boolean): void {
  const maxAge = 60 * 60 * 24 * 365; // 1 year
  const parts = [
    `${COOKIE_NAME}=true`,
    `Max-Age=${maxAge}`,
    "Path=/",
    "SameSite=Lax",
    // IMPORTANT: must be readable by client checks -> not HttpOnly
    "HttpOnly=false",
  ];
  if (secure) parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}

function safeReturnTo(v: unknown): string {
  if (typeof v !== "string") return "/canon";
  const trimmed = v.trim();
  if (!trimmed.startsWith("/")) return "/canon";
  // Prevent protocol-relative or weird edgecases
  if (trimmed.startsWith("//")) return "/canon";
  return trimmed;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<UnlockJsonResponse>) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const key = req.method === "GET" ? req.query.key : req.body?.key;
  const returnTo = req.method === "GET" ? req.query.returnTo : req.body?.returnTo;

  const trimmedKey = typeof key === "string" ? key.trim() : "";
  if (!trimmedKey) return res.status(400).json({ ok: false, error: "Security key is required." });

  try {
    const result = await verifyInnerCircleKey(trimmedKey);

    if (!result.valid) {
      return res.status(403).json({
        ok: false,
        error: "Invalid or expired key.",
        message: result.reason || "invalid",
      });
    }

    await recordInnerCircleUnlock(trimmedKey, getClientIp(req));

    setAccessCookie(res, isSecureRequest(req));

    const redirectTo = safeReturnTo(returnTo);
    return res.status(200).json({ ok: true, message: "Vault authorized.", redirectTo });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Authorization subsystem offline." });
  }
}