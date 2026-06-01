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
    /** 0 or 1 — which option was chosen. Required for ScenarioStressTest invocation */
    chosenOption?: 0 | 1
    /** Human-readable label of the selected option */
    selectedLabel?: string
    /** Free-text explanation of why this option was chosen */
    explanation?: string
    /** Confidence level (used when chosenOption is set) */
    severity?: string
  }>
  /** Dependency map — which functions, people, systems, or external parties this decision depends on */
  dependencyMap?: string
  /** Financial exposure description */
  financialExposure?: string
  /** Client or market exposure description */
  clientExposure?: string
  /** Legal, regulatory, or compliance exposure description */
  regulatoryExposure?: string
  /** Board challenge readiness — how strong the evidence base is (scale or text) */
  boardChallengeReadiness?: string
  /** Escalation triggers identified in the assessment */
  escalationTriggers?: string[]
  /** Stakeholder conflict description */
  stakeholderConflict?: string
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

type EnterpriseScenarioSubmission = {
  scenarioId: string
  chosenOption?: 0 | 1
  selectedLabel?: string
  explanation?: string
  severity?: string
}

export type EnterpriseResultSurfaceSummary = {
  enterpriseStressSummary: string
  dependencyMapSummary: string
  scenarioStressRan: boolean
  scenarioStressFindings: Array<{
    scenarioId: string
    chosenOption: 0 | 1
    selectedLabel?: string
    severity?: string
  }>
  exposureMap: {
    financial: string
    clientMarket: string
    regulatoryCompliance: string
  }
  boardChallengeReadiness: string
  firstFailurePoint: string
  enterpriseConsequenceState: string
  recommendedEscalationPath: string
  executiveReportingAdds: string
}

export const ENTERPRISE_EXECUTIVE_REPORTING_BOUNDARY =
  "This identifies where the decision breaks under organisational pressure. Executive Reporting converts this into board-grade judgement.";

export function summarizeEnterpriseText(value: unknown, maxLength = 180): string {
  const compact = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  if (!compact) return "Not supplied.";
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength - 1).trimEnd()}...`;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function asScenarioResponses(value: unknown): EnterpriseScenarioSubmission[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const response = asRecord(item);
    if (typeof response.scenarioId !== "string") return [];
    const chosenOption = response.chosenOption === 0 || response.chosenOption === 1
      ? response.chosenOption
      : undefined;
    return [{
      scenarioId: response.scenarioId,
      chosenOption,
      selectedLabel: typeof response.selectedLabel === "string" ? response.selectedLabel : undefined,
      explanation: typeof response.explanation === "string" ? response.explanation : undefined,
      severity: typeof response.severity === "string" ? response.severity : undefined,
    }];
  });
}

export function buildEnterpriseResultSurfaceSummary(body: Record<string, unknown>): EnterpriseResultSurfaceSummary {
  const metadata = asRecord(body.metadata);
  const summary = asRecord(body.summary);
  const sectionScores = Array.isArray(summary.sectionScores)
    ? summary.sectionScores.map(asRecord)
    : [];
  const weakestSection = sectionScores
    .filter((section) => typeof section.title === "string" && typeof section.pct === "number")
    .sort((a, b) => (a.pct as number) - (b.pct as number))[0];
  const pct = typeof summary.pct === "number" ? summary.pct : undefined;
  const band = typeof summary.band === "string" ? summary.band : typeof summary.severity === "string" ? summary.severity : "UNASSESSED";
  const boardChallengeReadiness = typeof metadata.boardChallengeReadiness === "string" && metadata.boardChallengeReadiness.trim()
    ? metadata.boardChallengeReadiness.trim()
    : "Not assessed";
  const scenarioResponses = asScenarioResponses(metadata.scenarioResponses);
  const validScenarioStressFindings = scenarioResponses
    .filter((response): response is EnterpriseScenarioSubmission & { chosenOption: 0 | 1 } => response.chosenOption === 0 || response.chosenOption === 1)
    .map((response) => ({
      scenarioId: response.scenarioId,
      chosenOption: response.chosenOption,
      selectedLabel: response.selectedLabel,
      severity: response.severity,
    }));
  const firstFailurePoint = weakestSection
    ? `${weakestSection.title}: ${weakestSection.pct}% structural strength.`
    : "No first failure point identified.";
  const hasMaterialExposure = [
    metadata.financialExposure,
    metadata.clientExposure,
    metadata.regulatoryExposure,
  ].some((value) => typeof value === "string" && value.trim().length > 0);
  const consequenceState = typeof pct === "number" && pct < 40
    ? "Material organisational exposure. Delay is likely to increase cost, politics, or irreversibility."
    : typeof pct === "number" && pct < 60
      ? "Active enterprise strain. The decision needs escalation discipline before pressure sets the sequence."
      : "Enterprise pressure mapped. Evidence strength determines whether judgement can move to Executive Reporting.";

  return {
    enterpriseStressSummary: `${band} enterprise stress${typeof pct === "number" ? ` at ${pct}%` : ""}. ${firstFailurePoint}`,
    dependencyMapSummary: summarizeEnterpriseText(metadata.dependencyMap ?? metadata.operationalDependency),
    scenarioStressRan: validScenarioStressFindings.length > 0,
    scenarioStressFindings: validScenarioStressFindings,
    exposureMap: {
      financial: summarizeEnterpriseText(metadata.financialExposure, 120),
      clientMarket: summarizeEnterpriseText(metadata.clientExposure, 120),
      regulatoryCompliance: summarizeEnterpriseText(metadata.regulatoryExposure, 120),
    },
    boardChallengeReadiness,
    firstFailurePoint,
    enterpriseConsequenceState: consequenceState,
    recommendedEscalationPath: hasMaterialExposure || band === "FRAGILE" || band === "ESCALATE"
      ? "Escalate to Executive Reporting for board-grade judgement once the evidence record is saved."
      : "Hold in watch state and refresh the dependency, exposure, and challenge evidence before escalation.",
    executiveReportingAdds: ENTERPRISE_EXECUTIVE_REPORTING_BOUNDARY,
  };
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
      enterpriseResult: buildEnterpriseResultSurfaceSummary(body as Record<string, unknown>),
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

        // Check if scenario responses exist — check metadata first (form puts them there), then body
        // New shape: { scenarioId, chosenOption?, selectedLabel?, explanation?, severity? }
        const scenarioResponsesFromMetadata = Array.isArray(metadata.scenarioResponses)
          ? (metadata.scenarioResponses as Array<{ scenarioId: string; chosenOption?: 0 | 1; selectedLabel?: string; explanation?: string; severity?: string }>)
          : undefined;
        const scenarioResponsesFromBody = Array.isArray(data.body?.scenarioResponses)
          ? (data.body.scenarioResponses as Array<{ scenarioId: string; chosenOption?: 0 | 1; selectedLabel?: string; explanation?: string; severity?: string }>)
          : undefined;
        const scenarioResponses = scenarioResponsesFromMetadata ?? scenarioResponsesFromBody;

        // Extract new structured enterprise fields (from metadata, where the form puts them)
        const dependencyMap = typeof metadata.dependencyMap === 'string' && metadata.dependencyMap.trim().length > 0
          ? summarizeEnterpriseText(metadata.dependencyMap)
          : (typeof metadata.operationalDependency === 'string' ? summarizeEnterpriseText(metadata.operationalDependency) : undefined);

        const financialExposure = typeof metadata.financialExposure === 'string' && metadata.financialExposure.trim().length > 0
          ? summarizeEnterpriseText(metadata.financialExposure, 120)
          : undefined;

        const clientExposure = typeof metadata.clientExposure === 'string' && metadata.clientExposure.trim().length > 0
          ? summarizeEnterpriseText(metadata.clientExposure, 120)
          : undefined;

        const regulatoryExposure = typeof metadata.regulatoryExposure === 'string' && metadata.regulatoryExposure.trim().length > 0
          ? summarizeEnterpriseText(metadata.regulatoryExposure, 120)
          : undefined;

        const boardChallengeReadiness = typeof metadata.boardChallengeReadiness === 'string' && metadata.boardChallengeReadiness.trim().length > 0
          ? metadata.boardChallengeReadiness
          : (typeof metadata.boardChallengeReadiness === 'number' ? String(metadata.boardChallengeReadiness) : undefined);

        const entAnswers: EnterpriseDiagnosticAnswers = {
          domainScores: Object.keys(domainScores).length > 0 ? domainScores : undefined,
          scenarioResponses: scenarioResponses && scenarioResponses.length > 0 ? scenarioResponses : undefined,
          dependencyMap,
          financialExposure,
          clientExposure,
          regulatoryExposure,
          boardChallengeReadiness,
          escalationTriggers: authorityInput?.escalationCondition
            ? [authorityInput.escalationCondition as string]
            : undefined,
          stakeholderConflict: metadata.stakeholderConflict as string | undefined,
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
