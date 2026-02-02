// pages/api/access/verify.ts — CANONICAL SESSION VERIFICATION
import type { NextApiRequest, NextApiResponse } from "next";
import { getAccessCookie } from "@/lib/server/auth/cookies";
import { verifySession, type Tier } from "@/lib/server/auth/tokenStore.postgres";

type Data = 
  | { ok: true; tier: Tier; sessionId: string }
  | { ok: false; reason: string };

/**
 * Verification Handler
 * Validates the sessionId stored in the browser cookie.
 * Use this for client-side mounting checks and "Inner Circle" gated UI.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  // 1) Method Gate
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ ok: false, reason: "Method not allowed" });
  }

  try {
    // 2) Extract Session ID from Cookies
    const sessionId = getAccessCookie(req);

    if (!sessionId) {
      return res.status(401).json({ ok: false, reason: "No active session found" });
    }

    // 3) Validate Session against Postgres Store
    // verifySession should check expiration and revocation status
    const session = await verifySession(sessionId);

    if (!session || !session.valid) {
      return res.status(401).json({ ok: false, reason: "Session expired or revoked" });
    }

    // 4) Return Tier and Confirmation
    return res.status(200).json({
      ok: true,
      tier: session.tier,
      sessionId: sessionId // Re-confirming for client state
    });

  } catch (err) {
    console.error("[ACCESS_VERIFY_ERROR]", err);
    return res.status(500).json({ ok: false, reason: "Internal authentication error" });
  }
}