import type { General50KRuntimeInput } from "@/lib/product/retainer-readiness-classifier";
import type { ReviewQueuePosture } from "@/lib/product/operator-outcome-review";

export type RetainerReadinessRemediation = {
  dimension: string;
  status: "PASS" | "WATCH" | "FAIL" | "UNAVAILABLE";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  issue: string;
  recommendedAction: string;
  owner: "operator" | "admin" | "founder" | "future-team";
  actionHref?: string;
  actionLabel?: string;
};

export type RemediationInput = {
  readiness: {
    roleContractActive: boolean;
    sponsorCommandSummaryComplete: boolean;
    portfolioExposureMature: boolean;
    evidenceIntegrity: boolean;
    ipExposureControl: boolean;
    cadenceSignalActive: boolean;
    counselMemoryExists: boolean;
    boardroomMemoryExists: boolean;
    outcomeThin: boolean;
  };
  queueCounts: {
    due: number;
    overdue: number;
    skipped: number;
    escalated: number;
    notConfigured: number;
  };
  runtime: General50KRuntimeInput;
  verificationQueuePosture: ReviewQueuePosture;
};

const SEVERITY_ORDER: Record<RetainerReadinessRemediation["severity"], number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

const STATUS_ORDER: Record<RetainerReadinessRemediation["status"], number> = {
  FAIL: 0,
  WATCH: 1,
  PASS: 2,
  UNAVAILABLE: 3,
};

export function buildRetainerReadinessRemediation(
  input: RemediationInput,
): RetainerReadinessRemediation[] {
  const items: RetainerReadinessRemediation[] = [];

  // Cadence not configured
  if (input.queueCounts.notConfigured > 0) {
    items.push({
      dimension: "Cadence configuration",
      status: "FAIL",
      severity: "HIGH",
      issue: `${input.queueCounts.notConfigured} retained scope(s) have no cadence configured.`,
      recommendedAction: "Configure retained cadence for unconfigured scopes to begin oversight cycles.",
      owner: "operator",
      actionHref: "/admin/retained-cadence",
      actionLabel: "Open cadence queue",
    });
  }

  // Overdue cadence cycles
  if (input.queueCounts.overdue > 0) {
    items.push({
      dimension: "Overdue cadence cycles",
      status: "FAIL",
      severity: input.queueCounts.overdue >= 3 ? "CRITICAL" : "HIGH",
      issue: `${input.queueCounts.overdue} retained oversight cycle(s) are overdue.`,
      recommendedAction: "Review and complete overdue retained cadence cycles.",
      owner: "operator",
      actionHref: "/admin/retained-cadence",
      actionLabel: "Review cadence queue",
    });
  }

  // Sponsor command summary incomplete
  if (!input.readiness.sponsorCommandSummaryComplete) {
    items.push({
      dimension: "Oversight brief completeness",
      status: "FAIL",
      severity: "HIGH",
      issue: "Sponsor command summary is incomplete. Oversight brief, cadence posture, or cancellation loss data is missing.",
      recommendedAction: "Generate or review the latest oversight cycle to populate missing summary data.",
      owner: "operator",
      actionHref: "/admin/oversight-review",
      actionLabel: "Open oversight review",
    });
  }

  // Counsel memory absent
  if (!input.readiness.counselMemoryExists) {
    items.push({
      dimension: "Counsel memory",
      status: "FAIL",
      severity: "MEDIUM",
      issue: "No counsel events recorded on this retained scope.",
      recommendedAction: "Initiate a counsel review workflow or record a counsel observation.",
      owner: "operator",
      actionHref: "/admin/oversight-review",
      actionLabel: "Open oversight review",
    });
  }

  // Boardroom archive absent
  if (!input.readiness.boardroomMemoryExists) {
    items.push({
      dimension: "Boardroom archive",
      status: "WATCH",
      severity: "LOW",
      issue: "No boardroom dossiers recorded. Boardroom escalation track is empty.",
      recommendedAction: "Consider a boardroom escalation or note that this scope has not yet required boardroom-level review.",
      owner: "operator",
      actionHref: "/admin/boardroom-archive",
      actionLabel: "Open boardroom archive",
    });
  }

  // Outcome history thin
  if (input.readiness.outcomeThin) {
    items.push({
      dimension: "Retained outcome history",
      status: "FAIL",
      severity: "HIGH",
      issue: "Outcome history is thin. Retained cycle verification has insufficient depth for general readiness.",
      recommendedAction: "Complete at least one full retained cycle and verify outcomes.",
      owner: "operator",
      actionHref: "/admin/outcome-verification",
      actionLabel: "Review outcome verification",
    });
  }

  // Verification queue SLA
  const slaBand = input.verificationQueuePosture.reviewSlaBand;
  if (slaBand === "CRITICAL" || slaBand === "RED") {
    items.push({
      dimension: "Outcome verification SLA",
      status: "FAIL",
      severity: slaBand === "CRITICAL" ? "CRITICAL" : "HIGH",
      issue: `Verification queue SLA band is ${slaBand}. ${input.verificationQueuePosture.criticalPendingCount} critical item(s) pending, ${input.verificationQueuePosture.overdueReviewCount} overdue.`,
      recommendedAction: "Resolve critical and overdue verification queue items.",
      owner: "operator",
      actionHref: "/admin/outcome-verification",
      actionLabel: "Open verification queue",
    });
  } else if (slaBand === "AMBER" && input.verificationQueuePosture.pendingCount > 0) {
    items.push({
      dimension: "Outcome verification SLA",
      status: "WATCH",
      severity: "MEDIUM",
      issue: `Verification queue SLA band is AMBER. ${input.verificationQueuePosture.pendingCount} item(s) pending review.`,
      recommendedAction: "Review pending outcome verification items before they become overdue.",
      owner: "operator",
      actionHref: "/admin/outcome-verification",
      actionLabel: "Open verification queue",
    });
  }

  // Email transport not configured
  if (input.runtime.emailTransportStatus === "TRANSPORT_PENDING") {
    items.push({
      dimension: "Email transport",
      status: "FAIL",
      severity: "HIGH",
      issue: "Email transport provider is not configured. Retained brief delivery cannot complete.",
      recommendedAction: "Configure an email delivery provider. This requires environment-level configuration outside the admin panel.",
      owner: "founder",
      actionHref: "/admin/delivery-queue",
      actionLabel: "Review delivery queue",
    });
  }

  // PDF runtime not verified
  if (!input.runtime.pdfRuntimeVerified) {
    items.push({
      dimension: "PDF delivery runtime",
      status: "FAIL",
      severity: "MEDIUM",
      issue: "PDF runtime files are missing or undersized. Oversight brief and proof pack PDFs cannot be verified.",
      recommendedAction: "Generate PDF runtime proof files and verify their presence in the PDF dashboard.",
      owner: "admin",
      actionHref: "/admin/pdf-dashboard",
      actionLabel: "Open PDF dashboard",
    });
  }

  // Scheduler-backed cadence not active
  if (!input.runtime.schedulerBackedCadence) {
    items.push({
      dimension: "Cadence scheduler",
      status: "FAIL",
      severity: "MEDIUM",
      issue: "Scheduler-backed cadence routes are not present. Automated oversight cycle triggering is unavailable.",
      recommendedAction: "Configure scheduled cadence routes to enable automated cadence execution.",
      owner: "admin",
      actionHref: "/admin/retained-cadence",
      actionLabel: "Review cadence configuration",
    });
  }

  // Retained history depth thin
  if (input.runtime.retainedHistoryDepth === "THIN") {
    items.push({
      dimension: "Retained history depth",
      status: "WATCH",
      severity: "HIGH",
      issue: "Retained oversight history is thin. Infrastructure is ready but case depth is insufficient for general £50k readiness.",
      recommendedAction: "Complete additional retained oversight cycles to build sufficient case history.",
      owner: "operator",
      actionHref: "/admin/retained-cadence",
      actionLabel: "Open cadence queue",
    });
  }

  // Delivery audit depth insufficient
  if (
    input.runtime.deliveryAuditDepth === "FOUNDATION_READY" ||
    input.runtime.deliveryAuditDepth === "NOT_READY"
  ) {
    items.push({
      dimension: "Delivery audit depth",
      status: "WATCH",
      severity: "MEDIUM",
      issue: "No delivery audit trail recorded. No email delivery attempts are on file.",
      recommendedAction: "Review the delivery queue and ensure at least one delivery has been recorded and audited.",
      owner: "operator",
      actionHref: "/admin/delivery-queue",
      actionLabel: "Open delivery queue",
    });
  }

  // Suppression ledger coverage below threshold
  if (input.runtime.suppressionLedgerCoverage < 5) {
    items.push({
      dimension: "Suppression ledger coverage",
      status: "WATCH",
      severity: "LOW",
      issue: `Suppression ledger covers ${input.runtime.suppressionLedgerCoverage} surface(s). Five or more are required for general readiness.`,
      recommendedAction: "Review suppression events and ensure all corridor surfaces are covered in the ledger.",
      owner: "operator",
      actionHref: "/admin/suppression-ledger",
      actionLabel: "Open suppression ledger",
    });
  }

  items.sort((a, b) => {
    const bySeverity = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (bySeverity !== 0) return bySeverity;
    return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
  });

  return items;
}
