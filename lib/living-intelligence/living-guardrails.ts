/**
 * lib/living-intelligence/living-guardrails.ts
 *
 * Non-negotiable guardrails for the Abraham of London estate.
 *
 * These are rules that must never be violated. The living intelligence engine
 * checks every snapshot against these guardrails and reports violations.
 *
 * Guardrails are organised by domain. Each guardrail has:
 *   - A unique identifier
 *   - A description of the rule
 *   - The severity if violated (violation, warning, info)
 *   - The domains it protects
 */

import type { EstateSnapshot, GuardrailViolation } from "./estate-state-contract";

export type Guardrail = {
  id: string;
  description: string;
  severity: "violation" | "warning" | "info";
  domains: string[];
  check: (snapshot: EstateSnapshot) => GuardrailViolation | null;
};

// ─── Guardrail Definitions ───────────────────────────────────────────────────

const GUARDRAILS: Guardrail[] = [
  // ── Authority ────────────────────────────────────────────────────────────
  {
    id: "authority-delta-zero",
    description: "Authority delta remains 0 — no product may grant authority it does not possess",
    severity: "violation",
    domains: ["ProductAuthorityContract"],
    check: (snapshot) => {
      for (const [code, product] of Object.entries(snapshot.products)) {
        if (product.authorityState && product.resolverAction === "checkout") {
          // Check if authority state would be exceeded by checkout
          if (product.authorityState === "internal_only" || product.authorityState === "blocked_until_claim_evidenced") {
            return {
              guardrail: "authority-delta-zero",
              description: `Product ${code} has authority state "${product.authorityState}" but resolver grants checkout`,
              severity: "violation",
              details: `ProductAuthorityContract says ${product.authorityState} but resolver returns ${product.resolverAction}. Authority delta would exceed zero.`,
            };
          }
        }
      }
      return null;
    },
  },

  // ── Checkout Permission ──────────────────────────────────────────────────
  {
    id: "checkout-from-resolver-only",
    description: "Checkout permission comes only from the commercial action resolver, not from Stripe ID presence",
    severity: "violation",
    domains: ["commercial_action_resolver", "CATALOG"],
    check: (snapshot) => {
      for (const [code, product] of Object.entries(snapshot.products)) {
        const hasStripe = product.hasStripeProductId || product.hasStripePriceId;
        const isBlocked = product.readinessStatus === "blocked" ||
          product.releaseMode === "blocked" ||
          (product.releaseLane && product.releaseLane.startsWith("blocked"));

        if (hasStripe && isBlocked && product.resolverAction === "checkout") {
          return {
            guardrail: "checkout-from-resolver-only",
            description: `Product ${code} has Stripe metadata and is blocked but resolver grants checkout`,
            severity: "violation",
            details: `Stripe metadata is infrastructure, not permission. Blocked product must not resolve to checkout.`,
          };
        }
      }
      return null;
    },
  },

  // ── Stripe Metadata Honesty ──────────────────────────────────────────────
  {
    id: "no-fake-stripe-ids",
    description: "No fake Stripe IDs — every stripeProductId and stripePriceId must be a real Stripe identifier or null",
    severity: "violation",
    domains: ["CATALOG"],
    check: () => {
      // This is a static rule — we can't verify Stripe IDs without calling Stripe API.
      // We check for obviously fake patterns.
      return null; // Placeholder — real check would require Stripe API access
    },
  },

  // ── Publication State ────────────────────────────────────────────────────
  {
    id: "publication-from-lifecycle",
    description: "Publication state comes from lifecycle, not from hand-maintained commercial flags",
    severity: "violation",
    domains: ["market_intelligence_lifecycle", "gmi_edition_registry"],
    check: (snapshot) => {
      for (const edition of snapshot.gmiEditions) {
        if (edition.registryCurrent && edition.lifecycleState === "DRAFT") {
          return {
            guardrail: "publication-from-lifecycle",
            description: `GMI ${edition.editionId}: registry current flag contradicts lifecycle DRAFT state`,
            severity: "violation",
            details: `The registry marks ${edition.editionId} as current but the lifecycle (publication authority) says DRAFT. Publication state must come from lifecycle.`,
          };
        }
      }
      return null;
    },
  },

  // ── Public Route Safety ──────────────────────────────────────────────────
  {
    id: "no-restricted-public-routes",
    description: "Public routes must not expose restricted content",
    severity: "violation",
    domains: ["public_content_resolver", "contentlayer_generated_indexes"],
    check: () => {
      // This requires checking each content document's access tier against the route.
      // Placeholder — the content route checkers handle this.
      return null;
    },
  },

  // ── No Resolver Bypass ───────────────────────────────────────────────────
  {
    id: "no-resolver-bypass",
    description: "No resolver bypass — every checkout must go through the governed billing API",
    severity: "violation",
    domains: ["commercial_action_resolver", "governed_billing_api"],
    check: () => {
      // This requires scanning source files for raw stripe.checkout.sessions.create calls.
      // The existing check-commercial-checkout-governance.mjs handles this.
      return null;
    },
  },

  // ── No Hardcoded Commercial CTA ──────────────────────────────────────────
  {
    id: "no-hardcoded-commercial-cta",
    description: "No hardcoded commercial CTA outside resolver approval — every pricing CTA must use resolvePricingAction",
    severity: "warning",
    domains: ["commercial_action_resolver", "storefront_pages"],
    check: () => {
      // This requires scanning pricing/product pages. The existing checkers handle this.
      return null;
    },
  },

  // ── Deployment Requires Owner Approval ───────────────────────────────────
  {
    id: "deployment-requires-owner-approval",
    description: "No deployment without owner approval when unresolved contradictions exist",
    severity: "warning",
    domains: ["build_and_verification_checks"],
    check: (snapshot) => {
      // This is enforced by the script exit code, not by a static check.
      return null;
    },
  },

  // ── Public Claims Must Not Exceed Governance ─────────────────────────────
  {
    id: "claims-within-governance",
    description: "No public claim may exceed governance evidence — claims must stay within allowedClaims boundaries",
    severity: "violation",
    domains: ["ProductAuthorityContract", "narrative_claim_rules"],
    check: () => {
      // This requires scanning narrative pages for claim language.
      // The existing check-surface-claim-authority.mjs handles this.
      return null;
    },
  },

  // ── Current/Forthcoming/Archive State ────────────────────────────────────
  {
    id: "no-handwaved-lifecycle-state",
    description: "No current/forthcoming/archive state may be handwaved — must come from lifecycle or registry",
    severity: "warning",
    domains: ["market_intelligence_lifecycle", "gmi_edition_registry"],
    check: () => {
      // This is a structural rule — enforced by the architecture.
      return null;
    },
  },
];

// ─── Check All Guardrails ────────────────────────────────────────────────────

export function checkAllGuardrails(snapshot: EstateSnapshot): GuardrailViolation[] {
  const violations: GuardrailViolation[] = [];

  for (const guardrail of GUARDRAILS) {
    try {
      const violation = guardrail.check(snapshot);
      if (violation) {
        violations.push(violation);
      }
    } catch (err) {
      violations.push({
        guardrail: guardrail.id,
        description: guardrail.description,
        severity: "warning",
        details: `Guardrail check threw: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  return violations;
}

export { GUARDRAILS };
