/**
 * tests/product/user-language-interpretation.test.ts
 *
 * Quality tests for the user language interpretation helper.
 *
 * Covers 15 rules:
 * 1. Authority quote + authority diagnostic context → authority interpretation
 * 2. Authority keyword without authority diagnostic context → restrained/medium
 * 3. "The board is meeting next week" must not become an authority gap
 * 4. Evidence quote + evidence diagnostic context → evidence-gap interpretation
 * 5. Consequence quote + consequence context → consequence-risk interpretation
 * 6. Timing quote → timing pressure only when deadline/urgency signal exists
 * 7. Execution quote → execution-block only when stalled/blocked language exists
 * 8. Obligation quote → obligation only when must/need/required/commitment exists
 * 9. Generic quote with no clear signal → restrained fallback
 * 10. No quotes → no interpretations
 * 11. Generated diagnostic fields are never treated as quotes
 * 12. Maximum 3 interpretations
 * 13. No internal taxonomy keys in serialised output
 * 14. No invented next admissible move if no move is provided
 * 15. Fallback says system cannot yet connect with confidence
 */

import { describe, it, expect } from "vitest";
import { buildUserLanguageInterpretations } from "@/lib/product/user-language-interpretation";

// ─── 1. Authority quote + authority diagnostic context ───────────────────────

describe("authority interpretation", () => {
  it("produces HIGH confidence authority interpretation when quote + context confirm", () => {
    const result = buildUserLanguageInterpretations({
      quotes: ["No one has formally approved the budget yet."],
      primaryFailurePoint: "Authority gap — no decision owner identified",
      governingTension: "Authority is unclear",
    });

    expect(result.length).toBe(1);
    expect(result[0].confidence).toBe("HIGH");
    expect(result[0].interpretation).toContain("authority gap");
  });

  it("produces MEDIUM confidence when authority keyword exists without diagnostic context", () => {
    const result = buildUserLanguageInterpretations({
      quotes: ["We need approval to proceed."],
      primaryFailurePoint: "Execution delay — timeline pressure",
      governingTension: "Timing conflict",
    });

    expect(result.length).toBe(1);
    expect(result[0].confidence).toBe("MEDIUM");
    expect(result[0].interpretation).toContain("authority question");
  });
});

// ─── 2. Authority keyword without authority context → restrained ────────────

describe("authority keyword without context", () => {
  it("does not produce HIGH confidence without diagnostic context", () => {
    const result = buildUserLanguageInterpretations({
      quotes: ["We need approval to proceed."],
    });

    expect(result[0].confidence).not.toBe("HIGH");
  });
});

// ─── 3. Informational stakeholder mention must not become authority gap ──────

describe("informational stakeholder mention", () => {
  it("does not become an authority gap for 'The board is meeting next week'", () => {
    const result = buildUserLanguageInterpretations({
      quotes: ["The board is meeting next week."],
    });

    expect(result.length).toBe(1);
    // Should be LOW confidence, not an authority gap
    expect(result[0].confidence).toBe("LOW");
    expect(result[0].interpretation).toContain("stakeholder");
    expect(result[0].interpretation).not.toContain("authority gap");
  });

  it("does not become an authority gap for 'The CEO mentioned this in passing'", () => {
    const result = buildUserLanguageInterpretations({
      quotes: ["The CEO mentioned this in passing."],
    });

    expect(result[0].confidence).toBe("LOW");
    expect(result[0].interpretation).toContain("stakeholder");
    expect(result[0].interpretation).not.toContain("authority gap");
  });
});

// ─── 4. Evidence quote + evidence diagnostic context ─────────────────────────

describe("evidence gap interpretation", () => {
  it("produces HIGH confidence evidence interpretation when quote + context confirm", () => {
    const result = buildUserLanguageInterpretations({
      quotes: ["We're still waiting on the legal review."],
      primaryFailurePoint: "Evidence gap — insufficient data to assess risk",
      governingTension: "Missing information blocks decision",
    });

    expect(result.length).toBe(1);
    expect(result[0].confidence).toBe("HIGH");
    expect(result[0].interpretation).toContain("evidence gap");
  });

  it("produces MEDIUM confidence when evidence keyword exists without context", () => {
    const result = buildUserLanguageInterpretations({
      quotes: ["I'm not sure about the numbers."],
      primaryFailurePoint: "Timing pressure",
    });

    expect(result[0].confidence).toBe("MEDIUM");
    expect(result[0].interpretation).toContain("uncertainty about facts");
  });
});

// ─── 5. Consequence quote + consequence context ──────────────────────────────

describe("consequence interpretation", () => {
  it("produces HIGH confidence consequence interpretation when quote + context confirm", () => {
    const result = buildUserLanguageInterpretations({
      quotes: ["If we delay, we risk losing the deal."],
      consequenceClass: "REVENUE_LOSS",
      primaryFailurePoint: "Consequence of delay is material",
    });

    expect(result.length).toBe(1);
    expect(result[0].confidence).toBe("HIGH");
    expect(result[0].interpretation).toContain("consequence awareness");
    expect(result[0].riskImplication).toContain("revenue loss");
  });

  it("produces MEDIUM confidence when consequence keyword exists without context", () => {
    const result = buildUserLanguageInterpretations({
      quotes: ["This could be expensive."],
    });

    expect(result[0].confidence).toBe("MEDIUM");
    expect(result[0].interpretation).toContain("cost or risk");
  });
});

// ─── 6. Timing quote produces timing pressure ────────────────────────────────

describe("timing interpretation", () => {
  it("produces timing pressure for deadline language", () => {
    const result = buildUserLanguageInterpretations({
      quotes: ["We have a deadline next Friday."],
    });

    expect(result.length).toBe(1);
    expect(result[0].confidence).toBe("MEDIUM");
    expect(result[0].interpretation).toContain("timing pressure");
  });

  it("produces timing pressure for urgent language", () => {
    const result = buildUserLanguageInterpretations({
      quotes: ["This is urgent and needs to be done ASAP."],
    });

    expect(result[0].confidence).toBe("MEDIUM");
    expect(result[0].interpretation).toContain("timing pressure");
  });
});

// ─── 7. Execution quote produces execution-block ─────────────────────────────

describe("execution interpretation", () => {
  it("produces execution block for stuck language", () => {
    const result = buildUserLanguageInterpretations({
      quotes: ["The project is completely stuck."],
    });

    expect(result.length).toBe(1);
    expect(result[0].confidence).toBe("MEDIUM");
    expect(result[0].interpretation).toContain("execution block");
  });

  it("produces execution block for blocked language", () => {
    const result = buildUserLanguageInterpretations({
      quotes: ["We're blocked by legal review."],
    });

    expect(result[0].confidence).toBe("MEDIUM");
    expect(result[0].interpretation).toContain("execution block");
  });
});

// ─── 8. Obligation quote produces obligation interpretation ──────────────────

describe("obligation interpretation", () => {
  it("produces obligation interpretation for commitment language", () => {
    const result = buildUserLanguageInterpretations({
      quotes: ["We have a contractual obligation to deliver by end of quarter."],
    });

    expect(result.length).toBe(1);
    expect(result[0].confidence).toBe("MEDIUM");
    expect(result[0].interpretation).toContain("obligation");
  });

  it("produces obligation interpretation for required language", () => {
    const result = buildUserLanguageInterpretations({
      quotes: ["I'm required to get board approval first."],
    });

    // This has both authority-seeking and obligation signals
    // Authority-seeking takes priority, but it's MEDIUM without context
    expect(result[0].confidence).toBe("MEDIUM");
  });
});

// ─── 9. Generic quote with no clear signal → restrained fallback ────────────

describe("generic quote fallback", () => {
  it("returns restrained fallback for generic statement", () => {
    const result = buildUserLanguageInterpretations({
      quotes: ["The weather is nice today."],
    });

    expect(result.length).toBe(1);
    expect(result[0].confidence).toBe("LOW");
    expect(result[0].interpretation).toContain("cannot yet connect");
  });

  it("includes situation class in fallback when available", () => {
    const result = buildUserLanguageInterpretations({
      quotes: ["Things are happening."],
      situationClass: "OPERATIONAL_AND_EXECUTION",
    });

    expect(result[0].interpretation).toContain("operational and execution");
  });
});

// ─── 10. No quotes → no interpretations ─────────────────────────────────────

describe("empty quotes", () => {
  it("returns empty array when no quotes provided", () => {
    const result = buildUserLanguageInterpretations({
      quotes: [],
    });

    expect(result.length).toBe(0);
  });

  it("returns empty array when all quotes are empty strings", () => {
    const result = buildUserLanguageInterpretations({
      quotes: ["", "   ", ""],
    });

    expect(result.length).toBe(0);
  });
});

// ─── 11. Generated diagnostic fields are never treated as quotes ─────────────

describe("generated fields not quoted", () => {
  it("does not treat diagnostic fields as quotes", () => {
    // The function only processes the `quotes` array.
    // Diagnostic fields are used for context, not as quotes.
    const result = buildUserLanguageInterpretations({
      quotes: ["User said this."],
      primaryFailurePoint: "This is a generated diagnostic field, not a quote",
      governingTension: "Also generated",
    });

    expect(result.length).toBe(1);
    expect(result[0].quote).toBe("User said this.");
    // The diagnostic fields should not appear as quotes
    expect(result[0].quote).not.toContain("generated diagnostic");
  });
});

// ─── 12. Maximum 3 interpretations ───────────────────────────────────────────

describe("maximum interpretations", () => {
  it("returns at most 3 interpretations", () => {
    const result = buildUserLanguageInterpretations({
      quotes: [
        "First quote about approval.",
        "Second quote about deadline.",
        "Third quote about risk.",
        "Fourth quote that should be excluded.",
        "Fifth quote that should be excluded.",
      ],
    });

    expect(result.length).toBeLessThanOrEqual(3);
  });
});

// ─── 13. No internal taxonomy keys in serialised output ──────────────────────

describe("no internal taxonomy keys", () => {
  it("serialised output contains no raw taxonomy keys", () => {
    const result = buildUserLanguageInterpretations({
      quotes: ["We need approval to proceed."],
      primaryFailurePoint: "Authority gap",
    });

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("obligation:deadline");
    expect(serialized).not.toContain("authority:unclear");
    expect(serialized).not.toContain("constraint:cash");
    expect(serialized).not.toContain("compositeScore");
    expect(serialized).not.toContain("vocabularyState");
  });
});

// ─── 14. No invented next admissible move if no move is provided ─────────────

describe("no invented next move", () => {
  it("does not include nextAdmissibleMove when directionOfMinimumViableMove is not provided", () => {
    const result = buildUserLanguageInterpretations({
      quotes: ["We have a deadline next Friday."],
      // No directionOfMinimumViableMove provided
    });

    // Timing interpretation with no move provided should not have a next move
    expect(result[0].nextAdmissibleMove).toBeUndefined();
  });

  it("includes nextAdmissibleMove when directionOfMinimumViableMove is provided", () => {
    const result = buildUserLanguageInterpretations({
      quotes: ["We have a deadline next Friday."],
      directionOfMinimumViableMove: "Confirm the deadline source.",
    });

    expect(result[0].nextAdmissibleMove).toBeDefined();
    expect(result[0].nextAdmissibleMove).toContain("Confirm");
  });
});

// ─── 15. Fallback says cannot connect with confidence ────────────────────────

describe("fallback language", () => {
  it("fallback says system cannot yet connect with confidence", () => {
    const result = buildUserLanguageInterpretations({
      quotes: ["Something is happening."],
    });

    expect(result[0].interpretation).toContain("cannot yet connect");
    expect(result[0].interpretation).toContain("confidence");
  });
});

// ─── 16. Confidence levels are correct ───────────────────────────────────────

describe("confidence levels", () => {
  it("HIGH only when strong signal + diagnostic context", () => {
    const high = buildUserLanguageInterpretations({
      quotes: ["No one has approved the budget."],
      primaryFailurePoint: "Authority gap",
      governingTension: "Authority is unclear",
    });
    expect(high[0].confidence).toBe("HIGH");

    const medium = buildUserLanguageInterpretations({
      quotes: ["No one has approved the budget."],
      // No authority context
    });
    expect(medium[0].confidence).toBe("MEDIUM");
  });

  it("LOW for informational mentions without diagnostic context", () => {
    const result = buildUserLanguageInterpretations({
      quotes: ["The board meets quarterly."],
    });
    expect(result[0].confidence).toBe("LOW");
  });
});
