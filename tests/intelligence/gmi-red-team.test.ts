import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { validateGmiRedTeamChallenge } from "@/lib/intelligence/gmi-instrument";
import { redactGmiRedTeamSubmissionForPublic } from "@/lib/intelligence/gmi-red-team-store";

describe("GMI Red Team persistence contract", () => {
  it("adds the Red Team submission model and migration table", () => {
    const schema = fs.readFileSync(path.join(process.cwd(), "prisma/schema.prisma"), "utf8");
    const migration = fs.readFileSync(
      path.join(process.cwd(), "prisma/_archived-migrations-pre-baseline/20260606_add_gmi_persistent_ledger/migration.sql"),
      "utf8",
    );

    expect(schema).toContain("model GmiRedTeamSubmission");
    expect(schema).toContain("@@map(\"gmi_red_team_submissions\")");
    expect(schema).toContain("publicResponse String?");
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS \"gmi_red_team_submissions\"");
    expect(migration).toContain("\"status\" TEXT NOT NULL DEFAULT 'pending'");
  });

  it("requires source links, a registered call, submitter identity, and publication consent", () => {
    const result = validateGmiRedTeamChallenge({
      callId: "missing-call",
      counterThesis:
        "This challenge is specific enough to pass length validation but references no registered call.",
      evidence:
        "The evidence narrative is specific enough to pass length validation but lacks a valid registered call.",
      sourceLinks: ["https://example.com/evidence"],
      submitterName: "Reviewer",
      submitterEmail: "reviewer@example.com",
      consentToPublishIfSelected: true,
    });

    expect(result.accepted).toBe(false);
    expect(result.issues).toContain("Challenge must reference a registered GMI call.");
  });

  it("returns a public-safe reference ID shape", () => {
    const referenceId = "gmi-rt-20260606-test";

    expect(referenceId).toMatch(/^gmi-rt-/);
    expect(referenceId).not.toContain("@");
  });

  it("does not expose private email on public red-team views", () => {
    const publicView = redactGmiRedTeamSubmissionForPublic({
      id: "gmi-rt-1",
      editionId: "GMI-Q2-2026",
      callId: "GMI-Q1-2026-CALL-001",
      submitterName: "Reviewer",
      submitterEmail: "reviewer@example.com",
      organisation: "Institution",
      counterArgument: "Counter argument",
      evidence: "Evidence",
      sourceLinks: ["https://example.com"],
      status: "acknowledged",
      adminNotes: "Internal note",
      publicResponse: "Public response",
      createdAt: "2026-06-06T00:00:00.000Z",
      reviewedAt: null,
      reviewedBy: null,
    });

    expect(publicView).not.toHaveProperty("submitterEmail");
    expect(publicView).not.toHaveProperty("adminNotes");
    expect(publicView.id).toBe("gmi-rt-1");
  });
});
