/* lib/resources/strategic-frameworks.access.server.ts — SSOT (SERVER ONLY) */
import "server-only";

import type { NextApiRequest } from "next";
import type { GetServerSidePropsContext } from "next";

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier } from "@/lib/access/tier-policy";

import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext } from "@/lib/server/auth/tokenStore.postgres";

type ReqLike = NextApiRequest | GetServerSidePropsContext["req"] | any;

// Minimal “duck type” for safe extraction
type SessionContextLike = {
  tier?: unknown;
  profile?: { tier?: unknown } | null;
  member?: { tier?: unknown } | null;
  role?: unknown;
  accessTier?: unknown;
  clearance?: unknown;
  [k: string]: unknown;
};

function extractTier(ctx: SessionContextLike | null | undefined): unknown {
  if (!ctx) return undefined;
  return (
    ctx.tier ??
    ctx.accessTier ??
    ctx.clearance ??
    ctx.role ??
    ctx.profile?.tier ??
    ctx.member?.tier ??
    undefined
  );
}

export async function getUserTierFromReq(req: ReqLike): Promise<AccessTier> {
  const sessionId = readAccessCookie(req);
  if (!sessionId) return "public";

  const ctx = (await getSessionContext(sessionId)) as unknown as SessionContextLike;

  // ✅ No ctx.user access at all — fixes your compile error
  return normalizeUserTier(extractTier(ctx) ?? "public");
}