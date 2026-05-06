// pages/api/admin/members/list.ts — Admin member directory
//
// GET returns the full InnerCircleMember roster with active-key summary.
//
// Gate: middleware.ts (Tier 3) already enforces `token.isInternal` at the
// route-layer on every `/api/admin/**` request. This handler adds a
// defense-in-depth check via NextAuth getServerSession to keep parity
// with sibling admin routes (e.g. pages/api/admin/users/upgrade.ts).
//
// Note: lib/server/auth/admin-utils.ts exports a `verifyAdminSession()`
// JWT verifier, but it has zero existing callers in the codebase and no
// established admin-cookie convention. Using getServerSession keeps this
// route consistent with the live pattern.

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";

type ApiResponse =
  | {
      ok: true;
      members: Array<{
        id: string;
        email: string | null;
        name: string | null;
        tier: string;
        createdAt: string;
        activeKeys: Array<{
          expiresAt: string | null;
          createdAt: string;
        }>;
      }>;
      total: number;
    }
  | { ok: false; error: string; code?: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const session = await requireAdminServer(req, res, { routeKey: "admin-members-list" });
  if (!session) return;

  try {
    const rows = await prisma.innerCircleMember.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        tier: true,
        createdAt: true,
        keys: {
          where: { status: "active" },
          select: {
            expiresAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const members = rows.map((m) => ({
      id: m.id,
      email: m.email,
      name: m.name,
      tier: String(m.tier ?? "public"),
      createdAt: m.createdAt.toISOString(),
      activeKeys: m.keys.map((k) => ({
        expiresAt: k.expiresAt ? k.expiresAt.toISOString() : null,
        createdAt: k.createdAt.toISOString(),
      })),
    }));

    return res.status(200).json({
      ok: true,
      members,
      total: members.length,
    });
  } catch (error) {
    console.error("[ADMIN_MEMBERS_LIST_ERROR]", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to load member directory",
      code: "LIST_FAILED",
    });
  }
}
