import { describe, expect, it } from "vitest";

import {
  composeDecisionBehaviourVector,
  buildVectorStorageKey,
  serialiseVector,
  deserialiseVector,
  VECTOR_STORAGE_PREFIX,
  type VectorComposerInput,
} from "./decision-behaviour-vector-composer";
import type { DecisionBehaviourVector } from "./decision-behaviour-vector-contract";

describe("composeDecisionBehaviourVector", () => {
  const baseInput: VectorComposerInput = {
    caseId: "case_001",
    sourceType: "FAST_DIAGNOSTIC",
    framed: true,
    saved: true,
    outcomeStatus: "ACTED",
    anonymisable: true,
    contributionConsent: true,
  };

  it("returns a valid vector with version 1", () => {
    const vector = composeDecisionBehaviourVector(baseInput);
    expect(vector.version).toBe(1);
    expect(vector.caseId).toBe("case_001");
    expect(vector.sourceType).toBe("FAST_DIAGNOSTIC");
  });

  it("sets acted=true when outcome is ACTED", () => {
    const vector = composeDecisionBehaviourVector(baseInput);
    expect(vector.decisionState.acted).toBe(true);
  });

  it("sets resolved=true when outcome is RESOLVED", () => {
    const vector = composeDecisionBehaviourVector({
      ...baseInput,
      outcomeStatus: "RESOLVED",
    });
    expect(vector.decisionState.resolved).toBe(true);
    expect(vector.decisionState.acted).toBe(true);
  });

  it("sets reopened=true when outcome is RECURRED", () => {
    const vector = composeDecisionBehaviourVector({
      ...baseInput,
      outcomeStatus: "RECURRED",
    });
    expect(vector.decisionState.reopened).toBe(true);
  });

  it("sets blocked=true when outcome is BLOCKED", () => {
    const vector = composeDecisionBehaviourVector({
      ...baseInput,
      outcomeStatus: "BLOCKED",
    });
    expect(vector.decisionState.blocked).toBe(true);
  });

  it("sets abandoned=true when outcome is ABANDONED", () => {
    const vector = composeDecisionBehaviourVector({
      ...baseInput,
      outcomeStatus: "ABANDONED",
    });
    expect(vector.decisionState.abandoned).toBe(true);
  });

  it("sets delayed=true when daysToFirstAction > 14", () => {
    const vector = composeDecisionBehaviourVector({
      ...baseInput,
      outcomeStatus: "UNKNOWN",
      daysToFirstAction: 20,
    });
    expect(vector.decisionState.delayed).toBe(true);
  });

  it("does not set delayed when daysToFirstAction <= 14", () => {
    const vector = composeDecisionBehaviourVector({
      ...baseInput,
      outcomeStatus: "ACTED",
      daysToFirstAction: 5,
    });
    expect(vector.decisionState.delayed).toBeNull();
  });

  it("includes friction signals when provided", () => {
    const vector = composeDecisionBehaviourVector({
      ...baseInput,
      authorityGap: true,
      evidenceGap: true,
      recurrenceDetected: true,
    });
    expect(vector.friction.authorityGap).toBe(true);
    expect(vector.friction.evidenceGap).toBe(true);
    expect(vector.friction.recurrenceDetected).toBe(true);
    expect(vector.friction.accountabilityGap).toBeUndefined();
  });

  it("includes commercial exposure when costBasis is provided", () => {
    const vector = composeDecisionBehaviourVector({
      ...baseInput,
      costBasis: "USER_REPORTED",
      delayCostBand: "HIGH",
    });
    expect(vector.commercialExposure).toBeDefined();
    expect(vector.commercialExposure?.costBasis).toBe("USER_REPORTED");
    expect(vector.commercialExposure?.delayCostBand).toBe("HIGH");
  });

  it("omits commercial exposure when costBasis is not provided", () => {
    const vector = composeDecisionBehaviourVector(baseInput);
    expect(vector.commercialExposure).toBeUndefined();
  });

  it("privacy: containsRawDecisionText is always false", () => {
    const vector = composeDecisionBehaviourVector(baseInput);
    expect(vector.privacy.containsRawDecisionText).toBe(false);
  });

  it("privacy: includes consent flags", () => {
    const vector = composeDecisionBehaviourVector(baseInput);
    expect(vector.privacy.anonymisable).toBe(true);
    expect(vector.privacy.contributionConsent).toBe(true);
  });

  it("handles all source types", () => {
    const types: DecisionBehaviourVector["sourceType"][] = [
      "FAST_DIAGNOSTIC",
      "PURPOSE_ALIGNMENT",
      "CONSTITUTIONAL",
      "TEAM_ASSESSMENT",
      "ENTERPRISE_ASSESSMENT",
      "EXECUTIVE_REPORT",
      "STRATEGY_ROOM_RECORD",
      "RETURN_BRIEF",
    ];
    for (const sourceType of types) {
      const vector = composeDecisionBehaviourVector({ ...baseInput, sourceType });
      expect(vector.sourceType).toBe(sourceType);
    }
  });

  it("handles all outcome statuses", () => {
    const statuses: DecisionBehaviourVector["outcome"]["status"][] = [
      "UNKNOWN",
      "ACTED",
      "DELAYED",
      "BLOCKED",
      "ABANDONED",
      "RESOLVED",
      "RECURRED",
      "ESCALATED",
    ];
    for (const status of statuses) {
      const vector = composeDecisionBehaviourVector({ ...baseInput, outcomeStatus: status });
      expect(vector.outcome.status).toBe(status);
    }
  });
});

describe("buildVectorStorageKey", () => {
  it("returns a key with the prefix and caseId", () => {
    const key = buildVectorStorageKey("case_001");
    expect(key).toBe(`${VECTOR_STORAGE_PREFIX}case_001`);
  });
});

describe("serialiseVector / deserialiseVector", () => {
  it("round-trips a vector", () => {
    const input: VectorComposerInput = {
      caseId: "case_001",
      sourceType: "TEAM_ASSESSMENT",
      framed: true,
      saved: true,
      outcomeStatus: "BLOCKED",
      authorityGap: true,
      costBasis: "SYSTEM_ESTIMATED",
      delayCostBand: "SEVERE",
      anonymisable: true,
      contributionConsent: true,
    };
    const vector = composeDecisionBehaviourVector(input);
    const json = serialiseVector(vector);
    const restored = deserialiseVector(json);
    expect(restored.caseId).toBe("case_001");
    expect(restored.sourceType).toBe("TEAM_ASSESSMENT");
    expect(restored.decisionState.blocked).toBe(true);
    expect(restored.commercialExposure?.delayCostBand).toBe("SEVERE");
    expect(restored.privacy.containsRawDecisionText).toBe(false);
  });
});
