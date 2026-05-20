import { resolveGmiReleaseState } from "./gmi-release-state-resolver";
import { calculateGmiSourceCoverageScore } from "./gmi-source-coverage-score";
import { getSignalsForReport } from "./gmi-monitoring-signals";
import {
  getCallsPendingReview,
  type MarketCallRecord,
} from "./market-intelligence-call-ledger";
import { getMarketIntelligenceRecord } from "./market-intelligence-lifecycle";

export type GmiQuarterlyReviewPack = {
  reportId: string;
  priorReportId: string | null;
  callsPendingReview: MarketCallRecord[];
  sourceCoverage: ReturnType<typeof calculateGmiSourceCoverageScore>;
  qualityGate: ReturnType<typeof resolveGmiReleaseState>["qualityGate"];
  monitoredSignals: ReturnType<typeof getSignalsForReport>;
  releaseBlockers: string[];
  recommendedNextActions: string[];
};

export function buildGmiQuarterlyReviewPack(reportId: string): GmiQuarterlyReviewPack {
  const record = getMarketIntelligenceRecord(reportId);
  const releaseState = resolveGmiReleaseState(reportId);
  const reviewWindow = reportId === "GMI-Q2-2026" ? "Q2 2026" : "";

  return {
    reportId,
    priorReportId: record?.replaces ?? null,
    callsPendingReview: reviewWindow ? getCallsPendingReview(reviewWindow) : [],
    sourceCoverage: calculateGmiSourceCoverageScore(reportId),
    qualityGate: releaseState.qualityGate,
    monitoredSignals: getSignalsForReport(reportId),
    releaseBlockers: releaseState.blockers,
    recommendedNextActions: releaseState.requiredActions,
  };
}
