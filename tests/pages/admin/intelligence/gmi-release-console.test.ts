import { describe, expect, it } from "vitest";

import { ADMIN_NAVIGATION } from "@/lib/admin/admin-navigation";
import { buildGmiReleaseConsoleViewModel } from "@/pages/admin/intelligence/gmi-release-console";

describe("GMI release console view model", () => {
  const model = buildGmiReleaseConsoleViewModel();

  it("renders Q1 active state", () => {
    const q1 = model.reportCards.find((report) => report.id === "GMI-Q1-2026");
    expect(q1?.lifecycle).toBe("ACTIVE_UNTIL_SUPERSEDED");
    expect(q1?.purchasable).toBe(true);
    expect(q1?.publicVisible).toBe(true);
  });

  it("renders Q2 draft state and not release-ready", () => {
    const q2 = model.reportCards.find((report) => report.id === "GMI-Q2-2026");
    expect(q2?.lifecycle).toBe("DRAFT");
    expect(q2?.purchasable).toBe(false);
    expect(q2?.publicVisible).toBe(false);
    expect(model.releaseReady).toBe(false);
  });

  it("shows prior-call and source coverage blockers", () => {
    expect(model.blockers).toContain("Prior-quarter calls not reviewed");
    expect(model.blockers).toContain("Source appendix incomplete");
    expect(model.blockers).toContain("Quality gate not release-ready");
  });

  it("summarises prior-call review without overconfident labels", () => {
    expect(model.priorCalls.total).toBe(8);
    expect(model.priorCalls.dueInQ2).toBe(7);
    expect(model.priorCalls.carriedToQ3).toBe(1);
    expect(model.priorCalls.reviewed).toBe(0);
    expect(model.priorCalls.pending).toBe(7);
  });

  it("shows source coverage blocker state", () => {
    expect(model.sourceCoverage.totalRows).toBeGreaterThan(0);
    expect(model.sourceCoverage.blockerRows).toBeGreaterThan(0);
    expect(model.sourceCoverage.releaseSafe).toBe(false);
  });

  it("does not expose unpublished Q2 body or mutation buttons", () => {
    const text = JSON.stringify(model);
    expect(text).not.toContain("Q2 2026 is not a recession call");
    expect(text).not.toContain("How to Read This Report");
    expect(model.mutatingActions).toHaveLength(0);
  });

  it("shows Q2 outbound asset as draft and not publishable", () => {
    expect(model.outbound.title).toContain("Q2 2026");
    expect(model.outbound.status).toBe("draft");
    expect(model.outbound.lifecycleGated).toBe(true);
    expect(model.outbound.publishable).toBe(false);
  });

  it("renders release event ledger no-events state", () => {
    expect(model.eventSummary.reportId).toBe("GMI-Q2-2026");
    expect(model.eventSummary.totalEvents).toBe(0);
    expect(model.eventSummary.emptyState).toBe("No release events recorded yet.");
  });

  it("admin navigation contains console link", () => {
    const items = ADMIN_NAVIGATION.flatMap((section) => section.items);
    expect(items.some((item) => item.href === "/admin/intelligence/gmi-release-console")).toBe(true);
  });
});
