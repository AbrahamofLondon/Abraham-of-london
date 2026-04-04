// lib/decision/canonical-sections.ts

export type CanonicalRecommendation = {
  id: string;
  title: string;
  href?: string | null;
  kind: string;
  score: number;
  summary: string;
  reasons: string[];
};

export type CanonicalSections = {
  executiveSummary: {
    title: string;
    subtitle: string;
    state: string;
    headline: string;
    summary: string;
    mandate: string;
  };
  constitutionalPosture: {
    route: "REJECT" | "DIAGNOSTIC" | "STRATEGY";
    priority: string;
    temperature: string;
    orgState: string;
    readinessTier: string;
    authorityType: string;
    revenueBand: string;
    marketRiskBand: string;
    clarityScore: number;
    authorityScore: number;
    governanceScore: number;
    severityScore: number;
    revenueScore: number;
    dominantDomains: string[];
    failureModes: string[];
    requiredInterventions: string[];
    sponsorTypes: string[];
    worldviewAnchors: string[];
    narrativeSummary: string;
    rationale: string[];
  };
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
    recommendations: CanonicalRecommendation[];
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

export type CanonicalSectionsEnvelope = {
  ok?: boolean;
  sections: CanonicalSections;
  diagnostics?: {
    assetPoolSize: number;
    matchedAssetCount: number;
    governanceRuleCount: number;
    governanceSuppressedCount: number;
    adaptiveAssetsLoaded: number;
    contextualAssetsLoaded: number;
  };
  error?: string;
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

function safeArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => safeString(item)).filter(Boolean)
    : [];
}

function safeRecommendations(value: unknown): CanonicalRecommendation[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => ({
    id: safeString(item?.id),
    title: safeString(item?.title, "Untitled recommendation"),
    href:
      typeof item?.href === "string" && item.href.trim().length
        ? item.href.trim()
        : null,
    kind: safeString(item?.kind, "guidance"),
    score: safeNumber(item?.score),
    summary: safeString(item?.summary, "Governed recommendation."),
    reasons: safeArray(item?.reasons),
  }));
}

export function coerceCanonicalSectionsEnvelope(
  input: any
): CanonicalSectionsEnvelope {
  if (input?.sections) {
    return {
      ok: typeof input?.ok === "boolean" ? input.ok : true,
      sections: input.sections as CanonicalSections,
      diagnostics: input?.diagnostics,
      error: input?.error,
    };
  }

  const constitution = input?.constitution ?? {};
  const guidance = input?.guidance ?? {};
  const diagnostics = input?.diagnostics ?? undefined;

  const sections: CanonicalSections = {
    executiveSummary: {
      title: safeString(input?.title, "Decision Guidance"),
      subtitle: safeString(input?.subtitle, "Strategy Room"),
      state: safeString(constitution?.orgState, "DRIFTING"),
      headline: safeString(
        input?.headline,
        "Decision-grade posture issued against submitted constitutional signal."
      ),
      summary: safeString(
        guidance?.summary,
        safeString(constitution?.narrativeSummary)
      ),
      mandate: safeString(
        guidance?.nextAction,
        "Proceed according to the surfaced governed next action."
      ),
    },
    constitutionalPosture: {
      route: (safeString(constitution?.route, "DIAGNOSTIC") ||
        "DIAGNOSTIC") as "REJECT" | "DIAGNOSTIC" | "STRATEGY",
      priority: safeString(constitution?.priority, "MEDIUM"),
      temperature: safeString(constitution?.temperature, "WARM"),
      orgState: safeString(constitution?.orgState, "DRIFTING"),
      readinessTier: safeString(constitution?.readinessTier, "EMERGING"),
      authorityType: safeString(constitution?.authorityType, "UNCLEAR"),
      revenueBand: safeString(constitution?.revenueBand, "UNSPECIFIED"),
      marketRiskBand: safeString(constitution?.marketRiskBand, "MODERATE"),
      clarityScore: safeNumber(constitution?.clarityScore),
      authorityScore: safeNumber(constitution?.authorityScore),
      governanceScore: safeNumber(constitution?.governanceScore),
      severityScore: safeNumber(constitution?.severityScore),
      revenueScore: safeNumber(constitution?.revenueScore),
      dominantDomains: safeArray(constitution?.dominantDomains),
      failureModes: safeArray(constitution?.failureModes),
      requiredInterventions: safeArray(constitution?.requiredInterventions),
      sponsorTypes: safeArray(constitution?.sponsorTypes),
      worldviewAnchors: safeArray(constitution?.worldviewAnchors),
      narrativeSummary: safeString(
        constitution?.narrativeSummary,
        safeString(guidance?.summary)
      ),
      rationale: safeArray(constitution?.rationale),
    },
    strategicDomainAnalysis: {
      averageDissonance: safeNumber(input?.averageDissonance),
      domains: Array.isArray(input?.domains)
        ? input.domains.map((domain: any) => ({
            label: safeString(domain?.label),
            intent: safeNumber(domain?.intent),
            reality: safeNumber(domain?.reality),
            dissonance: safeNumber(domain?.dissonance),
          }))
        : [],
    },
    financialExposure: {
      replacementCost: safeNumber(input?.financialExposure?.replacementCost),
      executionLoss: safeNumber(input?.financialExposure?.executionLoss),
      totalExposure: safeNumber(input?.financialExposure?.totalExposure),
      replacementCostFormatted: safeString(
        input?.financialExposure?.replacementCostFormatted,
        "£0"
      ),
      executionLossFormatted: safeString(
        input?.financialExposure?.executionLossFormatted,
        "£0"
      ),
      totalExposureFormatted: safeString(
        input?.financialExposure?.totalExposureFormatted,
        "£0"
      ),
    },
    integritySnapshot: {
      sovereignCertainty: safeNumber(input?.integrity?.sovereignCertainty),
      burnoutIndex: safeNumber(input?.integrity?.burnoutIndex),
      averageDissonance: safeNumber(input?.integrity?.averageDissonance),
      authorized: safeBoolean(input?.integrity?.authorized),
    },
    governedRecommendations: {
      summary: safeString(guidance?.summary),
      nextAction: safeString(guidance?.nextAction),
      rationale: safeArray(guidance?.rationale),
      recommendations: safeRecommendations(guidance?.recommendations),
    },
    priorityStack: {
      items: safeArray(input?.priorityStack?.items ?? constitution?.requiredInterventions),
    },
    failureModes: {
      items: safeArray(input?.failureModes?.items ?? constitution?.failureModes),
    },
    requiredInterventions: {
      items: safeArray(
        input?.requiredInterventions?.items ?? constitution?.requiredInterventions
      ),
    },
    dominantDomains: {
      items: safeArray(input?.dominantDomains?.items ?? constitution?.dominantDomains),
    },
    worldviewAnchors: {
      items: safeArray(input?.worldviewAnchors?.items ?? constitution?.worldviewAnchors),
    },
    sponsorTypes: {
      items: safeArray(input?.sponsorTypes?.items ?? constitution?.sponsorTypes),
    },
    rationale: {
      items: safeArray(input?.rationale?.items ?? constitution?.rationale),
    },
  };

  return {
    ok: typeof input?.ok === "boolean" ? input.ok : true,
    sections,
    diagnostics,
    error: input?.error,
  };
}

export function hasCanonicalSections(obj: unknown): obj is CanonicalSectionsEnvelope {
  if (!obj || typeof obj !== 'object') return false;
  
  const candidate = obj as Partial<CanonicalSectionsEnvelope>;
  
  // Check if it has a sections property with required fields
  if (!candidate.sections || typeof candidate.sections !== 'object') return false;
  
  const sections = candidate.sections as Partial<CanonicalSections>;
  
  // Check for the core required sections
  if (!sections.executiveSummary) return false;
  if (!sections.constitutionalPosture) return false;
  if (!sections.governedRecommendations) return false;
  
  // Check executiveSummary has required fields
  const summary = sections.executiveSummary;
  if (typeof summary.title !== 'string') return false;
  if (typeof summary.state !== 'string') return false;
  if (typeof summary.summary !== 'string') return false;
  
  // Check constitutionalPosture has required fields
  const posture = sections.constitutionalPosture;
  if (typeof posture.route !== 'string') return false;
  if (typeof posture.orgState !== 'string') return false;
  if (typeof posture.readinessTier !== 'string') return false;
  
  // Check governedRecommendations has required fields
  const recommendations = sections.governedRecommendations;
  if (typeof recommendations.summary !== 'string') return false;
  if (typeof recommendations.nextAction !== 'string') return false;
  if (!Array.isArray(recommendations.recommendations)) return false;
  
  return true;
}