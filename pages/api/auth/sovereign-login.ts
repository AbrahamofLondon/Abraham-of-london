/* pages/api/auth/sovereign-login.ts — LEGACY FORWARD-ONLY SHIM */

import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader("Cache-Control", "no-store, private");

  if (req.method === "POST") {
    res.setHeader("Location", "/api/auth/sovereign");
    return res.status(307).json({
      ok: false,
      migrated: true,
      message: "This endpoint has moved to /api/auth/sovereign.",
      destination: "/api/auth/sovereign",
    });
  }

  return res.status(410).json({
    ok: false,
    error: "ENDPOINT_DEPRECATED",
    message: "Use /api/auth/sovereign instead.",
    destination: "/api/auth/sovereign",
  });
}