/* pages/api/admin/reports/[id]/deliver.ts */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma.server";
import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext, tierAtLeast } from "@/lib/server/auth/tokenStore.postgres";
import { renderReportPdfToPublic } from "@/lib/reports/pdf";

const MODEL_CANDIDATES = [
  "reportRequest",
  "diagnosticReportRequest",
  "clientReportRequest",
  "reportOrder",
] as const;

async function resolveModel() {
  const p = prisma as any;
  for (const name of MODEL_CANDIDATES) {
    if (p?.[name]) return p[name];
  }
  throw new Error("No report model found.");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });
  }

  try {
    const sessionId = readAccessCookie(req);
    if (!sessionId) return res.status(401).json({ ok: false, reason: "AUTH_REQUIRED" });

    const ctx = await getSessionContext(sessionId);
    if (!ctx.ok || !ctx.valid || !tierAtLeast(ctx.tier, "sovereign")) {
      return res.status(403).json({ ok: false, reason: "INSUFFICIENT_CLEARANCE" });
    }

    const id = typeof req.query.id === "string" ? req.query.id : "";
    if (!id) return res.status(400).json({ ok: false, reason: "ID_MISSING" });

    const model = await resolveModel();
    const current = await model.findUnique({ where: { id } });
    if (!current) return res.status(404).json({ ok: false, reason: "NOT_FOUND" });

    const pdfUrl = await renderReportPdfToPublic(current);

    const updated = await model.update({
      where: { id },
      data: {
        reportUrl: pdfUrl,
        status: "delivered",
        deliveredAt: new Date().toISOString(),
      },
    });

    return res.status(200).json({
      ok: true,
      item: updated,
      reportUrl: pdfUrl,
    });
  } catch (error) {
    console.error("[ADMIN_REPORT_DELIVER_ERROR]", error);
    return res.status(500).json({ ok: false, reason: "INTERNAL_ERROR" });
  }
}