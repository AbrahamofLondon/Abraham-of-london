/* lib/admin/reporting/executive-report-serializer.ts
   ---------------------------------------------------------------------------
   EXECUTIVE REPORT SERIALIZER
   FIXED: Added back serializeExecutiveReportToJson for the API route
   --------------------------------------------------------------------------- */

import { 
  type ConstitutionalRoute,
  type ExecutiveReportPriority,
  type ExecutiveReportTemperature,
  type ExecutiveReportState,
  type ExecutiveReportReadinessTier,
  type ExecutiveReportAuthorityType,
  type ExecutiveReportRevenueBand,
  type ExecutiveReportMarketRiskBand,
  type ExecutiveReportRecommendation,
  type ExecutiveReportPdfConstitutionPayload,
  type CanonicalExecutiveReportExport,
} from "@/lib/admin/reporting/types";

export type SerializableRecord = Record<string, unknown>;

type SerializeInput = {
  report: any;
  constitution?: any;
  guidance?: any;
  campaign?: any;
};

// --- Helper Utilities ---

function safeArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function safeObject<T extends SerializableRecord = SerializableRecord>(
  value: unknown
): T {
  return value && typeof value === "object" ? (value as T) : ({} as T);
}

function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function safeNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

// --- Type-Safe Casting Helpers ---

function toConstitutionalRoute(value: unknown): ConstitutionalRoute {
  const str = safeString(value).toUpperCase();
  if (str === "STRATEGY") return "STRATEGY";
  if (str === "REJECT") return "REJECT";
  return "DIAGNOSTIC";
}

function toExecutiveReportPriority(value: unknown): ExecutiveReportPriority {
  const str = safeString(value).toUpperCase();
  if (str === "CRITICAL") return "CRITICAL";
  if (str === "SOVEREIGN") return "SOVEREIGN";
  if (str === "HIGH") return "HIGH";
  if (str === "MEDIUM") return "MEDIUM";
  if (str === "LOW") return "LOW";
  return "MEDIUM";
}

function toExecutiveReportTemperature(value: unknown): ExecutiveReportTemperature {
  const str = safeString(value).toUpperCase();
  if (str === "SCORCHING") return "SCORCHING";
  if (str === "HOT") return "HOT";
  if (str === "WARM") return "WARM";
  if (str === "COLD") return "COLD";
  return "WARM";
}

function toExecutiveReportState(value: unknown): ExecutiveReportState {
  const str = safeString(value).toUpperCase();
  if (str === "ORDERED") return "ORDERED";
  if (str === "DRIFTING") return "DRIFTING";
  if (str === "MISALIGNED") return "MISALIGNED";
  if (str === "DISORDERED") return "DISORDERED";
  return "DRIFTING";
}

function toExecutiveReportReadinessTier(value: unknown): ExecutiveReportReadinessTier {
  const str = safeString(value).toUpperCase();
  if (str === "FRAGILE") return "FRAGILE";
  if (str === "EMERGING") return "EMERGING";
  if (str === "STABILIZING") return "STABILIZING";
  if (str === "EXECUTION_READY") return "EXECUTION_READY";
  if (str === "SOVEREIGN") return "SOVEREIGN";
  return "EMERGING";
}

function toExecutiveReportAuthorityType(value: unknown): ExecutiveReportAuthorityType {
  const str = safeString(value).toUpperCase();
  if (str === "DIRECT") return "DIRECT";
  if (str === "PROXY") return "PROXY";
  return "UNCLEAR";
}

function toExecutiveReportRevenueBand(value: unknown): ExecutiveReportRevenueBand {
  const str = safeString(value).toUpperCase();
  if (str === "MICRO") return "MICRO";
  if (str === "SMB") return "SMB";
  if (str === "MID") return "MID";
  if (str === "ENTERPRISE") return "ENTERPRISE";
  if (str === "WHALE") return "WHALE";
  return "MID";
}

function toExecutiveReportMarketRiskBand(value: unknown): ExecutiveReportMarketRiskBand {
  const str = safeString(value).toUpperCase();
  if (str === "CRITICAL") return "CRITICAL";
  if (str === "HIGH") return "HIGH";
  if (str === "MEDIUM") return "MEDIUM";
  if (str === "LOW") return "LOW";
  return "MEDIUM";
}

// --- Data Pickers ---

function pickConstitution(report: any, constitution?: any, guidance?: any): ExecutiveReportPdfConstitutionPayload {
  const reportConstitution = safeObject(report?.constitution);
  const input = safeObject(constitution);
  const guidanceConstitution = safeObject(guidance?.constitution);

  return {
    route: toConstitutionalRoute(
      input.route ||
      guidanceConstitution.route ||
      reportConstitution.route ||
      report?.state
    ),
    priority: toExecutiveReportPriority(
      input.priority ||
      guidanceConstitution.priority ||
      reportConstitution.priority
    ),
    temperature: toExecutiveReportTemperature(
      input.temperature ||
      guidanceConstitution.temperature ||
      reportConstitution.temperature
    ),
    orgState: toExecutiveReportState(
      input.orgState ||
      guidanceConstitution.orgState ||
      reportConstitution.orgState
    ),
    readinessTier: toExecutiveReportReadinessTier(
      input.readinessTier ||
      guidanceConstitution.readinessTier ||
      reportConstitution.readinessTier
    ),
    authorityType: toExecutiveReportAuthorityType(
      input.authorityType ||
      guidanceConstitution.authorityType ||
      reportConstitution.authorityType
    ),
    revenueBand: toExecutiveReportRevenueBand(
      input.revenueBand ||
      guidanceConstitution.revenueBand ||
      reportConstitution.revenueBand
    ),
    marketRiskBand: toExecutiveReportMarketRiskBand(
      input.marketRiskBand ||
      guidanceConstitution.marketRiskBand ||
      reportConstitution.marketRiskBand
    ),
    clarityScore: safeNumber(input.clarityScore, 0),
    authorityScore: safeNumber(input.authorityScore, 0),
    governanceScore: safeNumber(input.governanceScore, 0),
    severityScore: safeNumber(input.severityScore, 0),
    revenueScore: safeNumber(input.revenueScore, 0),
    dominantDomains: safeArray<string>(input.dominantDomains),
    failureModes: safeArray<string>(input.failureModes),
    requiredInterventions: safeArray<string>(input.requiredInterventions),
    sponsorTypes: safeArray<string>(input.sponsorTypes),
    worldviewAnchors: safeArray<string>(input.worldviewAnchors),
    narrativeSummary: safeString(input.narrativeSummary) || safeString(report?.narrative?.summary),
    rationale: safeArray<string>(input.rationale),
  };
}

function buildRecommendations(report: any): ExecutiveReportRecommendation[] {
  const rawRecommendations = safeArray<any>(report?.recommendations);
  return rawRecommendations.map((item: any) => ({
    id: safeString(item?.id),
    title: safeString(item?.title),
    href: safeString(item?.href) || null,
    kind: safeString(item?.kind, "recommendation"),
    score: safeNumber(item?.score, 0),
    summary: safeString(item?.summary),
    reasons: safeArray<string>(item?.reasons),
  }));
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) return `£${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `£${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `£${(value / 1_000).toFixed(1)}K`;
  return `£${value.toFixed(0)}`;
}

// --- Primary Exports ---

export function serializeExecutiveReportToJson(input: SerializeInput): { ok: boolean; canonical: CanonicalExecutiveReportExport } {
  const report: Record<string, unknown> & { resonance?: { telemetry?: Record<string, unknown> }; narrative?: Record<string, unknown> } = input.report ?? {};
  const campaign = safeObject(input.campaign);
  const constitution = pickConstitution(report, input.constitution, input.guidance);
  const recommendations = buildRecommendations(report);

  // Build domains from report resonance telemetry
  const domains = safeArray<any>(report?.resonance?.telemetry?.domains).map((d) => ({
    label: safeString(d?.label),
    intent: safeNumber(d?.intent),
    reality: safeNumber(d?.reality),
    dissonance: safeNumber(d?.dissonance),
  }));

  // Build priority stack
  const priorityItems = safeArray<string>(report?.priorityStack);

  // Build failure modes
  const failureModeItems = safeArray<string>(report?.failureModes);

  // Build required interventions
  const requiredInterventionItems = constitution.requiredInterventions;

  // Build dominant domains
  const dominantDomainItems = constitution.dominantDomains;

  // Build worldview anchors
  const worldviewAnchorItems = constitution.worldviewAnchors;

  // Build sponsor types
  const sponsorTypeItems = constitution.sponsorTypes;

  // Build rationale
  const rationaleItems = constitution.rationale;

  // Build financial exposure
  const financialExposure = safeObject(report?.financialExposure);
  const replacementCost = safeNumber(financialExposure.replacementCost, 0);
  const executionLoss = safeNumber(financialExposure.executionLoss, 0);
  const totalExposure = safeNumber(financialExposure.totalExposure, 0);

  // Build integrity metrics
  const ogr = safeObject(report?.ogr);
  const resonanceTelemetry = safeObject(report?.resonance?.telemetry);
  const hcdAggregate = safeObject(report?.hcdAggregate);

  const executiveSummaryState = constitution.orgState;
  const headline = safeString(report?.narrative?.headline, "");
  const summary = safeString(report?.narrative?.summary, "");
  const mandate = safeString(report?.narrative?.mandate, "");

  // Build governed recommendations
  const guidanceSummary = safeString(input.guidance?.summary, "");
  const nextAction = safeString(input.guidance?.nextAction, "");
  const guidanceRationale = safeArray<string>(input.guidance?.rationale);

  const canonical: CanonicalExecutiveReportExport = {
    schemaVersion: "canonical-report-v2",
    generatedAt: new Date().toISOString(),
    reportId: safeString(campaign.id),
    campaign: {
      id: safeString(campaign.id),
      title: safeString(campaign.title),
      organisationName: safeString(campaign.organisationName),
      generatedAt: safeString(campaign.generatedAt),
    },
    registry: {
      model: "executive-reporting-v2",
      node: "canonical",
      protocol: "constitutional",
    },
    sections: {
      executiveSummary: {
        title: safeString(report?.title, "Executive Intelligence Brief"),
        subtitle: safeString(report?.subtitle, ""),
        state: executiveSummaryState,
        headline,
        summary,
        mandate,
      },
      constitutionalPosture: constitution,
      strategicDomainAnalysis: {
        averageDissonance: safeNumber(resonanceTelemetry?.averageDissonance, 0),
        domains,
      },
      financialExposure: {
        replacementCost,
        executionLoss,
        totalExposure,
        replacementCostFormatted: formatCurrency(replacementCost),
        executionLossFormatted: formatCurrency(executionLoss),
        totalExposureFormatted: formatCurrency(totalExposure),
      },
      integritySnapshot: {
        sovereignCertainty: safeNumber(ogr?.sovereignCertainty, 0),
        burnoutIndex: safeNumber(hcdAggregate?.overallBurnoutIndex, 0),
        averageDissonance: safeNumber(resonanceTelemetry?.averageDissonance, 0),
        authorized: Boolean(ogr?.isAuthorizedToExecute),
      },
      governedRecommendations: {
        summary: guidanceSummary,
        nextAction,
        rationale: guidanceRationale,
        recommendations,
      },
      priorityStack: {
        items: priorityItems,
      },
      failureModes: {
        items: failureModeItems,
      },
      requiredInterventions: {
        items: requiredInterventionItems,
      },
      dominantDomains: {
        items: dominantDomainItems,
      },
      worldviewAnchors: {
        items: worldviewAnchorItems,
      },
      sponsorTypes: {
        items: sponsorTypeItems,
      },
      rationale: {
        items: rationaleItems,
      },
    },
  };

  return {
    ok: true,
    canonical,
  };
}

export function serializeExecutiveReportToPdfPayload(input: SerializeInput) {
  const report: Record<string, unknown> & { resonance?: { telemetry?: Record<string, unknown> }; narrative?: Record<string, unknown> } = input.report ?? {};
  const constitution = pickConstitution(report, input.constitution, input.guidance);
  const recommendations = buildRecommendations(report);

  const domains = safeArray<any>(report?.resonance?.telemetry?.domains).map((d) => ({
    label: safeString(d?.label),
    intent: safeNumber(d?.intent),
    reality: safeNumber(d?.reality),
    dissonance: safeNumber(d?.dissonance),
  }));

  const priorities = safeArray<string>(report?.priorityStack);
  const failureModes = safeArray<string>(report?.failureModes);

  const financialExposure = safeObject(report?.financialExposure);
  const replacementCost = safeNumber(financialExposure.replacementCost, 0);
  const executionLoss = safeNumber(financialExposure.executionLoss, 0);
  const totalExposure = safeNumber(financialExposure.totalExposure, 0);

  const ogr = safeObject(report?.ogr);
  const resonanceTelemetry = safeObject(report?.resonance?.telemetry);
  const hcdAggregate = safeObject(report?.hcdAggregate);

  return {
    title: safeString(report?.title, "Executive Intelligence Brief"),
    subtitle: safeString(report?.subtitle, ""),
    generatedAt: safeString(report?.generatedAt, new Date().toISOString()),
    state: constitution.orgState,
    headline: safeString(report?.narrative?.headline, ""),
    summary: safeString(report?.narrative?.summary, ""),
    mandate: safeString(report?.narrative?.mandate, ""),
    priorities,
    failureModes,
    domains,
    exposure: {
      replacementCost: String(replacementCost),
      executionLoss: String(executionLoss),
      totalExposure: String(totalExposure),
    },
    integrity: {
      sovereignCertainty: safeNumber(ogr?.sovereignCertainty, 0),
      averageDissonance: safeNumber(resonanceTelemetry?.averageDissonance, 0),
      burnoutIndex: safeNumber(hcdAggregate?.overallBurnoutIndex, 0),
      authorized: Boolean(ogr?.isAuthorizedToExecute),
    },
    constitution,
    recommendations,
  };
}

export type ReturnTypeSerializeExecutiveReportToPdfPayload = ReturnType<typeof serializeExecutiveReportToPdfPayload>;