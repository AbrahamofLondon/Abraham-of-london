/**
 * lib/intelligence/gmi-release-console-view-model.server.ts
 *
 * Server-only view-model builder for the GMI release console.
 *
 * This lived inside pages/admin/intelligence/gmi-release-console.tsx as an
 * EXPORTED async function. Because it was exported from a page module, Next's
 * client compiler could not tree-shake it, so its dynamic import of the
 * Prisma/fs/crypto-backed durable resolver leaked into the browser bundle and
 * broke `next build --webpack` with UnhandledSchemeError / "Can't resolve 'fs'".
 *
 * Isolating it here (a `.server.ts` module, imported only from getServerSideProps
 * and from server-side tests) keeps the durable-resolver chain out of every
 * client bundle. No behaviour changed.
 */
import { resolveDurableReleaseState } from "./gmi-release-durable-resolver.server";
import { resolveGmiReleaseState } from "./gmi-release-state-resolver";
import { getMarketIntelligenceRecord } from "./market-intelligence-lifecycle";
import { getCallsForReport, getCallsPendingReview } from "./market-intelligence-call-ledger";
import { buildGmiQuarterlyReviewPack } from "./gmi-quarterly-review-pack";
import { buildGmiReleaseEventSummary, type GmiReleaseEventSummary } from "./gmi-release-event-summary";
import { buildGmiReleaseChecklist, type GmiReleaseChecklist } from "./gmi-release-candidate-checklist";
import { validateLinkedInOutboundItem, type LinkedInOutboundItem } from "@/lib/outbound/linkedin-outbound-governance";
import { type GmiPriorCallScorecardData } from "@/components/Intelligence/GmiPriorCallScorecard";

export type ReportCard = {
  id: string;
  lifecycle: string;
  coverage: string;
  decisionWindow: string;
  purchasable: boolean;
  publicVisible: boolean;
};

export type ConsoleViewModel = {
  activeReport: string;
  draftReport: string;
  currentReleaseState: string;
  releaseReady: boolean;
  reportCards: ReportCard[];
  blockers: string[];
  priorCalls: {
    total: number;
    dueInQ2: number;
    carriedToQ3: number;
    reviewed: number;
    pending: number;
  };
  sourceCoverage: {
    totalRows: number;
    verifiedRows: number;
    pendingRows: number;
    blockerRows: number;
    coverageScore: number;
    releaseSafe: boolean;
  };
  qualityGate: {
    overallScore: number;
    releaseReady: boolean;
    criticalFailures: string[];
    warnings: string[];
    dimensionsBelowThreshold: string[];
  };
  outbound: {
    title: string;
    status: string;
    lifecycleGated: boolean;
    publishable: boolean;
  };
  eventSummary: GmiReleaseEventSummary;
  nextActions: string[];
  mutatingActions: string[];
  scorecardData: GmiPriorCallScorecardData;
  releaseChecklist: GmiReleaseChecklist;
};

const REQUIRED_NEXT_ACTIONS = [
  "Complete Q2 source collection log.",
  "Review and score Q1 calls due in Q2.",
  "Resolve release-blocking source rows.",
  "Finalise Q2 confidence posture.",
  "Run quality gate.",
  "Promote lifecycle only after release conditions pass.",
];

function reportCard(id: string): ReportCard {
  const record = getMarketIntelligenceRecord(id);
  if (!record) {
    return {
      id,
      lifecycle: "MISSING",
      coverage: "Unavailable",
      decisionWindow: "Unavailable",
      purchasable: false,
      publicVisible: false,
    };
  }

  return {
    id,
    lifecycle: record.lifecycleState,
    coverage: record.coveragePeriod,
    decisionWindow: record.decisionWindow,
    purchasable: record.purchasable,
    publicVisible: record.publicVisible,
  };
}

function buildQ2OutboundState(): ConsoleViewModel["outbound"] {
  const item: LinkedInOutboundItem = {
    title: "A new market reality — why Q2 2026 matters",
    status: "draft",
    draft: true,
    published: false,
    channel: "linkedin",
    contentType: "article",
    date: "2026-07-08",
    category: "Outbound",
    tier: "public",
    linkedReportId: "GMI-Q2-2026",
    requiresLifecycleCheck: true,
    publicationGate: "Publish only after GMI-Q2-2026 lifecycle is ACTIVE_UNTIL_SUPERSEDED and public report surface is live",
    claimRisk: "MEDIUM",
    body: "The Q2 report remains in preparation.",
  };
  const result = validateLinkedInOutboundItem(item);

  return {
    title: item.title ?? "Q2 LinkedIn market-reality post",
    status: String(item.status),
    lifecycleGated: item.requiresLifecycleCheck === true,
    publishable: result.errors.length === 0 && item.published === true && item.status !== "draft",
  };
}

export async function buildGmiReleaseConsoleViewModel(): Promise<ConsoleViewModel> {
  const releaseState = resolveGmiReleaseState("GMI-Q2-2026");
  const durableState = await resolveDurableReleaseState("GMI-Q2-2026");
  // A released edition (authoritative receipt + active lifecycle) is complete:
  // the resolver's releaseReady is intentionally false post-release to block
  // double release, but the console must show the released state as clear.
  const durableReleaseReady =
    durableState.releaseReady ||
    (durableState.hasReceipt && durableState.lifecycleState === "ACTIVE_UNTIL_SUPERSEDED");
  const reviewPack = buildGmiQuarterlyReviewPack("GMI-Q2-2026");
  const q1Calls = getCallsForReport("GMI-Q1-2026");
  const dueInQ2 = q1Calls.filter((call) => call.expectedReviewWindow === "Q2 2026");
  const carriedToQ3 = q1Calls.filter((call) => call.expectedReviewWindow === "Q3 2026");
  const pendingQ2 = getCallsPendingReview("Q2 2026");
  const dimensionsBelowThreshold = durableReleaseReady
    ? []
    : releaseState.qualityGate.scores
      .filter((score) => score < 8)
      .map((score, i) => `Dimension ${i + 1}: ${score}/10`);
  const warnings = durableReleaseReady
    ? []
    : reviewPack.sourceCoverage.coverageScore < 90
      ? ["Source coverage below paid institutional warning threshold."]
      : [];

  const scorecardData: GmiPriorCallScorecardData = {
    reportId: "GMI-Q2-2026",
    priorReportId: "GMI-Q1-2026",
    reviewWindow: "Q2 2026",
    total: q1Calls.length,
    dueInCurrentQuarter: dueInQ2.length,
    carriedForward: carriedToQ3.length,
    reviewed: dueInQ2.length - pendingQ2.length,
    pending: pendingQ2.length,
  };

  return {
    activeReport: durableReleaseReady ? "GMI-Q2-2026" : "GMI-Q1-2026",
    draftReport: durableReleaseReady ? "None" : "GMI-Q2-2026",
    currentReleaseState: `${durableState.lifecycleState} / Durable`,
    releaseReady: durableReleaseReady,
    reportCards: [reportCard("GMI-Q1-2026"), reportCard("GMI-Q2-2026")],
    blockers: durableState.blockers,
    priorCalls: {
      total: q1Calls.length,
      dueInQ2: dueInQ2.length,
      carriedToQ3: carriedToQ3.length,
      reviewed: dueInQ2.length - pendingQ2.length,
      pending: pendingQ2.length,
    },
    sourceCoverage: reviewPack.sourceCoverage,
    qualityGate: {
      overallScore: durableReleaseReady ? 10 : releaseState.qualityGate.overallScore,
      releaseReady: durableReleaseReady,
      criticalFailures: durableReleaseReady ? [] : releaseState.qualityGate.criticalFailures,
      warnings,
      dimensionsBelowThreshold,
    },
    outbound: buildQ2OutboundState(),
    eventSummary: buildGmiReleaseEventSummary("GMI-Q2-2026"),
    nextActions: durableReleaseReady ? [
      "Monitor purchaser fulfilment and archive Q1 accountability references.",
      "Prepare Q3 evidence collection package.",
    ] : REQUIRED_NEXT_ACTIONS,
    mutatingActions: [],
    scorecardData,
    releaseChecklist: buildGmiReleaseChecklist("GMI-Q2-2026"),
  };
}
