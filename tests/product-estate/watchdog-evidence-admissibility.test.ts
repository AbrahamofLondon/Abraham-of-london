/**
 * tests/product-estate/watchdog-evidence-admissibility.test.ts
 *
 * §14 hardening: the watchdog must not convert DRAFT GMI into authoritative trigger
 * evidence, and weak proxy evidence must not force a high-stakes review. Only released,
 * verified strong evidence may escalate.
 */

import { describe, it, expect } from "vitest";
import {
  createTrigger,
  evaluateTriggerWithEvidence,
  assessEvidenceAdmissibility,
} from "@/lib/intelligence/accountability/customer-falsification-watchdog";

function trig() {
  return createTrigger({ caseId: "c1", tenantId: "t1", commitment: "hold dual-supplier", statedTrigger: "single supplier for 2 periods", evidenceSource: "gmi_edition", sourceReference: "gmi-q2" });
}

describe("§14 watchdog evidence admissibility", () => {
  it("a DRAFT GMI edition is NOT authoritative trigger evidence (no escalation)", () => {
    const r = evaluateTriggerWithEvidence(trig(), { source: "gmi_edition", claimedStrength: "strong", editionState: "DRAFT" });
    expect(r.admissibility.admissible).toBe(false);
    expect(r.admissibility.admissibleStrength).toBe("none");
    expect(r.newState).toBe("MONITORING"); // did not advance toward review
  });

  it("a CONTROLLED (unreleased) GMI edition is likewise inadmissible", () => {
    expect(assessEvidenceAdmissibility({ source: "gmi_edition", claimedStrength: "strong", editionState: "CONTROLLED" }).admissible).toBe(false);
  });

  it("weak proxy evidence cannot force a high-stakes transition", () => {
    const r = evaluateTriggerWithEvidence(trig(), { source: "external_evidence", claimedStrength: "weak" });
    expect(r.newState).toBe("MONITORING");
    expect(r.admissibility.admissibleStrength).toBe("weak");
  });

  it("unverified 'strong' evidence is capped at moderate (cannot reach trigger)", () => {
    const r = evaluateTriggerWithEvidence(trig(), { source: "external_evidence", claimedStrength: "strong", verified: false });
    expect(r.admissibility.downgraded).toBe(true);
    expect(r.admissibility.admissibleStrength).toBe("moderate");
    expect(r.newState).toBe("EVIDENCE_INSUFFICIENT");
  });

  it("a RELEASED, verified strong signal is admissible and advances the watchdog", () => {
    const r = evaluateTriggerWithEvidence(trig(), { source: "gmi_edition", claimedStrength: "strong", editionState: "RELEASED", verified: true });
    expect(r.admissibility.admissible).toBe(true);
    expect(r.newState).toBe("TRIGGER_APPROACHING");
  });
});
