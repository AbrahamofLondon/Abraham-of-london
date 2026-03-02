// pages/api/auth/session.ts
// ✅ NextAuth session endpoint (Pages Router) — JSON only, SSOT-enriched
// ✅ Fix: never return null (prevents next-auth client crash)

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier, hasAccess } from "@/lib/access/tier-policy";

export type Permission =
  | "admin:all"
  | "content:read"
  | "content:write"
  | "downloads:read"
  | "downloads:premium"
  | "inner-circle:access"
  | "billing:read";

function permissionsForTier(tierInput: unknown): Permission[] {
  const tier = normalizeUserTier(tierInput);
  const base: Permission[] = ["content:read"];

  if (hasAccess(tier, "architect")) {
    return [
      "admin:all",
      "content:read",
      "content:write",
      "downloads:read",
      "downloads:premium",
      "inner-circle:access",
      "billing:read",
    ];
  }

  if (hasAccess(tier, "client")) {
    return [...base, "downloads:read", "downloads:premium", "inner-circle:access"];
  }

  if (hasAccess(tier, "inner-circle")) {
    return [...base, "downloads:read", "inner-circle:access"];
  }

  if (hasAccess(tier, "member")) {
    return [...base, "downloads:read"];
  }

  return base;
}

type EnrichedUser = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  tier: AccessTier;
  permissions: Permission[];
  membershipDate?: string | null;
  lastAccess?: string | null;
  [k: string]: unknown;
};

// Replace with real DB query. Safe dev fallback.
const USERS_DB: Array<Omit<EnrichedUser, "tier" | "permissions"> & { tier: string }> = [
  {
    id: "admin_001",
    email: "admin@abrahamoflondon.org",
    name: "System Admin",
    tier: "owner",
    membershipDate: "2024-01-01",
    lastAccess: new Date().toISOString(),
  },
];

function safeEmail(x: unknown): string {
  return String(x ?? "").toLowerCase().trim();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");

  try {
    const session = await getServerSession(req, res, authOptions);

    // ✅ DO NOT return null (next-auth client can crash)
    if (!session || !session.user || !session.user.email) {
      return res.status(200).json({});
    }

    const email = safeEmail(session.user.email);
    const row = USERS_DB.find((u) => safeEmail(u.email) === email);

    // Authenticated but no profile: SSOT-safe defaults
    if (!row) {
      const tier: AccessTier = "public";
      return res.status(200).json({
        ...session,
        user: {
          ...session.user,
          tier,
          permissions: permissionsForTier(tier),
        },
      });
    }

    const tier = normalizeUserTier(row.tier);

    const enriched: EnrichedUser = {
      id: row.id,
      email: row.email,
      name: row.name ?? null,
      image: row.image ?? null,
      tier,
      permissions: permissionsForTier(tier),
      membershipDate: (row as any).membershipDate ?? null,
      lastAccess: new Date().toISOString(),
    };

    return res.status(200).json({
      ...session,
      user: {
        ...session.user,
        name: session.user.name ?? enriched.name ?? null,
        email: session.user.email,
        image: (session.user as any).image ?? enriched.image ?? null,

        id: enriched.id,
        tier: enriched.tier,
        permissions: enriched.permissions,
        membershipDate: enriched.membershipDate ?? null,
        lastAccess: enriched.lastAccess ?? null,
      },
    });
  } catch {
    // ✅ JSON only
    return res.status(200).json({});
  }
}