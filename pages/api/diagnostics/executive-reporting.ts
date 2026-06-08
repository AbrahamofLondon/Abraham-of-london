/* pages/api/diagnostics/executive-reporting.ts */

import type { NextApiRequest, NextApiResponse } from "next";
import { handleDiagnosticSubmit } from "@/lib/diagnostics/api-submit";
import { writeExecutiveReportFact } from "@/lib/benchmarks/benchmark-fact-writers";

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
    afterCreate: async ({ score, severity, reference, userEmail }) => {
      const { createMaterialOutputVerificationRecord } = await import(
        "@/lib/product/signal-verification-record"
      );
      await createMaterialOutputVerificationRecord({
        source: "executive-reporting",
        sourceId: reference,
        userEmail,
        conditionName: "Executive Reporting Assessment",
        severity,
        score,
        operatorReviewRequired: severity === "critical" || severity === "high",
        dueDays: 14,
      });

      // Write anonymised BenchmarkFact — fire and forget, never blocks response
      writeExecutiveReportFact({
        reference,
        score,
        severity,
      }).catch(() => {});
    },
  });
}