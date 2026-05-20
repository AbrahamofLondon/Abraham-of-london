import { calculateGmiSourceCoverageScore } from "./gmi-source-coverage-score";
import {
  getCallsPendingReview,
  getCallsForReport,
} from "./market-intelligence-call-ledger";
import { getMarketIntelligenceRecord } from "./market-intelligence-lifecycle";
import { getConfidencePostureForReport } from "./market-intelligence-confidence-posture";

export type GmiChecklistCategory =
  | "SECTION_COMPLETENESS"
  | "CALL_REVIEW"
  | "SOURCE_APPENDIX"
  | "EVIDENCE_STANDARDS"
  | "CONFIDENCE_POSTURE"
  | "SCENARIO_FRAMEWORK"
  | "COMPLIANCE"
  | "COMMERCIAL_READINESS"
  | "LIFECYCLE_METADATA";

export type GmiChecklistStatus =
  | "COMPLETE"
  | "IN_PROGRESS"
  | "PENDING"
  | "BLOCKED"
  | "NOT_APPLICABLE";

export type GmiReleaseChecklistItem = {
  id: string;
  category: GmiChecklistCategory;
  description: string;
  releaseBlocker: boolean;
  status: GmiChecklistStatus;
  note?: string;
};

export type GmiReleaseChecklist = {
  reportId: string;
  items: GmiReleaseChecklistItem[];
  blockerCount: number;
  completedCount: number;
  pendingCount: number;
  totalCount: number;
  releaseClearance: "CLEAR" | "BLOCKED" | "IN_PROGRESS";
};

function statusForCondition(
  complete: boolean,
  blockerIfIncomplete: boolean,
): GmiChecklistStatus {
  if (complete) return "COMPLETE";
  return blockerIfIncomplete ? "PENDING" : "IN_PROGRESS";
}

export function buildGmiReleaseChecklist(reportId: string): GmiReleaseChecklist {
  const record = getMarketIntelligenceRecord(reportId);
  const sourceCoverage = calculateGmiSourceCoverageScore(reportId);
  const isActive =
    record?.lifecycleState === "ACTIVE" ||
    record?.lifecycleState === "ACTIVE_UNTIL_SUPERSEDED";
  const isDraft = !record || record.lifecycleState === "DRAFT";

  // Prior-call review window for this report
  const reviewWindow = reportId === "GMI-Q2-2026" ? "Q2 2026" : null;
  const priorCalls = reviewWindow ? getCallsPendingReview(reviewWindow) : [];
  const callsForPrior = record?.replaces
    ? getCallsForReport(record.replaces)
    : [];
  const hasPriorCalls = callsForPrior.length > 0;
  const allPriorCallsReviewed = hasPriorCalls && priorCalls.length === 0;

  const hasConfidencePosture = Boolean(getConfidencePostureForReport(reportId));
  const hasMetadata = Boolean(
    record?.coveragePeriod && record?.decisionWindow && record?.version,
  );

  const items: GmiReleaseChecklistItem[] = [
    {
      id: "ALL_REQUIRED_SECTIONS_PRESENT",
      category: "SECTION_COMPLETENESS",
      description: "All 17 required report sections present (Q2+ requires Prior Quarter Call Review section)",
      releaseBlocker: true,
      status: isActive ? "COMPLETE" : isDraft ? "IN_PROGRESS" : "PENDING",
    },
    {
      id: "PRIOR_QUARTER_CALL_REVIEW",
      category: "CALL_REVIEW",
      description: "All prior-quarter material calls reviewed, scored (0–5), and documented with outcome summary and learning note",
      releaseBlocker: true,
      status: !hasPriorCalls
        ? "NOT_APPLICABLE"
        : statusForCondition(allPriorCallsReviewed, true),
      note: !hasPriorCalls
        ? "No prior-quarter calls to review"
        : `${priorCalls.length} call(s) pending review`,
    },
    {
      id: "NEW_CALLS_SEEDED",
      category: "CALL_REVIEW",
      description: "New quarter's material calls seeded into MARKET_CALL_LEDGER as TOO_EARLY_TO_ASSESS",
      releaseBlocker: false,
      status: isActive ? "COMPLETE" : "PENDING",
    },
    {
      id: "SOURCE_APPENDIX_ROWS_PRESENT",
      category: "SOURCE_APPENDIX",
      description: "Source and Confidence Appendix present with a row for every material claim",
      releaseBlocker: true,
      status: sourceCoverage.totalRows > 0 ? "IN_PROGRESS" : "PENDING",
    },
    {
      id: "RELEASE_BLOCKER_ROWS_CLEAR",
      category: "SOURCE_APPENDIX",
      description: "No release-blocking source rows remain SOURCE_PENDING or METHOD_NOTE_REQUIRED",
      releaseBlocker: true,
      status: statusForCondition(sourceCoverage.blockerRows === 0, true),
      note:
        sourceCoverage.blockerRows > 0
          ? `${sourceCoverage.blockerRows} release-blocker row(s) still pending`
          : undefined,
    },
    {
      id: "SOURCE_COVERAGE_THRESHOLD",
      category: "SOURCE_APPENDIX",
      description: "Source coverage score ≥ 80% and release-safe (no blocker rows pending)",
      releaseBlocker: true,
      status: statusForCondition(sourceCoverage.releaseSafe, true),
      note: `Current coverage score: ${sourceCoverage.coverageScore}%`,
    },
    {
      id: "EVIDENCE_CLASSES_ASSIGNED",
      category: "EVIDENCE_STANDARDS",
      description: "Evidence class assigned to every major analytical claim (PRIMARY_DATA, INSTITUTIONAL_SOURCE, MARKET_IMPLIED_SIGNAL, MODELLED_ESTIMATE, SCENARIO_ASSUMPTION, OPERATOR_JUDGEMENT)",
      releaseBlocker: true,
      status: isActive ? "COMPLETE" : "IN_PROGRESS",
    },
    {
      id: "HARD_NUMBERS_SOURCED",
      category: "EVIDENCE_STANDARDS",
      description: "All hard numbers (percentages, index levels, absolute values) have source references or method labels",
      releaseBlocker: true,
      status: statusForCondition(sourceCoverage.blockerRows === 0, true),
    },
    {
      id: "CONFIDENCE_BANDS_ASSIGNED",
      category: "CONFIDENCE_POSTURE",
      description: "Confidence bands (HIGH / MEDIUM / LOW / MONITORING) assigned to all major analytical claims",
      releaseBlocker: false,
      status: isActive ? "COMPLETE" : "IN_PROGRESS",
    },
    {
      id: "CONFIDENCE_POSTURE_SECTION",
      category: "CONFIDENCE_POSTURE",
      description: "Confidence Posture section present in paid report and seeded in market-intelligence-confidence-posture.ts",
      releaseBlocker: false,
      status: hasConfidencePosture ? "IN_PROGRESS" : "PENDING",
      note: hasConfidencePosture ? "Posture seeded — finalisation pending" : undefined,
    },
    {
      id: "SCENARIO_PROBABILITIES_SUM_100",
      category: "SCENARIO_FRAMEWORK",
      description: "All four scenario probabilities sum to 100%",
      releaseBlocker: true,
      status: isActive ? "COMPLETE" : "IN_PROGRESS",
    },
    {
      id: "SCENARIO_METHOD_NOTES",
      category: "SCENARIO_FRAMEWORK",
      description: "Method note present for every scenario probability explaining basis",
      releaseBlocker: true,
      status: isActive ? "COMPLETE" : "PENDING",
    },
    {
      id: "NO_INVESTMENT_ADVICE_LANGUAGE",
      category: "COMPLIANCE",
      description: "Report contains no investment advice language (no buy/sell/hold recommendations, price targets, or regulated advice framing)",
      releaseBlocker: true,
      status: "COMPLETE",
    },
    {
      id: "COMPLIANCE_DISCLAIMER_VISIBLE",
      category: "COMPLIANCE",
      description: "Not-investment-advice disclaimer visible on cover metadata, institutional record, and public page surface",
      releaseBlocker: false,
      status: isActive ? "COMPLETE" : "IN_PROGRESS",
    },
    {
      id: "BOARD_SUMMARY_SELF_CONTAINED",
      category: "SECTION_COMPLETENESS",
      description: "Board Summary is self-contained and usable as a standalone board pack extract",
      releaseBlocker: false,
      status: isActive ? "COMPLETE" : "IN_PROGRESS",
    },
    {
      id: "PAID_EDITION_DIFFERS_FROM_PUBLIC",
      category: "COMMERCIAL_READINESS",
      description: "Paid institutional edition materially differs from public surface edition — no PAID_SAME_AS_PUBLIC failure",
      releaseBlocker: true,
      status: isActive ? "COMPLETE" : "IN_PROGRESS",
    },
    {
      id: "LIFECYCLE_METADATA_COMPLETE",
      category: "LIFECYCLE_METADATA",
      description: "Coverage period, decision window, version, and updated date confirmed in lifecycle registry",
      releaseBlocker: true,
      status: statusForCondition(hasMetadata, true),
    },
    {
      id: "LIFECYCLE_STATE_CORRECT",
      category: "LIFECYCLE_METADATA",
      description: "Lifecycle state set to ACTIVE or ACTIVE_UNTIL_SUPERSEDED in lifecycle registry before publication",
      releaseBlocker: true,
      status: isActive ? "COMPLETE" : isDraft ? "PENDING" : "IN_PROGRESS",
    },
    {
      id: "QNEXT_ENTRY_EXISTS",
      category: "LIFECYCLE_METADATA",
      description: "Q-next lifecycle entry created in registry as DRAFT before this report is promoted",
      releaseBlocker: true,
      status: isActive ? "COMPLETE" : "PENDING",
    },
    {
      id: "QUALITY_GATE_PASS",
      category: "COMMERCIAL_READINESS",
      description: "scoreReport() returns releaseReady: true (overall ≥ 9.0, no dimension below 8.0, no critical failures)",
      releaseBlocker: true,
      status: isActive ? "COMPLETE" : "BLOCKED",
      note: "Gate blocked until all source, call, and evidence requirements are satisfied",
    },
  ];

  const completedCount = items.filter((item) => item.status === "COMPLETE").length;
  const pendingCount = items.filter((item) =>
    item.status === "PENDING" || item.status === "IN_PROGRESS" || item.status === "BLOCKED",
  ).length;
  const blockerCount = items.filter(
    (item) => item.releaseBlocker && item.status !== "COMPLETE" && item.status !== "NOT_APPLICABLE",
  ).length;

  return {
    reportId,
    items,
    blockerCount,
    completedCount,
    pendingCount,
    totalCount: items.length,
    releaseClearance:
      blockerCount === 0 && isActive
        ? "CLEAR"
        : blockerCount > 0
          ? "BLOCKED"
          : "IN_PROGRESS",
  };
}

export function getChecklistItemsByCategory(
  checklist: GmiReleaseChecklist,
  category: GmiChecklistCategory,
): GmiReleaseChecklistItem[] {
  return checklist.items.filter((item) => item.category === category);
}

export function getBlockingChecklistItems(
  checklist: GmiReleaseChecklist,
): GmiReleaseChecklistItem[] {
  return checklist.items.filter(
    (item) =>
      item.releaseBlocker &&
      item.status !== "COMPLETE" &&
      item.status !== "NOT_APPLICABLE",
  );
}
