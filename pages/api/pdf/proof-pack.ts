import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdminApi } from "@/lib/access/server";
import { generateProofPackPdfBuffer } from "@/lib/pdf/runtime-verification";
import { prisma } from "@/lib/prisma.server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const resolved = await requireAdminApi(req, res);
  if (!resolved) return;

  try {
    const { email, userId } = req.body as {
      email?: string;
      userId?: string;
    };

    if (!email) {
      return res.status(400).json({ ok: false, error: "email is required" });
    }

    const generated = await generateProofPackPdfBuffer({ email, userId });

    // Log to audit
    await prisma.auditEvent.create({
      data: {
        actorType: "ADMIN",
        actorId: resolved.session?.user?.id ?? null,
        objectType: "PDF_EXPORT",
        objectId: `proof-pack-${email}`,
        actionType: "CREATED",
        summary: `Proof pack PDF exported for ${email}`,
        metadata: {
          email,
          userId: userId ?? null,
          generatedAt: generated.generatedAt,
        },
      },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="proof-pack-${email.replace(/[^a-zA-Z0-9]/g, "-")}.pdf"`,
    );
    res.setHeader("Cache-Control", "no-store");
    res.send(generated.pdfBuffer);
  } catch (error) {
    console.error("[PROOF_PACK_PDF_ERROR]", error);
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Failed to generate PDF",
    });
  }
}
