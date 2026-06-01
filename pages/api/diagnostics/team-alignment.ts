/* pages/api/diagnostics/team-alignment.ts */

import type { NextApiRequest, NextApiResponse } from "next";
import { handleDiagnosticSubmit } from "@/lib/diagnostics/api-submit";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return handleDiagnosticSubmit(req, res, {
    diagnosticType: "team-alignment",
    extractAnswers: (body) => {
      const answers = Array.isArray(body?.answers) ? body.answers : [];
      return answers;
    },
    buildPayload: (body, req) => ({
      answers: Array.isArray(body?.answers) ? body.answers : [],
      teamName: typeof body?.teamName === "string" ? body.teamName : null,
      department: typeof body?.department === "string" ? body.department : null,
      teamSize: typeof body?.teamSize === "number" ? body.teamSize : null,
      notes: typeof body?.notes === "string" ? body.notes : null,
      submittedAt: new Date().toISOString(),
      userAgent: req.headers["user-agent"] || null,
    }),
    afterCreate: async (data) => {
      try {
        const { runDecisionIntelligence } = await import(
          "@/lib/intelligence/decision-intelligence-orchestrator"
        );
        const caseId = `team-${data.reference}`;
        await runDecisionIntelligence({
          surface: "team_assessment",
          rawUserInput: `Team Assessment completed: ${data.severity} (score: ${data.score})`,
          userAnswers: { score: data.score, severity: data.severity },
          diagnosticResult: { score: data.score, severity: data.severity, reference: data.reference },
          persistJourney: true,
          caseId,
          email: data.userEmail ?? undefined,
        });
      } catch {
        // Non-blocking — journey persistence must not block the diagnostic result
      }
    },
  });
}
