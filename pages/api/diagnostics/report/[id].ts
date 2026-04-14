import type { NextApiRequest, NextApiResponse } from "next";
import * as React from "react";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import {
  getDiagnosticRecordById,
  markDiagnosticReportGenerated,
} from "@/lib/diagnostics/store";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });
  }

  try {
    const id = typeof req.query.id === "string" ? req.query.id.trim() : "";

    if (!id) {
      return res.status(400).json({ ok: false, reason: "ID_REQUIRED" });
    }

    const session = await getServerSession(req, res, authOptions);
    const sessionEmail = session?.user?.email ?? null;

    const record = await getDiagnosticRecordById(id);

    if (!record) {
      return res.status(404).json({ ok: false, reason: "NOT_FOUND" });
    }

    if (record.userEmail && sessionEmail && record.userEmail !== sessionEmail) {
      return res.status(403).json({ ok: false, reason: "OWNERSHIP_MISMATCH" });
    }

    if (!["paid", "generated"].includes(String(record.reportStatus || ""))) {
      return res.status(402).json({ ok: false, reason: "REPORT_NOT_PAID" });
    }

    const { pdf } = await import("@react-pdf/renderer");
    const { default: DiagnosticReportDocument } = await import(
      "@/lib/diagnostics/pdf/DiagnosticReportDocument"
    );

    const instance = pdf(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      React.createElement(DiagnosticReportDocument, { record: record as any }) as any,
    );
    const buffer = await instance.toBuffer();

    await markDiagnosticReportGenerated(record.id);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${record.diagnosticType}-${record.id}.pdf"`,
    );

    return res.send(buffer);
  } catch (error) {
    console.error("[DIAGNOSTIC_REPORT_GENERATION_ERROR]", error);
    return res.status(500).json({ ok: false, reason: "SERVER_ERROR" });
  }
}