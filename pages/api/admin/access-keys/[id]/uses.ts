import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/access/require-admin";
import { prisma } from "@/lib/prisma.server";

type ResponseBody =
  | { ok: true; uses: Record<string, unknown>[] }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const id = req.query.id;
  if (typeof id !== "string") {
    return res.status(400).json({ ok: false, error: "Invalid key ID" });
  }

  try {
    const key = await prisma.accessKey.findUnique({ where: { id } });

    if (!key) {
      return res.status(404).json({ ok: false, error: "Access key not found" });
    }

    const uses = await prisma.accessKeyUse.findMany({
      where: { accessKeyId: id },
      orderBy: { redeemedAt: "desc" },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    const result = uses.map((use) => ({
      id: use.id,
      userId: use.userId,
      email: use.user.email,
      name: use.user.name,
      redeemedAt: use.redeemedAt,
      ipAddress: use.ipAddress,
      userAgent: use.userAgent,
    }));

    return res.status(200).json({ ok: true, uses: result });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to list access key uses";
    return res.status(500).json({ ok: false, error: message });
  }
}
