import { prisma } from "@/lib/prisma.server";
import { evaluateAggregationSafety } from "@/lib/product/multi-user-privacy";
import { createSuppressionInput } from "@/lib/product/suppression-event-helpers";
import { recordSuppression } from "@/lib/product/suppression-ledger";

export type OrganisationDivergenceType =
  | "AUTHORITY_PERCEPTION_GAP"
  | "BLOCKER_CONTRADICTION"
  | "COST_ESTIMATE_DIVERGENCE"
  | "CONDITION_CLASS_MISMATCH"
  | "EXECUTION_CONFIDENCE_GAP"
  | "STRATEGIC_PRIORITY_SPLIT"
  | "EVIDENCE_QUALITY_GAP";

export type OrganisationDivergenceSummary = {
  type: OrganisationDivergenceType;
  affectedDomain: string;
  respondentCount: number;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  sampleSafety: "SAFE" | "SMALL_SAMPLE_SUPPRESSED" | "IDENTITY_RISK" | "INSUFFICIENT_RESPONSES";
  mode: "NAMED" | "ANONYMOUS";
  direction?: "WORSENING" | "IMPROVING" | "STABLE" | null;
  sponsorSafeSummary: string;
  suppressedDetailCount: number;
  recommendedNextAction: string;
};

function parseMoney(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.match(/£\s?([\d,]+(?:\.\d+)?)/i) || value.match(/\b([\d,]+(?:\.\d+)?)\b/);
  if (!match?.[1]) return null;
  const amount = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function overlap(a: string | null | undefined, b: string | null | undefined): number {
  const tokens = (value: string | null | undefined) =>
    new Set((value || "").toLowerCase().split(/\W+/).filter((item) => item.length > 3));
  const left = tokens(a);
  const right = tokens(b);
  if (!left.size || !right.size) return 0;
  let shared = 0;
  for (const token of left) {
    if (right.has(token)) shared += 1;
  }
  return shared / Math.max(left.size, right.size);
}

export async function loadOrganisationDivergenceSummary(input: {
  organisationId: string;
}): Promise<{
  summaries: OrganisationDivergenceSummary[];
  warnings: string[];
}> {
  const organisation = await prisma.organisation.findUnique({
    where: { id: input.organisationId },
    select: { id: true, slug: true, name: true },
  });
  if (!organisation) {
    return { summaries: [], warnings: ["Organisation could not be resolved for divergence analysis."] };
  }

  const journeys = await prisma.diagnosticJourney.findMany({
    where: {
      OR: [
        { organisationKey: organisation.slug },
        { organisation: organisation.name },
      ],
    },
    include: {
      decisionObjects: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          decisionText: true,
          costOfDelayText: true,
        },
      },
      evidenceNodes: {
        orderBy: { createdAt: "desc" },
        take: 4,
        select: {
          kind: true,
          summary: true,
          label: true,
        },
      },
      stages: {
        select: { stage: true },
      },
    },
    take: 12,
  });

  const respondentCount = journeys.length;
  const sampleSafety = evaluateAggregationSafety({
    campaignMode: "ANONYMOUS",
    responseCount: respondentCount,
    minimumSafeResponses: 3,
  });
  if (sampleSafety === "INSUFFICIENT_RESPONSES" || sampleSafety === "SMALL_SAMPLE_SUPPRESSED") {
    await recordSuppression(createSuppressionInput({
      scopeId: organisation.id,
      scopeType: "ORGANISATION",
      surface: "ORGANISATION_DIVERGENCE_SUMMARY",
      fieldName: "organisationDivergence",
      evidenceSource: "Organisation divergence analysis",
      evidencePosture: "SYSTEM_INFERRED",
      sourceLabel: "Organisation divergence",
      suppressionReason: "Insufficient sample.",
      suppressionRule: "SMALL_SAMPLE_SUPPRESSED",
      suppressionRuleCategory: "SMALL_SAMPLE",
      operatorReviewAvailable: true,
    })).catch(() => null);
    return {
      summaries: [],
      warnings: ["Organisation divergence is suppressed because the available respondent sample is below the safe threshold."],
    };
  }

  const summaries: OrganisationDivergenceSummary[] = [];
  const latestDecisions = journeys.map((journey) => ({
    decisionText: journey.decisionObjects[0]?.decisionText ?? null,
    costOfDelay: parseMoney(journey.decisionObjects[0]?.costOfDelayText ?? null),
    contradiction: journey.evidenceNodes.find((node) => node.kind === "contradiction")?.summary
      || journey.evidenceNodes.find((node) => node.kind === "contradiction")?.label
      || null,
    stageCount: journey.stages.length,
  }));

  const costs = latestDecisions.map((item) => item.costOfDelay).filter((value): value is number => Boolean(value));
  if (costs.length >= 2) {
    const min = Math.min(...costs);
    const max = Math.max(...costs);
    if (min > 0 && max / min >= 3) {
      summaries.push({
        type: "COST_ESTIMATE_DIVERGENCE",
        affectedDomain: "Cost posture",
        respondentCount,
        confidence: max / min >= 5 ? "HIGH" : "MEDIUM",
        sampleSafety,
        mode: "ANONYMOUS",
        sponsorSafeSummary: "Respondents materially disagree on the scale of cost exposure. Sponsor view remains aggregated until intervention review is commissioned.",
        suppressedDetailCount: respondentCount,
        recommendedNextAction: "Reconcile cost assumptions before any board-grade decision path is finalised.",
      });
    }
  }

  const contradictionTexts = latestDecisions.map((item) => item.contradiction).filter((value): value is string => Boolean(value));
  if (contradictionTexts.length >= 2) {
    const lowOverlapPairs = contradictionTexts.some((value, index) =>
      contradictionTexts.slice(index + 1).some((other) => overlap(value, other) < 0.1)
    );
    if (lowOverlapPairs) {
      summaries.push({
        type: "BLOCKER_CONTRADICTION",
        affectedDomain: "Blocker narrative",
        respondentCount,
        confidence: "MEDIUM",
        sampleSafety,
        mode: "ANONYMOUS",
        sponsorSafeSummary: "Respondents are describing materially different blockers for the same organisational pressure. Raw respondent text remains suppressed.",
        suppressedDetailCount: contradictionTexts.length,
        recommendedNextAction: "Run a divergence review before treating any single blocker narrative as authoritative.",
      });
    }
  }

  const stageCounts = latestDecisions.map((item) => item.stageCount);
  if (stageCounts.length >= 2) {
    const min = Math.min(...stageCounts);
    const max = Math.max(...stageCounts);
    if (max - min >= 3) {
      summaries.push({
        type: "EVIDENCE_QUALITY_GAP",
        affectedDomain: "Evidence maturity",
        respondentCount,
        confidence: "MEDIUM",
        sampleSafety,
        mode: "ANONYMOUS",
        sponsorSafeSummary: "Evidence maturity is uneven across respondents or organisational slices. Aggregated interpretation is available, but respondent-level detail remains withheld.",
        suppressedDetailCount: respondentCount,
        recommendedNextAction: "Raise the weaker evidence slice before drawing enterprise-wide conclusions.",
      });
    }
  }

  const decisionTexts = latestDecisions.map((item) => item.decisionText).filter((value): value is string => Boolean(value));
  if (decisionTexts.length >= 2) {
    const splitDetected = decisionTexts.some((value, index) =>
      decisionTexts.slice(index + 1).some((other) => overlap(value, other) < 0.08)
    );
    if (splitDetected) {
      summaries.push({
        type: "STRATEGIC_PRIORITY_SPLIT",
        affectedDomain: "Decision priority",
        respondentCount,
        confidence: "LOW",
        sampleSafety,
        mode: "ANONYMOUS",
        sponsorSafeSummary: "Decision focus appears split across respondents. The current organisation picture may reflect competing priorities rather than aligned interpretation.",
        suppressedDetailCount: respondentCount,
        recommendedNextAction: "Confirm the priority order before escalating to board or retainer-wide action.",
      });
    }
  }

  return { summaries, warnings: [] };
}
