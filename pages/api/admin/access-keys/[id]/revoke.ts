import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/access/require-admin";
import { prisma } from "@/lib/prisma.server";
import { logAccessAudit } from "@/lib/access/audit";

type ResponseBody = { ok: true } | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const id = req.query.id;
  if (typeof id !== "string") {
    return res.status(400).json({ ok: false, error: "Invalid key ID" });
  }

  const { reason } = req.body ?? {};

  try {
    const key = await prisma.accessKey.findUnique({ where: { id } });

    if (!key) {
      return res.status(404).json({ ok: false, error: "Access key not found" });
    }

    if (key.status === "REVOKED") {
      return res
        .status(400)
        .json({ ok: false, error: "Access key is already revoked" });
    }

    await prisma.accessKey.update({
      where: { id },
      data: {
        status: "REVOKED",
        revokedAt: new Date(),
        revokedBy: admin.email ?? admin.userId,
        reason: typeof reason === "string" ? reason : null,
      },
    });

    await logAccessAudit({
      actorType: "ADMIN",
      actorUserId: admin.userId,
      actorEmail: admin.email,
      action: "key.revoked",
      targetType: "access_key",
      targetKey: key.codePreview,
      success: true,
      metadata: { reason: reason ?? null },
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to revoke access key";
    return res.status(500).json({ ok: false, error: message });
  }
}
