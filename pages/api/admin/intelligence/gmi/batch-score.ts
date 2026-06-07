/* pages/api/admin/intelligence/gmi/batch-score.ts — P0: Batch Call Scoring API */
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "node:crypto";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";

type Response = {
  ok: boolean;
  savedCount?: number;
  errors?: string[];
  error?: string;
};

type CallUpdate = {
  callId: string;
  score: number | null;
  status: string;
  evidenceSummary: string;
  justification: string;
  carryForwardJustification: string | null;
  nextReviewDue: string | null;
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

  const { editionId, updates, mode } = req.body || {};
  if (!editionId || !Array.isArray(updates)) {
    return res.status(400).json({ ok: false, error: "EDITION_ID_AND_UPDATES_REQUIRED" });
  }

  const validationErrors: string[] = [];
  const validUpdates: CallUpdate[] = [];

  for (const update of updates) {
    const { callId, score, evidenceSummary, carryForwardJustification, nextReviewDue } = update;

    if (score === null || score === undefined) {
      validationErrors.push(`${callId}: Score required`);
      if (mode !== "valid") break;
      continue;
    }

    if (score === 2) {
      if (!carryForwardJustification?.trim()) {
        validationErrors.push(`${callId}: Score 2 requires carry-forward justification`);
        if (mode !== "valid") break;
        continue;
      }
      if (!nextReviewDue) {
        validationErrors.push(`${callId}: Score 2 requires next review date`);
        if (mode !== "valid") break;
        continue;
      }
    } else {
      if (!evidenceSummary?.trim()) {
        validationErrors.push(`${callId}: Score ${score} requires evidence summary`);
        if (mode !== "valid") break;
        continue;
      }
    }

    validUpdates.push(update);
  }

  if (mode !== "valid" && validationErrors.length > 0) {
    return res.status(400).json({ ok: false, error: "VALIDATION_FAILED", errors: validationErrors });
  }

  if (validUpdates.length === 0) {
    return res.status(400).json({ ok: false, error: "NO_VALID_UPDATES" });
  }

  try {
    const { prisma } = await import("@/lib/prisma");
    let savedCount = 0;

    for (const update of validUpdates) {
      const previousRows = await prisma.$queryRaw<Array<{ id: string; currentStatus: string | null; currentScore: number | null }>>`
        SELECT "id", "current_status" AS "currentStatus", "current_score" AS "currentScore"
        FROM "gmi_call_ledger_entries"
        WHERE "call_id" = ${update.callId}
        LIMIT 1
      `;
      const previous = previousRows[0];
      if (!previous) {
        validationErrors.push(`${update.callId}: Persisted call ledger row not found`);
        if (mode !== "valid") break;
        continue;
      }

      await prisma.$executeRaw`
        UPDATE "gmi_call_ledger_entries"
        SET
          "current_score" = ${update.score},
          "current_status" = ${update.status || "REVIEWED"},
          "evidence_summary" = ${update.evidenceSummary || ""},
          "justification" = ${update.justification || ""},
          "carry_forward_justification" = ${update.carryForwardJustification},
          "next_review_due" = ${update.nextReviewDue ? new Date(update.nextReviewDue) : null},
          "last_reviewed_at" = NOW(),
          "updated_at" = NOW()
        WHERE "call_id" = ${update.callId}
      `;

      await prisma.$executeRaw`
        INSERT INTO "gmi_call_ledger_status_history" (
          "id",
          "ledger_entry_id",
          "call_id",
          "previous_status",
          "new_status",
          "previous_score",
          "new_score",
          "evidence_summary",
          "evidence_source_rows_json",
          "justification",
          "actor",
          "request_id"
        )
        VALUES (
          ${`gmih_${crypto.randomUUID().replace(/-/g, "")}`},
          ${previous.id},
          ${update.callId},
          ${previous.currentStatus},
          ${update.status || "REVIEWED"},
          ${previous.currentScore},
          ${update.score},
          ${update.evidenceSummary || ""},
          ${JSON.stringify([])}::jsonb,
          ${`Scored ${update.score}: ${update.justification || update.evidenceSummary || ""}`},
          ${session.user.email},
          ${req.headers["x-request-id"] ? String(req.headers["x-request-id"]) : null}
        )
      `;

      savedCount++;
    }

    // Emit governance event
    console.log("[GMI_BATCH_SCORE]", {
      action: "GMI_CALL_REVIEWED",
      editionId,
      actor: session.user.email,
      savedCount,
      callIds: validUpdates.map((u) => u.callId),
    });

    return res.status(200).json({
      ok: true,
      savedCount,
      errors: validationErrors.length > 0 ? validationErrors : undefined,
    });
  } catch (error) {
    console.error("[gmi-batch-score]", error);
    return res.status(500).json({ ok: false, error: "BATCH_SCORE_FAILED" });
  }
}
