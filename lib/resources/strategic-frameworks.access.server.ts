/* lib/resources/strategic-frameworks.access.server.ts — SSOT (SERVER ONLY) */
import "server-only";

import type { NextApiRequest } from "next";
import type { GetServerSidePropsContext } from "next";

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier } from "@/lib/access/tier-policy";

import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext } from "@/lib/server/auth/tokenStore.postgres";

type ReqLike = NextApiRequest | GetServerSidePropsContext["req"] | any;

export async function getUserTierFromReq(req: ReqLike): Promise<AccessTier> {
  const sessionId = readAccessCookie(req);
  if (!sessionId) return "public";

  const ctx = await getSessionContext(sessionId);
  return normalizeUserTier(ctx.tier ?? ctx.member?.tier ?? "public");
}