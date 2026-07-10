/**
 * tests/billing/checkout-policy-routed.test.ts
 *
 * P0 source + behaviour proof for policy-routed checkout, asserted against the
 * REAL catalog product codes (lib/commercial/catalog.ts) and GMI edition
 * registry. Fails loudly on any drift.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import {
  resolveCommercialAccessPolicy,
  resolveAllPolicies,
  validatePolicies,
} from "@/lib/commercial/commercial-access-policy";
import { CATALOG } from "@/lib/commercial/catalog";
import { GMI_EDITION_REGISTRY } from "@/lib/commercial/gmi/gmi-edition-registry";

describe("P0.1 — canonical checkout contains no unconditional do-not-sell gate", () => {
  const src = readFileSync(join(process.cwd(), "pages/api/billing/checkout.ts"), "utf8");

  it("does not import or invoke checkDoNotSellGate", () => {
    expect(src).not.toMatch(/checkDoNotSellGate\s*\(/);
    expect(src).not.toMatch(/do-not-sell-gate/);
  });

  it("routes through the commercial access policy + prerequisite evaluator", () => {
    expect(src).toMatch(/resolveCommercialAccessPolicy\s*\(/);
    expect(src).toMatch(/evaluateCommercialPrerequisite\s*\(/);
  });
});

describe("P0.2/3/4 — policy resolution on real catalog codes", () => {
  it("P0.2 GMI Q2 → SELF_SERVE_CHECKOUT + RELEASE_RECEIPT", () => {
    const p = resolveCommercialAccessPolicy("gmi_q2_2026");
    expect(p).not.toBeNull();
    expect(p!.acquisitionMode).toBe("SELF_SERVE_CHECKOUT");
    expect(p!.prerequisitePolicy).toBe("RELEASE_RECEIPT");
  });

  it("P0.3 self-serve decision instruments → SELF_SERVE_CHECKOUT + NONE (never INTELLIGENCE_SPINE)", () => {
    const instruments = [
      "decision_exposure_instrument",
      "team_alignment_gap_map",
      "mandate_clarity_framework",
      "execution_risk_index",
      "intervention_path_selector",
      "escalation_readiness_scorecard",
      "structural_failure_diagnostic_canvas",
      "governance_drift_detector",
      "strategic_priority_stack_builder",
      "board_brief_builder",
    ];
    for (const code of instruments) {
      const p = resolveCommercialAccessPolicy(code);
      expect(p, `policy missing for ${code}`).not.toBeNull();
      expect(p!.acquisitionMode, `${code} acquisitionMode`).toBe("SELF_SERVE_CHECKOUT");
      expect(p!.prerequisitePolicy, `${code} prerequisite`).toBe("NONE");
    }
  });

  it("P0.4 Executive Reporting → ADMISSION_GATED_CHECKOUT + EXECUTIVE_REPORTING_ADMISSION", () => {
    const p = resolveCommercialAccessPolicy("executive_reporting");
    expect(p).not.toBeNull();
    expect(p!.acquisitionMode).toBe("ADMISSION_GATED_CHECKOUT");
    expect(p!.prerequisitePolicy).toBe("EXECUTIVE_REPORTING_ADMISSION");
  });

  it("personal_decision_audit resolves its explicit policy (paid self-serve, NONE)", () => {
    const p = resolveCommercialAccessPolicy("personal_decision_audit");
    expect(p!.acquisitionMode).toBe("SELF_SERVE_CHECKOUT");
    expect(p!.prerequisitePolicy).toBe("NONE");
  });

  it("GMI Q1 (archived) + Q3 (draft) → ARCHIVE_ONLY (no current checkout)", () => {
    expect(resolveCommercialAccessPolicy("gmi_q1_2026")!.acquisitionMode).toBe("ARCHIVE_ONLY");
    expect(resolveCommercialAccessPolicy("gmi_q3_2026")!.acquisitionMode).toBe("ARCHIVE_ONLY");
  });
});

describe("Policy coverage is total (no product 404s for lack of a policy)", () => {
  it("every catalog + GMI product resolves a policy", () => {
    const codes = [
      ...Object.keys(CATALOG),
      ...GMI_EDITION_REGISTRY.map((e) => e.productCode),
    ];
    const missing = codes.filter((c) => resolveCommercialAccessPolicy(c) === null);
    expect(missing, `no policy for: ${missing.join(", ")}`).toEqual([]);
  });

  it("resolveAllPolicies covers the whole catalog and validatePolicies is clean", () => {
    expect(resolveAllPolicies().length).toBeGreaterThanOrEqual(Object.keys(CATALOG).length);
    expect(validatePolicies()).toEqual([]);
  });
});
