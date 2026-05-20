import { describe, expect, it } from "vitest";

import {
  buildGmiReleaseChecklist,
  getBlockingChecklistItems,
  getChecklistItemsByCategory,
} from "./gmi-release-candidate-checklist";

describe("buildGmiReleaseChecklist — Q2 2026 draft state", () => {
  const checklist = buildGmiReleaseChecklist("GMI-Q2-2026");

  it("returns a checklist for GMI-Q2-2026", () => {
    expect(checklist.reportId).toBe("GMI-Q2-2026");
    expect(checklist.totalCount).toBeGreaterThan(0);
  });

  it("is blocked — not release-clear", () => {
    expect(checklist.releaseClearance).toBe("BLOCKED");
    expect(checklist.blockerCount).toBeGreaterThan(0);
  });

  it("identifies prior-quarter call review as pending and a release blocker", () => {
    const item = checklist.items.find((i) => i.id === "PRIOR_QUARTER_CALL_REVIEW");
    expect(item).toBeDefined();
    expect(item?.releaseBlocker).toBe(true);
    expect(item?.status).not.toBe("COMPLETE");
  });

  it("identifies release-blocker source rows as pending", () => {
    const item = checklist.items.find((i) => i.id === "RELEASE_BLOCKER_ROWS_CLEAR");
    expect(item).toBeDefined();
    expect(item?.status).not.toBe("COMPLETE");
    expect(item?.releaseBlocker).toBe(true);
  });

  it("marks compliance disclaimer and investment-advice checks", () => {
    const noAdvice = checklist.items.find((i) => i.id === "NO_INVESTMENT_ADVICE_LANGUAGE");
    expect(noAdvice?.status).toBe("COMPLETE");
  });

  it("quality gate is blocked (not complete)", () => {
    const gate = checklist.items.find((i) => i.id === "QUALITY_GATE_PASS");
    expect(gate?.status).toBe("BLOCKED");
    expect(gate?.releaseBlocker).toBe(true);
  });

  it("returns blocking items via helper", () => {
    const blockers = getBlockingChecklistItems(checklist);
    expect(blockers.length).toBeGreaterThan(0);
    expect(blockers.every((item) => item.releaseBlocker)).toBe(true);
    expect(blockers.every((item) => item.status !== "COMPLETE")).toBe(true);
  });

  it("returns items by category via helper", () => {
    const callReviewItems = getChecklistItemsByCategory(checklist, "CALL_REVIEW");
    expect(callReviewItems.length).toBeGreaterThan(0);
    expect(callReviewItems.every((item) => item.category === "CALL_REVIEW")).toBe(true);
  });
});

describe("buildGmiReleaseChecklist — Q1 2026 active state", () => {
  const checklist = buildGmiReleaseChecklist("GMI-Q1-2026");

  it("returns a checklist for GMI-Q1-2026", () => {
    expect(checklist.reportId).toBe("GMI-Q1-2026");
  });

  it("prior quarter call review is not applicable (Q1 is first report)", () => {
    const item = checklist.items.find((i) => i.id === "PRIOR_QUARTER_CALL_REVIEW");
    expect(item?.status).toBe("NOT_APPLICABLE");
  });

  it("has lower blocker count than Q2 (active report)", () => {
    const q2 = buildGmiReleaseChecklist("GMI-Q2-2026");
    expect(checklist.blockerCount).toBeLessThanOrEqual(q2.blockerCount);
  });
});
