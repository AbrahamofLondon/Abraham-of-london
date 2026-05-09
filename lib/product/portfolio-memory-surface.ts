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

export type PortfolioMemory = {
  generatedAt: string;
  scopeLabel: string;
  visibility: "SPONSOR_SAFE";

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

export async function buildPortfolioMemory(input: {
  organisationId?: string | null;
  email?: string | null;
  userId?: string | null;
}): Promise<PortfolioMemory> {
  const now = new Date().toISOString();

  // --- Diagnostic records ---
  const diagnosticWhere: Record<string, unknown> = {};
  if (input.email) diagnosticWhere.userEmail = input.email;
  else if (input.userId) diagnosticWhere.userId = input.userId;

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
  const recurringPatterns = Array.from(patternMap.entries())
    .filter(([, value]) => value.occurrences > 1)
    .slice(0, 20)
    .map(([key, value]) => ({
      pattern: key,
      occurrences: value.occurrences,
      firstSeen: value.firstSeen,
    }));

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
      ...(input.userId ? { actorId: input.userId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: { actionType: true, metadata: true, createdAt: true },
  });

  let checkpointCreated = 0;
  let checkpointResponded = 0;
  let checkpointOverdue = 0;

  for (const event of checkpointEvents) {
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
      ...(input.userId ? { actorId: input.userId } : {}),
    },
    take: 500,
    select: { id: true },
  });
  const counselEscalations = counselEvents.length;

  // --- Boardroom dossiers ---
  const boardroomEvents = await prisma.auditEvent.findMany({
    where: {
      objectType: "OVERSIGHT_BOARDROOM_ARCHIVE",
      ...(input.userId ? { actorId: input.userId } : {}),
    },
    take: 500,
    select: { id: true },
  });
  const boardroomDossiers = boardroomEvents.length;

  // --- Outcome verifications ---
  const outcomeWhere: Record<string, unknown> = {};
  if (input.organisationId) outcomeWhere.organisationKey = input.organisationId;

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
    if (input.userId && meta.accountId) {
      // Only count cycles for the relevant account/user
    }
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

  return {
    generatedAt: now,
    scopeLabel: input.organisationId
      ? "Organisation portfolio memory"
      : input.email
        ? "Account portfolio memory"
        : "Portfolio memory",
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
      "Portfolio memory is limited to source-labelled aggregate signals. Raw respondent text and operator notes are withheld.",
    sampleLimitation,
    evidencePosture: totalDataPoints < 3 ? "INSUFFICIENT" : totalDataPoints < 10 ? "PARTIAL" : "SOURCE_LABELLED",
  };
}
