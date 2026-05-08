/* pages/api/diagnostics/directional-integrity.ts */

import type { NextApiRequest, NextApiResponse } from "next";
import { handleDiagnosticSubmit } from "@/lib/diagnostics/api-submit";
import { enqueueJob } from "@/lib/jobs/queue-v2";
import { increment } from "@/lib/observability/metrics";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Wrap the original handler to capture the result
  let diagnosticRef: string | null = null;

  // Override the response to capture the diagnosticRef before sending
  const originalJson = res.json;
  res.json = function (body) {
    if (body?.ok && body?.diagnosticRef) {
      diagnosticRef = body.diagnosticRef;
    }
    return originalJson.call(this, body);
  };

  await handleDiagnosticSubmit(req, res, {
    diagnosticType: "directional-integrity",
    extractAnswers: (body) => {
      const values = Array.isArray(body?.answers) ? body.answers : [];
      return values;
    },
    buildPayload: (body, req) => {
      const base: Record<string, unknown> = {
        sections: body?.sections || null,
        answers: Array.isArray(body?.answers) ? body.answers : [],
        notes: typeof body?.notes === "string" ? body.notes : null,
        submittedAt: new Date().toISOString(),
        userAgent: req.headers["user-agent"] || null,
      };

      // Attach financial exposure snapshot when provided
      if (body.financialExposure !== undefined || body.exposureBand !== undefined) {
        base.financialExposure = {
          estimatedFinancialExposure: body.financialExposure ?? null,
          exposureBand: body.exposureBand ?? null,
          exposureBasis: body.exposureBasis ?? null,
          calculationVersion: "1.0.0",
          generatedAt: new Date().toISOString(),
          sourceSurface: "fast_diagnostic",
        };
      }

      return base;
    },
  });

  // After response is sent, enqueue the regeneration job
  if (diagnosticRef) {
    try {
      await enqueueJob({
        type: "diagnostic.report.regenerate",
        payload: { diagnosticRef },
        maxAttempts: 5,
        nextRunAt: Date.now(),
      });

      increment("diagnostics.submitted", 1, { type: "directional-integrity" });
    } catch (error) {
      console.error("[DIAGNOSTIC_JOB_ENQUEUE_ERROR]", error);
      // Don't fail the request - diagnostic is already saved
    }
  }
}