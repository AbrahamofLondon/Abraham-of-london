/**
 * tests/demo-journey/decision-signal-engine.test.ts
 *
 * §4/§20 — hostile tests for the flagship-entry Decision Signal engine. Proves the
 * result is input-sensitive (not a fixed polished answer), that validation fails closed
 * on empty/short input, that contradictions in the input are surfaced, and that the
 * engine is willing NOT to recommend the most expensive move when evidence is thin.
 */

import { describe, it, expect } from "vitest";
import {
  runDecisionSignal,
  computeSignal,
  validateSignalInput,
  type SignalInput,
} from "@/lib/decision-instruments/decision-signal-engine";
import { DECISION_SIGNAL_SAMPLES, getSample, SAMPLE_LABEL } from "@/lib/decision-instruments/decision-signal-samples";

const base: SignalInput = { decisionStatement: "Whether to qualify a second supplier now", delayCostBand: "MODERATE", confidenceLevel: 5, consequenceIfWrong: "COSTLY", urgencyBand: "MODERATE" };

describe("§4 Decision Signal engine — validation (fail-closed)", () => {
  it("rejects an empty statement (no result)", () => {
    const r = runDecisionSignal({ ...base, decisionStatement: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("STATEMENT_REQUIRED");
  });
  it("rejects a too-short statement", () => {
    const r = runDecisionSignal({ ...base, decisionStatement: "hire?" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("STATEMENT_TOO_SHORT");
  });
  it("rejects out-of-range confidence", () => {
    expect(validateSignalInput({ ...base, confidenceLevel: 99 })?.code).toBe("CONFIDENCE_OUT_OF_RANGE");
  });
});

describe("§4 Decision Signal engine — input sensitivity (no fixed answer)", () => {
  it("different band inputs produce different pressure", () => {
    const low = computeSignal({ ...base, delayCostBand: "LOW", consequenceIfWrong: "REVERSIBLE", urgencyBand: "LOW", confidenceLevel: 9 });
    const crit = computeSignal({ ...base, delayCostBand: "CRITICAL", consequenceIfWrong: "IRREVERSIBLE", urgencyBand: "IMMEDIATE", confidenceLevel: 1 });
    expect(low.pressureBand).toBe("LOW");
    expect(crit.pressureBand).toBe("CRITICAL");
    expect(low.compositeScore).toBeLessThan(crit.compositeScore);
  });

  it("the statement theme changes the evidence gap (text is not ignored)", () => {
    const people = computeSignal({ ...base, decisionStatement: "Whether to make part of the team redundant this quarter" });
    const capital = computeSignal({ ...base, decisionStatement: "Whether to invest capital to acquire a competitor" });
    expect(people.evidenceGap).not.toBe(capital.evidenceGap);
  });

  it("surfaces a contradiction when confidence is high but stakes are irreversible + urgent", () => {
    const r = computeSignal({ ...base, confidenceLevel: 9, consequenceIfWrong: "IRREVERSIBLE", urgencyBand: "IMMEDIATE" });
    expect(r.contradictions.some((c) => c.key === "confidence_vs_stakes")).toBe(true);
  });

  it("surfaces a contradiction when urgency is immediate but delay cost is low", () => {
    const r = computeSignal({ ...base, urgencyBand: "IMMEDIATE", delayCostBand: "LOW" });
    expect(r.contradictions.some((c) => c.key === "urgency_vs_cost")).toBe(true);
  });
});

describe("§9 Decision Signal engine — willing NOT to up-sell", () => {
  it("low pressure recommends monitoring, and marks paid engagement as not yet admissible", () => {
    const r = computeSignal({ ...base, delayCostBand: "LOW", consequenceIfWrong: "REVERSIBLE", urgencyBand: "LOW", confidenceLevel: 8 });
    expect(r.pressureBand).toBe("LOW");
    expect(r.nextAdmissibleMove.targetRoute).toContain("/decision-instruments/signal");
    expect(r.notYetAdmissible).not.toBeNull();
    expect(r.notYetAdmissible?.whyNotYet).toMatch(/not.*admissible|does not yet/i);
  });

  it("every next move carries an admissibility rationale", () => {
    for (const band of [ ["LOW","REVERSIBLE","LOW"], ["MODERATE","COSTLY","MODERATE"], ["HIGH","STRUCTURAL","HIGH"], ["CRITICAL","IRREVERSIBLE","IMMEDIATE"] ] as const) {
      const r = computeSignal({ ...base, delayCostBand: band[0], consequenceIfWrong: band[1], urgencyBand: band[2], confidenceLevel: 3 });
      expect(r.nextAdmissibleMove.whyAdmissible.length).toBeGreaterThan(20);
    }
  });
});

describe("§5 example samples are real computations of labelled synthetic input", () => {
  it("every sample computes a valid result", () => {
    for (const s of DECISION_SIGNAL_SAMPLES) {
      const r = runDecisionSignal(s.input);
      expect(r.ok).toBe(true);
    }
  });
  it("the sample label is explicitly illustrative", () => {
    expect(SAMPLE_LABEL).toMatch(/illustrative|not based on your organisation/i);
    expect(getSample("supplier-concentration")).not.toBeNull();
  });
});
