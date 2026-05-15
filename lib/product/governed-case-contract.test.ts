import { describe, expect, it } from "vitest";

import {
  deriveGovernedCaseStatus,
  mapSaveSourceToGovernedType,
  mapSurfaceToGovernedType,
  type GovernedCaseRecord,
  type GovernedCaseType,
} from "./governed-case-contract";
import type { LivingCase } from "./living-case-store";

describe("deriveGovernedCaseStatus", () => {
  const base: LivingCase = {
    caseId: "test",
    subjectKey: "test",
    email: null,
    organisation: null,
    status: "open",
    createdAt: null,
    evidenceTier: "single_source",
    completedStages: [],
    stageCount: 0,
    decisions: [],
    primaryDecision: null,
    contradictions: [],
    unresolvedTensions: [],
    evidenceNodes: [],
    evidenceNodeCount: 0,
    routeDecisions: [],
    latestDirective: null,
    escalationHistory: [],
    decisionObjectCount: 0,
  };

  it("maps open to ACTIVE", () => {
    expect(deriveGovernedCaseStatus({ ...base, status: "open" })).toBe("ACTIVE");
  });

  it("maps active to ACTIVE", () => {
    expect(deriveGovernedCaseStatus({ ...base, status: "active" })).toBe("ACTIVE");
  });

  it("maps under_intervention to ESCALATED", () => {
    expect(deriveGovernedCaseStatus({ ...base, status: "under_intervention" })).toBe("ESCALATED");
  });

  it("maps monitoring to WATCH", () => {
    expect(deriveGovernedCaseStatus({ ...base, status: "monitoring" })).toBe("WATCH");
  });

  it("maps resolved to RESOLVED", () => {
    expect(deriveGovernedCaseStatus({ ...base, status: "resolved" })).toBe("RESOLVED");
  });

  it("maps persistent to WATCH", () => {
    expect(deriveGovernedCaseStatus({ ...base, status: "persistent" })).toBe("WATCH");
  });
});

describe("mapSaveSourceToGovernedType", () => {
  it("maps DECISION_DELAY_CALCULATOR to FAST_DIAGNOSTIC", () => {
    expect(mapSaveSourceToGovernedType("DECISION_DELAY_CALCULATOR")).toBe("FAST_DIAGNOSTIC");
  });

  it("maps FAST_DIAGNOSTIC to FAST_DIAGNOSTIC", () => {
    expect(mapSaveSourceToGovernedType("FAST_DIAGNOSTIC")).toBe("FAST_DIAGNOSTIC");
  });

  it("maps BOARD_SUMMARY to FAST_DIAGNOSTIC", () => {
    expect(mapSaveSourceToGovernedType("BOARD_SUMMARY")).toBe("FAST_DIAGNOSTIC");
  });
});

describe("mapSurfaceToGovernedType", () => {
  it("maps fast-diagnostic to FAST_DIAGNOSTIC", () => {
    expect(mapSurfaceToGovernedType("fast-diagnostic")).toBe("FAST_DIAGNOSTIC");
  });

  it("maps strategy-room to STRATEGY_ROOM_RECORD", () => {
    expect(mapSurfaceToGovernedType("strategy-room")).toBe("STRATEGY_ROOM_RECORD");
  });

  it("maps return-brief to RETURN_BRIEF", () => {
    expect(mapSurfaceToGovernedType("return-brief")).toBe("RETURN_BRIEF");
  });

  it("maps proof-pack to PROOF_PACK", () => {
    expect(mapSurfaceToGovernedType("proof-pack")).toBe("PROOF_PACK");
  });

  it("maps unknown surface to FAST_DIAGNOSTIC", () => {
    expect(mapSurfaceToGovernedType("unknown-surface")).toBe("FAST_DIAGNOSTIC");
  });
});

describe("GovernedCaseRecord type shape", () => {
  it("accepts a valid governed case record", () => {
    const record: GovernedCaseRecord = {
      caseId: "case_001",
      ownerEmail: "user@example.com",
      sourceType: "FAST_DIAGNOSTIC",
      title: "Whether to restructure",
      primaryFinding: "Authority unclear",
      evidencePosture: "USER_REPORTED",
      governanceImplication: "Escalation risk if unresolved",
      nextEarnedAction: {
        label: "Complete Fast Diagnostic",
        href: "/diagnostics/fast",
        reason: "Primary condition requires classification",
      },
      consequenceTimeline: {
        sevenDays: "Delay continues",
        thirtyDays: "Cost rises",
        ninetyDays: "Options narrow",
      },
      provenanceHash: "abc123def456",
      createdAt: "2026-05-15T12:00:00.000Z",
      updatedAt: "2026-05-15T12:00:00.000Z",
    };

    expect(record.caseId).toBe("case_001");
    expect(record.sourceType).toBe("FAST_DIAGNOSTIC");
    expect(record.nextEarnedAction?.label).toBe("Complete Fast Diagnostic");
    expect(record.consequenceTimeline?.thirtyDays).toBe("Cost rises");
  });

  it("accepts a minimal governed case record with only required fields", () => {
    const record: GovernedCaseRecord = {
      caseId: "case_002",
      sourceType: "STRATEGY_ROOM_RECORD",
      title: "Execution tracking",
      evidencePosture: "SYSTEM_INFERRED",
      createdAt: "2026-05-15T12:00:00.000Z",
      updatedAt: "2026-05-15T12:00:00.000Z",
    };

    expect(record.caseId).toBe("case_002");
    expect(record.ownerEmail).toBeUndefined();
    expect(record.nextEarnedAction).toBeUndefined();
  });
});
