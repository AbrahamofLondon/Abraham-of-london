import { prisma } from "@/lib/prisma.server";
import { createSuppressionInput } from "@/lib/product/suppression-event-helpers";
import { recordSuppression } from "@/lib/product/suppression-ledger";
import { evaluateAggregationSafety } from "@/lib/product/multi-user-privacy";
import type { PortfolioScopeResolution } from "@/lib/product/portfolio-scope-resolver";

export type CrossScopePatternCategory = {
  id:
    | "repeated_contradiction_themes"
    | "repeated_cadence_failures"
    | "repeated_checkpoint_response_patterns"
    | "recurring_counsel_escalation_reasons"
    | "recurring_boardroom_exposure_themes"
    | "recurring_outcome_verification_gaps"
    | "organisation_divergence";
  label: string;
  occurrences: number;
  summary: string;
  insufficientSample: boolean;
};

export type CrossOrgPatternIntelligence = {
  scopeMode: PortfolioScopeResolution["scopeMode"];
  organisationCount: number;
  authorisedScopeCount: number;
  thinState: boolean;
  depth: "FOUNDATION_READY" | "SELECTIVELY_DEFENSIBLE" | "DEFENSIBLE";
  categories: CrossScopePatternCategory[];
  suppressionNotice: string | null;
};

function makeCategory(
  id: CrossScopePatternCategory["id"],
  label: string,
  occurrences: number,
  summary: string,
  insufficientSample = false,
): CrossScopePatternCategory {
  return { id, label, occurrences, summary, insufficientSample };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normaliseComparableId(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function buildScopeMatcher(input: {
  organisationIds: string[];
  contractIds: string[];
}) {
  const organisationIds = new Set(input.organisationIds.filter(Boolean));
  const contractIds = new Set(input.contractIds.filter(Boolean));

  return (value: unknown) => {
    const meta = asRecord(value);
    const candidates = [
      normaliseComparableId(meta.scopeId),
      normaliseComparableId(meta.organisationId),
      normaliseComparableId(meta.contractId),
      normaliseComparableId(meta.accountId),
      normaliseComparableId(meta.retainerContractId),
      normaliseComparableId(meta.objectId),
    ].filter((candidate): candidate is string => Boolean(candidate));
    if (candidates.some((candidate) => organisationIds.has(candidate) || contractIds.has(candidate))) {
      return true;
    }

    const nested = [asRecord(meta.entry), asRecord(meta.payload), asRecord(meta.internalBrief)];
    return nested.some((item) => {
      const nestedCandidates = [
        normaliseComparableId(item.scopeId),
        normaliseComparableId(item.organisationId),
        normaliseComparableId(item.contractId),
        normaliseComparableId(item.accountId),
      ].filter((candidate): candidate is string => Boolean(candidate));
      return nestedCandidates.some((candidate) => organisationIds.has(candidate) || contractIds.has(candidate));
    });
  };
}

export async function buildCrossOrgPatternIntelligence(
  resolution: PortfolioScopeResolution,
): Promise<CrossOrgPatternIntelligence> {
  if (resolution.scopes.length === 0) {
    return {
      scopeMode: resolution.scopeMode,
      organisationCount: 0,
      authorisedScopeCount: 0,
      thinState: true,
      depth: "FOUNDATION_READY",
      categories: [],
      suppressionNotice: "Insufficient sample.",
    };
  }

  const organisationIds = resolution.scopes.map((scope) => scope.organisationId);
  const organisationSlugs = resolution.scopes.map((scope) => scope.organisationSlug);
  const contractIds = resolution.scopes.map((scope) => scope.contractId);
  const matchesScope = buildScopeMatcher({ organisationIds, contractIds });
  const aggregationSafety = evaluateAggregationSafety({
    campaignMode: "ANONYMOUS",
    responseCount: resolution.scopeMode === "single_org" ? resolution.authorisedScopeCount : resolution.authorisedOrganisationCount,
    minimumSafeResponses: resolution.scopeMode === "single_org" ? 2 : 3,
  });

  if (aggregationSafety !== "SAFE") {
    const scopeId = resolution.scopeMode === "single_org" ? (organisationIds[0] ?? "portfolio") : "portfolio";
    await recordSuppression(createSuppressionInput({
      scopeId,
      scopeType: resolution.scopeMode === "single_org" ? "ORGANISATION" : "PORTFOLIO",
      surface: "CROSS_SCOPE_PATTERN_SUMMARY",
      fieldName: "crossScopePatterns",
      evidenceSource: "Cross-scope aggregate intelligence",
      evidencePosture: "SYSTEM_INFERRED",
      sourceLabel: "Cross-scope pattern intelligence",
      suppressionReason: "Insufficient sample.",
      suppressionRule: "SMALL_SAMPLE_SUPPRESSED",
      suppressionRuleCategory: "SMALL_SAMPLE",
      operatorReviewAvailable: true,
    })).catch(() => null);

    return {
      scopeMode: resolution.scopeMode,
      organisationCount: resolution.authorisedOrganisationCount,
      authorisedScopeCount: resolution.authorisedScopeCount,
      thinState: true,
      depth: "FOUNDATION_READY",
      categories: [],
      suppressionNotice: "Insufficient sample.",
    };
  }

  const [contradictions, cycles, checkpoints, counsel, boardroom, outcomes] = await Promise.all([
    prisma.diagnosticEvidenceNode.count({
      where: {
        kind: "contradiction",
        journey: {
          organisationKey: { in: organisationSlugs },
        },
      },
    }).catch(() => 0),
    prisma.diagnosticRecord.findMany({
      where: {
        diagnosticType: "retained_review_cycle",
      },
      select: {
        responsesJson: true,
      },
      take: 500,
    }).catch(() => []),
    prisma.auditEvent.findMany({
      where: {
        objectType: { in: ["CHECKPOINT", "CHECKPOINT_CREATED", "CHECKPOINT_RESPONSE"] },
      },
      select: { actionType: true, metadata: true },
      take: 500,
    }).catch(() => []),
    prisma.auditEvent.findMany({
      where: {
        objectType: "OVERSIGHT_COUNSEL_WORKFLOW",
      },
      select: { summary: true, metadata: true },
      take: 300,
    }).catch(() => []),
    prisma.auditEvent.findMany({
      where: {
        objectType: "OVERSIGHT_BOARDROOM_ARCHIVE",
      },
      select: { summary: true, metadata: true },
      take: 300,
    }).catch(() => []),
    prisma.outcomeVerificationRecord.findMany({
      where: {
        organisationKey: { in: organisationSlugs },
      },
      select: {
        outcomeClassification: true,
      },
      take: 300,
    }).catch(() => []),
  ]);

  const cadenceFailures = cycles.reduce((total, row) => {
    try {
      const parsed = JSON.parse(row.responsesJson || "{}") as { accountId?: string; cadenceState?: string; organisationId?: string };
      if (!contractIds.includes(parsed.accountId || "") && !organisationIds.includes(parsed.organisationId || "")) return total;
      return ["OVERDUE", "ESCALATED", "CADENCE_BROKEN", "SKIPPED_WITH_REASON", "REVIEW_SKIPPED"].includes(parsed.cadenceState || "")
        ? total + 1
        : total;
    } catch {
      return total;
    }
  }, 0);

  const checkpointFailures = checkpoints.reduce((total, event) => {
    if (!matchesScope(event.metadata)) return total;
    const meta = event.metadata && typeof event.metadata === "object" ? event.metadata as Record<string, unknown> : {};
    if (event.actionType === "BLOCKED" || meta.status === "OVERDUE" || meta.status === "ABANDONED") return total + 1;
    return total;
  }, 0);

  const counselReasons = counsel.filter((event) => {
    if (!matchesScope(event.metadata)) return false;
    const summary = event.summary.toLowerCase();
    return summary.includes("counsel") || summary.includes("escalat");
  }).length;

  const boardroomThemes = boardroom.filter((event) =>
    matchesScope(event.metadata) && event.summary.toLowerCase().includes("board")
  ).length;
  const outcomeGaps = outcomes.filter((record) =>
    ["ACTION_BLOCKED", "SYSTEM_FINDING_DISPUTED"].includes(record.outcomeClassification)
  ).length;
  const divergenceSignals = Math.max(0, resolution.authorisedOrganisationCount - 1);

  const categories: CrossScopePatternCategory[] = [
    makeCategory(
      "repeated_contradiction_themes",
      "Repeated contradiction themes",
      contradictions,
      contradictions > 0 ? `${contradictions} contradiction signals recur across the authorised retained scope.` : "Insufficient sample.",
      contradictions === 0,
    ),
    makeCategory(
      "repeated_cadence_failures",
      "Repeated cadence failures",
      cadenceFailures,
      cadenceFailures > 0 ? `${cadenceFailures} cadence failures have recurred across the authorised retained scope.` : "Insufficient sample.",
      cadenceFailures === 0,
    ),
    makeCategory(
      "repeated_checkpoint_response_patterns",
      "Repeated checkpoint response patterns",
      checkpointFailures,
      checkpointFailures > 0 ? `${checkpointFailures} blocked, abandoned, or overdue checkpoint patterns recur across the authorised retained scope.` : "Insufficient sample.",
      checkpointFailures === 0,
    ),
    makeCategory(
      "recurring_counsel_escalation_reasons",
      "Recurring counsel escalation reasons",
      counselReasons,
      counselReasons > 0 ? `${counselReasons} counsel escalation events recur across the authorised retained scope.` : "Insufficient sample.",
      counselReasons === 0,
    ),
    makeCategory(
      "recurring_boardroom_exposure_themes",
      "Recurring boardroom exposure themes",
      boardroomThemes,
      boardroomThemes > 0 ? `${boardroomThemes} boardroom exposure themes recur across the authorised retained scope.` : "Insufficient sample.",
      boardroomThemes === 0,
    ),
    makeCategory(
      "recurring_outcome_verification_gaps",
      "Recurring outcome verification gaps",
      outcomeGaps,
      outcomeGaps > 0 ? `${outcomeGaps} blocked or disputed outcome verification gaps recur across the authorised retained scope.` : "Insufficient sample.",
      outcomeGaps === 0,
    ),
  ];

  if (resolution.scopeMode === "cross_org") {
    categories.push(
      makeCategory(
        "organisation_divergence",
        "Organisation divergence",
        divergenceSignals,
        divergenceSignals > 0
          ? `${divergenceSignals} authorised organisation divergence signal${divergenceSignals === 1 ? "" : "s"} are available only in aggregate form.`
          : "Insufficient sample.",
        divergenceSignals === 0,
      ),
    );
  }

  const strongCategories = categories.filter((item) => item.occurrences > 0).length;
  const depth = resolution.scopeMode === "cross_org" && strongCategories >= 4
    ? "DEFENSIBLE"
    : strongCategories >= 2
      ? "SELECTIVELY_DEFENSIBLE"
      : "FOUNDATION_READY";

  return {
    scopeMode: resolution.scopeMode,
    organisationCount: resolution.authorisedOrganisationCount,
    authorisedScopeCount: resolution.authorisedScopeCount,
    thinState: strongCategories === 0,
    depth,
    categories,
    suppressionNotice: null,
  };
}
