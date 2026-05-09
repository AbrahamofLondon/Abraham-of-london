import type { BuyerVisibleCadencePosture } from "@/lib/product/retained-cadence-contract";
import type { RetainedOutcomeSummary } from "@/lib/product/retained-outcome-summary";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export type ReadinessStatus =
  | "NOT_READY"
  | "FOUNDATION_READY"
  | "SELECTIVELY_DEFENSIBLE"
  | "DEFENSIBLE"
  | "GENERAL_50K_READY";

export type EmailTransportStatus =
  | "TRANSPORT_PENDING"
  | "TEST_MODE_READY"
  | "PROVIDER_READY";

export type ReadinessArea = {
  area: string;
  status: ReadinessStatus;
  evidence: string;
  gap: string | null;
};

export type RetainerReadinessResult = {
  classifiedAt: string;
  overallClassification: string;
  areas: ReadinessArea[];
  blockers: string[];
  strongestAreas: string[];
};

export type RetainerReadinessClassification =
  | "FOUNDATION_READY"
  | "SELECTIVE_5K_READY"
  | "SELECTIVE_15K_READY"
  | "SELECTIVE_HIGH_VALUE_READY"
  | "HIGH_VALUE_RETAINER_READY"
  | "GENERAL_50K_BLOCKED"
  | "GENERAL_50K_READY"
  | "GENERAL_50K_INFRASTRUCTURE_READY_HISTORY_LIMITED";

export type General50KRuntimeInput = {
  schedulerBackedCadence: boolean;
  cadenceTickVerified: boolean;
  emailTransportStatus: EmailTransportStatus;
  pdfRuntimeVerified: boolean;
  suppressionLedgerCoverage: number;
  portfolioScopeMaturity: ReadinessStatus;
  crossOrgPatternDepth: ReadinessStatus;
  roleDataLayerCoverage: ReadinessStatus;
  retainedHistoryDepth: "THIN" | "SUFFICIENT";
  deliveryAuditDepth: ReadinessStatus;
  // Institutional corridor dimensions
  institutionalCaseContinuity: ReadinessStatus;
  executiveToStrategyContinuity: ReadinessStatus;
  strategyToCounselContinuity: ReadinessStatus;
  strategyToBoardroomContinuity: ReadinessStatus;
  boardroomArchiveDepth: ReadinessStatus;
  oversightCaseCoverage: ReadinessStatus;
  cadenceRuntimeDepth: ReadinessStatus;
  portfolioInstitutionalCoverage: ReadinessStatus;
  suppressionCorridorCoverage: ReadinessStatus;
  deliveryRuntimeProof: ReadinessStatus;
  retainedOutcomeDepth: ReadinessStatus;
};

/* ------------------------------------------------------------------ */
/*  Area classifier (new)                                             */
/* ------------------------------------------------------------------ */

export function classifyRetainerReadinessAreas(): RetainerReadinessResult {
  const areas: ReadinessArea[] = [
    {
      area: "Client-safe delivery",
      status: "SELECTIVELY_DEFENSIBLE",
      evidence: "PDF API routes exist; client-safe oversight brief service built.",
      gap: "No longitudinal PDF archive export yet.",
    },
    {
      area: "Role separation",
      status: "SELECTIVELY_DEFENSIBLE",
      evidence: "retained-role-contract.ts exists with explicit role model (OWNER, SPONSOR, RESPONDENT, OPERATOR, COUNSEL_REVIEWER, ADMIN).",
      gap: "Role enforcement is product-layer only; not yet enforced at middleware level.",
    },
    {
      area: "Cadence enforcement",
      status: "SELECTIVELY_DEFENSIBLE",
      evidence: "retained-cadence-service.ts exists with createNextReviewCycle; cadence states are runtime-backed.",
      gap: "Cadence automation requires live configuration on retained scopes.",
    },
    {
      area: "Portfolio memory",
      status: "SELECTIVELY_DEFENSIBLE",
      evidence: "portfolio-memory-surface.ts exists; portfolio pattern memory and risk aggregation are runtime-backed.",
      gap: "Portfolio memory surface has type-level issues that need resolution.",
    },
    {
      area: "Suppression ledger",
      status: "SELECTIVELY_DEFENSIBLE",
      evidence: "suppression-ledger.ts exists as a standalone auditable suppression ledger.",
      gap: null,
    },
    {
      area: "Retained outcome history",
      status: "SELECTIVELY_DEFENSIBLE",
      evidence: "Outcome verification service exists; retained outcome summary is runtime-backed.",
      gap: "No longitudinal trend surface; outcome history may be thin on live scopes.",
    },
    {
      area: "Boardroom archive",
      status: "SELECTIVELY_DEFENSIBLE",
      evidence: "Boardroom archive and dossier archive services exist.",
      gap: "No export capability for boardroom archive.",
    },
    {
      area: "Counsel memory",
      status: "SELECTIVELY_DEFENSIBLE",
      evidence: "Counsel case service, review workflow, and history loader exist.",
      gap: null,
    },
    {
      area: "Cancellation / continuity loss",
      status: "DEFENSIBLE",
      evidence: "RetainedMemoryLossPanel exists; cancellation loss summary is sponsor-safe.",
      gap: null,
    },
    {
      area: "IP exposure control",
      status: "DEFENSIBLE",
      evidence: "All IP exposure guards pass; intelligence boundary guard enforced.",
      gap: null,
    },
    {
      area: "Evidence integrity",
      status: "DEFENSIBLE",
      evidence: "Field provenance contract and evidence posture classification are runtime-backed.",
      gap: null,
    },
    {
      area: "Commercial defensibility",
      status: "SELECTIVELY_DEFENSIBLE",
      evidence: "Product recommendation card uses earned progression; no SaaS paywall language.",
      gap: "Commercial surfaces require continued guard enforcement.",
    },
    {
      area: "Organisation divergence",
      status: "SELECTIVELY_DEFENSIBLE",
      evidence: "Organisation divergence summary is computed at runtime.",
      gap: "Divergence is not independently surfaced to sponsors.",
    },
    {
      area: "Decision credit governance",
      status: "SELECTIVELY_DEFENSIBLE",
      evidence: "Decision credit governance module exists.",
      gap: "Credit governance is not yet surfaced in sponsor command view.",
    },
    {
      area: "Cross-org pattern intelligence",
      status: "FOUNDATION_READY",
      evidence: "Portfolio risk aggregation exists but is single-org scoped.",
      gap: "Cross-org pattern recognition requires multi-org portfolio support.",
    },
    {
      area: "Enterprise Control Room",
      status: "SELECTIVELY_DEFENSIBLE",
      evidence: "Enterprise control room contract, loader, and safety modules exist.",
      gap: "Control room is operator-only; no sponsor-facing control room surface.",
    },
    {
      area: "Institutional case corridor",
      status: "SELECTIVELY_DEFENSIBLE",
      evidence: "Institutional case contract, resolver, and service are runtime-backed. ER creates/updates institutional case on completion.",
      gap: "Corridor continuity requires live retained history across all surfaces.",
    },
    {
      area: "ER to Strategy Room continuity",
      status: "SELECTIVELY_DEFENSIBLE",
      evidence: "ER result carries institutional case context into Strategy Room via corridor panel.",
      gap: null,
    },
    {
      area: "Strategy to Counsel continuity",
      status: "SELECTIVELY_DEFENSIBLE",
      evidence: "Counsel case creation attaches to institutional case corridor.",
      gap: null,
    },
    {
      area: "Strategy to Boardroom continuity",
      status: "SELECTIVELY_DEFENSIBLE",
      evidence: "Boardroom page shows institutional case qualification context.",
      gap: null,
    },
    {
      area: "Boardroom archive depth",
      status: "SELECTIVELY_DEFENSIBLE",
      evidence: "Boardroom archive and dossier services exist with institutional case reference.",
      gap: "Archive depth requires cumulative boardroom history across retained scope.",
    },
    {
      area: "Oversight case coverage",
      status: "SELECTIVELY_DEFENSIBLE",
      evidence: "Oversight command shows institutional case counts and qualification metrics.",
      gap: null,
    },
    {
      area: "Suppression corridor coverage",
      status: "DEFENSIBLE",
      evidence: "Suppression events are recorded across all corridor surfaces including ER, counsel, boardroom, oversight, portfolio, and proof pack.",
      gap: null,
    },
    {
      area: "Delivery runtime proof",
      status: "SELECTIVELY_DEFENSIBLE",
      evidence: "Delivery queue references institutional case. PDF generation is runtime-verified.",
      gap: "Email transport remains TRANSPORT_PENDING until provider is configured.",
    },
    {
      area: "Role and permission corridor enforcement",
      status: "SELECTIVELY_DEFENSIBLE",
      evidence: "Corridor permissions added to role contract. All corridor surfaces declare required permission.",
      gap: null,
    },
    {
      area: "Retained outcome depth",
      status: "SELECTIVELY_DEFENSIBLE",
      evidence: "Outcome verification service and retained outcome summary exist.",
      gap: "Outcome history may be thin on live scopes.",
    },
  ];

  const blockers: string[] = [];
  const strongestAreas: string[] = [];

  for (const a of areas) {
    if (a.status === "NOT_READY" || a.status === "FOUNDATION_READY") {
      blockers.push(`${a.area}: ${a.gap ?? "not ready"}`);
    }
    if (a.status === "DEFENSIBLE" || a.status === "GENERAL_50K_READY") {
      strongestAreas.push(a.area);
    }
  }

  const hasNotReady = areas.some((a) => a.status === "NOT_READY");
  const hasFoundationOnly = areas.some((a) => a.status === "FOUNDATION_READY");
  const allAtLeastSelective = areas.every(
    (a) => a.status === "SELECTIVELY_DEFENSIBLE" || a.status === "DEFENSIBLE" || a.status === "GENERAL_50K_READY",
  );
  const allDefensibleOrHigher = areas.every(
    (a) => a.status === "DEFENSIBLE" || a.status === "GENERAL_50K_READY",
  );

  let overallClassification: string;
  if (allDefensibleOrHigher) {
    overallClassification = "GENERAL_50K_READY";
  } else if (allAtLeastSelective) {
    overallClassification = "HIGH_VALUE_RETAINER_READY";
  } else if (hasNotReady) {
    overallClassification = "SELECTIVE_HIGH_VALUE_READY";
  } else if (hasFoundationOnly) {
    overallClassification = "HIGH_VALUE_RETAINER_READY_FOR_CONTROLLED_SCOPES";
  } else {
    overallClassification = "FOUNDATION_READY";
  }

  return {
    classifiedAt: new Date().toISOString(),
    overallClassification,
    areas,
    blockers,
    strongestAreas,
  };
}

/* ------------------------------------------------------------------ */
/*  Runtime classifier (existing API — used by retainer-readiness page) */
/* ------------------------------------------------------------------ */

export function classifyRetainerReadiness(input: {
  cadence: BuyerVisibleCadencePosture | null;
  cadenceSignalActive: boolean;
  roleContractActive: boolean;
  sponsorCommandSummaryComplete: boolean;
  portfolioExposureMature: boolean;
  retainedOutcomeSummary: RetainedOutcomeSummary | null;
  counselMemoryExists: boolean;
  boardroomMemoryExists: boolean;
  evidenceIntegrity: boolean;
  ipExposureControl: boolean;
}): RetainerReadinessClassification {
  if (!input.evidenceIntegrity || !input.ipExposureControl) return "FOUNDATION_READY";

  const cadenceMature = Boolean(
    input.cadence
    && ["SCHEDULED", "DUE_SOON", "OVERDUE", "COMPLETED", "SKIPPED_WITH_REASON", "ESCALATED"].includes(input.cadence.state),
  );
  const cadenceAutomationActive = Boolean(
    input.cadence
    && (input.cadence.cadenceSource === "scheduled" || input.cadence.cadenceSource === "system_triggered"),
  );
  const memoryExists = input.counselMemoryExists || input.boardroomMemoryExists;
  const outcomesReady = Boolean(input.retainedOutcomeSummary && !input.retainedOutcomeSummary.thinState);
  const baseSelectiveReady = input.sponsorCommandSummaryComplete && memoryExists;

  if (!baseSelectiveReady) {
    return input.roleContractActive ? "SELECTIVE_5K_READY" : "FOUNDATION_READY";
  }

  if (
    cadenceMature
    && input.roleContractActive
    && input.sponsorCommandSummaryComplete
    && memoryExists
  ) {
    if (
      cadenceAutomationActive
      && input.cadenceSignalActive
      && outcomesReady
      && input.counselMemoryExists
      && input.boardroomMemoryExists
      && input.portfolioExposureMature
    ) {
      return "GENERAL_50K_READY";
    }

    return "SELECTIVE_HIGH_VALUE_READY";
  }

  if (baseSelectiveReady) {
    if (cadenceMature || input.roleContractActive) return "GENERAL_50K_BLOCKED";
    return "SELECTIVE_15K_READY";
  }

  return "FOUNDATION_READY";
}

export function classifyGeneral50KRuntime(input: General50KRuntimeInput): RetainerReadinessClassification {
  const atLeastDefensible = (s: ReadinessStatus) => s === "DEFENSIBLE" || s === "GENERAL_50K_READY";

  const baseInfrastructureReady =
    input.schedulerBackedCadence
    && input.cadenceTickVerified
    && (input.emailTransportStatus === "PROVIDER_READY" || input.emailTransportStatus === "TEST_MODE_READY")
    && input.pdfRuntimeVerified
    && input.suppressionLedgerCoverage >= 5
    && atLeastDefensible(input.portfolioScopeMaturity)
    && atLeastDefensible(input.crossOrgPatternDepth)
    && atLeastDefensible(input.roleDataLayerCoverage)
    && atLeastDefensible(input.deliveryAuditDepth);

  // Institutional corridor readiness — all corridor surfaces must be connected
  const corridorReady =
    atLeastDefensible(input.institutionalCaseContinuity)
    && atLeastDefensible(input.executiveToStrategyContinuity)
    && atLeastDefensible(input.strategyToCounselContinuity)
    && atLeastDefensible(input.strategyToBoardroomContinuity)
    && atLeastDefensible(input.boardroomArchiveDepth)
    && atLeastDefensible(input.oversightCaseCoverage)
    && atLeastDefensible(input.cadenceRuntimeDepth)
    && atLeastDefensible(input.portfolioInstitutionalCoverage)
    && atLeastDefensible(input.suppressionCorridorCoverage)
    && atLeastDefensible(input.deliveryRuntimeProof)
    && atLeastDefensible(input.retainedOutcomeDepth);

  const infrastructureReady = baseInfrastructureReady && corridorReady;

  if (!infrastructureReady) return "GENERAL_50K_BLOCKED";
  if (input.retainedHistoryDepth === "THIN") return "GENERAL_50K_INFRASTRUCTURE_READY_HISTORY_LIMITED";
  return "GENERAL_50K_READY";
}
