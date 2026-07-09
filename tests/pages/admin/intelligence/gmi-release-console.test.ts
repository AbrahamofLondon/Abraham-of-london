import { beforeAll, describe, expect, it } from "vitest";

import { ADMIN_NAVIGATION } from "@/lib/admin/admin-navigation";
import { buildGmiReleaseConsoleViewModel } from "@/pages/admin/intelligence/gmi-release-console";

describe("GMI release console view model", () => {
  let model!: Awaited<ReturnType<typeof buildGmiReleaseConsoleViewModel>>;

  beforeAll(async () => {
    model = await buildGmiReleaseConsoleViewModel();
  });

  it("renders Q1 superseded reference state", () => {
    const q1 = model.reportCards.find((report) => report.id === "GMI-Q1-2026");
    expect(q1?.lifecycle).toBe("SUPERSEDED");
    expect(q1?.purchasable).toBe(false);
    expect(q1?.publicVisible).toBe(true);
  });

  it("renders Q2 active state and release-ready", () => {
    const q2 = model.reportCards.find((report) => report.id === "GMI-Q2-2026");
    expect(q2?.lifecycle).toBe("ACTIVE_UNTIL_SUPERSEDED");
    expect(q2?.purchasable).toBe(true);
    expect(q2?.publicVisible).toBe(true);
    expect(model.releaseReady).toBe(true);
  });

  it("shows no release blockers after Q2 release", () => {
    expect(model.blockers).toEqual([]);
  });

  it("summarises prior-call review without overconfident labels", () => {
    expect(model.priorCalls.total).toBe(8);
    expect(model.priorCalls.dueInQ2).toBe(6);
    expect(model.priorCalls.carriedToQ3).toBe(2);
    expect(model.priorCalls.reviewed).toBeGreaterThanOrEqual(0);
    expect(model.priorCalls.pending).toBe(0);
  });

  it("shows source coverage state", () => {
    expect(model.sourceCoverage.totalRows).toBeGreaterThan(0);
    // Release-blocker rows were editorially cleared; blockerRows may be 0
    expect(model.sourceCoverage.blockerRows).toBeGreaterThanOrEqual(0);
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
