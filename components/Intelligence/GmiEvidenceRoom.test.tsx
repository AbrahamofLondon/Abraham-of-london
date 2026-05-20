import { describe, expect, it } from "vitest";

import {
  calculateGmiSourceCoverageScore,
} from "@/lib/intelligence/gmi-source-coverage-score";
import {
  getSourceRowsForReport,
  getReleaseBlockerRows,
  getPendingSourceRows,
} from "@/lib/intelligence/gmi-source-appendix-registry";

// Tests for the data construction logic behind GmiEvidenceRoom.
// Verifies that the source coverage data fed to the component is accurate
// and that the admin-mode row dataset reflects the actual registry state.

describe("GmiEvidenceRoom data — Q2 2026 source coverage", () => {
  const coverage = calculateGmiSourceCoverageScore("GMI-Q2-2026");
  const rows = getSourceRowsForReport("GMI-Q2-2026");

  it("has source rows registered", () => {
    expect(rows.length).toBeGreaterThan(0);
  });

  it("coverage score is below release threshold (not release-safe)", () => {
    expect(coverage.releaseSafe).toBe(false);
    expect(coverage.coverageScore).toBeLessThan(80);
  });

  it("has release-blocker rows pending", () => {
    expect(coverage.blockerRows).toBeGreaterThan(0);
  });

  it("verified rows count matches VERIFIED/CARRIED_FORWARD status rows", () => {
    const manualVerified = rows.filter(
      (r) => r.status === "VERIFIED" || r.status === "CARRIED_FORWARD",
    ).length;
    expect(coverage.verifiedRows).toBe(manualVerified);
  });

  it("pending rows count matches SOURCE_PENDING/METHOD_NOTE_REQUIRED rows", () => {
    const manualPending = rows.filter(
      (r) => r.status === "SOURCE_PENDING" || r.status === "METHOD_NOTE_REQUIRED",
    ).length;
    expect(coverage.pendingRows).toBe(manualPending);
  });

  it("blocker rows are a subset of pending rows", () => {
    const blockerRows = getReleaseBlockerRows("GMI-Q2-2026");
    const pendingRows = getPendingSourceRows("GMI-Q2-2026");
    expect(blockerRows.length).toBeLessThanOrEqual(pendingRows.length);
  });

  it("all blocker rows are currently pending (release not safe)", () => {
    const blockerRows = getReleaseBlockerRows("GMI-Q2-2026");
    const allBlockersPending = blockerRows.every(
      (r) => r.status === "SOURCE_PENDING" || r.status === "METHOD_NOTE_REQUIRED",
    );
    expect(allBlockersPending).toBe(true);
  });

  it("admin mode receives all rows for the report", () => {
    expect(rows.length).toBe(coverage.totalRows);
  });
});

describe("GmiEvidenceRoom data — Q1 2026 (reference, active report)", () => {
  it("Q1 has no registered source rows in the appendix registry", () => {
    const q1Rows = getSourceRowsForReport("GMI-Q1-2026");
    expect(q1Rows.length).toBe(0);
  });

  it("Q1 coverage score defaults to 0 with no rows", () => {
    const q1Coverage = calculateGmiSourceCoverageScore("GMI-Q1-2026");
    expect(q1Coverage.totalRows).toBe(0);
    expect(q1Coverage.coverageScore).toBe(0);
  });
});
