import type { NextApiRequest, NextApiResponse } from "next";
import { getTokenStore } from "@/lib/server/access/tokenStore";
import { buildSession, setSessionCookie } from "@/lib/server/access/session";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const token = String(req.body?.token || "").trim();
  if (!token) return res.status(400).json({ ok: false, error: "Missing token" });

  const store = await getTokenStore();
  const record = await store.getOneTimeToken(token);

  if (!record) return res.status(401).json({ ok: false, error: "Invalid token" });
  if (record.revoked) return res.status(401).json({ ok: false, error: "Token revoked" });
  if (record.consumedAt) return res.status(401).json({ ok: false, error: "Token already used" });
  if (Date.now() > record.expiresAt) return res.status(401).json({ ok: false, error: "Token expired" });

  const consumed = await store.consumeOneTimeToken(token);
  if (!consumed) return res.status(401).json({ ok: false, error: "Token cannot be redeemed" });

  const session = buildSession({ tier: record.tier, subject: record.subject });
  await store.upsertSession(session);
  await setSessionCookie(res, session);

  return res.status(200).json({ ok: true, tier: session.tier });
}