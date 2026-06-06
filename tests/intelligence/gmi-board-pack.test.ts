import { describe, expect, it } from "vitest";

import {
  buildGmiBoardPackSnapshot,
  buildGmiOperatorDashboard,
} from "@/lib/intelligence/gmi-instrument";

describe("GMI board-pack export", () => {
  it("uses the operator dashboard data source and points to PDF export by default", () => {
    const dashboard = buildGmiOperatorDashboard("GMI-Q2-2026");
    const pack = buildGmiBoardPackSnapshot("GMI-Q2-2026");

    expect(dashboard.boardPackHref).toBe("/api/gmi/board-pack?edition=GMI-Q2-2026&format=pdf");
    expect(pack.watchSignals).toEqual(dashboard.watchSignals);
    expect(pack.boardDecisions).toEqual(dashboard.boardDecisions);
    expect(pack.falsificationThresholds).toEqual(dashboard.falsificationThresholds);
    expect(pack.operatorConsequenceIndex).toHaveLength(6);
    expect(pack.decisionsToMakeIn30Days).toHaveLength(5);
    expect(pack.decisionsToPrepareIn90Days.length).toBeGreaterThan(0);
    expect(pack.decisionsToDefer.length).toBeGreaterThan(0);
    expect(pack.legalBoundary).toContain("not investment advice");
  });

  it("declares the board-pulse PDF export format", () => {
    expect("/api/gmi/board-pack?edition=GMI-Q2-2026&format=board-pulse-pdf").toContain("format=board-pulse-pdf");
  });

  it("keeps the scenario explorer deferred", () => {
    const routes = buildGmiOperatorDashboard("GMI-Q2-2026").estateRoutes.map((route) => route.route);
    expect(routes).not.toContain("/intelligence/gmi/explorer");
  });
});
