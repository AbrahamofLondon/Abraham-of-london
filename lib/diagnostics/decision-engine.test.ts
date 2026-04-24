import { describe, expect, it } from "vitest";

import { PURPOSE_ALIGNMENT_QUESTIONS } from "@/lib/alignment/checklist";
import { scorePurposeProfile } from "@/lib/alignment/scoring";
import type { DualAxisAnswer } from "@/lib/alignment/types";
import {
  buildConstitutionalDecisionObject,
  buildEnterpriseDecisionResult,
  buildPurposeDecisionObject,
  buildTeamDecisionResult,
} from "./decision-engine";
import type { ConstitutionalDecision } from "@/lib/constitution/rules";

describe("decision-engine", () => {
  it("maps purpose signals into a deterministic decision object", () => {
    const answers = PURPOSE_ALIGNMENT_QUESTIONS.reduce<Record<string, DualAxisAnswer>>(
      (acc, question) => {
        acc[question.id] = {
          resonance: question.domain === "identity" ? 22 : 68,
          certainty: question.domain === "identity" ? 86 : 62,
        };
        return acc;
      },
      {},
    );

    const result = scorePurposeProfile({
      answers,
      context: {
        reflections: {
          avoidedDecision: "Whether to keep leading the function under the current mandate",
          dissenter: "A senior operator has already said the mandate is unclear",
        },
      },
    });

    const decisionObject = buildPurposeDecisionObject({
      result,
      context: {
        reflections: {
          avoidedDecision: "Whether to keep leading the function under the current mandate",
          dissenter: "A senior operator has already said the mandate is unclear",
        },
      },
    });

    expect(decisionObject.condition.length).toBeGreaterThan(5);
    expect(decisionObject.decision).toContain("mandate");
    expect(decisionObject.evidence.length).toBeGreaterThan(0);
  });

  it("resolves constitutional authority weakness into a mandate decision", () => {
    const decision: ConstitutionalDecision = {
      route: "DIAGNOSTIC",
      confidence: 0.62,
      thresholds: { strategyThreshold: 65, diagnosticThreshold: 40 },
      proximity: { toStrategy: 18, toDiagnostic: 9 },
      disqualifiersTriggered: ["Insufficient authority"],
      recommendedInterventions: ["Clarify decision authority"],
      rationale: ["Authority type unclear and governance remains weak."],
      postureWeight: 0.8,
      readinessWeight: 0.68,
      escalationAllowed: false,
    };

    const decisionObject = buildConstitutionalDecisionObject({
      decision,
      scores: {
        authority: 34,
        coherence: 48,
        trust: 44,
        pressure: 62,
        friction: 58,
        seriousness: 55,
        governance: 39,
        narrative: 46,
        interventionReadiness: 41,
        severity: 7,
        failureModeCount: 3,
        authorityType: "UNCLEAR",
        posture: "MISALIGNED",
        readinessTier: "EMERGING",
      },
      reflections: {
        shadowAuthority: "The COO is effectively deciding without formal ownership",
      },
    });

    expect(decisionObject.decision).toBe("Define authority versus delay");
    expect(decisionObject.confidence).toMatch(/medium|high/);
    expect(decisionObject.evidence[0]?.summary).toContain("Authority");
  });

  it("keeps team divergence from collapsing into the same output as trust failure", () => {
    const distributed = buildTeamDecisionResult({
      gaps: [
        { domain: "direction", label: "Direction", leaderPct: 80, realityPct: 42, gap: 38, gapSeverity: "CRITICAL" },
        { domain: "execution", label: "Execution", leaderPct: 78, realityPct: 44, gap: 34, gapSeverity: "CRITICAL" },
      ],
      overallLeader: 79,
      overallReality: 43,
      purposePct: 58,
      confidenceBaseline: 82,
    });
    const trust = buildTeamDecisionResult({
      gaps: [
        { domain: "trust", label: "Trust", leaderPct: 76, realityPct: 48, gap: 28, gapSeverity: "HIGH" },
        { domain: "authority", label: "Authority", leaderPct: 68, realityPct: 60, gap: 8, gapSeverity: "LOW" },
      ],
      overallLeader: 73,
      overallReality: 54,
      purposePct: 71,
      confidenceBaseline: 60,
    });

    expect(distributed.title).not.toBe(trust.title);
    expect(distributed.decisionObject.decision).toBe("Standardise versus fragment");
    expect(trust.decisionObject.decision).toBe("Centralise trust repair versus distribute assumptions");
  });

  it("maps enterprise governance and execution strain into different decision objects", () => {
    const governance = buildEnterpriseDecisionResult({
      totalPct: 46,
      sections: [
        { id: "leadership", title: "Leadership Coherence", pct: 42 },
        { id: "governance", title: "Governance Reliability", pct: 38 },
        { id: "execution", title: "Execution Variance", pct: 63 },
        { id: "risk", title: "Institutional Risk Posture", pct: 58 },
      ],
      teamAlignmentPct: 57,
      recentDecision: "Who signs off the operating model change",
    });
    const execution = buildEnterpriseDecisionResult({
      totalPct: 44,
      sections: [
        { id: "leadership", title: "Leadership Coherence", pct: 61 },
        { id: "governance", title: "Governance Reliability", pct: 62 },
        { id: "execution", title: "Execution Variance", pct: 34 },
        { id: "risk", title: "Institutional Risk Posture", pct: 32 },
      ],
      teamAlignmentPct: 52,
      recentDecision: "Whether to absorb the delivery delay or stop the programme",
    });

    expect(governance.decisionObject.decision).toBe("Define authority versus delay");
    expect(execution.decisionObject.decision).toBe("Commit versus defer");
    expect(governance.patternTitle).not.toBe(execution.patternTitle);
  });
});
