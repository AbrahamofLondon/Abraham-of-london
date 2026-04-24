import { NextResponse } from "next/server";

import { buildEnterpriseDecisionResult } from "@/lib/diagnostics/decision-engine";
import { buildGenericAuthorityPacket } from "@/lib/diagnostics/evidence-graph";
import { persistDiagnosticStage } from "@/lib/diagnostics/journey-store";
import {
  enterpriseAssessmentRunSchema,
  formatZodError,
  stableInputHash,
} from "@/lib/diagnostics/runtime-validation";
import {
  createSubmissionKey,
  getCachedSubmissionResult,
  setCachedSubmissionResult,
} from "@/lib/diagnostics/submission-control";

function requiresValidation(highestDisorder: number): boolean {
  return Math.abs(highestDisorder - 25) <= 2 || Math.abs(highestDisorder - 45) <= 2;
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const parsed = enterpriseAssessmentRunSchema.safeParse(rawBody);

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
      stage: "enterprise",
      payload: body,
    });
    const cached = getCachedSubmissionResult<Record<string, unknown>>(submissionKey);
    if (cached) {
      return NextResponse.json({ ...cached, duplicate: true });
    }

    const disorderScores = body.domains.map((domain) => {
      const averageHealth =
        (domain.authority + domain.governance + domain.clarity + domain.execution + domain.trust) / 5;
      return {
        label: domain.label,
        disorder: Math.max(0, Math.round(domain.exposure - averageHealth / 2)),
      };
    }).sort((a, b) => b.disorder - a.disorder);

    const highestDisorder = disorderScores[0]?.disorder ?? 0;
    const enterprisePosture =
      highestDisorder >= 45
        ? "DISORDERED"
        : highestDisorder >= 25
          ? "MISALIGNED"
          : "DRIFTING";

    const sections = body.domains.map((domain) => ({
      id: domain.label.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      title: domain.label,
      score: Math.round(
        (domain.authority + domain.governance + domain.clarity + domain.execution + domain.trust) / 5,
      ),
      maxScore: 100,
      pct: Math.round(
        (domain.authority + domain.governance + domain.clarity + domain.execution + domain.trust) / 5,
      ),
    }));
    const totalPct = Math.round(sections.reduce((sum, section) => sum + section.pct, 0) / sections.length);
    const reading = buildEnterpriseDecisionResult({
      totalPct,
      sections,
      teamAlignmentPct: null,
      recentDecision: disorderScores[0]?.label ?? "enterprise",
    });

    const needsValidation = requiresValidation(highestDisorder);
    const nextLayer = needsValidation
      ? "REQUIRES_VALIDATION"
      : enterprisePosture === "DRIFTING"
        ? "WATCH"
        : "EXECUTIVE_REPORTING";

    const signalStrength =
      reading.decisionObject.signalStrength === "high"
        ? 78
        : reading.decisionObject.signalStrength === "medium"
          ? 58
          : 38;

    const authorityPacket = buildGenericAuthorityPacket({
      stage: "enterprise",
      condition: reading.patternTitle,
      contradiction: reading.primaryReading,
      decisionText: reading.decisionObject.decision,
      constraintText: `${body.domains.length} enterprise domains submitted.`,
      costOfDelayText: reading.decisionObject.consequence,
      stakeholderText: body.organisation,
      affectedDomain: reading.dominantFailure ?? "enterprise",
      firstMove: reading.decisionObject.action,
      skippedConsequence: reading.escalationNote,
      escalationCondition: nextLayer === "REQUIRES_VALIDATION"
        ? "Borderline enterprise disorder detected. Validate with corroborating organisational evidence before treating this as settled."
        : "Escalate if another domain crosses the disorder threshold or the same hot domain persists.",
      riskScore: Math.min(100, Math.round(highestDisorder * 1.6)),
      formula: "highest domain disorder x 1.6",
      reasoning: [
        `Highest disorder: ${highestDisorder}`,
        `Enterprise posture: ${enterprisePosture}`,
        `Signal strength: ${reading.decisionObject.signalStrength}`,
        `Heat domains: ${disorderScores.slice(0, 4).map((item) => item.label).join(", ")}`,
      ],
      confidence: signalStrength / 100,
      payload: {
        domains: disorderScores,
        nextLayer,
        signalStrength: reading.decisionObject.signalStrength,
        requiresValidation: needsValidation,
      },
    });

    const result = {
      ok: true,
      organisation: body.organisation,
      enterprisePosture,
      heatDomains: disorderScores.slice(0, 4).map((item) => item.label),
      nextLayer,
      domains: disorderScores,
      decisionObject: reading.decisionObject,
      respondentBasis: "single_source" as const,
      validityBoundary:
        "This result reflects the respondent's view of the organisation. Multi-respondent validation is required before treating it as organisational fact.",
      methodology: {
        mode: "single_source_enterprise_read",
        signalStrength,
        disclosure:
          "This is a diagnostic signal strength based on response consistency, not a statistical prediction.",
        requiresValidation: needsValidation,
        note: needsValidation
          ? "Borderline enterprise posture. Treat as directional until corroborated by further evidence."
          : "Single-source enterprise assessment: directional evidence only until corroborated by multi-stakeholder or longitudinal signal.",
      },
      inputHash: stableInputHash(body),
    };

    await persistDiagnosticStage({
      email: body.email,
      subjectId: body.sessionId ?? null,
      organisation: body.organisation,
      stage: "enterprise",
      payload: result,
      tensions: authorityPacket.nodes
        .filter((node) => node.kind === "contradiction")
        .map((node) => node.label),
      routeDecision: { nextLayer, enterprisePosture, requiresValidation: needsValidation },
      evidenceNodes: authorityPacket.nodes,
      decisionObject: authorityPacket.decisionObject,
      snapshot: {
        timestamp: new Date().toISOString(),
        stage: "enterprise",
        coreMetrics: { highestDisorder },
        tensions: disorderScores.slice(0, 4).map((item) => item.label),
        escalationLevel: nextLayer === "EXECUTIVE_REPORTING" ? 3 : 1,
        directive: nextLayer,
      },
    });

    return NextResponse.json(setCachedSubmissionResult(submissionKey, result));
  } catch (error) {
    console.error("[ENTERPRISE_ASSESSMENT_RUN_ERROR]", error);
    return NextResponse.json(
      { ok: false, error: "Failed to run enterprise assessment." },
      { status: 500 },
    );
  }
}
