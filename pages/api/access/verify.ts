import type { NextApiRequest, NextApiResponse } from "next";
import { resolveRequestAccess } from "@/lib/access/server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });
  }

  const { access } = await resolveRequestAccess(req, res);
  if (!access.permissions.isAuthenticated) {
    return res.status(401).json({ ok: false, reason: "NO_ACTIVE_SESSION" });
  }

  return res.status(200).json({
    ok: true,
    tier: access.tier,
    userId: access.userId,
    role: access.role,
  });
}
