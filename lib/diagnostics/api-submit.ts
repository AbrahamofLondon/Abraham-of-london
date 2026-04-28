/* lib/diagnostics/api-submit.ts */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { NextApiRequest, NextApiResponse } from "next";
import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext } from "@/lib/server/auth/tokenStore.postgres";
import { createDiagnosticRecord } from "@/lib/diagnostics/store";
import { percentageScore, severityFromScore, verdictFromScore } from "@/lib/diagnostics/scoring";
import { pushToCRM } from "@/lib/crm/pushToCRM";

export type DiagnosticSubmitConfig = {
  diagnosticType: string;
  extractAnswers: (body: any) => Array<number | boolean | null | undefined>;
  buildPayload?: (body: any, req: NextApiRequest) => Record<string, any>;
};

export async function handleDiagnosticSubmit(
  req: NextApiRequest,
  res: NextApiResponse,
  config: DiagnosticSubmitConfig,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, reason: "METHOD_NOT_ALLOWED" });
  }

  try {
    const sessionId = readAccessCookie(req);
    const ctx = sessionId ? await getSessionContext(sessionId) : null;

    const body = req.body || {};
    const answers = config.extractAnswers(body);
    const score = percentageScore(answers);
    const severity = severityFromScore(score);
    const verdict = verdictFromScore(score);

    const payload = config.buildPayload
      ? config.buildPayload(body, req)
      : {
          submittedAt: new Date().toISOString(),
          answers,
        };

    const record = await createDiagnosticRecord({
      diagnosticType: config.diagnosticType,
      score,
      severity,
      verdict,
      userId: ctx?.ok && ctx?.valid ? ctx.memberId || null : null,
      userEmail: ctx?.ok && ctx?.valid ? ((ctx as any).email || null) : null,
      payload,
    });

    await pushToCRM({
      kind: "diagnostic_submission",
      reference: record.reference,
      diagnosticType: record.diagnosticType,
      score: record.score,
      severity: record.severity,
      verdict: record.verdict,
      userId: record.userId,
      userEmail: record.userEmail,
      createdAt: record.createdAt,
      payload: record.payload,
    });

    return res.status(200).json({
      ok: true,
      diagnosticId: record.id,
      diagnosticRef: record.reference,
      reportReady: true,
    });
  } catch (error) {
    console.error("[DIAGNOSTIC_SUBMIT_ERROR]", error);
    return res.status(500).json({ ok: false, reason: "INTERNAL_ERROR" });
  }
}