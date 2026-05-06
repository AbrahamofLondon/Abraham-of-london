// pages/api/admin/members/keys.ts — Admin key roster
//
// GET returns the most recent 100 InnerCircleKey rows with member
// email + tier for dashboard display.

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";

type KeyRow = {
  id: string;
  memberId: string;
  memberEmail: string | null;
  memberTier: string;
  keyHash: string;
  keySuffix: string | null;
  status: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
};

type ApiResponse =
  | { ok: true; keys: KeyRow[] }
  | { ok: false; error: string; code?: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const session = await requireAdminServer(req, res, { routeKey: "admin-members-keys" });
  if (!session) return;

  try {
    const rows = await prisma.innerCircleKey.findMany({
      include: {
        member: {
          select: {
            email: true,
            tier: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const keys: KeyRow[] = rows.map((k) => ({
      id: k.id,
      memberId: k.memberId,
      memberEmail: k.member?.email ?? null,
      memberTier: String(k.member?.tier ?? "public"),
      keyHash: k.keyHash,
      keySuffix: k.keySuffix ?? null,
      status: String(k.status),
      createdAt: k.createdAt.toISOString(),
      expiresAt: k.expiresAt.toISOString(),
      revokedAt: k.revokedAt ? k.revokedAt.toISOString() : null,
    }));

    return res.status(200).json({ ok: true, keys });
  } catch (error) {
    console.error("[ADMIN_MEMBERS_KEYS_ERROR]", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to load key roster",
      code: "LIST_FAILED",
    });
  }
}
