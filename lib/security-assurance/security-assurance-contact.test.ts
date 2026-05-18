import { describe, expect, it } from "vitest";
import {
  createSecurityAssuranceRequestPayload,
  DEFAULT_SECURITY_ASSURANCE_MATERIAL_ID,
  getSecurityAssuranceSubmissionErrorMessage,
  resolveSecurityAssuranceMaterialId,
} from "./security-assurance-contact";

describe("security assurance contact helpers", () => {
  it("maps contact fields into the request API payload", () => {
    expect(
      createSecurityAssuranceRequestPayload(
        {
          name: "  Ada Lovelace  ",
          email: "  ada@example.com ",
          organisation: " Analytical Engines Ltd ",
          role: " CTO ",
          procurementStage: "security_review",
          message: " Please share the vendor questionnaire. ",
        },
        "vendor-security-questionnaire",
        "token-123",
      ),
    ).toEqual({
      name: "Ada Lovelace",
      email: "ada@example.com",
      organisation: "Analytical Engines Ltd",
      role: "CTO",
      requestedMaterial: "vendor-security-questionnaire",
      procurementStage: "security_review",
      message: "Please share the vendor questionnaire.",
      gRecaptchaToken: "token-123",
    });
  });

  it("falls back to the default material when the requested query id is invalid", () => {
    expect(resolveSecurityAssuranceMaterialId("unknown-material")).toBe(
      DEFAULT_SECURITY_ASSURANCE_MATERIAL_ID,
    );
  });

  it("maps failure classes to distinct buyer-facing messages", () => {
    expect(getSecurityAssuranceSubmissionErrorMessage(400)).toContain(
      "check the request details",
    );
    expect(
      getSecurityAssuranceSubmissionErrorMessage(403, "ERR_RECAPTCHA_FAILED"),
    ).toContain("Security verification failed");
    expect(getSecurityAssuranceSubmissionErrorMessage(429)).toContain(
      "Too many requests",
    );
    expect(
      getSecurityAssuranceSubmissionErrorMessage(
        503,
        "REQUEST_SERVICE_UNAVAILABLE",
      ),
    ).toContain("temporarily unavailable");
  });
});
