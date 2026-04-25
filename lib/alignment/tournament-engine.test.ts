import { describe, expect, it } from "vitest";
import { runTournament } from "./tournament-engine";
import type { PurposeProfileResult, DualAxisAnswer } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// FIXTURES
// ─────────────────────────────────────────────────────────────────────────────

function makeDeterministicResult(overrides?: Partial<PurposeProfileResult>): PurposeProfileResult {
  return {
    totalScore: 33,
    maxScore: 60,
    percent: 55,
    coherenceBand: "Fractured" as PurposeProfileResult["coherenceBand"],
    weakestDomains: ["decision"],
    strengths: [],
    corrections: [],
    narrative: "Decisions are being made but not from a coherent centre.",
    nextActions: ["Name the decision you are avoiding."],
    createdAt: new Date().toISOString(),
    domainProfiles: [
      { domain: "identity" as const, label: "Identity", resonance: 7, certainty: 6, weighted: 4.2, percent: 70 },
      { domain: "decision" as const, label: "Decision", resonance: 4, certainty: 3, weighted: 1.2, percent: 35 },
      { domain: "environment" as const, label: "Environment", resonance: 6, certainty: 5, weighted: 3.0, percent: 60 },
      { domain: "behaviour" as const, label: "Behaviour", resonance: 5, certainty: 5, weighted: 2.5, percent: 55 },
      { domain: "emotional_order" as const, label: "Emotional Order", resonance: 5, certainty: 4, weighted: 2.0, percent: 50 },
      { domain: "legacy" as const, label: "Legacy", resonance: 6, certainty: 6, weighted: 3.6, percent: 65 },
    ],
    firstAction: "Name the decision you are avoiding.",
    ...overrides,
  };
}

const baseAnswers: Record<string, DualAxisAnswer> = {
  q1: { resonance: 5, certainty: 5 },
  q2: { resonance: 4, certainty: 3 },
};

const reflections = {
  avoidedDecision: "I keep avoiding the decision to let go of the engineering team lead who is underperforming because they are a close friend",
  lastSevenDays: "Spent three meetings discussing team performance without naming the actual problem",
  dissenter: "My co-founder thinks I am protecting them at the cost of the team",
};

const demographic = { role: "CEO", industry: "Technology" };
const icDemographic = { role: "Junior Analyst", industry: "Finance" };

// ─────────────────────────────────────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe("runTournament", () => {
  it("1. rejects generative that claims 90% when deterministic is 55%", () => {
    const generative = `Your alignment is at 90% coherence. Your decision domain is strong. The avoided decision about your engineering team lead shows high self-awareness. You should continue building on this strength.`;

    const result = runTournament(makeDeterministicResult(), generative, baseAnswers, reflections, demographic);

    expect(result.arbiterVerdict).toBe("deterministic_wins");
    expect(result.contradictions.some((c) => c.includes("90%"))).toBe(true);
  });

  it("2. rejects generative that invents £50k cost without user evidence", () => {
    const generative = `Your decision avoidance about the engineering team lead is costing approximately £50k per quarter in lost productivity. The avoided decision you named — letting go of the underperformer — must be addressed within 30 days.`;

    const result = runTournament(makeDeterministicResult(), generative, baseAnswers, reflections, demographic);

    expect(result.arbiterVerdict).toBe("deterministic_wins");
    expect(result.contradictions.some((c) => /unsupported/i.test(c))).toBe(true);
  });

  it("3. rejects generative that does not reference avoidedDecision / lastSevenDays / dissenter", () => {
    const generative = `Your alignment profile shows moderate coherence. The decision domain is the weakest area. You should focus on improving decision-making processes and establishing clearer governance frameworks to improve your score over time. This will help you build more consistent behaviour patterns across all six domains and eventually reach a higher coherence band.`;

    const result = runTournament(makeDeterministicResult(), generative, baseAnswers, reflections, demographic);

    expect(result.arbiterVerdict).toBe("deterministic_wins");
    expect(result.contradictions.some((c) => /anchor/i.test(c))).toBe(true);
  });

  it("4. rejects generative that identifies wrong weakest domain", () => {
    const generative = `Your legacy orientation is the primary area of concern. The avoided decision about your engineering team lead suggests a pattern where future-building structures are not being maintained. Your co-founder's concern about protecting the underperformer reflects a legacy problem more than a decision problem.`;

    const result = runTournament(makeDeterministicResult(), generative, baseAnswers, reflections, demographic);

    expect(result.arbiterVerdict).toBe("deterministic_wins");
    expect(result.contradictions.some((c) => /legacy/i.test(c) && /decision/i.test(c))).toBe(true);
  });

  it("5. accepts valid synthesis anchored to user reflection and correct domain", () => {
    const generative = `Your decision integrity is the weakest structural layer at 35%. You named the avoided decision directly: letting go of the engineering team lead who is underperforming because they are a close friend. Your co-founder has already identified this — they think you are protecting them at the cost of the team. Three meetings in the last seven days discussed team performance without naming the actual problem. The decision is not ambiguous. It is avoided. The next move: name the decision in writing. Set a deadline. Attach a consequence for inaction. The pattern does not resolve through discussion. It resolves through commitment.`;

    const result = runTournament(makeDeterministicResult(), generative, baseAnswers, reflections, demographic);

    expect(result.arbiterVerdict).toBe("generative_wins");
    expect(result.quotedUserLanguage).toBe(true);
    expect(result.confidence).toBeGreaterThanOrEqual(0.7);
    expect(result.confidence).toBeLessThanOrEqual(0.95);
  });

  it("6. warns but does not auto-reject CEO advice lacking governance/strategy language", () => {
    // This synthesis is anchored and correct but missing authority/governance framing
    const generative = `Your decision domain scores 35%. You named the avoided decision: letting go of the engineering team lead who is underperforming because they are a close friend. Your co-founder sees the same pattern. Three meetings this week circled the issue without confronting it. The next move is to write the commitment down and set a 7-day deadline.`;

    const result = runTournament(makeDeterministicResult(), generative, baseAnswers, reflections, demographic);

    // Should have a WARNING for role mismatch but NOT be rejected
    const hasRoleWarning = result.contradictions.some((c) => /senior|role|CEO/i.test(c));
    // The synthesis is otherwise valid, so it should win unless generic advice triggers
    // (it shouldn't — it's specific enough)
    if (result.arbiterVerdict === "generative_wins") {
      expect(hasRoleWarning || result.contradictions.length === 0).toBe(true);
    }
    // Key: NOT auto-rejected purely for role mismatch
    expect(result.contradictions.filter((c) => /board-level action/i.test(c))).toHaveLength(0);
  });

  it("7. rejects IC advice mentioning board escalation as direct action", () => {
    const generative = `Your decision integrity is the weakest domain. You are avoiding letting go of the engineering team lead. Your co-founder agrees. Three meetings this week avoided the issue. The next move: take it to the board and force the board chair to intervene directly.`;

    const result = runTournament(makeDeterministicResult(), generative, baseAnswers, reflections, icDemographic);

    expect(result.arbiterVerdict).toBe("deterministic_wins");
    expect(result.contradictions.some((c) => /board/i.test(c) && /role/i.test(c))).toBe(true);
  });

  it("rejects generative that invents behavioural verification", () => {
    const generative = `Your decision domain is weak at 35%. Calendar confirms you have avoided this decision. The avoided decision about your engineering team lead needs immediate action. Your co-founder sees the same pattern.`;

    const result = runTournament(makeDeterministicResult(), generative, baseAnswers, reflections, demographic);

    expect(result.arbiterVerdict).toBe("deterministic_wins");
    expect(result.contradictions.some((c) => /verification/i.test(c))).toBe(true);
  });

  it("rejects generative that invents peer data", () => {
    const generative = `Your decision domain is weak at 35%. CEOs like you breach their commitments 40% of the time on decision-related patterns. The avoided decision about the engineering team lead reflects this industry benchmark. Your co-founder's concern is consistent with the peer average.`;

    const result = runTournament(makeDeterministicResult(), generative, baseAnswers, reflections, demographic);

    expect(result.arbiterVerdict).toBe("deterministic_wins");
    expect(result.contradictions.some((c) => /peer/i.test(c))).toBe(true);
  });

  it("clamps confidence between 0.35 and 0.95", () => {
    // Deterministic wins with many blockers — confidence should be >= 0.35
    const generic = "Think about it.";
    const result = runTournament(makeDeterministicResult(), generic, baseAnswers, reflections, demographic);
    expect(result.confidence).toBeGreaterThanOrEqual(0.35);
    expect(result.confidence).toBeLessThanOrEqual(0.95);
  });

  it("deterministic fallback is product-grade, not debug text", () => {
    const generic = "Consider improving.";
    const result = runTournament(makeDeterministicResult(), generic, baseAnswers, reflections, demographic);

    expect(result.arbiterVerdict).toBe("deterministic_wins");
    // Deterministic output should reference the user's avoided decision
    expect(result.deterministicOutput).toContain("avoiding");
    // Should contain the score
    expect(result.deterministicOutput).toContain("55%");
    // Should contain domain info
    expect(result.deterministicOutput).toContain("decision");
  });
});
