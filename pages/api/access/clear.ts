// pages/api/access/clear.ts — SESSION PURGE
import type { NextApiRequest, NextApiResponse } from "next";
import { clearAccessCookie } from "@/lib/server/auth/cookies";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, reason: "Method not allowed" });
  }

  try {
    // Purge the cookie via the server utility
    clearAccessCookie(res);
    return res.status(200).json({ ok: true, message: "Clearance revoked" });
  } catch (err) {
    return res.status(500).json({ ok: false, reason: "Purge failure" });
  }
}