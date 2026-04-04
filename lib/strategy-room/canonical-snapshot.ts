// lib/strategy-room/canonical-snapshot.ts

import type {
  CanonicalSections,
  CanonicalSectionsEnvelope,
} from "@/lib/decision/canonical-sections";

export type CanonicalSectionsSnapshot = {
  schemaVersion: "canonical-sections-snapshot-v1";
  capturedAt: string;
  source: string;
  sessionKey?: string | null;
  sections: CanonicalSections;
};

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

export function normalizeCanonicalSectionsSnapshot(input: {
  envelope?: CanonicalSectionsEnvelope | null;
  sections?: CanonicalSections | null;
  source: string;
  sessionKey?: string | null;
}): CanonicalSectionsSnapshot | null {
  const sections = input.envelope?.sections ?? input.sections;
  if (!sections) return null;

  return {
    schemaVersion: "canonical-sections-snapshot-v1",
    capturedAt: new Date().toISOString(),
    source: safeString(input.source, "unknown"),
    sessionKey: input.sessionKey ?? null,
    sections: {
      executiveSummary: {
        title: safeString(sections.executiveSummary?.title),
        subtitle: safeString(sections.executiveSummary?.subtitle),
        state: safeString(sections.executiveSummary?.state),
        headline: safeString(sections.executiveSummary?.headline),
        summary: safeString(sections.executiveSummary?.summary),
        mandate: safeString(sections.executiveSummary?.mandate),
      },

      constitutionalPosture: {
        route:
          safeString(sections.constitutionalPosture?.route) === "STRATEGY"
            ? "STRATEGY"
            : safeString(sections.constitutionalPosture?.route) === "DIAGNOSTIC"
            ? "DIAGNOSTIC"
            : "REJECT",
        priority: safeString(sections.constitutionalPosture?.priority),
        temperature: safeString(sections.constitutionalPosture?.temperature),
        orgState: safeString(sections.constitutionalPosture?.orgState),
        readinessTier: safeString(sections.constitutionalPosture?.readinessTier),
        authorityType: safeString(sections.constitutionalPosture?.authorityType),
        revenueBand: safeString(sections.constitutionalPosture?.revenueBand),
        marketRiskBand: safeString(sections.constitutionalPosture?.marketRiskBand),

        clarityScore: safeNumber(sections.constitutionalPosture?.clarityScore),
        authorityScore: safeNumber(sections.constitutionalPosture?.authorityScore),
        governanceScore: safeNumber(sections.constitutionalPosture?.governanceScore),
        severityScore: safeNumber(sections.constitutionalPosture?.severityScore),
        revenueScore: safeNumber(sections.constitutionalPosture?.revenueScore),

        dominantDomains: safeStringArray(
          sections.constitutionalPosture?.dominantDomains
        ),
        failureModes: safeStringArray(
          sections.constitutionalPosture?.failureModes
        ),
        requiredInterventions: safeStringArray(
          sections.constitutionalPosture?.requiredInterventions
        ),
        sponsorTypes: safeStringArray(
          sections.constitutionalPosture?.sponsorTypes
        ),
        worldviewAnchors: safeStringArray(
          sections.constitutionalPosture?.worldviewAnchors
        ),

        narrativeSummary: safeString(
          sections.constitutionalPosture?.narrativeSummary
        ),
        rationale: safeStringArray(sections.constitutionalPosture?.rationale),
      },

      strategicDomainAnalysis: {
        averageDissonance: safeNumber(
          sections.strategicDomainAnalysis?.averageDissonance
        ),
        domains: Array.isArray(sections.strategicDomainAnalysis?.domains)
          ? sections.strategicDomainAnalysis.domains.map((domain) => ({
              label: safeString(domain?.label),
              intent: safeNumber(domain?.intent),
              reality: safeNumber(domain?.reality),
              dissonance: safeNumber(domain?.dissonance),
            }))
          : [],
      },

      financialExposure: {
        replacementCost: safeNumber(sections.financialExposure?.replacementCost),
        executionLoss: safeNumber(sections.financialExposure?.executionLoss),
        totalExposure: safeNumber(sections.financialExposure?.totalExposure),
        replacementCostFormatted: safeString(
          sections.financialExposure?.replacementCostFormatted
        ),
        executionLossFormatted: safeString(
          sections.financialExposure?.executionLossFormatted
        ),
        totalExposureFormatted: safeString(
          sections.financialExposure?.totalExposureFormatted
        ),
      },

      integritySnapshot: {
        sovereignCertainty: safeNumber(
          sections.integritySnapshot?.sovereignCertainty
        ),
        burnoutIndex: safeNumber(sections.integritySnapshot?.burnoutIndex),
        averageDissonance: safeNumber(
          sections.integritySnapshot?.averageDissonance
        ),
        authorized: safeBoolean(sections.integritySnapshot?.authorized),
      },

      governedRecommendations: {
        summary: safeString(sections.governedRecommendations?.summary),
        nextAction: safeString(sections.governedRecommendations?.nextAction),
        rationale: safeStringArray(sections.governedRecommendations?.rationale),
        recommendations: Array.isArray(
          sections.governedRecommendations?.recommendations
        )
          ? sections.governedRecommendations.recommendations.map((item) => ({
              id: safeString(item?.id),
              title: safeString(item?.title),
              href:
                typeof item?.href === "string" && item.href.trim().length
                  ? item.href.trim()
                  : null,
              kind: safeString(item?.kind),
              score: safeNumber(item?.score),
              summary: safeString(item?.summary),
              reasons: safeStringArray(item?.reasons),
            }))
          : [],
      },

      priorityStack: {
        items: safeStringArray(sections.priorityStack?.items),
      },

      failureModes: {
        items: safeStringArray(sections.failureModes?.items),
      },

      requiredInterventions: {
        items: safeStringArray(sections.requiredInterventions?.items),
      },

      dominantDomains: {
        items: safeStringArray(sections.dominantDomains?.items),
      },

      worldviewAnchors: {
        items: safeStringArray(sections.worldviewAnchors?.items),
      },

      sponsorTypes: {
        items: safeStringArray(sections.sponsorTypes?.items),
      },

      rationale: {
        items: safeStringArray(sections.rationale?.items),
      },
    },
  };
}