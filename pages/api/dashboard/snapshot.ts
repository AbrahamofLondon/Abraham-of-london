// pages/api/dashboard/snapshot.ts
// Single-call dashboard snapshot aggregating from verified Prisma models.
// Zero-safe: every query has .catch(() => []) or .catch(() => 0).
// No PII exposed — counts and status labels only.

import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma.server";

// ── Types ──────────────────────────────────────────────────────────────────────

interface DashboardSnapshot {
  metrics: {
    totalPressureSignals: number;
    pressureSignalsToday: number;
    pressureSignalsThisWeek: number;
    conversionRateFreeToPaid: number;
    activeBoardroomBriefs: number;
    monthlyRecurringRevenue: number;
    averageDecisionOutcomeScore: number;
  };
  pressureTrend: { date: string; count: number }[];
  outcomeDistribution: { name: "Success" | "Partial" | "Failure"; value: number }[];
  recentActivity: {
    id: string;
    type: "pressure_signal" | "boardroom_brief_order" | "return_brief_submitted";
    title: string;
    timestamp: string;
    userRole?: string;
  }[];
  contradictionAlerts: {
    id: string;
    severity: "CRITICAL" | "WARNING";
    description: string;
    detectedAt: string;
    affectedDossiers: string[];
  }[];
  funnel: {
    pressureSignalStarts: number;
    checkoutAttempts: number;
    completedPayments: number;
    deliveredDossiers: number;
    generatedAt: string;
  };
  fulfilment: {
    paidOrders: number;
    generatedDossiers: number;
    approvedDossiers: number;
    deliveredDossiers: number;
    overdueDeliveries: number;
    generatedAt: string;
  };
  retainer: {
    activeContracts: number;
    openReviewCycles: number;
    overdueReviewCycles: number;
    completedReviewCycles: number;
    generatedAt: string;
  };
  operational: {
    overdueDeliveries: number;
    overdueReviewCycles: number;
    pendingReadinessApprovals: number;
    undeliveredPaidOrders: number;
    openReviewCycles: number;
    candidateReadinessEvals: number;
    deliveredThisWeek: number;
    completedReviewCyclesThisMonth: number;
    approvedReadinessEvals: number;
    generatedAt: string;
  };
  oversight: {
    totalCycles: number;
    openCycles: number;
    underReviewCycles: number;
    completedCycles: number;
    skippedCycles: number;
    overdueCycles: number;
    criticalDrift: number;
    highDrift: number;
    clientsOnWatch: number;
    interventionsThisMonth: number;
    generatedAt: string;
  };
  risk: {
    totalEntries: number;
    monitoring: number;
    confirmed: number;
    overturned: number;
    pendingReview: number;
    byProduct: { name: string; value: number }[];
    generatedAt: string;
  };
  generatedAt: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

const now = () => new Date();
const startOfToday = () => { const d = now(); d.setHours(0,0,0,0); return d; };
const daysAgo = (n: number) => { const d = now(); d.setDate(d.getDate() - n); return d; };
const startOfMonth = () => new Date(now().getFullYear(), now().getMonth(), 1);
const overdueThreshold = () => { const d = now(); d.setDate(d.getDate() - 2); return d; };

// BoardroomBriefOrder delivery statuses that indicate progression
const PAID_STATUSES = ["paid", "in_review", "dossier_generated", "delivered", "follow_up_due"];
const DELIVERED_STATUS = "delivered";
const DOSSIER_GENERATED_STATUSES = ["dossier_generated", "delivered"];

// ── Handler ─────────────────────────────────────────────────────────────────────

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DashboardSnapshot | { error: string }>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const snapshotTime = now();

    // ── 1. Pressure Signals ────────────────────────────────────────────────────
    const [totalSignals, todaySignals, weekSignals] = await Promise.all([
      prisma.pressureSignalEvent.count().catch(() => 0),
      prisma.pressureSignalEvent.count({ where: { createdAt: { gte: startOfToday() } } }).catch(() => 0),
      prisma.pressureSignalEvent.count({ where: { createdAt: { gte: daysAgo(7) } } }).catch(() => 0),
    ]);

    // ── 2. Boardroom Brief Orders ──────────────────────────────────────────────
    const allOrders = await prisma.boardroomBriefOrder.findMany({
      select: { paymentStatus: true, deliveryStatus: true, createdAt: true, deliveredAt: true },
    }).catch(() => []);

    const paidOrders = allOrders.filter(o => o.paymentStatus === "paid").length;
    const activeBriefs = allOrders.filter(o =>
      o.paymentStatus === "paid" && PAID_STATUSES.includes(o.deliveryStatus)
    ).length;
    const deliveredDossiers = allOrders.filter(o => o.deliveryStatus === DELIVERED_STATUS).length;
    const generatedDossiers = allOrders.filter(o =>
      o.paymentStatus === "paid" && DOSSIER_GENERATED_STATUSES.includes(o.deliveryStatus)
    ).length;
    const overdueDeliveries = allOrders.filter(o =>
      o.paymentStatus === "paid" &&
      o.deliveryStatus !== DELIVERED_STATUS &&
      new Date(o.createdAt) < overdueThreshold()
    ).length;
    const deliveredThisWeek = allOrders.filter(o =>
      o.deliveryStatus === DELIVERED_STATUS &&
      o.deliveredAt !== null &&
      new Date(o.deliveredAt!) >= daysAgo(7)
    ).length;

    // ── 3. Revenue (from ClientEntitlement — Professional subscriptions) ───────
    const activeEntitlements = await prisma.clientEntitlement.findMany({
      where: {
        productCode: { in: ["professional", "professional_annual"] },
        status: "active",
        startsAt: { lte: snapshotTime },
        OR: [{ endsAt: null }, { endsAt: { gt: snapshotTime } }],
      },
      select: { productCode: true },
    }).catch(() => []);

    let monthlyMrr = 0;
    for (const e of activeEntitlements) {
      monthlyMrr += e.productCode === "professional_annual" ? 49 : 59;
    }
    // Add recent Boardroom Brief orders (last 30 days) at £99 each
    const recentPaidOrders = allOrders.filter(o =>
      o.paymentStatus === "paid" && new Date(o.createdAt) >= daysAgo(30)
    ).length;
    monthlyMrr += recentPaidOrders * 99;

    // ── 4. Outcome Verification ────────────────────────────────────────────────
    const outcomeRecords = await prisma.outcomeVerificationRecord.findMany({
      select: { outcomeClassification: true, effectivenessScore: true },
    }).catch(() => []);

    const totalOutcomes = outcomeRecords.length;
    const avgScore = totalOutcomes > 0
      ? parseFloat((outcomeRecords.reduce((s, r) => s + r.effectivenessScore, 0) / totalOutcomes).toFixed(1))
      : 0;

    const outcomeDist = [
      { name: "Success" as const, value: outcomeRecords.filter(r => r.outcomeClassification.toLowerCase().includes("success")).length },
      { name: "Partial" as const, value: outcomeRecords.filter(r => r.outcomeClassification.toLowerCase().includes("partial")).length },
      { name: "Failure" as const, value: outcomeRecords.filter(r =>
        !r.outcomeClassification.toLowerCase().includes("success") &&
        !r.outcomeClassification.toLowerCase().includes("partial")
      ).length },
    ];

    // ── 5. Recent Activity ─────────────────────────────────────────────────────
    const recentSignals = await prisma.pressureSignalEvent.findMany({
      take: 5, orderBy: { createdAt: "desc" },
      select: { id: true, pressureLevel: true, recommendedProduct: true, createdAt: true },
    }).catch(() => []);

    const recentOrders = await prisma.boardroomBriefOrder.findMany({
      take: 5, orderBy: { createdAt: "desc" },
      select: { id: true, paymentStatus: true, deliveryStatus: true, createdAt: true },
    }).catch(() => []);

    const recentReturnBriefs = await prisma.returnBriefResponse.findMany({
      take: 5, orderBy: { createdAt: "desc" },
      select: { id: true, outcomeClass: true, createdAt: true },
    }).catch(() => []);

    const activity: DashboardSnapshot["recentActivity"] = [];
    for (const s of recentSignals) {
      activity.push({ id: `sig-${s.id}`, type: "pressure_signal", title: `Signal: ${s.pressureLevel} → ${s.recommendedProduct}`, timestamp: s.createdAt.toISOString() });
    }
    for (const o of recentOrders) {
      activity.push({ id: `ord-${o.id}`, type: "boardroom_brief_order", title: `Brief order: ${o.paymentStatus}/${o.deliveryStatus}`, timestamp: o.createdAt.toISOString() });
    }
    for (const r of recentReturnBriefs) {
      activity.push({ id: `rb-${r.id}`, type: "return_brief_submitted", title: `Return Brief: ${r.outcomeClass}`, timestamp: r.createdAt.toISOString() });
    }
    activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // ── 6. Contradiction Alerts ────────────────────────────────────────────────
    // Derived from PatternObservation with high riskOfRepeat as a proxy
    const contradictions = await prisma.patternObservation.findMany({
      where: { status: "ACTIVE", riskOfRepeat: { in: ["HIGH", "CRITICAL"] } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, patternType: true, patternLabel: true, patternDetail: true, riskOfRepeat: true, createdAt: true },
    }).catch(() => []);

    const contradictionAlerts = contradictions.map(c => ({
      id: c.id,
      severity: (c.riskOfRepeat === "CRITICAL" ? "CRITICAL" : "WARNING") as "CRITICAL" | "WARNING",
      description: c.patternDetail || c.patternLabel,
      detectedAt: c.createdAt.toISOString(),
      affectedDossiers: [] as string[],
    }));

    // ── 7. Funnel ──────────────────────────────────────────────────────────────
    const checkoutAttempts = allOrders.length;
    const completedPayments = paidOrders;
    const conversionRate = totalSignals > 0
      ? parseFloat(((completedPayments / totalSignals) * 100).toFixed(1))
      : 0;

    // ── 8. Retainer Contracts ──────────────────────────────────────────────────
    const contracts = await prisma.retainerContract.findMany({
      select: { status: true },
    }).catch(() => []);

    const activeContracts = contracts.filter(c => c.status === "ACTIVE").length;

    // ── 9. Oversight Review Cycles ─────────────────────────────────────────────
    const cycles = await prisma.oversightReviewCycle.findMany({
      select: { status: true, driftCategory: true, clientHealthStatus: true, interventionCount: true, periodEnd: true, createdAt: true, updatedAt: true },
    }).catch(() => []);

    const totalCycles = cycles.length;
    const openCycles = cycles.filter(c => c.status === "OPEN").length;
    const underReviewCycles = cycles.filter(c => c.status === "UNDER_REVIEW").length;
    const completedCycles = cycles.filter(c => c.status === "COMPLETED").length;
    const skippedCycles = cycles.filter(c => c.status === "SKIPPED").length;
    const overdueCycles = cycles.filter(c => c.status === "OPEN" && c.periodEnd < snapshotTime).length;
    const criticalDrift = cycles.filter(c => c.driftCategory === "CRITICAL").length;
    const highDrift = cycles.filter(c => c.driftCategory === "HIGH").length;
    const clientsOnWatch = cycles.filter(c =>
      ["WATCH", "DETERIORATING", "CRITICAL"].includes(c.clientHealthStatus)
    ).length;
    const interventionsThisMonth = cycles
      .filter(c => c.updatedAt >= startOfMonth())
      .reduce((s, c) => s + (c.interventionCount ?? 0), 0);

    // ── 10. Falsification Entries (Risk Suppression) ───────────────────────────
    const falsifications = await prisma.falsificationEntry.findMany({
      select: { status: true, productCode: true, reviewDate: true },
    }).catch(() => []);

    const totalRisk = falsifications.length;
    const monitoring = falsifications.filter(f => f.status === "MONITORING").length;
    const confirmed = falsifications.filter(f => f.status === "CONFIRMED").length;
    const overturned = falsifications.filter(f => f.status === "OVERTURNED").length;
    const pendingReview = falsifications.filter(f =>
      f.status === "MONITORING" &&
      f.reviewDate !== null &&
      new Date(f.reviewDate).getTime() < snapshotTime.getTime()
    ).length;

    const byProductMap = new Map<string, number>();
    for (const f of falsifications) {
      const key = f.productCode || "Core Infrastructure";
      byProductMap.set(key, (byProductMap.get(key) || 0) + 1);
    }
    const byProduct = Array.from(byProductMap.entries()).map(([name, value]) => ({ name, value }));

    // ── 11. Retainer Readiness Evaluations ─────────────────────────────────────
    const readinessEvals = await prisma.retainerReadinessEvaluation.findMany({
      select: { readinessClass: true, adminApprovedAt: true },
    }).catch(() => []);

    // REVIEW_READY requires admin sign-off; CANDIDATE is still self-qualifying
    const pendingReadinessApprovals = readinessEvals.filter(e =>
      e.readinessClass === "REVIEW_READY"
    ).length;
    const candidateReadinessEvals = readinessEvals.filter(e =>
      e.readinessClass === "CANDIDATE"
    ).length;
    const approvedReadinessEvals = readinessEvals.filter(e =>
      e.readinessClass === "APPROVED" && e.adminApprovedAt !== null
    ).length;

    // ── 12. Pressure Trend (7 days) ────────────────────────────────────────────
    const trendMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = daysAgo(i);
      trendMap.set(`${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`, 0);
    }

    const weekSignals_raw = await prisma.pressureSignalEvent.findMany({
      where: { createdAt: { gte: daysAgo(7) } },
      select: { createdAt: true },
    }).catch(() => []);

    for (const sig of weekSignals_raw) {
      const label = `${String(sig.createdAt.getMonth() + 1).padStart(2, "0")}-${String(sig.createdAt.getDate()).padStart(2, "0")}`;
      if (trendMap.has(label)) {
        trendMap.set(label, (trendMap.get(label) || 0) + 1);
      }
    }

    const pressureTrend = Array.from(trendMap.entries()).map(([date, count], i, arr) => ({
      date: i === arr.length - 1 ? "Today" : date,
      count,
    }));

    // ── Assemble Response ──────────────────────────────────────────────────────

    const snapshot: DashboardSnapshot = {
      metrics: {
        totalPressureSignals: totalSignals,
        pressureSignalsToday: todaySignals,
        pressureSignalsThisWeek: weekSignals,
        conversionRateFreeToPaid: conversionRate,
        activeBoardroomBriefs: activeBriefs,
        monthlyRecurringRevenue: monthlyMrr,
        averageDecisionOutcomeScore: avgScore,
      },
      pressureTrend,
      outcomeDistribution: outcomeDist,
      recentActivity: activity.slice(0, 10),
      contradictionAlerts,
      funnel: {
        pressureSignalStarts: totalSignals,
        checkoutAttempts,
        completedPayments,
        deliveredDossiers,
        generatedAt: snapshotTime.toISOString(),
      },
      fulfilment: {
        paidOrders,
        generatedDossiers,
        approvedDossiers: 0, // BoardroomDossier not directly linked; use generated as proxy
        deliveredDossiers,
        overdueDeliveries,
        generatedAt: snapshotTime.toISOString(),
      },
      retainer: {
        activeContracts,
        openReviewCycles: openCycles,
        overdueReviewCycles: overdueCycles,
        completedReviewCycles: completedCycles,
        generatedAt: snapshotTime.toISOString(),
      },
      operational: {
        overdueDeliveries,
        overdueReviewCycles: overdueCycles,
        pendingReadinessApprovals,
        undeliveredPaidOrders: allOrders.filter(o =>
          o.paymentStatus === "paid" &&
          o.deliveryStatus !== DELIVERED_STATUS &&
          o.deliveryStatus !== "follow_up_due" &&
          new Date(o.createdAt) >= overdueThreshold()
        ).length,
        openReviewCycles: openCycles,
        candidateReadinessEvals,
        deliveredThisWeek,
        completedReviewCyclesThisMonth: cycles.filter(c => c.status === "COMPLETED" && c.updatedAt >= startOfMonth()).length,
        approvedReadinessEvals,
        generatedAt: snapshotTime.toISOString(),
      },
      oversight: {
        totalCycles,
        openCycles,
        underReviewCycles,
        completedCycles,
        skippedCycles,
        overdueCycles,
        criticalDrift,
        highDrift,
        clientsOnWatch,
        interventionsThisMonth,
        generatedAt: snapshotTime.toISOString(),
      },
      risk: {
        totalEntries: totalRisk,
        monitoring,
        confirmed,
        overturned,
        pendingReview,
        byProduct,
        generatedAt: snapshotTime.toISOString(),
      },
      generatedAt: snapshotTime.toISOString(),
    };

    return res.status(200).json(snapshot);
  } catch (error: any) {
    console.error("[SNAPSHOT_ERROR]", error);
    return res.status(500).json({ error: "Snapshot aggregation failed" });
  }
}
