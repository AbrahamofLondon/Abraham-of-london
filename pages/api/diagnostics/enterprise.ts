/* pages/api/diagnostics/enterprise.ts */

import type { NextApiRequest, NextApiResponse } from "next";
import { handleDiagnosticSubmit } from "@/lib/diagnostics/api-submit";

/**
 * Structured Enterprise Diagnostic Answers extracted from the submission body.
 * Fields are populated from body.metadata when available.
 */
export type EnterpriseDiagnosticAnswers = {
  /** Per-domain scores keyed by block id (leadership, governance, execution, risk) */
  domainScores?: Record<string, number>
  /** Scenario stress test responses — populated when scenario questions exist */
  scenarioResponses?: Array<{
    scenarioId: string
    response: string
    severity?: string
  }>
  /** Escalation triggers identified in the assessment */
  escalationTriggers?: string[]
  /** Stakeholder conflict description */
  stakeholderConflict?: string
  /** Regulatory exposure description */
  regulatoryExposure?: string
  /** Financial exposure description */
  financialExposure?: string
  /** Client exposure description */
  clientExposure?: string
  /** Operational dependency description */
  operationalDependency?: string
  /** Decision deadline or time pressure */
  decisionDeadline?: string
  /** Overall enterprise score percentage */
  totalPct?: number
  /** Team alignment percentage from prior assessment */
  teamAlignmentPct?: number
  /** Decision clarity score */
  decisionClarity?: number
  /** Structural risk score */
  structuralRisk?: number
  /** Dominant failure domain */
  dominantFailure?: string
}

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
    afterCreate: async (data) => {
      try {
        const { runDecisionIntelligence } = await import(
          "@/lib/intelligence/decision-intelligence-orchestrator"
        );

        // Extract structured EnterpriseDiagnosticAnswers from the body metadata
        const metadata = (data.body?.metadata as Record<string, unknown>) ?? {};
        const authorityInput = metadata.authorityInput as Record<string, unknown> | undefined;
        const decisionSignal = metadata.decisionSignal as Record<string, unknown> | undefined;
        const sectionScores = (
          (data.body?.summary as Record<string, unknown>)?.sectionScores as Array<Record<string, unknown>> | undefined
        ) ?? [];

        // Build domain scores from section scores
        const domainScores: Record<string, number> = {};
        for (const section of sectionScores) {
          if (typeof section.sectionId === 'string' && typeof section.pct === 'number') {
            domainScores[section.sectionId] = section.pct;
          }
        }

        // Check if scenario responses exist in the body
        const scenarioResponses = Array.isArray(data.body?.scenarioResponses)
          ? (data.body.scenarioResponses as Array<{ scenarioId: string; response: string; severity?: string }>)
          : undefined;

        const entAnswers: EnterpriseDiagnosticAnswers = {
          domainScores: Object.keys(domainScores).length > 0 ? domainScores : undefined,
          scenarioResponses: scenarioResponses && scenarioResponses.length > 0 ? scenarioResponses : undefined,
          escalationTriggers: authorityInput?.escalationCondition
            ? [authorityInput.escalationCondition as string]
            : undefined,
          stakeholderConflict: metadata.stakeholderConflict as string | undefined,
          regulatoryExposure: metadata.regulatoryExposure as string | undefined,
          financialExposure: metadata.financialExposure as string | undefined,
          clientExposure: metadata.clientExposure as string | undefined,
          operationalDependency: metadata.operationalDependency as string | undefined,
          decisionDeadline: metadata.decisionDeadline as string | undefined,
          totalPct: typeof (data.body?.summary as Record<string, unknown> | undefined)?.pct === 'number'
            ? (data.body?.summary as Record<string, unknown> | undefined)?.pct as number
            : undefined,
          teamAlignmentPct: typeof metadata.teamAlignmentPct === 'number'
            ? metadata.teamAlignmentPct
            : undefined,
          decisionClarity: typeof decisionSignal?.clarityScore === 'number'
            ? decisionSignal.clarityScore
            : undefined,
          structuralRisk: typeof decisionSignal?.structuralRisk === 'number'
            ? decisionSignal.structuralRisk
            : undefined,
          dominantFailure: (authorityInput?.affectedDomain as string) ?? undefined,
        };

        const caseId = `enterprise-${data.reference}`;
        await runDecisionIntelligence({
          surface: "enterprise_assessment",
          rawUserInput: `Enterprise Assessment completed: ${data.severity} (score: ${data.score})`,
          userAnswers: entAnswers as unknown as Record<string, unknown>,
          diagnosticResult: {
            score: data.score,
            severity: data.severity,
            reference: data.reference,
            entAnswers,
          },
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