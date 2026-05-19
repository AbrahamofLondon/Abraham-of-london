export type MarketIntelligenceEditionType =
  | "PUBLIC_SURFACE"
  | "INSTITUTIONAL_PDF"
  | "BOARD_BRIEFING_DECK"
  | "BOARDROOM_PDF";

export type MarketIntelligenceEditionRecord = {
  reportId: string;
  edition: MarketIntelligenceEditionType;
  label: string;
  access: "OPEN" | "PAID" | "RESTRICTED" | "QUALIFIED";
  href?: string;
  priceCode?: string;
  entitlementSlug?: string;
  available: boolean;
  description: string;
};

export const GMI_Q1_2026_EDITIONS: readonly MarketIntelligenceEditionRecord[] =
  [
    {
      reportId: "GMI-Q1-2026",
      edition: "PUBLIC_SURFACE",
      label: "Public Surface Edition",
      access: "OPEN",
      href: "/intelligence/global-market-intelligence-q1-2026",
      available: true,
      description:
        "Open thesis, selected scenario framework, and public decision implications.",
    },
    {
      reportId: "GMI-Q1-2026",
      edition: "INSTITUTIONAL_PDF",
      label: "Institutional PDF Edition",
      access: "PAID",
      href: "/artifacts/global-market-intelligence-report-q1-2026",
      priceCode: "gmi_q1_2026",
      entitlementSlug: "global-market-intelligence-report-q1-2026",
      available: true,
      description:
        "Full operating analysis, board instructions, case evidence, fuller methodology. Restricted access.",
    },
    {
      reportId: "GMI-Q1-2026",
      edition: "BOARD_BRIEFING_DECK",
      label: "Board Briefing Deck",
      access: "RESTRICTED",
      href: "/artifacts/global-market-intelligence-board-deck-q1-2026",
      available: true,
      description: "Condensed board-ready artefact for institutional use.",
    },
    {
      reportId: "GMI-Q1-2026",
      edition: "BOARDROOM_PDF",
      label: "Boardroom PDF",
      access: "QUALIFIED",
      available: false,
      description: "Qualified access boardroom edition. Not currently available.",
    },
  ] as const;

export const MARKET_INTELLIGENCE_EDITIONS: Record<
  string,
  readonly MarketIntelligenceEditionRecord[]
> = {
  "GMI-Q1-2026": GMI_Q1_2026_EDITIONS,
};

export function getEditionsForReport(
  reportId: string,
): readonly MarketIntelligenceEditionRecord[] {
  return MARKET_INTELLIGENCE_EDITIONS[reportId] ?? [];
}

export function getEdition(
  reportId: string,
  edition: MarketIntelligenceEditionType,
): MarketIntelligenceEditionRecord | null {
  return (
    getEditionsForReport(reportId).find((e) => e.edition === edition) ?? null
  );
}

export function getAvailableEditions(
  reportId: string,
): MarketIntelligenceEditionRecord[] {
  return getEditionsForReport(reportId).filter((e) => e.available);
}

export function getEditionAccessLabel(
  access: MarketIntelligenceEditionRecord["access"],
): string {
  switch (access) {
    case "OPEN":       return "Open";
    case "PAID":       return "Paid";
    case "RESTRICTED": return "Restricted";
    case "QUALIFIED":  return "Qualified";
  }
}
