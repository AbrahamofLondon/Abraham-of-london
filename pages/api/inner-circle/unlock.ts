// pages/api/inner-circle/unlock.ts
import type { NextApiRequest, NextApiResponse } from "next";

const INNER_CIRCLE_KEY = process.env.INNER_CIRCLE_KEY || "";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  if (!INNER_CIRCLE_KEY) {
    return res
      .status(500)
      .json({ ok: false, error: "INNER_CIRCLE_KEY not configured" });
  }

  const { key } = req.body ?? {};

  if (typeof key !== "string" || !key.trim()) {
    return res.status(400).json({ ok: false, error: "Missing key" });
  }

  if (key.trim() !== INNER_CIRCLE_KEY) {
    return res.status(401).json({ ok: false, error: "Invalid key" });
  }

  const isProd = process.env.NODE_ENV === "production";

  // Secure, httpOnly cookie for gating
  res.setHeader("Set-Cookie", [
    [
      "innerCircleAccess=true",
      "Path=/",
      `Max-Age=${60 * 60 * 24 * 30}`, // 30 days
      "HttpOnly",
      "SameSite=Lax",
      isProd ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; "),
  ]);

  return res.status(200).json({ ok: true });
}