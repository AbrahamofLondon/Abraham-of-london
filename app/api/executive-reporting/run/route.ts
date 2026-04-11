export const dynamic = "force-dynamic";
// app/api/executive-reporting/run/route.ts
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma.server";
import { assembleConstitutionalGuidance } from "@/lib/decision/constitutional-guidance-assembler";
import { buildCanonicalReportContract } from "@/lib/admin/reporting/canonical-report-contract";
import { buildExecutiveReportViewModel } from "@/lib/admin/reporting/executive-report-view-model";
import { getExecutiveReportingEntitlements } from "@/lib/server/billing/executive-reporting-entitlements";

type AnyRecord = Record<string, unknown>;

type ExecutiveReportingRoute = "STRATEGY" | "DIAGNOSTIC" | "REJECT";
type EvidenceQuality = "HIGH" | "MEDIUM" | "LOW";
type RiskScore = "LOW" | "MEDIUM" | "HIGH";

type ExecutiveReportingRunSuccess = {
  ok: true;
  runKey: string;
  route: ExecutiveReportingRoute;
  canonical: unknown;
  viewModel: unknown;
  entitlements: unknown;
  diagnostics: unknown;
};

type ExecutiveReportingRunFailure = {
  ok: false;
  error: string;
};

type ExecutiveReportingRunResponse =
  | ExecutiveReportingRunSuccess
  | ExecutiveReportingRunFailure;

function s(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function n(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.-]/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function arr(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => s(item)).filter(Boolean) : [];
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function makeRunKey(): string {
  return `er_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function getObject(value: unknown): AnyRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as AnyRecord)
    : {};
}

function toEvidenceQuality(value: unknown): EvidenceQuality {
  const normalized = s(value, "MEDIUM").toUpperCase();
  if (normalized === "HIGH") return "HIGH";
  if (normalized === "LOW") return "LOW";
  return "MEDIUM";
}

function toRoute(value: unknown): ExecutiveReportingRoute {
  const normalized = s(value, "DIAGNOSTIC").toUpperCase();
  if (normalized === "STRATEGY") return "STRATEGY";
  if (normalized === "REJECT") return "REJECT";
  return "DIAGNOSTIC";
}

function inferRiskScore(
  severityScore: number,
  evidenceQuality: EvidenceQuality,
): RiskScore {
  let adjusted = severityScore;

  if (evidenceQuality === "HIGH") adjusted += 6;
  if (evidenceQuality === "LOW") adjusted -= 6;

  if (adjusted >= 70) return "HIGH";
  if (adjusted >= 45) return "MEDIUM";
  return "LOW";
}

function buildNarrativeHeadline(input: {
  organisation: string;
  route: ExecutiveReportingRoute;
  orgState: string;
  stakeholderBreadth: string;
  marketExposure: string;
}): string {
  const organisation = input.organisation || "This organisation";
  const state = input.orgState || "DRIFTING";

  if (input.route === "STRATEGY") {
    return `${organisation} shows a ${state.toLowerCase()} condition with sufficient signal for strategic escalation.`;
  }

  if (input.route === "REJECT") {
    return `${organisation} does not yet present a decision-grade case for executive escalation.`;
  }

  if (
    input.stakeholderBreadth === "BOARD" ||
    input.stakeholderBreadth === "INSTITUTIONAL"
  ) {
    return `${organisation} presents a ${state.toLowerCase()} condition with broad stakeholder consequence requiring disciplined executive interpretation.`;
  }

  if (
    input.marketExposure === "CRITICAL" ||
    input.marketExposure === "HIGH"
  ) {
    return `${organisation} is operating under visible structural strain with market-facing consequence.`;
  }

  return `${organisation} presents a ${state.toLowerCase()} condition requiring disciplined interpretation before escalation.`;
}

function buildNarrativeSummary(input: {
  constitution: AnyRecord;
  guidance: AnyRecord;
  problemStatement: string;
  symptoms: string;
  decisionQuestion: string;
  whatHappensIfNothingChanges: string;
  priorAttemptOutcome: string;
  evidenceQuality: EvidenceQuality;
}): string {
  const constitutionalNarrative = s(input.constitution.narrativeSummary);
  if (constitutionalNarrative) {
    const additions: string[] = [];

    if (input.priorAttemptOutcome && input.priorAttemptOutcome !== "NONE") {
      additions.push(
        `Prior correction history is non-trivial (${input.priorAttemptOutcome.toLowerCase()}).`,
      );
    }

    additions.push(
      `Evidence quality is assessed as ${input.evidenceQuality.toLowerCase()}.`,
    );

    if (input.decisionQuestion) {
      additions.push(`The immediate decision need is: ${input.decisionQuestion}`);
    }

    return [constitutionalNarrative, ...additions].join(" ").trim();
  }

  const parts = [
    s(input.problemStatement),
    s(input.symptoms),
    s(input.whatHappensIfNothingChanges),
  ].filter(Boolean);

  return parts.join(" ").slice(0, 900);
}

function buildNarrativeMandate(input: {
  guidance: AnyRecord;
  authorityType: string;
  boardInvolved: string;
  decisionWindow: string;
  decisionQuestion: string;
}): string {
  const nextAction = s(input.guidance.nextAction);
  const decisionQuestion = s(input.decisionQuestion);

  const mandateBits: string[] = [];
  if (nextAction) mandateBits.push(nextAction);
  if (decisionQuestion) mandateBits.push(`Decision focus: ${decisionQuestion}`);
  if (input.authorityType === "UNCLEAR") {
    mandateBits.push("Clarify decision ownership before premium escalation.");
  }
  if (input.boardInvolved === "YES") {
    mandateBits.push("Prepare output for leadership or board-level review.");
  }
  if (input.decisionWindow) {
    mandateBits.push(
      `Decision window: ${input.decisionWindow.replace(/_/g, " ").toLowerCase()}.`,
    );
  }

  return mandateBits.join(" ").trim() || "Proceed according to governed recommendation sequence.";
}

function toTelemetryDomains(input: {
  constitution: AnyRecord;
  intake: AnyRecord;
}): Array<{ label: string; intent: number; reality: number; dissonance: number }> {
  const constitution = input.constitution;
  const intake = input.intake;

  const dominantDomains = arr(constitution.dominantDomains);
  const severityScore = clamp(n(constitution.severityScore, 50), 0, 100);
  const clarityScore = clamp(n(constitution.clarityScore, 50), 0, 100);
  const governanceScore = clamp(n(constitution.governanceScore, 50), 0, 100);
  const authorityScore = clamp(n(constitution.authorityScore, 50), 0, 100);

  const economics = getObject(intake.economics);
  const history = getObject(intake.history);
  const governance = getObject(intake.governance);

  const evidenceQuality = toEvidenceQuality(history.evidenceQuality);
  const marketExposure = s(economics.marketExposure, "MEDIUM");
  const authorityScope = s(
    governance.authorityScope,
    s(constitution.authorityType, "UNCLEAR"),
  );

  const exposurePenalty =
    marketExposure === "CRITICAL"
      ? 18
      : marketExposure === "HIGH"
        ? 12
        : marketExposure === "MEDIUM"
          ? 6
          : 0;

  const evidenceAdjustment =
    evidenceQuality === "HIGH" ? 4 : evidenceQuality === "LOW" ? -4 : 0;

  const authorityReality =
    authorityScope === "DIRECT"
      ? authorityScore
      : authorityScope === "PROXY"
        ? Math.max(30, authorityScore - 12)
        : Math.max(20, authorityScore - 24);

  const base = [
    {
      label: dominantDomains[0] || "AUTHORITY",
      intent: 86,
      reality: clamp(authorityReality + evidenceAdjustment, 18, 92),
    },
    {
      label: dominantDomains[1] || "COHERENCE",
      intent: 84,
      reality: clamp(clarityScore - Math.floor(exposurePenalty / 2), 18, 92),
    },
    {
      label: dominantDomains[2] || "GOVERNANCE",
      intent: 85,
      reality: clamp(governanceScore - exposurePenalty, 18, 92),
    },
    {
      label: dominantDomains[3] || "EXECUTION",
      intent: 88,
      reality: clamp(100 - severityScore + 18 - exposurePenalty, 16, 90),
    },
  ];

  return base.map((domain) => ({
    label: domain.label,
    intent: domain.intent,
    reality: domain.reality,
    dissonance: Math.max(0, domain.intent - domain.reality),
  }));
}

function computeFinancialExposure(input: {
  constitution: AnyRecord;
  intake: AnyRecord;
}): {
  replacementCost: number;
  executionLoss: number;
  totalExposure: number;
} {
  const constitution = input.constitution;
  const intake = input.intake;
  const economics = getObject(intake.economics);

  const severityScore = clamp(n(constitution.severityScore, 50), 0, 100);
  const estimatedExposureGBP = Math.max(0, n(economics.estimatedExposureGBP, 0));
  const headcountAffected = Math.max(0, n(economics.headcountAffected, 0));
  const stakeholderBreadth = s(getObject(intake.governance).stakeholderBreadth, "LOCAL");
  const revenueBand = s(constitution.revenueBand, s(economics.revenueBand, "SMB"));

  const multiplier =
    revenueBand === "WHALE"
      ? 1.8
      : revenueBand === "ENTERPRISE"
        ? 1.45
        : revenueBand === "MID"
          ? 1.2
          : revenueBand === "SMB"
            ? 1.0
            : 0.8;

  const breadthLoad =
    stakeholderBreadth === "INSTITUTIONAL"
      ? 1.4
      : stakeholderBreadth === "BOARD"
        ? 1.25
        : stakeholderBreadth === "EXECUTIVE"
          ? 1.15
          : stakeholderBreadth === "MULTI_TEAM"
            ? 1.08
            : 1;

  const derivedReplacement =
    estimatedExposureGBP > 0
      ? Math.round(estimatedExposureGBP * 0.35 * breadthLoad)
      : Math.round((headcountAffected * 4500 + severityScore * 1200) * multiplier);

  const derivedExecutionLoss =
    estimatedExposureGBP > 0
      ? Math.round(estimatedExposureGBP * 0.65 * breadthLoad)
      : Math.round((severityScore * 3200 + headcountAffected * 2200) * multiplier);

  const replacementCost = Math.max(0, derivedReplacement);
  const executionLoss = Math.max(replacementCost, derivedExecutionLoss);
  const totalExposure = replacementCost + executionLoss;

  return {
    replacementCost,
    executionLoss,
    totalExposure,
  };
}

function buildPriorityStack(input: {
  constitution: AnyRecord;
  intake: AnyRecord;
  guidance: AnyRecord;
}): string[] {
  const constitutionItems = arr(input.constitution.requiredInterventions);
  const failureModes = arr(input.constitution.failureModes);
  const decisionQuestion = s(getObject(input.intake.decisionNeed).decisionQuestion);
  const authorityScope = s(getObject(input.intake.governance).authorityScope);

  const stack = [...constitutionItems];

  if (authorityScope === "UNCLEAR") {
    stack.unshift("Clarify decision authority and sponsor mandate");
  }

  if (failureModes.some((mode) => /trust/i.test(mode))) {
    stack.push("Stabilise trust before introducing further operating change");
  }

  if (decisionQuestion) {
    stack.push(`Resolve decision question: ${decisionQuestion}`);
  }

  return [...new Set(stack)].filter(Boolean).slice(0, 8);
}

function validateIntake(intake: AnyRecord): string | null {
  const email = s(intake.email).toLowerCase();
  const organisation = s(intake.organisation);
  const role = s(intake.role);
  const problemStatement = s(intake.problemStatement);
  const symptoms = s(intake.symptoms);
  const desiredOutcome = s(intake.desiredOutcome);
  const currentConstraint = s(intake.currentConstraint);

  const governance = getObject(intake.governance);
  const economics = getObject(intake.economics);
  const history = getObject(intake.history);
  const decisionNeed = getObject(intake.decisionNeed);
  const meta = getObject(intake.diagnosticsMeta);

  if (!email) return "Email is required.";
  if (!organisation) return "Organisation is required.";
  if (!role) return "Role is required.";
  if (problemStatement.length < 120) return "Problem statement is too thin.";
  if (symptoms.length < 80) return "Observed symptoms are too thin.";
  if (desiredOutcome.length < 40) return "Desired outcome is too thin.";
  if (currentConstraint.length < 30) return "Current constraint is too thin.";

  if (!s(governance.authorityScope)) return "Authority scope is required.";
  if (!s(governance.sponsorNameOrSeat)) return "Decision sponsor or seat is required.";
  if (!s(economics.revenueBand)) return "Revenue band is required.";
  if (!s(economics.marketExposure)) return "Market exposure is required.";
  if (n(economics.estimatedExposureGBP, 0) <= 0) {
    return "Estimated financial exposure is required.";
  }

  if (!s(history.evidenceQuality)) return "Evidence quality is required.";
  if (s(history.evidenceNotes).length < 20) return "Evidence notes are too thin.";
  if (s(decisionNeed.decisionQuestion).length < 20) return "Decision question is too thin.";
  if (s(decisionNeed.whatHappensIfNothingChanges).length < 20) {
    return "Cost of inaction is too thin.";
  }

  if (n(meta.signalReadinessScore, 0) > 0 && n(meta.signalReadinessScore, 0) < 45) {
    return "Signal readiness is too weak for executive reporting.";
  }

  return null;
}

function jsonFailure(
  error: string,
  status: number,
): NextResponse<ExecutiveReportingRunResponse> {
  return NextResponse.json({ ok: false, error }, { status });
}

export async function POST(
  request: Request,
): Promise<NextResponse<ExecutiveReportingRunResponse>> {
  try {
    const body = await request.json();
    const intake = getObject(body?.intake);

    if (Object.keys(intake).length === 0) {
      return jsonFailure("Invalid intake payload.", 400);
    }

    const validationError = validateIntake(intake);
    if (validationError) {
      return jsonFailure(validationError, 400);
    }

    const email = s(intake.email).toLowerCase();
    const runKey = makeRunKey();

    const assembled = await assembleConstitutionalGuidance({
      intake,
      options: {
        assetLimit: 8,
        minAssetScore: 18,
        maxPerKind: 2,
        minDiversityKinds: 2,
      },
    });

    const constitution = getObject(assembled.constitution);
    const guidance = getObject(assembled.guidance);

    const governance = getObject(intake.governance);
    const economics = getObject(intake.economics);
    const history = getObject(intake.history);
    const decisionNeed = getObject(intake.decisionNeed);

    const telemetryDomains = toTelemetryDomains({
      constitution,
      intake,
    });

    const averageDissonance =
      telemetryDomains.length > 0
        ? Math.round(
            telemetryDomains.reduce((sum, item) => sum + item.dissonance, 0) /
              telemetryDomains.length,
          )
        : clamp(n(constitution.severityScore, 0), 0, 100);

    const exposure = computeFinancialExposure({
      constitution,
      intake,
    });

    const evidenceQuality = toEvidenceQuality(history.evidenceQuality);
    const route = toRoute(constitution.route);

    const riskScore = inferRiskScore(
      n(constitution.severityScore, 0),
      evidenceQuality,
    );

    const canonical = buildCanonicalReportContract({
      report: {
        state: s(constitution.orgState, "DRIFTING"),
        narrative: {
          headline: buildNarrativeHeadline({
            organisation: s(intake.organisation, "Prospective Organisation"),
            route,
            orgState: s(constitution.orgState, "DRIFTING"),
            stakeholderBreadth: s(governance.stakeholderBreadth, "LOCAL"),
            marketExposure: s(economics.marketExposure, "MEDIUM"),
          }),
          summary: buildNarrativeSummary({
            constitution,
            guidance,
            problemStatement: s(intake.problemStatement),
            symptoms: s(intake.symptoms),
            decisionQuestion: s(decisionNeed.decisionQuestion),
            whatHappensIfNothingChanges: s(decisionNeed.whatHappensIfNothingChanges),
            priorAttemptOutcome: s(history.priorAttemptOutcome),
            evidenceQuality,
          }),
          mandate: buildNarrativeMandate({
            guidance,
            authorityType: s(constitution.authorityType),
            boardInvolved: s(governance.boardInvolved),
            decisionWindow: s(economics.decisionWindow),
            decisionQuestion: s(decisionNeed.decisionQuestion),
          }),
        },
        resonance: {
          telemetry: {
            averageDissonance,
            domains: telemetryDomains,
          },
        },
        hcdAggregate: {
          overallBurnoutIndex: clamp(
            n(constitution.severityScore, 0) +
              (s(history.priorAttemptOutcome) === "WORSENED" ? 10 : 0),
            0,
            100,
          ),
          criticalDomains: arr(constitution.failureModes),
          elevatedDomains: arr(constitution.dominantDomains),
          riskScore,
        },
        financialExposure: exposure,
        failureModes: arr(constitution.failureModes),
        priorityStack: buildPriorityStack({
          constitution,
          intake,
          guidance,
        }),
        ogr: {
          sovereignCertainty: clamp(n(constitution.clarityScore, 0), 0, 100),
          isAuthorizedToExecute: route === "STRATEGY",
        },
      },
      constitution,
      guidance,
      campaign: {
        id: runKey,
        title: "Executive Reporting Run",
        organisationName: s(intake.organisation, "Prospective Organisation"),
        generatedAt: new Date().toISOString(),
      },
      registry: {
        model: "OGR-IV",
        node: "Canary Wharf",
        protocol: "Sovereign Protocol v2.2",
      },
    });

    const viewModel = buildExecutiveReportViewModel(canonical);
    const entitlements = await getExecutiveReportingEntitlements(email);

    const run = await prisma.executiveReportingRun.create({
      data: {
        runKey,
        email,
        fullName: s(intake.fullName) || null,
        organisation: s(intake.organisation) || null,
        role: s(intake.role) || null,
        sector: s(intake.sector) || null,
        source: "executive-reporting",
        status: "completed",
        route: route || null,
        readinessTier: s(constitution.readinessTier) || null,
        authorityType: s(constitution.authorityType) || null,
        canonicalSnapshot: canonical as Prisma.InputJsonValue,
        viewModelSnapshot: viewModel as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({
      ok: true,
      runKey: run.runKey,
      route,
      canonical,
      viewModel,
      entitlements,
      diagnostics: assembled.diagnostics,
    });
  } catch (error) {
    console.error("[EXECUTIVE_REPORTING_RUN_ERROR]", error);
    return jsonFailure("Failed to generate executive report.", 500);
  }
}