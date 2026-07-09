import { describe, expect, it } from "vitest";

import {
  buildProductEvidenceLedger,
  getProductEvidenceLedgerEntry,
} from "@/lib/intelligence/product-evidence-ledger";
import { buildProductIntelligenceClassificationReport } from "@/lib/intelligence/product-intelligence-classification";

describe("product evidence ledger", () => {
  const ledger = buildProductEvidenceLedger();

  it("covers all phase 8B authority-backbone products with explicit ledger states", () => {
    expect(ledger.totalProducts).toBe(43);
    expect(ledger.entries).toHaveLength(43);

    for (const entry of ledger.entries) {
      expect(entry.productId).toBeTruthy();
      expect(entry.productName).toBeTruthy();
      expect(entry.intelligenceClass).toBeTruthy();
      expect(entry.evidenceState).toBeTruthy();
      expect(entry.ledgerStatus).toBeTruthy();
      expect(entry.authorityState).toBeTruthy();
      expect(entry.evidenceLedgerEntryId).toBeTruthy();
      expect(entry.judgementRunPolicy.role).toBe(entry.intelligenceClass);
    }
  });

  it("keeps missing, blocked, and not-applicable ledger states explicit", () => {
    expect(ledger.summary.ledgerStates.real_entry).toBe(0);
    expect(ledger.summary.ledgerStates.missing_entry).toBeGreaterThan(0);
    expect(ledger.summary.ledgerStates.blocked_until_source).toBeGreaterThan(0);
    expect(ledger.summary.ledgerStates.not_applicable).toBeGreaterThan(0);

    const fastDiagnostic = getProductEvidenceLedgerEntry("fast_diagnostic");
    const boardroomBrief = getProductEvidenceLedgerEntry("boardroom_brief");
    const operatorDecisionPack = getProductEvidenceLedgerEntry("operator_decision_pack");

    expect(fastDiagnostic?.ledgerStatus).toBe("missing_entry");
    expect(fastDiagnostic?.evidenceLedgerEntryExists).toBe(false);

    expect(boardroomBrief?.ledgerStatus).toBe("blocked_until_source");
    expect(
      boardroomBrief?.blockReasons.some((reason) => reason.includes("v2 revalidation evidence")),
    ).toBe(true);

    expect(operatorDecisionPack?.ledgerStatus).toBe("not_applicable");
    expect(operatorDecisionPack?.evidenceState).toBe("not_applicable");
  });

  it("does not treat ledger existence as authority clearance", () => {
    const teamAssessment = getProductEvidenceLedgerEntry("team_assessment");

    expect(teamAssessment?.evidenceLedgerEntryExists).toBe(false);
    expect(teamAssessment?.ledgerStatus).toBe("missing_entry");
    expect(teamAssessment?.authorityState).not.toBe("authority_cleared");
    expect(teamAssessment?.publicClaimPermission).toBe(false);
  });

  it("classifies non-originator products explicitly", () => {
    expect(getProductEvidenceLedgerEntry("operator_decision_pack")?.judgementRunPolicy.role).toBe("wrapper");
    expect(getProductEvidenceLedgerEntry("operator_decision_pack")?.judgementRunPolicy.mayOriginateJudgementRuns).toBe(false);

    expect(getProductEvidenceLedgerEntry("case_dossier_tariff_shock")?.judgementRunPolicy.role).toBe("proof_surface");
    expect(getProductEvidenceLedgerEntry("case_dossier_tariff_shock")?.judgementRunPolicy.mayOriginateJudgementRuns).toBe(false);

    expect(getProductEvidenceLedgerEntry("gmi_q2_2026")?.judgementRunPolicy.role).toBe("proof_surface");
    expect(getProductEvidenceLedgerEntry("gmi_q2_2026")?.judgementRunPolicy.mayOriginateJudgementRuns).toBe(false);
  });

  it("consumes the canonical intelligence classification for authority-backbone products", () => {
    const classificationReport = buildProductIntelligenceClassificationReport();
    const ledgerRoleCounts = ledger.summary.runRoles;

    expect(classificationReport.classifiedProductCount).toBeGreaterThanOrEqual(ledger.entries.length);

    for (const entry of ledger.entries) {
      const classification = classificationReport.classifications.find(
        (item) => item.productCode === entry.productId,
      );
      expect(classification?.classification).toBe(entry.intelligenceClass);
      expect(entry.judgementRunPolicy.role).toBe(classification?.classification);
    }

    const expectedLedgerRoleCounts = ledger.entries.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.intelligenceClass] = (acc[entry.intelligenceClass] ?? 0) + 1;
      return acc;
    }, {});
    expect(ledgerRoleCounts).toEqual(expectedLedgerRoleCounts);
  });
});
