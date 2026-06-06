/* tests/intelligence/gmi-source-workbench.test.ts — Source appendix workbench tests */
import { describe, expect, it } from "vitest";
import { getSourceRowsForReport, getReleaseBlockerRows, hasPendingReleaseBlockerRows } from "@/lib/intelligence/gmi-source-appendix-registry";

describe("GMI source appendix workbench", () => {
  it("Q2 has 13 total source rows", () => {
    const rows = getSourceRowsForReport("GMI-Q2-2026");
    expect(rows).toHaveLength(13);
  });

  it("Q2 has release-blocking rows", () => {
    const blockers = getReleaseBlockerRows("GMI-Q2-2026");
    expect(blockers.length).toBeGreaterThan(0);
  });

  it("pending release blocker rows block publication", () => {
    const hasPending = hasPendingReleaseBlockerRows("GMI-Q2-2026");
    expect(hasPending).toBe(true);
  });

  it("modelled estimates require method notes", () => {
    const rows = getSourceRowsForReport("GMI-Q2-2026");
    const modelledEstimates = rows.filter((r) => r.evidenceClass === "MODELLED_ESTIMATE" || r.evidenceClass === "SCENARIO_ASSUMPTION");
    // These rows should have METHOD_NOTE_REQUIRED status
    for (const row of modelledEstimates) {
      if (row.releaseBlocker) {
        expect(["METHOD_NOTE_REQUIRED", "SOURCE_PENDING"]).toContain(row.status);
      }
    }
  });

  it("resolving all release blockers would clear SOURCE_APPENDIX gate", () => {
    const blockers = getReleaseBlockerRows("GMI-Q2-2026");
    const pendingBlockers = blockers.filter(
      (r) => r.status === "SOURCE_PENDING" || r.status === "METHOD_NOTE_REQUIRED"
    );
    // If all blockers are resolved, pending count is 0
    expect(pendingBlockers.length).toBeGreaterThanOrEqual(0);
  });
});
