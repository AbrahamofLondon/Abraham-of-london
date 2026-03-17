// pages/api/auth/session.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma"; // Ensure you have a shared prisma client

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier, hasAccess } from "@/lib/access/tier-policy";

// Redefined to match your internal Permission strategy
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

  if (hasAccess(tier, "architect") || hasAccess(tier, "owner")) {
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

  return [...base, "downloads:read"];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store, max-age=0");

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.email) {
      return res.status(200).json({});
    }

    const email = session.user.email.toLowerCase().trim();

    // 🔍 Query the real SSOT: The Database
    const member = await prisma.innerCircleMember.findUnique({
      where: { email },
      select: {
        id: true,
        tier: true,
        name: true,
        createdAt: true,
        status: true
      }
    });

    // Handle authenticated users not yet in the 'Inner Circle'
    if (!member || member.status !== "active") {
      const defaultTier: AccessTier = "public";
      return res.status(200).json({
        ...session,
        user: {
          ...session.user,
          tier: defaultTier,
          permissions: permissionsForTier(defaultTier),
        },
      });
    }

    const tier = normalizeUserTier(member.tier);

    return res.status(200).json({
      ...session,
      user: {
        ...session.user,
        id: member.id,
        name: member.name || session.user.name,
        tier,
        permissions: permissionsForTier(tier),
        membershipDate: member.createdAt.toISOString(),
        lastAccess: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Auth Session Error:", error);
    return res.status(200).json({});
  }
}