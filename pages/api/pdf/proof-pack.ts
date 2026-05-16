import type { NextApiRequest, NextApiResponse } from "next";
import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { generateProofPackPdfBuffer } from "@/lib/pdf/runtime-verification";
import { prisma } from "@/lib/prisma.server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const identity = await resolveIdentity(req);
  if (!identity.authenticated || !identity.email) {
    return res.status(401).json({ ok: false, error: "Authentication required" });
  }

  // Professional entitlement check for evidence export
  const { checkActionEntitlement } = await import("@/lib/product/action-entitlement");
  const entitlement = await checkActionEntitlement(
    identity.email,
    "evidence_export",
  );
  if (!entitlement.allowed) {
    return res.status(403).json({ ok: false, error: entitlement.message, code: "PROFESSIONAL_REQUIRED" });
  }

  try {
    const { email, userId } = req.body as {
      email?: string;
      userId?: string;
    };

    if (!email) {
      return res.status(400).json({ ok: false, error: "email is required" });
    }
    if (email.toLowerCase() !== identity.email.toLowerCase()) {
      return res.status(403).json({ ok: false, error: "You can only export your own proof pack." });
    }

    const generated = await generateProofPackPdfBuffer({ email, userId });

    // Log to audit
    await prisma.auditEvent.create({
      data: {
        actorType: "USER",
        actorId: identity.subjectId ?? identity.email,
        objectType: "PDF_EXPORT",
        objectId: `proof-pack-${email}`,
        actionType: "CREATED",
        summary: `Proof pack PDF exported for ${email}`,
        metadata: {
          email: identity.email,
          userId: userId ?? identity.subjectId ?? null,
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
