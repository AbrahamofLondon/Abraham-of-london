import type { OversightBrief } from "@/lib/product/oversight-brief-contract";
import type { OrganisationAccessDecision } from "@/lib/product/organisation-access-contract";
import type { OversightSuppressionReason } from "@/lib/product/oversight-review-cycle-contract";

export type OversightSuppression = {
  section: string;
  reason: OversightSuppressionReason;
  explanation: string;
};

export type ClientSafeOversightBrief = {
  brief: OversightBrief;
  suppressions: OversightSuppression[];
  warnings: string[];
};

function genericCaseLabel(index: number): string {
  return `Active case ${index + 1}`;
}

export function buildClientSafeOversightBrief(input: {
  brief: OversightBrief;
  access: OrganisationAccessDecision;
}): ClientSafeOversightBrief {
  const suppressions: OversightSuppression[] = [];
  const warnings: string[] = [];
  const { access } = input;
  let brief: OversightBrief = {
    ...input.brief,
    activeCases: input.brief.activeCases.map((item) => ({ ...item })),
    requiredActions: [...input.brief.requiredActions],
    costOfInaction: input.brief.costOfInaction ? { ...input.brief.costOfInaction } : undefined,
    counsel: { ...input.brief.counsel },
    boardroom: { ...input.brief.boardroom },
    verification: { ...input.brief.verification },
    retainedEnforcement: input.brief.retainedEnforcement ? { ...input.brief.retainedEnforcement } : undefined,
    decisionCredit: input.brief.decisionCredit ? { ...input.brief.decisionCredit } : undefined,
  };

  if (!access.privacyBoundary.canViewAggregates) {
    suppressions.push({
      section: "brief",
      reason: "CLIENT_VISIBILITY_RESTRICTED",
      explanation: "Client-safe delivery cannot proceed because aggregate organisational visibility is not allowed for this reviewer.",
    });
    warnings.push("Aggregate organisational visibility is not permitted for the supplied access scope.");
    return {
      brief: {
        ...brief,
        activeCases: [],
        costOfInaction: undefined,
        counsel: { reviewsTriggered: 0, requiredNow: 0 },
        boardroom: { dossiersAvailable: 0, exportsQueued: 0 },
        verification: { commitmentsDue: 0, commitmentsVerified: 0, unresolvedBreaches: 0 },
        retainedEnforcement: undefined,
        decisionCredit: undefined,
        requiredActions: [],
      },
      suppressions,
      warnings,
    };
  }

  if (!access.privacyBoundary.canViewNamedRespondents) {
    brief = {
      ...brief,
      activeCases: brief.activeCases.map((item, index) => ({
        ...item,
        title: genericCaseLabel(index),
        nextAction: undefined,
      })),
      requiredActions: brief.requiredActions.map(() =>
        "A governed action remains required. Operator review has preserved the action while respondent-level detail remains suppressed."
      ),
    };
    suppressions.push({
      section: "activeCases",
      reason: "ANONYMOUS_CAMPAIGN_PROTECTED",
      explanation: "Respondent-identifying case labels and case-specific next actions have been suppressed for sponsor-safe delivery.",
    });
  }

  if (access.privacyBoundary.smallSampleSuppressionApplies && brief.activeCases.length > 0 && brief.activeCases.length < 5) {
    brief = {
      ...brief,
      activeCases: [],
      requiredActions: [],
    };
    suppressions.push({
      section: "activeCases",
      reason: "SMALL_SAMPLE_SUPPRESSED",
      explanation: "Some respondent-level detail has been suppressed because this campaign does not meet the visibility threshold for sponsor review.",
    });
    warnings.push("Small-sample suppression removed per-case detail from the client-safe brief.");
  }

  if (brief.decisionCredit?.interpretation) {
    brief = {
      ...brief,
      decisionCredit: {
        ...brief.decisionCredit,
        interpretation: undefined,
      },
    };
    suppressions.push({
      section: "decisionCredit",
      reason: "OPERATOR_ONLY_SIGNAL",
      explanation: "Operator interpretation of decision credit has been removed from the client-safe brief.",
    });
  }

  if (brief.requiredActions.length === 0 && input.brief.requiredActions.length > 0) {
    warnings.push("Required actions were suppressed to preserve privacy thresholds.");
  }

  return {
    brief,
    suppressions,
    warnings,
  };
}
