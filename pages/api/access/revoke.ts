/* pages/api/access/revoke.ts — V7.1 GOVERNANCE COMPLIANT (SYNCED) */
import { safeSlice } from "@/lib/utils/safe";
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma"; // Added for Global Sync
import {
  revokeSession,
  revokeKeyByHash,
  verifySession, // Added to find the User associated with the session
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
  forceGlobalLogout?: boolean; // New directive for project-wide reset
};

// Phase 0: consolidated admin auth — standard Authorization: Bearer ADMIN_API_KEY.
// Replaces the ad-hoc x-admin-token header + ACCESS_REVOKE_ADMIN_TOKEN env var.
function requireAdminAuth(req: NextApiRequest): { ok: true } | { ok: false; reason: string } {
  const adminKey = (process.env.ADMIN_API_KEY || "").trim();

  if (!adminKey) {
    if (process.env.NODE_ENV !== "production") return { ok: true };
    return { ok: false, reason: "Server not configured for admin auth" };
  }

  const auth = String(req.headers.authorization || "");
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";

  if (!token || token !== adminKey) {
    return { ok: false, reason: "Unauthorized" };
  }

  return { ok: true };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Fail>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, reason: "Method not allowed" });
  }

  const admin = requireAdminAuth(req);
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
    // 0. PROJECT-WIDE SYNC PREP: Find the associated User before we kill the session
    const activeSession = await verifySession(sessionToken);

    // 1. Revoke the specific session in Postgres (Institutional Layer)
    const sessionRes = await revokeSession(sessionToken);
    if (!sessionRes.ok) {
        console.warn("[REVOKE_WARNING] Session revocation returned failure", sessionRes.reason);
    }

    // 2. Optional: Full lockout via Key Revocation (Permanent until re-issued)
    const keyHash = String(body.keyHash || "").trim();
    if (keyHash) {
      await revokeKeyByHash(keyHash);
    }

    // 3. GLOBAL PROJECT SYNC: Invalidate persisted identity tier.
    // Persisted identity is InnerCircleMember (there is no User model). Drop
    // the member's tier to the lowest current Prisma enum value and bump
    // lastSeenAt to force session/JWT mismatch on next validation.
    //
    // NOTE: current Prisma AccessTier enum does not include "public". The
    // 9-tier canonical expansion in SCHEMA-PR-CHAIN-CHECKLIST-01 PR 1 will
    // restore the ability to drop all the way to "public"; until then
    // "member" is the lowest available value.
    if (body.forceGlobalLogout && activeSession.ok && activeSession.valid && activeSession.memberId) {
      await prisma.innerCircleMember.update({
        where: { id: activeSession.memberId },
        data: {
          tier: "member",
          lastSeenAt: new Date(),
        },
      });
    }

    // 4. Telemetry / Logging
    if (process.env.NODE_ENV !== "production") {
      console.info("[ACCESS_REVOKE_SUCCESS]", {
        sessionToken: `${sessionToken.slice(0, 8)}...`,
        keyRevoked: !!keyHash,
        globalSync: !!body.forceGlobalLogout,
        reason,
      });
    }

    // 5. Client-side cleanup: Wipe the cookie
    removeAccessCookie(res);
    
    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error("[REVOKE_CRITICAL_FAILURE]", err);
    return res.status(500).json({ ok: false, reason: "Internal revocation failure" });
  }
}