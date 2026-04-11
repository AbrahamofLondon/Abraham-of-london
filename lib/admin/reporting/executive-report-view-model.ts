// lib/admin/reporting/executive-report-view-model.ts

import type { CanonicalExecutiveReportExport } from "@/lib/admin/reporting/types";

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

function scoreToPriority(score: number): "high" | "medium" | "low" {
  if (score >= 75) return "high";
  if (score >= 45) return "medium";
  return "low";
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

  const matchedAssets: ExecutiveReportAssetView[] =
    sections.governedRecommendations.recommendations.map((item) => ({
      id: item.id,
      title: item.title,
      kind: item.kind,
      confidence: item.score,
      href: item.href ?? null,
      worldviewAnchors: sections.worldviewAnchors.items,
      commercialUseCases: inferCommercialUseCases(
        sections.executiveSummary.state,
        constitution.route,
      ),
      audience: inferAudience(constitution.route, constitution.authorityType),
      transformationStage: inferTransformationStage(
        constitution.route,
        sections.executiveSummary.state,
      ),
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

  const confidence = Math.round(
    (safeNumber(sections.integritySnapshot.sovereignCertainty, 0) * 0.35) +
      ((100 - safeNumber(sections.strategicDomainAnalysis.averageDissonance, 0)) * 0.25) +
      (safeNumber(constitution.governanceScore, 0) * 0.2) +
      (safeNumber(constitution.authorityScore, 0) * 0.2),
  );

  return {
    header: {
      reportId: canonical.reportId,
      organisationName: canonical.campaign.organisationName,
      title: sections.executiveSummary.title,
      subtitle: sections.executiveSummary.subtitle,
      generatedAt: canonical.generatedAt,
      classification: "RESTRICTED",
      route: constitution.route,
      authorityType: constitution.authorityType,
      readinessTier: constitution.readinessTier,
      confidence,
    },
    summary: {
      state: sections.executiveSummary.state,
      headline: sections.executiveSummary.headline,
      summary: sections.executiveSummary.summary,
      mandate: sections.executiveSummary.mandate,
      failureModes: sections.failureModes.items,
      priorityStack: sections.priorityStack.items,
      requiredInterventions: sections.requiredInterventions.items,
      dominantDomains: sections.dominantDomains.items,
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
    constitution,
    recommendations: {
      summary: sections.governedRecommendations.summary,
      nextAction: sections.governedRecommendations.nextAction,
      worldviewAnchors: sections.worldviewAnchors.items,
      commercialUseCases: inferCommercialUseCases(
        sections.executiveSummary.state,
        constitution.route,
      ),
      audience: inferAudience(constitution.route, constitution.authorityType),
      transformationStage: inferTransformationStage(
        constitution.route,
        sections.executiveSummary.state,
      ),
      matchedAssets,
      recommendations: recommendationViews,
    },
  };
}