/* lib/admin/reporting/executive-report-serializer.ts
   ---------------------------------------------------------------------------
   EXECUTIVE REPORT SERIALIZER
   Canonical serializer for JSON exports, admin APIs, and PDF payloads
   --------------------------------------------------------------------------- */

export type SerializableRecord = Record<string, unknown>;

type SerializeInput = {
  report: any;
  constitution?: any;
  guidance?: any;
  campaign?: any;
};

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

function pickConstitution(report: any, constitution?: any, guidance?: any) {
  const reportConstitution = safeObject(report?.constitution);
  const input = safeObject(constitution);
  const guidanceConstitution = safeObject(guidance?.constitution);

  return {
    route:
      safeString(input.route) ||
      safeString(guidanceConstitution.route) ||
      safeString(reportConstitution.route) ||
      safeString(report?.state) ||
      "DIAGNOSTIC",

    orgState:
      safeString(input.orgState) ||
      safeString(guidanceConstitution.orgState) ||
      safeString(reportConstitution.orgState) ||
      safeString(report?.state) ||
      "DRIFTING",

    readinessTier:
      safeString(input.readinessTier) ||
      safeString(guidanceConstitution.readinessTier) ||
      safeString(reportConstitution.readinessTier) ||
      "EMERGING",

    authorityType:
      safeString(input.authorityType) ||
      safeString(guidanceConstitution.authorityType) ||
      safeString(reportConstitution.authorityType) ||
      "UNKNOWN",

    priority:
      safeString(input.priority) ||
      safeString(guidanceConstitution.priority) ||
      safeString(reportConstitution.priority) ||
      "HIGH",

    temperature:
      safeString(input.temperature) ||
      safeString(guidanceConstitution.temperature) ||
      safeString(reportConstitution.temperature) ||
      "HOT",

    clarityScore:
      safeNumber(input.clarityScore, safeNumber(guidanceConstitution.clarityScore, safeNumber(reportConstitution.clarityScore, 0))),
    authorityScore:
      safeNumber(input.authorityScore, safeNumber(guidanceConstitution.authorityScore, safeNumber(reportConstitution.authorityScore, 0))),
    governanceScore:
      safeNumber(input.governanceScore, safeNumber(guidanceConstitution.governanceScore, safeNumber(reportConstitution.governanceScore, 0))),
    severityScore:
      safeNumber(input.severityScore, safeNumber(guidanceConstitution.severityScore, safeNumber(reportConstitution.severityScore, 0))),
    revenueScore:
      safeNumber(input.revenueScore, safeNumber(guidanceConstitution.revenueScore, safeNumber(reportConstitution.revenueScore, 0))),

    revenueBand:
      safeString(input.revenueBand) ||
      safeString(guidanceConstitution.revenueBand) ||
      safeString(reportConstitution.revenueBand) ||
      "UNSPECIFIED",

    marketRiskBand:
      safeString(input.marketRiskBand) ||
      safeString(guidanceConstitution.marketRiskBand) ||
      safeString(reportConstitution.marketRiskBand) ||
      "MODERATE",

    failureModes:
      safeArray<string>(input.failureModes).length
        ? safeArray<string>(input.failureModes)
        : safeArray<string>(guidanceConstitution.failureModes).length
        ? safeArray<string>(guidanceConstitution.failureModes)
        : safeArray<string>(reportConstitution.failureModes),

    dominantDomains:
      safeArray<string>(input.dominantDomains).length
        ? safeArray<string>(input.dominantDomains)
        : safeArray<string>(guidanceConstitution.dominantDomains).length
        ? safeArray<string>(guidanceConstitution.dominantDomains)
        : safeArray<string>(reportConstitution.dominantDomains),

    requiredInterventions:
      safeArray<string>(input.requiredInterventions).length
        ? safeArray<string>(input.requiredInterventions)
        : safeArray<string>(guidanceConstitution.requiredInterventions).length
        ? safeArray<string>(guidanceConstitution.requiredInterventions)
        : safeArray<string>(reportConstitution.requiredInterventions),

    sponsorTypes:
      safeArray<string>(input.sponsorTypes).length
        ? safeArray<string>(input.sponsorTypes)
        : safeArray<string>(guidanceConstitution.sponsorTypes).length
        ? safeArray<string>(guidanceConstitution.sponsorTypes)
        : safeArray<string>(reportConstitution.sponsorTypes),

    worldviewAnchors:
      safeArray<string>(input.worldviewAnchors).length
        ? safeArray<string>(input.worldviewAnchors)
        : safeArray<string>(guidanceConstitution.worldviewAnchors).length
        ? safeArray<string>(guidanceConstitution.worldviewAnchors)
        : safeArray<string>(reportConstitution.worldviewAnchors),

    narrativeSummary:
      safeString(input.narrativeSummary) ||
      safeString(guidanceConstitution.narrativeSummary) ||
      safeString(reportConstitution.narrativeSummary) ||
      safeString(report?.narrative?.summary) ||
      safeString(report?.narrative?.headline),

    rationale:
      safeArray<string>(input.rationale).length
        ? safeArray<string>(input.rationale)
        : safeArray<string>(guidanceConstitution.rationale).length
        ? safeArray<string>(guidanceConstitution.rationale)
        : safeArray<string>(reportConstitution.rationale),
  };
}

function pickRecommendations(guidance?: any, report?: any) {
  const guidanceRecommendations = safeArray<any>(guidance?.recommendations);
  const reportRecommendations = safeArray<any>(report?.recommendations);

  const source =
    guidanceRecommendations.length > 0
      ? guidanceRecommendations
      : reportRecommendations;

  return source.map((item: any) => ({
    id: safeString(item?.id),
    title: safeString(item?.title),
    href: safeString(item?.href) || null,
    kind: safeString(item?.kind) || "asset",
    score: safeNumber(item?.score),
    summary: safeString(item?.summary),
    reasons: safeArray<string>(item?.reasons),
  }));
}

function buildSections(report: any, constitution: any, guidance?: any) {
  const recommendations = pickRecommendations(guidance, report);

  return {
    executiveSummary: {
      title: safeString(report?.title) || "Executive Intelligence Brief",
      subtitle: safeString(report?.subtitle) || "",
      state: safeString(report?.state) || constitution.orgState || "DRIFTING",
      headline:
        safeString(report?.narrative?.headline) ||
        safeString(constitution.narrativeSummary) ||
        "Strategic review generated.",
      summary:
        safeString(report?.narrative?.summary) ||
        safeString(constitution.narrativeSummary) ||
        "",
      mandate: safeString(report?.narrative?.mandate) || "",
      generatedAt:
        safeString(report?.generatedAt) || new Date().toISOString(),
      route: constitution.route,
    },

    constitutionalPosture: {
      ...constitution,
    },

    strategicDomainAnalysis: {
      averageDissonance: safeNumber(report?.resonance?.telemetry?.averageDissonance),
      domains: safeArray<any>(report?.resonance?.telemetry?.domains).map((d) => ({
        label: safeString(d?.label),
        intent: safeNumber(d?.intent),
        reality: safeNumber(d?.reality),
        dissonance: safeNumber(
          d?.dissonance,
          Math.abs(safeNumber(d?.intent) - safeNumber(d?.reality))
        ),
      })),
    },

    humanCapital: {
      aggregate: safeObject(report?.hcdAggregate),
      matrix: safeArray<any>(report?.hcd).map((r) => ({
        label: safeString(r?.label),
        potential: safeNumber(r?.potential),
        extraction: safeNumber(r?.extraction),
        burnoutIndex: safeNumber(r?.burnoutIndex),
        wellbeing: safeNumber(r?.wellbeing),
        attritionRisk: safeString(r?.attritionRisk),
      })),
    },

    financialExposure: {
      replacementCost: safeNumber(report?.financialExposure?.replacementCost),
      executionLoss: safeNumber(report?.financialExposure?.executionLoss),
      totalExposure: safeNumber(report?.financialExposure?.totalExposure),
    },

    priorities: safeArray<string>(report?.priorityStack),
    failureModes: safeArray<string>(report?.failureModes),
    recommendations,
  };
}

export function serializeExecutiveReportToJson(input: SerializeInput) {
  const report = safeObject(input.report);
  const campaign = safeObject(input.campaign);
  const guidance = safeObject(input.guidance);
  const constitution = pickConstitution(report, input.constitution, guidance);
  const sections = buildSections(report, constitution, guidance);

  return {
    ok: true,
    canonical: {
      version: "1.0",
      generatedAt: new Date().toISOString(),
      campaign: {
        id: safeString(campaign.id),
        title: safeString(campaign.title),
        organisationName: safeString(campaign.organisationName),
        generatedAt: safeString(campaign.generatedAt),
      },
      constitution,
      sections,
    },
  };
}

export function serializeExecutiveReportToPdfPayload(input: SerializeInput) {
  const json = serializeExecutiveReportToJson(input);
  const canonical = json.canonical;

  return {
    title: canonical.sections.executiveSummary.title,
    subtitle: canonical.sections.executiveSummary.subtitle,
    generatedAt: canonical.sections.executiveSummary.generatedAt,
    state: canonical.sections.executiveSummary.state,
    headline: canonical.sections.executiveSummary.headline,
    summary: canonical.sections.executiveSummary.summary,
    mandate: canonical.sections.executiveSummary.mandate,
    constitution: canonical.constitution,
    sections: canonical.sections,
    integrity: {
      sovereignCertainty: safeNumber(input.report?.ogr?.sovereignCertainty),
      averageDissonance: safeNumber(
        input.report?.resonance?.telemetry?.averageDissonance
      ),
      burnoutIndex: safeNumber(input.report?.hcdAggregate?.overallBurnoutIndex),
      authorized: Boolean(input.report?.ogr?.isAuthorizedToExecute),
    },
    exposure: {
      replacementCost: String(
        canonical.sections.financialExposure.replacementCost ?? 0
      ),
      executionLoss: String(
        canonical.sections.financialExposure.executionLoss ?? 0
      ),
      totalExposure: String(
        canonical.sections.financialExposure.totalExposure ?? 0
      ),
    },
    domains: canonical.sections.strategicDomainAnalysis.domains.map((d: any) => ({
      label: d.label,
      intent: d.intent,
      reality: d.reality,
      dissonance: d.dissonance,
    })),
    priorities: canonical.sections.priorities,
    failureModes: canonical.sections.failureModes,
    recommendations: canonical.sections.recommendations,
  };
}