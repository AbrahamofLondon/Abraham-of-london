import type { OversightBrief } from "@/lib/product/oversight-brief-contract";
import type { OrganisationAccessDecision } from "@/lib/product/organisation-access-contract";
import type { OversightCycleAudience } from "@/lib/product/oversight-cycle-ledger-contract";
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

function cloneBrief(input: OversightBrief): OversightBrief {
  return {
    ...input,
    activeCases: input.activeCases.map((item) => ({ ...item })),
    requiredActions: [...input.requiredActions],
    costOfInaction: input.costOfInaction ? { ...input.costOfInaction } : undefined,
    counsel: { ...input.counsel },
    boardroom: { ...input.boardroom },
    cadence: input.cadence ? { ...input.cadence } : undefined,
    verification: { ...input.verification },
    counselHistory: input.counselHistory
      ? {
          ...input.counselHistory,
          entries: input.counselHistory.entries.map((item) => ({ ...item })),
        }
      : undefined,
    boardroomArchive: input.boardroomArchive ? { ...input.boardroomArchive } : undefined,
    organisationDivergence: input.organisationDivergence
      ? {
          ...input.organisationDivergence,
          items: input.organisationDivergence.items.map((item) => ({ ...item })),
        }
      : undefined,
    retainedEnforcement: input.retainedEnforcement ? { ...input.retainedEnforcement } : undefined,
    decisionCredit: input.decisionCredit ? { ...input.decisionCredit } : undefined,
    patternRecurrence: input.patternRecurrence ? { ...input.patternRecurrence } : undefined,
    decisionLosses: input.decisionLosses
      ? {
          ...input.decisionLosses,
          entries: input.decisionLosses.entries.map((item) => ({ ...item, evidenceBasis: [...item.evidenceBasis] })),
          warnings: [...input.decisionLosses.warnings],
        }
      : undefined,
    strategicOptions: input.strategicOptions
      ? {
          ...input.strategicOptions,
          options: input.strategicOptions.options.map((item) => ({ ...item, evidenceBasis: [...item.evidenceBasis] })),
          warnings: [...input.strategicOptions.warnings],
        }
      : undefined,
    decisionDependencies: input.decisionDependencies
      ? {
          ...input.decisionDependencies,
          conflicts: input.decisionDependencies.conflicts.map((item) => ({ ...item, evidenceBasis: [...item.evidenceBasis] })),
          warnings: [...input.decisionDependencies.warnings],
        }
      : undefined,
    irreversibility: input.irreversibility
      ? {
          ...input.irreversibility,
          drivers: input.irreversibility.drivers.map((item) => ({ ...item, evidenceBasis: [...item.evidenceBasis] })),
          warnings: [...input.irreversibility.warnings],
        }
      : undefined,
    cycleConsequenceProjection: input.cycleConsequenceProjection
      ? {
          ...input.cycleConsequenceProjection,
          likelyMovement: input.cycleConsequenceProjection.likelyMovement.map((item) => ({ ...item })),
        }
      : undefined,
    valueProtected: input.valueProtected
      ? {
          ...input.valueProtected,
          missedSignals: input.valueProtected.missedSignals.map((item) => ({ ...item })),
        }
      : undefined,
    cancellationLoss: input.cancellationLoss
      ? {
          ...input.cancellationLoss,
          lostVisibility: input.cancellationLoss.lostVisibility.map((item) => ({ ...item })),
        }
      : undefined,
    indispensability: input.indispensability
      ? {
          ...input.indispensability,
          wouldLose: [...input.indispensability.wouldLose],
          preservedVisibility: [...input.indispensability.preservedVisibility],
          basis: [...input.indispensability.basis],
        }
      : undefined,
    structuredActions: input.structuredActions?.map((item) => ({ ...item })),
  };
}

export function buildClientSafeOversightBrief(input: {
  brief: OversightBrief;
  access: OrganisationAccessDecision;
  audience?: OversightCycleAudience;
}): ClientSafeOversightBrief {
  const suppressions: OversightSuppression[] = [];
  const warnings: string[] = [];
  const { access } = input;
  const audience = input.audience ?? "CLIENT_SPONSOR";
  let brief = cloneBrief(input.brief);

  if (audience === "INTERNAL_OPERATOR") {
    return { brief, suppressions, warnings };
  }

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
        cadence: undefined,
        verification: { commitmentsDue: 0, commitmentsVerified: 0, unresolvedBreaches: 0 },
        counselHistory: undefined,
        boardroomArchive: undefined,
        organisationDivergence: undefined,
        retainedEnforcement: undefined,
        decisionCredit: undefined,
        decisionLosses: undefined,
        strategicOptions: undefined,
        decisionDependencies: undefined,
        irreversibility: undefined,
        cycleConsequenceProjection: undefined,
        valueProtected: undefined,
        cancellationLoss: undefined,
        indispensability: undefined,
        requiredActions: [],
        structuredActions: [],
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
      structuredActions: brief.structuredActions?.map((item) => ({
        ...item,
        decisionText: undefined,
      })),
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
      structuredActions: [],
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
      counselHistory: brief.counselHistory
        ? {
            ...brief.counselHistory,
            entries: brief.counselHistory.entries.map((item) => ({
              id: item.id,
              caseId: item.caseId,
              status: item.status,
              triggerReason: "Governed counsel escalation recorded.",
            })),
          }
        : undefined,
    };
    suppressions.push({
      section: "decisionCredit",
      reason: "OPERATOR_ONLY_SIGNAL",
      explanation: "Operator interpretation of decision credit has been removed from the client-safe brief.",
    });
  }

  if (audience === "BOARD_LEVEL") {
    brief = {
      ...brief,
      verification: {
        commitmentsDue: 0,
        commitmentsVerified: 0,
        unresolvedBreaches: brief.verification.unresolvedBreaches,
      },
      activeCases: brief.activeCases.map((item) => ({
        caseId: item.caseId,
        title: item.title,
        state: item.state,
        primaryRisk: item.primaryRisk,
      })),
      decisionDependencies: brief.decisionDependencies
        ? {
            ...brief.decisionDependencies,
            conflicts: brief.decisionDependencies.conflicts.filter((item) =>
              item.severity === "HIGH" || item.severity === "CRITICAL"
            ),
          }
        : undefined,
      structuredActions: brief.structuredActions?.filter((item) =>
        item.severity === "HIGH" || item.severity === "CRITICAL"
      ),
      counselHistory: brief.counselHistory
        ? {
            ...brief.counselHistory,
            entries: brief.counselHistory.entries.map((item) => ({
              ...item,
              triggerReason: item.triggerReason,
            })),
          }
        : undefined,
    };
    suppressions.push({
      section: "verification",
      reason: "OPERATOR_ONLY_SIGNAL",
      explanation: "Operational verification detail has been reduced to board-level consequence posture.",
    });
    warnings.push("Board-level brief suppresses operational clutter in favour of consequence and escalation posture.");
  }

  if (audience === "RESPONDENT_SAFE") {
    brief = {
      ...brief,
      activeCases: [],
      costOfInaction: undefined,
      counsel: { reviewsTriggered: 0, requiredNow: 0 },
      boardroom: { dossiersAvailable: 0, exportsQueued: 0 },
      cadence: undefined,
      verification: { commitmentsDue: 0, commitmentsVerified: 0, unresolvedBreaches: 0 },
      counselHistory: undefined,
      boardroomArchive: undefined,
      organisationDivergence: undefined,
      retainedEnforcement: undefined,
      decisionCredit: undefined,
      decisionLosses: undefined,
      strategicOptions: undefined,
      decisionDependencies: undefined,
      irreversibility: undefined,
      cycleConsequenceProjection: undefined,
      valueProtected: undefined,
      cancellationLoss: undefined,
      indispensability: undefined,
      requiredActions: [],
      structuredActions: [],
    };
    suppressions.push({
      section: "brief",
      reason: "CLIENT_VISIBILITY_RESTRICTED",
      explanation: "Respondent-safe view is limited to aggregate confirmation only.",
    });
    warnings.push("Respondent-safe brief suppresses sponsor and board conclusions.");
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
