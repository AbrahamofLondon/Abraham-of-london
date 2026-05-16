import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { checkActionEntitlement } from "@/lib/product/action-entitlement";
import { createCaseShare, listCaseShares } from "@/lib/product/case-sharing";
import type { CaseShareRecord } from "@/lib/product/case-sharing-contract";
import { prisma } from "@/lib/prisma.server";

const createSchema = z.object({
  caseId: z.string().min(1).max(200),
  role: z.enum(["VIEWER", "AUDITOR"]),
  recipientEmail: z.string().email().optional().nullable(),
  expiresInDays: z.number().int().min(1).max(30).optional(),
  allowExport: z.boolean().optional(),
});

type Response =
  | {
      ok: true;
      shareId: string;
      shareUrl: string;
      expiresAt: string;
      role: "VIEWER" | "AUDITOR";
    }
  | {
      ok: true;
      shares: CaseShareRecord[];
    }
  | {
      ok: false;
      error: string;
      code?: string;
      actionType?: "share_case";
    };

function baseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Response>) {
  const identity = await resolveIdentity(req);
  if (!identity.authenticated || !identity.email) {
    return res.status(401).json({ ok: false, error: "Authentication required" });
  }

  if (req.method === "GET") {
    const caseId = typeof req.query.caseId === "string" ? req.query.caseId : "";
    if (!caseId) {
      return res.status(400).json({ ok: false, error: "caseId is required" });
    }
    const result = await listCaseShares({
      caseId,
      requesterEmail: identity.email,
    });
    if (!result.ok) {
      return res.status(403).json({ ok: false, error: "Case access required" });
    }
    return res.status(200).json({ ok: true, shares: result.shares });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const entitlement = await checkActionEntitlement(identity.email, "case_sharing");
  if (!entitlement.allowed) {
    return res.status(403).json({
      ok: false,
      error: entitlement.message,
      code: "PROFESSIONAL_REQUIRED",
      actionType: "share_case",
    });
  }

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "Invalid request body" });
  }

  const result = await createCaseShare({
    caseId: parsed.data.caseId,
    requesterEmail: identity.email,
    role: parsed.data.role,
    recipientEmail: parsed.data.recipientEmail,
    expiresInDays: parsed.data.expiresInDays,
    allowExport: parsed.data.allowExport,
  });

  if (!result.ok) {
    return res.status(result.reason === "CASE_NOT_FOUND" ? 404 : 403).json({
      ok: false,
      error: result.reason === "CASE_NOT_FOUND" ? "Case not found" : "Case access required",
    });
  }

  await prisma.auditEvent.create({
    data: {
      actorType: "USER",
      actorId: identity.subjectId ?? identity.email,
      objectType: "CASE_SHARE",
      objectId: result.share.id,
      actionType: "CASE_SHARE_CREATED",
      summary: "Client-safe case share link created.",
      metadata: {
        caseId: result.share.caseId,
        role: result.share.role,
        allowExport: result.share.allowExport,
        hasRecipientEmail: Boolean(result.share.recipientEmail),
        expiresAt: result.share.expiresAt,
      },
    },
  });

  return res.status(200).json({
    ok: true,
    shareId: result.share.id,
    shareUrl: `${baseUrl()}/case/shared/${encodeURIComponent(result.token)}`,
    expiresAt: result.share.expiresAt,
    role: result.share.role,
  });
}
