/* pages/api/diagnostics/executive-reporting.ts */

import type { NextApiRequest, NextApiResponse } from "next";
import { handleDiagnosticSubmit } from "@/lib/diagnostics/api-submit";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return handleDiagnosticSubmit(req, res, {
    diagnosticType: "executive-reporting",
    extractAnswers: (body) => {
      const answers = Array.isArray(body?.answers) ? body.answers : [];
      return answers;
    },
    buildPayload: (body, req) => ({
      answers: Array.isArray(body?.answers) ? body.answers : [],
      buyerType: typeof body?.buyerType === "string" ? body.buyerType : null,
      organisation: typeof body?.organisation === "string" ? body.organisation : null,
      urgency: typeof body?.urgency === "string" ? body.urgency : null,
      narrativeSummary: typeof body?.narrativeSummary === "string" ? body.narrativeSummary : null,
      notes: typeof body?.notes === "string" ? body.notes : null,
      submittedAt: new Date().toISOString(),
      userAgent: req.headers["user-agent"] || null,
    }),
  });
}