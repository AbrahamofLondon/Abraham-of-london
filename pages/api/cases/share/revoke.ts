import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { revokeCaseShare } from "@/lib/product/case-sharing";
import { prisma } from "@/lib/prisma.server";

const schema = z.object({
  shareId: z.string().min(1).max(200),
});

type Response =
  | { ok: true }
  | { ok: false; error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<Response>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const identity = await resolveIdentity(req);
  if (!identity.authenticated || !identity.email) {
    return res.status(401).json({ ok: false, error: "Authentication required" });
  }

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "Invalid request body" });
  }

  const result = await revokeCaseShare({
    shareId: parsed.data.shareId,
    requesterEmail: identity.email,
  });
  if (!result.ok) {
    return res.status(result.reason === "SHARE_NOT_FOUND" ? 404 : 403).json({
      ok: false,
      error: result.reason === "SHARE_NOT_FOUND" ? "Share link not found" : "Case access required",
    });
  }

  await prisma.auditEvent.create({
    data: {
      actorType: "USER",
      actorId: identity.subjectId ?? identity.email,
      objectType: "CASE_SHARE",
      objectId: result.share.id,
      actionType: "CASE_SHARE_REVOKED",
      summary: "Client-safe case share link revoked.",
      metadata: {
        caseId: result.share.caseId,
        role: result.share.role,
      },
    },
  });

  return res.status(200).json({ ok: true });
}
