/**
 * lib/fulfilment/estate-observation-layer.ts
 *
 * LAYER A — OBSERVATION
 *
 * Raw facts collected independently of any product disposition.
 * No final product verdicts here. No evaluation. Just facts.
 *
 * Each observation function checks one thing and returns a boolean.
 * Observations are independent — they don't read from evidence records.
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { getContractByProductCode } from "../product/product-fulfilment-contract";
import { getAssuranceByProductCode } from "../product/product-fulfilment-assurance";
import { CATALOG, resolveProductCode } from "../commercial/catalog";

const CWD = process.cwd();

// ── Filesystem observations ────────────────────────────────────────────────

export function observeFileExists(relativePath: string): boolean {
  try {
    return existsSync(join(CWD, relativePath));
  } catch {
    return false;
  }
}

export function observeDirectoryExists(relativePath: string): boolean {
  try {
    const full = join(CWD, relativePath);
    return existsSync(full) && statSync(full).isDirectory();
  } catch {
    return false;
  }
}

export function observeDirectoryHasFiles(relativePath: string): boolean {
  try {
    const full = join(CWD, relativePath);
    if (!existsSync(full) || !statSync(full).isDirectory()) return false;
    return readdirSync(full).length > 0;
  } catch {
    return false;
  }
}

// ── Route observations ─────────────────────────────────────────────────────

/**
 * Observe whether a route path has a real Next.js implementation.
 * Uses actual filesystem routing semantics, not URL path manufacture.
 */
/**
 * Try to find a route implementation by walking the pages/app directory
 * and matching against the route path segments, supporting dynamic segments.
 */
function findRouteImplementation(clean: string): { exists: boolean; implementationPath: string | null } {
  // Direct match first
  const directPatterns = [
    `pages/${clean}.tsx`, `pages/${clean}.ts`,
    `pages/${clean}/index.tsx`, `pages/${clean}/index.ts`,
    `app/${clean}/page.tsx`, `app/${clean}/page.ts`,
    `app/${clean}/route.tsx`, `app/${clean}/route.ts`,
    `app/${clean}.tsx`, `app/${clean}.ts`,
  ];
  for (const p of directPatterns) {
    if (existsSync(join(CWD, p))) return { exists: true, implementationPath: p };
  }

  // For multi-segment paths, try making each segment dynamic
  // e.g., /decision-instruments/decision-exposure-instrument → pages/decision-instruments/[slug].tsx
  const segments = clean.split("/");
  
  // Try all combinations of static and dynamic segments
  // For each position, try [param] where param could be slug, id, etc.
  const paramNames = ["slug", "id", "param", "name", "key", "token", "caseId", "runId", "instrument"];
  
  for (let dynamicPos = 0; dynamicPos < segments.length; dynamicPos++) {
    for (const paramName of paramNames) {
      const before = segments.slice(0, dynamicPos).join("/");
      const after = segments.slice(dynamicPos + 1).join("/");
      
      const patterns = [];
      if (after) {
        patterns.push(
          `pages/${before}/[${paramName}]/${after}.tsx`,
          `pages/${before}/[${paramName}]/${after}/index.tsx`,
          `app/${before}/[${paramName}]/${after}/page.tsx`,
          `app/${before}/[${paramName}]/${after}/route.tsx`,
        );
      } else {
        patterns.push(
          `pages/${before}/[${paramName}].tsx`,
          `pages/${before}/[${paramName}]/index.tsx`,
          `app/${before}/[${paramName}]/page.tsx`,
          `app/${before}/[${paramName}]/route.tsx`,
        );
      }
      
      for (const p of patterns) {
        if (existsSync(join(CWD, p))) return { exists: true, implementationPath: p };
      }
    }
  }

  // Try catch-all routes [...slug]
  for (let i = 0; i < segments.length; i++) {
    const prefix = segments.slice(0, i).join("/");
    const patterns = [
      `pages/${prefix}/[...slug].tsx`,
      `pages/${prefix}/[...slug]/index.tsx`,
      `app/${prefix}/[...slug]/page.tsx`,
      `app/${prefix}/[...slug]/route.tsx`,
    ];
    for (const p of patterns) {
      if (existsSync(join(CWD, p))) return { exists: true, implementationPath: p };
    }
  }

  return { exists: false, implementationPath: null };
}

export function observeRouteExists(routePath: string): {
  exists: boolean;
  implementationPath: string | null;
} {
  const clean = routePath.replace(/^\//, "").replace(/\/$/, "");
  if (!clean) return { exists: true, implementationPath: null };
  return findRouteImplementation(clean);
}

// ── Commercial observations ────────────────────────────────────────────────

export function observeProductInCatalog(productCode: string): boolean {
  return CATALOG[productCode] !== undefined;
}

export function observeProductHasStripePriceId(productCode: string): boolean {
  const product = CATALOG[productCode];
  return product !== undefined && product.stripePriceId !== null && product.stripePriceId !== undefined;
}

export function observeProductHasStripeProductId(productCode: string): boolean {
  const product = CATALOG[productCode];
  return product !== undefined && product.stripeProductId !== null && product.stripeProductId !== undefined;
}

export function observeProductIsActive(productCode: string): boolean {
  const product = CATALOG[productCode];
  return product !== undefined && product.active === true;
}

export function observeProductHasCheckoutRoute(productCode: string): boolean {
  const product = CATALOG[productCode];
  if (!product) return false;
  // A product has a checkout route if it has a stripePriceId and is active
  return product.stripePriceId !== null && product.active === true;
}

export function observeProductCommercialStatus(productCode: string): string | null {
  const product = CATALOG[productCode];
  return product?.commercialStatus ?? null;
}

// ── Fulfilment observations ────────────────────────────────────────────────

export function observeFulfilmentContractExists(productCode: string): boolean {
  return getContractByProductCode(productCode) !== undefined;
}

export function observeAssuranceRecordExists(productCode: string): boolean {
  return getAssuranceByProductCode(productCode) !== undefined;
}

export function observeFulfilmentContractHasHandler(productCode: string): boolean {
  const contract = getContractByProductCode(productCode);
  if (!contract) return false;
  // A contract has a handler if it has a fulfilmentType and deliveryModel
  return contract.fulfilmentType !== undefined && contract.deliveryModel !== undefined;
}

export function observeContractHasAdminRoute(productCode: string): boolean {
  const contract = getContractByProductCode(productCode);
  return contract?.adminRoute !== null && contract?.adminRoute !== undefined;
}

export function observeContractHasCustomerAccessRoute(productCode: string): boolean {
  const contract = getContractByProductCode(productCode);
  return contract?.customerAccessRoute !== null && contract?.customerAccessRoute !== undefined;
}

// ── Test observations ──────────────────────────────────────────────────────

export function observeTestFileExists(testPath: string): boolean {
  return observeFileExists(testPath);
}

export function observeTestDirectoryHasTests(testDir: string): boolean {
  return observeDirectoryHasFiles(testDir);
}

// ── Pricing observations ───────────────────────────────────────────────────

export function observeProductDisplayPrice(productCode: string): string | null {
  const product = CATALOG[productCode];
  return product?.displayPrice ?? null;
}

export function observeProductAmount(productCode: string): number | null {
  const product = CATALOG[productCode];
  return product?.amount ?? null;
}

// ── Product identity observations ──────────────────────────────────────────

export function observeProductIdentity(productCode: string): {
  exists: boolean;
  displayName: string | null;
  entitlementSlug: string | null;
  category: string | null;
} {
  const product = CATALOG[productCode];
  if (!product) return { exists: false, displayName: null, entitlementSlug: null, category: null };
  return {
    exists: true,
    displayName: product.displayName,
    entitlementSlug: product.entitlementSlug,
    category: product.category,
  };
}

// ── Aggregate observation ──────────────────────────────────────────────────

export type ProductObservations = {
  productCode: string;
  inCatalog: boolean;
  isActive: boolean;
  commercialStatus: string | null;
  hasStripePriceId: boolean;
  hasStripeProductId: boolean;
  displayPrice: string | null;
  amount: number | null;
  fulfilmentContractExists: boolean;
  assuranceRecordExists: boolean;
  contractHasHandler: boolean;
  contractHasAdminRoute: boolean;
  contractHasCustomerAccessRoute: boolean;
  routeResolved: { exists: boolean; implementationPath: string | null };
};

export function observeAll(productCode: string): ProductObservations {
  const route = observeRouteExists(`/${productCode.replace(/_/g, "-")}`);
  return {
    productCode,
    inCatalog: observeProductInCatalog(productCode),
    isActive: observeProductIsActive(productCode),
    commercialStatus: observeProductCommercialStatus(productCode),
    hasStripePriceId: observeProductHasStripePriceId(productCode),
    hasStripeProductId: observeProductHasStripeProductId(productCode),
    displayPrice: observeProductDisplayPrice(productCode),
    amount: observeProductAmount(productCode),
    fulfilmentContractExists: observeFulfilmentContractExists(productCode),
    assuranceRecordExists: observeAssuranceRecordExists(productCode),
    contractHasHandler: observeFulfilmentContractHasHandler(productCode),
    contractHasAdminRoute: observeContractHasAdminRoute(productCode),
    contractHasCustomerAccessRoute: observeContractHasCustomerAccessRoute(productCode),
    routeResolved: route,
  };
}
