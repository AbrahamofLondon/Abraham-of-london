// pages/api/auth/me.ts — SSOT "me" endpoint
import type { NextApiRequest, NextApiResponse } from "next";

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier, hasAccess } from "@/lib/access/tier-policy";

import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext } from "@/lib/server/auth/tokenStore.postgres";

type Permission =
  | "admin:all"
  | "content:read"
  | "content:write"
  | "downloads:read"
  | "downloads:premium"
  | "inner-circle:access"
  | "billing:read";

function permissionsForTier(tier: AccessTier): Permission[] {
  const base: Permission[] = ["content:read"];

  if (hasAccess(tier, "architect")) {
    return ["admin:all", "content:read", "content:write", "downloads:read", "downloads:premium", "inner-circle:access", "billing:read"];
  }
  if (hasAccess(tier, "client")) return [...base, "downloads:read", "downloads:premium", "inner-circle:access"];
  if (hasAccess(tier, "inner-circle")) return [...base, "downloads:read", "inner-circle:access"];
  if (hasAccess(tier, "member")) return [...base, "downloads:read"];
  return base;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");

  const sessionId = readAccessCookie(req);
  if (!sessionId) {
    return res.status(200).json({ ok: true, authenticated: false, tier: "public", permissions: permissionsForTier("public") });
  }

  const ctx = await getSessionContext(sessionId);
  const tier = normalizeUserTier(ctx.tier ?? ctx.member?.tier ?? "public");

  return res.status(200).json({
    ok: true,
    authenticated: tier !== "public",
    tier,
    permissions: permissionsForTier(tier),
    member: ctx.member ? { id: ctx.member.id ?? ctx.member.memberId ?? null, email: ctx.member.email ?? null } : null,
  });
}