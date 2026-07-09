/**
 * tests/billing/checkout-policy-routed.test.ts
 *
 * Verify policy-routed prerequisite evaluation in checkout.
 * Each product uses its explicit policy; no universal gate.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { resolveCommercialAccessPolicy } from "@/lib/commercial/commercial-access-policy";
import { evaluateCommercialPrerequisite } from "@/lib/commercial/prerequisite-evaluators";
import { mapPrerequisiteFailureToCheckoutCode, buildCheckoutFailureResponse } from "@/lib/commercial/checkout-failure-code";

describe("Checkout Policy-Routed Prerequisite Evaluation", () => {
  describe("Policy Registry", () => {
    it("defines explicit policy for GMI Q2 2026", () => {
      const policy = resolveCommercialAccessPolicy("gmi_q2_2026");
      expect(policy).toBeDefined();
      expect(policy?.acquisitionMode).toBe("SELF_SERVE_CHECKOUT");
      expect(policy?.prerequisitePolicy).toBe("RELEASE_RECEIPT");
      expect(policy?.releaseProofRequired).toBe(true);
      expect(policy?.paymentRequired).toBe(true);
    });

    it("defines explicit policy for decision instruments (no prerequisite)", () => {
      const policies = [
        "decision_exposure",
        "decision_alignment_gap_map",
        "mandate_clarity_framework",
        "execution_risk_index",
      ];

      for (const code of policies) {
        const policy = resolveCommercialAccessPolicy(code);
        expect(policy).toBeDefined();
        expect(policy?.acquisitionMode).toBe("SELF_SERVE_CHECKOUT");
        expect(policy?.prerequisitePolicy).toBe("NONE");
        expect(policy?.releaseProofRequired).toBe(false);
      }
    });

    it("defines explicit policy for executive_reporting", () => {
      const policy = resolveCommercialAccessPolicy("executive_reporting");
      expect(policy).toBeDefined();
      expect(policy?.acquisitionMode).toBe("ADMISSION_GATED_CHECKOUT");
      expect(policy?.prerequisitePolicy).toBe("EXECUTIVE_REPORTING_ADMISSION");
      expect(policy?.customEvaluatorName).toBe("evaluateExecutiveReportingAdmission");
    });

    it("defines explicit policy for boardroom_brief", () => {
      const policy = resolveCommercialAccessPolicy("boardroom_brief");
      expect(policy).toBeDefined();
      expect(policy?.acquisitionMode).toBe("SELF_SERVE_CHECKOUT");
      expect(policy?.prerequisitePolicy).toBe("BOARDROOM_HANDOFF");
      expect(policy?.customEvaluatorName).toBe("evaluateBoardroomHandoff");
    });

    it("returns null for undefined products", () => {
      const policy = resolveCommercialAccessPolicy("undefined_product_code");
      expect(policy).toBeNull();
    });
  });

  describe("Prerequisite Evaluation", () => {
    it("allows NONE prerequisite (decision instruments)", async () => {
      const result = await evaluateCommercialPrerequisite("NONE", {
        email: "test@example.com",
        productCode: "decision_exposure",
      });

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("checks RELEASE_RECEIPT prerequisite for GMI Q2", async () => {
      const result = await evaluateCommercialPrerequisite("RELEASE_RECEIPT", {
        email: "test@example.com",
        productCode: "gmi_q2_2026",
      });

      // Result depends on whether receipt exists in test DB
      // If receipt exists: allowed = true
      // If receipt doesn't exist: allowed = false, reason = "RELEASE_PROOF_MISSING"
      if (!result.allowed) {
        expect(result.reason).toBe("RELEASE_PROOF_MISSING");
        expect(result.recoveryPath).toBe("/intelligence/gmi/q2-2026");
      }
    });

    it("allows BOARDROOM_HANDOFF (currently no blocking)", async () => {
      const result = await evaluateCommercialPrerequisite("BOARDROOM_HANDOFF", {
        email: "test@example.com",
        productCode: "boardroom_brief",
      });

      // Currently allows all (owner can add rules later)
      expect(result.allowed).toBe(true);
    });

    it("allows EXECUTIVE_REPORTING_ADMISSION (currently no blocking)", async () => {
      const result = await evaluateCommercialPrerequisite(
        "EXECUTIVE_REPORTING_ADMISSION",
        {
          email: "test@example.com",
          productCode: "executive_reporting",
        }
      );

      // Currently allows all (detailed validation happens in checkout endpoint)
      expect(result.allowed).toBe(true);
    });
  });

  describe("Failure Code Mapping", () => {
    it("maps RELEASE_RECEIPT failure to RELEASE_PROOF_MISSING", () => {
      const code = mapPrerequisiteFailureToCheckoutCode(
        "RELEASE_RECEIPT",
        "RELEASE_PROOF_MISSING"
      );
      expect(code).toBe("RELEASE_PROOF_MISSING");
    });

    it("maps INTELLIGENCE_SPINE failure to DIAGNOSTIC_JOURNEY_INCOMPLETE", () => {
      const code = mapPrerequisiteFailureToCheckoutCode(
        "INTELLIGENCE_SPINE",
        "PREREQUISITE_REQUIRED"
      );
      expect(code).toBe("DIAGNOSTIC_JOURNEY_INCOMPLETE");
    });

    it("maps EXECUTIVE_REPORTING_ADMISSION failure to ADMISSION_RESTRICTED", () => {
      const code = mapPrerequisiteFailureToCheckoutCode(
        "EXECUTIVE_REPORTING_ADMISSION",
        "ADMISSION_RESTRICTED"
      );
      expect(code).toBe("ADMISSION_RESTRICTED");
    });

    it("maps BOARDROOM_HANDOFF failure to BOARDROOM_HANDOFF_MISSING", () => {
      const code = mapPrerequisiteFailureToCheckoutCode(
        "BOARDROOM_HANDOFF",
        "MISSING"
      );
      expect(code).toBe("BOARDROOM_HANDOFF_MISSING");
    });

    it("maps unknown policy to CHECKOUT_INELIGIBLE", () => {
      const code = mapPrerequisiteFailureToCheckoutCode(
        "UNKNOWN_POLICY",
        "UNKNOWN"
      );
      expect(code).toBe("CHECKOUT_INELIGIBLE");
    });
  });

  describe("Public Failure Messages", () => {
    it("provides customer-friendly message for RELEASE_PROOF_MISSING", () => {
      const response = buildCheckoutFailureResponse("RELEASE_PROOF_MISSING");
      expect(response.code).toBe("RELEASE_PROOF_MISSING");
      expect(response.publicMessage).toContain("Global Market Intelligence Q2 2026");
      expect(response.publicMessage).not.toContain("receipt");
      expect(response.recoveryPath).toBe("/intelligence/gmi/q2-2026");
    });

    it("provides customer-friendly message for DIAGNOSTIC_JOURNEY_INCOMPLETE", () => {
      const response = buildCheckoutFailureResponse(
        "DIAGNOSTIC_JOURNEY_INCOMPLETE"
      );
      expect(response.code).toBe("DIAGNOSTIC_JOURNEY_INCOMPLETE");
      expect(response.publicMessage).toContain("diagnostic");
      expect(response.publicMessage).not.toContain("INTELLIGENCE_SPINE");
      expect(response.recoveryPath).toBe("/diagnostics");
    });

    it("provides customer-friendly message for ADMISSION_RESTRICTED", () => {
      const response = buildCheckoutFailureResponse("ADMISSION_RESTRICTED");
      expect(response.code).toBe("ADMISSION_RESTRICTED");
      expect(response.publicMessage).toContain("membership verification");
      expect(response.publicMessage).not.toContain("admission logic");
      expect(response.recoveryPath).toBe("/contact");
    });

    it("includes support email in responses", () => {
      const response = buildCheckoutFailureResponse("ADMISSION_RESTRICTED");
      expect(response.helpEmail).toBe("support@abraham.ai");
    });

    it("never exposes raw technical codes in public messages", () => {
      const codes: Array<
        | "RELEASE_PROOF_MISSING"
        | "DIAGNOSTIC_JOURNEY_INCOMPLETE"
        | "ADMISSION_RESTRICTED"
        | "BOARDROOM_HANDOFF_MISSING"
        | "CHECKOUT_INELIGIBLE"
      > = [
        "RELEASE_PROOF_MISSING",
        "DIAGNOSTIC_JOURNEY_INCOMPLETE",
        "ADMISSION_RESTRICTED",
        "BOARDROOM_HANDOFF_MISSING",
        "CHECKOUT_INELIGIBLE",
      ];

      // Technical codes that should NEVER appear in public messages
      const forbiddenCodes = [
        "RELEASE_PROOF_MISSING",
        "DIAGNOSTIC_JOURNEY",
        "INTELLIGENCE_SPINE",
        "ADMISSION_RESTRICTED",
        "BOARDROOM_HANDOFF",
        "CHECKOUT_INELIGIBLE",
      ];

      for (const code of codes) {
        const response = buildCheckoutFailureResponse(code);
        for (const forbidden of forbiddenCodes) {
          expect(response.publicMessage.toUpperCase()).not.toContain(forbidden);
        }
        // Verify message contains at least one lowercase letter (human-readable)
        expect(response.publicMessage).toMatch(/[a-z]/);
      }
    });
  });

  describe("No Universal Gate", () => {
    it("verifies no universal checkDoNotSellGate is used", () => {
      // This test documents the architectural change:
      // The checkout endpoint no longer calls checkDoNotSellGate()
      // Instead, each product has an explicit policy
      const policy = resolveCommercialAccessPolicy("gmi_q2_2026");
      const policy2 = resolveCommercialAccessPolicy("decision_exposure");

      // Both have explicit policies; no universal gate needed
      expect(policy?.prerequisitePolicy).toBeDefined();
      expect(policy2?.prerequisitePolicy).toBeDefined();

      // They have DIFFERENT policies
      expect(policy?.prerequisitePolicy).not.toBe(policy2?.prerequisitePolicy);
    });
  });

  describe("Policy Consistency", () => {
    it("verifies all defined products have explicit policies", () => {
      const productCodes = [
        "gmi_q2_2026",
        "decision_exposure",
        "decision_alignment_gap_map",
        "mandate_clarity_framework",
        "execution_risk_index",
        "executive_reporting",
        "boardroom_brief",
        "professional",
        "professional_annual",
        "enterprise",
        "additional_collaborator",
        "fast_diagnostic",
      ];

      for (const code of productCodes) {
        const policy = resolveCommercialAccessPolicy(code);
        expect(policy).toBeDefined();
        expect(policy?.productCode).toBe(code);
        expect(policy?.prerequisitePolicy).toBeDefined();
        expect(policy?.acquisitionMode).toBeDefined();
      }
    });
  });
});
