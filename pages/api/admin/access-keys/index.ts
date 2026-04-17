import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/access/require-admin";
import { prisma } from "@/lib/prisma.server";

type ResponseBody =
  | { ok: true; keys: Record<string, unknown>[] }
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

  try {
    const keys = await prisma.accessKey.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { usesLog: true },
        },
      },
    });

    const result = keys.map((key) => ({
      id: key.id,
      codePreview: key.codePreview,
      label: key.label,
      status: key.status,
      grants: key.grants,
      metadata: key.metadata,
      maxUses: key.maxUses,
      uses: key.uses,
      usesLogCount: key._count.usesLog,
      startsAt: key.startsAt,
      expiresAt: key.expiresAt,
      revokedAt: key.revokedAt,
      issuedBy: key.issuedBy,
      revokedBy: key.revokedBy,
      reason: key.reason,
      createdAt: key.createdAt,
      updatedAt: key.updatedAt,
    }));

    return res.status(200).json({ ok: true, keys: result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list access keys";
    return res.status(500).json({ ok: false, error: message });
  }
}
