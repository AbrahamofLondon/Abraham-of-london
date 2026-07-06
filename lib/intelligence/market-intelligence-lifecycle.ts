export type MarketIntelligenceLifecycleState =
  | "DRAFT"
  | "SCHEDULED"
  | "ACTIVE"
  | "ACTIVE_UNTIL_SUPERSEDED"
  | "SUPERSEDED"
  | "ARCHIVED"
  | "RETIRED";

export type MarketIntelligenceEdition =
  | "PUBLIC_SURFACE"
  | "INSTITUTIONAL_PDF"
  | "BOARD_BRIEFING"
  | "BOARDROOM_PDF";

export type MarketIntelligenceLifecycleRecord = {
  id: string;
  title: string;
  canonicalLine: "GLOBAL_MARKET_INTELLIGENCE";
  quarter: "Q1" | "Q2" | "Q3" | "Q4";
  year: number;
  coveragePeriod: string;
  decisionWindow: string;
  publishedAt?: string;
  /** For drafts/release candidates: the scheduled publication date (ISO). */
  publicationTarget?: string;
  updatedAt?: string;
  version?: string;
  lifecycleState: MarketIntelligenceLifecycleState;
  currentUntil?: string;
  supersededBy?: string | null;
  replaces?: string | null;
  nextExpected?: string | null;
  publicHref?: string;
  institutionalHref?: string;
  boardHref?: string;
  purchasable: boolean;
  publicVisible: boolean;
  archiveVisible: boolean;
  freshnessNote: string;
};

export const MARKET_INTELLIGENCE_LIFECYCLE: readonly MarketIntelligenceLifecycleRecord[] = [
  {
    id: "GMI-Q1-2026",
    title: "Global Market Intelligence Q1 2026",
    canonicalLine: "GLOBAL_MARKET_INTELLIGENCE",
    quarter: "Q1",
    year: 2026,
    coveragePeriod: "Q1 2026",
    decisionWindow: "Q2 2026",
    publishedAt: "2026-04-08",
    updatedAt: "2026-07-06",
    version: "2.0.0",
    lifecycleState: "ACTIVE_UNTIL_SUPERSEDED",
    currentUntil: "Active until GMI-Q2-2026 receives owner release authority",
    supersededBy: null,
    replaces: null,
    nextExpected: "GMI-Q2-2026",
    publicHref: "/intelligence/global-market-intelligence-q1-2026",
    institutionalHref: "/artifacts/global-market-intelligence-report-q1-2026",
    boardHref: "/artifacts/global-market-intelligence-board-deck-q1-2026",
    purchasable: true,
    publicVisible: true,
    archiveVisible: true,
    freshnessNote:
      "This report reviews Q1 2026 conditions and remains the current published GMI edition until GMI-Q2-2026 receives owner release authority after the final data lock.",
  },
  {
    id: "GMI-Q2-2026",
    title: "Global Market Intelligence Q2 2026",
    canonicalLine: "GLOBAL_MARKET_INTELLIGENCE",
    quarter: "Q2",
    year: 2026,
    coveragePeriod: "Q2 2026",
    decisionWindow: "Q3 2026",
    publicationTarget: "2026-07-08",
    updatedAt: "2026-07-06",
    version: "1.0.0-rc",
    lifecycleState: "DRAFT",
    currentUntil: "Pending owner release authority after post-8-July data lock",
    supersededBy: null,
    replaces: "GMI-Q1-2026",
    nextExpected: "GMI-Q3-2026",
    publicHref: "/offers/global-market-intelligence-q2",
    institutionalHref: "/artifacts/global-market-intelligence-report-q2-2026",
    boardHref: "/artifacts/global-market-intelligence-report-q2-2026",
    purchasable: false,
    publicVisible: false,
    archiveVisible: false,
    freshnessNote:
      "Pre-release market readiness is complete, but final release clearance remains pending the post-8-July data lock and owner release authority. No publication, Q1 supersession, self-serve checkout, manual fulfilment, or commercial activation is enabled.",
  },
] as const;

export function getMarketIntelligenceRecord(id: string): MarketIntelligenceLifecycleRecord | null {
  return MARKET_INTELLIGENCE_LIFECYCLE.find((record) => record.id === id) ?? null;
}

export function getActiveMarketIntelligenceReports(): MarketIntelligenceLifecycleRecord[] {
  return MARKET_INTELLIGENCE_LIFECYCLE.filter((record) =>
    record.lifecycleState === "ACTIVE" || record.lifecycleState === "ACTIVE_UNTIL_SUPERSEDED",
  );
}

export function getPublicMarketIntelligenceReports(): MarketIntelligenceLifecycleRecord[] {
  return MARKET_INTELLIGENCE_LIFECYCLE.filter((record) => record.publicVisible);
}

export function getMarketIntelligenceFreshnessLabel(record: MarketIntelligenceLifecycleRecord): string {
  return `Coverage period: ${record.coveragePeriod}. Current decision window: ${record.decisionWindow}.`;
}

export function canPurchaseMarketIntelligenceReport(record: MarketIntelligenceLifecycleRecord): boolean {
  return (
    record.purchasable &&
    (record.lifecycleState === "ACTIVE" || record.lifecycleState === "ACTIVE_UNTIL_SUPERSEDED")
  );
}

// ─── Computed commercial/publication state (the single authority) ─────────────
// These derive "current published / upcoming / archive" from lifecycle state and
// dates. The public/commercial surface MUST use these — never a hand-maintained
// `current` boolean — so commercial truth always agrees with the lifecycle.

function isPublishedState(state: MarketIntelligenceLifecycleState): boolean {
  return state === "ACTIVE" || state === "ACTIVE_UNTIL_SUPERSEDED";
}

/**
 * The current published GMI report: a published/active edition whose publish date
 * has passed and which has not been superseded. Release candidates and drafts are
 * never returned. Returns the most recently published when several qualify.
 */
export function getCurrentPublishedMarketIntelligenceReport(
  asOf: Date = new Date(),
): MarketIntelligenceLifecycleRecord | null {
  const candidates = MARKET_INTELLIGENCE_LIFECYCLE.filter(
    (r) =>
      isPublishedState(r.lifecycleState) &&
      !r.supersededBy,
  );
  return (
    [...candidates].sort(
      (a, b) =>
        new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime(),
    )[0] ?? null
  );
}

/**
 * The forthcoming GMI report: a draft/scheduled edition, or a published edition
 * whose publish date is still in the future (a release candidate before its date).
 */
export function getUpcomingMarketIntelligenceReport(
  asOf: Date = new Date(),
): MarketIntelligenceLifecycleRecord | null {
  const candidates = MARKET_INTELLIGENCE_LIFECYCLE.filter(
    (r) =>
      r.lifecycleState === "DRAFT" ||
      r.lifecycleState === "SCHEDULED",
  );
  return candidates[0] ?? null;
}

/** Published archive editions (superseded/archived, still visible), excluding the current published issue. */
export function getPublishedArchiveMarketIntelligenceReports(
  asOf: Date = new Date(),
): MarketIntelligenceLifecycleRecord[] {
  const current = getCurrentPublishedMarketIntelligenceReport(asOf);
  return MARKET_INTELLIGENCE_LIFECYCLE.filter(
    (r) =>
      (r.lifecycleState === "SUPERSEDED" || r.lifecycleState === "ARCHIVED") &&
      r.archiveVisible &&
      r.id !== current?.id,
  );
}

/** The decision window of the current published issue (e.g. "Q2 2026"). */
export function getCurrentDecisionWindow(asOf: Date = new Date()): string | null {
  return getCurrentPublishedMarketIntelligenceReport(asOf)?.decisionWindow ?? null;
}

export type MarketIntelligenceCommercialState = {
  isCurrentPublished: boolean;
  isReleaseCandidate: boolean;
  isArchive: boolean;
  purchasable: boolean;
  publicVisible: boolean;
};

/**
 * Lifecycle-derived commercial state for one edition. This is the authority the
 * commercial registry must agree with — see assertGmiRegistryAgreesWithLifecycle.
 */
export function getMarketIntelligenceCommercialState(
  id: string,
  asOf: Date = new Date(),
): MarketIntelligenceCommercialState | null {
  const record = getMarketIntelligenceRecord(id);
  if (!record) return null;
  const current = getCurrentPublishedMarketIntelligenceReport(asOf);
  const upcoming = getUpcomingMarketIntelligenceReport(asOf);
  const isCurrentPublished = current?.id === id;
  const isReleaseCandidate = upcoming?.id === id && !isCurrentPublished;
  const isArchive =
    (record.lifecycleState === "SUPERSEDED" || record.lifecycleState === "ARCHIVED") &&
    !isCurrentPublished;
  return {
    isCurrentPublished,
    isReleaseCandidate,
    isArchive,
    purchasable: record.purchasable,
    publicVisible: record.publicVisible,
  };
}

export function getMarketIntelligenceLifecycleBadge(record: MarketIntelligenceLifecycleRecord): {
  label: string;
  tone: "active" | "draft" | "superseded" | "archived" | "retired";
} {
  switch (record.lifecycleState) {
    case "ACTIVE":
      return { label: "Active", tone: "active" };
    case "ACTIVE_UNTIL_SUPERSEDED":
      return { label: "Active until superseded", tone: "active" };
    case "DRAFT":
    case "SCHEDULED":
      return { label: "In preparation", tone: "draft" };
    case "SUPERSEDED":
      return { label: "Superseded", tone: "superseded" };
    case "ARCHIVED":
      return { label: "Archive reference", tone: "archived" };
    case "RETIRED":
      return { label: "Retired", tone: "retired" };
    default:
      return { label: "In preparation", tone: "draft" };
  }
}
