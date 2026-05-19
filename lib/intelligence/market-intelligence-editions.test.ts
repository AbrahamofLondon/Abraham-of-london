import { describe, expect, it } from "vitest";

import {
  getAvailableEditions,
  getEdition,
  getEditionAccessLabel,
  getEditionsForReport,
  GMI_Q1_2026_EDITIONS,
} from "./market-intelligence-editions";

describe("GMI Q1 2026 editions registry", () => {
  it("defines exactly four editions for GMI-Q1-2026", () => {
    expect(GMI_Q1_2026_EDITIONS).toHaveLength(4);
  });

  it("PUBLIC_SURFACE is OPEN and available", () => {
    const pub = GMI_Q1_2026_EDITIONS.find((e) => e.edition === "PUBLIC_SURFACE");
    expect(pub?.access).toBe("OPEN");
    expect(pub?.available).toBe(true);
  });

  it("INSTITUTIONAL_PDF is PAID and available with price code and entitlement slug", () => {
    const inst = GMI_Q1_2026_EDITIONS.find(
      (e) => e.edition === "INSTITUTIONAL_PDF",
    );
    expect(inst?.access).toBe("PAID");
    expect(inst?.available).toBe(true);
    expect(inst?.priceCode).toBe("gmi_q1_2026");
    expect(inst?.entitlementSlug).toBe("global-market-intelligence-report-q1-2026");
  });

  it("BOARD_BRIEFING_DECK is RESTRICTED and available", () => {
    const board = GMI_Q1_2026_EDITIONS.find(
      (e) => e.edition === "BOARD_BRIEFING_DECK",
    );
    expect(board?.access).toBe("RESTRICTED");
    expect(board?.available).toBe(true);
  });

  it("BOARDROOM_PDF is QUALIFIED and not available", () => {
    const boardroom = GMI_Q1_2026_EDITIONS.find(
      (e) => e.edition === "BOARDROOM_PDF",
    );
    expect(boardroom?.access).toBe("QUALIFIED");
    expect(boardroom?.available).toBe(false);
  });

  it("every edition belongs to GMI-Q1-2026", () => {
    for (const edition of GMI_Q1_2026_EDITIONS) {
      expect(edition.reportId).toBe("GMI-Q1-2026");
    }
  });

  it("every edition has a non-empty label and description", () => {
    for (const edition of GMI_Q1_2026_EDITIONS) {
      expect(edition.label.length).toBeGreaterThan(0);
      expect(edition.description.length).toBeGreaterThan(0);
    }
  });
});

describe("getEditionsForReport", () => {
  it("returns 4 editions for GMI-Q1-2026", () => {
    expect(getEditionsForReport("GMI-Q1-2026")).toHaveLength(4);
  });

  it("returns empty array for unknown report ID", () => {
    expect(getEditionsForReport("GMI-Q9-9999")).toHaveLength(0);
  });
});

describe("getEdition", () => {
  it("resolves INSTITUTIONAL_PDF for GMI-Q1-2026", () => {
    const ed = getEdition("GMI-Q1-2026", "INSTITUTIONAL_PDF");
    expect(ed).not.toBeNull();
    expect(ed?.edition).toBe("INSTITUTIONAL_PDF");
  });

  it("returns null for an unknown edition type on a known report", () => {
    const ed = getEdition("GMI-Q9-9999", "PUBLIC_SURFACE");
    expect(ed).toBeNull();
  });
});

describe("getAvailableEditions", () => {
  it("excludes BOARDROOM_PDF as it is not currently available", () => {
    const available = getAvailableEditions("GMI-Q1-2026");
    expect(available.map((e) => e.edition)).not.toContain("BOARDROOM_PDF");
  });

  it("includes PUBLIC_SURFACE, INSTITUTIONAL_PDF, and BOARD_BRIEFING_DECK", () => {
    const available = getAvailableEditions("GMI-Q1-2026");
    const types = available.map((e) => e.edition);
    expect(types).toContain("PUBLIC_SURFACE");
    expect(types).toContain("INSTITUTIONAL_PDF");
    expect(types).toContain("BOARD_BRIEFING_DECK");
  });
});

describe("getEditionAccessLabel", () => {
  it("maps all access levels to readable strings", () => {
    expect(getEditionAccessLabel("OPEN")).toBe("Open");
    expect(getEditionAccessLabel("PAID")).toBe("Paid");
    expect(getEditionAccessLabel("RESTRICTED")).toBe("Restricted");
    expect(getEditionAccessLabel("QUALIFIED")).toBe("Qualified");
  });
});
