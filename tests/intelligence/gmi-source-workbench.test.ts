/* tests/intelligence/gmi-source-workbench.test.ts — Source appendix workbench tests */
/* Updated for Q2 editorial unblocking — all source blockers resolved */
import { describe, expect, it } from "vitest";
import { getSourceRowsForReport, getReleaseBlockerRows, hasPendingReleaseBlockerRows } from "@/lib/intelligence/gmi-source-appendix-registry";

describe("GMI source appendix workbench", () => {
  it("Q2 has 14 total source rows", () => {
    const rows = getSourceRowsForReport("GMI-Q2-2026");
    expect(rows).toHaveLength(14);
  });

  it("Q2 has no release-blocking rows after editorial unblocking", () => {
    const blockers = getReleaseBlockerRows("GMI-Q2-2026");
    expect(blockers).toHaveLength(0);
  });

  it("no pending release blocker rows remain", () => {
    const hasPending = hasPendingReleaseBlockerRows("GMI-Q2-2026");
    expect(hasPending).toBe(false);
  });

  it("all modelled estimates have method notes", () => {
    const rows = getSourceRowsForReport("GMI-Q2-2026");
    const modelledEstimates = rows.filter((r) => r.evidenceClass === "MODELLED_ESTIMATE" || r.evidenceClass === "SCENARIO_ASSUMPTION");
    for (const row of modelledEstimates) {
      expect(row.methodNote).toBeTruthy();
    }
  });

  it("resolved source blockers cleared SOURCE_APPENDIX gate", () => {
    const blockers = getReleaseBlockerRows("GMI-Q2-2026");
    const pendingBlockers = blockers.filter(
      (r) => r.status === "SOURCE_PENDING" || r.status === "METHOD_NOTE_REQUIRED"
    );
    expect(pendingBlockers).toHaveLength(0);
  });
});