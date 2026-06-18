import { describe, expect, it } from "vitest";

import {
  buildRunEvidenceLedgerEntry,
  createProductEvidenceSourceSet,
} from "@/lib/intelligence/run-evidence-ledger";

describe("run evidence ledger", () => {
  it("requires named source sets", () => {
    const entry = buildRunEvidenceLedgerEntry({
      productId: "team_assessment",
      requestedConfidence: "bounded",
      sourceSets: [],
    });

    expect(entry.decision).toBe("blocked_missing_source_sets");
    expect(entry.mayRun).toBe(false);
    expect(entry.sourceSetStatus).toBe("missing");
  });

  it("blocks wrapper, derivative, and proof products from originating judgement runs", () => {
    const wrapperSourceSet = createProductEvidenceSourceSet("operator_decision_pack");
    const proofSourceSet = createProductEvidenceSourceSet("case_dossier_tariff_shock");
    const derivativeSourceSet = createProductEvidenceSourceSet("gmi_q2_2026");

    const wrapperEntry = buildRunEvidenceLedgerEntry({
      productId: "operator_decision_pack",
      requestedConfidence: "bounded",
      sourceSets: wrapperSourceSet ? [wrapperSourceSet] : [],
    });
    const proofEntry = buildRunEvidenceLedgerEntry({
      productId: "case_dossier_tariff_shock",
      requestedConfidence: "bounded",
      sourceSets: proofSourceSet ? [proofSourceSet] : [],
    });
    const derivativeEntry = buildRunEvidenceLedgerEntry({
      productId: "gmi_q2_2026",
      requestedConfidence: "bounded",
      sourceSets: derivativeSourceSet ? [derivativeSourceSet] : [],
    });

    expect(wrapperEntry.decision).toBe("blocked_non_originator_product");
    expect(wrapperEntry.productRunRole).toBe("wrapper");

    expect(proofEntry.decision).toBe("blocked_non_originator_product");
    expect(proofEntry.productRunRole).toBe("proof_surface");

    expect(derivativeEntry.decision).toBe("blocked_non_originator_product");
    expect(derivativeEntry.productRunRole).toBe("derivative");
  });

  it("blocks originator runs when product evidence is insufficient", () => {
    const sourceSet = createProductEvidenceSourceSet("decision_exposure_instrument");
    const entry = buildRunEvidenceLedgerEntry({
      productId: "decision_exposure_instrument",
      requestedConfidence: "bounded",
      sourceSets: sourceSet ? [sourceSet] : [],
    });

    expect(entry.decision).toBe("blocked_insufficient_product_evidence");
    expect(entry.maximumPermittedConfidence).toBe("none");
    expect(entry.mayRun).toBe(false);
  });

  it("blocks confident originator runs when authority posture is not cleared", () => {
    const sourceSet = createProductEvidenceSourceSet("team_assessment");
    const entry = buildRunEvidenceLedgerEntry({
      productId: "team_assessment",
      requestedConfidence: "confident",
      sourceSets: sourceSet ? [sourceSet] : [],
    });

    expect(entry.decision).toBe("blocked_authority_not_cleared");
    expect(entry.maximumPermittedConfidence).toBe("bounded");
    expect(entry.mayRun).toBe(false);
  });

  it("allows bounded originator runs when product evidence is source-backed and a source set is provided", () => {
    const sourceSet = createProductEvidenceSourceSet("fast_diagnostic");
    const entry = buildRunEvidenceLedgerEntry({
      productId: "fast_diagnostic",
      requestedConfidence: "bounded",
      sourceSets: sourceSet ? [sourceSet] : [],
    });

    expect(entry.decision).toBe("bounded_originator_allowed");
    expect(entry.maximumPermittedConfidence).toBe("bounded");
    expect(entry.mayRun).toBe(true);
    expect(entry.confidentOriginatorAllowed).toBe(false);
  });
});
