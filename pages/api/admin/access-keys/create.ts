import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/access/require-admin";
import { issueAccessKey } from "@/lib/access/admin-service";
import { logAccessAudit } from "@/lib/access/audit";
import type { EntitlementGrant } from "@/lib/access/types";

type ResponseBody =
  | { ok: true; id: string; code: string; preview: string }
  | { ok: false; error: string };

function isGrantArray(value: unknown): value is EntitlementGrant[] {
  return Array.isArray(value);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const { label, grants, maxUses, startsAt, expiresAt } = req.body ?? {};

  if (!isGrantArray(grants) || grants.length === 0) {
    return res.status(400).json({ ok: false, error: "At least one grant is required" });
  }

  const issued = await issueAccessKey({
    label: typeof label === "string" ? label : undefined,
    grants,
    maxUses: typeof maxUses === "number" ? maxUses : 1,
    startsAt: startsAt ? new Date(startsAt) : null,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    issuedBy: admin.email ?? admin.userId,
  });

  await logAccessAudit({
    actorType: "ADMIN",
    actorUserId: admin.userId,
    actorEmail: admin.email,
    action: "access_key.create",
    targetType: "access_key",
    targetKey: issued.preview,
    success: true,
    metadata: { label, grants, maxUses },
  });

  return res.status(200).json({
    ok: true,
    id: issued.id,
    code: issued.code,
    preview: issued.preview,
  });
}