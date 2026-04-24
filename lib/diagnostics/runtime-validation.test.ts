import { describe, expect, it } from "vitest";

import {
  diagnosticSubmissionSchema,
  enterpriseAssessmentRunSchema,
  evidenceNodeSchema,
  teamAssessmentRunSchema,
} from "@/lib/diagnostics/runtime-validation";
import {
  createSubmissionKey,
  getCachedSubmissionResult,
  setCachedSubmissionResult,
} from "@/lib/diagnostics/submission-control";
import { buildDecisionObjectFromSignals } from "@/lib/diagnostics/decision-engine";

describe("runtime validation", () => {
  it("rejects malformed diagnostic submissions instead of producing plausible output", () => {
    const parsed = diagnosticSubmissionSchema.safeParse({
      kind: "purpose-alignment",
      version: "1",
      source: "diagnostics",
      entry: "purpose",
      intent: "diagnostic",
      title: "Purpose",
      answers: [{ sectionId: "a", questionId: "q1", prompt: "x", value: -5 }],
      summary: {
        totalScore: 999,
        maxScore: 10,
        pct: 200,
        severity: "critical",
        band: "escalate",
        sectionScores: [{ sectionId: "a", title: "A", score: 999, maxScore: 10, pct: 200 }],
      },
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects out-of-range team and enterprise payloads", () => {
    expect(teamAssessmentRunSchema.safeParse({
      email: "operator@example.com",
      organisation: "Org",
      rows: [{
        teamName: "Ops",
        respondents: 1,
        authorityClarity: 120,
        executionTrust: 40,
        operatingFriction: 20,
        strategicCoherence: 20,
      }],
    }).success).toBe(false);

    expect(enterpriseAssessmentRunSchema.safeParse({
      email: "operator@example.com",
      organisation: "Org",
      domains: [{
        label: "Ops",
        authority: 20,
        governance: 20,
        clarity: 20,
        execution: 20,
        trust: 20,
        exposure: 120,
      }, {
        label: "Sales",
        authority: 20,
        governance: 20,
        clarity: 20,
        execution: 20,
        trust: 20,
        exposure: 20,
      }, {
        label: "Finance",
        authority: 20,
        governance: 20,
        clarity: 20,
        execution: 20,
        trust: 20,
        exposure: 20,
      }],
    }).success).toBe(false);
  });

  it("rejects polluted evidence graph nodes", () => {
    const parsed = evidenceNodeSchema.safeParse({
      sourceStage: "enterprise",
      kind: "contradiction",
      label: "Injected contradiction",
      summary: "Injected contradiction",
      confidence: 0.4,
      severity: "SEVERE",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("submission control", () => {
  it("scopes duplicate detection by user, journey, stage, and input hash", () => {
    const one = createSubmissionKey({
      scope: "user@example.com",
      journeyId: "journey-1",
      stage: "team",
      payload: { a: 1 },
    });
    const two = createSubmissionKey({
      scope: "other@example.com",
      journeyId: "journey-1",
      stage: "team",
      payload: { a: 1 },
    });
    const three = createSubmissionKey({
      scope: "user@example.com",
      journeyId: "journey-1",
      stage: "enterprise",
      payload: { a: 1 },
    });

    expect(one).not.toBe(two);
    expect(one).not.toBe(three);

    setCachedSubmissionResult(one, { ok: true });
    expect(getCachedSubmissionResult(one)).toEqual({ ok: true });
    expect(getCachedSubmissionResult(two)).toBeNull();
  });
});

describe("decision engine trust contract", () => {
  it("returns canonical diagnostic meaning with signal strength disclosure", () => {
    const result = buildDecisionObjectFromSignals({
      condition: "Authority drift",
      signals: [{
        id: "mandate_vacuum",
        label: "Authority gap",
        summary: "Authority remains undefined.",
        severity: 8,
      }],
    });

    expect(result.condition).toBe("Authority drift");
    expect(result.decision.length).toBeGreaterThan(0);
    expect(result.signalStrengthDisclosure).toContain("not a statistical prediction");
    expect(result.signalStrength).toMatch(/low|medium|high/);
  });
});
