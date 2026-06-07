import crypto from "node:crypto";

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";

type Response = {
  ok: boolean;
  id?: string;
  error?: string;
  issues?: string[];
};

const STATUSES = new Set(["intact", "monitoring", "breached", "retired"]);

function id(): string {
  return `gmifalse_${crypto.randomUUID().replace(/-/g, "")}`;
}

function stringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value.trim()) return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

function validate(body: any): string[] {
  const issues: string[] = [];
  if (!body.editionId) issues.push("editionId required");
  if (!body.thesisId) issues.push("thesisId required");
  if (!body.thesisStatement?.trim()) issues.push("thesisStatement required");
  if (!body.falsificationCondition?.trim()) issues.push("falsificationCondition required");
  if (!body.observableIndicator?.trim()) issues.push("observableIndicator required");
  if (!body.thresholdValue?.trim()) issues.push("thresholdValue required");
  if (!body.nextReviewDue) issues.push("nextReviewDue required");
  if (!body.publicExplanation?.trim()) issues.push("publicExplanation required");
  if (body.currentStatus && !STATUSES.has(body.currentStatus)) issues.push("currentStatus invalid");
  return issues;
}

async function adminEmail(req: NextApiRequest, res: NextApiResponse): Promise<string | null> {
  const session = await getServerSession(req, res, authOptions);
  const expected = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";
  if (!session?.user?.email || session.user.email.toLowerCase() !== expected.toLowerCase()) return null;
  return session.user.email;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Response>) {
  if (req.method !== "POST" && req.method !== "PATCH") {
    res.setHeader("Allow", "POST, PATCH");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const actor = await adminEmail(req, res);
  if (!actor) return res.status(403).json({ ok: false, error: "ADMIN_REQUIRED" });

  const body = req.body || {};
  const issues = validate(body);
  if (issues.length > 0) return res.status(400).json({ ok: false, error: "VALIDATION_FAILED", issues });

  const ruleId = typeof body.id === "string" && body.id.trim() ? body.id.trim() : id();
  const evidenceSourceRows = stringArray(body.evidenceSourceRows);
  const status = body.currentStatus || "monitoring";

  try {
    if (req.method === "POST") {
      await prisma.$executeRaw`
        INSERT INTO "gmi_falsification_rules" (
          "id",
          "edition_id",
          "thesis_id",
          "thesis_statement",
          "falsification_condition",
          "observable_indicator",
          "threshold_type",
          "threshold_value",
          "current_status",
          "evidence_source_rows_json",
          "next_review_due",
          "last_reviewed_at",
          "public_explanation"
        )
        VALUES (
          ${ruleId},
          ${body.editionId},
          ${body.thesisId},
          ${body.thesisStatement},
          ${body.falsificationCondition},
          ${body.observableIndicator},
          ${body.thresholdType || "qualitative"},
          ${body.thresholdValue},
          ${status},
          ${JSON.stringify(evidenceSourceRows)}::jsonb,
          ${new Date(body.nextReviewDue)},
          NOW(),
          ${body.publicExplanation}
        )
      `;
    } else {
      const existing = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "gmi_falsification_rules"
        WHERE "id" = ${ruleId}
        LIMIT 1
      `;
      if (!existing[0]) return res.status(404).json({ ok: false, error: "RULE_NOT_FOUND" });

      await prisma.$executeRaw`
        UPDATE "gmi_falsification_rules"
        SET
          "edition_id" = ${body.editionId},
          "thesis_id" = ${body.thesisId},
          "thesis_statement" = ${body.thesisStatement},
          "falsification_condition" = ${body.falsificationCondition},
          "observable_indicator" = ${body.observableIndicator},
          "threshold_type" = ${body.thresholdType || "qualitative"},
          "threshold_value" = ${body.thresholdValue},
          "current_status" = ${status},
          "evidence_source_rows_json" = ${JSON.stringify(evidenceSourceRows)}::jsonb,
          "next_review_due" = ${new Date(body.nextReviewDue)},
          "last_reviewed_at" = NOW(),
          "public_explanation" = ${body.publicExplanation},
          "updated_at" = NOW()
        WHERE "id" = ${ruleId}
      `;
    }

    console.log("[GMI_FALSIFICATION_RULE_UPDATED]", {
      action: req.method === "POST" ? "GMI_FALSIFICATION_RULE_CREATED" : "GMI_FALSIFICATION_RULE_UPDATED",
      editionId: body.editionId,
      ruleId,
      actor,
    });

    return res.status(200).json({ ok: true, id: ruleId });
  } catch (error: any) {
    if (String(error?.message ?? "").includes("Unique constraint")) {
      return res.status(409).json({ ok: false, error: "RULE_ALREADY_EXISTS" });
    }
    console.error("[gmi-falsification-rule]", error);
    return res.status(500).json({ ok: false, error: "FALSIFICATION_WRITE_FAILED" });
  }
}
