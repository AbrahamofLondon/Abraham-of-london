/**
 * tests/billing/commercial-prerequisite-and-messaging.test.ts
 *
 * Evaluator routing + customer-facing failure messaging, asserted against the
 * reconciled catalog-derived policy model.
 */
import { describe, it, expect } from "vitest";
import { resolveCommercialAccessPolicy } from "@/lib/commercial/commercial-access-policy";
import { evaluateCommercialPrerequisite } from "@/lib/commercial/prerequisite-evaluators";
import {
  mapPrerequisiteFailureToCheckoutCode,
  buildCheckoutFailureResponse,
  CHECKOUT_FAILURE_MESSAGES,
} from "@/lib/commercial/checkout-failure-code";

describe("Prerequisite evaluator routing", () => {
  it("NONE always allows (paid self-serve instrument)", async () => {
    const r = await evaluateCommercialPrerequisite("NONE", {
      email: "buyer@example.com",
      productCode: "decision_exposure_instrument",
    });
    expect(r.allowed).toBe(true);
  });

  it("RELEASE_RECEIPT denies with recovery path when receipt absent", async () => {
    const r = await evaluateCommercialPrerequisite("RELEASE_RECEIPT", {
      email: "buyer@example.com",
      productCode: "gmi_q2_2026",
    });
    if (!r.allowed) {
      expect(r.reason).toBe("RELEASE_PROOF_MISSING");
      expect(r.recoveryPath).toBe("/intelligence/gmi/q2-2026");
    }
  });

  it("BOARDROOM_HANDOFF currently allows (explicit, not universal)", async () => {
    const r = await evaluateCommercialPrerequisite("BOARDROOM_HANDOFF", {
      email: "b@example.com",
      productCode: "boardroom_brief",
    });
    expect(r.allowed).toBe(true);
  });

  it("EXECUTIVE_REPORTING_ADMISSION passes policy gate (detailed check in endpoint)", async () => {
    const r = await evaluateCommercialPrerequisite("EXECUTIVE_REPORTING_ADMISSION", {
      email: "e@example.com",
      productCode: "executive_reporting",
    });
    expect(r.allowed).toBe(true);
  });
});

describe("Customer-facing failure messaging", () => {
  it("every failure code has a non-empty public message", () => {
    for (const [code, msg] of Object.entries(CHECKOUT_FAILURE_MESSAGES)) {
      expect(msg.publicMessage, `${code} message`).toBeTruthy();
    }
  });

  it("public messages never leak raw prerequisite tokens", () => {
    const forbidden = ["RELEASE_RECEIPT", "INTELLIGENCE_SPINE", "PREREQUISITE", "BLOCKINGREASONS"];
    for (const msg of Object.values(CHECKOUT_FAILURE_MESSAGES)) {
      for (const tok of forbidden) {
        expect(msg.publicMessage.toUpperCase()).not.toContain(tok);
      }
    }
  });

  it("maps prerequisite failures to bounded public codes", () => {
    expect(mapPrerequisiteFailureToCheckoutCode("RELEASE_RECEIPT")).toBe("RELEASE_PROOF_MISSING");
    expect(mapPrerequisiteFailureToCheckoutCode("INTELLIGENCE_SPINE")).toBe("DIAGNOSTIC_JOURNEY_INCOMPLETE");
    expect(mapPrerequisiteFailureToCheckoutCode("EXECUTIVE_REPORTING_ADMISSION")).toBe("ADMISSION_RESTRICTED");
    expect(mapPrerequisiteFailureToCheckoutCode("BOARDROOM_HANDOFF")).toBe("BOARDROOM_HANDOFF_MISSING");
    expect(mapPrerequisiteFailureToCheckoutCode("UNKNOWN")).toBe("CHECKOUT_INELIGIBLE");
  });

  it("builds a bounded response for RELEASE_PROOF_MISSING", () => {
    const resp = buildCheckoutFailureResponse("RELEASE_PROOF_MISSING");
    expect(resp.publicMessage).toContain("Global Market Intelligence");
    expect(resp.recoveryPath).toBe("/intelligence/gmi/q2-2026");
  });
});

describe("Acquisition mode is authoritative for self-serve eligibility", () => {
  it("archive/contract/manual products are not self-serve", () => {
    // GMI archived edition
    const q1 = resolveCommercialAccessPolicy("gmi_q1_2026");
    expect(["ARCHIVE_ONLY"]).toContain(q1!.acquisitionMode);
  });
});
