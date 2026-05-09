import type { NextApiRequest, NextApiResponse } from "next";
import type { ReactElement } from "react";
import type { DocumentProps } from "@react-pdf/renderer";
import { requireAdminApi } from "@/lib/access/server";
import { composeOversightBrief } from "@/lib/product/oversight-brief-composer";
import { buildClientSafeOversightBrief } from "@/lib/product/client-safe-oversight-brief";
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

    // Compose oversight brief
    const composed = await composeOversightBrief({
      email,
      userId,
      organisationId,
    });

    if (!composed.brief) {
      return res.status(404).json({
        ok: false,
        error: "Could not compose oversight brief",
        warnings: composed.warnings,
      });
    }

    // Build client-safe version with full visibility for admin export
    const clientSafeBrief = buildClientSafeOversightBrief({
      brief: composed.brief,
      access: {
        allowed: true,
        role: "OWNER",
        scopes: ["CONTROL_ROOM_VIEW"],
        reason: "Admin PDF export",
        privacyBoundary: {
          canViewAggregates: true,
          canViewRawResponses: false,
          canViewNamedRespondents: false,
          smallSampleSuppressionApplies: true,
        },
      },
      audience: "CLIENT_SPONSOR",
    });

    const generatedAt = new Date().toISOString();

    // Dynamic import to keep @react-pdf/renderer out of module graph at load time
    const { ensureFontsRegistered } = await import("@/lib/pdf/ensure-fonts");
    await ensureFontsRegistered();

    const { renderToBuffer } = await import("@react-pdf/renderer");
    const { OversightBriefPdfDocument } = await import("@/lib/pdf/oversight-brief-pdf");

    const documentElement = OversightBriefPdfDocument({ clientSafeBrief, generatedAt });
    const pdfBuffer = await renderToBuffer(documentElement as ReactElement<DocumentProps>);

    // Log to audit
    await prisma.auditEvent.create({
      data: {
        actorType: "ADMIN",
        actorId: resolved.session?.user?.id ?? null,
        objectType: "PDF_EXPORT",
        objectId: composed.brief.briefId,
        actionType: "CREATED",
        summary: `Oversight brief PDF exported for ${email}`,
        metadata: {
          email,
          userId: userId ?? null,
          organisationId: organisationId ?? null,
          suppressionCount: clientSafeBrief.suppressions.length,
          warningCount: clientSafeBrief.warnings.length,
        },
      },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="oversight-brief-${composed.brief.briefId}.pdf"`,
    );
    res.setHeader("Cache-Control", "no-store");
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error("[OVERSIGHT_BRIEF_PDF_ERROR]", error);
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Failed to generate PDF",
    });
  }
}
