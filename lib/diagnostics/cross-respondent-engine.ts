import { prisma } from "@/lib/prisma";
import type { DiagnosticEvidenceNodeInput, EvidenceSeverity } from "@/lib/diagnostics/evidence-graph";

export type RespondentDiagnosticInput = {
  respondentId: string;
  role?: string | null;
  respondentType?: string | null;
  isExecutive?: boolean;
  completedAt?: Date | string | null;
  scores: Record<string, number>;
  condition?: string | null;
};

export type CrossRespondentPayload = {
  primaryOrganisationalCondition: string;
  primaryDivergence: string | null;
  secondaryDivergence: string | null;
  sharedAgreementCluster: string[];
  highCostContradiction: string | null;
  routedNextStep: "monitor" | "executive_reporting" | "strategy_room";
  agreementZones: string[];
  divergenceZones: Array<{ domain: string; spread: number; average: number }>;
  authorityDisagreement: number;
  structuralDisagreement: number;
  crossExecutiveContradictionSeverity: EvidenceSeverity;
  mostExpensiveDivergence: string | null;
};

export type CrossRespondentResult = {
  payload: CrossRespondentPayload;
  evidenceNodes: DiagnosticEvidenceNodeInput[];
};

function avg(values: number[]): number {
  if (!values.length) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100;
}

function spread(values: number[]): number {
  if (!values.length) return 0;
  return Math.max(...values) - Math.min(...values);
}

function severityFromSpread(value: number): EvidenceSeverity {
  if (value >= 45) return "critical";
  if (value >= 30) return "high";
  if (value >= 16) return "medium";
  return "low";
}

function routeFromSeverity(severity: EvidenceSeverity): CrossRespondentPayload["routedNextStep"] {
  if (severity === "critical" || severity === "high") return "strategy_room";
  if (severity === "medium") return "executive_reporting";
  return "monitor";
}

function domainValues(respondents: RespondentDiagnosticInput[], domain: string): number[] {
  return respondents
    .map((respondent) => respondent.scores[domain])
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
}

function parseJsonObject(value: unknown): Record<string, unknown> {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function aggregateCrossRespondentDiagnostics(
  respondents: RespondentDiagnosticInput[],
): CrossRespondentResult {
  const domains = [...new Set(respondents.flatMap((respondent) => Object.keys(respondent.scores)))];
  const divergenceZones = domains
    .map((domain) => {
      const values = domainValues(respondents, domain);
      return { domain, spread: spread(values), average: avg(values) };
    })
    .filter((zone) => zone.spread >= 15)
    .sort((a, b) => b.spread - a.spread);

  const agreementZones = domains
    .filter((domain) => {
      const values = domainValues(respondents, domain);
      return values.length >= 2 && spread(values) <= 8;
    })
    .sort();

  const authorityZone = divergenceZones.find((zone) =>
    /authority|mandate|governance|decision/i.test(zone.domain),
  );
  const structuralZone = divergenceZones.find((zone) =>
    /structure|constraint|execution|friction|coordination/i.test(zone.domain),
  );
  const primary = divergenceZones[0] || null;
  const secondary = divergenceZones[1] || null;
  const severity = severityFromSpread(primary?.spread || 0);
  const lowDomains = domains
    .map((domain) => ({ domain, average: avg(domainValues(respondents, domain)) }))
    .sort((a, b) => a.average - b.average);

  const primaryOrganisationalCondition = primary
    ? `Perception divergence concentrated in ${primary.domain}.`
    : lowDomains[0]
      ? `Shared condition concentrated in ${lowDomains[0].domain}.`
      : "Insufficient respondent evidence.";

  const mostExpensiveDivergence = authorityZone?.domain || structuralZone?.domain || primary?.domain || null;
  const highCostContradiction = mostExpensiveDivergence
    ? `Stakeholders do not perceive ${mostExpensiveDivergence} consistently.`
    : null;

  const payload: CrossRespondentPayload = {
    primaryOrganisationalCondition,
    primaryDivergence: primary ? primary.domain : null,
    secondaryDivergence: secondary ? secondary.domain : null,
    sharedAgreementCluster: agreementZones,
    highCostContradiction,
    routedNextStep: routeFromSeverity(severity),
    agreementZones,
    divergenceZones,
    authorityDisagreement: authorityZone?.spread || 0,
    structuralDisagreement: structuralZone?.spread || 0,
    crossExecutiveContradictionSeverity: severity,
    mostExpensiveDivergence,
  };

  const evidenceNodes: DiagnosticEvidenceNodeInput[] = [];
  if (primary) {
    evidenceNodes.push({
      sourceStage: "team",
      kind: "respondent_divergence",
      label: "Primary respondent divergence",
      summary: `${primary.domain} spread is ${primary.spread} points.`,
      confidence: Math.min(0.95, 0.45 + respondents.length / 10),
      severity,
      payload: primary,
    });
  }
  if (agreementZones.length) {
    evidenceNodes.push({
      sourceStage: "team",
      kind: "respondent_agreement",
      label: "Shared agreement cluster",
      summary: `Respondents agree on ${agreementZones.slice(0, 3).join(", ")}.`,
      confidence: Math.min(0.92, 0.5 + respondents.length / 12),
      severity: "low",
      payload: { agreementZones },
    });
  }
  if (authorityZone) {
    evidenceNodes.push({
      sourceStage: "team",
      kind: "leadership_gap",
      label: "Authority disagreement",
      summary: `Authority-related perception gap is ${authorityZone.spread} points.`,
      confidence: 0.82,
      severity: severityFromSpread(authorityZone.spread),
      payload: authorityZone,
    });
  }
  if (highCostContradiction) {
    evidenceNodes.push({
      sourceStage: "enterprise",
      kind: "stakeholder_conflict",
      label: "High-cost stakeholder contradiction",
      summary: highCostContradiction,
      confidence: 0.78,
      severity,
      payload: { mostExpensiveDivergence },
    });
  }

  return { payload, evidenceNodes };
}

export async function aggregateCampaignRespondents(campaignId: string): Promise<CrossRespondentResult> {
  const p = prisma as any;
  const campaign = await p.alignmentCampaign.findUnique({
    where: { id: campaignId },
    include: {
      organisation: true,
      participants: { include: { membership: true, assessments: true } },
    },
  });
  if (!campaign) throw new Error("Campaign not found.");

  const respondents: RespondentDiagnosticInput[] = [];
  for (const participant of campaign.participants || []) {
    const latest = [...(participant.assessments || [])].sort((a: any, b: any) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    )[0];
    if (!latest) continue;
    const domainScores = parseJsonObject(latest.domainScoresJson);
    const scores: Record<string, number> = {};
    for (const [key, value] of Object.entries(domainScores)) {
      if (typeof value === "number" && Number.isFinite(value)) scores[key] = value;
    }
    respondents.push({
      respondentId: participant.id,
      role: participant.membership?.roleTitle ?? null,
      respondentType: participant.respondentType ?? (latest.isExecutive ? "executive" : "respondent"),
      isExecutive: Boolean(latest.isExecutive),
      completedAt: latest.submittedAt,
      scores,
      condition: latest.band,
    });
  }

  const result = aggregateCrossRespondentDiagnostics(respondents);

  if (p.multiStakeholderResult?.upsert) {
    await p.multiStakeholderResult.upsert({
      where: {
        campaignId_diagnosticType: {
          campaignId,
          diagnosticType: campaign.diagnosticType || "enterprise",
        },
      },
      create: {
        campaignId,
        organisationId: campaign.organisationId || null,
        organisationKey: campaign.organisation?.slug || null,
        diagnosticType: campaign.diagnosticType || "enterprise",
        respondentCount: respondents.length,
        payload: result.payload,
        evidenceNodes: result.evidenceNodes,
      },
      update: {
        organisationId: campaign.organisationId || null,
        organisationKey: campaign.organisation?.slug || null,
        respondentCount: respondents.length,
        payload: result.payload,
        evidenceNodes: result.evidenceNodes,
      },
    });
  }

  if (result.evidenceNodes.length && p.diagnosticEvidenceNode?.createMany) {
    await p.diagnosticEvidenceNode.createMany({
      data: result.evidenceNodes.map((node) => ({
        sessionId: campaignId,
        sourceStage: node.sourceStage,
        kind: node.kind,
        label: node.label,
        summary: node.summary,
        evidenceText: node.evidenceText || null,
        confidence: node.confidence,
        severity: node.severity,
        payload: node.payload || null,
      })),
    }).catch(() => null);
  }

  return result;
}
