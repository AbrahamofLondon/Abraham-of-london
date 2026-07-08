/**
 * tests/demo-journey/pilot-intake-store.test.ts
 *
 * Durable Pilot lifecycle: exact-reference customer lookup, operator queue, replay safety,
 * customer-safe status, private status secret, and human-authority transition controls.
 */

import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { qualifyPilotIntake, type PilotIntake } from "@/lib/engagements/operator-pilot-qualification";
import { _setPilotDbForTest, savePilotIntake, getPilotIntakeByRef, getPilotIntakeByStatusSecret, listPilotQueue, transitionPilotState, toCustomerStatus } from "@/lib/engagements/pilot-intake-store";

const intake: PilotIntake = {
  organisation: "Meridian Components Ltd", role: "COO", authorityToEngage: true, decisionDomain: "supply chain",
  materiality: "HIGH", decisionStage: "FRAMING", affectedStakeholders: "ops, finance", decisionDeadline: "2026-09-30",
  existingEvidence: "lead-time data and supplier concentration memo with operating exposure", knownContradictions: "cost vs concentration", governanceSensitivity: "SOME",
  confidentialityRequired: false, desiredOutcome: "governed decision", willingToParticipateInCheckpoints: true, contactEmail: "coo@meridian.example",
};

beforeEach(() => { _setPilotDbForTest(new Database(":memory:")); });

describe("Operator Pilot lifecycle store", () => {
  it("persists a submission with high-entropy reference and returns it by exact reference", () => {
    const rec = savePilotIntake(intake, qualifyPilotIntake(intake));
    expect(rec.reference).toMatch(/^pilot_[a-f0-9]{32}$/);
    expect(getPilotIntakeByRef(rec.reference)?.intake.organisation).toBe("Meridian Components Ltd");
    expect(getPilotIntakeByRef("pilot_deadbeef")).toBeNull();
  });

  it("deduplicates exact replayed submissions instead of creating multiple active intakes", () => {
    const q = qualifyPilotIntake(intake);
    const a = savePilotIntake(intake, q);
    const b = savePilotIntake(intake, q);
    expect(b.reference).toBe(a.reference);
    expect(listPilotQueue()).toHaveLength(1);
  });

  it("appears in the operator queue with status, ageing, evidence posture and next operation", () => {
    const rec = savePilotIntake(intake, qualifyPilotIntake(intake), "2026-07-07T00:00:00.000Z");
    const row = listPilotQueue().find((r) => r.reference === rec.reference)!;
    expect(row.reviewStatus).toBe("POTENTIALLY_SUITABLE");
    expect(row.evidencePosture).toBe("DETAILED");
    expect(row.nextOperation).toMatch(/Human authority/i);
    expect(row.ageHours).toBeGreaterThanOrEqual(0);
  });

  it("issues a private status secret and validates status access without URL references", () => {
    const rec = savePilotIntake(intake, qualifyPilotIntake(intake));
    expect(rec.statusSecret).toMatch(/^pstat_[a-f0-9]{64}$/);
    expect(rec.statusSecretHash).toMatch(/^[a-f0-9]{64}$/);
    expect(rec.statusSecretHash).not.toContain(rec.statusSecret!);
    expect(getPilotIntakeByStatusSecret(rec.statusSecret!, { ip: "203.0.113.9" })?.reference).toBe(rec.reference);
    expect(getPilotIntakeByStatusSecret("pilot_bad_reference", { ip: "203.0.113.9" })).toBeNull();
  });

  it("customer status does not expose operator owner or notes", () => {
    const rec = savePilotIntake({ ...intake, authorityToEngage: false }, qualifyPilotIntake({ ...intake, authorityToEngage: false }));
    const status = toCustomerStatus(rec);
    expect(status.currentState).toBe("MORE_INFORMATION_REQUIRED");
    expect(JSON.stringify(status)).not.toMatch(/operatorNote|owner|lead-time data/i);
    expect(status.requestedInformation).toMatch(/Authority/i);
  });

  it("requires valid lifecycle order and human authority for final decisions", () => {
    const rec = savePilotIntake(intake, qualifyPilotIntake(intake));
    expect(() => transitionPilotState(rec.reference, "SCOPING", { email: "ops@aol", humanAuthority: true })).toThrow(/Illegal/);
    expect(() => transitionPilotState(rec.reference, "ACCEPTED", { email: "ops@aol", humanAuthority: false })).toThrow(/Human authority/);
    const accepted = transitionPilotState(rec.reference, "ACCEPTED", { email: "ops@aol", humanAuthority: true }, { finalDecision: "Accepted for scoped pilot" });
    expect(accepted?.reviewStatus).toBe("ACCEPTED");
    expect(toCustomerStatus(accepted!).finalDecision).toBe("Accepted for scoped pilot");
  });
});