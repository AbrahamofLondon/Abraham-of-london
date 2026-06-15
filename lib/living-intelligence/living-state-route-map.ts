/**
 * lib/living-intelligence/living-state-route-map.ts
 *
 * Route resolution for the Living State Object layer.
 *
 * A "repair route" is the operator/admin surface where a blocker can actually be
 * resolved (verify evidence, request consent, generate artifact, review draft…).
 * The engine treats a repair route as REAL only if it appears in the set of
 * routes the app actually exposes. A blocker that needs a repair route but has
 * none — or names one that does not exist — is itself surfaced as a blocker
 * (missing_repair_path / route_missing). The system never pretends a repair path
 * exists when it does not.
 */

import type {
  LivingStateBlockerCode,
  LivingStateDomain,
} from "@/lib/living-intelligence/living-state-object-contract";

/** Normalise a route for comparison (strip query/hash, trailing slash, lower). */
export function normaliseRoute(route: string): string {
  const withoutQuery = route.split("?")[0]?.split("#")[0] ?? route;
  const trimmed = withoutQuery.trim().replace(/\/+$/, "");
  return (trimmed === "" ? "/" : trimmed).toLowerCase();
}

/**
 * Does `route` exist among the available routes? Matches exact and dynamic
 * segments: an available route of `/admin/boardroom/orders/[id]` satisfies a
 * concrete `/admin/boardroom/orders/abc123`.
 */
export function routeExists(route: string, availableRoutes: string[]): boolean {
  const target = normaliseRoute(route);
  for (const candidate of availableRoutes) {
    const known = normaliseRoute(candidate);
    if (known === target) return true;
    if (matchesDynamic(known, target)) return true;
    if (matchesDynamic(target, known)) return true;
  }
  return false;
}

function matchesDynamic(pattern: string, concrete: string): boolean {
  if (!pattern.includes("[")) return false;
  const patternParts = pattern.split("/");
  const concreteParts = concrete.split("/");
  if (patternParts.length !== concreteParts.length) return false;
  for (let i = 0; i < patternParts.length; i += 1) {
    const p = patternParts[i] ?? "";
    const c = concreteParts[i] ?? "";
    const isDynamic = p.startsWith("[") && p.endsWith("]");
    if (isDynamic) {
      if (c === "") return false;
      continue;
    }
    if (p !== c) return false;
  }
  return true;
}

/**
 * Canonical repair surface for a given (domain, blocker). These are the routes
 * the estate SHOULD expose to resolve a class of blocker. The engine checks each
 * against availableRoutes; if the route is absent, the blocker is escalated as a
 * missing repair path rather than silently linked to a dead route.
 */
const REPAIR_ROUTE_MAP: Partial<
  Record<LivingStateDomain, Partial<Record<LivingStateBlockerCode, string>>>
> = {
  boardroom: {
    missing_evidence: "/admin/boardroom/orders/[id]",
    unverified_evidence: "/admin/boardroom/orders/[id]",
    verification_not_allowed: "/admin/boardroom/orders/[id]",
    pending_consent: "/admin/boardroom/orders/[id]",
    missing_consent: "/admin/boardroom/orders/[id]",
    missing_artifact: "/admin/boardroom/orders/[id]",
    stub_artifact_only: "/admin/boardroom/orders/[id]",
    draft_without_review_path: "/admin/boardroom/orders/[id]",
    publication_not_allowed: "/admin/boardroom/orders/[id]",
    fulfilment_incomplete: "/admin/fulfilment",
    paid_without_fulfilment: "/admin/fulfilment",
  },
  fulfilment: {
    fulfilment_incomplete: "/admin/fulfilment",
    paid_without_fulfilment: "/admin/fulfilment",
    delivery_claim_without_artifact: "/admin/fulfilment",
    missing_artifact: "/admin/fulfilment",
  },
  gmi: {
    publication_not_allowed: "/admin/living-state",
    lifecycle_conflict: "/admin/living-state",
    missing_artifact: "/admin/living-state",
    source_of_truth_conflict: "/admin/living-state",
  },
  content: {
    publication_not_allowed: "/admin/living-state",
    route_missing: "/admin/living-state",
    missing_evidence: "/admin/living-state",
  },
  retainer_oversight: {
    missing_operator_action: "/admin/retainer-oversight",
    owner_decision_required: "/admin/retainer-oversight",
  },
};

/**
 * Resolve the canonical repair route for a (domain, blocker), if one is defined
 * AND it exists in the app. Returns:
 *   - { route }            when a real repair surface exists
 *   - { route, missing }   when a repair surface is defined but absent from app
 *   - {}                   when no canonical repair surface is defined
 */
export function resolveRepairRoute(
  domain: LivingStateDomain,
  code: LivingStateBlockerCode,
  availableRoutes: string[],
): { route?: string; missing?: boolean } {
  const route = REPAIR_ROUTE_MAP[domain]?.[code];
  if (!route) return {};
  if (routeExists(route, availableRoutes)) return { route };
  return { route, missing: true };
}
