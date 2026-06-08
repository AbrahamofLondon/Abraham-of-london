/**
 * lib/product/semantic-destination-resolver.ts
 *
 * Semantic Destination Resolver — intent-based routing authority.
 *
 * Answers: "Given this product/feature/capability and this intent,
 * where should the user go?"
 *
 * Replaces hardcoded hrefs in pricing, product, and feature pages.
 * Fail-closed: unknown codes return a safe, diagnosable result — never /pricing.
 *
 * Hard rule:
 *   No feature-specific CTA may resolve to bare /pricing unless the
 *   CTA text is explicitly "View pricing" (intent: "view_pricing").
 *
 * Usage:
 *   const dest = resolveDestination("return_brief", "access");
 *   // { href: "/return-brief", confidence: "high", ... }
 *
 *   const dest = resolveDestination("feature:benchmark_context_advanced", "upgrade");
 *   // { href: "/professional", confidence: "high", ... }
 */

import {
  PRODUCT_KNOWLEDGE_GRAPH,
  getGraphNode,
  type ProductGraphNode,
  type GraphAccessMode,
} from "@/lib/product/product-knowledge-graph";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DestinationIntent =
  | "learn"                    // → explanation / landing page
  | "start"                    // → entry point for first use
  | "access"                   // → the route to USE when entitled
  | "upgrade"                  // → where to unlock/purchase
  | "checkout"                 // → direct Stripe-initiated purchase route
  | "account"                  // → account / subscription management
  | "benchmark"                // → benchmark context page
  | "return_brief"             // → return brief route
  | "professional_feature"     // → professional subscription landing
  | "evidence_gated_explanation"; // → prerequisite/explanation route

export type DestinationType =
  | "direct_route"         // exact product/feature route
  | "upgrade_route"        // route to unlock/purchase
  | "explanation_page"     // static explanation page
  | "prerequisite_route"   // must complete first
  | "professional_landing" // /professional page
  | "capability_page"      // estate-wide capability explanation
  | "safe_fallback";       // fallback used; audit should investigate

export type ResolvedDestination = {
  href: string;
  reason: string;
  accessMode: GraphAccessMode;
  destinationType: DestinationType;
  requiresAuth: boolean;
  requiresEntitlement: boolean;
  requiresPriorCase: boolean;
  fallbackUsed: boolean;
  confidence: "high" | "medium" | "low";
};

// ─── Safe fallbacks (never /pricing for feature CTAs) ────────────────────────

const SAFE_UNKNOWN_FALLBACK = "/products";
const SAFE_UPGRADE_FALLBACK = "/professionals";
const SAFE_BENCHMARK_FALLBACK = "/benchmark-context";
const SAFE_RETURN_BRIEF_FALLBACK = "/return-brief";

// ─── Intent → node field mapping ─────────────────────────────────────────────

function pickRouteForIntent(node: ProductGraphNode, intent: DestinationIntent): {
  href: string | undefined;
  destinationType: DestinationType;
  fallbackUsed: boolean;
} {
  switch (intent) {
    case "learn":
      return {
        href: node.learnRoute ?? node.canonicalRoute,
        destinationType: "explanation_page",
        fallbackUsed: !node.learnRoute,
      };

    case "start":
      return {
        href: node.startRoute ?? node.canonicalRoute,
        destinationType: "direct_route",
        fallbackUsed: !node.startRoute,
      };

    case "access":
      return {
        href: node.accessRoute ?? node.canonicalRoute,
        destinationType: "direct_route",
        fallbackUsed: !node.accessRoute,
      };

    case "upgrade":
      // Professional-gated and paid_checkout features should route to /professional
      // or their checkoutRoute, never to bare /pricing
      if (node.accessMode === "professional_gated") {
        return {
          href: node.upgradeRoute ?? SAFE_UPGRADE_FALLBACK,
          destinationType: "professional_landing",
          fallbackUsed: !node.upgradeRoute,
        };
      }
      return {
        href: node.upgradeRoute ?? node.checkoutRoute ?? node.canonicalRoute,
        destinationType: "upgrade_route",
        fallbackUsed: !node.upgradeRoute && !node.checkoutRoute,
      };

    case "checkout":
      return {
        href: node.checkoutRoute ?? node.upgradeRoute ?? node.canonicalRoute,
        destinationType: "upgrade_route",
        fallbackUsed: !node.checkoutRoute,
      };

    case "account":
      return {
        href: node.accountRoute ?? node.accessRoute ?? node.canonicalRoute,
        destinationType: "direct_route",
        fallbackUsed: !node.accountRoute,
      };

    case "benchmark":
      // Always route to benchmark-context page for benchmark intent
      return {
        href: SAFE_BENCHMARK_FALLBACK,
        destinationType: "capability_page",
        fallbackUsed: false,
      };

    case "return_brief":
      // Always route to return-brief page for return brief intent
      return {
        href: SAFE_RETURN_BRIEF_FALLBACK,
        destinationType: "explanation_page",
        fallbackUsed: false,
      };

    case "professional_feature":
      // Features owned by Professional route to /professional
      return {
        href: node.ownerProduct === "professional"
          ? (node.upgradeRoute ?? SAFE_UPGRADE_FALLBACK)
          : (node.upgradeRoute ?? node.canonicalRoute ?? SAFE_UPGRADE_FALLBACK),
        destinationType: "professional_landing",
        fallbackUsed: !node.upgradeRoute,
      };

    case "evidence_gated_explanation":
      return {
        href: node.prerequisiteRoute ?? node.learnRoute ?? node.canonicalRoute ?? SAFE_UNKNOWN_FALLBACK,
        destinationType: "prerequisite_route",
        fallbackUsed: !node.prerequisiteRoute,
      };
  }
}

// ─── Access flags ─────────────────────────────────────────────────────────────

function deriveAccessFlags(node: ProductGraphNode): {
  requiresAuth: boolean;
  requiresEntitlement: boolean;
  requiresPriorCase: boolean;
} {
  return {
    requiresAuth: ["paid_checkout", "professional_gated", "evidence_gated", "contracted", "admin_only"].includes(node.accessMode),
    requiresEntitlement: ["paid_checkout", "professional_gated", "contracted"].includes(node.accessMode),
    requiresPriorCase: node.accessMode === "evidence_gated" || node.requiredPrerequisites != null && node.requiredPrerequisites.length > 0,
  };
}

// ─── Core resolver ────────────────────────────────────────────────────────────

export function resolveDestination(
  code: string,
  intent: DestinationIntent,
): ResolvedDestination {
  // Try direct lookup first, then with "feature:" prefix, then with "capability:" prefix
  const node =
    getGraphNode(code) ??
    getGraphNode(`feature:${code}`) ??
    getGraphNode(`capability:${code}`) ??
    getGraphNode(`route:${code}`);

  // Fail closed: unknown code — return a safe, diagnosable result
  if (!node) {
    return {
      href: SAFE_UNKNOWN_FALLBACK,
      reason: `Unknown graph node: "${code}". Register in product-knowledge-graph.ts before adding a CTA.`,
      accessMode: "dormant",
      destinationType: "safe_fallback",
      requiresAuth: false,
      requiresEntitlement: false,
      requiresPriorCase: false,
      fallbackUsed: true,
      confidence: "low",
    };
  }

  const { href: rawHref, destinationType, fallbackUsed } = pickRouteForIntent(node, intent);
  const href = rawHref ?? SAFE_UNKNOWN_FALLBACK;

  // Hard rule: feature CTAs must not resolve to bare /pricing
  const isPricingLoop = href === "/pricing" && intent !== "learn";
  const resolvedHref = isPricingLoop
    ? (node.accessMode === "professional_gated" ? SAFE_UPGRADE_FALLBACK : SAFE_UNKNOWN_FALLBACK)
    : href;

  const flags = deriveAccessFlags(node);

  const confidence: ResolvedDestination["confidence"] =
    fallbackUsed || isPricingLoop ? "medium"
    : !rawHref ? "low"
    : "high";

  return {
    href: resolvedHref,
    reason: isPricingLoop
      ? `Pricing loop prevented: ${code}/${intent} would have resolved to /pricing. Redirected to ${resolvedHref}.`
      : fallbackUsed
      ? `${code}/${intent}: used fallback — preferred route field not set on node.`
      : `${code}/${intent} → ${resolvedHref}`,
    accessMode: node.accessMode,
    destinationType: isPricingLoop ? "safe_fallback" : destinationType,
    ...flags,
    fallbackUsed: fallbackUsed || isPricingLoop,
    confidence,
  };
}

// ─── Batch resolver (for audit scripts) ──────────────────────────────────────

export type BatchDestinationResult = ResolvedDestination & {
  code: string;
  intent: DestinationIntent;
  nodeName: string | null;
};

export function resolveAllDestinations(
  codes: string[],
  intents: DestinationIntent[],
): BatchDestinationResult[] {
  const results: BatchDestinationResult[] = [];
  for (const code of codes) {
    const node = getGraphNode(code) ?? getGraphNode(`feature:${code}`);
    for (const intent of intents) {
      const resolved = resolveDestination(code, intent);
      results.push({
        ...resolved,
        code,
        intent,
        nodeName: node?.name ?? null,
      });
    }
  }
  return results;
}

// ─── Convenience resolvers ────────────────────────────────────────────────────

/** Resolve where a feature's "Access →" CTA should point. */
export function resolveFeatureAccessHref(featureCode: string): string {
  return resolveDestination(featureCode, "access").href;
}

/** Resolve where a feature's "Upgrade" CTA should point. Never /pricing. */
export function resolveFeatureUpgradeHref(featureCode: string): string {
  return resolveDestination(featureCode, "upgrade").href;
}

/** Resolve benchmark context destination for any code. */
export function resolveBenchmarkDestination(): string {
  return SAFE_BENCHMARK_FALLBACK;
}

/** Resolve return brief destination for any code. */
export function resolveReturnBriefDestination(): string {
  return SAFE_RETURN_BRIEF_FALLBACK;
}

/** Resolve professional feature destination (upgrade/access). */
export function resolveProfessionalDestination(intent: "learn" | "start" | "upgrade" | "access" = "start"): string {
  return resolveDestination("professional", intent).href;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export type SemanticAuditResult = {
  code: string;
  intent: DestinationIntent;
  href: string;
  severity: "PASS" | "WARN" | "FAIL";
  reason: string;
};

/**
 * Audit all graph nodes for semantic destination correctness.
 * Returns FAIL for: /pricing loops, low-confidence fallbacks, missing routes.
 */
export function auditSemanticDestinations(): SemanticAuditResult[] {
  const results: SemanticAuditResult[] = [];
  const intentsToAudit: DestinationIntent[] = ["learn", "start", "access", "upgrade"];

  for (const code of Object.keys(PRODUCT_KNOWLEDGE_GRAPH)) {
    for (const intent of intentsToAudit) {
      const resolved = resolveDestination(code, intent);
      if (!resolved.href || resolved.href === "#" || resolved.href === "") {
        results.push({ code, intent, href: resolved.href, severity: "FAIL", reason: "Empty or dead href" });
      } else if (resolved.href === "/pricing" && intent !== "learn") {
        results.push({ code, intent, href: resolved.href, severity: "FAIL", reason: "Bare /pricing for non-learn intent" });
      } else if (resolved.confidence === "low") {
        results.push({ code, intent, href: resolved.href, severity: "WARN", reason: resolved.reason });
      } else if (resolved.fallbackUsed) {
        results.push({ code, intent, href: resolved.href, severity: "WARN", reason: `Fallback used: ${resolved.reason}` });
      }
    }
  }

  return results;
}
