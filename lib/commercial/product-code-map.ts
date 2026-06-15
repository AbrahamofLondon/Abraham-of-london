/**
 * lib/commercial/product-code-map.ts
 *
 * Explicit mapping from governance product codes (ProductAuthorityContract /
 * release matrices) to commercial CATALOG keys. Governance codes and catalog
 * keys are NOT assumed to be identical — every relationship is declared here.
 *
 * GMI follows Option A: `gmi_quarterly` is a recurring FAMILY product. It maps
 * to a family wrapper catalog entry and explicitly names the current active
 * quarter artifact for fulfilment. `gmi_q2_2026` is never silently treated as
 * `gmi_quarterly`.
 */

export type CatalogResolution = {
  /** Governance product code. */
  governanceCode: string;
  /** Primary CATALOG key the governance product resolves to (or null = gap). */
  catalogKey: string | null;
  /**
   * For a family product, the dedicated product-family page it resolves to.
   * This is the storefront-facing surface — NOT a single issue artifact.
   */
  dedicatedRoute?: string;
  /**
   * Issue/artifact CATALOG keys this family grants ENTITLEMENT to. These are the
   * issues access attaches to — they are NOT the resolution target of the family
   * product. The family is never silently aliased to one of these.
   */
  entitlementIssueKeys?: string[];
  /** For family products: the current active issue artifact key. */
  currentIssueKey?: string | null;
  /** The archived/verified issue artifact keys. */
  archivedIssueKeys?: string[];
  /** Additional/alias CATALOG keys. */
  aliasKeys: string[];
  /** Declared, known storefront gap (no catalog entry yet). */
  declaredGap?: boolean;
  notes?: string;
};

/**
 * Current PUBLISHED quarterly GMI issue artifact.
 * Q1 2026 is the current published issue. Q2 2026 is a production release
 * candidate (publication target 2026-07-08) and is NOT current until published.
 * Advance this only when the next issue actually publishes.
 */
export const CURRENT_GMI_QUARTER_KEY = "gmi_q1_2026";
/** Forthcoming (not-yet-published) GMI issue and its publication target. */
export const FORTHCOMING_GMI_QUARTER_KEY = "gmi_q2_2026";
export const FORTHCOMING_GMI_PUBLICATION_TARGET = "2026-07-08";

/** Dedicated GMI product-family page — the storefront-facing GMI surface. */
export const GMI_FAMILY_ROUTE = "/intelligence/gmi";

/**
 * Authoritative governance-code → catalog mapping.
 * Keys are governance productCodes; values declare the catalog relationship.
 */
export const PRODUCT_CODE_MAP: Record<string, CatalogResolution> = {
  fast_diagnostic: {
    governanceCode: "fast_diagnostic",
    catalogKey: "fast_diagnostic",
    aliasKeys: [],
  },
  enterprise_assessment: {
    governanceCode: "enterprise_assessment",
    catalogKey: "enterprise_assessment",
    aliasKeys: [],
  },
  gmi_quarterly: {
    governanceCode: "gmi_quarterly",
    catalogKey: "gmi_quarterly",
    dedicatedRoute: GMI_FAMILY_ROUTE,
    entitlementIssueKeys: ["gmi_q1_2026", "gmi_q2_2026"],
    currentIssueKey: CURRENT_GMI_QUARTER_KEY, // gmi_q1_2026 (Q2 is a forthcoming RC)
    archivedIssueKeys: [],
    aliasKeys: [],
    notes:
      "Canonical GMI product family. Resolves to the dedicated GMI page (/intelligence/gmi), " +
      "which surfaces the current issue (gmi_q2_2026), the verified archive (gmi_q1_2026), " +
      "methodology, and entitlement/access logic. Access/checkout attaches to the family; " +
      "fulfilment grants entitlement to the current issue and archive per access rules. " +
      "Never silently aliased to gmi_q2_2026 — the issue artifacts resolve independently.",
  },
  reporting_monthly: {
    governanceCode: "reporting_monthly",
    catalogKey: "reporting_monthly",
    aliasKeys: [],
    notes: "Catalog entry added without live Stripe IDs; resolver gates to non-checkout until supplied.",
  },
  reporting_custom: {
    governanceCode: "reporting_custom",
    catalogKey: "reporting_custom",
    aliasKeys: [],
    notes: "Catalog entry added without live Stripe IDs; resolver gates to non-checkout until supplied.",
  },
  boardroom_brief: {
    governanceCode: "boardroom_brief",
    catalogKey: "boardroom_brief",
    aliasKeys: [],
    notes: "Has Stripe IDs but governance-blocked; resolver must return blocked/review_gated.",
  },
  executive_reporting: {
    governanceCode: "executive_reporting",
    catalogKey: "executive_reporting",
    aliasKeys: [],
    notes: "Has Stripe IDs but governance-blocked; resolver must return blocked/review_gated.",
  },
};

/** Resolve a governance code to its catalog relationship (null if undeclared). */
export function resolveCatalogForGovernanceCode(code: string): CatalogResolution | null {
  return PRODUCT_CODE_MAP[code] || null;
}

/** Reverse lookup: which governance code does a catalog key belong to (if declared). */
export function governanceCodeForCatalogKey(catalogKey: string): string | null {
  for (const res of Object.values(PRODUCT_CODE_MAP)) {
    if (res.catalogKey === catalogKey || res.aliasKeys.includes(catalogKey)) {
      return res.governanceCode;
    }
  }
  return null;
}
