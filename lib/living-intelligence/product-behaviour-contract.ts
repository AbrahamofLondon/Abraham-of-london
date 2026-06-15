/**
 * lib/living-intelligence/product-behaviour-contract.ts
 *
 * Defines the observed behaviour of product surfaces.
 * Each behaviour record describes what the code actually does,
 * as distinct from what the product claims to do.
 */

export type BehaviourStatus =
  | "verified_real"       // Confirmed real behaviour with live data
  | "inferred_real"       // Likely real based on code patterns
  | "static_demo"         // Uses static/demo data only
  | "decorative"          // Presentational only, no real logic
  | "not_found"           // Expected behaviour not found in code
  | "needs_review";       // Ambiguous, needs human review

export type BehaviourProbe = {
  id: string;
  domain: string;
  surface: string;
  probe: string;
  whatItChecks: string;
  status: BehaviourStatus;
  evidence: string[];
  evidencePosture: string;
};

export type BehaviourReport = {
  timestamp: string;
  probes: BehaviourProbe[];
  summary: {
    total: number;
    verifiedReal: number;
    inferredReal: number;
    staticDemo: number;
    decorative: number;
    notFound: number;
    needsReview: number;
  };
};
