// pages/api/access/verify.ts — CANONICAL SESSION VERIFICATION (schema + TS safe)
import type { NextApiRequest, NextApiResponse } from "next";
import { getTokenStore } from "@/lib/server/access/tokenStore";
import type { AccessTier } from "@/lib/access/tier-policy";

type Data =
  | { ok: true; tier: AccessTier; sessionId: string }
  | { ok: false; reason: string };

const COOKIE_NAME = "aol_access";

function parseCookies(req: NextApiRequest): Record<string, string> {
  const header = String(req.headers.cookie || "");
  const out: Record<string, string> = {};
  if (!header) return out;

  header
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((part) => {
      const i = part.indexOf("=");
      if (i < 0) return;
      const k = part.slice(0, i).trim();
      const v = part.slice(i + 1);
      if (!k) return;
      try {
        out[k] = decodeURIComponent(v);
      } catch {
        out[k] = v;
      }
    });

  return out;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ ok: false, reason: "Method not allowed" });
  }

  try {
    const cookies = parseCookies(req);
    const sessionId = String(cookies[COOKIE_NAME] || "").trim();

    if (!sessionId) {
      return res.status(401).json({ ok: false, reason: "No active session found" });
    }

    const store = await getTokenStore();
    const session = await store.getSession(sessionId);

    if (!session) {
      return res.status(401).json({ ok: false, reason: "Session expired or revoked" });
    }

    // store.getSession already enforces expiry in your postgres adapter
    return res.status(200).json({
      ok: true,
      tier: session.tier,
      sessionId,
    });
  } catch (err) {
    console.error("[ACCESS_VERIFY_ERROR]", err);
    return res.status(500).json({ ok: false, reason: "Internal authentication error" });
  }
}