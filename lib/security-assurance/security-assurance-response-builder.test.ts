import { describe, it, expect } from "vitest";
import { buildSecurityAssuranceResponse } from "./security-assurance-response-builder";

describe("buildSecurityAssuranceResponse", () => {
  describe("enterprise-assurance-rfi-answer-pack", () => {
    const rfiResponse = buildSecurityAssuranceResponse({
      requestedMaterialId: "enterprise-assurance-rfi-answer-pack",
      requesterName: "Jane Smith",
      organisation: "Acme Corp",
      procurementStage: "security_review",
    });

    it("returns RFI-specific subject", () => {
      expect(rfiResponse.subject).toBe(
        "Enterprise Assurance RFI Pack — Abraham of London",
      );
    });

    it("body includes requester name greeting", () => {
      expect(rfiResponse.body).toContain("Hi Jane,");
    });

    it("body includes organisation", () => {
      expect(rfiResponse.body).toContain("Acme Corp");
    });

    it("body includes procurement stage", () => {
      expect(rfiResponse.body).toContain("security review");
    });

    it("does not claim SOC 2 completion", () => {
      expect(rfiResponse.body).not.toMatch(/SOC 2.*(?<!not yet )complet(?!ion)/i);
      expect(rfiResponse.body).toContain("SOC 2: not yet completed");
    });

    it("does not claim ISO 27001 certification", () => {
      expect(rfiResponse.body).not.toMatch(/ISO 27001.*certif(?!ication: not)/i);
      expect(rfiResponse.body).toContain(
        "ISO 27001 organisational certification: not yet completed",
      );
    });

    it("does not claim penetration testing complete", () => {
      expect(rfiResponse.body).toContain(
        "Independent external penetration testing: not yet completed",
      );
    });

    it("disclosureNotice is present and accurate", () => {
      expect(rfiResponse.disclosureNotice).toBeTruthy();
      expect(rfiResponse.disclosureNotice).not.toContain("SOC 2 certified");
      expect(rfiResponse.disclosureNotice).not.toContain("ISO 27001 certified");
    });

    it("recommendedAttachments includes RFI pack", () => {
      expect(rfiResponse.recommendedAttachments).toContain(
        "enterprise-assurance-rfi-answer-pack",
      );
    });

    it("recommendedAttachments includes public materials", () => {
      expect(rfiResponse.recommendedAttachments).toContain(
        "security-assurance-readiness",
      );
      expect(rfiResponse.recommendedAttachments).toContain(
        "pilot-data-boundary-policy",
      );
    });

    it("requiresReview is true", () => {
      expect(rfiResponse.requiresReview).toBe(true);
    });

    it("requiresNda is false", () => {
      expect(rfiResponse.requiresNda).toBe(false);
    });
  });

  describe("RFI response without optional fields", () => {
    const rfiMinimal = buildSecurityAssuranceResponse({
      requestedMaterialId: "enterprise-assurance-rfi-answer-pack",
    });

    it("returns valid response without name/org/stage", () => {
      expect(rfiMinimal.subject).toBe(
        "Enterprise Assurance RFI Pack — Abraham of London",
      );
      expect(rfiMinimal.body).toContain("Hello,");
    });

    it("still contains assurance boundary note", () => {
      expect(rfiMinimal.body).toContain("not yet completed");
    });
  });

  describe("REQUESTABLE material", () => {
    const response = buildSecurityAssuranceResponse({
      requestedMaterialId: "vendor-security-questionnaire",
      requesterName: "Alex Jones",
    });

    it("returns material-specific subject", () => {
      expect(response.subject).toContain("Vendor Security Questionnaire");
    });

    it("requiresReview is true", () => {
      expect(response.requiresReview).toBe(true);
    });

    it("requiresNda is false", () => {
      expect(response.requiresNda).toBe(false);
    });

    it("body contains assurance boundary note", () => {
      expect(response.body).toContain("not yet completed");
    });
  });

  describe("RESTRICTED material", () => {
    const response = buildSecurityAssuranceResponse({
      requestedMaterialId: "independent-penetration-test-readiness",
      requesterName: "Bob",
    });

    it("requiresNda is true for restricted material", () => {
      expect(response.requiresNda).toBe(true);
    });

    it("body requests NDA before sharing", () => {
      expect(response.body).toContain("NDA");
    });

    it("disclosureNotice mentions NDA requirement", () => {
      expect(response.disclosureNotice).toContain("NDA");
    });
  });

  describe("unknown material id", () => {
    const response = buildSecurityAssuranceResponse({
      requestedMaterialId: "does-not-exist",
    });

    it("returns safe fallback response", () => {
      expect(response.body).toBeTruthy();
      expect(response.subject).toBeTruthy();
    });

    it("requiresReview is true for unknown material (safe default)", () => {
      expect(response.requiresReview).toBe(true);
    });

    it("disclosureNotice flags unrecognised material", () => {
      expect(response.disclosureNotice).toContain("not recognised");
    });
  });

  describe("claim safety invariant", () => {
    const allMaterialIds = [
      "security-assurance-readiness",
      "vendor-security-questionnaire",
      "pilot-data-boundary-policy",
      "incident-response-summary",
      "sub-processor-register",
      "independent-penetration-test-readiness",
      "procurement-security-review-call",
      "enterprise-assurance-rfi-answer-pack",
    ];

    for (const id of allMaterialIds) {
      it(`response for ${id} does not claim SOC 2 / ISO 27001 / pen-test completion`, () => {
        const r = buildSecurityAssuranceResponse({ requestedMaterialId: id });
        // Positive claim patterns that would be a problem:
        expect(r.body).not.toMatch(/we are SOC 2/i);
        expect(r.body).not.toMatch(/SOC 2 certified/i);
        expect(r.body).not.toMatch(/ISO 27001 certified/i);
        expect(r.body).not.toMatch(/penetration.?tested/i);
        expect(r.body).not.toMatch(/externally audited/i);
        expect(r.body).not.toMatch(/regulator.?approved/i);
      });
    }
  });
});
