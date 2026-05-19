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
    updatedAt: "2026-04-08",
    version: "2.0.0",
    lifecycleState: "ACTIVE_UNTIL_SUPERSEDED",
    currentUntil: "Superseded by GMI-Q2-2026",
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
      "This report reviews Q1 2026 conditions and remains active for Q2 decision use because it includes April 2026 tariff escalation, market repricing, and Q2 scenario implications. It will remain current until superseded by the Q2 2026 Market Intelligence Report.",
  },
  {
    id: "GMI-Q2-2026",
    title: "Global Market Intelligence Q2 2026",
    canonicalLine: "GLOBAL_MARKET_INTELLIGENCE",
    quarter: "Q2",
    year: 2026,
    coveragePeriod: "Q2 2026",
    decisionWindow: "Q3 2026",
    lifecycleState: "DRAFT",
    supersededBy: null,
    replaces: "GMI-Q1-2026",
    nextExpected: null,
    purchasable: false,
    publicVisible: false,
    archiveVisible: false,
    freshnessNote:
      "The Q2 2026 Market Intelligence Report is in preparation and is not public, purchasable, or indexed as an active report.",
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
