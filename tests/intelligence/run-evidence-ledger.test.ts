import { describe, expect, it } from "vitest";import {
  buildRunEvidenceLedgerEntry,
  createProductEvidenceSourceSet,
} from "@/lib/intelligence/run-evidence-ledger";
import {
  evaluateSourceSets,
  type SourceCaptureRecord,
  type SourceSet,
} from "@/lib/intelligence/source-capture-contract";/**
 * A minimal valid source set fixture for tests that need to exercise
 * downstream decision branches (role, evidence strength, authority)
 * without depending on live product-ledger source contents.
 */
const makeValidSourceSet = (): SourceSet => ({
  sourceSetId: "test-valid-source-set",
  label: "Valid test evidence",
  sources: [
    {
      sourceId: "test-valid-source",
      sourceType: "manual_assertion",
      location: "tests/intelligence/run-evidence-ledger.test.ts",
      capturedAt: "2026-06-18T00:00:00.000Z",
      freshness: "fresh",
      applicability: "direct",
    },
  ],
});

describe("run evidence ledger", () => {
  it("requires named source sets", () => {
    const entry = buildRunEvidenceLedgerEntry({
      productId: "team_assessment",
      requestedConfidence: "bounded",
      sourceSets: [],
    });    expect(entry.decision).toBe("blocked_missing_source_sets");
    expect(entry.mayRun).toBe(false);
    expect(entry.sourceSetStatus).toBe("missing");
  });  it("blocks wrapper, derivative, and proof products from originating judgement runs", () => {
    const validSet = makeValidSourceSet();    const wrapperEntry = buildRunEvidenceLedgerEntry({
      productId: "operator_decision_pack",
      requestedConfidence: "bounded",
      sourceSets: [validSet],
    });
    const proofEntry = buildRunEvidenceLedgerEntry({
      productId: "case_dossier_tariff_shock",
      requestedConfidence: "bounded",
      sourceSets: [validSet],
    });
    const derivativeEntry = buildRunEvidenceLedgerEntry({
      productId: "gmi_q2_2026",
      requestedConfidence: "bounded",
      sourceSets: [validSet],
    });    expect(wrapperEntry.decision).toBe("blocked_non_originator_product");
    expect(wrapperEntry.productRunRole).toBe("wrapper");    expect(proofEntry.decision).toBe("blocked_non_originator_product");
    expect(proofEntry.productRunRole).toBe("proof_surface");    expect(derivativeEntry.decision).toBe("blocked_non_originator_product");
    expect(derivativeEntry.productRunRole).toBe("proof_surface");
  });  it("blocks originator runs when product evidence is insufficient", () => {    const entry = buildRunEvidenceLedgerEntry({
      productId: "decision_exposure_instrument",
      requestedConfidence: "bounded",
      sourceSets: [makeValidSourceSet()],
    });    expect(entry.decision).toBe("blocked_insufficient_product_evidence");
    expect(entry.maximumPermittedConfidence).toBe("none");
    expect(entry.mayRun).toBe(false);
  });  it("blocks confident originator runs when authority posture is not cleared", () => {    const entry = buildRunEvidenceLedgerEntry({
      productId: "team_assessment",
      requestedConfidence: "confident",
      sourceSets: [makeValidSourceSet()],
    });    expect(entry.decision).toBe("blocked_authority_not_cleared");
    expect(entry.maximumPermittedConfidence).toBe("bounded");
    expect(entry.mayRun).toBe(false);
  });  it("allows bounded originator runs when product evidence is source-backed and a source set is provided", () => {    const entry = buildRunEvidenceLedgerEntry({
      productId: "fast_diagnostic",
      requestedConfidence: "bounded",
      sourceSets: [makeValidSourceSet()],
    });    expect(entry.decision).toBe("bounded_originator_allowed");
    expect(entry.maximumPermittedConfidence).toBe("bounded");
    expect(entry.mayRun).toBe(true);
    expect(entry.confidentOriginatorAllowed).toBe(false);
  });
});describe("source capture contract", () => {
  const makeSource = (
    overrides: Partial<SourceCaptureRecord> = {},
  ): SourceCaptureRecord => ({
    sourceId: "test-source-001",
    sourceType: "manual_assertion",
    location: "tests/intelligence/run-evidence-ledger.test.ts",
    capturedAt: "2026-06-18T00:00:00.000Z",
    freshness: "fresh",
    applicability: "direct",
    ...overrides,
  });  const makeSet = (
    sources: SourceCaptureRecord[],
    overrides: Partial<SourceSet> = {},
  ): SourceSet => ({
    sourceSetId: "test-set",
    label: "Test Source Set",
    sources,
    ...overrides,
  });  it("blocks provenance when source set is missing", () => {
    const evaluation = evaluateSourceSets([]);
    expect(evaluation.status).toBe("missing");
    expect(evaluation.blockers.length).toBeGreaterThan(0);
    expect(evaluation.blockers[0]).toMatch(/requires at least one named source set/i);
  });  it("blocks provenance when source set is empty", () => {
    const evaluation = evaluateSourceSets([makeSet([])]);
    expect(evaluation.status).toBe("empty");
    expect(evaluation.blockers.length).toBeGreaterThan(0);
    expect(evaluation.blockers[0]).toMatch(/empty/i);
  });  it("represents insufficient evidence via source applicability", () => {
    const sources = [makeSource({ applicability: "insufficient" })];
    const evaluation = evaluateSourceSets([makeSet(sources)]);    expect(evaluation.allSourcesInsufficient).toBe(true);
    expect(evaluation.status).toBe("insufficient");
    expect(evaluation.blockers.length).toBeGreaterThan(0);
    expect(evaluation.blockers.some((b) => /insufficient/i.test(b))).toBe(true);
  });  it("represents stale evidence via source freshness", () => {
    const sources = [makeSource({ freshness: "stale" })];
    const evaluation = evaluateSourceSets([makeSet(sources)]);    expect(evaluation.hasStaleSources).toBe(true);
    expect(evaluation.status).toBe("stale");
    expect(evaluation.blockers.length).toBeGreaterThan(0);
    expect(evaluation.blockers.some((b) => /stale/i.test(b))).toBe(true);
  });  it("represents contradiction-triggering evidence via source applicability", () => {
    const sources = [
      makeSource({ sourceId: "src-a", applicability: "direct" }),
      makeSource({
        sourceId: "src-b",
        applicability: "contradictory",
        contradictsSourceIds: ["src-a"],
      }),
    ];
    const evaluation = evaluateSourceSets([makeSet(sources)]);    expect(evaluation.hasContradictorySources).toBe(true);
    expect(evaluation.status).toBe("contradictory");
    expect(evaluation.blockers.length).toBeGreaterThan(0);
    expect(evaluation.blockers.some((b) => /contradict/i.test(b))).toBe(true);
  });  it("passes valid source sets", () => {
    const sources = [makeSource()];
    const evaluation = evaluateSourceSets([makeSet(sources)]);    expect(evaluation.status).toBe("valid");
    expect(evaluation.blockers).toEqual([]);
    expect(evaluation.hasStaleSources).toBe(false);
    expect(evaluation.hasContradictorySources).toBe(false);
    expect(evaluation.allSourcesInsufficient).toBe(false);
    expect(evaluation.totalSets).toBe(1);
    expect(evaluation.totalSources).toBe(1);
  });
});
