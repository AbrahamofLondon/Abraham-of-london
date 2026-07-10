/**
 * tests/billing/p0-policy-resolution-proof.test.ts
 *
 * P0 acceptance proof for Commercial Activation Convergence, asserted against
 * the REAL catalog product codes (lib/commercial/catalog.ts) and GMI edition
 * registry — not a divergent hand-list. Fails loudly on any drift.
 */
import { describe, it, expect } from "vitest";
import {
  resolveCommercialAccessPolicy,
  resolveAllPolicies,
  validatePolicies,
} from "@/lib/commercial/commercial-access-policy";
import { CATALOG } from "@/lib/commercial/catalog";
import { GMI_EDITION_REGISTRY } from "@/lib/commercial/gmi/gmi-edition-registry";

describe("P0 Policy Resolution Proof (real catalog codes)", () => {
  it("P0.2 — GMI Q2 → SELF_SERVE_CHECKOUT + RELEASE_RECEIPT", () => {
    const p = resolveCommercialAccessPolicy("gmi_q2_2026");
    expect(p).not.toBeNull();
    expect(p!.acquisitionMode).toBe("SELF_SERVE_CHECKOUT");
    expect(p!.prerequisitePolicy).toBe("RELEASE_RECEIPT");
  });

  it("P0.3 — self-serve decision instruments → SELF_SERVE_CHECKOUT + NONE", () => {
    // REAL catalog codes for the self-serve governed instruments.
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
      expect(p!.prerequisitePolicy).not.toBe("INTELLIGENCE_SPINE");
    }
  });

  it("P0.4 — Executive Reporting → ADMISSION_GATED_CHECKOUT + EXECUTIVE_REPORTING_ADMISSION", () => {
    const p = resolveCommercialAccessPolicy("executive_reporting");
    expect(p).not.toBeNull();
    expect(p!.acquisitionMode).toBe("ADMISSION_GATED_CHECKOUT");
    expect(p!.prerequisitePolicy).toBe("EXECUTIVE_REPORTING_ADMISSION");
  });

  it("P0 — personal_decision_audit resolves its explicit policy (paid self-serve)", () => {
    const p = resolveCommercialAccessPolicy("personal_decision_audit");
    expect(p).not.toBeNull();
    expect(p!.acquisitionMode).toBe("SELF_SERVE_CHECKOUT");
    expect(p!.prerequisitePolicy).toBe("NONE");
  });

  it("P0 — GMI Q1 (archived) and Q3 (draft) → no current checkout (ARCHIVE_ONLY)", () => {
    const q1 = resolveCommercialAccessPolicy("gmi_q1_2026");
    const q3 = resolveCommercialAccessPolicy("gmi_q3_2026");
    expect(q1!.acquisitionMode).toBe("ARCHIVE_ONLY");
    expect(q3!.acquisitionMode).toBe("ARCHIVE_ONLY");
  });

  it("P0 COVERAGE — every catalog + GMI product resolves a policy (no null)", () => {
    const codes = [
      ...Object.keys(CATALOG),
      ...GMI_EDITION_REGISTRY.map((e) => e.productCode),
    ];
    const missing = codes.filter((c) => resolveCommercialAccessPolicy(c) === null);
    expect(missing, `products with no policy: ${missing.join(", ")}`).toEqual([]);
  });

  it("P0 COVERAGE — resolveAllPolicies covers the whole catalog", () => {
    const all = resolveAllPolicies();
    expect(all.length).toBeGreaterThanOrEqual(Object.keys(CATALOG).length);
  });

  it("P0 — validatePolicies reports no consistency errors", () => {
    expect(validatePolicies()).toEqual([]);
  });
});
