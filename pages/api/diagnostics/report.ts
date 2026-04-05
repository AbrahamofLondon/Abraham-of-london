import type { NextApiRequest, NextApiResponse } from "next";
import * as React from "react";
import { pdf } from "@react-pdf/renderer";
import ReportDoc from "@/lib/diagnostics/pdf/ReportDoc";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });
  }

  try {
    const data = req.body;

    const instance = pdf(React.createElement(ReportDoc, { data }));
    const buffer = await instance.toBuffer();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="diagnostic-report.pdf"',
    );

    return res.send(buffer);
  } catch (error) {
    console.error("[DIAGNOSTIC_REPORT_PDF_ERROR]", error);
    return res.status(500).json({ ok: false, reason: "PDF_GENERATION_FAILED" });
  }
}