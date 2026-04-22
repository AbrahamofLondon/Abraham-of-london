/**
 * lib/analytics/decision-journey.ts — Server-side decision journey instrumentation
 *
 * Tracks decision progression through the governed system.
 * Persists to DB. No vanity metrics — only decision progression and revenue.
 */

import { prisma } from "@/lib/prisma.server";
import { ConvictionState } from "./conviction-state";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type JourneyStage =
  | "landing"
  | "evidence_viewed"
  | "evidence_scrolled"
  | "evidence_exited"
  | "evidence_cta_click"
  | "bundle_click"
  | "diagnostic_start"
  | "diagnostic_complete"
  | "diagnostic_abandon"
  | "team_mode_selected"
  | "campaign_created"
  | "first_respondent"
  | "campaign_closed"
  | "enterprise_complete"
  | "exec_gate_view"
  | "exec_purchase_start"
  | "exec_purchase"
  | "exec_run_start"
  | "exec_report_generated"
  | "watch_state"
  | "watch_followup"
  | "asset_purchase_start"
  | "asset_purchase"
  | "asset_open"
  | "asset_started"
  | "asset_complete"
  | "asset_abandoned"
  | "asset_escalated"
  | "asset_transition"
  | "strategy_gate_view"
  | "strategy_viewed"
  | "strategy_checkout_start"
  | "strategy_completed"
  | "strategy_exited"
  | "strategy_attempt"
  | "strategy_allowed"
  | "strategy_blocked"
  | "hesitation_time_on_cta"
  | "hesitation_repeated_scroll"
  | "hesitation_exit_after_hover"
  | "home_scroll_50"
  | "home_scroll_90"
  | "evidence_scroll_80"
  | "instrument_hesitation"
  | "instrument_card_hover"
  | "report_hesitation"
  | "strategy_hesitation"
  | "conviction_advance"
  | "cta_doubt"
  | "exit_after_cta";

export type JourneyContext = {
  bundleId?: string;
  entryPath?: string;
  buyerState?: string;
  evidenceDepth?: number;
  escalationLevel?: string;
  stageIndex?: number;
  diagnosticRoute?: string;
  price?: number;
  sessionKey?: string;
  convictionState?: ConvictionState;
  target?: string;
  durationMs?: number;
  scrollCount?: number;
  hovered?: boolean;
};

// ---------------------------------------------------------------------------
// Core recording function
// ---------------------------------------------------------------------------

export async function recordJourneyEvent(
  sessionId: string,
  stage: JourneyStage,
  context?: JourneyContext,
  userId?: string,
): Promise<string> {
  const event = await prisma.decisionJourneyEvent.create({
    data: {
      sessionId,
      userId: userId ?? null,
      stage,
      context: context ? JSON.stringify(context) : null,
    },
  });
  return event.id;
}

// ---------------------------------------------------------------------------
// Batch recording for high-throughput scenarios
// ---------------------------------------------------------------------------

export async function recordJourneyEvents(
  events: Array<{
    sessionId: string;
    stage: JourneyStage;
    context?: JourneyContext;
    userId?: string;
  }>,
): Promise<number> {
  const result = await prisma.decisionJourneyEvent.createMany({
    data: events.map((e) => ({
      sessionId: e.sessionId,
      userId: e.userId ?? null,
      stage: e.stage,
      context: e.context ? JSON.stringify(e.context) : null,
    })),
  });
  return result.count;
}

// ---------------------------------------------------------------------------
// Derived Metrics
// ---------------------------------------------------------------------------

type DateRange = { from: Date; to: Date };

function defaultRange(): DateRange {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from, to };
}

/**
 * Evidence Completion Rate
 * % of users who start diagnostic and reach enterprise stage
 */
export async function getEvidenceCompletionRate(
  range: DateRange = defaultRange(),
): Promise<{ rate: number; started: number; completed: number }> {
  const [started, completed] = await Promise.all([
    prisma.decisionJourneyEvent.groupBy({
      by: ["sessionId"],
      where: {
        stage: "diagnostic_start",
        createdAt: { gte: range.from, lte: range.to },
      },
    }),
    prisma.decisionJourneyEvent.groupBy({
      by: ["sessionId"],
      where: {
        stage: "enterprise_complete",
        createdAt: { gte: range.from, lte: range.to },
      },
    }),
  ]);

  const startedCount = started.length;
  const completedCount = completed.length;
  return {
    rate: startedCount > 0 ? completedCount / startedCount : 0,
    started: startedCount,
    completed: completedCount,
  };
}

/**
 * Flagship Conversion Rate
 * % of users who reach exec gate and purchase
 */
export async function getFlagshipConversionRate(
  range: DateRange = defaultRange(),
): Promise<{ rate: number; gateViews: number; purchases: number }> {
  const [gateViews, purchases] = await Promise.all([
    prisma.decisionJourneyEvent.groupBy({
      by: ["sessionId"],
      where: {
        stage: "exec_gate_view",
        createdAt: { gte: range.from, lte: range.to },
      },
    }),
    prisma.decisionJourneyEvent.groupBy({
      by: ["sessionId"],
      where: {
        stage: "exec_purchase",
        createdAt: { gte: range.from, lte: range.to },
      },
    }),
  ]);

  const gateCount = gateViews.length;
  const purchaseCount = purchases.length;
  return {
    rate: gateCount > 0 ? purchaseCount / gateCount : 0,
    gateViews: gateCount,
    purchases: purchaseCount,
  };
}

/**
 * Escalation Qualification Rate
 * % of reports that result in strategy_room_allowed
 */
export async function getEscalationQualificationRate(
  range: DateRange = defaultRange(),
): Promise<{ rate: number; reports: number; qualified: number }> {
  const [reports, qualified] = await Promise.all([
    prisma.decisionJourneyEvent.groupBy({
      by: ["sessionId"],
      where: {
        stage: "exec_report_generated",
        createdAt: { gte: range.from, lte: range.to },
      },
    }),
    prisma.decisionJourneyEvent.groupBy({
      by: ["sessionId"],
      where: {
        stage: "strategy_allowed",
        createdAt: { gte: range.from, lte: range.to },
      },
    }),
  ]);

  const reportCount = reports.length;
  const qualifiedCount = qualified.length;
  return {
    rate: reportCount > 0 ? qualifiedCount / reportCount : 0,
    reports: reportCount,
    qualified: qualifiedCount,
  };
}

/**
 * Drop-Off Map
 * Counts at each transition point
 */
export async function getDropOffMap(
  range: DateRange = defaultRange(),
): Promise<Record<string, { count: number; dropOff: number; dropOffRate: number }>> {
  const stages: JourneyStage[] = [
    "diagnostic_start",
    "diagnostic_complete",
    "team_mode_selected",
    "campaign_created",
    "enterprise_complete",
    "exec_gate_view",
    "exec_purchase",
    "exec_report_generated",
    "strategy_gate_view",
    "strategy_allowed",
  ];

  const counts = await Promise.all(
    stages.map(async (stage) => {
      const result = await prisma.decisionJourneyEvent.groupBy({
        by: ["sessionId"],
        where: {
          stage,
          createdAt: { gte: range.from, lte: range.to },
        },
      });
      return { stage, count: result.length };
    }),
  );

  const map: Record<string, { count: number; dropOff: number; dropOffRate: number }> = {};
  for (let i = 0; i < counts.length; i++) {
    const current = counts[i]!;
    const next = counts[i + 1];
    const dropOff = next ? current.count - next.count : 0;
    const dropOffRate = current.count > 0 && next ? dropOff / current.count : 0;
    map[current.stage] = {
      count: current.count,
      dropOff: Math.max(0, dropOff),
      dropOffRate: Math.max(0, dropOffRate),
    };
  }
  return map;
}

/**
 * Buyer Path Efficiency
 * Average steps and time from landing to exec report
 */
export async function getBuyerPathEfficiency(
  range: DateRange = defaultRange(),
): Promise<{
  avgSteps: number;
  avgTimeMs: number;
  totalPaths: number;
  pathDistribution: Record<string, number>;
}> {
  // Get all sessions that reached exec_purchase
  const purchaseSessions = await prisma.decisionJourneyEvent.groupBy({
    by: ["sessionId"],
    where: {
      stage: "exec_purchase",
      createdAt: { gte: range.from, lte: range.to },
    },
  });

  if (purchaseSessions.length === 0) {
    return { avgSteps: 0, avgTimeMs: 0, totalPaths: 0, pathDistribution: {} };
  }

  const sessionIds = purchaseSessions.map((s) => s.sessionId);

  // Get all events for these sessions
  const allEvents = await prisma.decisionJourneyEvent.findMany({
    where: { sessionId: { in: sessionIds } },
    orderBy: { createdAt: "asc" },
  });

  // Group by session
  const bySession: Record<string, typeof allEvents> = {};
  for (const e of allEvents) {
    (bySession[e.sessionId] ??= []).push(e);
  }

  let totalSteps = 0;
  let totalTimeMs = 0;
  const pathDist: Record<string, number> = {};

  for (const events of Object.values(bySession)) {
    if (events.length < 2) continue;
    const first = events[0]!;
    const last = events[events.length - 1]!;
    totalSteps += events.length;
    totalTimeMs += last.createdAt.getTime() - first.createdAt.getTime();

    // Build path signature
    const sig = events.map((e) => e.stage).join(" → ");
    pathDist[sig] = (pathDist[sig] ?? 0) + 1;
  }

  const n = sessionIds.length;
  return {
    avgSteps: n > 0 ? Math.round(totalSteps / n) : 0,
    avgTimeMs: n > 0 ? Math.round(totalTimeMs / n) : 0,
    totalPaths: n,
    pathDistribution: pathDist,
  };
}

/**
 * Funnel progression counts for dashboard
 */
export async function getFunnelProgression(
  range: DateRange = defaultRange(),
): Promise<Array<{ stage: string; sessions: number }>> {
  const stages: JourneyStage[] = [
    "landing",
    "diagnostic_start",
    "diagnostic_complete",
    "enterprise_complete",
    "exec_gate_view",
    "exec_purchase",
    "exec_report_generated",
    "strategy_gate_view",
    "strategy_allowed",
  ];

  return Promise.all(
    stages.map(async (stage) => {
      const result = await prisma.decisionJourneyEvent.groupBy({
        by: ["sessionId"],
        where: {
          stage,
          createdAt: { gte: range.from, lte: range.to },
        },
      });
      return { stage, sessions: result.length };
    }),
  );
}

/**
 * Revenue per path — bundles and flagship purchases
 */
export async function getRevenueByPath(
  range: DateRange = defaultRange(),
): Promise<Array<{ path: string; revenue: number; count: number }>> {
  const purchaseEvents = await prisma.decisionJourneyEvent.findMany({
    where: {
      stage: { in: ["exec_purchase", "bundle_click"] },
      createdAt: { gte: range.from, lte: range.to },
    },
  });

  const byPath: Record<string, { revenue: number; count: number }> = {};

  for (const event of purchaseEvents) {
    let ctx: JourneyContext = {};
    try {
      ctx = event.context ? JSON.parse(event.context) : {};
    } catch { /* ignore */ }

    const path = ctx.bundleId ?? ctx.entryPath ?? event.stage;
    const price = ctx.price ?? (event.stage === "exec_purchase" ? 95 : 0);

    if (!byPath[path]) byPath[path] = { revenue: 0, count: 0 };
    byPath[path].revenue += price;
    byPath[path].count += 1;
  }

  return Object.entries(byPath).map(([path, data]) => ({
    path,
    ...data,
  }));
}

/**
 * Strategy Room qualification breakdown
 */
export async function getStrategyRoomQualification(
  range: DateRange = defaultRange(),
): Promise<{ allowed: number; blocked: number; attempted: number; ratio: number }> {
  const [attempted, allowed, blocked] = await Promise.all([
    prisma.decisionJourneyEvent.count({
      where: {
        stage: "strategy_attempt",
        createdAt: { gte: range.from, lte: range.to },
      },
    }),
    prisma.decisionJourneyEvent.count({
      where: {
        stage: "strategy_allowed",
        createdAt: { gte: range.from, lte: range.to },
      },
    }),
    prisma.decisionJourneyEvent.count({
      where: {
        stage: "strategy_blocked",
        createdAt: { gte: range.from, lte: range.to },
      },
    }),
  ]);

  return {
    attempted,
    allowed,
    blocked,
    ratio: attempted > 0 ? allowed / attempted : 0,
  };
}

async function uniqueSessionsForStages(
  stages: JourneyStage[],
  range: DateRange,
): Promise<Set<string>> {
  const rows = await prisma.decisionJourneyEvent.groupBy({
    by: ["sessionId"],
    where: {
      stage: { in: stages },
      createdAt: { gte: range.from, lte: range.to },
    },
  });
  return new Set(rows.map((row) => row.sessionId));
}

function ratio(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0;
}

export async function getConversionIntelligenceMetrics(
  range: DateRange = defaultRange(),
): Promise<{
  evidenceToInstrumentRate: { rate: number; evidence: number; instruments: number };
  instrumentCompletionRate: { rate: number; opened: number; completed: number };
  escalationRate: { rate: number; eligible: number; escalated: number };
  commitmentRate: { rate: number; priced: number; committed: number };
  convictionVelocity: { avgMs: number; sessions: number };
}> {
  const [
    evidenceSessions,
    instrumentSessions,
    openedSessions,
    completedSessions,
    eligibleSessions,
    escalatedSessions,
    pricedSessions,
    committedSessions,
  ] = await Promise.all([
    uniqueSessionsForStages(["evidence_viewed", "diagnostic_start", "landing"], range),
    uniqueSessionsForStages(["asset_open", "asset_started", "asset_purchase_start"], range),
    uniqueSessionsForStages(["asset_open", "asset_started"], range),
    uniqueSessionsForStages(["asset_complete"], range),
    uniqueSessionsForStages(["exec_report_generated", "asset_complete", "strategy_gate_view"], range),
    uniqueSessionsForStages(["asset_escalated", "strategy_checkout_start", "strategy_allowed"], range),
    uniqueSessionsForStages(["exec_gate_view", "asset_purchase_start", "strategy_checkout_start"], range),
    uniqueSessionsForStages(["exec_purchase", "asset_purchase", "strategy_allowed", "strategy_completed"], range),
  ]);

  const eventRows = await prisma.decisionJourneyEvent.findMany({
    where: {
      createdAt: { gte: range.from, lte: range.to },
      stage: {
        in: [
          "evidence_viewed",
          "diagnostic_start",
          "exec_gate_view",
          "asset_purchase_start",
          "strategy_checkout_start",
          "exec_purchase",
          "asset_purchase",
          "strategy_allowed",
          "strategy_completed",
        ],
      },
    },
    orderBy: { createdAt: "asc" },
    select: { sessionId: true, stage: true, createdAt: true },
  });

  const bySession = new Map<string, typeof eventRows>();
  for (const event of eventRows) {
    const current = bySession.get(event.sessionId) ?? [];
    current.push(event);
    bySession.set(event.sessionId, current);
  }

  let velocityTotal = 0;
  let velocitySessions = 0;
  for (const events of bySession.values()) {
    const firstRecognition = events.find((event) =>
      event.stage === "evidence_viewed" || event.stage === "diagnostic_start"
    );
    const firstCommitment = events.find((event) =>
      event.stage === "exec_purchase" ||
      event.stage === "asset_purchase" ||
      event.stage === "strategy_allowed" ||
      event.stage === "strategy_completed"
    );
    if (firstRecognition && firstCommitment && firstCommitment.createdAt >= firstRecognition.createdAt) {
      velocityTotal += firstCommitment.createdAt.getTime() - firstRecognition.createdAt.getTime();
      velocitySessions += 1;
    }
  }

  return {
    evidenceToInstrumentRate: {
      rate: ratio(instrumentSessions.size, evidenceSessions.size),
      evidence: evidenceSessions.size,
      instruments: instrumentSessions.size,
    },
    instrumentCompletionRate: {
      rate: ratio(completedSessions.size, openedSessions.size),
      opened: openedSessions.size,
      completed: completedSessions.size,
    },
    escalationRate: {
      rate: ratio(escalatedSessions.size, eligibleSessions.size),
      eligible: eligibleSessions.size,
      escalated: escalatedSessions.size,
    },
    commitmentRate: {
      rate: ratio(committedSessions.size, pricedSessions.size),
      priced: pricedSessions.size,
      committed: committedSessions.size,
    },
    convictionVelocity: {
      avgMs: velocitySessions > 0 ? Math.round(velocityTotal / velocitySessions) : 0,
      sessions: velocitySessions,
    },
  };
}
