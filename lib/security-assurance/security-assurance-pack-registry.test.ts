import { describe, it, expect } from "vitest";
import {
  getSecurityAssuranceMaterials,
  getSecurityAssuranceMaterialById,
  getSecurityAssuranceRequestHref,
  isPublicSecurityAssuranceMaterial,
  requiresSecurityAssuranceReview,
  VALID_SECURITY_ASSURANCE_MATERIAL_IDS,
} from "./security-assurance-pack-registry";

describe("security-assurance-pack-registry", () => {
  describe("completeness", () => {
    it("returns all 8 materials", () => {
      expect(getSecurityAssuranceMaterials()).toHaveLength(8);
    });

    it("every material has id, title, description, disclosureLevel", () => {
      for (const m of getSecurityAssuranceMaterials()) {
        expect(m.id).toBeTruthy();
        expect(m.title).toBeTruthy();
        expect(m.description).toBeTruthy();
        expect(["PUBLIC", "REQUESTABLE", "RESTRICTED"]).toContain(
          m.disclosureLevel,
        );
      }
    });

    it("every material has a unique id", () => {
      const ids = getSecurityAssuranceMaterials().map((m) => m.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("does not expose internal document paths in the public registry", () => {
      for (const material of getSecurityAssuranceMaterials()) {
        expect("internalDocPath" in material).toBe(false);
      }
    });
  });

  describe("disclosure constraints", () => {
    it("RESTRICTED materials require review", () => {
      for (const m of getSecurityAssuranceMaterials()) {
        if (m.disclosureLevel === "RESTRICTED") {
          expect(m.requiresReview).toBe(true);
        }
      }
    });

    it("RESTRICTED materials require NDA", () => {
      for (const m of getSecurityAssuranceMaterials()) {
        if (m.disclosureLevel === "RESTRICTED") {
          expect(m.requiresNda).toBe(true);
        }
      }
    });

    it("RESTRICTED materials do not expose publicHref", () => {
      for (const m of getSecurityAssuranceMaterials()) {
        if (m.disclosureLevel === "RESTRICTED") {
          expect(m.publicHref).toBeUndefined();
        }
      }
    });

    it("PUBLIC materials do not require review", () => {
      for (const m of getSecurityAssuranceMaterials()) {
        if (m.disclosureLevel === "PUBLIC") {
          expect(m.requiresReview).toBe(false);
        }
      }
    });
  });

  describe("getSecurityAssuranceMaterialById", () => {
    it("returns material for known id", () => {
      const m = getSecurityAssuranceMaterialById("vendor-security-questionnaire");
      expect(m).not.toBeNull();
      expect(m?.id).toBe("vendor-security-questionnaire");
    });

    it("returns null for unknown id", () => {
      expect(getSecurityAssuranceMaterialById("does-not-exist")).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(getSecurityAssuranceMaterialById("")).toBeNull();
    });
  });

  describe("getSecurityAssuranceRequestHref", () => {
    it("includes the material id in the href", () => {
      const href = getSecurityAssuranceRequestHref("vendor-security-questionnaire");
      expect(href).toContain("vendor-security-questionnaire");
    });

    it("includes type=security-assurance", () => {
      const href = getSecurityAssuranceRequestHref("vendor-security-questionnaire");
      expect(href).toContain("type=security-assurance");
    });

    it("includes requested= param", () => {
      const href = getSecurityAssuranceRequestHref("sub-processor-register");
      expect(href).toContain("requested=sub-processor-register");
    });
  });

  describe("isPublicSecurityAssuranceMaterial", () => {
    it("returns true for PUBLIC materials", () => {
      expect(isPublicSecurityAssuranceMaterial("security-assurance-readiness")).toBe(true);
      expect(isPublicSecurityAssuranceMaterial("pilot-data-boundary-policy")).toBe(true);
    });

    it("returns false for REQUESTABLE materials", () => {
      expect(isPublicSecurityAssuranceMaterial("vendor-security-questionnaire")).toBe(false);
    });

    it("returns false for RESTRICTED materials", () => {
      expect(isPublicSecurityAssuranceMaterial("independent-penetration-test-readiness")).toBe(false);
    });

    it("returns false for unknown id", () => {
      expect(isPublicSecurityAssuranceMaterial("unknown-id")).toBe(false);
    });
  });

  describe("requiresSecurityAssuranceReview", () => {
    it("returns false for PUBLIC materials", () => {
      expect(requiresSecurityAssuranceReview("security-assurance-readiness")).toBe(false);
    });

    it("returns true for REQUESTABLE materials", () => {
      expect(requiresSecurityAssuranceReview("vendor-security-questionnaire")).toBe(true);
    });

    it("returns true for RESTRICTED materials", () => {
      expect(requiresSecurityAssuranceReview("independent-penetration-test-readiness")).toBe(true);
    });

    it("returns true (safe default) for unknown id", () => {
      expect(requiresSecurityAssuranceReview("unknown-id")).toBe(true);
    });
  });

  describe("VALID_SECURITY_ASSURANCE_MATERIAL_IDS", () => {
    it("contains all material ids", () => {
      const ids = getSecurityAssuranceMaterials().map((m) => m.id);
      for (const id of ids) {
        expect(VALID_SECURITY_ASSURANCE_MATERIAL_IDS).toContain(id);
      }
    });
  });

  describe("enterprise-assurance-rfi-answer-pack", () => {
    it("is present in the registry", () => {
      const m = getSecurityAssuranceMaterialById("enterprise-assurance-rfi-answer-pack");
      expect(m).not.toBeNull();
    });

    it("is REQUESTABLE — not public auto-download", () => {
      const m = getSecurityAssuranceMaterialById("enterprise-assurance-rfi-answer-pack");
      expect(m?.disclosureLevel).toBe("REQUESTABLE");
      expect(m?.publicHref).toBeUndefined();
    });

    it("requires operator review before sharing", () => {
      const m = getSecurityAssuranceMaterialById("enterprise-assurance-rfi-answer-pack");
      expect(m?.requiresReview).toBe(true);
    });

    it("does not require NDA (content directs to contract review for sensitive items)", () => {
      const m = getSecurityAssuranceMaterialById("enterprise-assurance-rfi-answer-pack");
      expect(m?.requiresNda).toBe(false);
    });

    it("has a valid request href", () => {
      const href = getSecurityAssuranceRequestHref("enterprise-assurance-rfi-answer-pack");
      expect(href).toContain("requested=enterprise-assurance-rfi-answer-pack");
      expect(href).toContain("type=security-assurance");
    });

    it("isPublicSecurityAssuranceMaterial returns false for RFI pack", () => {
      expect(isPublicSecurityAssuranceMaterial("enterprise-assurance-rfi-answer-pack")).toBe(false);
    });

    it("requiresSecurityAssuranceReview returns true for RFI pack", () => {
      expect(requiresSecurityAssuranceReview("enterprise-assurance-rfi-answer-pack")).toBe(true);
    });
  });
});
