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
  diffReadings,
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

describe("§3 instrument fields — traceability, uncertainty, carry-forward", () => {
  it("every evidence link traces a finding back to specific inputs", () => {
    const r = computeSignal({ ...base, confidenceLevel: 9, consequenceIfWrong: "IRREVERSIBLE", urgencyBand: "IMMEDIATE" });
    expect(r.evidenceLinks.length).toBeGreaterThanOrEqual(2);
    expect(r.evidenceLinks.every((l) => l.derivedFrom.length > 0)).toBe(true);
    // the contradiction finding is traced
    expect(r.evidenceLinks.some((l) => /contradiction/i.test(l.finding))).toBe(true);
  });
  it("uncertainty separates known, inferred and unknown", () => {
    const r = computeSignal(base);
    expect(r.uncertainty.known.length).toBeGreaterThan(0);
    expect(r.uncertainty.inferred.length).toBeGreaterThan(0);
    expect(r.uncertainty.unknown.length).toBeGreaterThan(0);
  });
  it("carry-forward is empty for the LOW/no-purchase path and populated otherwise", () => {
    const low = computeSignal({ ...base, delayCostBand: "LOW", consequenceIfWrong: "REVERSIBLE", urgencyBand: "LOW", confidenceLevel: 8 });
    expect(low.nextAdmissibleMove.carriesForward).toHaveLength(0); // nothing to carry into a non-purchase
    const high = computeSignal({ ...base, delayCostBand: "HIGH", consequenceIfWrong: "STRUCTURAL", urgencyBand: "HIGH" });
    expect(high.nextAdmissibleMove.carriesForward.length).toBeGreaterThan(0);
  });
  it("the next move carries price/access metadata", () => {
    const mod = computeSignal({ ...base, delayCostBand: "MODERATE", consequenceIfWrong: "COSTLY", urgencyBand: "MODERATE", confidenceLevel: 5 });
    expect(mod.nextAdmissibleMove.accessMode).toBe("self_serve");
    expect(mod.nextAdmissibleMove.price).toMatch(/£/);
  });
});

describe("§8 recommendation identity — stable for stable input, new for changed", () => {
  it("identical input yields the same recommendationId", () => {
    const a = computeSignal(base).nextAdmissibleMove.recommendationId;
    const b = computeSignal({ ...base }).nextAdmissibleMove.recommendationId;
    expect(a).toBe(b);
  });
  it("changed input yields a different recommendationId + a reading diff", () => {
    const before = computeSignal(base);
    const after = computeSignal({ ...base, urgencyBand: "IMMEDIATE", delayCostBand: "CRITICAL", consequenceIfWrong: "IRREVERSIBLE", confidenceLevel: 1 });
    expect(after.nextAdmissibleMove.recommendationId).not.toBe(before.nextAdmissibleMove.recommendationId);
    const d = diffReadings(before, after);
    expect(d.changed).toBe(true);
    expect(d.pressure).not.toBeNull();
  });
  it("diff against no prior reading is not a change", () => {
    expect(diffReadings(null, computeSignal(base)).changed).toBe(false);
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
