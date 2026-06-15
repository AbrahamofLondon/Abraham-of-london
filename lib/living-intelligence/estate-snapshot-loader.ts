/**
 * lib/living-intelligence/estate-snapshot-loader.ts
 *
 * Loads a complete unified snapshot of the Abraham of London estate from all
 * authoritative sources. This is the data layer that feeds every contradiction
 * detector, intervention classifier, and report composer.
 *
 * Sources loaded:
 *   - ProductAuthorityContract (data/ProductAuthorityContract.json)
 *   - Release readiness matrix (reports/product-release-readiness-matrix.json)
 *   - Release governance matrix (reports/product-release-governance-matrix.json)
 *   - CATALOG (lib/commercial/catalog.ts — parsed via regex mirror)
 *   - GMI edition registry (lib/commercial/gmi/gmi-edition-registry.ts — parsed via regex mirror)
 *   - Market intelligence lifecycle (lib/intelligence/market-intelligence-lifecycle.ts — parsed via regex mirror)
 *   - Contentlayer generated indexes (.contentlayer/generated/<Type>/_index.json)
 *   - Content source files (content/<family>/)
 *   - Environment variables
 *
 * Pure read operations. No mutations. No I/O to production databases.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type {
  EstateSnapshot,
  ProductSnapshot,
  GmiEditionSnapshot,
  ContentFamilySnapshot,
  BuildSnapshot,
  ProductAuthorityState,
  CommercialStatus,
  GmiEditionStatus,
  LifecycleState,
  ReadinessStatus,
  ResolverActionState,
} from "./estate-state-contract";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

// ─── File reading helpers ────────────────────────────────────────────────────

function readJsonSafe(relPath: string): unknown {
  const abs = path.join(ROOT, relPath);
  try {
    if (!fs.existsSync(abs)) return null;
    return JSON.parse(fs.readFileSync(abs, "utf-8"));
  } catch {
    return null;
  }
}

function readTextSafe(relPath: string): string {
  const abs = path.join(ROOT, relPath);
  try {
    if (!fs.existsSync(abs)) return "";
    return fs.readFileSync(abs, "utf-8");
  } catch {
    return "";
  }
}

function exists(relPath: string): boolean {
  return fs.existsSync(path.join(ROOT, relPath));
}

// ─── CATALOG parser (regex mirror of catalog.ts literal blocks) ──────────────

function parseCatalogProducts(): Record<string, Record<string, unknown>> {
  const text = readTextSafe("lib/commercial/catalog.ts");
  const products: Record<string, Record<string, unknown>> = {};

  const blockRe = /^  ([a-z][a-z0-9_]*):\s*\{([\s\S]*?)^  \},?$/gm;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(text)) !== null) {
    const key = m[1]!;
    const body = m[2]!!;
    if (!/\bcode:/.test(body)) continue; // skip non-product blocks (e.g. _GMI_PRODUCTS spread)

    const str = (f: string): string | null => {
      const r = body.match(new RegExp(`${f}:\\s*"([^"]*)"`));
      return r ? (r[1] ?? null) : null;
    };
    const nullable = (f: string): string | null => {
      const r = body.match(new RegExp(`${f}:\\s*"([^"]*)"`));
      if (r) return r[1] ?? null;
      // Check for explicit null
      if (new RegExp(`${f}:\\s*null`).test(body)) return null;
      return null;
    };
    const num = (f: string): number | null => {
      const r = body.match(new RegExp(`${f}:\\s*(-?\\d+)`));
      return r ? Number(r[1] ?? 0) : null;
    };
    const bool = (f: string): boolean | undefined => {
      const r = body.match(new RegExp(`${f}:\\s*(true|false)`));
      return r ? r[1] === "true" : undefined;
    };

    products[key] = {
      code: str("code") || key,
      displayName: str("displayName"),
      amount: num("amount"),
      displayPrice: str("displayPrice"),
      stripeProductId: nullable("stripeProductId"),
      stripePriceId: nullable("stripePriceId"),
      commercialStatus: str("commercialStatus"),
      accessType: str("accessType"),
      active: bool("active"),
      requiresCheckout: bool("requiresCheckout"),
      requiresContract: bool("requiresContract"),
      successPath: str("successPath"),
      cancelPath: str("cancelPath"),
      primaryCta: str("primaryCta"),
      pricingFamily: str("pricingFamily"),
      hiddenFromPricing: bool("hiddenFromPricing"),
    };
  }

  return products;
}

// ─── GMI Edition Registry parser ─────────────────────────────────────────────

function parseGmiEditionRegistry(): Record<string, unknown>[] {
  const text = readTextSafe("lib/commercial/gmi/gmi-edition-registry.ts");
  const editions: Record<string, unknown>[] = [];

  // Match each registry entry object
  const entryRe = /\{\s*\n\s*\/\/[^]*?editionId:\s*"([^"]+)"/g;
  let m: RegExpExecArray | null;

  // Simpler approach: extract the array entries
  const arrayStart = text.indexOf("export const GMI_EDITION_REGISTRY");
  if (arrayStart === -1) return [];

  const arrayText = text.slice(arrayStart);
  // Find each block starting with { and ending with },
  const blockRe = /\{\s*\n([\s\S]*?)\n\s*\},?/g;
  let bm: RegExpExecArray | null;
  while ((bm = blockRe.exec(arrayText)) !== null) {
    const body = bm[1]!;
    const str = (f: string): string | null => {
      const r = body.match(new RegExp(`${f}:\\s*"([^"]*)"`));
      return r ? (r[1] ?? null) : null;
    };
    const bool = (f: string): boolean | undefined => {
      const r = body.match(new RegExp(`${f}:\\s*(true|false)`));
      return r ? r[1] === "true" : undefined;
    };
    const nullable = (f: string): string | null => {
      const r = body.match(new RegExp(`${f}:\\s*"([^"]*)"`));
      if (r) return r[1] ?? null;
      if (new RegExp(`${f}:\\s*null`).test(body)) return null;
      return null;
    };

    const editionId = str("editionId");
    if (!editionId) continue;

    editions.push({
      editionId,
      productCode: str("productCode"),
      quarter: str("quarter"),
      year: (() => { const r = body.match(/year:\s*(\d{4})/); return r ? Number(r[1]) : null; })(),
      title: str("title"),
      slug: str("slug"),
      status: str("status"),
      current: bool("current"),
      hiddenFromPricing: bool("hiddenFromPricing"),
      hiddenReason: str("hiddenReason"),
      stripeProductId: nullable("stripeProductId"),
      stripePriceId: nullable("stripePriceId"),
      amountGbp: (() => { const r = body.match(/amountGbp:\s*(\d+)/); return r ? Number(r[1]) : null; })(),
      displayPrice: str("displayPrice"),
      releaseDate: str("releaseDate"),
      shortDescription: str("shortDescription"),
      pricingNote: str("pricingNote"),
    });
  }

  return editions;
}

// ─── Market Intelligence Lifecycle parser ────────────────────────────────────

function parseMarketIntelligenceLifecycle(): Record<string, unknown>[] {
  const text = readTextSafe("lib/intelligence/market-intelligence-lifecycle.ts");
  const records: Record<string, unknown>[] = [];

  // Find the MARKET_INTELLIGENCE_LIFECYCLE array
  const arrayStart = text.indexOf("MARKET_INTELLIGENCE_LIFECYCLE:");
  if (arrayStart === -1) return records;

  const arrayText = text.slice(arrayStart);
  const blockRe = /\{\s*\n([\s\S]*?)\n\s*\},?/g;
  let bm: RegExpExecArray | null;
  while ((bm = blockRe.exec(arrayText)) !== null) {
    const body = bm[1]!;
    const str = (f: string): string | null => {
      const r = body.match(new RegExp(`${f}:\\s*"([^"]*)"`));
      return r ? (r[1] ?? null) : null;
    };
    const bool = (f: string): boolean | undefined => {
      const r = body.match(new RegExp(`${f}:\\s*(true|false)`));
      return r ? r[1] === "true" : undefined;
    };

    const id = str("id");
    if (!id) continue;

    records.push({
      id,
      title: str("title"),
      quarter: str("quarter"),
      year: (() => { const r = body.match(/year:\s*(\d{4})/); return r ? Number(r[1]) : null; })(),
      lifecycleState: str("lifecycleState"),
      publishedAt: str("publishedAt"),
      updatedAt: str("updatedAt"),
      purchasable: bool("purchasable"),
      publicVisible: bool("publicVisible"),
      archiveVisible: bool("archiveVisible"),
      supersededBy: str("supersededBy"),
      replaces: str("replaces"),
      nextExpected: str("nextExpected"),
      publicHref: str("publicHref"),
      institutionalHref: str("institutionalHref"),
      boardHref: str("boardHref"),
      coveragePeriod: str("coveragePeriod"),
      decisionWindow: str("decisionWindow"),
      freshnessNote: str("freshnessNote"),
    });
  }

  return records;
}

// ─── Contentlayer index loader ───────────────────────────────────────────────

function loadContentlayerIndex(typeDir: string): unknown[] {
  const p = path.join(ROOT, ".contentlayer", "generated", typeDir, "_index.json");
  try {
    if (!fs.existsSync(p)) return [];
    const data = JSON.parse(fs.readFileSync(p, "utf-8"));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function countContentFiles(subdir: string): number {
  const dir = path.join(ROOT, "content", subdir);
  try {
    if (!fs.existsSync(dir)) return 0;
    let count = 0;
    const walk = (d: string) => {
      for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
        if (entry.isDirectory()) walk(path.join(d, entry.name));
        else if (/\.mdx?$/i.test(entry.name) && !entry.name.startsWith("_")) count++;
      }
    };
    walk(dir);
    return count;
  } catch {
    return 0;
  }
}

// ─── Resolver mirror (simplified) ────────────────────────────────────────────

function isFreeCatalog(p: Record<string, unknown>): boolean {
  const cs = String(p.commercialStatus || "");
  if (["manual_billing", "contracted", "paid", "evidence_gated"].includes(cs)) return false;
  return cs === "free_controlled" || String(p.accessType || "") === "free" || (Number(p.amount ?? 0) <= 0);
}

function hasValidStripe(p: Record<string, unknown>): boolean {
  return Boolean(p.stripePriceId && (Number(p.amount ?? 0) > 0));
}

function resolveCommercialAction(
  product: Record<string, unknown>,
  readiness: Record<string, unknown> | null,
  governance: Record<string, unknown> | null,
): { state: ResolverActionState; purchasable: boolean } {
  const cs = String(product.commercialStatus || "");
  const active = product.active !== false;
  const lane = String(readiness?.releaseLane || governance?.releaseLane || "");
  const mode = String(readiness?.releaseMode || governance?.releaseMode || "");

  // Inactive/retired
  if (!active || cs === "inactive" || cs === "retired") {
    return { state: "archive_reference_only", purchasable: false };
  }

  // Governance hard block
  if (
    String(readiness?.readinessStatus || "") === "blocked" ||
    mode === "blocked" ||
    lane.startsWith("blocked")
  ) {
    return { state: "blocked", purchasable: false };
  }

  // internal_only
  if (mode === "internal_only") {
    return { state: "blocked", purchasable: false };
  }

  // checkoutSafe false
  if (readiness?.checkoutSafe === false) {
    return { state: "review_gated", purchasable: false };
  }

  // commercialSafe false
  if (readiness?.commercialSafe === false) {
    return { state: "review_gated", purchasable: false };
  }

  // checkoutAllowed false
  if (governance?.checkoutAllowed === false && mode !== "manual_fulfilment_only") {
    return { state: "review_gated", purchasable: false };
  }

  // Contracted
  if (cs === "contracted" || product.requiresContract === true) {
    return { state: "contact_sales", purchasable: false };
  }

  // Free
  if (isFreeCatalog(product)) {
    return { state: "view_free_surface", purchasable: false };
  }

  // Manual fulfilment
  if (mode === "manual_fulfilment_only" || cs === "manual_billing") {
    return { state: "manual_fulfilment", purchasable: false };
  }

  // Paid checkout-intended
  if (cs === "paid" && product.requiresCheckout === true) {
    if (!hasValidStripe(product)) {
      return { state: "unavailable", purchasable: false };
    }
    return { state: "checkout", purchasable: true };
  }

  return { state: "request_access", purchasable: false };
}

// ─── Env var checker ─────────────────────────────────────────────────────────

const BUILD_CRITICAL_ENV_VARS = [
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "DATABASE_URL",
  "DIRECT_URL",
  "NEXT_PUBLIC_SITE_URL",
  "SITE_URL",
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
];

function checkEnvVars(): Record<string, { present: boolean; malformed: boolean }> {
  const result: Record<string, { present: boolean; malformed: boolean }> = {};
  for (const name of BUILD_CRITICAL_ENV_VARS) {
    const val = process.env[name];
    const present = val !== undefined && val !== null && val !== "";
    const malformed = present && (
      (name === "NEXTAUTH_URL" && !String(val).startsWith("http")) ||
      (name === "NEXT_PUBLIC_SITE_URL" && !String(val).startsWith("http")) ||
      (name === "SITE_URL" && !String(val).startsWith("http"))
    );
    result[name] = { present, malformed: malformed ?? false };
  }
  return result;
}

// ─── Main loader ─────────────────────────────────────────────────────────────

export function loadEstateSnapshot(): EstateSnapshot {
  // Load matrices
  const readinessMatrix = (readJsonSafe("reports/product-release-readiness-matrix.json") as Record<string, Record<string, unknown>> | null) ?? {};
  const governanceMatrix = (readJsonSafe("reports/product-release-governance-matrix.json") as Record<string, Record<string, unknown>> | null) ?? {};
  const authorityContract = (readJsonSafe("data/ProductAuthorityContract.json") as Record<string, Record<string, unknown>> | null) ?? {};

  // Load CATALOG
  const catalogProducts = parseCatalogProducts();

  // Load GMI registry
  const gmiRegistryEntries = parseGmiEditionRegistry();

  // Load lifecycle
  const lifecycleRecords = parseMarketIntelligenceLifecycle();
  const lifecycleById: Record<string, Record<string, unknown>> = {};
  for (const rec of lifecycleRecords) {
    lifecycleById[String(rec.id)] = rec;
  }

  // Build product snapshots
  const allGovernanceCodes = Array.from(
    new Set([...Object.keys(readinessMatrix), ...Object.keys(governanceMatrix)]),
  ).sort();

  const allCatalogCodes = Object.keys(catalogProducts);
  const governanceOnlyCodes = allGovernanceCodes.filter((c) => !(c in catalogProducts));
  const catalogOnlyCodes = allCatalogCodes.filter((c) => !(c in readinessMatrix) && !(c in governanceMatrix));

  const products: Record<string, ProductSnapshot> = {};

  // Process all governance codes
  for (const code of allGovernanceCodes) {
    const r = (readinessMatrix[code] ?? {}) as Record<string, unknown>;
    const g = (governanceMatrix[code] ?? {}) as Record<string, unknown>;
    const a = (authorityContract[code] ?? {}) as Record<string, unknown>;
    const c = catalogProducts[code] ?? {};

    const readinessStatus = String(r.readinessStatus ?? "");
    const releaseMode = String(r.releaseMode ?? g.releaseMode ?? "");
    const releaseLane = String(r.releaseLane ?? g.releaseLane ?? "");

    const action = resolveCommercialAction(c, r, g);

    products[code] = {
      productCode: code,
      productName: String(c.displayName ?? a.productName ?? code),
      authorityState: (String(a.currentAuthorityState ?? "") || null) as ProductAuthorityState | null,
      commercialStatus: (String(c.commercialStatus ?? "") || null) as CommercialStatus | null,
      hasStripeProductId: Boolean(c.stripeProductId),
      hasStripePriceId: Boolean(c.stripePriceId),
      active: c.active !== false,
      requiresCheckout: c.requiresCheckout === true,
      readinessStatus: readinessStatus || null,
      releaseReadyNow: r.releaseReadyNow === true,
      checkoutSafe: r.checkoutSafe === true ? true : r.checkoutSafe === false ? false : null,
      commercialSafe: r.commercialSafe === true ? true : r.commercialSafe === false ? false : null,
      releaseLane: releaseLane || null,
      releaseMode: releaseMode || null,
      checkoutAllowed: g.checkoutAllowed === true ? true : g.checkoutAllowed === false ? false : null,
      resolverAction: action.state,
      resolverPurchasable: action.purchasable,
    };
  }

  // Process catalog-only codes
  for (const code of catalogOnlyCodes) {
    const c = catalogProducts[code] ?? {};
    const action = resolveCommercialAction(c, null, null);

    products[code] = {
      productCode: code,
      productName: String(c.displayName ?? code),
      authorityState: null,
      commercialStatus: (String(c.commercialStatus ?? "") || null) as CommercialStatus | null,
      hasStripeProductId: Boolean(c.stripeProductId),
      hasStripePriceId: Boolean(c.stripePriceId),
      active: c.active !== false,
      requiresCheckout: c.requiresCheckout === true,
      readinessStatus: null,
      releaseReadyNow: null,
      checkoutSafe: null,
      commercialSafe: null,
      releaseLane: null,
      releaseMode: null,
      checkoutAllowed: null,
      resolverAction: action.state,
      resolverPurchasable: action.purchasable,
    };
  }

  // ─── GMI Edition Snapshots ────────────────────────────────────────────────

  const gmiEditions: GmiEditionSnapshot[] = gmiRegistryEntries.map((entry) => {
    const editionId = String(entry.editionId || "");
    const productCode = String(entry.productCode || "");
    const lc = lifecycleById[editionId] ?? null;
    const ac = (authorityContract[productCode] ?? {}) as Record<string, unknown>;
    const cp = catalogProducts[productCode] ?? {};

    const action = resolveCommercialAction(cp, readinessMatrix[productCode] ?? null, governanceMatrix[productCode] ?? null);

    return {
      editionId,
      productCode,
      quarter: String(entry.quarter || ""),
      year: Number(entry.year ?? 0),
      registryStatus: (String(entry.status || "") || "draft") as GmiEditionStatus,
      registryCurrent: entry.current === true,
      registryHiddenFromPricing: entry.hiddenFromPricing === true,
      lifecycleState: (String(lc?.lifecycleState ?? "") || null) as LifecycleState | null,
      lifecyclePublicVisible: lc && lc.publicVisible === true ? true : lc && lc.publicVisible === false ? false : null,
      lifecyclePurchasable: lc && lc.purchasable === true ? true : lc && lc.purchasable === false ? false : null,
      authorityState: (String(ac.currentAuthorityState ?? "") || null) as ProductAuthorityState | null,
      commercialStatus: (String(cp.commercialStatus ?? "") || null) as CommercialStatus | null,
      hasStripePriceId: Boolean(cp.stripePriceId),
      resolverAction: action.state,
    };
  });

  // ─── Content Family Snapshots ─────────────────────────────────────────────

  const FAMILY_DIRS: Record<string, string[]> = {
    blog: ["Post"],
    books: ["Book"],
    playbooks: ["Playbook"],
    editorials: ["Editorial"],
    intelligence: ["Intelligence"],
    briefs: ["Brief"],
  };

  const contentFamilies: ContentFamilySnapshot[] = [];
  for (const [family, typeDirs] of Object.entries(FAMILY_DIRS)) {
    const sourceCount = countContentFiles(family);
    const allDocs: Record<string, unknown>[] = typeDirs.flatMap(loadContentlayerIndex) as Record<string, unknown>[];
    const indexedCount = allDocs.length;

    const publicDocs = allDocs.filter((d: Record<string, unknown>) => {
      if (d.draft === true) return false;
      if (d.published === false) return false;
      const tier = String(d.accessTierSafe ?? d.accessLevel ?? d.accessTier ?? d.tier ?? d.classification ?? "public").toLowerCase();
      return tier === "public" || tier === "open" || tier === "free" || tier === "unclassified";
    });

    contentFamilies.push({
      family,
      sourceFileCount: sourceCount,
      indexedCount,
      publicIndexedCount: publicDocs.length,
      hasRouteIssues: false,
      routeIssues: [],
    });
  }

  // ─── Build Snapshot ───────────────────────────────────────────────────────

  const envVars = checkEnvVars();
  const nextauthUrlSet = Boolean(process.env.NEXTAUTH_URL);
  const vercelAffectsOutput = process.env.VERCEL === "1";

  const build: BuildSnapshot = {
    contentlayerBuilt: exists(".contentlayer/generated"),
    envVars,
    nextauthUrlSet,
    vercelAffectsOutput,
  };

  return {
    timestamp: new Date().toISOString(),
    products,
    gmiEditions,
    contentFamilies,
    build,
    governanceOnlyCodes,
    catalogOnlyCodes,
  };
}
