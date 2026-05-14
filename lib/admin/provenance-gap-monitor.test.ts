import { describe, expect, it } from "vitest";

import {
  buildProvenanceGapMonitor,
  type ProvenanceGapMonitorItem,
  type ProvenanceGapMonitorSummary,
} from "./provenance-gap-monitor";
import type { DecisionProvenanceRecord } from "./decision-provenance-record";

function record(overrides: Partial<DecisionProvenanceRecord> = {}): DecisionProvenanceRecord {
  const base: DecisionProvenanceRecord = {
    version: 1,
    id: "decision-provenance:v1:OVERSIGHT_CYCLE:cycle_001",
    subjectType: "OVERSIGHT_CYCLE",
    subjectId: "cycle_001",
    evidenceInputs: [],
    governanceEvents: [],
    timeline: [],
    currentPosture: {
      status: "COMPLETE",
      summary: "Delivery and outcome are both recorded.",
    },
    provenanceGaps: [],
    provenanceHash: "abc123",
    accountabilityStatement: "1 evidence input captured; delivery sent; outcome recorded.",
    unavailableSources: [],
    ...overrides,
  };
  return base;
}

function withCriticalGap(id: string): DecisionProvenanceRecord {
  return record({
    subjectId: id,
    currentPosture: { status: "BLOCKED", summary: "Critical gap blocks completion.", nextAction: "Resolve suppression" },
    provenanceGaps: [
      { stage: "Suppression", description: "Override missing reason", severity: "CRITICAL", href: "/admin/suppression-ledger" },
    ],
    provenanceHash: `hash-critical-${id}`,
  });
}

function withWarningGap(id: string): DecisionProvenanceRecord {
  return record({
    subjectId: id,
    currentPosture: { status: "UNVERIFIED", summary: "Delivery sent but outcome not recorded.", nextAction: "Complete outcome verification", nextActionHref: "/admin/outcome-verification" },
    provenanceGaps: [
      { stage: "Outcome", description: "No outcome verification recorded.", severity: "WARNING" },
    ],
    provenanceHash: `hash-warning-${id}`,
  });
}

function withInfoGap(id: string): DecisionProvenanceRecord {
  return record({
    subjectId: id,
    currentPosture: { status: "IN_REVIEW", summary: "Operator review recorded." },
    provenanceGaps: [
      { stage: "Outcome linkage", description: "Outcome linkage is indirect in v1.", severity: "INFO" },
    ],
    provenanceHash: `hash-info-${id}`,
  });
}

function completeRecord(id: string): DecisionProvenanceRecord {
  return record({
    subjectId: id,
    currentPosture: { status: "COMPLETE", summary: "Delivery and outcome recorded." },
    provenanceGaps: [],
    provenanceHash: `hash-complete-${id}`,
  });
}

describe("buildProvenanceGapMonitor — no gaps", () => {
  it("returns a complete summary when all records are gap-free and COMPLETE", () => {
    const summary = buildProvenanceGapMonitor([completeRecord("cycle_001"), completeRecord("cycle_002")]);
    expect(summary.totalSubjects).toBe(2);
    expect(summary.complete).toBe(2);
    expect(summary.withGaps).toBe(0);
    expect(summary.critical).toBe(0);
    expect(summary.warning).toBe(0);
    expect(summary.info).toBe(0);
    expect(summary.unavailable).toBe(0);
  });
});

describe("buildProvenanceGapMonitor — critical gaps", () => {
  it("counts a critical gap record in critical", () => {
    const summary = buildProvenanceGapMonitor([withCriticalGap("c1")]);
    expect(summary.critical).toBe(1);
    expect(summary.warning).toBe(0);
    expect(summary.withGaps).toBe(1);
  });

  it("sorts critical gap records before all others", () => {
    const summary = buildProvenanceGapMonitor([
      withWarningGap("w1"),
      withInfoGap("i1"),
      withCriticalGap("c1"),
      completeRecord("done1"),
    ]);
    expect(summary.items[0]?.subjectId).toBe("c1");
  });
});

describe("buildProvenanceGapMonitor — sort order", () => {
  it("sorts warning gaps before info gaps", () => {
    const summary = buildProvenanceGapMonitor([withInfoGap("i1"), withWarningGap("w1")]);
    expect(summary.items[0]?.subjectId).toBe("w1");
    expect(summary.items[1]?.subjectId).toBe("i1");
  });

  it("sorts complete records after all gap records", () => {
    const summary = buildProvenanceGapMonitor([
      completeRecord("done1"),
      withWarningGap("w1"),
      withInfoGap("i1"),
    ]);
    const lastItem = summary.items[summary.items.length - 1];
    expect(lastItem?.subjectId).toBe("done1");
  });
});

describe("buildProvenanceGapMonitor — field preservation", () => {
  it("preserves provenanceHash from the source record", () => {
    const summary = buildProvenanceGapMonitor([withCriticalGap("c1")]);
    expect(summary.items[0]?.provenanceHash).toBe("hash-critical-c1");
  });

  it("preserves nextAction and nextActionHref from current posture", () => {
    const summary = buildProvenanceGapMonitor([withWarningGap("w1")]);
    expect(summary.items[0]?.nextAction).toBe("Complete outcome verification");
    expect(summary.items[0]?.nextActionHref).toBe("/admin/outcome-verification");
  });
});

describe("buildProvenanceGapMonitor — unavailable records", () => {
  it("counts records with unavailable sources in the unavailable bucket", () => {
    const unavailable = record({
      subjectId: "cycle_unavail",
      currentPosture: { status: "UNKNOWN", summary: "No evidence chain." },
      unavailableSources: ["retained-cadence", "suppression-ledger"],
    });
    const summary = buildProvenanceGapMonitor([unavailable]);
    expect(summary.unavailable).toBe(1);
    expect(summary.complete).toBe(0);
  });
});

describe("buildProvenanceGapMonitor — gap integrity", () => {
  it("does not invent gaps — item.gaps matches record.provenanceGaps exactly", () => {
    const source = withCriticalGap("c1");
    const summary = buildProvenanceGapMonitor([source]);
    const item = summary.items[0]!;
    expect(item.gapCount).toBe(source.provenanceGaps.length);
    expect(item.gaps).toHaveLength(source.provenanceGaps.length);
    for (let idx = 0; idx < item.gaps.length; idx++) {
      expect(item.gaps[idx]?.stage).toBe(source.provenanceGaps[idx]?.stage);
      expect(item.gaps[idx]?.description).toBe(source.provenanceGaps[idx]?.description);
      expect(item.gaps[idx]?.severity).toBe(source.provenanceGaps[idx]?.severity);
    }
  });
});

describe("buildProvenanceGapMonitor — empty input", () => {
  it("returns zeroed summary for empty record array", () => {
    const summary = buildProvenanceGapMonitor([]);
    expect(summary.totalSubjects).toBe(0);
    expect(summary.items).toHaveLength(0);
  });
});
