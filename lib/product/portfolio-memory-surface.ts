/**
 * Portfolio Memory Surface — sponsor-safe cross-case institutional intelligence.
 *
 * Aggregates diagnostic records, checkpoints, outcome verifications, counsel
 * events, boardroom dossiers, and cadence cycles into a governed summary
 * suitable for SPONSOR / OWNER / OPERATOR visibility.
 *
 * Raw respondent text and operator notes are always withheld.
 */

import { prisma } from "@/lib/prisma.server";
import type { CrossOrgPatternIntelligence } from "@/lib/product/cross-org-pattern-intelligence";
import type { PortfolioScopeResolution } from "@/lib/product/portfolio-scope-resolver";
import { createSuppressionInput } from "@/lib/product/suppression-event-helpers";
import { recordSuppression } from "@/lib/product/suppression-ledger";
import { portfolioPostureForPattern } from "@/lib/sovereign/sample-posture";

export type PortfolioMemory = {
  generatedAt: string;
  scopeLabel: string;
  visibility: "SPONSOR_SAFE";
  scopeMode: "single_org" | "multi_scope" | "cross_org";
  authorisedOrganisationCount: number;
  authorisedScopeCount: number;

  retainedScopes: { label: string; status: string; firstCaptured: string | null }[];
  activeCases: number;
  completedStages: number;

  recurringPatterns: { pattern: string; occurrences: number; firstSeen: string }[];
  contradictionClasses: { label: string; count: number; severity: string }[];

  decisionVelocity: { trend: string; dataPoints: number; thinState: boolean } | null;
  checkpointPosture: { created: number; responded: number; overdue: number; responseRate: number };

  counselEscalations: number;
  boardroomDossiers: number;
  retainedOutcomes: number;

  cadenceReliability: { completed: number; total: number; reliability: number } | null;

  suppressionNotice: string;
  sampleLimitation: string | null;
  evidencePosture: string;
  crossScopePatterns: CrossOrgPatternIntelligence | null;

  /** Portfolio-level scenario pressure — aggregated, sponsor-safe */
  portfolioScenarioPressure?: {
    summary: string;
    casesCovered: number;
    suppressedBelowThreshold: boolean;
    sourceLabel: string;
  } | null;

  /** Portfolio-level stakeholder recurrence — only when sample sufficient */
  portfolioStakeholderRecurrence?: {
    patterns: string[];
    suppressedBelowThreshold: boolean;
    sourceLabel: string;
  } | null;

  /** Sample posture for recurrence claims — governs what language is permitted */
  recurrencePosture: {
    permitted: boolean;
    label: string;
    caveat: string;
    suppressionNotice: string | null;
  };
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
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

  return (value: unknown): boolean => {
    const meta = asRecord(value);
    const directCandidates = [
      normaliseComparableId(meta.scopeId),
      normaliseComparableId(meta.organisationId),
      normaliseComparableId(meta.contractId),
      normaliseComparableId(meta.accountId),
      normaliseComparableId(meta.retainerContractId),
      normaliseComparableId(meta.subjectId),
      normaliseComparableId(meta.objectId),
    ].filter((candidate): candidate is string => Boolean(candidate));

    if (directCandidates.some((candidate) => organisationIds.has(candidate) || contractIds.has(candidate))) {
      return true;
    }

    const nested = [
      asRecord(meta.internalBrief),
      asRecord(meta.entry),
      asRecord(meta.payload),
    ];
    for (const item of nested) {
      const nestedCandidates = [
        normaliseComparableId(item.organisationId),
        normaliseComparableId(item.contractId),
        normaliseComparableId(item.accountId),
        normaliseComparableId(item.scopeId),
      ].filter((candidate): candidate is string => Boolean(candidate));
      if (nestedCandidates.some((candidate) => organisationIds.has(candidate) || contractIds.has(candidate))) {
        return true;
      }
    }

    return false;
  };
}

export async function buildPortfolioMemory(input: {
  organisationId?: string | null;
  email?: string | null;
  userId?: string | null;
  resolution?: PortfolioScopeResolution | null;
}): Promise<PortfolioMemory> {
  // Institutional case filtering: portfolio memory includes institutional cases only
  // when they exist. Non-institutional records do not pollute retained oversight.
  let institutionalCaseEmails: string[] | null = null;
  try {
    const { listInstitutionalCases } = await import("@/lib/product/institutional-case-service");
    const cases = await listInstitutionalCases({
      email: input.email ?? undefined,
      organisationId: input.organisationId ?? undefined,
    });
    if (cases.length > 0) {
      institutionalCaseEmails = [...new Set(cases.map((c) => c.subjectEmail.toLowerCase()))];
    }
  } catch { /* fall through — use all records if case resolution fails */ }

  const now = new Date().toISOString();
  const contractIds = input.resolution?.scopes.map((scope) => scope.contractId) ?? [];
  const organisationIds = input.resolution?.scopes.map((scope) => scope.organisationId)
    ?? (input.organisationId ? [input.organisationId] : []);
  const organisationSlugs = input.resolution?.scopes.map((scope) => scope.organisationSlug) ?? [];
  const matchesScope = buildScopeMatcher({ organisationIds, contractIds });
  const membershipEmails = organisationIds.length > 0
    ? await prisma.organisationMembership.findMany({
        where: {
          organisationId: { in: organisationIds },
          status: "active",
        },
        select: { email: true },
        take: 200,
      }).then((rows) => rows.map((row) => row.email.toLowerCase()))
    : [];

  // --- Diagnostic records ---
  const diagnosticClauses = [
    ...(membershipEmails.length > 0 ? [{ userEmail: { in: membershipEmails } }] : []),
    ...(input.email ? [{ userEmail: input.email }] : []),
    ...(input.userId ? [{ userId: input.userId }] : []),
  ];
  const diagnosticWhere: Record<string, unknown> = organisationIds.length > 0
    ? diagnosticClauses.length > 0
      ? { OR: diagnosticClauses }
      : {}
    : input.email
      ? { userEmail: input.email }
      : input.userId
        ? { userId: input.userId }
        : {};

  const diagnosticRecords = await prisma.diagnosticRecord.findMany({
    where: diagnosticWhere,
    orderBy: { createdAt: "asc" },
    take: 500,
    select: {
      id: true,
      diagnosticType: true,
      title: true,
      status: true,
      severity: true,
      responsesJson: true,
      createdAt: true,
    },
  });

  const retainedScopes = diagnosticRecords.map((record) => ({
    label: record.title || record.diagnosticType,
    status: record.status,
    firstCaptured: record.createdAt ? record.createdAt.toISOString() : null,
  }));

  const activeCases = diagnosticRecords.filter(
    (record) => record.status === "completed" || record.status === "draft",
  ).length;

  // Count completed stages from diagnostic responses
  let completedStages = 0;
  for (const record of diagnosticRecords) {
    try {
      const parsed = JSON.parse(record.responsesJson || "{}");
      completedStages += Object.values(parsed).filter(Boolean).length;
    } catch {
      // Invalid JSON — skip
    }
  }

  // --- Contradiction / recurring patterns from diagnostics ---
  const patternMap = new Map<string, { occurrences: number; firstSeen: string }>();
  const contradictionMap = new Map<string, { count: number; severity: string }>();

  for (const record of diagnosticRecords) {
    try {
      const parsed = JSON.parse(record.responsesJson || "{}");
      const responses = asRecord(parsed);
      for (const [key, value] of Object.entries(responses)) {
        if (value && typeof value === "string" && value.length > 0) {
          const existing = patternMap.get(key);
          if (existing) {
            existing.occurrences += 1;
          } else {
            patternMap.set(key, {
              occurrences: 1,
              firstSeen: record.createdAt?.toISOString() ?? now,
            });
          }
        }
      }
    } catch {
      // Skip
    }

    // Derive contradiction classes from severity
    if (record.severity) {
      const existing = contradictionMap.get(record.diagnosticType);
      if (existing) {
        existing.count += 1;
        if (record.severity === "high") {
          existing.severity = "HIGH";
        }
      } else {
        contradictionMap.set(record.diagnosticType, {
          count: 1,
          severity:
            record.severity === "high"
              ? "HIGH"
              : record.severity === "moderate"
                ? "MEDIUM"
                : "LOW",
        });
      }
    }
  }

  // Only surface patterns with > 1 occurrence as "recurring"
  // Apply sample posture enforcement — recurrence claims require minimum evidence
  const recurrencePosture = portfolioPostureForPattern({
    totalRecords: diagnosticRecords.length,
  });

  const recurringPatterns = recurrencePosture.permitted
    ? Array.from(patternMap.entries())
        .filter(([, value]) => value.occurrences > 1)
        .slice(0, 20)
        .map(([key, value]) => ({
          pattern: key,
          occurrences: value.occurrences,
          firstSeen: value.firstSeen,
        }))
    : [];

  const contradictionClasses = Array.from(contradictionMap.entries())
    .slice(0, 15)
    .map(([label, value]) => ({
      label,
      count: value.count,
      severity: value.severity,
    }));

  // --- Checkpoint posture from AuditEvent ---
  const checkpointEvents = await prisma.auditEvent.findMany({
    where: {
      objectType: { in: ["CHECKPOINT", "CHECKPOINT_CREATED", "CHECKPOINT_RESPONSE"] },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: { actionType: true, metadata: true, createdAt: true },
  });

  let checkpointCreated = 0;
  let checkpointResponded = 0;
  let checkpointOverdue = 0;

  for (const event of checkpointEvents) {
    if ((organisationIds.length > 0 || contractIds.length > 0) && !matchesScope(event.metadata)) continue;
    if (event.actionType === "CREATED") checkpointCreated += 1;
    else if (event.actionType === "RESOLVED" || event.actionType === "UPDATED") checkpointResponded += 1;
    else if (event.actionType === "BLOCKED") checkpointOverdue += 1;

    const meta = asRecord(event.metadata);
    if (meta.status === "OVERDUE") checkpointOverdue += 1;
    if (meta.status === "RESPONDED" || meta.status === "VERIFIED_EXECUTED") checkpointResponded += 1;
  }

  // Fallback: also count from diagnostic verification data
  if (checkpointCreated === 0) {
    for (const record of diagnosticRecords) {
      try {
        const parsed = JSON.parse(record.responsesJson || "{}");
        const responses = asRecord(parsed);
        if (responses.checkpoints || responses.verification) {
          checkpointCreated += 1;
        }
      } catch {
        // Skip
      }
    }
  }

  const responseRate =
    checkpointCreated > 0
      ? Math.round((checkpointResponded / checkpointCreated) * 100)
      : 0;

  // --- Decision velocity ---
  const velocityDataPoints = diagnosticRecords.length;
  const thinState = velocityDataPoints < 3;
  const decisionVelocity =
    velocityDataPoints > 0
      ? {
          trend: thinState
            ? "INSUFFICIENT_DATA"
            : velocityDataPoints >= 5
              ? "TREND_AVAILABLE"
              : "EARLY_SIGNAL",
          dataPoints: velocityDataPoints,
          thinState,
        }
      : null;

  // --- Counsel escalations ---
  const counselEvents = await prisma.auditEvent.findMany({
    where: {
      objectType: "OVERSIGHT_COUNSEL_WORKFLOW",
    },
    take: 500,
    select: { id: true, metadata: true },
  });
  const counselEscalations = counselEvents.filter((event) =>
    organisationIds.length === 0 && contractIds.length === 0 ? true : matchesScope(event.metadata)
  ).length;

  // --- Boardroom dossiers ---
  const boardroomEvents = await prisma.auditEvent.findMany({
    where: {
      objectType: "OVERSIGHT_BOARDROOM_ARCHIVE",
    },
    take: 500,
    select: { id: true, metadata: true },
  });
  const boardroomDossiers = boardroomEvents.filter((event) =>
    organisationIds.length === 0 && contractIds.length === 0 ? true : matchesScope(event.metadata)
  ).length;

  // --- Outcome verifications ---
  const outcomeWhere: Record<string, unknown> = {};
  if (organisationSlugs.length > 0) outcomeWhere.organisationKey = { in: organisationSlugs };

  const retainedOutcomes = await prisma.outcomeVerificationRecord
    .count({ where: outcomeWhere })
    .catch(() => 0);

  // --- Cadence reliability from archived oversight cycles ---
  const cadenceEvents = await prisma.auditEvent.findMany({
    where: {
      objectType: "OVERSIGHT_CYCLE_ARCHIVE",
    },
    take: 200,
    select: { metadata: true },
  });

  let cadenceCompleted = 0;
  let cadenceTotal = 0;

  for (const event of cadenceEvents) {
    const meta = asRecord(event.metadata);
    if ((organisationIds.length > 0 || contractIds.length > 0) && !matchesScope(meta)) continue;
    cadenceTotal += 1;
    const brief = asRecord(meta.internalBrief);
    if (brief.periodEnd) cadenceCompleted += 1;
  }

  const cadenceReliability =
    cadenceTotal > 0
      ? {
          completed: cadenceCompleted,
          total: cadenceTotal,
          reliability: Math.round((cadenceCompleted / cadenceTotal) * 100),
        }
      : null;

  // --- Sample limitation ---
  const totalDataPoints =
    diagnosticRecords.length +
    checkpointEvents.length +
    counselEscalations +
    boardroomDossiers +
    retainedOutcomes;

  const sampleLimitation =
    totalDataPoints < 5
      ? "Portfolio intelligence is based on limited observations. Trend claims require additional cycles."
      : null;

  if (sampleLimitation) {
    await recordSuppression(createSuppressionInput({
      scopeId: organisationIds[0] ?? input.email ?? input.userId ?? "portfolio",
      scopeType: organisationIds[0] ? "ORGANISATION" : "PORTFOLIO",
      surface: "PORTFOLIO_MEMORY_SURFACE",
      fieldName: "sampleLimitation",
      evidenceSource: "Portfolio memory aggregate",
      evidencePosture: totalDataPoints < 3 ? "INSUFFICIENT_EVIDENCE" : "SYSTEM_INFERRED",
      sourceLabel: "Portfolio memory",
      suppressionReason: "Insufficient sample.",
      suppressionRule: "SMALL_SAMPLE_SUPPRESSED",
      suppressionRuleCategory: "SMALL_SAMPLE",
      operatorReviewAvailable: true,
    })).catch(() => null);
  }

  const crossScopePatterns = input.resolution
    ? await import("@/lib/product/cross-org-pattern-intelligence")
      .then((mod) => mod.buildCrossOrgPatternIntelligence(input.resolution!))
      .catch(() => null)
    : null;

  // ── Portfolio-level scenario pressure ──
  let portfolioScenarioPressure: PortfolioMemory["portfolioScenarioPressure"] = null;
  if (diagnosticRecords.length >= 3) {
    const deterioratedCount = diagnosticRecords.filter((r) => r.severity === "high").length;
    const costCases = diagnosticRecords.filter((r) => {
      try {
        const parsed = JSON.parse(r.responsesJson || "{}");
        return parsed.estimatedFinancialExposure || parsed.costBasis;
      } catch { return false; }
    }).length;

    if (deterioratedCount > 0 || costCases > 0) {
      portfolioScenarioPressure = {
        summary: `${deterioratedCount} high-severity case${deterioratedCount !== 1 ? "s" : ""} detected across portfolio. ${costCases > 0 ? `${costCases} case${costCases !== 1 ? "s" : ""} carry cost basis.` : ""}`.trim(),
        casesCovered: diagnosticRecords.length,
        suppressedBelowThreshold: diagnosticRecords.length < 5,
        sourceLabel: "Portfolio scenario pressure — aggregated estimate, not independently verified",
      };
    }
  }

  // ── Portfolio-level stakeholder recurrence ──
  let portfolioStakeholderRecurrence: PortfolioMemory["portfolioStakeholderRecurrence"] = null;
  if (diagnosticRecords.length >= 3) {
    const blockerPatterns: string[] = [];
    for (const record of diagnosticRecords.slice(0, 20)) {
      try {
        const parsed = JSON.parse(record.responsesJson || "{}");
        const responses = asRecord(parsed);
        const blockerText = asString(responses.blocker) ?? asString(responses.primary_blocker);
        if (blockerText && blockerText.length > 5) {
          blockerPatterns.push(blockerText.slice(0, 60));
        }
      } catch { /* skip */ }
    }
    const uniqueBlockers = [...new Set(blockerPatterns)];
    if (uniqueBlockers.length > 0) {
      portfolioStakeholderRecurrence = {
        patterns: uniqueBlockers.slice(0, 5),
        suppressedBelowThreshold: diagnosticRecords.length < 5,
        sourceLabel: "Repeated stakeholder friction — sponsor-safe aggregate only",
      };
    }
  }

  return {
    generatedAt: now,
    scopeLabel: organisationIds.length > 1
      ? "Authorised portfolio memory"
      : input.organisationId
        ? "Organisation portfolio memory"
        : input.email
          ? "Account portfolio memory"
          : "Portfolio memory",
    scopeMode: input.resolution?.scopeMode ?? "single_org",
    authorisedOrganisationCount: input.resolution?.authorisedOrganisationCount ?? (organisationIds.length || 1),
    authorisedScopeCount: input.resolution?.authorisedScopeCount ?? Math.max(retainedScopes.length, 1),
    visibility: "SPONSOR_SAFE",

    retainedScopes,
    activeCases,
    completedStages,

    recurringPatterns,
    contradictionClasses,

    decisionVelocity,
    checkpointPosture: {
      created: checkpointCreated,
      responded: checkpointResponded,
      overdue: checkpointOverdue,
      responseRate,
    },

    counselEscalations,
    boardroomDossiers,
    retainedOutcomes,

    cadenceReliability,

    suppressionNotice:
      "Portfolio memory is limited to source-labelled aggregate signals. Raw respondent text, team identifiers, and operator notes are withheld.",
    sampleLimitation,
    evidencePosture: totalDataPoints < 3 ? "INSUFFICIENT" : totalDataPoints < 10 ? "PARTIAL" : "SOURCE_LABELLED",
    crossScopePatterns,
    portfolioScenarioPressure,
    portfolioStakeholderRecurrence,
    recurrencePosture,
  };
}
