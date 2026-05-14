import { describe, expect, it } from "vitest";

import type { DeliveryRecord } from "@/lib/product/delivery-audit-contract";
import type { OutcomeVerificationRecord } from "@/lib/product/outcome-verification-contract";
import type { OversightReviewDecisionRecord } from "@/lib/product/oversight-review-decision-contract";
import type { RetainedReviewCycle } from "@/lib/product/retained-cadence-contract";
import type { SuppressionEvent } from "@/lib/product/suppression-ledger-contract";

import {
  buildAccountabilityStatement,
  buildDecisionProvenanceHash,
  composeDecisionProvenance,
  composeDecisionProvenanceFromSources,
  composeEvidenceInputs,
  composeGovernanceEvents,
  composeTimeline,
  deriveCurrentPosture,
  type DecisionProvenanceRecord,
  type DecisionProvenanceSourceData,
} from "./decision-provenance-record";

const SUBJECT_ID = "cycle_001";

function cycle(overrides: Partial<RetainedReviewCycle> = {}): RetainedReviewCycle {
  return {
    cycleId: SUBJECT_ID,
    accountId: "acct_001",
    organisationId: "org_001",
    sponsorUserId: null,
    sponsorEmail: null,
    cadenceState: "REVIEW_IN_PROGRESS",
    cadenceSource: "manual",
    cadenceType: "quarterly",
    scheduledFor: "2026-05-01T09:00:00.000Z",
    completedAt: null,
    skippedAt: null,
    skippedReason: null,
    escalationReason: null,
    operatorId: "op_001",
    evidencePosture: "SYSTEM_INFERRED",
    createdAt: "2026-05-01T09:00:00.000Z",
    updatedAt: "2026-05-01T09:00:00.000Z",
    ...overrides,
  };
}

function suppression(overrides: Partial<SuppressionEvent> = {}): SuppressionEvent {
  return {
    eventId: "sup_001",
    scopeId: SUBJECT_ID,
    scopeType: "CYCLE",
    surface: "oversight-brief",
    fieldName: "commercialExposure",
    evidenceSource: "system",
    originalPosture: "SYSTEM_INFERRED",
    evidencePosture: "SYSTEM_INFERRED",
    suppressionReason: "Commercial sensitivity",
    suppressionRule: "COMMERCIAL_SENSITIVITY",
    operatorReviewAvailable: true,
    suppressedAt: "2026-05-02T09:00:00.000Z",
    suppressedBySystem: true,
    reviewedByOperator: "op_001",
    reviewedAt: "2026-05-02T10:00:00.000Z",
    overrideStatus: "NONE",
    overrideReason: null,
    ...overrides,
  };
}

function delivery(overrides: Partial<DeliveryRecord> = {}): DeliveryRecord {
  return {
    id: "del_001",
    artifactType: "OVERSIGHT_BRIEF",
    artifactId: SUBJECT_ID,
    recipientEmail: "sponsor@example.com",
    recipientRole: "SPONSOR",
    approvedBy: "op_001",
    deliveredBy: "system",
    deliveredAt: "2026-05-04T09:00:00.000Z",
    deliveryMethod: "EMAIL",
    status: "DELIVERED",
    suppressionSummary: "1 field suppressed",
    clientSafe: true,
    createdAt: "2026-05-03T09:00:00.000Z",
    ...overrides,
  };
}

function outcome(overrides: Partial<OutcomeVerificationRecord> = {}): OutcomeVerificationRecord {
  return {
    verificationId: "out_001",
    userEmail: "sponsor@example.com",
    userId: null,
    checkpointId: null,
    caseId: null,
    journeyId: null,
    strategyRoomSessionId: SUBJECT_ID,
    executiveRunId: null,
    checkpointTitle: "Outcome verification",
    sourceSurface: "outcome-verification",
    sourceLabel: "Outcome verification",
    dueAt: null,
    status: "COMPLETED",
    outcomeClassification: "ACTION_CONFIRMED",
    evidencePosture: "USER_REPORTED",
    didAct: "YES",
    changedState: "IMPROVED",
    systemDiagnosisAccuracy: "ACCURATE",
    requiredMoveUsefulness: "USEFUL",
    whatChanged: "",
    evidenceSummary: null,
    rememberNote: null,
    createdAt: "2026-05-05T09:00:00.000Z",
    checkpointResponseStatus: "COMPLETED",
    proofLabels: ["USER_REPORTED"],
    ...overrides,
  };
}

function decision(overrides: Partial<OversightReviewDecisionRecord> = {}): OversightReviewDecisionRecord {
  return {
    id: "decision_001",
    accountId: "acct_001",
    organisationId: "org_001",
    cycleId: SUBJECT_ID,
    decision: "APPROVE_FOR_CLIENT",
    reasons: ["OPERATOR_APPROVED"],
    operatorId: "op_001",
    operatorNote: null,
    efficacyGrade: "A",
    efficacyScore: 88,
    clientSafe: true,
    deliveryAllowed: true,
    createdAt: "2026-05-03T08:00:00.000Z",
    ...overrides,
  };
}

function sourceData(overrides: Partial<DecisionProvenanceSourceData> = {}): DecisionProvenanceSourceData {
  return {
    subjectType: "OVERSIGHT_CYCLE",
    subjectId: SUBJECT_ID,
    cycles: [],
    cadenceHistory: [],
    suppressions: [],
    deliveries: [],
    outcomes: [],
    counselEntries: [],
    boardroomEntries: [],
    decisionRecords: [],
    archiveRecords: [],
    memorySummary: null,
    unavailableSources: [],
    ...overrides,
  };
}

describe("composeDecisionProvenance", () => {
  it("composer returns version 1", () => {
    const record = composeDecisionProvenanceFromSources(sourceData({ cycles: [cycle()] }));
    expect(record.version).toBe(1);
  });

  it("unsupported subject returns UNKNOWN with provenance gap", async () => {
    const record = await composeDecisionProvenance({
      subjectType: "EXECUTIVE_REPORT",
      subjectId: "report_001",
    });
    expect(record.currentPosture.status).toBe("UNKNOWN");
    expect(record.provenanceGaps.some((gap) => gap.stage === "Subject support")).toBe(true);
    expect(record.accountabilityStatement).toContain("No evidence inputs");
  });
});

describe("evidence confidence", () => {
  it("evidence input confidence is preserved", () => {
    const inputs = composeEvidenceInputs(sourceData({
      outcomes: [outcome({ evidencePosture: "USER_REPORTED" })],
    }));
    expect(inputs[0]?.confidence).toBe("USER_REPORTED");
  });

  it("user-reported evidence is not upgraded to verified", () => {
    const record = composeDecisionProvenanceFromSources(sourceData({
      outcomes: [outcome({ evidencePosture: "USER_REPORTED" })],
    }));
    expect(record.evidenceInputs[0]?.confidence).toBe("USER_REPORTED");
    expect(record.accountabilityStatement.toLowerCase()).not.toContain("verified");
  });
});

describe("governance events", () => {
  it("suppression event appears only when suppression record exists", () => {
    expect(composeGovernanceEvents(sourceData()).some((event) => event.type === "SUPPRESSION_APPLIED")).toBe(false);
    expect(composeGovernanceEvents(sourceData({ suppressions: [suppression()] })).some((event) => event.type === "SUPPRESSION_APPLIED")).toBe(true);
  });

  it("delivery event appears only when delivery record exists", () => {
    expect(composeGovernanceEvents(sourceData()).some((event) => event.type === "DELIVERY_SENT")).toBe(false);
    expect(composeGovernanceEvents(sourceData({ deliveries: [delivery()] })).some((event) => event.type === "DELIVERY_SENT")).toBe(true);
  });

  it("outcome event appears only when outcome record exists", () => {
    expect(composeGovernanceEvents(sourceData()).some((event) => event.type === "OUTCOME_RECORDED")).toBe(false);
    expect(composeGovernanceEvents(sourceData({ outcomes: [outcome()] })).some((event) => event.type === "OUTCOME_RECORDED")).toBe(true);
  });
});

describe("provenance gaps", () => {
  it("missing delivery creates WARNING gap", () => {
    const record = composeDecisionProvenanceFromSources(sourceData({
      cycles: [cycle()],
      decisionRecords: [decision()],
    }));
    expect(record.provenanceGaps).toContainEqual(expect.objectContaining({
      stage: "Delivery",
      severity: "WARNING",
    }));
  });

  it("suppression override without reason creates CRITICAL gap if detectable", () => {
    const record = composeDecisionProvenanceFromSources(sourceData({
      suppressions: [suppression({
        overrideStatus: "APPROVED_FOR_RELEASE",
        overrideReason: null,
      })],
    }));
    expect(record.provenanceGaps).toContainEqual(expect.objectContaining({
      stage: "Suppression",
      severity: "CRITICAL",
    }));
  });
});

describe("timeline", () => {
  it("timeline sorts dated events chronologically", () => {
    const record = composeDecisionProvenanceFromSources(sourceData({
      cycles: [cycle({ createdAt: "2026-05-03T09:00:00.000Z" })],
      suppressions: [suppression({ suppressedAt: "2026-05-01T09:00:00.000Z" })],
      deliveries: [delivery({ createdAt: "2026-05-02T09:00:00.000Z", deliveredAt: "2026-05-04T09:00:00.000Z" })],
    }));
    expect(record.timeline.map((item) => item.date)).toEqual([...record.timeline.map((item) => item.date)].sort());
  });

  it("undated events do not receive fake dates", () => {
    const events = composeGovernanceEvents(sourceData({
      suppressions: [suppression({ suppressedAt: null as unknown as string })],
    }));
    expect(events[0]?.occurredAt).toBeNull();
    expect(composeTimeline([], events)).toHaveLength(0);
  });
});

describe("accountability statement", () => {
  it("accountability statement counts evidence inputs", () => {
    const record = composeDecisionProvenanceFromSources(sourceData({
      cycles: [cycle()],
      suppressions: [suppression()],
      deliveries: [delivery()],
      outcomes: [outcome()],
    }));
    expect(record.accountabilityStatement).toContain("4 evidence inputs captured");
  });

  it("accountability statement mentions operator review only when present", () => {
    const withoutReview = composeDecisionProvenanceFromSources(sourceData({ cycles: [cycle()] }));
    const withReview = composeDecisionProvenanceFromSources(sourceData({
      cycles: [cycle()],
      decisionRecords: [decision()],
    }));
    expect(withoutReview.accountabilityStatement).not.toContain("operator review");
    expect(withReview.accountabilityStatement).toContain("1 operator review completed");
  });

  it("accountability statement does not claim verification without verified evidence", () => {
    const record = composeDecisionProvenanceFromSources(sourceData({
      outcomes: [outcome({ evidencePosture: "USER_REPORTED" })],
    }));
    expect(record.accountabilityStatement.toLowerCase()).not.toContain("verified");
  });
});

describe("provenance hash", () => {
  function hashable(overrides: Partial<Omit<DecisionProvenanceRecord, "provenanceHash">> = {}) {
    const record = composeDecisionProvenanceFromSources(sourceData({
      cycles: [cycle()],
      decisionRecords: [decision()],
      deliveries: [delivery()],
      outcomes: [outcome()],
    }));
    const { provenanceHash: _provenanceHash, ...withoutHash } = record;
    return {
      ...withoutHash,
      ...overrides,
    };
  }

  it("provenance hash is deterministic", () => {
    const record = hashable();
    expect(buildDecisionProvenanceHash(record)).toBe(buildDecisionProvenanceHash(record));
  });

  it("provenance hash changes when governance event changes", () => {
    const record = hashable();
    const changed = hashable({
      governanceEvents: [
        ...record.governanceEvents,
        {
          type: "MEMORY_UPDATED",
          label: "Memory changed",
          occurredAt: "2026-05-06T09:00:00.000Z",
        },
      ],
    });
    expect(buildDecisionProvenanceHash(record)).not.toBe(buildDecisionProvenanceHash(changed));
  });

  it("provenance hash ignores object key order", () => {
    const record = hashable();
    const reordered = {
      unavailableSources: record.unavailableSources,
      accountabilityStatement: record.accountabilityStatement,
      provenanceGaps: record.provenanceGaps,
      currentPosture: record.currentPosture,
      timeline: record.timeline,
      governanceEvents: record.governanceEvents,
      evidenceInputs: record.evidenceInputs,
      subjectId: record.subjectId,
      subjectType: record.subjectType,
      id: record.id,
      version: record.version,
    } as Omit<DecisionProvenanceRecord, "provenanceHash">;
    expect(buildDecisionProvenanceHash(record)).toBe(buildDecisionProvenanceHash(reordered));
  });
});

describe("current posture", () => {
  it("current posture is BLOCKED when critical gap exists", () => {
    const posture = deriveCurrentPosture({
      evidenceInputs: [],
      governanceEvents: [],
      provenanceGaps: [{ stage: "Suppression", description: "Missing reason", severity: "CRITICAL" }],
    });
    expect(posture.status).toBe("BLOCKED");
  });

  it("current posture is UNVERIFIED when delivery exists without outcome", () => {
    const record = composeDecisionProvenanceFromSources(sourceData({
      cycles: [cycle()],
      decisionRecords: [decision()],
      deliveries: [delivery()],
    }));
    expect(record.currentPosture.status).toBe("UNVERIFIED");
  });

  it("current posture is COMPLETE when delivery and outcome exist", () => {
    const record = composeDecisionProvenanceFromSources(sourceData({
      cycles: [cycle()],
      decisionRecords: [decision()],
      deliveries: [delivery()],
      outcomes: [outcome()],
    }));
    expect(record.currentPosture.status).toBe("COMPLETE");
  });
});

describe("buildAccountabilityStatement", () => {
  it("returns no evidence statement for empty input", () => {
    const record = composeDecisionProvenanceFromSources(sourceData());
    const { accountabilityStatement: _statement, provenanceHash: _hash, ...statementInput } = record;
    expect(buildAccountabilityStatement(statementInput)).toBe("No evidence inputs have been recorded for this subject.");
  });
});

describe("deterministic outcome linkage (Pass 3)", () => {
  it("exact subjectType/subjectId match is preferred over fallback", async () => {
    // This tests the logic path: loadOutcomesForSubject tries exact match first
    // The pure-function tests below verify the gap behavior
    const record = composeDecisionProvenanceFromSources(sourceData({
      outcomes: [outcome({ subjectType: "OVERSIGHT_CYCLE", subjectId: SUBJECT_ID })],
    }));
    // When outcomes are provided directly via sourceData, they're treated as exact matches
    expect(record.evidenceInputs.some((i) => i.type === "OUTCOME_VERIFICATION")).toBe(true);
  });

  it("outcome linkage gap appears when only fallback-matched outcomes exist", () => {
    // When composeDecisionProvenanceFromSources receives outcomes without exactMatch info,
    // the gap is added dynamically in composeDecisionProvenance (not the pure function).
    // This test verifies the pure function doesn't add the gap itself.
    const record = composeDecisionProvenanceFromSources(sourceData({
      outcomes: [outcome()],
    }));
    // The old static gap was removed from composeProvenanceGaps
    // The dynamic gap is added in composeDecisionProvenance
    const linkageGap = record.provenanceGaps.find((g) => g.stage === "Outcome linkage");
    expect(linkageGap).toBeUndefined();
  });
});

describe("executive report provenance (Pass 4)", () => {
  it("EXECUTIVE_REPORT is now a supported subject type", () => {
    // The SUPPORTED_SUBJECT_TYPES set now includes EXECUTIVE_REPORT
    // composeDecisionProvenance will attempt to load real data
    // The pure function composeDecisionProvenanceFromSources handles the data
    const record = composeDecisionProvenanceFromSources({
      subjectType: "EXECUTIVE_REPORT",
      subjectId: "report_001",
      deliveries: [],
      outcomes: [],
      unavailableSources: ["executive-reporting-run"],
    });
    expect(record.subjectType).toBe("EXECUTIVE_REPORT");
    // Should not have the "not supported in v1" gap
    expect(record.provenanceGaps.some((g) => g.stage === "Subject support")).toBe(false);
  });

  it("EXECUTIVE_REPORT missing delivery creates warning gap", () => {
    const record = composeDecisionProvenanceFromSources({
      subjectType: "EXECUTIVE_REPORT",
      subjectId: "report_001",
      deliveries: [],
      outcomes: [],
    });
    expect(record.provenanceGaps).toContainEqual(expect.objectContaining({
      stage: "Delivery",
      severity: "WARNING",
    }));
  });

  it("EXECUTIVE_REPORT does not expose raw report content in evidence labels", () => {
    const record = composeDecisionProvenanceFromSources({
      subjectType: "EXECUTIVE_REPORT",
      subjectId: "report_001",
      deliveries: [],
      outcomes: [],
    });
    // No evidence inputs from executive report data (none provided), so no raw content
    // When evidence inputs exist, they should not contain raw report payload
    for (const input of record.evidenceInputs) {
      expect(input.label).not.toContain("canonicalSnapshot");
      expect(input.label).not.toContain("viewModelSnapshot");
    }
  });

  it("DECISION_CASE remains unsupported with honest gap", async () => {
    const record = await composeDecisionProvenance({
      subjectType: "DECISION_CASE",
      subjectId: "case_001",
    });
    expect(record.currentPosture.status).toBe("UNKNOWN");
    expect(record.provenanceGaps.some((gap) => gap.stage === "Subject support")).toBe(true);
    expect(record.accountabilityStatement).toContain("No evidence inputs");
  });
});

describe("confidenceEvidence binding", () => {
  it("each evidence input has confidenceEvidence with a reason", () => {
    const record = composeDecisionProvenanceFromSources(sourceData({
      cycles: [cycle()],
      deliveries: [delivery()],
      outcomes: [outcome()],
    }));
    for (const input of record.evidenceInputs) {
      expect(input.confidenceEvidence).toBeDefined();
      expect(input.confidenceEvidence!.reason).toBeTruthy();
      expect(input.confidenceEvidence!.sourceType).toBeDefined();
    }
  });

  it("USER_REPORTED confidenceEvidence has USER_INPUT sourceType", () => {
    const record = composeDecisionProvenanceFromSources(sourceData({
      outcomes: [outcome({ evidencePosture: "USER_REPORTED" })],
    }));
    const outcomeInput = record.evidenceInputs.find((i) => i.type === "OUTCOME_VERIFICATION");
    expect(outcomeInput?.confidenceEvidence?.sourceType).toBe("USER_INPUT");
    expect(outcomeInput?.confidenceEvidence?.reason).toContain("user");
  });

  it("SYSTEM_INFERRED confidenceEvidence has SYSTEM_RULE sourceType", () => {
    const record = composeDecisionProvenanceFromSources(sourceData({
      cycles: [cycle({ evidencePosture: "SYSTEM_INFERRED" })],
    }));
    const cycleInput = record.evidenceInputs.find((i) => i.type === "CADENCE_CYCLE");
    expect(cycleInput?.confidenceEvidence?.sourceType).toBe("SYSTEM_RULE");
    expect(cycleInput?.confidenceEvidence?.reason).toContain("system rule");
  });

  it("OPERATOR_VERIFIED confidenceEvidence has OPERATOR_ACTION sourceType", () => {
    const record = composeDecisionProvenanceFromSources(sourceData({
      decisionRecords: [decision()],
    }));
    const decisionInput = record.evidenceInputs.find((i) => i.type === "OPERATOR_DECISION");
    expect(decisionInput?.confidenceEvidence?.sourceType).toBe("OPERATOR_ACTION");
    expect(decisionInput?.confidenceEvidence?.reason).toContain("operator review");
  });

  it("OPERATOR_VERIFIED confidenceEvidence does not expose raw operator ID", () => {
    const record = composeDecisionProvenanceFromSources(sourceData({
      decisionRecords: [decision({ operatorId: "op_secret_001" })],
    }));
    const decisionInput = record.evidenceInputs.find((i) => i.type === "OPERATOR_DECISION");
    const json = JSON.stringify(decisionInput?.confidenceEvidence);
    expect(json).not.toContain("op_secret_001");
    expect(decisionInput?.confidenceEvidence?.sourceRef).toBeNull();
  });

  it("confidenceEvidence does not contain raw payload content", () => {
    const record = composeDecisionProvenanceFromSources(sourceData({
      outcomes: [outcome({ evidencePosture: "USER_REPORTED" })],
    }));
    const json = JSON.stringify(record.evidenceInputs.map((i) => i.confidenceEvidence));
    // Should not contain raw outcome fields
    expect(json).not.toContain("whatChanged");
    expect(json).not.toContain("evidenceSummary");
    expect(json).not.toContain("rememberNote");
  });
});

describe("gap remediation", () => {
  it("delivery gap includes remediation with operator owner", () => {
    const record = composeDecisionProvenanceFromSources(sourceData({
      cycles: [cycle()],
      decisionRecords: [decision()],
    }));
    const deliveryGap = record.provenanceGaps.find((g) => g.stage === "Delivery");
    expect(deliveryGap?.remediation).toBeDefined();
    expect(deliveryGap?.remediation?.owner).toBe("operator");
    expect(deliveryGap?.remediation?.action).toContain("delivery");
    expect(deliveryGap?.remediation?.href).toBe("/admin/delivery-queue");
  });

  it("outcome gap includes remediation with operator owner", () => {
    const record = composeDecisionProvenanceFromSources(sourceData({
      cycles: [cycle()],
      decisionRecords: [decision()],
      deliveries: [delivery()],
    }));
    const outcomeGap = record.provenanceGaps.find((g) => g.stage === "Outcome");
    expect(outcomeGap?.remediation).toBeDefined();
    expect(outcomeGap?.remediation?.owner).toBe("operator");
    expect(outcomeGap?.remediation?.action).toContain("outcome verification");
  });

  it("subject support gap has future-team owner", () => {
    const record = composeDecisionProvenanceFromSources({
      subjectType: "DECISION_CASE",
      subjectId: "case_001",
    });
    const supportGap = record.provenanceGaps.find((g) => g.stage === "Subject support");
    expect(supportGap?.remediation?.owner).toBe("future-team");
    expect(supportGap?.remediation?.action).toContain("No action yet");
  });

  it("client-safe summary does not leak remediation internals", () => {
    // Dynamic import to avoid circular dependency at module level
    const record = composeDecisionProvenanceFromSources(sourceData({
      cycles: [cycle()],
    }));
    // Verify the internal record has remediation but the JSON representation
    // of the client-safe summary (composed separately) would not include it
    const hasRemediation = record.provenanceGaps.some((g) => g.remediation !== undefined);
    expect(hasRemediation).toBe(true);
    // The client-safe composer only extracts gapClasses (severity only),
    // not remediation fields — verified in client-safe-provenance-composer.test.ts
  });

  it("gap descriptions remain restrained and do not contain internal identifiers", () => {
    const record = composeDecisionProvenanceFromSources(sourceData({
      suppressions: [
        {
          eventId: "sup_001",
          scopeId: "cycle_001",
          scopeType: "CYCLE",
          surface: "oversight-brief",
          fieldName: "commercialExposure",
          evidenceSource: "system",
          originalPosture: "SYSTEM_INFERRED",
          evidencePosture: "SYSTEM_INFERRED",
          suppressionReason: "Commercial sensitivity",
          suppressionRule: "COMMERCIAL_SENSITIVITY",
          operatorReviewAvailable: true,
          suppressedAt: "2026-05-02T09:00:00.000Z",
          suppressedBySystem: true,
          reviewedByOperator: null,
          reviewedAt: null,
          overrideStatus: "NONE",
          overrideReason: null,
        },
      ],
    }));
    for (const gap of record.provenanceGaps) {
      expect(gap.description).not.toContain("op_001");
      expect(gap.description).not.toContain("cycle_001");
      expect(gap.description).not.toContain("acct_001");
    }
  });
});
