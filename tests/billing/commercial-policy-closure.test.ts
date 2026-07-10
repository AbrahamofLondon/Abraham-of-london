/**
 * tests/billing/commercial-policy-closure.test.ts
 *
 * Regression tests for the seven pre-merge policy-closure defects.
 * Evaluators are exercised with injected dependencies (no live DB).
 * Endpoint customer-safety (issues 6/9/10/11) is proven by source assertion,
 * consistent with the estate's checkout test convention.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import {
  resolveCommercialAccessPolicy,
  validatePolicies,
} from "@/lib/commercial/commercial-access-policy";
import {
  evaluateReleaseReceiptPrerequisite,
  evaluateIntelligenceSpinePrerequisite,
  evaluateBoardroomHandoff,
} from "@/lib/commercial/prerequisite-evaluators";

const checkoutSrc = readFileSync(join(process.cwd(), "pages/api/billing/checkout.ts"), "utf8");

// ── Issue 1: terminal states dominate overrides ──────────────────────────────
describe("Issue 1 — terminal commercial state dominates explicit override", () => {
  it("executive_reporting_priority is inactive → ARCHIVE_ONLY despite ADMISSION override", () => {
    const p = resolveCommercialAccessPolicy("executive_reporting_priority");
    expect(p).not.toBeNull();
    expect(p!.acquisitionMode).toBe("ARCHIVE_ONLY");
    expect(p!.prerequisitePolicy).toBe("NONE");
    expect(p!.paymentRequired).toBe(false);
    expect(p!.publicSurfaceAllowed).toBe(false);
  });

  it("other inactive/retired/dormant/internal_only products resolve ARCHIVE_ONLY", () => {
    for (const code of ["operator_essentials_pack", "command_pack", "governance_suite", "diagnostic_report_basic"]) {
      const p = resolveCommercialAccessPolicy(code);
      expect(p!.acquisitionMode, code).toBe("ARCHIVE_ONLY");
    }
  });
});

// ── Issue 3: admission is policy-driven, not hard-coded to one code ───────────
describe("Issue 3 — Executive Reporting admission is policy-driven", () => {
  it("active executive_reporting resolves ADMISSION_GATED + admission prerequisite", () => {
    const p = resolveCommercialAccessPolicy("executive_reporting");
    expect(p!.acquisitionMode).toBe("ADMISSION_GATED_CHECKOUT");
    expect(p!.prerequisitePolicy).toBe("EXECUTIVE_REPORTING_ADMISSION");
  });

  it("checkout gates admission on the policy prerequisite, not code === 'executive_reporting'", () => {
    expect(checkoutSrc).toMatch(/prerequisitePolicy === "EXECUTIVE_REPORTING_ADMISSION"/);
    expect(checkoutSrc).not.toMatch(/code === "executive_reporting"\)/);
  });
});

// ── Issue 2: BOARDROOM_HANDOFF performs real validation ──────────────────────
describe("Issue 2 — Boardroom handoff is a real gate", () => {
  it("missing handoff → denied with recovery", async () => {
    const r = await evaluateBoardroomHandoff({ email: "a@b.com", productCode: "boardroom_brief" });
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("BOARDROOM_HANDOFF_MISSING");
    expect(r.recoveryPath).toBeTruthy();
  });

  it("invalid handoff → denied", async () => {
    const r = await evaluateBoardroomHandoff(
      { email: "a@b.com", productCode: "boardroom_brief", handoffId: "bh_deadbeef" },
      { isHandoffValid: async () => false },
    );
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("BOARDROOM_HANDOFF_MISSING");
  });

  it("valid handoff → allowed", async () => {
    const r = await evaluateBoardroomHandoff(
      { email: "a@b.com", productCode: "boardroom_brief", handoffId: "bh_valid" },
      { isHandoffValid: async () => true },
    );
    expect(r.allowed).toBe(true);
  });
});

// ── Issue 4: INTELLIGENCE_SPINE is a real evidence lookup ────────────────────
describe("Issue 4 — evidence-gated prerequisite performs a real lookup", () => {
  it("with qualifying evidence → allowed", async () => {
    const r = await evaluateIntelligenceSpinePrerequisite(
      { email: "has@evidence.com", productCode: "boardroom_mode" },
      { hasQualifyingEvidence: async () => true },
    );
    expect(r.allowed).toBe(true);
  });

  it("without evidence → denied with recovery path", async () => {
    const r = await evaluateIntelligenceSpinePrerequisite(
      { email: "no@evidence.com", productCode: "boardroom_mode" },
      { hasQualifyingEvidence: async () => false },
    );
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("DIAGNOSTIC_JOURNEY_INCOMPLETE");
    expect(r.recoveryPath).toBe("/diagnostics");
  });
});

// ── Issue 5/7/8: registry-derived receipt resolution (no hard-coded Q2) ───────
describe("Issue 5 — GMI receipt mapping is registry-derived", () => {
  it("current edition (gmi_q2_2026) resolves its editionId dynamically and allows when receipt present", async () => {
    const requested: string[] = [];
    const r = await evaluateReleaseReceiptPrerequisite(
      { email: "a@b.com", productCode: "gmi_q2_2026" },
      { getReceiptForEdition: async (id) => { requested.push(id); return { id: "rcpt" }; } },
    );
    expect(requested).toEqual(["GMI-Q2-2026"]);
    expect(r.allowed).toBe(true);
  });

  it("a different edition (gmi_q3_2026) resolves GMI-Q3-2026 — proves no hard-coded Q2", async () => {
    const requested: string[] = [];
    await evaluateReleaseReceiptPrerequisite(
      { email: "a@b.com", productCode: "gmi_q3_2026" },
      { getReceiptForEdition: async (id) => { requested.push(id); return null; } },
    );
    expect(requested).toEqual(["GMI-Q3-2026"]);
  });

  it("missing receipt → denied with edition-slug recovery path", async () => {
    const r = await evaluateReleaseReceiptPrerequisite(
      { email: "a@b.com", productCode: "gmi_q2_2026" },
      { getReceiptForEdition: async () => null },
    );
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("RELEASE_PROOF_MISSING");
    expect(r.recoveryPath).toBe("/intelligence/gmi/q2-2026");
  });

  it("non-GMI product resolves no edition mapping", async () => {
    const r = await evaluateReleaseReceiptPrerequisite(
      { email: "a@b.com", productCode: "decision_exposure_instrument" },
      { getReceiptForEdition: async () => ({ id: "x" }) },
    );
    expect(r.allowed).toBe(false);
    expect(r.reason).toBe("NO_EDITION_MAPPING");
  });
});

// ── Issue 7: strengthened validatePolicies ───────────────────────────────────
describe("Issue 7 — validatePolicies enforces estate-wide consistency", () => {
  it("the real catalog + GMI registry pass all consistency rules", () => {
    expect(validatePolicies()).toEqual([]);
  });
});

// ── Issue 6/9/10/11: every public checkout failure is typed & customer-safe ───
// Internal detail is permitted in server-side logging (console.*), but must NOT
// appear in the response payload. We assert against the source with console.*
// lines stripped, so only response-shaping code is examined.
describe("Issue 6 — checkout failures are typed customer-safe responses", () => {
  const responseSrc = checkoutSrc
    .split("\n")
    .filter((l) => !l.trim().startsWith("console."))
    .join("\n");

  it("governance block returns typed code, hides internal state/detail from the response", () => {
    expect(responseSrc).toMatch(/CHECKOUT_BLOCKED_BY_GOVERNANCE/);
    expect(responseSrc).toMatch(/buildCheckoutFailureResponse\("CHECKOUT_BLOCKED_BY_GOVERNANCE"/);
    expect(responseSrc).not.toMatch(/state: action\.state/);
    expect(responseSrc).not.toMatch(/detail: action\.reason/);
  });

  it("eligibility failure returns typed code, hides raw eligibility.reason from the response", () => {
    expect(responseSrc).not.toMatch(/reason: eligibility\.reason/);
    expect(responseSrc).toMatch(/buildCheckoutFailureResponse\("CHECKOUT_INELIGIBLE"/);
  });

  it("admission failure returns typed code, hides reasons/missingEvidence from the response", () => {
    expect(responseSrc).not.toMatch(/reasons: erAdmission\.reasons/);
    expect(responseSrc).not.toMatch(/missingEvidence: erAdmission\.missingEvidence/);
    expect(responseSrc).toMatch(/buildCheckoutFailureResponse\("ADMISSION_RESTRICTED"/);
  });

  it("GMI receipt-missing returns typed code; editionId only in Stripe metadata, not the error body", () => {
    expect(responseSrc).toMatch(/buildCheckoutFailureResponse\("RELEASE_PROOF_MISSING"/);
    // Scope to the receipt-missing branch: from its typed-failure build to the
    // end of its res.status(409).json(...) call. editionId must not appear there.
    const branch = responseSrc.match(
      /buildCheckoutFailureResponse\("RELEASE_PROOF_MISSING", code\);[\s\S]*?res\.status\(409\)\.json\([\s\S]*?\}\);/,
    );
    expect(branch, "receipt-missing branch not found").not.toBeNull();
    expect(branch![0]).not.toMatch(/editionId/);
  });
});
