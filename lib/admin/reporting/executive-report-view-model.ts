// lib/admin/reporting/executive-report-view-model.ts

import type { CanonicalExecutiveReportExport } from "@/lib/admin/reporting/types";
import { buildObservedOutcomeEvidence } from "@/lib/outcomes/evidence";

export interface ExecutiveReportRecommendationView {
  id: string;
  title: string;
  type: string;
  kind: string;
  description: string;
  priority: "high" | "medium" | "low";
  href?: string | null;
  score: number;
  reasons: string[];
}

export interface ExecutiveReportAssetView {
  id: string;
  title: string;
  kind: string;
  confidence: number;
  href?: string | null;
  worldviewAnchors?: string[];
  commercialUseCases?: string[];
  audience?: string[];
  transformationStage?: string[];
}

export interface ExecutiveReportFindingView {
  domain: string;
  severity: string;
  headline: string;
  reading: string;
  signal: string;
}

export interface ExecutiveReportViewModel {
  header: {
    reportId: string;
    organisationName: string;
    title: string;
    subtitle: string;
    generatedAt: string;
    classification: string;
    route: string;
    authorityType: string;
    readinessTier: string;
    confidence: number;
  };
  summary: {
    state: string;
    headline: string;
    summary: string;
    mandate: string;
    primaryConstraint: string;
    structuralImplication: string;
    routeReason: string;
    failureModes: string[];
    priorityStack: string[];
    requiredInterventions: string[];
    dominantDomains: string[];
    rationale: string[];
  };
  telemetry: {
    averageDissonance: number;
    burnoutIndex: number;
    sovereignCertainty: number;
    authorized: boolean;
    domains: Array<{
      label: string;
      intent: number;
      reality: number;
      dissonance: number;
    }>;
  };
  financialExposure: {
    replacementCost: number;
    executionLoss: number;
    totalExposure: number;
    replacementCostFormatted: string;
    executionLossFormatted: string;
    totalExposureFormatted: string;
  };
  observedOutcomes: NonNullable<
    CanonicalExecutiveReportExport["sections"]["observedOutcomeEvidence"]
  >;
  constitution: CanonicalExecutiveReportExport["sections"]["constitutionalPosture"];
  recommendations: {
    summary: string;
    nextAction: string;
    worldviewAnchors: string[];
    commercialUseCases: string[];
    audience: string[];
    transformationStage: string[];
    matchedAssets: ExecutiveReportAssetView[];
    recommendations: ExecutiveReportRecommendationView[];
  };

  // UI convenience fields
  findings: ExecutiveReportFindingView[];
  boardActions: string[];
  nextAction: string;
}

function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  return fallback;
}

function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function safeArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => safeString(item)).filter(Boolean)
    : [];
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function scoreToPriority(score: number): "high" | "medium" | "low" {
  if (score >= 75) return "high";
  if (score >= 45) return "medium";
  return "low";
}

function severityFromScore(score: number): string {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 40) return "MEDIUM";
  return "LOW";
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function inferAudience(route: string, authorityType: string): string[] {
  const out = new Set<string>();

  if (route === "STRATEGY") {
    out.add("Founder");
    out.add("CEO");
    out.add("Board");
  } else if (route === "DIAGNOSTIC") {
    out.add("Executive Lead");
    out.add("Chief of Staff");
    out.add("Operator");
  } else {
    out.add("Sponsor");
    out.add("Operator");
  }

  if (authorityType === "DIRECT") out.add("Decision Owner");
  if (authorityType === "PROXY") out.add("Senior Sponsor");

  return [...out];
}

function inferCommercialUseCases(state: string, route: string): string[] {
  const items = new Set<string>();

  if (route === "STRATEGY") items.add("escalation-readiness");
  if (route === "DIAGNOSTIC") items.add("executive-interpretation");
  if (route === "REJECT") items.add("foundational-clarification");

  if (state === "DISORDERED") items.add("stabilisation");
  if (state === "MISALIGNED") items.add("realignment");
  if (state === "DRIFTING") items.add("course-correction");
  if (state === "ORDERED") items.add("board-readiness");

  return [...items];
}

function inferTransformationStage(route: string, state: string): string[] {
  const stages = new Set<string>();

  if (route === "REJECT") {
    stages.add("assess");
    stages.add("diagnose");
  } else if (route === "DIAGNOSTIC") {
    stages.add("diagnose");
    stages.add("realign");
  } else {
    stages.add("govern");
    stages.add("scale");
  }

  if (state === "DISORDERED") stages.add("realign");

  return [...stages];
}

export function buildExecutiveReportViewModel(
  canonical: CanonicalExecutiveReportExport,
): ExecutiveReportViewModel {
  const sections = canonical.sections;
  const constitution = sections.constitutionalPosture;

  const route = safeString(constitution.route, "DIAGNOSTIC");
  const state = safeString(sections.executiveSummary.state, constitution.orgState);
  const authorityType = safeString(constitution.authorityType, "UNCLEAR");

  const commercialUseCases = inferCommercialUseCases(state, route);
  const audience = inferAudience(route, authorityType);
  const transformationStage = inferTransformationStage(route, state);

  const matchedAssets: ExecutiveReportAssetView[] =
    sections.governedRecommendations.recommendations.map((item) => ({
      id: item.id,
      title: item.title,
      kind: item.kind,
      confidence: item.score,
      href: item.href ?? null,
      worldviewAnchors: sections.worldviewAnchors.items,
      commercialUseCases,
      audience,
      transformationStage,
    }));

  const recommendationViews: ExecutiveReportRecommendationView[] =
    sections.governedRecommendations.recommendations.map((item) => ({
      id: item.id,
      title: item.title,
      type: item.kind,
      kind: item.kind,
      description: item.summary,
      priority: scoreToPriority(item.score),
      href: item.href ?? null,
      score: item.score,
      reasons: item.reasons,
    }));

  const constitutionalConfidence = Math.round(
    safeNumber(constitution.confidence, 0) * 100,
  );
  const confidence =
    constitutionalConfidence > 0
      ? constitutionalConfidence
      : Math.round(
          safeNumber(sections.integritySnapshot.sovereignCertainty, 0) * 0.35 +
            (100 - safeNumber(sections.strategicDomainAnalysis.averageDissonance, 0)) * 0.25 +
            safeNumber(constitution.governanceScore, 0) * 0.2 +
            safeNumber(constitution.authorityScore, 0) * 0.2,
        );

  const failureModes = sections.failureModes.items;
  const dominantDomains = sections.dominantDomains.items;
  const severity = severityFromScore(safeNumber(constitution.severityScore, 0));
  const observedOutcomes =
    sections.observedOutcomeEvidence ?? buildObservedOutcomeEvidence([]);

  const findings: ExecutiveReportFindingView[] = [
    ...failureModes.slice(0, 3).map((mode) => ({
      domain: "Failure Mode",
      severity,
      headline: titleCase(mode),
      reading: `${titleCase(mode)} is materially present in the constitutional reading and is contributing to structural drag.`,
      signal: "Observed in the constitutional failure pattern.",
    })),
    ...(safeNumber(constitution.governanceScore, 0) > 0
      ? [
          {
            domain: "Governance",
            severity: severityFromScore(100 - safeNumber(constitution.governanceScore, 0)),
            headline:
              safeNumber(constitution.governanceScore, 0) < 50
                ? "Governance structure is under strain"
                : "Governance remains functional but exposed",
            reading:
              safeNumber(constitution.governanceScore, 0) < 50
                ? "Governance quality is weak relative to the seriousness of the matter, increasing the likelihood of delayed or distorted correction."
                : "Governance is not the primary point of collapse, but it is carrying visible pressure from the wider condition.",
            signal: `Governance score: ${safeNumber(constitution.governanceScore, 0)}/100`,
          },
        ]
      : []),
    ...(safeNumber(constitution.clarityScore, 0) > 0
      ? [
          {
            domain: "Clarity",
            severity: severityFromScore(100 - safeNumber(constitution.clarityScore, 0)),
            headline:
              safeNumber(constitution.clarityScore, 0) < 50
                ? "Decision clarity is insufficient"
                : "Decision clarity is present but not fully consolidated",
            reading:
              safeNumber(constitution.clarityScore, 0) < 50
                ? "The organisation does not yet hold the matter with sufficient precision, which increases ambiguity in the decision path."
                : "There is enough clarity to act, but not enough to proceed carelessly.",
            signal: `Clarity score: ${safeNumber(constitution.clarityScore, 0)}/100`,
          },
        ]
      : []),
  ].slice(0, 5);

  const boardActions = uniqueStrings([
    ...sections.priorityStack.items,
    ...sections.requiredInterventions.items,
    ...recommendationViews.map((item) => item.title),
  ]).slice(0, 8);

  const nextAction =
    safeString(sections.governedRecommendations.nextAction) ||
    safeString(sections.executiveSummary.mandate) ||
    boardActions[0] ||
    "Proceed according to governed recommendation sequence.";

  const primaryConstraint =
    sections.requiredInterventions.items[0] ||
    sections.failureModes.items[0] ||
    "Decision structure is not yet sufficiently ordered.";

  const structuralImplication =
    route === "STRATEGY"
      ? "The matter is ordered enough for direct intervention without bypassing governance."
      : route === "REJECT"
        ? "Escalation would overstate the signal and should be withheld until the case is more coherent."
        : "The signal is real, but structural correction should precede executive escalation.";

  const routeReason =
    sections.rationale.items[0] ||
    sections.governedRecommendations.rationale[0] ||
    "Route assigned according to the constitutional reading.";

  return {
    header: {
      reportId: canonical.reportId,
      organisationName: canonical.campaign.organisationName,
      title: sections.executiveSummary.title,
      subtitle: sections.executiveSummary.subtitle,
      generatedAt: canonical.generatedAt,
      classification: "RESTRICTED",
      route,
      authorityType,
      readinessTier: safeString(constitution.readinessTier, "EMERGING"),
      confidence,
    },
    summary: {
      state,
      headline: sections.executiveSummary.headline,
      summary: sections.executiveSummary.summary,
      mandate: sections.executiveSummary.mandate,
      primaryConstraint,
      structuralImplication,
      routeReason,
      failureModes,
      priorityStack: sections.priorityStack.items,
      requiredInterventions: sections.requiredInterventions.items,
      dominantDomains,
      rationale: sections.rationale.items,
    },
    telemetry: {
      averageDissonance: sections.strategicDomainAnalysis.averageDissonance,
      burnoutIndex: sections.integritySnapshot.burnoutIndex,
      sovereignCertainty: sections.integritySnapshot.sovereignCertainty,
      authorized: sections.integritySnapshot.authorized,
      domains: sections.strategicDomainAnalysis.domains,
    },
    financialExposure: {
      replacementCost: sections.financialExposure.replacementCost,
      executionLoss: sections.financialExposure.executionLoss,
      totalExposure: sections.financialExposure.totalExposure,
      replacementCostFormatted: sections.financialExposure.replacementCostFormatted,
      executionLossFormatted: sections.financialExposure.executionLossFormatted,
      totalExposureFormatted: sections.financialExposure.totalExposureFormatted,
    },
    observedOutcomes,
    constitution,
    recommendations: {
      summary: sections.governedRecommendations.summary,
      nextAction,
      worldviewAnchors: sections.worldviewAnchors.items,
      commercialUseCases,
      audience,
      transformationStage,
      matchedAssets,
      recommendations: recommendationViews,
    },
    findings,
    boardActions,
    nextAction,
  };
}
import "server-only";
