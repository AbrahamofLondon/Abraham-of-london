/**
 * tests/demo-journey/pilot-intake-store.test.ts
 *
 * §7/§20 — durable pilot intake: a submission persists, is retrievable by its exact
 * reference (customer status), appears in the operator queue, and its review status can
 * be advanced. A wrong reference returns nothing (no enumeration of others' submissions).
 */

import { describe, it, expect, beforeAll } from "vitest";
import Database from "better-sqlite3";
import { qualifyPilotIntake, type PilotIntake } from "@/lib/engagements/operator-pilot-qualification";
import { _setPilotDbForTest, savePilotIntake, getPilotIntakeByRef, listPilotQueue, updateReviewStatus } from "@/lib/engagements/pilot-intake-store";

const intake: PilotIntake = {
  organisation: "Meridian Components Ltd", role: "COO", authorityToEngage: true, decisionDomain: "supply chain",
  materiality: "HIGH", decisionStage: "FRAMING", affectedStakeholders: "ops, finance", decisionDeadline: "2026-09-30",
  existingEvidence: "lead-time data", knownContradictions: "cost vs concentration", governanceSensitivity: "SOME",
  confidentialityRequired: false, desiredOutcome: "governed decision", willingToParticipateInCheckpoints: true, contactEmail: "coo@meridian.example",
};

beforeAll(() => { _setPilotDbForTest(new Database(":memory:")); });

describe("§7 durable pilot intake store", () => {
  it("persists a submission and returns it by exact reference", () => {
    const q = qualifyPilotIntake(intake);
    const rec = savePilotIntake(intake, q);
    expect(rec.reference).toMatch(/^pilot_/);
    const fetched = getPilotIntakeByRef(rec.reference);
    expect(fetched?.intake.organisation).toBe("Meridian Components Ltd");
    expect(fetched?.reviewStatus).toBe("NEW");
  });

  it("a wrong reference returns nothing (no enumeration)", () => {
    expect(getPilotIntakeByRef("pilot_deadbeef")).toBeNull();
  });

  it("appears in the operator queue and review status can be advanced", () => {
    const rec = savePilotIntake(intake, qualifyPilotIntake(intake));
    expect(listPilotQueue().some((r) => r.reference === rec.reference)).toBe(true);
    const updated = updateReviewStatus(rec.reference, "IN_REVIEW", "reviewer@aol", "checking materiality");
    expect(updated?.reviewStatus).toBe("IN_REVIEW");
    expect(updated?.owner).toBe("reviewer@aol");
  });
});
