/**
 * lib/product/product-knowledge-graph.ts
 *
 * Product Knowledge Graph — the estate's self-knowledge layer.
 *
 * Every user-facing feature, product, surface, capability, and route
 * is represented as a typed ProductGraphNode. The graph is the single
 * source of truth for:
 *   - What each entity is (kind)
 *   - Where it lives (routes: canonical, learn, start, access, upgrade, checkout)
 *   - How it is accessed (accessMode)
 *   - What entitlement it requires
 *   - Relationships to catalog products, surfaces, and features
 *
 * Rules:
 *   - No CTA may exist without a corresponding graph node
 *   - No access route may point to /pricing unless intent is explicitly "view_pricing"
 *   - Product nodes are built dynamically from CATALOG
 *   - Surface nodes are built dynamically from PRODUCT_SURFACE_REGISTRY (48 surfaces)
 *   - Feature, capability, and route nodes are defined statically here
 *
 * Consumers:
 *   - semantic-destination-resolver.ts
 *   - scripts/audit-rendered-product-ctas.mjs
 *   - tests/product-estate/product-knowledge-graph.test.ts
 */

import { CATALOG, type CatalogProduct } from "@/lib/commercial/catalog";
import { PRODUCT_SURFACE_REGISTRY } from "@/lib/product/product-surface-registry";

// ─── Types ────────────────────────────────────────────────────────────────────

export type GraphAccessMode =
  | "free_public"        // no auth, no payment; open access
  | "free_controlled"    // no payment; may require account creation
  | "paid_checkout"      // Stripe checkout required
  | "manual_billing"     // no self-serve checkout; operator-led
  | "contracted"         // enterprise engagement; enquiry only
  | "evidence_gated"     // requires prior governed case record
  | "professional_gated" // requires Professional subscription entitlement
  | "admin_only"         // no public activation; admin route only
  | "dormant";           // not available; no public CTA

export type ProductGraphNode = {
  code: string;
  kind:
    | "product"
    | "surface"
    | "feature"
    | "capability"
    | "route"
    | "artifact"
    | "entitlement";

  name: string;

  /** Primary URL for this entity */
  canonicalRoute?: string;
  /** Explanation / landing page — where to go to learn what this is */
  learnRoute?: string;
  /** Entry point for first use */
  startRoute?: string;
  /** Route to USE the entity when already entitled */
  accessRoute?: string;
  /** Route to manage account or subscription state */
  accountRoute?: string;
  /** Route to go to unlock / purchase this entity */
  upgradeRoute?: string;
  /** Direct checkout route (Stripe-initiated) */
  checkoutRoute?: string;
  /** Route to complete before this entity is accessible */
  prerequisiteRoute?: string;

  accessMode: GraphAccessMode;

  // Cross-references
  entitlementSlug?: string;
  catalogCode?: string;
  surfaceCode?: string;

  // Dependency / output metadata
  /** Codes of other graph nodes required before access is permitted */
  requiredPrerequisites?: string[];
  /** Codes of artifact nodes this entity produces */
  producesArtifacts?: string[];
  /** Whether this entity contributes to or consumes benchmark data */
  supportsBenchmarking?: boolean;
  /** Whether this entity generates or consumes Return Briefs */
  supportsReturnBrief?: boolean;
  /** Catalog code of the primary owning product */
  ownerProduct?: string;

  status: "active" | "draft" | "archived" | "dormant";
};

// ─── Access mode derivation ───────────────────────────────────────────────────

function deriveGraphAccessMode(product: CatalogProduct): GraphAccessMode {
  const { commercialStatus, active, requiresCheckout, stripePriceId } = product;
  if (!active || commercialStatus === "inactive" || commercialStatus === "retired") return "dormant";
  if (commercialStatus === "dormant") return "dormant";
  if (commercialStatus === "internal_only") return "admin_only";
  if (commercialStatus === "free_controlled") return "free_controlled";
  if (commercialStatus === "evidence_gated") return "evidence_gated";
  if (commercialStatus === "contracted") return "contracted";
  if (commercialStatus === "manual_billing") return "manual_billing";
  if (commercialStatus === "paid" && requiresCheckout && stripePriceId) return "paid_checkout";
  return "manual_billing";
}

// ─── Product nodes (built from CATALOG) ──────────────────────────────────────

function buildProductNodes(): Record<string, ProductGraphNode> {
  const nodes: Record<string, ProductGraphNode> = {};

  // Metadata that can't be derived from the catalog alone
  const productMeta: Partial<Record<string, Partial<ProductGraphNode>>> = {
    fast_diagnostic:       { learnRoute: "/diagnostics/fast", startRoute: "/diagnostics/fast" },
    boardroom_brief:       { learnRoute: "/boardroom-brief", startRoute: "/boardroom-brief", checkoutRoute: "/boardroom-brief" },
    executive_reporting:   { learnRoute: "/diagnostics/executive-reporting", startRoute: "/diagnostics/executive-reporting", prerequisiteRoute: "/diagnostics/fast", supportsBenchmarking: true },
    strategy_room:         { learnRoute: "/strategy-room", startRoute: "/strategy-room", checkoutRoute: "/strategy-room", supportsBenchmarking: true },
    strategy_room_extended: { learnRoute: "/strategy-room", startRoute: "/strategy-room" },
    professional:          { learnRoute: "/professionals", startRoute: "/professionals", accessRoute: "/decision-centre", accountRoute: "/decision-centre", upgradeRoute: "/professionals", supportsReturnBrief: true, supportsBenchmarking: true },
    professional_annual:   { learnRoute: "/professionals", startRoute: "/professionals", accessRoute: "/decision-centre", accountRoute: "/decision-centre", upgradeRoute: "/professionals", supportsReturnBrief: true, supportsBenchmarking: true },
    retainer_core:         { learnRoute: "/oversight", startRoute: "/retainer/intake", accessRoute: "/oversight", upgradeRoute: "/retainer/intake", supportsBenchmarking: true },
    retainer_operational:  { learnRoute: "/oversight", startRoute: "/retainer/intake", accessRoute: "/oversight", upgradeRoute: "/retainer/intake" },
    retainer_institutional: { learnRoute: "/oversight", startRoute: "/retainer/intake", accessRoute: "/oversight", upgradeRoute: "/retainer/intake" },
    enterprise:            { learnRoute: "/enterprise", startRoute: "/enterprise", accessRoute: "/enterprise", upgradeRoute: "/contact" },
    team_assessment:       { learnRoute: "/diagnostics/team-assessment", startRoute: "/diagnostics/team-assessment" },
    enterprise_assessment: { learnRoute: "/diagnostics/enterprise-assessment", startRoute: "/diagnostics/enterprise-assessment" },
    boardroom_mode:        { learnRoute: "/boardroom-mode", prerequisiteRoute: "/diagnostics/executive-reporting" },
    inner_circle:          { learnRoute: "/inner-circle" },
    gmi_q2_2026:           { learnRoute: "/intelligence/gmi", accessRoute: "/artifacts/global-market-intelligence-report-q2-2026", supportsBenchmarking: true },
    gmi_q1_2026:           { learnRoute: "/intelligence/gmi", accessRoute: "/artifacts/global-market-intelligence-report-q1-2026" },
  };

  for (const [code, product] of Object.entries(CATALOG)) {
    const meta = productMeta[code] ?? {};
    const accessMode = deriveGraphAccessMode(product);
    const canonicalRoute = product.successPath ?? undefined;

    nodes[code] = {
      code,
      kind: "product",
      name: product.displayName,
      canonicalRoute,
      accessRoute: meta.accessRoute ?? canonicalRoute,
      learnRoute: meta.learnRoute ?? canonicalRoute,
      startRoute: meta.startRoute ?? canonicalRoute,
      accountRoute: meta.accountRoute,
      upgradeRoute: meta.upgradeRoute ?? (accessMode === "paid_checkout" ? canonicalRoute : undefined),
      checkoutRoute: meta.checkoutRoute ?? (accessMode === "paid_checkout" ? canonicalRoute : undefined),
      prerequisiteRoute: meta.prerequisiteRoute,
      accessMode,
      entitlementSlug: product.entitlementSlug,
      catalogCode: code,
      supportsBenchmarking: meta.supportsBenchmarking ?? false,
      supportsReturnBrief: meta.supportsReturnBrief ?? false,
      ownerProduct: code,
      status: product.active ? "active" : "dormant",
    };
  }

  return nodes;
}

// ─── Surface nodes (built from PRODUCT_SURFACE_REGISTRY) ─────────────────────

function buildSurfaceNodes(): Record<string, ProductGraphNode> {
  const nodes: Record<string, ProductGraphNode> = {};

  // Surface-specific access mode overrides (derived from surfaceType + catalogProductCode)
  const surfaceAccessOverrides: Partial<Record<string, GraphAccessMode>> = {
    team_assessment:            "free_controlled",
    enterprise_assessment:      "free_controlled",
    boardroom_mode:              "evidence_gated",
    professional_workspace:      "professional_gated",
    retainer_oversight_portal:   "contracted",
    inner_circle_operating_layer: "dormant",
  };

  for (const surface of PRODUCT_SURFACE_REGISTRY) {
    const sid = surface.surfaceId;
    // Avoid overwriting a product node that has the same code as a surface
    const nodeCode = `surface:${sid}`;

    // Derive access mode: surface override → catalog product → default free_public
    let accessMode: GraphAccessMode = "free_public";
    if (surfaceAccessOverrides[sid]) {
      accessMode = surfaceAccessOverrides[sid]!;
    } else if (surface.catalogProductCode) {
      const product = CATALOG[surface.catalogProductCode as keyof typeof CATALOG] as CatalogProduct | undefined;
      if (product) accessMode = deriveGraphAccessMode(product);
    }

    const status: ProductGraphNode["status"] =
      surface.currentExposureStatus === "hidden" ||
      surface.currentExposureStatus === "dormant" ||
      surface.currentExposureStatus === "retired"
        ? "dormant"
        : "active";

    nodes[nodeCode] = {
      code: nodeCode,
      kind: "surface",
      name: surface.displayName,
      canonicalRoute: surface.route ?? undefined,
      accessRoute: surface.route ?? undefined,
      accessMode,
      catalogCode: surface.catalogProductCode ?? undefined,
      surfaceCode: sid,
      status,
    };
  }

  return nodes;
}

// ─── Feature nodes (static) ───────────────────────────────────────────────────
// These represent feature-level entitlement map entries as graph nodes.
// upgradeRoute = where to go to unlock; accessRoute = where the feature lives when entitled.

const FEATURE_NODES: Record<string, ProductGraphNode> = {
  "feature:fast_diagnostic": {
    code: "feature:fast_diagnostic",
    kind: "feature",
    name: "Fast Diagnostic",
    canonicalRoute: "/diagnostics/fast",
    learnRoute: "/diagnostics/fast",
    startRoute: "/diagnostics/fast",
    accessRoute: "/diagnostics/fast",
    accessMode: "free_public",
    status: "active",
  },
  "feature:decision_delay_exposure": {
    code: "feature:decision_delay_exposure",
    kind: "feature",
    name: "Decision Delay Exposure Instrument",
    canonicalRoute: "/tools/decision-delay-exposure",
    startRoute: "/tools/decision-delay-exposure",
    accessRoute: "/tools/decision-delay-exposure",
    accessMode: "free_public",
    status: "active",
  },
  "feature:decision_centre": {
    code: "feature:decision_centre",
    kind: "feature",
    name: "Decision Centre",
    canonicalRoute: "/decision-centre",
    startRoute: "/decision-centre",
    accessRoute: "/decision-centre",
    accessMode: "free_public",
    status: "active",
  },
  "feature:executive_reporting": {
    code: "feature:executive_reporting",
    kind: "feature",
    name: "Executive Reporting",
    canonicalRoute: "/diagnostics/executive-reporting",
    learnRoute: "/diagnostics/executive-reporting",
    startRoute: "/diagnostics/executive-reporting",
    accessRoute: "/diagnostics/executive-reporting",
    upgradeRoute: "/diagnostics/executive-reporting",
    checkoutRoute: "/diagnostics/executive-reporting",
    accessMode: "paid_checkout",
    catalogCode: "executive_reporting",
    ownerProduct: "executive_reporting",
    supportsBenchmarking: true,
    status: "active",
  },
  "feature:strategy_room": {
    code: "feature:strategy_room",
    kind: "feature",
    name: "Strategy Room",
    canonicalRoute: "/strategy-room",
    learnRoute: "/strategy-room",
    startRoute: "/strategy-room",
    accessRoute: "/strategy-room",
    upgradeRoute: "/strategy-room",
    checkoutRoute: "/strategy-room",
    accessMode: "paid_checkout",
    catalogCode: "strategy_room",
    ownerProduct: "strategy_room",
    supportsBenchmarking: true,
    status: "active",
  },
  "feature:strategy_room_extended": {
    code: "feature:strategy_room_extended",
    kind: "feature",
    name: "Strategy Room — Active / Multi-Decision",
    canonicalRoute: "/strategy-room",
    learnRoute: "/strategy-room",
    startRoute: "/strategy-room",
    accessRoute: "/strategy-room",
    upgradeRoute: "/strategy-room",
    accessMode: "paid_checkout",
    catalogCode: "strategy_room_extended",
    ownerProduct: "strategy_room_extended",
    status: "active",
  },
  "feature:governed_case_detail": {
    code: "feature:governed_case_detail",
    kind: "feature",
    name: "Governed Case Detail",
    canonicalRoute: "/decision-centre",
    accessRoute: "/decision-centre",
    accessMode: "free_public",
    status: "active",
  },
  "feature:return_brief": {
    code: "feature:return_brief",
    kind: "feature",
    name: "Return Brief",
    canonicalRoute: "/return-brief",
    learnRoute: "/return-brief",
    startRoute: "/return-brief",
    accessRoute: "/return-brief",
    upgradeRoute: "/professionals",
    prerequisiteRoute: "/diagnostics/fast",
    accessMode: "professional_gated",
    catalogCode: "professional",
    ownerProduct: "professional",
    supportsReturnBrief: true,
    status: "active",
  },
  "feature:benchmark_context_basic": {
    code: "feature:benchmark_context_basic",
    kind: "feature",
    name: "Basic Benchmark Context",
    canonicalRoute: "/benchmark-context",
    learnRoute: "/benchmark-context",
    accessRoute: "/decision-centre",
    accessMode: "free_public",
    supportsBenchmarking: true,
    status: "active",
  },
  "feature:benchmark_context_advanced": {
    code: "feature:benchmark_context_advanced",
    kind: "feature",
    name: "Advanced Benchmark Context",
    canonicalRoute: "/benchmark-context",
    learnRoute: "/benchmark-context",
    accessRoute: "/decision-centre",
    upgradeRoute: "/professionals",
    accessMode: "professional_gated",
    catalogCode: "professional",
    ownerProduct: "professional",
    supportsBenchmarking: true,
    status: "active",
  },
  "feature:retainer_oversight": {
    code: "feature:retainer_oversight",
    kind: "feature",
    name: "Retained Oversight",
    canonicalRoute: "/oversight",
    learnRoute: "/oversight",
    startRoute: "/retainer/intake",
    accessRoute: "/oversight",
    upgradeRoute: "/retainer/intake",
    accessMode: "contracted",
    ownerProduct: "retainer_core",
    status: "active",
  },
  "feature:counsel_review": {
    code: "feature:counsel_review",
    kind: "feature",
    name: "Counsel Review",
    canonicalRoute: "/counsel",
    accessMode: "contracted",
    status: "active",
  },
  "feature:boardroom": {
    code: "feature:boardroom",
    kind: "feature",
    name: "Boardroom",
    canonicalRoute: "/boardroom-mode",
    learnRoute: "/boardroom-mode",
    accessMode: "evidence_gated",
    prerequisiteRoute: "/diagnostics/executive-reporting",
    ownerProduct: "boardroom_mode",
    status: "active",
  },
  "feature:professional_tier": {
    code: "feature:professional_tier",
    kind: "feature",
    name: "Professional",
    canonicalRoute: "/professionals",
    learnRoute: "/professionals",
    startRoute: "/professionals",
    accessRoute: "/decision-centre",
    accountRoute: "/decision-centre",
    upgradeRoute: "/professionals",
    checkoutRoute: "/professionals",
    accessMode: "paid_checkout",
    catalogCode: "professional",
    ownerProduct: "professional",
    supportsReturnBrief: true,
    supportsBenchmarking: true,
    status: "active",
  },
};

// ─── Capability nodes (estate-wide capabilities, not single products) ─────────

const CAPABILITY_NODES: Record<string, ProductGraphNode> = {
  "capability:benchmark_context": {
    code: "capability:benchmark_context",
    kind: "capability",
    name: "Benchmark Context",
    canonicalRoute: "/benchmark-context",
    learnRoute: "/benchmark-context",
    accessRoute: "/decision-centre",
    upgradeRoute: "/professionals",
    accessMode: "free_public",  // basic is free; advanced is professional_gated
    supportsBenchmarking: true,
    status: "active",
  },
  "capability:return_brief": {
    code: "capability:return_brief",
    kind: "capability",
    name: "Return Brief",
    canonicalRoute: "/return-brief",
    learnRoute: "/return-brief",
    accessRoute: "/return-brief",
    upgradeRoute: "/professionals",
    prerequisiteRoute: "/diagnostics/fast",
    accessMode: "professional_gated",
    ownerProduct: "professional",
    supportsReturnBrief: true,
    status: "active",
  },
  "capability:governed_case": {
    code: "capability:governed_case",
    kind: "capability",
    name: "Governed Case",
    canonicalRoute: "/decision-centre",
    startRoute: "/diagnostics/fast",
    accessRoute: "/decision-centre",
    accessMode: "free_public",
    status: "active",
  },
  "capability:benchmark_engine": {
    code: "capability:benchmark_engine",
    kind: "capability",
    name: "Benchmark Engine",
    canonicalRoute: "/benchmark-context",
    accessMode: "free_public",
    supportsBenchmarking: true,
    status: "active",
  },
};

// ─── Route nodes (key navigational destinations) ──────────────────────────────
// These cover routes that aren't catalog products or features but must exist.

const ROUTE_NODES: Record<string, ProductGraphNode> = {
  "route:professional": {
    code: "route:professional",
    kind: "route",
    name: "Professional — subscription landing",
    canonicalRoute: "/professionals",
    learnRoute: "/professionals",
    startRoute: "/professionals",
    accessRoute: "/decision-centre",
    accessMode: "paid_checkout",
    catalogCode: "professional",
    status: "active",
  },
  "route:benchmark_context": {
    code: "route:benchmark_context",
    kind: "route",
    name: "Benchmark Context — explanation page",
    canonicalRoute: "/benchmark-context",
    learnRoute: "/benchmark-context",
    accessMode: "free_public",
    supportsBenchmarking: true,
    status: "active",
  },
  "route:return_brief": {
    code: "route:return_brief",
    kind: "route",
    name: "Return Brief — public explainer",
    canonicalRoute: "/return-brief",
    learnRoute: "/return-brief",
    accessMode: "free_public",
    supportsReturnBrief: true,
    status: "active",
  },
  "route:decision_centre": {
    code: "route:decision_centre",
    kind: "route",
    name: "Decision Centre",
    canonicalRoute: "/decision-centre",
    accessMode: "free_public",
    status: "active",
  },
  "route:boardroom_mode": {
    code: "route:boardroom_mode",
    kind: "route",
    name: "Boardroom Mode — explanation page",
    canonicalRoute: "/boardroom-mode",
    learnRoute: "/boardroom-mode",
    prerequisiteRoute: "/diagnostics/executive-reporting",
    accessMode: "evidence_gated",
    status: "active",
  },
  "route:oversight": {
    code: "route:oversight",
    kind: "route",
    name: "Retained Oversight",
    canonicalRoute: "/oversight",
    accessMode: "contracted",
    status: "active",
  },
};

// ─── Assembled graph ──────────────────────────────────────────────────────────

export const PRODUCT_KNOWLEDGE_GRAPH: Record<string, ProductGraphNode> = {
  ...buildProductNodes(),
  ...buildSurfaceNodes(),
  ...FEATURE_NODES,
  ...CAPABILITY_NODES,
  ...ROUTE_NODES,
};

// ─── Accessors ────────────────────────────────────────────────────────────────

export function getGraphNode(code: string): ProductGraphNode | undefined {
  return PRODUCT_KNOWLEDGE_GRAPH[code];
}

export function assertGraphNode(code: string): ProductGraphNode {
  const node = PRODUCT_KNOWLEDGE_GRAPH[code];
  if (!node) {
    throw new Error(
      `ProductKnowledgeGraph: no node found for code "${code}". ` +
        `Every user-facing feature, product, surface, and capability must be registered.`,
    );
  }
  return node;
}

export function getNodesByKind(kind: ProductGraphNode["kind"]): ProductGraphNode[] {
  return Object.values(PRODUCT_KNOWLEDGE_GRAPH).filter((n) => n.kind === kind);
}

export function getNodesByAccessMode(mode: GraphAccessMode): ProductGraphNode[] {
  return Object.values(PRODUCT_KNOWLEDGE_GRAPH).filter((n) => n.accessMode === mode);
}

export function getProductNodes(): ProductGraphNode[] {
  return getNodesByKind("product");
}

export function getFeatureNodes(): ProductGraphNode[] {
  return getNodesByKind("feature");
}

export function getSurfaceNodes(): ProductGraphNode[] {
  return getNodesByKind("surface");
}

/** All nodes that support benchmarking */
export function getBenchmarkNodes(): ProductGraphNode[] {
  return Object.values(PRODUCT_KNOWLEDGE_GRAPH).filter((n) => n.supportsBenchmarking);
}

/** All nodes that support Return Brief generation or consumption */
export function getReturnBriefNodes(): ProductGraphNode[] {
  return Object.values(PRODUCT_KNOWLEDGE_GRAPH).filter((n) => n.supportsReturnBrief);
}

/**
 * All distinct catalog product codes represented in the graph.
 * Used to verify complete catalog coverage.
 */
export function getRegisteredCatalogCodes(): Set<string> {
  return new Set(
    Object.values(PRODUCT_KNOWLEDGE_GRAPH)
      .filter((n) => n.kind === "product" && n.catalogCode)
      .map((n) => n.catalogCode as string),
  );
}

/**
 * All distinct surface IDs represented in the graph.
 * Used to verify complete surface registry coverage.
 */
export function getRegisteredSurfaceIds(): Set<string> {
  return new Set(
    Object.values(PRODUCT_KNOWLEDGE_GRAPH)
      .filter((n) => n.kind === "surface" && n.surfaceCode)
      .map((n) => n.surfaceCode as string),
  );
}
