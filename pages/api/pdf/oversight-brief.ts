import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/access/server";
import { generateOversightBriefPdfBuffer } from "@/lib/pdf/runtime-verification";
import { prisma } from "@/lib/prisma.server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const resolved = await requireAdminApi(req, res);
  if (!resolved) return;

  try {
    const { email, userId, organisationId } = req.body as {
      email?: string;
      userId?: string;
      organisationId?: string;
    };

    if (!email) {
      return res.status(400).json({ ok: false, error: "email is required" });
    }

    const generated = await generateOversightBriefPdfBuffer({
      email,
      userId,
      organisationId,
    });

    // Log to audit
    await prisma.auditEvent.create({
      data: {
        actorType: "ADMIN",
        actorId: resolved.session?.user?.id ?? null,
        objectType: "PDF_EXPORT",
        objectId: generated.briefId,
        actionType: "CREATED",
        summary: `Oversight brief PDF exported for ${email}`,
        metadata: {
          email,
          userId: userId ?? null,
          organisationId: organisationId ?? null,
          suppressionCount: generated.clientSafeBrief.suppressions.length,
          warningCount: generated.clientSafeBrief.warnings.length,
        },
      },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="oversight-brief-${generated.briefId}.pdf"`,
    );
    res.setHeader("Cache-Control", "no-store");
    res.send(generated.pdfBuffer);
  } catch (error) {
    console.error("[OVERSIGHT_BRIEF_PDF_ERROR]", error);
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Failed to generate PDF",
    });
  }
}
