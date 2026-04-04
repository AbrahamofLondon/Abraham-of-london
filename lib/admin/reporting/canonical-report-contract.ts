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
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
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
  return Array.isArray(value)
    ? value.map((item) => safeString(item)).filter(Boolean)
    : [];
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
    summary: safeString(rec.summary, "Governed recommendation."),
    reasons: safeStringArray(rec.reasons),
  };
}

function formatCurrencyGBP(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

export type CanonicalReportContract = {
  schemaVersion: "canonical-report-v1";
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
  args: BuildCanonicalReportContractArgs
): CanonicalReportContract {
  const report = args.report || {};
  const constitution = args.constitution;
  const guidance = args.guidance;

  const averageDissonance = safeNumber(
    report?.resonance?.telemetry?.averageDissonance
  );

  const domains = Array.isArray(report?.resonance?.telemetry?.domains)
    ? report.resonance.telemetry.domains.map((domain: AnyRecord) => ({
        label: safeString(domain.label),
        intent: safeNumber(domain.intent),
        reality: safeNumber(domain.reality),
        dissonance: safeNumber(domain.dissonance),
      }))
    : [];

  const replacementCost = safeNumber(report?.financialExposure?.replacementCost);
  const executionLoss = safeNumber(report?.financialExposure?.executionLoss);
  const totalExposure = safeNumber(report?.financialExposure?.totalExposure);

  const recommendations = Array.isArray(guidance?.recommendations)
    ? guidance.recommendations.map(normalizeRecommendation)
    : [];

  const generatedAt = safeString(
    args.campaign?.generatedAt,
    new Date().toISOString()
  );

  const campaignId = safeString(args.campaign?.id);
  const campaignTitle = safeString(
    args.campaign?.title,
    "Executive Alignment Campaign"
  );
  const organisationName = safeString(
    args.campaign?.organisationName,
    "Unknown organisation"
  );

  return {
    schemaVersion: "canonical-report-v1",
    generatedAt,
    reportId: campaignId ? `${campaignId}-canonical` : "canonical-report",
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
        state: safeString(report?.state, "DRIFTING"),
        headline: safeString(
          report?.narrative?.headline,
          "Alignment condition assessed across core operating domains."
        ),
        summary: safeString(
          report?.narrative?.summary,
          constitution.narrativeSummary || guidance.summary
        ),
        mandate: safeString(
          report?.narrative?.mandate,
          guidance.nextAction || "Restore structural order and execution discipline."
        ),
      },

      constitutionalPosture: {
        ...constitution,
        dominantDomains: safeStringArray(constitution.dominantDomains),
        failureModes: safeStringArray(constitution.failureModes),
        requiredInterventions: safeStringArray(constitution.requiredInterventions),
        sponsorTypes: safeStringArray(constitution.sponsorTypes),
        worldviewAnchors: safeStringArray(constitution.worldviewAnchors),
        rationale: safeStringArray(constitution.rationale),
      },

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
        sovereignCertainty: safeNumber(report?.ogr?.sovereignCertainty),
        burnoutIndex: safeNumber(report?.hcdAggregate?.overallBurnoutIndex),
        averageDissonance,
        authorized: safeBoolean(report?.ogr?.isAuthorizedToExecute),
      },

      governedRecommendations: {
        summary: safeString(guidance?.summary),
        nextAction: safeString(guidance?.nextAction),
        rationale: safeStringArray(guidance?.rationale),
        recommendations,
      },

      priorityStack: {
        items: Array.isArray(report?.priorityStack)
          ? report.priorityStack.map((x: unknown) => safeString(x)).filter(Boolean)
          : safeStringArray(constitution.requiredInterventions),
      },

      failureModes: {
        items: Array.isArray(report?.failureModes)
          ? report.failureModes.map((x: unknown) => safeString(x)).filter(Boolean)
          : safeStringArray(constitution.failureModes),
      },

      requiredInterventions: {
        items: safeStringArray(constitution.requiredInterventions),
      },

      dominantDomains: {
        items: safeStringArray(constitution.dominantDomains),
      },

      worldviewAnchors: {
        items: safeStringArray(constitution.worldviewAnchors),
      },

      sponsorTypes: {
        items: safeStringArray(constitution.sponsorTypes),
      },

      rationale: {
        items: safeStringArray(constitution.rationale),
      },
    },
  };
}