/* pages/api/diagnostics/enterprise.ts */

import type { NextApiRequest, NextApiResponse } from "next";
import { handleDiagnosticSubmit } from "@/lib/diagnostics/api-submit";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return handleDiagnosticSubmit(req, res, {
    diagnosticType: "enterprise",
    extractAnswers: (body) => {
      const answers = Array.isArray(body?.answers) ? body.answers : [];
      return answers;
    },
    buildPayload: (body, req) => ({
      answers: Array.isArray(body?.answers) ? body.answers : [],
      companyName: typeof body?.companyName === "string" ? body.companyName : null,
      sector: typeof body?.sector === "string" ? body.sector : null,
      headcount: typeof body?.headcount === "number" ? body.headcount : null,
      boardInvolved: body?.boardInvolved === true,
      notes: typeof body?.notes === "string" ? body.notes : null,
      submittedAt: new Date().toISOString(),
      userAgent: req.headers["user-agent"] || null,
    }),
  });
}