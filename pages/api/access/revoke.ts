/* pages/api/access/revoke.ts — GOVERNANCE COMPLIANT REVOCATION */
import { safeSlice } from "@/lib/utils/safe";
import type { NextApiRequest, NextApiResponse } from "next";
import {
  revokeSession,
  revokeKeyByHash,
} from "@/lib/server/auth/tokenStore.postgres";
import {
  getAccessTokenFromReq,
  removeAccessCookie,
} from "@/lib/server/auth/cookies";

type Ok = { ok: true };
type Fail = { ok: false; reason: string };

type RevokeBody = {
  sessionToken?: string;
  keyHash?: string;
  reason?: string;
};

/** Simple admin guard for institutional security */
function requireAdmin(req: NextApiRequest): { ok: true } | { ok: false; reason: string } {
  const expected = process.env.ACCESS_REVOKE_ADMIN_TOKEN;

  if (!expected) {
    // Safety fallback for development; strict for production
    if (process.env.NODE_ENV !== "production") return { ok: true };
    return { ok: false, reason: "Server not configured for revocation" };
  }

  const header = req.headers["x-admin-token"];
  const provided = Array.isArray(header) ? header[0] : header;

  if (!provided || String(provided) !== expected) {
    return { ok: false, reason: "Unauthorized" };
  }

  return { ok: true };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Fail>) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, reason: "Method not allowed" });
  }

  const admin = requireAdmin(req);
  if (!admin.ok) {
    return res.status(401).json({ ok: false, reason: admin.reason });
  }

  const body: RevokeBody = req.body && typeof req.body === "object" ? (req.body as RevokeBody) : {};

  const sessionTokenFromCookie = getAccessTokenFromReq(req);
  const sessionToken = String(body.sessionToken || sessionTokenFromCookie || "").trim();

  if (!sessionToken) {
    return res.status(400).json({ ok: false, reason: "No session token provided" });
  }

  const reason = safeSlice(String(body.reason || "manual_revoke"), 0, 120);

  try {
    // 1. Revoke the specific session in Postgres
    const sessionRes = await revokeSession(sessionToken);
    if (!sessionRes.ok) {
        console.warn("[REVOKE_WARNING] Session revocation returned failure", sessionRes.reason);
    }

    // 2. Optional: Full lockout via Key Revocation (Permanent until re-issued)
    const keyHash = String(body.keyHash || "").trim();
    if (keyHash) {
      await revokeKeyByHash(keyHash);
    }

    // 3. Telemetry / Logging
    if (process.env.NODE_ENV !== "production") {
      console.info("[ACCESS_REVOKE_SUCCESS]", {
        sessionToken: `${sessionToken.slice(0, 8)}...`,
        keyRevoked: !!keyHash,
        reason,
      });
    }

    // 4. Client-side cleanup: Wipe the cookie
    removeAccessCookie(res);
    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error("[REVOKE_CRITICAL_FAILURE]", err);
    return res.status(500).json({ ok: false, reason: "Internal revocation failure" });
  }
}