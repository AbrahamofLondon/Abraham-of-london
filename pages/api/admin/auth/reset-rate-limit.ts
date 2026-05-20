import type { NextApiRequest, NextApiResponse } from "next";

import { clearPersistentRateLimit } from "@/lib/server/security/persistent-rate-limit";

const ALLOWED_KEYS = new Set(["admin-verify", "admin-send-link"]);

function clientIp(req: NextApiRequest): string {
  return String(
    req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown",
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV !== "development") {
    return res.status(404).json({ ok: false, error: "NOT_FOUND" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const routeKey = typeof req.body?.routeKey === "string" ? req.body.routeKey : "";
  if (!ALLOWED_KEYS.has(routeKey)) {
    return res.status(400).json({ ok: false, error: "INVALID_RATE_LIMIT_KEY" });
  }

  const key = `${routeKey}:${clientIp(req)}`;
  const cleared = await clearPersistentRateLimit(key);

  return res.status(200).json({
    ok: true,
    routeKey,
    cleared,
  });
}
