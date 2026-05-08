/**
 * lib/product/oversight-brief-contract.ts — Canonical Oversight Brief type.
 *
 * The brief must answer: what changed, what worsened, what repeated,
 * what became more expensive, what became harder to reverse, what option
 * is closing, what loss is becoming permanent, what must be decided now,
 * what happens if this cycle is ignored.
 */

export type OversightRequiredAction = {
  action: string;
  reason: string;
  caseId?: string;
  urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  evidenceBasis: string[];
  ownerRole?: "CLIENT" | "OPERATOR" | "COUNSEL" | "BOARD";
  clientSafe: boolean;
};

export type OversightBrief = {
  briefId: string;
  accountId: string;
  periodStart: string;
  periodEnd: string;
  executiveSummary: string;
  activeCases: Array<{
    caseId: string;
    title: string;
    state: string;
    primaryRisk?: string;
    nextAction?: string;
  }>;
  costOfInaction?: {
    totalEstimated: number;
    casesIncluded: number;
  };
  counsel: {
    reviewsTriggered: number;
    requiredNow: number;
  };
  boardroom: {
    dossiersAvailable: number;
    exportsQueued: number;
  };
  cadence?: {
    status: string;
    health: string;
    currentCycleDueDate?: string;
    nextCycleDueDate?: string;
    explanation: string;
  };
  verification: {
    commitmentsDue: number;
    commitmentsVerified: number;
    unresolvedBreaches: number;
  };
  counselHistory?: {
    totalEvents: number;
    openCount: number;
    summary: string;
    entries: Array<{
      id: string;
      caseId: string;
      status: string;
      triggerReason: string;
      resultingAction?: string;
    }>;
  };
  boardroomArchive?: {
    totalDossiers: number;
    previousDossierCount: number;
    unresolvedBoardLevelIssues: number;
    repeatedExposureCount: number;
    summary: string;
  };
  organisationDivergence?: {
    count: number;
    summary: string;
    suppressedDetailCount: number;
    items: Array<{
      type: string;
      affectedDomain: string;
      confidence: string;
      sponsorSafeSummary: string;
      recommendedNextAction: string;
    }>;
  };
  retainedEnforcement?: {
    cyclesReviewed: number;
    activeRetainedDecisions: number;
    enforcementBreaches: number;
    improvementSignals: number;
    deteriorationSignals: number;
  };
  decisionCredit?: {
    score?: number;
    trend?: string;
    interpretation?: string;
  };
  patternRecurrence?: {
    status: string;
    priorCount: number;
    explanation: string;
  };

  // ── Premium intelligence primitives ──

  decisionLosses?: {
    totalKnownLoss?: number;
    currency?: "GBP" | "USD" | "EUR" | "UNKNOWN";
    entries: Array<{
      id: string;
      caseId: string;
      category: string;
      description: string;
      evidenceBasis: string[];
      confidence: "LOW" | "MEDIUM" | "HIGH";
      clientSafe: boolean;
    }>;
    warnings: string[];
  };

  strategicOptions?: {
    valueAtRisk?: number;
    currency?: "GBP" | "USD" | "EUR" | "UNKNOWN";
    options: Array<{
      id: string;
      caseId: string;
      label: string;
      status: "AVAILABLE" | "CLOSING" | "CLOSED" | "EXERCISED" | "EXPIRED";
      closingReason?: string;
      deadline?: string;
      evidenceBasis: string[];
      recommendedAction?: string;
    }>;
    warnings: string[];
  };

  decisionDependencies?: {
    conflicts: Array<{
      id: string;
      sourceCaseId: string;
      targetCaseId?: string;
      relationship: "BLOCKS" | "REQUIRES" | "INVALIDATES" | "ENABLES" | "COMPOUNDS";
      severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
      explanation: string;
      evidenceBasis: string[];
      requiredAction?: string;
    }>;
    warnings: string[];
  };

  irreversibility?: {
    score: number;
    level: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "IRREVERSIBLE";
    drivers: Array<{
      label: string;
      evidenceBasis: string[];
      weight: number;
    }>;
    explanation: string;
    warnings: string[];
  };

  cycleConsequenceProjection?: {
    summary: string;
    likelyMovement: Array<{
      dimension: "COST" | "COMMITMENT" | "RECURRENCE" | "OPTION_DECAY" | "IRREVERSIBILITY" | "LOSS";
      direction: "WORSENING" | "UNCHANGED" | "UNKNOWN";
      explanation: string;
    }>;
    requiredAction: string;
  };

  /** What this cycle surfaced that would likely have remained hidden */
  valueProtected?: {
    title: string;
    summary: string;
    missedSignals: Array<{
      label: string;
      source: string;
      whyItMatters: string;
      evidenceBasis: string;
      severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    }>;
  };

  /** What visibility would likely be lost without continued oversight */
  cancellationLoss?: {
    summary: string;
    lostVisibility: Array<{
      area:
        | "COST"
        | "COMMITMENT"
        | "RECURRENCE"
        | "IRREVERSIBILITY"
        | "OPTIONS"
        | "LOSSES"
        | "DEPENDENCIES"
        | "BOARDROOM"
        | "COUNSEL"
        | "OUTCOMES";
      description: string;
      evidenceBasis: string;
      severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    }>;
  };
  indispensability?: {
    headline: string;
    wouldLose: string[];
    preservedVisibility: string[];
    currentDependencyLevel: "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
    basis: string[];
  };

  /** Required actions (string form for backward compatibility) */
  requiredActions: string[];
  /** Structured required actions with evidence basis, urgency, and owner */
  structuredActions?: OversightStructuredAction[];
};

export type OversightStructuredAction = {
  id: string;
  caseId?: string;
  decisionText?: string;
  actionType:
    | "VERIFY_COMMITMENT"
    | "ESCALATE_COUNSEL"
    | "GENERATE_BOARDROOM_DOSSIER"
    | "RESOLVE_DEPENDENCY"
    | "PROTECT_OPTION"
    | "ADDRESS_IRREVERSIBILITY"
    | "REVIEW_LOSS"
    | "RECHECK_PATTERN";
  action: string;
  evidenceBasis: string;
  deadline?: string;
  ownerRole?: string;
  consequenceIfIgnored?: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
};
