import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { validateGmiCallReviewInput } from "@/lib/intelligence/gmi-persistent-ledger";

describe("GMI persistent call ledger contract", () => {
  it("adds Prisma models and migration tables for ledger entries and status history", () => {
    const schema = fs.readFileSync(path.join(process.cwd(), "prisma/schema.prisma"), "utf8");
    const migration = fs.readFileSync(
      path.join(process.cwd(), "prisma/_archived-migrations-pre-baseline/20260606_add_gmi_persistent_ledger/migration.sql"),
      "utf8",
    );

    expect(schema).toContain("model GmiCallLedgerEntry");
    expect(schema).toContain("model GmiCallLedgerStatusHistory");
    expect(schema).toContain("@@map(\"gmi_call_ledger_entries\")");
    expect(schema).toContain("@@map(\"gmi_call_ledger_status_history\")");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS \"gmi_call_ledger_entries\"");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS \"gmi_call_ledger_status_history\"");
    expect(migration).toContain("FOREIGN KEY (\"ledger_entry_id\")");
  });

  it("requires evidence/source rows for scores other than too early", () => {
    const issues = validateGmiCallReviewInput({
      reportId: "GMI-Q2-2026",
      callId: "GMI-Q1-2026-CALL-001",
      outcomeStatus: "DIRECTIONALLY_CONFIRMED",
      score: 4,
    });

    expect(issues).toContain("Scores 5, 4, 3, 1, and 0 require evidence summary and source rows.");
    expect(issues).toContain("Confirmed, weakly supported, and disconfirmed outcomes require source support.");
  });

  it("requires carry-forward justification and next review date for score 2", () => {
    const issues = validateGmiCallReviewInput({
      reportId: "GMI-Q2-2026",
      callId: "GMI-Q1-2026-CALL-008",
      outcomeStatus: "TOO_EARLY_TO_ASSESS",
      score: 2,
    });

    expect(issues).toContain("Score 2 requires carry-forward justification.");
    expect(issues).toContain("Score 2 requires nextReviewDue.");
  });

  it("accepts a sourced confirmed review and a justified carry-forward review", () => {
    expect(validateGmiCallReviewInput({
      reportId: "GMI-Q2-2026",
      callId: "GMI-Q1-2026-CALL-001",
      outcomeStatus: "DIRECTIONALLY_CONFIRMED",
      score: 4,
      evidenceSummary: "Observed Q2 evidence supports the direction but timing remains imprecise.",
      evidenceSourceRows: ["SRC-IMF-APRIL-2026"],
    })).toEqual([]);

    expect(validateGmiCallReviewInput({
      reportId: "GMI-Q2-2026",
      callId: "GMI-Q1-2026-CALL-008",
      outcomeStatus: "TOO_EARLY_TO_ASSESS",
      score: 2,
      carryForwardJustification: "Review window is Q3 and capital-flow evidence is not mature.",
      nextReviewDue: "2026-09-30",
    })).toEqual([]);
  });
});

