import { describe, expect, it } from "vitest";

import type { DecisionProvenanceRecord } from "./decision-provenance-record";
import { composeClientSafeProvenance } from "./client-safe-provenance-composer";

function record(overrides: Partial<DecisionProvenanceRecord> = {}): DecisionProvenanceRecord {
  return {
    version: 1,
    id: "decision-provenance:v1:OVERSIGHT_CYCLE:cycle_001",
    subjectType: "OVERSIGHT_CYCLE",
    subjectId: "cycle_001",
    evidenceInputs: [],
    governanceEvents: [],
    timeline: [],
    currentPosture: { status: "UNKNOWN", summary: "No chain recorded." },
    provenanceGaps: [],
    provenanceHash: "abc123def456",
    accountabilityStatement: "No evidence inputs have been recorded for this subject.",
    unavailableSources: [],
    ...overrides,
  };
}

describe("composeClientSafeProvenance — structural contract", () => {
  it("output contains only whitelisted fields", () => {
    const summary = composeClientSafeProvenance(record());
    const keys = Object.keys(summary);
    const allowed = [
      "version",
      "subjectId",
      "accountabilityStatement",
      "provenanceHash",
      "deliveryPosture",
      "outcomePosture",
      "gapCount",
      "gapClasses",
      "confidenceBands",
      "timelineSummary",
      "composedAt",
    ];
    for (const key of keys) {
      expect(allowed).toContain(key);
    }
  });

  it("does not expose governanceEvents", () => {
    const summary = composeClientSafeProvenance(record()) as Record<string, unknown>;
    expect(summary["governanceEvents"]).toBeUndefined();
  });

  it("does not expose evidenceInputs", () => {
    const summary = composeClientSafeProvenance(record()) as Record<string, unknown>;
    expect(summary["evidenceInputs"]).toBeUndefined();
  });

  it("does not expose unavailableSources", () => {
    const summary = composeClientSafeProvenance(
      record({ unavailableSources: ["retained-cadence", "suppression-ledger"] }),
    ) as Record<string, unknown>;
    expect(summary["unavailableSources"]).toBeUndefined();
  });

  it("does not expose currentPosture (internal operator-facing posture)", () => {
    const summary = composeClientSafeProvenance(record()) as Record<string, unknown>;
    expect(summary["currentPosture"]).toBeUndefined();
  });

  it("does not expose timeline (raw internal event labels)", () => {
    const summary = composeClientSafeProvenance(record()) as Record<string, unknown>;
    expect(summary["timeline"]).toBeUndefined();
  });
});

describe("composeClientSafeProvenance — delivery posture", () => {
  it("returns DELIVERED when DELIVERY_SENT event is present", () => {
    const summary = composeClientSafeProvenance(record({
      governanceEvents: [
        { type: "DELIVERY_SENT", label: "Sent via EMAIL", occurredAt: "2026-05-04T10:00:00.000Z" },
      ],
    }));
    expect(summary.deliveryPosture).toBe("DELIVERED");
  });

  it("returns APPROVED when only DELIVERY_APPROVED is present", () => {
    const summary = composeClientSafeProvenance(record({
      governanceEvents: [
        { type: "DELIVERY_APPROVED", label: "Approved for SPONSOR", occurredAt: "2026-05-03T09:00:00.000Z" },
      ],
    }));
    expect(summary.deliveryPosture).toBe("APPROVED");
  });

  it("returns PENDING when delivery evidence input exists but no sent/approved event", () => {
    const summary = composeClientSafeProvenance(record({
      evidenceInputs: [
        {
          type: "DELIVERY",
          label: "Delivery record",
          confidence: "OPERATOR_VERIFIED",
          createdAt: "2026-05-03T09:00:00.000Z",
        },
      ],
    }));
    expect(summary.deliveryPosture).toBe("PENDING");
  });

  it("returns UNKNOWN when no delivery signals exist", () => {
    const summary = composeClientSafeProvenance(record());
    expect(summary.deliveryPosture).toBe("UNKNOWN");
  });
});

describe("composeClientSafeProvenance — outcome posture", () => {
  it("returns RECORDED when OUTCOME_RECORDED event is present", () => {
    const summary = composeClientSafeProvenance(record({
      governanceEvents: [
        { type: "OUTCOME_RECORDED", label: "Outcome: ACTION_CONFIRMED", occurredAt: "2026-05-05T09:00:00.000Z" },
      ],
    }));
    expect(summary.outcomePosture).toBe("RECORDED");
  });

  it("returns RECORDED for COMPLETE posture without explicit outcome event", () => {
    const summary = composeClientSafeProvenance(record({
      currentPosture: { status: "COMPLETE", summary: "Complete." },
    }));
    expect(summary.outcomePosture).toBe("RECORDED");
  });

  it("returns PENDING when no outcome is recorded", () => {
    const summary = composeClientSafeProvenance(record());
    expect(summary.outcomePosture).toBe("PENDING");
  });
});

describe("composeClientSafeProvenance — gap classes", () => {
  it("extracts unique severity classes in CRITICAL → WARNING → INFO order", () => {
    const summary = composeClientSafeProvenance(record({
      provenanceGaps: [
        { stage: "Outcome", description: "No outcome recorded.", severity: "WARNING" },
        { stage: "Suppression", description: "Missing reason.", severity: "CRITICAL" },
        { stage: "Memory", description: "Insufficient memory.", severity: "INFO" },
      ],
    }));
    expect(summary.gapClasses).toEqual(["CRITICAL", "WARNING", "INFO"]);
  });

  it("returns empty gapClasses when no gaps exist", () => {
    const summary = composeClientSafeProvenance(record());
    expect(summary.gapClasses).toEqual([]);
    expect(summary.gapCount).toBe(0);
  });

  it("does not expose gap stage names or descriptions", () => {
    const summary = composeClientSafeProvenance(record({
      provenanceGaps: [
        { stage: "Suppression", description: "Override for fieldName missing reason.", severity: "CRITICAL" },
      ],
    }));
    const json = JSON.stringify(summary);
    expect(json).not.toContain("Suppression");
    expect(json).not.toContain("fieldName");
    expect(json).not.toContain("missing reason");
  });
});

describe("composeClientSafeProvenance — confidence bands", () => {
  it("aggregates confidence levels across evidence inputs", () => {
    const summary = composeClientSafeProvenance(record({
      evidenceInputs: [
        { type: "A", label: "A1", confidence: "OPERATOR_VERIFIED", createdAt: null },
        { type: "B", label: "B1", confidence: "OPERATOR_VERIFIED", createdAt: null },
        { type: "C", label: "C1", confidence: "USER_REPORTED", createdAt: null },
      ],
    }));
    const op = summary.confidenceBands.find((b) => b.level === "OPERATOR_VERIFIED");
    const usr = summary.confidenceBands.find((b) => b.level === "USER_REPORTED");
    expect(op?.count).toBe(2);
    expect(usr?.count).toBe(1);
  });

  it("orders bands OPERATOR_VERIFIED first then USER_REPORTED last", () => {
    const summary = composeClientSafeProvenance(record({
      evidenceInputs: [
        { type: "A", label: "A1", confidence: "USER_REPORTED", createdAt: null },
        { type: "B", label: "B1", confidence: "OPERATOR_VERIFIED", createdAt: null },
      ],
    }));
    expect(summary.confidenceBands[0]?.level).toBe("OPERATOR_VERIFIED");
    expect(summary.confidenceBands[1]?.level).toBe("USER_REPORTED");
  });

  it("returns empty bands when no evidence inputs", () => {
    const summary = composeClientSafeProvenance(record());
    expect(summary.confidenceBands).toEqual([]);
  });
});

describe("composeClientSafeProvenance — timeline summary", () => {
  it("maps INPUT timeline items to EVIDENCE_CAPTURED milestone", () => {
    const summary = composeClientSafeProvenance(record({
      timeline: [
        { date: "2026-05-01T09:00:00.000Z", event: "Retained review cycle (quarterly)", type: "INPUT" },
      ],
    }));
    expect(summary.timelineSummary[0]?.milestone).toBe("EVIDENCE_CAPTURED");
    expect(summary.timelineSummary[0]?.occurredAt).toBe("2026-05-01T09:00:00.000Z");
  });

  it("timeline labels do not contain internal event text", () => {
    const summary = composeClientSafeProvenance(record({
      timeline: [
        { date: "2026-05-01T09:00:00.000Z", event: "Suppressed commercialExposure: Commercial sensitivity", type: "ACTION" },
        { date: "2026-05-02T09:00:00.000Z", event: "Retained review cycle (quarterly)", type: "INPUT" },
      ],
      governanceEvents: [
        { type: "DELIVERY_SENT", label: "Delivery sent via EMAIL", occurredAt: "2026-05-04T09:00:00.000Z" },
      ],
    }));
    const json = JSON.stringify(summary.timelineSummary);
    expect(json).not.toContain("commercialExposure");
    expect(json).not.toContain("Commercial sensitivity");
    expect(json).not.toContain("quarterly");
    expect(json).not.toContain("EMAIL");
  });

  it("sorts timeline milestones chronologically", () => {
    const summary = composeClientSafeProvenance(record({
      timeline: [
        { date: "2026-05-03T09:00:00.000Z", event: "Operator reviewed: APPROVE_FOR_CLIENT", type: "REVIEW" },
        { date: "2026-05-01T09:00:00.000Z", event: "Retained review cycle", type: "INPUT" },
      ],
      governanceEvents: [
        { type: "DELIVERY_SENT", label: "Delivery sent", occurredAt: "2026-05-04T09:00:00.000Z" },
        { type: "OUTCOME_RECORDED", label: "Outcome: ACTION_CONFIRMED", occurredAt: "2026-05-05T09:00:00.000Z" },
      ],
    }));
    const dates = summary.timelineSummary.map((e) => e.occurredAt);
    expect(dates).toEqual([...dates].sort());
  });

  it("returns empty timeline when no events are present", () => {
    const summary = composeClientSafeProvenance(record());
    expect(summary.timelineSummary).toEqual([]);
  });
});

describe("composeClientSafeProvenance — integrity fields", () => {
  it("preserves provenanceHash verbatim", () => {
    const source = record({ provenanceHash: "deadbeef1234567890" });
    expect(composeClientSafeProvenance(source).provenanceHash).toBe("deadbeef1234567890");
  });

  it("preserves accountabilityStatement verbatim", () => {
    const stmt = "3 evidence inputs captured; 1 operator review completed; delivery sent; outcome recorded.";
    const summary = composeClientSafeProvenance(record({ accountabilityStatement: stmt }));
    expect(summary.accountabilityStatement).toBe(stmt);
  });

  it("version is always 1", () => {
    expect(composeClientSafeProvenance(record()).version).toBe(1);
  });

  it("composedAt can be injected for deterministic testing", () => {
    const fixed = "2026-05-14T12:00:00.000Z";
    expect(composeClientSafeProvenance(record(), { composedAt: fixed }).composedAt).toBe(fixed);
  });
});
