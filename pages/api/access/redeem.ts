import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma.server";
import { authOptions } from "@/lib/auth/options";
import { hashAccessKey, normalizeAccessKey } from "@/lib/access/access-key";
import { logAccessAudit } from "@/lib/access/audit";
import type { EntitlementGrant } from "@/lib/access/types";

type ResponseBody =
  | { ok: true; granted: EntitlementGrant[] }
  | { ok: false; error: string };

function isGrantArray(value: unknown): value is EntitlementGrant[] {
  return Array.isArray(value) && value.every((item) => {
    if (!item || typeof item !== "object") return false;
    const rec = item as Record<string, unknown>;
    return (
      (rec.type === "tier" || rec.type === "product" || rec.type === "artifact") &&
      typeof rec.key === "string" &&
      rec.key.length > 0
    );
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return res.status(401).json({ ok: false, error: "Authentication required" });
  }

  const rawCode = typeof req.body?.code === "string" ? req.body.code : "";
  const normalized = normalizeAccessKey(rawCode);

  if (!normalized) {
    return res.status(400).json({ ok: false, error: "Access key is required" });
  }

  const codeHash = hashAccessKey(normalized);
  const now = new Date();

  const key = await prisma.accessKey.findUnique({
    where: { codeHash },
  });

  if (!key) {
    await logAccessAudit({
      actorType: "USER",
      actorUserId: userId,
      action: "access_key.redeem",
      targetType: "access_key",
      targetKey: "unknown",
      success: false,
      reason: "not_found",
    });

    return res.status(404).json({ ok: false, error: "Invalid access key" });
  }

  if (key.status !== "ACTIVE") {
    return res.status(400).json({ ok: false, error: "Access key is not active" });
  }

  if (key.startsAt && key.startsAt > now) {
    return res.status(400).json({ ok: false, error: "Access key is not yet valid" });
  }

  if (key.expiresAt && key.expiresAt <= now) {
    return res.status(400).json({ ok: false, error: "Access key has expired" });
  }

  if (key.uses >= key.maxUses) {
    return res.status(400).json({ ok: false, error: "Access key has been depleted" });
  }

  const grants = key.grants;
  if (!isGrantArray(grants)) {
    return res.status(500).json({ ok: false, error: "Access key grants are invalid" });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.accessKeyUse.create({
        data: {
          accessKeyId: key.id,
          userId,
          ipAddress:
            (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() ??
            req.socket.remoteAddress ??
            null,
          userAgent: req.headers["user-agent"] ?? null,
        },
      });

      for (const grant of grants) {
        await tx.entitlement.create({
          data: {
            userId,
            type:
              grant.type === "tier"
                ? "TIER"
                : grant.type === "product"
                ? "PRODUCT"
                : "ARTIFACT",
            key: grant.key,
            status: "ACTIVE",
            issuedBy: key.issuedBy ?? "system",
            metadata: {
              source: "access_key",
              accessKeyId: key.id,
              accessKeyPreview: key.codePreview,
            },
          },
        });
      }

      const updatedUses = key.uses + 1;

      await tx.accessKey.update({
        where: { id: key.id },
        data: {
          uses: { increment: 1 },
          status: updatedUses >= key.maxUses ? "DEPLETED" : key.status,
        },
      });
    });

    await logAccessAudit({
      actorType: "USER",
      actorUserId: userId,
      action: "access_key.redeem",
      targetType: "access_key",
      targetKey: key.codePreview,
      success: true,
      metadata: { grants },
    });

    return res.status(200).json({ ok: true, granted: grants });
  } catch (error) {
    const message =
      error instanceof Error && /Unique constraint/i.test(error.message)
        ? "This key has already been redeemed by this account"
        : "Unable to redeem access key";

    await logAccessAudit({
      actorType: "USER",
      actorUserId: userId,
      action: "access_key.redeem",
      targetType: "access_key",
      targetKey: key.codePreview,
      success: false,
      reason: message,
    });

    return res.status(400).json({ ok: false, error: message });
  }
}