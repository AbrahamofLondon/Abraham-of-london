/**
 * lib/product/product-access-link-resolver.ts — COMMERCIAL TRUTH LAYER
 *
 * Single authority layer for all product surface links.
 *
 * Every product card, CTA, and navigation surface must resolve through this
 * resolver rather than hardcoding hrefs. This eliminates same-page loops,
 * ambiguous "Access" CTAs, and dead links that contradict commercial status.
 *
 * Rules:
 *   - No product card hardcodes href="#" or the current-page href
 *   - Manual billing → specific enquiry/intake route
 *   - Requires auth → login with returnTo
 *   - Evidence-gated → prerequisite page or eligibility explanation
 *   - Missing page → create minimal correct page rather than looping
 */

import { CATALOG, type CatalogProduct } from "@/lib/commercial/catalog";
import { PRODUCT_SURFACE_REGISTRY, type ProductSurface, type SurfaceExposureStatus } from "@/lib/product/product-surface-registry";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AccessMode =
  | "free_public"       // no payment required; clear public route
  | "paid_checkout"     // Stripe product + price + checkout route required
  | "manual_billing"    // no Stripe checkout; enquiry/intake route
  | "contracted"        // enterprise/retainer style; enquiry or readiness review
  | "evidence_gated"    // requires prior case/evidence/diagnostic record
  | "admin_only"        // no public activation; admin route only
  | "dormant";          // not sold; no checkout; no public activation CTA

export type ProductAccessLink = {
  productCode: string;
  surfaceCode?: string;
  label: string;
  href: string;
  accessMode: AccessMode;
  routeExists: boolean;
  requiresAuth: boolean;
  requiresPriorEvidence: boolean;
  reason?: string;
};

// ─── Known-good routes (verified pages) ──────────────────────────────────────

const KNOWN_ROUTES = new Set<string>([
  "/",
  "/pricing",
  "/products",
  "/contact",
  "/enterprise",
  "/enterprise-decision-scan",
  "/enterprise-decision-authority",
  "/professionals",
  "/decision-pressure",
  "/boardroom-brief",
  "/boardroom-brief?sample=true",
  "/boardroom",
  "/boardroom-mode",
  "/strategy-room",
  "/decision-instruments",
  "/decision-instruments/decision-exposure-instrument",
  "/decision-instruments/mandate-clarity-framework",
  "/decision-instruments/intervention-path-selector",
  "/decision-instruments/escalation-readiness-scorecard",
  "/decision-instruments/structural-failure-diagnostic-canvas",
  "/decision-instruments/execution-risk-index",
  "/decision-instruments/team-alignment-gap-map",
  "/decision-instruments/governance-drift-detector",
  "/decision-instruments/strategic-priority-stack-builder",
  "/decision-instruments/board-brief-builder",
  "/decision-instruments/operator-decision-pack",
  "/diagnostics/fast",
  "/diagnostics/executive-reporting",
  "/diagnostics/executive-reporting/run",
  "/diagnostics/team-assessment",
  "/diagnostics/enterprise-assessment",
  "/diagnostics/purpose-alignment",
  "/decision-centre",
  "/return-brief",
  "/retainer",
  "/retainer/intake",
  "/intelligence/gmi",
  "/intelligence/gmi/q2-2026",
  "/intelligence/gmi/calls",
  "/intelligence/gmi/performance",
  "/intelligence/gmi/falsification",
  "/intelligence/gmi/board-pulse",
  "/artifacts/global-market-intelligence-report-q1-2026",
  "/artifacts/global-market-intelligence-report-q2-2026",
  "/artifacts/global-market-outlook-q1-2026-public",
  "/briefs",
  "/vault",
  "/evidence",
  "/playbooks/execution-integrity-protocol",
  "/playbooks/the-alignment-audit-playbook",
  "/playbooks/the-drift-detection-framework",
  "/inner-circle",
  "/quick-check",
  "/scenario-stress-test",
  "/pressure",
  "/decision-pathway",
  "/continuity",
  "/oversight",
  "/my-instruments",
  "/benchmark-context",
]);

// ─── Access mode derivation from catalog ─────────────────────────────────────

function deriveAccessMode(product: CatalogProduct): AccessMode {
  const { commercialStatus, active, requiresCheckout } = product;

  if (!active || commercialStatus === "inactive" || commercialStatus === "retired") {
    return "dormant";
  }
  if (commercialStatus === "internal_only") return "admin_only";
  if (commercialStatus === "dormant") return "dormant";
  if (commercialStatus === "free_controlled") return "free_public";
  if (commercialStatus === "evidence_gated") return "evidence_gated";
  if (commercialStatus === "contracted") return "contracted";
  if (commercialStatus === "manual_billing") return "manual_billing";
  if (commercialStatus === "paid" && requiresCheckout && product.stripePriceId) return "paid_checkout";
  if (commercialStatus === "paid" && requiresCheckout && !product.stripePriceId) {
    // Paid but missing Stripe price — treat as manual_billing until configured
    return "manual_billing";
  }
  return "manual_billing";
}

// ─── Enquiry route by product type ───────────────────────────────────────────

function enquiryRoute(product: CatalogProduct): string {
  if (product.category === "retainer") return "/retainer/intake";
  if (product.category === "membership" || product.commercialStatus === "contracted") return "/contact";
  if (product.commercialStatus === "evidence_gated") return product.successPath ?? "/products";
  return "/contact";
}

// ─── Core resolver ───────────────────────────────────────────────────────────

export function resolveProductAccessLink(
  productCode: string,
  opts: {
    isAuthenticated?: boolean;
    hasPriorEvidence?: boolean;
    currentPath?: string;
    surfaceCode?: string;
  } = {},
): ProductAccessLink {
  const product = CATALOG[productCode as keyof typeof CATALOG] as CatalogProduct | undefined;

  if (!product) {
    return {
      productCode,
      surfaceCode: opts.surfaceCode,
      label: "Not available",
      href: "/products",
      accessMode: "dormant",
      routeExists: true,
      requiresAuth: false,
      requiresPriorEvidence: false,
      reason: `Unknown product code: ${productCode}`,
    };
  }

  const accessMode = deriveAccessMode(product);
  const currentPath = opts.currentPath ?? "";
  const isAuthenticated = opts.isAuthenticated ?? false;
  const hasPriorEvidence = opts.hasPriorEvidence ?? false;

  // ── dormant / admin_only ─────────────────────────────────────────────────
  if (accessMode === "dormant" || accessMode === "admin_only") {
    return {
      productCode,
      surfaceCode: opts.surfaceCode,
      label: accessMode === "dormant" ? "Currently unavailable" : "Admin access only",
      href: "/products",
      accessMode,
      routeExists: true,
      requiresAuth: accessMode === "admin_only",
      requiresPriorEvidence: false,
      reason: "Product is dormant or admin-only; no public CTA should render",
    };
  }

  // ── evidence_gated ───────────────────────────────────────────────────────
  if (accessMode === "evidence_gated") {
    const targetRoute = product.successPath ?? "/products";
    const loopsBack = targetRoute === currentPath;
    const resolvedRoute = loopsBack ? "/products" : targetRoute;
    return {
      productCode,
      surfaceCode: opts.surfaceCode,
      label: hasPriorEvidence ? (product.primaryCta ?? "Access") : "Requires prior evidence record",
      href: hasPriorEvidence && !loopsBack ? resolvedRoute : "/products",
      accessMode,
      routeExists: KNOWN_ROUTES.has(resolvedRoute),
      requiresAuth: true,
      requiresPriorEvidence: true,
      reason: hasPriorEvidence
        ? "Evidence-gated: prior record confirmed"
        : "Evidence-gated: must complete prior diagnostic to access this stage",
    };
  }

  // ── contracted ───────────────────────────────────────────────────────────
  if (accessMode === "contracted") {
    const route = product.successPath === "/contact" ? "/contact" : enquiryRoute(product);
    return {
      productCode,
      surfaceCode: opts.surfaceCode,
      label: product.primaryCta ?? "Request access",
      href: route,
      accessMode,
      routeExists: KNOWN_ROUTES.has(route),
      requiresAuth: false,
      requiresPriorEvidence: false,
      reason: "Contracted product: routes to enquiry/intake",
    };
  }

  // ── manual_billing ───────────────────────────────────────────────────────
  if (accessMode === "manual_billing") {
    const route = enquiryRoute(product);
    return {
      productCode,
      surfaceCode: opts.surfaceCode,
      label: product.primaryCta ?? "Request access",
      href: route,
      accessMode,
      routeExists: KNOWN_ROUTES.has(route),
      requiresAuth: false,
      requiresPriorEvidence: false,
      reason: "Manual billing: no self-serve checkout; routes to enquiry",
    };
  }

  // ── free_public ──────────────────────────────────────────────────────────
  if (accessMode === "free_public") {
    const route = product.successPath ?? "/";
    const loopsBack = route === currentPath;
    return {
      productCode,
      surfaceCode: opts.surfaceCode,
      label: product.primaryCta ?? "Start free",
      href: loopsBack ? "/" : route,
      accessMode,
      routeExists: KNOWN_ROUTES.has(route),
      requiresAuth: false,
      requiresPriorEvidence: false,
    };
  }

  // ── paid_checkout ────────────────────────────────────────────────────────
  // All paid_checkout products route through /api/checkout with the product code.
  // The link itself goes to the product's successPath (landing/info page)
  // where the checkout button is rendered with Stripe integration.
  const landingRoute = product.successPath;
  const loopsBack = landingRoute === currentPath;

  // If no auth and product requires it, route to sign-in
  if (!isAuthenticated && false /* future: requiresAuth check */) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const p = product!;
    return {
      productCode,
      surfaceCode: opts.surfaceCode,
      label: p.primaryCta ?? "Sign in to access",
      href: `/auth/signin?returnTo=${encodeURIComponent(landingRoute)}`,
      accessMode,
      routeExists: true,
      requiresAuth: true,
      requiresPriorEvidence: false,
      reason: "Paid checkout: auth required",
    };
  }

  return {
    productCode,
    surfaceCode: opts.surfaceCode,
    label: product.primaryCta ?? product.displayName,
    href: loopsBack ? "/products" : landingRoute,
    accessMode,
    routeExists: KNOWN_ROUTES.has(landingRoute),
    requiresAuth: false,
    requiresPriorEvidence: false,
  };
}

// ─── Batch resolver ───────────────────────────────────────────────────────────

export function resolveProductAccessLinks(
  productCodes: string[],
  opts: Parameters<typeof resolveProductAccessLink>[1] = {},
): ProductAccessLink[] {
  return productCodes.map((code) => resolveProductAccessLink(code, opts));
}

// ─── Integrity check ─────────────────────────────────────────────────────────

export type AccessLinkIntegrityError = {
  productCode: string;
  error: string;
  severity: "FAIL" | "WARN";
};

export function auditProductAccessLinks(): AccessLinkIntegrityError[] {
  const errors: AccessLinkIntegrityError[] = [];

  for (const [code, product] of Object.entries(CATALOG)) {
    const link = resolveProductAccessLink(code);

    // No product may use "#" or empty href
    if (link.href === "#" || link.href === "") {
      errors.push({ productCode: code, error: `href is "#" or empty — dead link`, severity: "FAIL" });
    }

    // Paid products must have Stripe IDs or explicit non-checkout mode
    if (product.commercialStatus === "paid" && product.requiresCheckout) {
      if (!product.stripePriceId) {
        errors.push({
          productCode: code,
          error: `commercialStatus=paid + requiresCheckout=true but stripePriceId is null`,
          severity: "FAIL",
        });
      }
      if (!product.stripeProductId) {
        errors.push({
          productCode: code,
          error: `commercialStatus=paid + requiresCheckout=true but stripeProductId is null`,
          severity: "WARN",
        });
      }
    }

    // manual_billing must NOT have requiresCheckout=true
    if (product.commercialStatus === "manual_billing" && product.requiresCheckout) {
      errors.push({
        productCode: code,
        error: `commercialStatus=manual_billing but requiresCheckout=true — contradiction`,
        severity: "FAIL",
      });
    }

    // evidence_gated must NOT have requiresCheckout=true
    if (product.commercialStatus === "evidence_gated" && product.requiresCheckout) {
      errors.push({
        productCode: code,
        error: `commercialStatus=evidence_gated but requiresCheckout=true — contradiction`,
        severity: "FAIL",
      });
    }

    // contracted must NOT have requiresCheckout=true
    if (product.commercialStatus === "contracted" && product.requiresCheckout) {
      errors.push({
        productCode: code,
        error: `commercialStatus=contracted but requiresCheckout=true — contradiction`,
        severity: "FAIL",
      });
    }

    // Active paid products must have a successPath
    if (product.active && product.amount > 0 && !product.successPath) {
      errors.push({
        productCode: code,
        error: `Active paid product has no successPath`,
        severity: "FAIL",
      });
    }
  }

  return errors;
}

// ─── Extended resolution type (P4) ──────────────────────────────────────────

export type ProductAccessResolution = {
  code: string;
  source: "catalog" | "surface_registry" | "both";
  label: string;
  href: string | null;
  accessMode: AccessMode;
  routeExists: boolean;
  checkoutAllowed: boolean;
  stripeConfigured: boolean;
  entitlementConfigured: boolean;
  samePageLoop: boolean;
  decisionRequired: boolean;
  reason?: string;
};

function exposureToAccessMode(exposure: SurfaceExposureStatus, surface: ProductSurface): AccessMode {
  if (exposure === "retired") return "dormant";
  if (exposure === "dormant") return "dormant";
  if (exposure === "admin_only") return "admin_only";
  if (exposure === "hidden") return "dormant";
  if (exposure === "evidence_gated" || exposure === "review_gated") return "evidence_gated";
  if (surface.acceptsPayment) return "paid_checkout";
  if (surface.requiresAuth) return "free_public"; // auth-walled free surface
  return "free_public";
}

export function resolveProductAccessBySurface(
  surfaceId: string,
  opts: { currentPath?: string; isAuthenticated?: boolean; hasPriorEvidence?: boolean } = {},
): ProductAccessResolution {
  const surface = PRODUCT_SURFACE_REGISTRY.find((s) => s.surfaceId === surfaceId);

  if (!surface) {
    return {
      code: surfaceId,
      source: "surface_registry",
      label: "Unknown surface",
      href: "/products",
      accessMode: "dormant",
      routeExists: false,
      checkoutAllowed: false,
      stripeConfigured: false,
      entitlementConfigured: false,
      samePageLoop: false,
      decisionRequired: true,
      reason: `surfaceId "${surfaceId}" not found in PRODUCT_SURFACE_REGISTRY`,
    };
  }

  const catalogCode = surface.catalogProductCode;
  const catalogEntry = catalogCode ? CATALOG[catalogCode as keyof typeof CATALOG] : undefined;

  const source: "catalog" | "surface_registry" | "both" =
    catalogEntry ? (catalogCode ? "both" : "surface_registry") : "surface_registry";

  // Prefer catalog-derived resolution when catalog entry exists
  if (catalogEntry) {
    const link = resolveProductAccessLink(catalogCode!, opts);
    const currentPath = opts.currentPath ?? "";
    return {
      code: catalogCode!,
      source: "both",
      label: link.label,
      href: link.href,
      accessMode: link.accessMode,
      routeExists: link.routeExists,
      checkoutAllowed: link.accessMode === "paid_checkout",
      stripeConfigured: !!(catalogEntry.stripeProductId && catalogEntry.stripePriceId),
      entitlementConfigured: !!catalogEntry.entitlementSlug,
      samePageLoop: link.href === currentPath && !!currentPath,
      decisionRequired: false,
      reason: link.reason,
    };
  }

  // Surface-only (no catalog entry) — resolve from surface metadata
  const accessMode = exposureToAccessMode(surface.currentExposureStatus, surface);
  const route = surface.route;
  const currentPath = opts.currentPath ?? "";
  const samePageLoop = !!route && route === currentPath;

  let href: string | null = route;
  let label = surface.primaryCTA ?? "View";

  if (accessMode === "dormant" || accessMode === "admin_only") {
    href = null;
    label = "Not available";
  } else if (accessMode === "evidence_gated") {
    label = surface.primaryCTA ?? "Requires prior record";
    href = route; // explanation page
  } else if (!surface.acceptsPayment && route) {
    href = route;
  }

  return {
    code: surface.surfaceId,
    source: "surface_registry",
    label,
    href,
    accessMode,
    routeExists: route ? KNOWN_ROUTES.has(route) : false,
    checkoutAllowed: surface.acceptsPayment,
    stripeConfigured: surface.stripePriceId !== null && surface.stripePriceId !== "catalog",
    entitlementConfigured: surface.entitlementSlug !== null,
    samePageLoop,
    decisionRequired: !catalogCode && surface.acceptsPayment,
    reason: !catalogCode ? "surface_only: no catalog entry" : undefined,
  };
}

export function resolveAllSurfaceLinks(
  opts: Parameters<typeof resolveProductAccessBySurface>[1] = {},
): ProductAccessResolution[] {
  return PRODUCT_SURFACE_REGISTRY.map((s) => resolveProductAccessBySurface(s.surfaceId, opts));
}
