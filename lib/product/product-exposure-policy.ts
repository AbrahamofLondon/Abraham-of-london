/**
 * lib/product/product-exposure-policy.ts
 *
 * Product exposure status rules for the Abraham of London product estate.
 *
 * A product's public exposure must be determined by its authority grade —
 * not by how good it looks or how long it has existed.
 *
 * Rules:
 *   - Grade ≥ 9: public_active — full commercial surface, checkout enabled
 *   - Grade = 8: public_limited — visible with capability warning; checkout allowed
 *   - Grade 6–7: controlled_access — discovery only; checkout blocked/waitlisted
 *   - Grade ≤ 5: admin_only — not discoverable outside admin
 *   - inactive products: dormant — visible in admin, hidden from public surface
 *   - explicitly retired: retired — no public surface, admin-only record
 *
 * Authority gaps must be DECLARED and recorded, not hidden.
 */

// ─── Exposure Status ──────────────────────────────────────────────────────────

export type ProductExposureStatus =
  | 'public_active'       // Grade ≥ 9: full commercial surface, checkout on
  | 'public_limited'      // Grade 8: visible, checkout on, capability caveat surfaced
  | 'controlled_access'   // Grade 6–7: discoverable, checkout off/waitlisted
  | 'admin_only'          // Grade ≤ 5: not discoverable outside /admin
  | 'dormant'             // inactive=true in estate: admin-only record
  | 'hidden'              // explicitly hidden from all surfaces
  | 'retired'             // decommissioned: admin record only

// ─── Authority Dimension ──────────────────────────────────────────────────────

/**
 * The 8 dimensions that determine whether a product has true 10/10 authority.
 * Each dimension is either PASS, PARTIAL, or FAIL.
 */
export type AuthorityDimensionResult = 'PASS' | 'PARTIAL' | 'FAIL'

export type AuthorityDimension =
  | 'route'               // Canonical route exists, no competing/redirected duplicates
  | 'runtime_truth'       // All state derived from DB, not fixtures or static files
  | 'commercial'          // Price, catalog, Stripe refs, and checkout CTA are consistent
  | 'fulfilment'          // Delivery artifact persisted; fulfilment audit trail exists
  | 'evidence_input'      // Input data validated; entitlement checked before delivery
  | 'admin'               // Admin visibility into orders, runs, and delivery status
  | 'test'                // Test coverage for purchase, fulfilment, and evidence paths
  | 'market_authority'    // Product claims are provable; no fixture data in paid output

export interface AuthorityDimensionScore {
  dimension: AuthorityDimension
  result: AuthorityDimensionResult
  note: string
}

// ─── Product Authority Score ──────────────────────────────────────────────────

export interface ProductAuthorityScore {
  productCode: string
  productName: string
  realityGrade: number                    // 0–10 integer from reality audit
  exposureStatus: ProductExposureStatus
  dimensions: AuthorityDimensionScore[]
  authorityGaps: string[]                 // Human-readable gap list (FAIL or PARTIAL dims)
  checkoutAllowed: boolean
  requiresWaitlist: boolean
  publicDiscoverable: boolean
  adminOnly: boolean
}

// ─── Exposure Thresholds ──────────────────────────────────────────────────────

export const EXPOSURE_THRESHOLDS = {
  PUBLIC_ACTIVE_MIN: 9,
  PUBLIC_LIMITED_MIN: 8,
  CONTROLLED_ACCESS_MIN: 6,
} as const

// ─── Exposure Classification ──────────────────────────────────────────────────

/**
 * Derive exposure status from a product's reality grade and active flag.
 * Inactive products are always `dormant` regardless of grade.
 */
export function classifyExposureStatus(
  grade: number,
  active: boolean,
): ProductExposureStatus {
  if (!active) return 'dormant'
  if (grade >= EXPOSURE_THRESHOLDS.PUBLIC_ACTIVE_MIN) return 'public_active'
  if (grade >= EXPOSURE_THRESHOLDS.PUBLIC_LIMITED_MIN) return 'public_limited'
  if (grade >= EXPOSURE_THRESHOLDS.CONTROLLED_ACCESS_MIN) return 'controlled_access'
  return 'admin_only'
}

/**
 * Whether a product with this exposure status may show a checkout/purchase CTA.
 */
export function isCheckoutAllowed(status: ProductExposureStatus): boolean {
  return status === 'public_active' || status === 'public_limited'
}

/**
 * Whether a product with this exposure status should be discoverable on public pages.
 */
export function isPublicDiscoverable(status: ProductExposureStatus): boolean {
  return status === 'public_active' || status === 'public_limited' || status === 'controlled_access'
}

/**
 * Whether a product should show a waitlist CTA instead of a live checkout.
 */
export function requiresWaitlist(status: ProductExposureStatus): boolean {
  return status === 'controlled_access'
}

/**
 * Whether a product is restricted to /admin only.
 */
export function isAdminOnly(status: ProductExposureStatus): boolean {
  return status === 'admin_only' || status === 'dormant' || status === 'hidden' || status === 'retired'
}

// ─── Authority Grade Policy ───────────────────────────────────────────────────

/**
 * The minimum grade required before a paid product may accept new purchases.
 * Products below this threshold must block checkout and show a waitlist or
 * a clear capability caveat.
 *
 * This threshold does NOT prevent admin use or internal testing.
 */
export const CHECKOUT_AUTHORITY_THRESHOLD = EXPOSURE_THRESHOLDS.PUBLIC_LIMITED_MIN

/**
 * The minimum grade required for a product to be presented as a flagship
 * offer without caveats. Below 9, a product-level caveat must be shown.
 */
export const FLAGSHIP_AUTHORITY_THRESHOLD = EXPOSURE_THRESHOLDS.PUBLIC_ACTIVE_MIN

/**
 * The minimum grade for a product to appear on the /products public directory
 * without an authority gap notice.
 */
export const DIRECTORY_CLEAN_THRESHOLD = EXPOSURE_THRESHOLDS.PUBLIC_LIMITED_MIN

// ─── Current Estate Grades ────────────────────────────────────────────────────

/**
 * Current reality grades by product code.
 * Source: lib/product/product-estate-reality-audit.json
 * Updated: 2026-06-07
 *
 * These are the grades BEFORE this session's upgrades.
 * Update when a product authority sprint closes.
 */
export const CURRENT_ESTATE_GRADES: Record<string, number> = {
  decision_pressure_signal: 6,
  boardroom_brief: 8,
  strategy_room: 8,
  executive_reporting: 8,
  decision_instruments: 6,
  professional: 8,
  retainer_oversight: 7,
  inner_circle: 6,
  gmi_quarterly: 8,
  briefs_vault_editorial: 8,
}

/**
 * Products that are inactive (not live) in the current estate.
 * Inactive products are shown as dormant regardless of grade.
 */
export const INACTIVE_PRODUCTS = new Set<string>([
  'retainer_oversight',
  'inner_circle',
])

/**
 * Products that have been permanently retired or hidden.
 * Not shown on any public surface.
 */
export const RETIRED_PRODUCTS = new Set<string>([])

// ─── Full Estate Exposure Map ─────────────────────────────────────────────────

/**
 * Derive the current exposure status for every product in the estate.
 */
export function getEstateExposureMap(): Record<string, ProductExposureStatus> {
  const result: Record<string, ProductExposureStatus> = {}
  for (const [code, grade] of Object.entries(CURRENT_ESTATE_GRADES)) {
    if (RETIRED_PRODUCTS.has(code)) {
      result[code] = 'retired'
      continue
    }
    const active = !INACTIVE_PRODUCTS.has(code)
    result[code] = classifyExposureStatus(grade, active)
  }
  return result
}

/**
 * Get all products whose exposure status is controlled_access or below.
 * These products may appear publicly but must NOT have live checkout CTAs.
 */
export function getProductsRequiringWaitlist(): string[] {
  return Object.entries(getEstateExposureMap())
    .filter(([, status]) => requiresWaitlist(status))
    .map(([code]) => code)
}

/**
 * Get all products that are fully blocked from public discovery.
 */
export function getAdminOnlyProducts(): string[] {
  return Object.entries(getEstateExposureMap())
    .filter(([, status]) => isAdminOnly(status))
    .map(([code]) => code)
}

/**
 * Validate that a product's checkout CTA is allowed given its current grade.
 * Throws if checkout would be shown for an under-authority product.
 */
export function assertCheckoutAuthorised(productCode: string): void {
  const grade = CURRENT_ESTATE_GRADES[productCode]
  if (grade === undefined) {
    throw new Error(`assertCheckoutAuthorised: unknown product code "${productCode}"`)
  }
  const active = !INACTIVE_PRODUCTS.has(productCode)
  const status = classifyExposureStatus(grade, active)
  if (!isCheckoutAllowed(status)) {
    throw new Error(
      `assertCheckoutAuthorised: product "${productCode}" has grade ${grade} (status: ${status}). ` +
      `Checkout requires grade ≥ ${CHECKOUT_AUTHORITY_THRESHOLD}. ` +
      `Show a waitlist or capability caveat instead.`,
    )
  }
}
