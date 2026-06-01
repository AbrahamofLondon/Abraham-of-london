/* pages/api/diagnostics/team-alignment.ts */

import type { NextApiRequest, NextApiResponse } from "next";
import { handleDiagnosticSubmit } from "@/lib/diagnostics/api-submit";

/**
 * Structured Team Diagnostic Answers extracted from the submission body.
 * Fields are populated from body.metadata when available.
 */
export type TeamDiagnosticAnswers = {
  /** The respondent's role within the team */
  respondentRole?: string
  /** Who holds decision authority for the condition being assessed */
  perceivedOwner?: string
  /** Decision being assessed */
  perceivedDecision?: string
  /** The primary blocker the respondent identified */
  perceivedBlocker?: string
  /** Clarity of authority (0-100, derived from authority domain scores) */
  authorityClarity?: number
  /** Clarity of evidence (0-100, derived from direction domain scores) */
  evidenceClarity?: number
  /** Confidence in execution (0-100, derived from execution domain scores) */
  executionConfidence?: number
  /** Awareness of consequences (0-100, derived from trust domain scores) */
  consequenceAwareness?: number
  /** Area of disagreement or divergence */
  disagreementArea?: string
  /** Recommended next move from the assessment */
  recommendedMove?: string
  /** Overall leader perception score (0-100) */
  overallLeader?: number
  /** Overall estimated team reality score (0-100) */
  overallReality?: number
  /** Gap between leader and reality scores */
  overallGap?: number
  /** Fragility classification status */
  fragilityStatus?: string
  /** Number of respondents for this case (1 = single respondent) */
  respondentCount?: number
}

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

        // Extract structured TeamDiagnosticAnswers from the body metadata
        const metadata = (data.body?.metadata as Record<string, unknown>) ?? {};
        const authorityInput = metadata.authorityInput as Record<string, unknown> | undefined;
        const sectionScores = (
          (data.body?.summary as Record<string, unknown>)?.sectionScores as Array<Record<string, unknown>> | undefined
        ) ?? [];

        // Derive domain-level clarity scores from section scores
        const directionScore = sectionScores.find(s => s.sectionId === 'direction');
        const executionScore = sectionScores.find(s => s.sectionId === 'execution');
        const trustScore = sectionScores.find(s => s.sectionId === 'trust');
        const authorityScore = sectionScores.find(s => s.sectionId === 'authority');

        // Explicit perception fields take priority over derived values
        const respondentData = (metadata.respondentData as Record<string, unknown> | undefined) ?? {};
        const teamAnswers: TeamDiagnosticAnswers = {
          respondentRole: (respondentData.respondentRole as string | undefined) ?? (metadata.respondent as Record<string, unknown> | undefined)?.role as string | undefined,
          perceivedDecision: (respondentData.perceivedDecision as string | undefined) ?? (authorityInput?.decisionText as string | undefined),
          perceivedOwner: respondentData.perceivedOwner as string | undefined,
          perceivedBlocker: (respondentData.perceivedBlocker as string | undefined) ?? (metadata.fragilityStatus as string) ?? undefined,
          authorityClarity: typeof respondentData.authorityClarity === 'number' ? respondentData.authorityClarity : typeof authorityScore?.pct === 'number' ? authorityScore.pct : undefined,
          evidenceClarity: typeof respondentData.evidenceClarity === 'number' ? respondentData.evidenceClarity : typeof directionScore?.pct === 'number' ? directionScore.pct : undefined,
          executionConfidence: typeof respondentData.executionConfidence === 'number' ? respondentData.executionConfidence : typeof executionScore?.pct === 'number' ? executionScore.pct : undefined,
          consequenceAwareness: typeof respondentData.consequenceAwareness === 'number' ? respondentData.consequenceAwareness : typeof trustScore?.pct === 'number' ? trustScore.pct : undefined,
          disagreementArea: (metadata.urgentDomain as string) ?? undefined,
          recommendedMove: (authorityInput?.firstMove as string) ?? undefined,
          overallLeader: typeof metadata.overallLeader === 'number' ? metadata.overallLeader : undefined,
          overallReality: typeof metadata.overallReality === 'number' ? metadata.overallReality : undefined,
          overallGap: typeof metadata.overallGap === 'number' ? metadata.overallGap : undefined,
          fragilityStatus: typeof metadata.fragilityStatus === 'string' ? metadata.fragilityStatus : undefined,
          respondentCount: 1, // Single respondent by default
        };

        const caseReference = typeof metadata.caseId === "string"
          ? metadata.caseId
          : typeof metadata.teamCaseReference === "string"
            ? metadata.teamCaseReference
            : data.reference;
        const caseId = `team-${caseReference.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}`;
        await runDecisionIntelligence({
          surface: "team_assessment",
          rawUserInput: `Team Assessment completed: ${data.severity} (score: ${data.score})`,
          userAnswers: teamAnswers as unknown as Record<string, unknown>,
          diagnosticResult: {
            score: data.score,
            severity: data.severity,
            reference: data.reference,
            aggregateOnly: true,
            teamAnswers,
          },
          persistJourney: true,
          caseId,
          email: data.userEmail ?? undefined,
        });

        // Persist respondent evidence as a journey event for multi-respondent aggregation
        try {
          const { appendDiagnosticJourneyEvent } = await import(
            "@/lib/product/diagnostic-journey-store"
          );
          const respondentDataPayload: Record<string, unknown> = {};
          if (teamAnswers.respondentRole) respondentDataPayload.respondentRole = teamAnswers.respondentRole;
          if (teamAnswers.perceivedDecision) respondentDataPayload.perceivedDecision = teamAnswers.perceivedDecision;
          if (teamAnswers.perceivedOwner) respondentDataPayload.perceivedOwner = teamAnswers.perceivedOwner;
          if (teamAnswers.perceivedBlocker) respondentDataPayload.perceivedBlocker = teamAnswers.perceivedBlocker;
          if (teamAnswers.authorityClarity !== undefined) respondentDataPayload.authorityClarity = teamAnswers.authorityClarity;
          if (teamAnswers.evidenceClarity !== undefined) respondentDataPayload.evidenceClarity = teamAnswers.evidenceClarity;
          if (teamAnswers.executionConfidence !== undefined) respondentDataPayload.executionConfidence = teamAnswers.executionConfidence;
          if (teamAnswers.consequenceAwareness !== undefined) respondentDataPayload.consequenceAwareness = teamAnswers.consequenceAwareness;

          await appendDiagnosticJourneyEvent({
            caseId,
            surface: "team_assessment",
            type: "EVIDENCE_CAPTURED",
            engineId: "team-respondent-capture",
            summary: "Team respondent evidence captured.",
            audienceSafe: false,
            payload: {
              respondentData: respondentDataPayload,
            },
          });
        } catch {
          // Non-blocking — respondent persistence must not block the diagnostic result
        }
      } catch {
        // Non-blocking — journey persistence must not block the diagnostic result
      }
    },
  });
}
