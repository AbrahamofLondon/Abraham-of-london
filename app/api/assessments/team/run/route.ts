import { NextResponse } from "next/server";

import { buildTeamDecisionResult, type TeamGapInput } from "@/lib/diagnostics/decision-engine";
import { buildGenericAuthorityPacket } from "@/lib/diagnostics/evidence-graph";
import { persistDiagnosticStage } from "@/lib/diagnostics/journey-store";
import {
  formatZodError,
  stableInputHash,
  teamAssessmentRunSchema,
} from "@/lib/diagnostics/runtime-validation";
import {
  createSubmissionKey,
  getCachedSubmissionResult,
  setCachedSubmissionResult,
} from "@/lib/diagnostics/submission-control";

function average(values: number[]): number {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function severityFromGap(gap: number): TeamGapInput["gapSeverity"] {
  if (gap >= 25) return "CRITICAL";
  if (gap >= 16) return "HIGH";
  if (gap >= 8) return "MEDIUM";
  return "LOW";
}

function requiresValidation(varianceIndex: number, trustGap: number, avgFriction: number): boolean {
  const closestThreshold = Math.min(
    Math.abs(varianceIndex - 20),
    Math.abs(trustGap - 20),
    Math.abs(avgFriction - 65),
  );
  return closestThreshold <= 2;
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const parsed = teamAssessmentRunSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: formatZodError(parsed.error) },
        { status: 400 },
      );
    }

    const body = parsed.data;
    const submissionKey = createSubmissionKey({
      scope: body.email,
      journeyId: body.journeyId ?? body.sessionId ?? null,
      stage: "team",
      payload: body,
    });
    const cached = getCachedSubmissionResult<Record<string, unknown>>(submissionKey);
    if (cached) {
      return NextResponse.json({ ...cached, duplicate: true });
    }

    const rows = body.rows;
    const trustValues = rows.map((row) => row.executionTrust);
    const clarityValues = rows.map((row) => row.authorityClarity);
    const frictionValues = rows.map((row) => row.operatingFriction);
    const coherenceValues = rows.map((row) => row.strategicCoherence);

    const varianceIndex = Math.round(Math.max(...clarityValues) - Math.min(...clarityValues));
    const trustGap = Math.round(Math.max(...trustValues) - Math.min(...trustValues));
    const avgFriction = average(frictionValues);
    const totalRespondents = rows.reduce((sum, row) => sum + row.respondents, 0);

    const gaps: TeamGapInput[] = rows.map((row) => {
      const gap = Math.round(row.authorityClarity - row.executionTrust);
      return {
        domain: row.teamName.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
        label: row.teamName,
        leaderPct: row.authorityClarity,
        realityPct: row.executionTrust,
        gap,
        gapSeverity: severityFromGap(Math.abs(gap)),
      };
    });

    const decisionResult = buildTeamDecisionResult({
      gaps,
      overallLeader: average(clarityValues),
      overallReality: average(trustValues),
      purposePct: average(coherenceValues),
      confidenceBaseline: totalRespondents >= 6 ? 72 : totalRespondents >= 3 ? 58 : 42,
      falseAssumption: varianceIndex >= trustGap
        ? "Leadership likely believes authority is clearer than execution reality supports."
        : "Leadership likely believes trust is stronger than execution reality supports.",
    });

    const needsValidation = requiresValidation(varianceIndex, trustGap, avgFriction);
    const nextLayer = needsValidation
      ? "REQUIRES_VALIDATION"
      : decisionResult.route === "ENTERPRISE"
        ? "EXECUTIVE_REPORTING"
        : decisionResult.route;

    const signalStrength =
      decisionResult.decisionObject.signalStrength === "high"
        ? 72
        : decisionResult.decisionObject.signalStrength === "medium"
          ? 54
          : 36;

    const authorityPacket = buildGenericAuthorityPacket({
      stage: "team",
      condition: decisionResult.title,
      contradiction: decisionResult.pattern,
      decisionText: decisionResult.decisionObject.decision,
      constraintText: `Rows submitted: ${rows.length}; total respondents: ${totalRespondents}.`,
      costOfDelayText: decisionResult.decisionObject.consequence,
      stakeholderText: body.organisation,
      affectedDomain: decisionResult.urgentDomain ?? "team",
      firstMove: decisionResult.decisionObject.action,
      skippedConsequence: decisionResult.escalationNote,
      escalationCondition: nextLayer === "REQUIRES_VALIDATION"
        ? "Borderline signal strength detected. Confirm with direct respondent input before treating this as settled."
        : "Escalate if the same contradiction persists after the first corrective move.",
      riskScore: Math.min(100, varianceIndex + trustGap + Math.round(avgFriction / 2)),
      formula: "authority variance + trust gap + average friction / 2",
      reasoning: [
        `Authority variance: ${varianceIndex}`,
        `Trust gap: ${trustGap}`,
        `Average friction: ${avgFriction}`,
        `Signal strength: ${decisionResult.decisionObject.signalStrength}`,
      ],
      confidence: signalStrength / 100,
      payload: {
        rows,
        nextLayer,
        signalStrength: decisionResult.decisionObject.signalStrength,
        requiresValidation: needsValidation,
      },
    });

    const result = {
      ok: true,
      organisation: body.organisation,
      varianceIndex,
      trustGap,
      avgFriction,
      nextLayer,
      teams: rows,
      decisionObject: decisionResult.decisionObject,
      respondentBasis: "single_source" as const,
      validityBoundary:
        "This result reflects the respondent's view of the team. Multi-respondent validation is required before treating it as organisational fact.",
      methodology: {
        mode: "leader_estimate",
        signalStrength,
        disclosure:
          "This is a diagnostic signal strength based on response consistency, not a statistical prediction.",
        requiresValidation: needsValidation,
        note: needsValidation
          ? "Borderline threshold signal. Treat as directional until direct respondent evidence confirms it."
          : "Leader-estimate mode: directional evidence only. Multi-respondent campaign mode produces stronger validation.",
      },
      inputHash: stableInputHash(body),
    };

    await persistDiagnosticStage({
      email: body.email,
      subjectId: body.sessionId ?? null,
      organisation: body.organisation,
      stage: "team",
      payload: result,
      tensions: authorityPacket.nodes
        .filter((node) => node.kind === "contradiction")
        .map((node) => node.label),
      routeDecision: { nextLayer, requiresValidation: needsValidation },
      evidenceNodes: authorityPacket.nodes,
      decisionObject: authorityPacket.decisionObject,
      snapshot: {
        timestamp: new Date().toISOString(),
        stage: "team",
        coreMetrics: { varianceIndex, trustGap, avgFriction },
        tensions: authorityPacket.nodes
          .filter((node) => node.kind === "contradiction")
          .map((node) => node.label),
        escalationLevel: nextLayer === "EXECUTIVE_REPORTING" ? 2 : 1,
        directive: nextLayer,
      },
    });

    return NextResponse.json(setCachedSubmissionResult(submissionKey, result));
  } catch (error) {
    console.error("[TEAM_ASSESSMENT_RUN_ERROR]", error);
    return NextResponse.json(
      { ok: false, error: "Failed to run team assessment." },
      { status: 500 },
    );
  }
}
