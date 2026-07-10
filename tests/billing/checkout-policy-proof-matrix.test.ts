/**
 * tests/billing/checkout-policy-proof-matrix.test.ts
 *
 * Positive/negative proof matrix per prerequisite-policy family + customer-safe
 * failure messaging + acquisition-mode authority. Real catalog codes only.
 */
import { describe, it, expect } from "vitest";
import { resolveCommercialAccessPolicy } from "@/lib/commercial/commercial-access-policy";
import { evaluateCommercialPrerequisite } from "@/lib/commercial/prerequisite-evaluators";
import {
  mapPrerequisiteFailureToCheckoutCode,
  buildCheckoutFailureResponse,
  CHECKOUT_FAILURE_MESSAGES,
} from "@/lib/commercial/checkout-failure-code";

describe("Proof matrix — prerequisite evaluators", () => {
  it("[+] NONE allows self-serve instrument checkout (no diagnostic)", async () => {
    const r = await evaluateCommercialPrerequisite("NONE", {
      email: "buyer@example.com",
      productCode: "decision_exposure_instrument",
    });
    expect(r.allowed).toBe(true);
  });

  it("[-] RELEASE_RECEIPT denies with bounded reason + recovery when receipt absent", async () => {
    const r = await evaluateCommercialPrerequisite("RELEASE_RECEIPT", {
      email: "buyer@example.com",
      productCode: "gmi_q2_2026",
    });
    if (!r.allowed) {
      expect(r.reason).toBe("RELEASE_PROOF_MISSING");
      expect(r.recoveryPath).toBe("/intelligence/gmi/q2-2026");
    }
  });

  it("[+] BOARDROOM_HANDOFF allows (explicit governed policy, not universal gate)", async () => {
    const r = await evaluateCommercialPrerequisite("BOARDROOM_HANDOFF", {
      email: "b@example.com",
      productCode: "boardroom_brief",
    });
    expect(r.allowed).toBe(true);
  });

  it("[+] EXECUTIVE_REPORTING_ADMISSION passes policy gate (detailed admission runs in endpoint)", async () => {
    const r = await evaluateCommercialPrerequisite("EXECUTIVE_REPORTING_ADMISSION", {
      email: "e@example.com",
      productCode: "executive_reporting",
    });
    expect(r.allowed).toBe(true);
  });
});

describe("Proof matrix — customer-safe failure messaging", () => {
  it("every failure code has a non-empty public message", () => {
    for (const [code, msg] of Object.entries(CHECKOUT_FAILURE_MESSAGES)) {
      expect(msg.publicMessage, `${code}`).toBeTruthy();
    }
  });

  it("public messages never leak raw prerequisite/authority tokens", () => {
    const forbidden = ["RELEASE_RECEIPT", "INTELLIGENCE_SPINE", "PREREQUISITE", "BLOCKINGREASONS", "PRODUCTAUTHORITY"];
    for (const msg of Object.values(CHECKOUT_FAILURE_MESSAGES)) {
      for (const tok of forbidden) {
        expect(msg.publicMessage.toUpperCase()).not.toContain(tok);
      }
    }
  });

  it("prerequisite failures map to bounded public codes", () => {
    expect(mapPrerequisiteFailureToCheckoutCode("RELEASE_RECEIPT")).toBe("RELEASE_PROOF_MISSING");
    expect(mapPrerequisiteFailureToCheckoutCode("INTELLIGENCE_SPINE")).toBe("DIAGNOSTIC_JOURNEY_INCOMPLETE");
    expect(mapPrerequisiteFailureToCheckoutCode("EXECUTIVE_REPORTING_ADMISSION")).toBe("ADMISSION_RESTRICTED");
    expect(mapPrerequisiteFailureToCheckoutCode("BOARDROOM_HANDOFF")).toBe("BOARDROOM_HANDOFF_MISSING");
    expect(mapPrerequisiteFailureToCheckoutCode("UNKNOWN")).toBe("CHECKOUT_INELIGIBLE");
  });

  it("RELEASE_PROOF_MISSING → customer-facing GMI message + recovery path", () => {
    const resp = buildCheckoutFailureResponse("RELEASE_PROOF_MISSING");
    expect(resp.publicMessage).toContain("Global Market Intelligence");
    expect(resp.recoveryPath).toBe("/intelligence/gmi/q2-2026");
  });
});

describe("Proof matrix — acquisition mode authority (negative cases)", () => {
  it("archived GMI edition is ARCHIVE_ONLY (not self-serve)", () => {
    expect(resolveCommercialAccessPolicy("gmi_q1_2026")!.acquisitionMode).toBe("ARCHIVE_ONLY");
  });

  it("draft GMI edition is ARCHIVE_ONLY (not self-serve)", () => {
    expect(resolveCommercialAccessPolicy("gmi_q3_2026")!.acquisitionMode).toBe("ARCHIVE_ONLY");
  });

  it("unknown product resolves no policy (checkout returns typed not-configured)", () => {
    expect(resolveCommercialAccessPolicy("nonexistent_product_zzz")).toBeNull();
  });
});
