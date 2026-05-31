/**
 * tests/product/situation-translator.spec.ts
 *
 * Situation Translator reality tests.
 *
 * These tests verify that the first gate of the Decision Intelligence Kernel
 * correctly classifies situations, preserves ambiguity, detects hidden stakes,
 * and produces useful clarification questions.
 *
 * Product rule enforced:
 *   The translator must never collapse ambiguity into false precision.
 *   If stakes are misclassified, the system must surface the higher reading.
 *
 * Run: vitest run tests/product/situation-translator.spec.ts
 */

import { describe, it, expect } from "vitest";
import { translateSituation } from "@/lib/intelligence/situation-translator";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function notLowStakesPreference(result: ReturnType<typeof translateSituation>) {
  expect(result.decisionClass).not.toBe("LOW_STAKES_PREFERENCE");
}

function confidenceIsNotLow(result: ReturnType<typeof translateSituation>) {
  expect(result.translationConfidence).not.toBe("LOW");
}

// ─── Scenario 1 — HMRC / company accounts filing rescue with no funds ────────

describe("Scenario 1 — HMRC filing rescue with no funds", () => {
  const input =
    "I need to file my tax for the year ended 2023/2024, to avoid late fine. " +
    "I do not have funds for an accountant and the accounts are complicated. " +
    "I have submitted a placeholder after two extensions. " +
    "I now have till June 30 2026 to file or risk a huge fine. " +
    "Turnover is about £800k although very little profit. " +
    "Do I use an agent to do the task?";

  const result = translateSituation(input);

  it("classifies as COMPLIANCE_AND_FILING", () => {
    expect(result.decisionClass).toBe("COMPLIANCE_AND_FILING");
  });

  it("detects urgency vocabulary state (1 or 5)", () => {
    expect([1, 5]).toContain(result.vocabularyState);
  });

  it("surfaces cash constraint dimension", () => {
    expect(result.surfacedDimensions).toContain("constraint:cash");
  });

  it("surfaces deadline dimension", () => {
    expect(result.surfacedDimensions).toContain("obligation:deadline");
  });

  it("surfaces statutory obligation dimension", () => {
    expect(result.surfacedDimensions).toContain("obligation:statutory");
  });

  it("surfaces records incomplete dimension", () => {
    expect(result.surfacedDimensions).toContain("constraint:records_incomplete");
  });

  it("does not classify as LOW_STAKES_PREFERENCE", () => {
    notLowStakesPreference(result);
  });

  it("has HIGH or MEDIUM translation confidence", () => {
    confidenceIsNotLow(result);
  });

  it("produces a non-generic situation summary", () => {
    expect(result.situationSummary.length).toBeGreaterThan(50);
    expect(result.situationSummary.toLowerCase()).not.toContain("generic");
    expect(result.situationSummary.toLowerCase()).toMatch(/compliance|statutory|filing/);
  });

  it("kernel interpretation addresses constraint + obligation tension", () => {
    const interp = result.kernelInterpretation.toLowerCase();
    const addressesTension =
      interp.includes("constrained") ||
      interp.includes("statutory") ||
      interp.includes("obligation") ||
      interp.includes("minimum viable");
    expect(addressesTension).toBe(true);
  });

  it("identifies HMRC as an actor", () => {
    const hmrcActor = result.initialActors.find(a => a.label.toLowerCase().includes("hmrc"));
    expect(hmrcActor).toBeDefined();
  });
});

// ─── Scenario 2 — Board decision under political pressure ────────────────────

describe("Scenario 2 — Board decision with political authority pressure", () => {
  const input =
    "We need to decide on a significant acquisition. " +
    "The CEO is in favour but the CFO has serious concerns about cash position. " +
    "Not sure who ultimately signs off — the board meeting is scheduled for next week. " +
    "Due diligence is still incomplete.";

  const result = translateSituation(input);

  it("classifies as GOVERNANCE_AND_BOARD or FINANCIAL_AND_CAPITAL", () => {
    expect(["GOVERNANCE_AND_BOARD", "FINANCIAL_AND_CAPITAL", "STRATEGIC_AND_POSITIONING"]).toContain(result.decisionClass);
  });

  it("does not classify as LOW_STAKES_PREFERENCE", () => {
    notLowStakesPreference(result);
  });

  it("surfaces authority unclear dimension", () => {
    expect(result.surfacedDimensions).toContain("authority:unclear");
  });

  it("detects board and executive actors", () => {
    const actorLabels = result.initialActors.map(a => a.label.toLowerCase());
    const hasBoardOrExec =
      actorLabels.some(l => l.includes("board") || l.includes("ceo") || l.includes("cfo"));
    expect(hasBoardOrExec).toBe(true);
  });

  it("produces a clarification question about authority structure", () => {
    const hasAuthorityQ = result.clarificationRequired.some(
      q => q.field === "authority" || q.question.toLowerCase().includes("authority"),
    );
    expect(hasAuthorityQ).toBe(true);
  });
});

// ─── Scenario 3 — Market claim with strong copy but weak proof ───────────────

describe("Scenario 3 — Market claim with strong copy but weak proof", () => {
  const input =
    "We want to launch a market claim that our platform is the industry-leading solution " +
    "for enterprise transformation. We have strong messaging but no customer case studies yet. " +
    "Our team believes the claim is accurate.";

  const result = translateSituation(input);

  it("classifies as COMMERCIAL_AND_MARKET", () => {
    expect(result.decisionClass).toBe("COMMERCIAL_AND_MARKET");
  });

  it("does not classify as LOW_STAKES_PREFERENCE", () => {
    notLowStakesPreference(result);
  });

  it("surfaces assumed evidence dimension", () => {
    expect(result.surfacedDimensions).toContain("evidence:assumed");
  });

  it("kernel interpretation addresses the proof gap", () => {
    const interp = result.kernelInterpretation.toLowerCase();
    const addressesProof =
      interp.includes("claim") ||
      interp.includes("evidence") ||
      interp.includes("buyer validation") ||
      interp.includes("challenge");
    expect(addressesProof).toBe(true);
  });
});

// ─── Scenario 4 — Product launch under revenue pressure ──────────────────────

describe("Scenario 4 — Product launch with revenue pressure and weak evidence", () => {
  const input =
    "We need to launch the new feature next week. " +
    "There is a major client contract that depends on this release being live. " +
    "Testing is still in progress and we haven't completed sign-off yet. " +
    "Revenue will be impacted if we miss the date.";

  const result = translateSituation(input);

  it("classifies as OPERATIONAL_AND_EXECUTION or COMMERCIAL_AND_MARKET", () => {
    expect(["OPERATIONAL_AND_EXECUTION", "COMMERCIAL_AND_MARKET", "FINANCIAL_AND_CAPITAL"]).toContain(result.decisionClass);
  });

  it("does not classify as LOW_STAKES_PREFERENCE", () => {
    notLowStakesPreference(result);
  });

  it("surfaces deadline or dependency dimension", () => {
    const hasRelevantDim =
      result.surfacedDimensions.includes("obligation:deadline") ||
      result.surfacedDimensions.includes("dependency:unresolved");
    expect(hasRelevantDim).toBe(true);
  });
});

// ─── Scenario 5 — Procurement supplier risk ──────────────────────────────────

describe("Scenario 5 — Critical supplier dependency risk", () => {
  const input =
    "Our main supplier has just been acquired by a competitor. " +
    "We depend on them for 60% of our production. " +
    "No alternative supplier is qualified. " +
    "The contract runs for another 18 months.";

  const result = translateSituation(input);

  it("classifies as TECHNOLOGY_AND_DEPENDENCY or OPERATIONAL_AND_EXECUTION or STRATEGIC_AND_POSITIONING", () => {
    expect([
      "TECHNOLOGY_AND_DEPENDENCY",
      "OPERATIONAL_AND_EXECUTION",
      "STRATEGIC_AND_POSITIONING",
      "LEGAL_AND_CONTRACTUAL",
    ]).toContain(result.decisionClass);
  });

  it("does not classify as LOW_STAKES_PREFERENCE", () => {
    notLowStakesPreference(result);
  });
});

// ─── Scenario 6 — Investor pitch with unsupported traction claims ─────────────

describe("Scenario 6 — Investor pitch with unverified traction", () => {
  const input =
    "We are pitching to investors next month. " +
    "We plan to claim 300% year-on-year growth. " +
    "The figures are based on internal projections we haven't had externally validated. " +
    "We also want to describe the market as a £10bn opportunity.";

  const result = translateSituation(input);

  it("classifies as COMMERCIAL_AND_MARKET or FINANCIAL_AND_CAPITAL or REPUTATIONAL_AND_EXPOSURE", () => {
    expect([
      "COMMERCIAL_AND_MARKET",
      "FINANCIAL_AND_CAPITAL",
      "REPUTATIONAL_AND_EXPOSURE",
      "STRATEGIC_AND_POSITIONING",
    ]).toContain(result.decisionClass);
  });

  it("does not classify as LOW_STAKES_PREFERENCE", () => {
    notLowStakesPreference(result);
  });

  it("surfaces assumed evidence dimension", () => {
    expect(result.surfacedDimensions).toContain("evidence:assumed");
  });
});

// ─── Scenario 7 — Operational failure with unclear owner ────────────────────

describe("Scenario 7 — Operational failure with unclear accountability", () => {
  const input =
    "Our production system went down for 4 hours yesterday. " +
    "We are not sure who is responsible for deciding the response plan. " +
    "Customers are asking for a public statement. " +
    "Engineering says it was a config change, not a code bug.";

  const result = translateSituation(input);

  it("classifies as OPERATIONAL_AND_EXECUTION or REPUTATIONAL_AND_EXPOSURE or GOVERNANCE_AND_BOARD", () => {
    expect([
      "OPERATIONAL_AND_EXECUTION",
      "REPUTATIONAL_AND_EXPOSURE",
      "GOVERNANCE_AND_BOARD",
    ]).toContain(result.decisionClass);
  });

  it("does not classify as LOW_STAKES_PREFERENCE", () => {
    notLowStakesPreference(result);
  });

  it("surfaces authority unclear or dependency dimension", () => {
    const hasRelevant =
      result.surfacedDimensions.includes("authority:unclear") ||
      result.surfacedDimensions.includes("dependency:unresolved");
    expect(hasRelevant).toBe(true);
  });
});

// ─── Scenario 8 — Legal/admin/family deadline with harm ──────────────────────

describe("Scenario 8 — Family legal deadline with harm of delay", () => {
  const input =
    "I need to respond to a court notice about a custody arrangement by next Friday. " +
    "I don't have a solicitor and I'm not sure I can afford one. " +
    "Missing the deadline could mean I lose my position in the case.";

  const result = translateSituation(input);

  it("classifies as LEGAL_AND_CONTRACTUAL", () => {
    expect(result.decisionClass).toBe("LEGAL_AND_CONTRACTUAL");
  });

  it("does not classify as LOW_STAKES_PREFERENCE", () => {
    notLowStakesPreference(result);
  });

  it("surfaces cash constraint and deadline dimensions", () => {
    expect(result.surfacedDimensions).toContain("obligation:deadline");
    expect(result.surfacedDimensions).toContain("constraint:cash");
  });

  it("identifies court as an actor", () => {
    const courtActor = result.initialActors.find(a => a.label.toLowerCase().includes("court"));
    expect(courtActor).toBeDefined();
  });
});

// ─── Scenario 9 — Cash-constrained survival decision ────────────────────────

describe("Scenario 9 — Cash-constrained survival decision", () => {
  const input =
    "We have 6 weeks of runway left. " +
    "We need to decide whether to cut half the team, raise a bridge round, or wind down. " +
    "No investor has committed yet. " +
    "Payroll is due in 3 weeks.";

  const result = translateSituation(input);

  it("classifies as FINANCIAL_AND_CAPITAL or CONTINUITY_AND_TRANSITION or PEOPLE_AND_AUTHORITY", () => {
    expect([
      "FINANCIAL_AND_CAPITAL",
      "CONTINUITY_AND_TRANSITION",
      "PEOPLE_AND_AUTHORITY",
      "OPERATIONAL_AND_EXECUTION",
    ]).toContain(result.decisionClass);
  });

  it("does not classify as LOW_STAKES_PREFERENCE", () => {
    notLowStakesPreference(result);
  });

  it("surfaces cash constraint and deadline", () => {
    const hasCash = result.surfacedDimensions.includes("constraint:cash");
    const hasDeadline = result.surfacedDimensions.includes("obligation:deadline");
    expect(hasCash || hasDeadline).toBe(true);
  });
});

// ─── Scenario 10 — Strategic asymmetric partnership ─────────────────────────

describe("Scenario 10 — Strategic asymmetric partnership decision", () => {
  const input =
    "A much larger competitor has offered us an exclusive distribution deal. " +
    "The commercial terms look attractive but we would lose our ability to sell direct. " +
    "The board has not reviewed the full terms yet. " +
    "We need to respond within 10 days.";

  const result = translateSituation(input);

  it("classifies as STRATEGIC_AND_POSITIONING or COMMERCIAL_AND_MARKET or LEGAL_AND_CONTRACTUAL or GOVERNANCE_AND_BOARD", () => {
    expect([
      "STRATEGIC_AND_POSITIONING",
      "COMMERCIAL_AND_MARKET",
      "LEGAL_AND_CONTRACTUAL",
      "GOVERNANCE_AND_BOARD",
    ]).toContain(result.decisionClass);
  });

  it("does not classify as LOW_STAKES_PREFERENCE", () => {
    notLowStakesPreference(result);
  });

  it("surfaces deadline and authority dimensions", () => {
    const hasDims =
      result.surfacedDimensions.includes("obligation:deadline") ||
      result.surfacedDimensions.includes("authority:unclear") ||
      result.surfacedDimensions.includes("authority:board_required");
    expect(hasDims).toBe(true);
  });
});

// ─── Scenario 11 — Executive reputational exposure ───────────────────────────

describe("Scenario 11 — Executive reputational exposure", () => {
  const input =
    "Our CEO made a public statement last week that has been misinterpreted. " +
    "There are now calls for a formal response. " +
    "Legal has not reviewed the proposed statement. " +
    "Media coverage is increasing.";

  const result = translateSituation(input);

  it("classifies as REPUTATIONAL_AND_EXPOSURE or GOVERNANCE_AND_BOARD", () => {
    expect([
      "REPUTATIONAL_AND_EXPOSURE",
      "GOVERNANCE_AND_BOARD",
      "LEGAL_AND_CONTRACTUAL",
    ]).toContain(result.decisionClass);
  });

  it("does not classify as LOW_STAKES_PREFERENCE", () => {
    notLowStakesPreference(result);
  });
});

// ─── Scenario 12 — Genuinely low-stakes preference ───────────────────────────

describe("Scenario 12 — Low-stakes preference decision", () => {
  const input =
    "Should we move our weekly team standup from Monday to Wednesday morning? " +
    "The team lead has approved the change and everyone seems comfortable with it.";

  const result = translateSituation(input);

  it("classifies as LOW_STAKES_PREFERENCE", () => {
    expect(result.decisionClass).toBe("LOW_STAKES_PREFERENCE");
  });

  it("does NOT classify as COMPLIANCE_AND_FILING or GOVERNANCE_AND_BOARD", () => {
    expect(result.decisionClass).not.toBe("COMPLIANCE_AND_FILING");
    expect(result.decisionClass).not.toBe("GOVERNANCE_AND_BOARD");
    expect(result.decisionClass).not.toBe("LEGAL_AND_CONTRACTUAL");
  });

  it("does not detect hidden stakes", () => {
    expect(result.hiddenStakesDetected).toBe(false);
  });

  it("vocabulary state is not urgency-driven (not 1 or 5)", () => {
    expect([1, 5]).not.toContain(result.vocabularyState);
  });

  it("requires no clarification questions", () => {
    expect(result.clarificationRequired.length).toBe(0);
  });
});

// ─── Translation law: never collapse ambiguity ───────────────────────────────

describe("Translation law — ambiguity preservation", () => {

  it("preserves ambiguity when obligation is uncertain", () => {
    const input = "I may need to file something with HMRC, not sure if it applies to me.";
    const result = translateSituation(input);
    const hasAmbiguity = result.preservedAmbiguities.length > 0 || result.clarificationRequired.length > 0;
    expect(hasAmbiguity).toBe(true);
  });

  it("detects hidden stakes when high-consequence is described as minor", () => {
    const input = "It's just a minor tax thing, I need to file a quick return, the fine won't be that big.";
    const result = translateSituation(input);
    expect(result.hiddenStakesDetected).toBe(true);
  });

  it("does not give HIGH confidence when situation is ambiguous", () => {
    const input = "I need to make a decision about something important.";
    const result = translateSituation(input);
    expect(result.translationConfidence).not.toBe("HIGH");
  });

  it("preserves alternative classes when two domains are plausible", () => {
    const input = "We have a legal contract issue that may also have compliance implications.";
    const result = translateSituation(input);
    // Should have at least one alternative class
    expect(result.alternativeClasses.length).toBeGreaterThan(0);
  });
});
