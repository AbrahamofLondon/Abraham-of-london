import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma.server";
import { normalizeAccessKey, hashAccessKey } from "@/lib/access/access-key";
import { logAccessAudit } from "@/lib/access/audit";
import { auditGrantedEntitlements, grantEntitlements } from "@/lib/access/entitlement-service";
import { requireAuthenticatedApi } from "@/lib/access/server";
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
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const resolved = await requireAuthenticatedApi(req, res);
  if (!resolved) return;

  const userId = resolved.access.userId as string;
  const userEmail = resolved.session?.user?.email ?? resolved.access.email;
  const rawCode = typeof req.body?.code === "string" ? req.body.code : "";
  const normalized = normalizeAccessKey(rawCode);

  if (!normalized) {
    return res.status(400).json({ ok: false, error: "ACCESS_KEY_REQUIRED" });
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
      actorEmail: userEmail,
      action: "key.redeemed",
      targetType: "access_key",
      targetKey: normalized,
      success: false,
      reason: "not_found",
    });
    return res.status(404).json({ ok: false, error: "INVALID_KEY" });
  }

  if (key.status !== "ACTIVE") {
    return res.status(400).json({ ok: false, error: "KEY_NOT_ACTIVE" });
  }

  if (key.startsAt && key.startsAt > now) {
    return res.status(400).json({ ok: false, error: "KEY_NOT_ACTIVE" });
  }

  if (key.expiresAt && key.expiresAt <= now) {
    return res.status(400).json({ ok: false, error: "KEY_EXPIRED" });
  }

  if (key.uses >= key.maxUses) {
    return res.status(400).json({ ok: false, error: "KEY_EXHAUSTED" });
  }

  const grants = key.grants;
  if (!isGrantArray(grants)) {
    return res.status(500).json({ ok: false, error: "INVALID_KEY_FORMAT" });
  }

  try {
    const granted = await prisma.$transaction(async (tx) => {
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

      const grantedEntitlements = await grantEntitlements(tx, {
        userId,
        grants,
        issuedBy: key.issuedBy ?? `key:${key.id}`,
        startsAt: key.startsAt,
        expiresAt: key.expiresAt,
        metadata: {
          source: "access_key",
          accessKeyId: key.id,
          accessKeyPreview: key.codePreview,
        },
      });

      const updatedUses = key.uses + 1;
      await tx.accessKey.update({
        where: { id: key.id },
        data: {
          uses: { increment: 1 },
          status: updatedUses >= key.maxUses ? "DEPLETED" : key.status,
        },
      });

      return grantedEntitlements;
    });

    await auditGrantedEntitlements({
      actorType: "USER",
      actorUserId: userId,
      actorEmail: userEmail,
      targetUserId: userId,
      grants: granted,
      source: `key:${key.id}`,
    });

    await logAccessAudit({
      actorType: "USER",
      actorUserId: userId,
      actorEmail: userEmail,
      action: "key.redeemed",
      targetType: "access_key",
      targetKey: key.codePreview,
      success: true,
      metadata: { grants },
    });

    return res.status(200).json({ ok: true, granted });
  } catch (error) {
    const message =
      error instanceof Error && /Unique constraint/i.test(error.message)
        ? "ALREADY_REDEEMED"
        : "REDEEM_FAILED";

    await logAccessAudit({
      actorType: "USER",
      actorUserId: userId,
      actorEmail: userEmail,
      action: "key.redeemed",
      targetType: "access_key",
      targetKey: key.codePreview,
      success: false,
      reason: message,
    });

    return res.status(400).json({ ok: false, error: message });
  }
}
