// pages/api/access/revoke.ts
// ✅ Postgres-backed (Prisma) revocation
// ✅ Clears cookie
// ✅ Optional: revoke underlying key (full lockout)
// ✅ Includes a simple admin guard (header-based) so random users can’t revoke arbitrary keys.
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
// ---- Simple admin guard ------------------------------------------------------
// Set in Netlify/Vercel env: ACCESS_REVOKE_ADMIN_TOKEN="some-long-random-string"
// Client/admin tool must send header: x-admin-token: <value>
function requireAdmin(req: NextApiRequest): { ok: true } | { ok: false; reason: string } {
  const expected = process.env.ACCESS_REVOKE_ADMIN_TOKEN;
  if (!expected) {
    // Fail closed in prod, but allow local dev if you really want:
    if (process.env.NODE_ENV !== "production") return { ok: true };
    return { ok: false, reason: "Server not configured for revocation" };
  }
  const provided = String(req.headers["x-admin-token"] || "");
  if (!provided || provided !== expected) return { ok: false, reason: "Unauthorized" };
  return { ok: true };
}
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Ok | Fail>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, reason: "Method not allowed" });
  }
  // Admin guard (prevents malicious key revocations)
  const admin = requireAdmin(req);
  if (!admin.ok) return res.status(401).json({ ok: false, reason: admin.reason });
  // You can revoke:
  // A) current browser session (cookie)
  // B) a provided sessionToken (admin revocation for a specific session)
  // C) optionally revoke keyHash to lock account
  const body = (req.body ?? {}) as { sessionToken?: string; keyHash?: string; reason?: string };
  const sessionTokenFromCookie = getAccessTokenFromReq(req);
  const sessionToken = String(body.sessionToken || sessionTokenFromCookie || "").trim();
  if (!sessionToken) {
    return res.status(400).json({ ok: false, reason: "No session token" });
  }
  const reason = safeSlice(String(body.reason || "manual_revoke"), 0, 120);
  try {
    // 1) Invalidate session in Postgres
    await revokeSession(sessionToken, reason);
    // 2) Optional: revoke underlying key (full lockout)
    const keyHash = String(body.keyHash || "").trim();
    if (keyHash) {
      await revokeKeyByHash(keyHash, reason);
    }
    // 3) Clear cookie on caller (harmless if admin revoked someone else)
    removeAccessCookie(res);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[REVOKE_ERROR]", err);
    return res.status(500).json({ ok: false, reason: "Revoke failed" });
  }
}