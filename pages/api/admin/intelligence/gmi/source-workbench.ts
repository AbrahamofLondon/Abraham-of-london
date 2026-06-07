/* pages/api/admin/intelligence/gmi/source-workbench.ts — P1: Source Appendix Workbench API */
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";

type Response = {
  ok: boolean;
  savedCount?: number;
  errors?: string[];
  error?: string;
};

type SourceUpdate = {
  sourceRowId: string;
  status: string;
  methodNote: string | null;
  adminJustification: string | null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Response>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await getServerSession(req, res, authOptions);
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";
  if (!session?.user?.email || session.user.email.toLowerCase() !== adminEmail.toLowerCase()) {
    return res.status(403).json({ ok: false, error: "ADMIN_REQUIRED" });
  }

  const { editionId, updates } = req.body || {};
  if (!editionId || !Array.isArray(updates)) {
    return res.status(400).json({ ok: false, error: "EDITION_ID_AND_UPDATES_REQUIRED" });
  }

  const validationErrors: string[] = [];
  const validUpdates: SourceUpdate[] = [];
  const { prisma } = await import("@/lib/prisma");

  for (const update of updates) {
    const { sourceRowId, status, methodNote, adminJustification } = update;
    const rows = await prisma.$queryRaw<Array<{ evidenceClass: string; existingMethodNote: string | null }>>`
      SELECT "evidence_class" AS "evidenceClass", "method_note" AS "existingMethodNote"
      FROM "gmi_source_appendix_rows"
      WHERE "id" = ${sourceRowId}
      LIMIT 1
    `;
    const row = rows[0];
    if (!row) {
      validationErrors.push(`${sourceRowId}: Persisted source row not found`);
      continue;
    }

    const methodNoteValue = methodNote?.trim() || row.existingMethodNote || "";
    if (
      status === "VERIFIED" &&
      (row.evidenceClass === "MODELLED_ESTIMATE" || row.evidenceClass === "SCENARIO_ASSUMPTION") &&
      !methodNoteValue
    ) {
      validationErrors.push(`${sourceRowId}: ${row.evidenceClass} requires method note`);
      continue;
    }

    // Demotion/removal requires justification
    if ((status === "REJECTED" || status === "CARRIED_FORWARD") && !adminJustification?.trim()) {
      validationErrors.push(`${sourceRowId}: ${status} requires admin justification`);
      continue;
    }

    validUpdates.push(update);
  }

  try {
    for (const update of validUpdates) {
      await prisma.$executeRaw`
        UPDATE "gmi_source_appendix_rows"
        SET
          "status" = ${update.status},
          "method_note" = COALESCE(${update.methodNote || null}, "method_note"),
          "admin_justification" = COALESCE(${update.adminJustification || null}, "admin_justification"),
          "updated_at" = NOW()
        WHERE "id" = ${update.sourceRowId}
      `;
    }

    console.log("[GMI_SOURCE_WORKBENCH]", {
      action: "GMI_SOURCE_ROW_UPDATED",
      editionId,
      actor: session.user.email,
      savedCount: validUpdates.length,
      errors: validationErrors,
    });

    return res.status(200).json({
      ok: true,
      savedCount: validUpdates.length,
      errors: validationErrors.length > 0 ? validationErrors : undefined,
    });
  } catch (error) {
    console.error("[gmi-source-workbench]", error);
    return res.status(500).json({ ok: false, error: "SOURCE_UPDATE_FAILED" });
  }
}
