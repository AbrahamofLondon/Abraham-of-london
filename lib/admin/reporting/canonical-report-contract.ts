// lib/admin/reporting/canonical-report-contract.ts

import type {
  ExecutiveReportConstitution,
  ExecutiveReportGuidance,
  ExecutiveReportRecommendation,
} from "./types";

type AnyRecord = Record<string, unknown>;

function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : fallback;
  }
  return fallback;
}

function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function safeBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => safeString(item)).filter(Boolean);
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function normalizeRecommendation(item: unknown): ExecutiveReportRecommendation {
  const rec = (item || {}) as AnyRecord;

  return {
    id: safeString(rec.id),
    title: safeString(rec.title, "Untitled recommendation"),
    href:
      typeof rec.href === "string" && rec.href.trim().length
        ? rec.href.trim()
        : null,
    kind: safeString(rec.kind, "guidance"),
    score: safeNumber(rec.score),
    summary: safeString(
      rec.summary,
      safeString(rec.description, "Governed recommendation."),
    ),
    reasons: uniqueStrings([
      ...safeStringArray(rec.reasons),
      ...safeStringArray(rec.matchReasons),
    ]),
  };
}

function formatCurrencyGBP(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function normalizeDomain(domain: unknown): {
  label: string;
  intent: number;
  reality: number;
  dissonance: number;
} {
  const item = (domain || {}) as AnyRecord;
  const intent = safeNumber(item.intent, 0);
  const reality = safeNumber(item.reality, 0);

  return {
    label: safeString(item.label, "Unknown Domain"),
    intent,
    reality,
    dissonance: safeNumber(item.dissonance, Math.max(0, intent - reality)),
  };
}

export type CanonicalReportContract = {
  schemaVersion: "canonical-report-v2";
  generatedAt: string;
  reportId: string;
  campaign: {
    id: string;
    title: string;
    organisationName: string;
    generatedAt: string;
  };
  registry: {
    model: string;
    node: string;
    protocol: string;
  };
  sections: {
    executiveSummary: {
      title: string;
      subtitle: string;
      state: string;
      headline: string;
      summary: string;
      mandate: string;
    };
    constitutionalPosture: ExecutiveReportConstitution;
    strategicDomainAnalysis: {
      averageDissonance: number;
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
    integritySnapshot: {
      sovereignCertainty: number;
      burnoutIndex: number;
      averageDissonance: number;
      authorized: boolean;
    };
    governedRecommendations: {
      summary: string;
      nextAction: string;
      rationale: string[];
      recommendations: ExecutiveReportRecommendation[];
    };
    priorityStack: {
      items: string[];
    };
    failureModes: {
      items: string[];
    };
    requiredInterventions: {
      items: string[];
    };
    dominantDomains: {
      items: string[];
    };
    worldviewAnchors: {
      items: string[];
    };
    sponsorTypes: {
      items: string[];
    };
    rationale: {
      items: string[];
    };
  };
};

export type BuildCanonicalReportContractArgs = {
  report: any;
  constitution: ExecutiveReportConstitution;
  guidance: ExecutiveReportGuidance;
  campaign?: {
    id?: string;
    title?: string;
    organisationName?: string;
    generatedAt?: string;
  };
  registry?: {
    model?: string;
    node?: string;
    protocol?: string;
  };
};

export function buildCanonicalReportContract(
  args: BuildCanonicalReportContractArgs,
): CanonicalReportContract {
  const report = args.report || {};
  const constitution = args.constitution;
  const guidance = args.guidance;

  const generatedAt = safeString(args.campaign?.generatedAt, new Date().toISOString());
  const campaignId = safeString(args.campaign?.id, "executive-report");
  const campaignTitle = safeString(args.campaign?.title, "Executive Reporting Run");
  const organisationName = safeString(
    args.campaign?.organisationName,
    "Unknown organisation",
  );

  const domains = Array.isArray(report?.resonance?.telemetry?.domains)
    ? report.resonance.telemetry.domains.map(normalizeDomain)
    : [];

  const averageDissonance = safeNumber(
    report?.resonance?.telemetry?.averageDissonance,
    domains.length
      ? Math.round(
          domains.reduce((sum, item) => sum + item.dissonance, 0) / domains.length,
        )
      : safeNumber(constitution?.severityScore, 0),
  );

  const replacementCost = safeNumber(report?.financialExposure?.replacementCost);
  const executionLoss = safeNumber(report?.financialExposure?.executionLoss);
  const totalExposure = safeNumber(
    report?.financialExposure?.totalExposure,
    replacementCost + executionLoss,
  );

  const recommendations = Array.isArray(guidance?.recommendations)
    ? guidance.recommendations.map(normalizeRecommendation)
    : [];

  const normalizedConstitution: ExecutiveReportConstitution = {
    ...constitution,
    route: safeString(constitution?.route, "DIAGNOSTIC"),
    priority: safeString(constitution?.priority, "MEDIUM"),
    temperature: safeString(constitution?.temperature, "WARM"),
    orgState: safeString(constitution?.orgState, "DRIFTING"),
    readinessTier: safeString(constitution?.readinessTier, "EMERGING"),
    authorityType: safeString(constitution?.authorityType, "UNCLEAR"),
    revenueBand: safeString(constitution?.revenueBand, "SMB"),
    marketRiskBand: safeString(constitution?.marketRiskBand, "MODERATE"),
    clarityScore: safeNumber(constitution?.clarityScore, 50),
    authorityScore: safeNumber(constitution?.authorityScore, 50),
    governanceScore: safeNumber(constitution?.governanceScore, 50),
    severityScore: safeNumber(constitution?.severityScore, averageDissonance),
    revenueScore: safeNumber(constitution?.revenueScore, 50),
    dominantDomains: uniqueStrings(safeStringArray(constitution?.dominantDomains)),
    failureModes: uniqueStrings(safeStringArray(constitution?.failureModes)),
    requiredInterventions: uniqueStrings(safeStringArray(constitution?.requiredInterventions)),
    sponsorTypes: uniqueStrings(safeStringArray(constitution?.sponsorTypes)),
    worldviewAnchors: uniqueStrings(safeStringArray(constitution?.worldviewAnchors)),
    narrativeSummary: safeString(
      constitution?.narrativeSummary,
      safeString(report?.narrative?.summary),
    ),
    rationale: uniqueStrings(safeStringArray(constitution?.rationale)),
  };

  const priorityStackItems = uniqueStrings([
    ...safeStringArray(report?.priorityStack),
    ...safeStringArray(normalizedConstitution.requiredInterventions),
  ]);

  const failureModeItems = uniqueStrings([
    ...safeStringArray(report?.failureModes),
    ...safeStringArray(normalizedConstitution.failureModes),
  ]);

  const requiredInterventionItems = uniqueStrings(
    safeStringArray(normalizedConstitution.requiredInterventions),
  );

  return {
    schemaVersion: "canonical-report-v2",
    generatedAt,
    reportId: `${campaignId}-canonical`,
    campaign: {
      id: campaignId,
      title: campaignTitle,
      organisationName,
      generatedAt,
    },
    registry: {
      model: safeString(args.registry?.model, "OGR-IV"),
      node: safeString(args.registry?.node, "Canary Wharf"),
      protocol: safeString(args.registry?.protocol, "Sovereign Protocol v2.2"),
    },
    sections: {
      executiveSummary: {
        title: "Executive Intelligence Brief",
        subtitle: organisationName,
        state: safeString(report?.state, normalizedConstitution.orgState),
        headline: safeString(
          report?.narrative?.headline,
          "Alignment condition assessed across core operating domains.",
        ),
        summary: safeString(
          report?.narrative?.summary,
          normalizedConstitution.narrativeSummary || guidance.summary,
        ),
        mandate: safeString(
          report?.narrative?.mandate,
          guidance.nextAction || "Restore structural order and execution discipline.",
        ),
      },

      constitutionalPosture: normalizedConstitution,

      strategicDomainAnalysis: {
        averageDissonance,
        domains,
      },

      financialExposure: {
        replacementCost,
        executionLoss,
        totalExposure,
        replacementCostFormatted: formatCurrencyGBP(replacementCost),
        executionLossFormatted: formatCurrencyGBP(executionLoss),
        totalExposureFormatted: formatCurrencyGBP(totalExposure),
      },

      integritySnapshot: {
        sovereignCertainty: safeNumber(
          report?.ogr?.sovereignCertainty,
          normalizedConstitution.clarityScore,
        ),
        burnoutIndex: safeNumber(
          report?.hcdAggregate?.overallBurnoutIndex,
          normalizedConstitution.severityScore,
        ),
        averageDissonance,
        authorized: safeBoolean(
          report?.ogr?.isAuthorizedToExecute,
          normalizedConstitution.route === "STRATEGY",
        ),
      },

      governedRecommendations: {
        summary: safeString(guidance?.summary, normalizedConstitution.narrativeSummary),
        nextAction: safeString(
          guidance?.nextAction,
          "Proceed according to governed recommendation sequence.",
        ),
        rationale: uniqueStrings(safeStringArray(guidance?.rationale)),
        recommendations,
      },

      priorityStack: {
        items: priorityStackItems,
      },

      failureModes: {
        items: failureModeItems,
      },

      requiredInterventions: {
        items: requiredInterventionItems,
      },

      dominantDomains: {
        items: uniqueStrings(safeStringArray(normalizedConstitution.dominantDomains)),
      },

      worldviewAnchors: {
        items: uniqueStrings(safeStringArray(normalizedConstitution.worldviewAnchors)),
      },

      sponsorTypes: {
        items: uniqueStrings(safeStringArray(normalizedConstitution.sponsorTypes)),
      },

      rationale: {
        items: uniqueStrings(safeStringArray(normalizedConstitution.rationale)),
      },
    },
  };
}