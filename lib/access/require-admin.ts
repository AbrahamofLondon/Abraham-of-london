import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma.server";
import { getUserAccess } from "./get-user-access";

export async function requireAdmin(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<{ userId: string; email: string | null } | null> {
  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user?.id ?? null;

  if (!userId) {
    res.status(401).json({ ok: false, error: "Authentication required" });
    return null;
  }

  const access = await getUserAccess(prisma, userId);
  if (!access.permissions.isAdmin) {
    res.status(403).json({ ok: false, error: "Administrative access required" });
    return null;
  }

  return {
    userId,
    email: session?.user?.email ?? null,
  };
}