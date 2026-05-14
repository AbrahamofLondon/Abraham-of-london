import { prisma } from "@/lib/prisma.server";
import { evaluateOrganisationAccess } from "@/lib/product/organisation-access";
import { buildClientSafeOversightBrief } from "@/lib/product/client-safe-oversight-brief";
import { composeOversightBrief } from "@/lib/product/oversight-brief-composer";
import type { EnterpriseControlRoomSection, EnterpriseControlRoomSnapshot } from "@/lib/product/enterprise-control-room-contract";
import { assertEnterpriseControlRoomSafety, sanitizeEnterpriseControlRoomSnapshot } from "@/lib/product/enterprise-control-room-safety";
import { deriveOversightCadenceState } from "@/lib/product/oversight-cadence-engine";
import { loadCounselHistory } from "@/lib/product/counsel-history-loader";
import { loadBoardroomArchiveSummary } from "@/lib/product/boardroom-archive";
import { loadPreviousArchivedOversightCycle } from "@/lib/product/oversight-cycle-archive";
import { loadOrganisationDivergenceSummary } from "@/lib/product/organisation-divergence-summary";
import { buildVisibilityRetainedFromOversightBrief } from "@/lib/product/visibility-retained";
import { loadControlRoomState } from "@/lib/product/control-room-state-loader";

function insufficient<T>(key: EnterpriseControlRoomSection<T>["key"], title: string, summary: string): EnterpriseControlRoomSection<T> {
  return { key, title, status: "INSUFFICIENT_EVIDENCE", summary, data: null };
}

function live<T>(key: EnterpriseControlRoomSection<T>["key"], title: string, summary: string, data: T): EnterpriseControlRoomSection<T> {
  return { key, title, status: "LIVE", summary, data };
}

export async function loadEnterpriseControlRoom(input: {
  userId?: string | null;
  email?: string | null;
  organisationId?: string | null;
  accountId?: string | null;
}): Promise<EnterpriseControlRoomSnapshot> {
  const contract = input.accountId
    ? await prisma.retainerContract.findUnique({
        where: { id: input.accountId },
        select: { id: true, organisationId: true, tier: true },
      })
    : null;
  const organisationId = input.organisationId ?? contract?.organisationId ?? null;
  let accessAllowed = true;
  let accessReason: string | null = null;

  if (organisationId) {
    const access = await evaluateOrganisationAccess({
      userId: input.userId,
      email: input.email,
      organisationId,
      requestedScope: "CONTROL_ROOM_VIEW",
    });
    accessAllowed = access.allowed;
    accessReason = access.reason;
  }

  if (!accessAllowed) {
    return {
      accountId: input.accountId ?? null,
      organisationId,
      generatedAt: new Date().toISOString(),
      commandState: {
        governanceStatus: "INSUFFICIENT_EVIDENCE",
        deterioratingDecisionCount: 0,
        recurringPatternCount: 0,
        closingOptionCount: 0,
        irreversibleRiskCount: 0,
        unresolvedCounselCount: 0,
        repeatedBoardroomExposureCount: 0,
        breachedCommitmentCount: 0,
        worseningDivergenceCount: 0,
        leadershipDecisionNowCount: 0,
      },
      cadence: null,
      sections: [insufficient("COMMAND_STATE", "Command State", accessReason ?? "Organisation access denied.")],
      sponsorRequiredActions: [],
      visibilityRetained: null,
      warnings: [accessReason ?? "Organisation access denied."],
    };
  }

  const composed = await composeOversightBrief({
    userId: input.userId ?? undefined,
    email: input.email ?? undefined,
    organisationId: organisationId ?? undefined,
  });

  const brief = composed.brief;
  if (!brief) {
    return {
      accountId: input.accountId ?? null,
      organisationId,
      generatedAt: new Date().toISOString(),
      commandState: {
        governanceStatus: "INSUFFICIENT_EVIDENCE",
        deterioratingDecisionCount: 0,
        recurringPatternCount: 0,
        closingOptionCount: 0,
        irreversibleRiskCount: 0,
        unresolvedCounselCount: 0,
        repeatedBoardroomExposureCount: 0,
        breachedCommitmentCount: 0,
        worseningDivergenceCount: 0,
        leadershipDecisionNowCount: 0,
      },
      cadence: null,
      sections: [insufficient("COMMAND_STATE", "Command State", "No sponsor-safe command state can be produced because the current evidence base is too thin.")],
      sponsorRequiredActions: [],
      visibilityRetained: null,
      warnings: composed.warnings,
    };
  }

  const sponsorSafe = buildClientSafeOversightBrief({
    brief,
    audience: "CLIENT_SPONSOR",
    access: {
      allowed: true,
      role: "SPONSOR",
      scopes: ["CONTROL_ROOM_VIEW"],
      reason: "Enterprise Control Room sponsor-safe view.",
      privacyBoundary: {
        canViewRawResponses: false,
        canViewNamedRespondents: false,
        canViewAggregates: true,
        smallSampleSuppressionApplies: true,
      },
    },
  }).brief;

  const previousCycle = input.accountId
    ? await loadPreviousArchivedOversightCycle({
        accountId: input.accountId,
        beforePeriodStart: new Date().toISOString(),
      }).catch(() => null)
    : null;

  const cadence = contract
    ? deriveOversightCadenceState({
        tier: contract.tier === "INSTITUTIONAL" ? "INSTITUTIONAL_COMMAND" : contract.tier === "OPERATIONAL" ? "EXECUTIVE_OVERSIGHT" : "GOVERNED_CONTINUITY",
        latestArchivedCycle: previousCycle?.record
          ? {
              periodEnd: previousCycle.record.periodEnd,
              createdAt: previousCycle.record.createdAt,
              approvedAt: previousCycle.record.approvedAt,
              deliveredAt: previousCycle.record.deliveredAt,
              deliveryStatus: previousCycle.record.deliveryStatus,
            }
          : null,
        counselOpen: sponsorSafe.counsel.requiredNow > 0,
        evidenceInsufficient: sponsorSafe.activeCases.length === 0,
      })
    : null;

  const counselHistory = await loadCounselHistory({
    caseIds: sponsorSafe.activeCases.map((item) => item.caseId),
  }).catch(() => null);
  const boardroomArchive = await loadBoardroomArchiveSummary({
    organisationId,
    caseIds: sponsorSafe.activeCases.map((item) => item.caseId),
  }).catch(() => null);
  const divergence = organisationId
    ? await loadOrganisationDivergenceSummary({
        organisationId,
      }).catch(() => ({ summaries: [], warnings: ["Organisation divergence memory could not be loaded."] }))
    : { summaries: [], warnings: [] };

  const sponsorRequiredActions = sponsorSafe.structuredActions?.map((item) => item.action) ?? sponsorSafe.requiredActions;
  const controlRoomState = organisationId
    ? await loadControlRoomState({
        userId: input.userId ?? null,
        email: input.email ?? null,
        organisationId,
      }).catch(() => ({ state: undefined }))
    : { state: undefined };
  const sections: Array<EnterpriseControlRoomSection<unknown>> = [];

  sections.push(live("COMMAND_STATE", "Command State", sponsorSafe.executiveSummary, {
    activeCases: sponsorSafe.activeCases.length,
    reviewsTriggered: sponsorSafe.counsel.reviewsTriggered,
    boardroomDossiers: sponsorSafe.boardroom.dossiersAvailable,
  }));
  sections.push(
    sponsorSafe.activeCases.length > 0
      ? live("ACTIVE_GOVERNED_DECISIONS", "Active Governed Decisions", `${sponsorSafe.activeCases.length} governed decision(s) are currently under review.`, sponsorSafe.activeCases)
      : insufficient("ACTIVE_GOVERNED_DECISIONS", "Active Governed Decisions", "No governed decision list can be published because the current cycle has insufficient evidence."),
  );
  sections.push(
    sponsorSafe.patternRecurrence
      ? live("PATTERN_RECURRENCE_MAP", "Pattern Recurrence Map", sponsorSafe.patternRecurrence.explanation, sponsorSafe.patternRecurrence)
      : insufficient("PATTERN_RECURRENCE_MAP", "Pattern Recurrence Map", "Insufficient evidence to state whether patterns are recurring."),
  );
  sections.push(
    sponsorSafe.costOfInaction || sponsorSafe.irreversibility
      ? live("COST_AND_IRREVERSIBILITY_REGISTER", "Cost and Irreversibility Register", sponsorSafe.irreversibility?.explanation ?? "Cost exposure is present.", {
          costOfInaction: sponsorSafe.costOfInaction ?? null,
          irreversibility: sponsorSafe.irreversibility ?? null,
          losses: sponsorSafe.decisionLosses ?? null,
        })
      : insufficient("COST_AND_IRREVERSIBILITY_REGISTER", "Cost and Irreversibility Register", "Insufficient evidence to state how cost or irreversibility is moving."),
  );
  sections.push(
    divergence.summaries.length > 0
      ? live("ORGANISATION_DIVERGENCE_MEMORY", "Organisation Divergence Memory", "Sponsor-safe divergence memory is available.", divergence.summaries)
      : insufficient("ORGANISATION_DIVERGENCE_MEMORY", "Organisation Divergence Memory", "No safe divergence memory is available for sponsor view."),
  );
  sections.push(
    boardroomArchive && boardroomArchive.totalDossiers > 0
      ? live("BOARDROOM_EXPOSURE_ARCHIVE", "Boardroom Exposure Archive", boardroomArchive.summary, boardroomArchive)
      : insufficient("BOARDROOM_EXPOSURE_ARCHIVE", "Boardroom Exposure Archive", "No boardroom archive memory is currently available."),
  );
  sections.push(
    counselHistory && counselHistory.totalEvents > 0
      ? live("COUNSEL_ESCALATION_LEDGER", "Counsel Escalation Ledger", counselHistory.summary, counselHistory)
      : insufficient("COUNSEL_ESCALATION_LEDGER", "Counsel Escalation Ledger", "No governed counsel ledger is currently available."),
  );
  sections.push(live("COMMITMENT_AND_OUTCOME_VERIFICATION", "Commitment and Outcome Verification", `${sponsorSafe.verification.commitmentsVerified} commitments verified and ${sponsorSafe.verification.unresolvedBreaches} unresolved breach(es) recorded.`, sponsorSafe.verification));
  sections.push(
    controlRoomState.state?.currentState.governanceEvidenceCoverage
      && controlRoomState.state.currentState.governanceEvidenceCoverage.suppressedCount === 0
      && controlRoomState.state.currentState.governanceEvidenceCoverage.totalCases > 0
      ? live(
          "GOVERNANCE_EVIDENCE_COVERAGE",
          "Governance Evidence Coverage",
          controlRoomState.state.currentState.governanceEvidenceCoverage.explanation,
          controlRoomState.state.currentState.governanceEvidenceCoverage,
        )
      : insufficient(
          "GOVERNANCE_EVIDENCE_COVERAGE",
          "Governance Evidence Coverage",
          controlRoomState.state?.currentState.governanceEvidenceCoverage?.explanation
            || "Evidence coverage is shown only where aggregation is safe.",
        ),
  );
  sections.push(
    sponsorSafe.strategicOptions?.options.length
      ? live("STRATEGIC_OPTIONS_CLOSING", "Strategic Options Closing", `${sponsorSafe.strategicOptions.options.filter((item) => item.status === "CLOSING" || item.status === "EXPIRED").length} option(s) are closing or expired.`, sponsorSafe.strategicOptions)
      : insufficient("STRATEGIC_OPTIONS_CLOSING", "Strategic Options Closing", "Insufficient evidence to state whether strategic options are closing."),
  );
  sections.push(
    sponsorSafe.decisionDependencies?.conflicts.length
      ? live("DEPENDENCY_RISK_MAP", "Dependency Risk Map", `${sponsorSafe.decisionDependencies.conflicts.length} dependency conflict(s) are currently tracked.`, sponsorSafe.decisionDependencies)
      : insufficient("DEPENDENCY_RISK_MAP", "Dependency Risk Map", "No dependency risk map can be published from the current evidence."),
  );
  sections.push(
    cadence
      ? live("CADENCE_AND_SLA_STATE", "Cadence and SLA State", cadence.explanation, cadence)
      : insufficient("CADENCE_AND_SLA_STATE", "Cadence and SLA State", "Cadence state is unavailable because no retained cycle context exists."),
  );
  sections.push(
    sponsorRequiredActions.length > 0
      ? live("SPONSOR_REQUIRED_ACTIONS", "Sponsor Required Actions", `${sponsorRequiredActions.length} sponsor action(s) currently require decision.`, sponsorRequiredActions)
      : insufficient("SPONSOR_REQUIRED_ACTIONS", "Sponsor Required Actions", "Insufficient evidence to publish sponsor-required actions."),
  );

  const visibilityRetained = buildVisibilityRetainedFromOversightBrief(sponsorSafe);
  sections.push(
    visibilityRetained.items.length > 0
      ? live("VISIBILITY_LOST_IF_OVERSIGHT_STOPS", "Visibility Lost If Oversight Stops", visibilityRetained.headline, visibilityRetained.items)
      : insufficient("VISIBILITY_LOST_IF_OVERSIGHT_STOPS", "Visibility Lost If Oversight Stops", "Insufficient evidence to state what visibility would reduce if oversight stopped."),
  );

  const snapshot: EnterpriseControlRoomSnapshot = {
    accountId: input.accountId ?? null,
    organisationId,
    generatedAt: new Date().toISOString(),
    commandState: {
      governanceStatus: cadence?.status === "PAUSED_BY_COUNSEL_ESCALATION"
        ? "PAUSED"
        : sponsorRequiredActions.length > 0
          ? "REVIEW_REQUIRED"
          : "UNDER_GOVERNANCE",
      deterioratingDecisionCount: sponsorSafe.cycleConsequenceProjection?.likelyMovement.filter((item) => item.direction === "WORSENING").length ?? 0,
      recurringPatternCount: sponsorSafe.patternRecurrence?.priorCount ?? 0,
      closingOptionCount: sponsorSafe.strategicOptions?.options.filter((item) => item.status === "CLOSING" || item.status === "EXPIRED").length ?? 0,
      irreversibleRiskCount: (sponsorSafe.irreversibility?.score ?? 0) >= 60 ? 1 : 0,
      unresolvedCounselCount: counselHistory?.openCount ?? sponsorSafe.counsel.requiredNow,
      repeatedBoardroomExposureCount: boardroomArchive?.repeatedExposureCount ?? 0,
      breachedCommitmentCount: sponsorSafe.verification.unresolvedBreaches,
      worseningDivergenceCount: divergence.summaries.filter((item) => item.direction === "WORSENING").length,
      leadershipDecisionNowCount: sponsorRequiredActions.length,
    },
    cadence,
    sections,
    sponsorRequiredActions,
    visibilityRetained,
    warnings: [...composed.warnings, ...divergence.warnings],
  };

  const sanitized = sanitizeEnterpriseControlRoomSnapshot(snapshot);
  sanitized.warnings = [...sanitized.warnings, ...assertEnterpriseControlRoomSafety(sanitized)];
  return sanitized;
}
