/**
 * tests/demo-journey/operator-pilot-qualification.test.ts
 *
 * §6/§7/§20 — the Operator Pilot must NEVER auto-approve, an incomplete intake can
 * never be accepted, low-materiality/unwilling submissions are proportionately declined,
 * and sensitive/confidential cases always route to a human.
 */

import { describe, it, expect } from "vitest";
import { qualifyPilotIntake, type PilotIntake } from "@/lib/engagements/operator-pilot-qualification";

const complete: PilotIntake = {
  organisation: "Meridian Components Ltd",
  role: "COO",
  authorityToEngage: true,
  decisionDomain: "supply chain restructure",
  materiality: "HIGH",
  decisionStage: "FRAMING",
  affectedStakeholders: "operations, finance, two key customers",
  decisionDeadline: "2026-09-30",
  existingEvidence: "supplier lead-time data, two board memos",
  knownContradictions: "cost reduction vs single-supplier concentration",
  governanceSensitivity: "SOME",
  confidentialityRequired: false,
  desiredOutcome: "a governed decision on second-sourcing with a checkpoint",
  willingToParticipateInCheckpoints: true,
  contactEmail: "coo@meridian.example",
};

describe("§6/§7 Operator Pilot qualification — never auto-approves", () => {
  it("no path ever returns autoAccepted true", () => {
    const variants: PilotIntake[] = [
      complete,
      { ...complete, materiality: "CRITICAL" },
      { ...complete, governanceSensitivity: "REGULATED" },
      { ...complete, authorityToEngage: false },
    ];
    for (const v of variants) expect(qualifyPilotIntake(v).autoAccepted).toBe(false);
  });

  it("an incomplete intake is INCOMPLETE and lists missing fields (cannot proceed)", () => {
    const r = qualifyPilotIntake({ ...complete, organisation: "", existingEvidence: "" });
    expect(r.status).toBe("INCOMPLETE");
    expect(r.missingFields).toEqual(expect.arrayContaining(["organisation", "existingEvidence"]));
  });

  it("an invalid email is treated as a missing field", () => {
    expect(qualifyPilotIntake({ ...complete, contactEmail: "not-an-email" }).missingFields).toContain("contactEmail");
  });

  it("low materiality is proportionately UNSUITABLE (we won't run a pilot that isn't warranted)", () => {
    const r = qualifyPilotIntake({ ...complete, materiality: "LOW" });
    expect(r.status).toBe("UNSUITABLE");
    expect(r.nextStep).toMatch(/proportionate|lighter instrument/i);
  });

  it("unwillingness to do checkpoints is UNSUITABLE", () => {
    expect(qualifyPilotIntake({ ...complete, willingToParticipateInCheckpoints: false }).status).toBe("UNSUITABLE");
  });

  it("no authority / still exploring → MORE_INFO_REQUIRED (not accepted)", () => {
    expect(qualifyPilotIntake({ ...complete, authorityToEngage: false }).status).toBe("MORE_INFO_REQUIRED");
    expect(qualifyPilotIntake({ ...complete, decisionStage: "EXPLORING" }).status).toBe("MORE_INFO_REQUIRED");
  });

  it("regulated / confidential always routes to HUMAN_REVIEW_REQUIRED", () => {
    expect(qualifyPilotIntake({ ...complete, governanceSensitivity: "REGULATED" }).status).toBe("HUMAN_REVIEW_REQUIRED");
    expect(qualifyPilotIntake({ ...complete, confidentialityRequired: true }).status).toBe("HUMAN_REVIEW_REQUIRED");
  });

  it("a strong, non-sensitive submission reaches POTENTIALLY_SUITABLE — still a human decision", () => {
    const r = qualifyPilotIntake(complete);
    expect(r.status).toBe("POTENTIALLY_SUITABLE");
    expect(r.nextStep).toMatch(/human decision|not an automatic approval/i);
  });
});
