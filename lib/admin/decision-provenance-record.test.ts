import { describe, it, expect } from "vitest";
import {
  composeGovernanceEvents,
  composeEvidenceInputs,
  classifyPosture,
  buildAccountabilityStatement,
  composeDecisionProvenanceRecord,
  type ProvenanceSourceData,
} from "./decision-provenance-record";
import type { RetainedReviewCycle } from "@/lib/product/retained-cadence-contract";
import type { SuppressionEvent } from "@/lib/product/suppression-ledger-contract";
import type { DeliveryRecord } from "@/lib/product/delivery-audit-contract";
import type { CounselHistoryEntry } from "@/lib/product/counsel-history-contract";
import type { BoardroomArchiveEntry } from "@/lib/product/boardroom-archive-contract";
import type { OversightReviewDecisionRecord } from "@/lib/product/oversight-review-decision-contract";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const CYCLE_ID = "cycle_test_001";

function cycle(overrides: Partial<RetainedReviewCycle> = {}): RetainedReviewCycle {
  return {
    cycleId: CYCLE_ID,
    accountId: "acct_001",
    organisationId: null,
    sponsorUserId: null,
    sponsorEmail: null,
    cadenceState: "REVIEW_IN_PROGRESS",
    cadenceSource: "manual",
    cadenceType: "quarterly",
    scheduledFor: "2025-06-01T00:00:00Z",
    completedAt: null,
    skippedAt: null,
    skippedReason: null,
    escalationReason: null,
    operatorId: "op_001",
    evidencePosture: "OPERATOR_RECORDED",
    createdAt: "2025-05-01T10:00:00Z",
    updatedAt: "2025-05-15T12:00:00Z",
    ...overrides,
  };
}

function suppression(overrides: Partial<SuppressionEvent> = {}): SuppressionEvent {
  return {
    eventId: "sup_001",
    scopeId: CYCLE_ID,
    scopeType: "CYCLE",
    surface: "oversight-brief",
    fieldName: "costExposure",
    suppressionReason: "Commercially sensitive",
    suppressionRule: "COMMERCIAL_SENSITIVITY",
    suppressedAt: "2025-05-10T09:00:00Z",
    suppressedBySystem: true,
    reviewedByOperator: null,
    reviewedAt: null,
    overrideStatus: "NONE",
    overrideReason: null,
    evidenceSource: "system",
    originalPosture: "SYSTEM_INFERRED",
    ...overrides,
  };
}

function highRiskSuppression(): SuppressionEvent {
  return suppression({
    eventId: "sup_risk_001",
    suppressionRule: "LEGAL_RISK",
    suppressionReason: "Legal exposure — counsel review required",
  });
}

function delivery(overrides: Partial<DeliveryRecord> = {}): DeliveryRecord {
  return {
    id: "del_001",
    artifactType: "OVERSIGHT_BRIEF",
    artifactId: CYCLE_ID,
    recipientEmail: "sponsor@client.com",
    recipientRole: "SPONSOR",
    approvedBy: "op_001",
    deliveredBy: "system",
    deliveredAt: "2025-05-20T14:00:00Z",
    deliveryMethod: "EMAIL",
    status: "DELIVERED",
    suppressionSummary: "1 field suppressed",
    clientSafe: true,
    createdAt: "2025-05-18T10:00:00Z",
    ...overrides,
  };
}

function failedDelivery(): DeliveryRecord {
  return delivery({
    id: "del_fail_001",
    status: "FAILED",
    deliveredAt: null,
    deliveredBy: null,
    failureReason: "SMTP timeout",
    latestAttemptAt: "2025-05-20T14:05:00Z",
  });
}

function counselEntry(overrides: Partial<CounselHistoryEntry> = {}): CounselHistoryEntry {
  return {
    id: "counsel_001",
    cycleId: CYCLE_ID,
    caseId: "case_001",
    triggeredAt: "2025-05-12T11:00:00Z",
    triggerReason: "Legal exposure flagged in brief",
    status: "OPEN",
    evidenceNodeIds: [],
    operatorDisposition: "PENDING",
    ...overrides,
  };
}

function boardroomEntry(overrides: Partial<BoardroomArchiveEntry> = {}): BoardroomArchiveEntry {
  return {
    id: "br_001",
    cycleId: CYCLE_ID,
    caseId: "case_001",
    qualifiedAt: "2025-05-13T09:00:00Z",
    dossierSummary: "Board-level cost exposure identified",
    triggerReason: "Cost threshold exceeded",
    objectionsGenerated: 2,
    exportStatus: "NOT_EXPORTED",
    ...overrides,
  };
}

function decisionRecord(overrides: Partial<OversightReviewDecisionRecord> = {}): OversightReviewDecisionRecord {
  return {
    id: "dec_001",
    accountId: "acct_001",
    cycleId: CYCLE_ID,
    decision: "APPROVE_FOR_CLIENT",
    reasons: [],
    operatorId: "op_001",
    efficacyGrade: "A",
    efficacyScore: 85,
    clientSafe: true,
    deliveryAllowed: true,
    createdAt: "2025-05-19T10:00:00Z",
    ...overrides,
  };
}

function emptyData(overrides: Partial<ProvenanceSourceData> = {}): ProvenanceSourceData {
  return {
    cycleId: CYCLE_ID,
    cycle: null,
    cadenceHistory: [],
    suppressions: [],
    deliveries: [],
    counselEntries: [],
    boardroomEntries: [],
    decisionRecord: null,
    unavailableSources: [],
    ...overrides,
  };
}

// ─── composeEvidenceInputs ───────────────────────────────────────────────────

describe("composeEvidenceInputs", () => {
  it("returns empty array when no data", () => {
    expect(composeEvidenceInputs(emptyData())).toHaveLength(0);
  });

  it("includes cycle when present", () => {
    const inputs = composeEvidenceInputs(emptyData({ cycle: cycle() }));
    expect(inputs.some((i) => i.type === "CADENCE_CYCLE")).toBe(true);
  });

  it("includes suppression for each suppression event", () => {
    const data = emptyData({ suppressions: [suppression(), suppression({ eventId: "sup_002", fieldName: "other" })] });
    const suppressionInputs = composeEvidenceInputs(data).filter((i) => i.type === "SUPPRESSION");
    expect(suppressionInputs).toHaveLength(2);
  });

  it("includes delivery when delivery record present", () => {
    const data = emptyData({ deliveries: [delivery()] });
    expect(composeEvidenceInputs(data).some((i) => i.type === "DELIVERY")).toBe(true);
  });

  it("delivery NOT included when deliveries array is empty", () => {
    const data = emptyData({ deliveries: [] });
    expect(composeEvidenceInputs(data).some((i) => i.type === "DELIVERY")).toBe(false);
  });

  it("includes operator decision when present", () => {
    const data = emptyData({ decisionRecord: decisionRecord() });
    expect(composeEvidenceInputs(data).some((i) => i.type === "OPERATOR_DECISION")).toBe(true);
  });
});

// ─── composeGovernanceEvents ─────────────────────────────────────────────────

describe("composeGovernanceEvents — suppression", () => {
  it("suppression appears in governance events when present", () => {
    const data = emptyData({ suppressions: [suppression()] });
    const events = composeGovernanceEvents(data);
    expect(events.some((e) => e.type === "SUPPRESSION_APPLIED")).toBe(true);
  });

  it("suppression does NOT appear when suppressions is empty", () => {
    const events = composeGovernanceEvents(emptyData());
    expect(events.some((e) => e.type === "SUPPRESSION_APPLIED")).toBe(false);
  });

  it("high-risk suppression gets HIGH severity", () => {
    const data = emptyData({ suppressions: [highRiskSuppression()] });
    const events = composeGovernanceEvents(data);
    const supEvent = events.find((e) => e.type === "SUPPRESSION_APPLIED");
    expect(supEvent?.severity).toBe("HIGH");
  });

  it("standard suppression gets MEDIUM severity", () => {
    const data = emptyData({ suppressions: [suppression()] });
    const events = composeGovernanceEvents(data);
    const supEvent = events.find((e) => e.type === "SUPPRESSION_APPLIED");
    expect(supEvent?.severity).toBe("MEDIUM");
  });
});

describe("composeGovernanceEvents — delivery", () => {
  it("DELIVERY_SENT appears when delivery status is DELIVERED", () => {
    const data = emptyData({ deliveries: [delivery()] });
    expect(composeGovernanceEvents(data).some((e) => e.type === "DELIVERY_SENT")).toBe(true);
  });

  it("delivery does NOT appear when deliveries is empty", () => {
    const events = composeGovernanceEvents(emptyData({ deliveries: [] }));
    expect(events.some((e) => e.type === "DELIVERY_SENT")).toBe(false);
  });

  it("failed delivery creates HIGH severity DELIVERY_SENT event", () => {
    const data = emptyData({ deliveries: [failedDelivery()] });
    const events = composeGovernanceEvents(data);
    const failEvent = events.find((e) => e.type === "DELIVERY_SENT");
    expect(failEvent?.severity).toBe("HIGH");
    expect(failEvent?.label).toContain("failed");
  });

  it("DELIVERY_APPROVED appears when approvedBy is set", () => {
    const data = emptyData({ deliveries: [delivery({ approvedBy: "op_001" })] });
    expect(composeGovernanceEvents(data).some((e) => e.type === "DELIVERY_APPROVED")).toBe(true);
  });
});

describe("composeGovernanceEvents — counsel vs boardroom distinction", () => {
  it("counsel escalation creates COUNSEL_ESCALATED event", () => {
    const data = emptyData({ counselEntries: [counselEntry()] });
    const events = composeGovernanceEvents(data);
    expect(events.some((e) => e.type === "COUNSEL_ESCALATED")).toBe(true);
    expect(events.some((e) => e.type === "BOARDROOM_ESCALATED")).toBe(false);
  });

  it("boardroom escalation creates BOARDROOM_ESCALATED event", () => {
    const data = emptyData({ boardroomEntries: [boardroomEntry()] });
    const events = composeGovernanceEvents(data);
    expect(events.some((e) => e.type === "BOARDROOM_ESCALATED")).toBe(true);
    expect(events.some((e) => e.type === "COUNSEL_ESCALATED")).toBe(false);
  });

  it("counsel and boardroom escalation are independently preserved", () => {
    const data = emptyData({
      counselEntries: [counselEntry()],
      boardroomEntries: [boardroomEntry()],
    });
    const events = composeGovernanceEvents(data);
    expect(events.some((e) => e.type === "COUNSEL_ESCALATED")).toBe(true);
    expect(events.some((e) => e.type === "BOARDROOM_ESCALATED")).toBe(true);
  });

  it("boardroom escalation always has CRITICAL severity", () => {
    const data = emptyData({ boardroomEntries: [boardroomEntry()] });
    const brEvent = composeGovernanceEvents(data).find((e) => e.type === "BOARDROOM_ESCALATED");
    expect(brEvent?.severity).toBe("CRITICAL");
  });

  it("counsel disposition adds OPERATOR_REVIEWED event when resolved", () => {
    const data = emptyData({ counselEntries: [counselEntry({ operatorDisposition: "ACCEPTED" })] });
    const events = composeGovernanceEvents(data);
    expect(events.some((e) => e.type === "OPERATOR_REVIEWED")).toBe(true);
  });

  it("counsel with PENDING disposition does NOT add OPERATOR_REVIEWED event", () => {
    const data = emptyData({ counselEntries: [counselEntry({ operatorDisposition: "PENDING" })] });
    const events = composeGovernanceEvents(data).filter((e) => e.type === "OPERATOR_REVIEWED");
    // No decision record, only pending counsel — no OPERATOR_REVIEWED event
    expect(events).toHaveLength(0);
  });
});

describe("composeGovernanceEvents — operator decision", () => {
  it("OPERATOR_REVIEWED event appears when decision record present", () => {
    const data = emptyData({ decisionRecord: decisionRecord() });
    expect(composeGovernanceEvents(data).some((e) => e.type === "OPERATOR_REVIEWED")).toBe(true);
  });

  it("decision NOT in events when decisionRecord is null", () => {
    const data = emptyData({ decisionRecord: null });
    expect(composeGovernanceEvents(data).some((e) => e.type === "OPERATOR_REVIEWED")).toBe(false);
  });
});

describe("composeGovernanceEvents — ordering", () => {
  it("events sorted chronologically", () => {
    const data = emptyData({
      suppressions: [suppression({ suppressedAt: "2025-05-10T09:00:00Z" })],
      deliveries: [delivery({ createdAt: "2025-05-18T10:00:00Z" })],
    });
    const events = composeGovernanceEvents(data);
    const timestamps = events
      .filter((e) => e.occurredAt)
      .map((e) => new Date(e.occurredAt!).getTime());
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i]!).toBeGreaterThanOrEqual(timestamps[i - 1]!);
    }
  });
});

// ─── classifyPosture ─────────────────────────────────────────────────────────

describe("classifyPosture — no cycle", () => {
  it("UNKNOWN posture when no cycle", () => {
    const { status } = classifyPosture(null, [], 0);
    expect(status).toBe("UNKNOWN");
  });

  it("UNKNOWN posture mentions unavailable sources", () => {
    const { summary } = classifyPosture(null, [], 2);
    expect(summary).toContain("unavailable");
  });
});

describe("classifyPosture — missing evidence creates UNKNOWN, not completion", () => {
  it("unavailable sources with null cycle → UNKNOWN, not COMPLETE", () => {
    const { status } = classifyPosture(null, [], 3);
    expect(status).toBe("UNKNOWN");
    expect(status).not.toBe("COMPLETE");
  });
});

describe("classifyPosture — cycle states", () => {
  it("OVERDUE cadence → BLOCKED posture", () => {
    const { status } = classifyPosture(cycle({ cadenceState: "OVERDUE" }), [], 0);
    expect(status).toBe("BLOCKED");
  });

  it("REVIEW_IN_PROGRESS → IN_REVIEW posture", () => {
    const { status } = classifyPosture(cycle({ cadenceState: "REVIEW_IN_PROGRESS" }), [], 0);
    expect(status).toBe("IN_REVIEW");
  });

  it("REVIEW_COMPLETED with delivery event → DELIVERED posture", () => {
    const events = composeGovernanceEvents(emptyData({ deliveries: [delivery()] }));
    const { status } = classifyPosture(cycle({ cadenceState: "REVIEW_COMPLETED" }), events, 0);
    expect(status).toBe("DELIVERED");
  });

  it("ESCALATED state → ESCALATED posture", () => {
    const { status } = classifyPosture(cycle({ cadenceState: "ESCALATED" }), [], 0);
    expect(status).toBe("ESCALATED");
  });

  it("counsel escalation event → ESCALATED posture regardless of cadence state", () => {
    const events = composeGovernanceEvents(emptyData({ counselEntries: [counselEntry()] }));
    const { status } = classifyPosture(cycle({ cadenceState: "REVIEW_IN_PROGRESS" }), events, 0);
    expect(status).toBe("ESCALATED");
  });
});

// ─── buildAccountabilityStatement ───────────────────────────────────────────

describe("buildAccountabilityStatement — restrained claims", () => {
  it("includes delivery count when delivery exists", () => {
    const events = composeGovernanceEvents(emptyData({ deliveries: [delivery()] }));
    const statement = buildAccountabilityStatement(CYCLE_ID, cycle(), events, []);
    expect(statement).toContain("delivery record");
  });

  it("explicitly states no confirmed delivery when none present", () => {
    const events = composeGovernanceEvents(emptyData());
    const statement = buildAccountabilityStatement(CYCLE_ID, cycle(), events, []);
    expect(statement).toContain("No confirmed delivery");
  });

  it("mentions suppression count when suppressions present", () => {
    const events = composeGovernanceEvents(emptyData({ suppressions: [suppression()] }));
    const statement = buildAccountabilityStatement(CYCLE_ID, cycle(), events, []);
    expect(statement).toContain("suppression event");
  });

  it("does NOT claim delivery when none exists — no overclaiming", () => {
    const events = composeGovernanceEvents(emptyData({ deliveries: [] }));
    const statement = buildAccountabilityStatement(CYCLE_ID, cycle(), events, []);
    expect(statement).not.toContain("Brief delivered");
  });

  it("mentions unavailable sources caveat when sources missing", () => {
    const statement = buildAccountabilityStatement(CYCLE_ID, cycle(), [], ["suppression-ledger"]);
    expect(statement).toContain("unavailable");
  });

  it("cannot establish accountability when no cycle and no sources", () => {
    const statement = buildAccountabilityStatement(CYCLE_ID, null, [], []);
    expect(statement).toContain("cannot be established");
  });

  it("includes counsel escalation count when counsel events present", () => {
    const events = composeGovernanceEvents(emptyData({ counselEntries: [counselEntry()] }));
    const statement = buildAccountabilityStatement(CYCLE_ID, cycle(), events, []);
    expect(statement).toContain("counsel");
  });

  it("distinguishes boardroom from counsel in statement", () => {
    const events = composeGovernanceEvents(emptyData({
      counselEntries: [counselEntry()],
      boardroomEntries: [boardroomEntry()],
    }));
    const statement = buildAccountabilityStatement(CYCLE_ID, cycle(), events, []);
    expect(statement).toContain("counsel");
    expect(statement).toContain("boardroom");
  });
});

// ─── composeDecisionProvenanceRecord ─────────────────────────────────────────

describe("composeDecisionProvenanceRecord", () => {
  it("returns a record with required fields", () => {
    const record = composeDecisionProvenanceRecord(emptyData({ cycle: cycle() }));
    expect(record.id).toContain(CYCLE_ID);
    expect(record.subjectType).toBe("OVERSIGHT_CYCLE");
    expect(record.subjectId).toBe(CYCLE_ID);
    expect(Array.isArray(record.governanceEvents)).toBe(true);
    expect(Array.isArray(record.evidenceInputs)).toBe(true);
    expect(typeof record.accountabilityStatement).toBe("string");
    expect(typeof record.currentPosture.status).toBe("string");
  });

  it("unavailableSources propagated to record", () => {
    const data = emptyData({ unavailableSources: ["suppression-ledger", "delivery-queue"] });
    const record = composeDecisionProvenanceRecord(data);
    expect(record.unavailableSources).toHaveLength(2);
  });

  it("full chain: cycle + suppression + delivery + counsel + boardroom + decision", () => {
    const data: ProvenanceSourceData = {
      cycleId: CYCLE_ID,
      cycle: cycle({ cadenceState: "REVIEW_COMPLETED" }),
      cadenceHistory: [],
      suppressions: [suppression()],
      deliveries: [delivery()],
      counselEntries: [counselEntry({ operatorDisposition: "ACCEPTED" })],
      boardroomEntries: [boardroomEntry()],
      decisionRecord: decisionRecord(),
      unavailableSources: [],
    };
    const record = composeDecisionProvenanceRecord(data);
    const eventTypes = record.governanceEvents.map((e) => e.type);
    expect(eventTypes).toContain("SUPPRESSION_APPLIED");
    expect(eventTypes).toContain("DELIVERY_SENT");
    expect(eventTypes).toContain("COUNSEL_ESCALATED");
    expect(eventTypes).toContain("BOARDROOM_ESCALATED");
    expect(eventTypes).toContain("OPERATOR_REVIEWED");
  });
});
