import { describe, expect, it } from "vitest";

import { PURPOSE_ALIGNMENT_QUESTIONS } from "@/lib/alignment/checklist";
import { scorePurposeProfile } from "@/lib/alignment/scoring";
import type { DualAxisAnswer } from "@/lib/alignment/types";
import {
  buildDiagnosticIntelligenceChain,
  type DiagnosticLayerInput,
} from "./layered-intelligence-engine";

describe("layered diagnostic intelligence engine", () => {
  it("returns state, tension, pattern, consequence and action for every tier", () => {
    const chain = buildDiagnosticIntelligenceChain(baseChainInput());

    expect(chain.layers.map((layer) => layer.layer)).toEqual([
      "personal",
      "constitutional",
      "team",
      "enterprise",
      "executive",
    ]);

    for (const layer of chain.layers) {
      expect(layer.conditionStatement.length).toBeGreaterThan(20);
      expect(layer.state.label.length).toBeGreaterThan(3);
      expect(layer.tensions.length).toBeGreaterThan(0);
      expect(layer.primaryPattern.id.length).toBeGreaterThan(3);
      expect(layer.consequence.statement.length).toBeGreaterThan(20);
      expect(layer.action.firstMove.length).toBeGreaterThan(20);
    }
  });

  it("same personal profile with different structure produces different constitutional results", () => {
    const strongStructure = buildDiagnosticIntelligenceChain({
      ...baseChainInput(),
      constitutional: {
        authorityClarity: 82,
        mandateIntegrity: 84,
        decisionRights: 80,
        constraintStructure: 78,
        governanceAlignment: 81,
      },
    });
    const brokenStructure = buildDiagnosticIntelligenceChain({
      ...baseChainInput(),
      constitutional: {
        authorityClarity: 28,
        mandateIntegrity: 34,
        decisionRights: 25,
        constraintStructure: 44,
        governanceAlignment: 31,
      },
    });

    expect(layer(strongStructure, "constitutional").primaryPattern.id).not.toEqual(
      layer(brokenStructure, "constitutional").primaryPattern.id,
    );
    expect(layer(brokenStructure, "constitutional").state.severity).toMatch(
      /high|critical/,
    );
  });

  it("same structure with different team dynamics produces different team results", () => {
    const authorityShadow = buildDiagnosticIntelligenceChain({
      ...baseChainInput(),
      team: {
        coordinationFriction: 38,
        roleCollision: 88,
        decisionLatency: 35,
        communicationDistortion: 82,
        dependencyLock: 30,
        executionTrust: 42,
      },
    });
    const dependencyLocked = buildDiagnosticIntelligenceChain({
      ...baseChainInput(),
      team: {
        coordinationFriction: 54,
        roleCollision: 24,
        decisionLatency: 88,
        communicationDistortion: 28,
        dependencyLock: 91,
        executionTrust: 65,
      },
    });

    expect(layer(authorityShadow, "team").primaryPattern.id).toBe(
      "authority_shadowing",
    );
    expect(layer(dependencyLocked, "team").primaryPattern.id).toBe(
      "dependency_lock",
    );
  });

  it("same team with different scale creates different enterprise consequence pressure", () => {
    const contained = buildDiagnosticIntelligenceChain({
      ...baseChainInput(),
      enterprise: {
        crossTeamFriction: 35,
        resourceAllocationDistortion: 30,
        strategicDrift: 34,
        financialExposure: 12000,
        institutionalInertia: 30,
        scaleFactor: 1,
      },
    });
    const scaled = buildDiagnosticIntelligenceChain({
      ...baseChainInput(),
      enterprise: {
        crossTeamFriction: 35,
        resourceAllocationDistortion: 30,
        strategicDrift: 34,
        financialExposure: 320000,
        institutionalInertia: 30,
        scaleFactor: 12,
      },
    });

    expect(layer(contained, "enterprise").state.severity).not.toEqual(
      layer(scaled, "enterprise").state.severity,
    );
    expect(layer(scaled, "enterprise").consequence.statement).toContain(
      "£320,000",
    );
  });

  it("same enterprise condition creates different executive consequence based on exposure", () => {
    const lowExposure = buildDiagnosticIntelligenceChain({
      ...baseChainInput(),
      executive: {
        consequenceExposure: 18000,
        wrongActionCost: 8000,
        timeToFailureDays: 120,
        urgency: 25,
        decisionOwnershipClarity: 80,
      },
    });
    const highExposure = buildDiagnosticIntelligenceChain({
      ...baseChainInput(),
      executive: {
        consequenceExposure: 950000,
        wrongActionCost: 260000,
        timeToFailureDays: 21,
        urgency: 88,
        decisionOwnershipClarity: 35,
      },
    });

    expect(layer(lowExposure, "executive").state.severity).not.toEqual(
      layer(highExposure, "executive").state.severity,
    );
    expect(layer(highExposure, "executive").consequence.statement).toContain(
      "£950,000",
    );
    expect(layer(highExposure, "executive").action.escalationThreshold).toContain(
      "30 days",
    );
  });

  it("higher layers transform prior signals instead of repeating the same condition", () => {
    const chain = buildDiagnosticIntelligenceChain(baseChainInput());
    const conditions = chain.layers.map((item) => item.conditionStatement);
    const uniqueConditions = new Set(conditions);

    expect(uniqueConditions.size).toBe(chain.layers.length);
    expect(layer(chain, "executive").consumedPriorSignals[0]).toContain(
      "Enterprise condition",
    );
    expect(layer(chain, "enterprise").consumedPriorSignals[0]).toContain(
      "Team condition",
    );
  });
});

function baseChainInput(): DiagnosticLayerInput {
  const answers = PURPOSE_ALIGNMENT_QUESTIONS.reduce<Record<string, DualAxisAnswer>>(
    (acc, question) => {
      acc[question.id] = {
        resonance: question.domain === "decision" ? 24 : 72,
        certainty: question.domain === "decision" ? 86 : 68,
      };
      return acc;
    },
    {},
  );

  return {
    personal: scorePurposeProfile({
      answers,
    }),
    constitutional: {
      authorityClarity: 42,
      mandateIntegrity: 58,
      decisionRights: 35,
      constraintStructure: 61,
      governanceAlignment: 46,
    },
    team: {
      coordinationFriction: 74,
      roleCollision: 52,
      decisionLatency: 77,
      communicationDistortion: 48,
      dependencyLock: 66,
      executionTrust: 43,
    },
    enterprise: {
      crossTeamFriction: 71,
      resourceAllocationDistortion: 63,
      strategicDrift: 68,
      financialExposure: 180000,
      institutionalInertia: 70,
      scaleFactor: 6,
    },
    executive: {
      consequenceExposure: 420000,
      wrongActionCost: 140000,
      timeToFailureDays: 42,
      urgency: 72,
      decisionOwnershipClarity: 44,
    },
  };
}

function layer(
  chain: ReturnType<typeof buildDiagnosticIntelligenceChain>,
  target: "constitutional" | "team" | "enterprise" | "executive",
) {
  const found = chain.layers.find((item) => item.layer === target);
  if (!found) throw new Error(`Missing ${target} layer`);
  return found;
}
