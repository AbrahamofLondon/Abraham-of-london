/**
 * scripts/_commercial-mirror.mjs
 *
 * Faithful JS mirror of the TypeScript commercial gating stack, for use by the
 * read-only verification scripts (which cannot import the .ts modules directly):
 *
 *   - lib/commercial/commercial-action-resolver.ts  (resolveCommercialAction)
 *   - lib/commercial/commercial-governance.ts        (getGovernanceState)
 *   - lib/commercial/product-code-map.ts             (PRODUCT_CODE_MAP)
 *   - lib/commercial/catalog.ts                       (parsed for product fields)
 *
 * Keep in sync with those modules. The scripts assert behaviour; this mirror is
 * the logic under test.
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(__dirname, "..");

// ── Catalog parse (literal product blocks only; dynamic GMI editions excluded) ─
const catalogText = readFileSync(join(ROOT, "lib", "commercial", "catalog.ts"), "utf8");

export function parseCatalogProduct(key) {
  const re = new RegExp(`^  ${key}:\\s*\\{([\\s\\S]*?)^  \\},?$`, "m");
  const m = catalogText.match(re);
  if (!m) return null;
  const body = m[1];
  const str = (f) => { const r = body.match(new RegExp(`${f}:\\s*"([^"]*)"`)); return r ? r[1] : null; };
  const nullable = (f) => {
    const s = body.match(new RegExp(`${f}:\\s*"([^"]*)"`)); if (s) return s[1];
    return null; // includes explicit null and absent
  };
  const num = (f) => { const r = body.match(new RegExp(`${f}:\\s*(-?\\d+)`)); return r ? Number(r[1]) : null; };
  const bool = (f) => { const r = body.match(new RegExp(`${f}:\\s*(true|false)`)); return r ? r[1] === "true" : undefined; };
  return {
    code: str("code") || key,
    displayName: str("displayName"),
    amount: num("amount"),
    displayPrice: str("displayPrice"),
    stripeProductId: nullable("stripeProductId"),
    stripePriceId: nullable("stripePriceId"),
    successPath: str("successPath"),
    cancelPath: str("cancelPath"),
    commercialStatus: str("commercialStatus"),
    accessType: str("accessType"),
    active: bool("active"),
    requiresCheckout: bool("requiresCheckout"),
    requiresContract: bool("requiresContract"),
    primaryCta: str("primaryCta"),
  };
}

export function allLiteralCatalogKeys() {
  const out = [];
  const re = /^  ([a-z][a-z0-9_]*):\s*\{([\s\S]*?)^  \},?$/gm;
  let m;
  while ((m = re.exec(catalogText))) { if (/\bcode:/.test(m[2])) out.push(m[1]); }
  return out;
}

// ── Governance loader (mirror of commercial-governance.ts) ─────────────────
const readiness = JSON.parse(readFileSync(join(ROOT, "reports", "product-release-readiness-matrix.json"), "utf8"));
const governance = JSON.parse(readFileSync(join(ROOT, "reports", "product-release-governance-matrix.json"), "utf8"));

export function getGovernanceState(code) {
  const r = readiness[code] || null;
  const g = governance[code] || null;
  const b = (v) => (typeof v === "boolean" ? v : null);
  return {
    productCode: code,
    known: Boolean(r || g),
    readinessStatus: r?.readinessStatus ?? null,
    releaseReadyNow: r?.releaseReadyNow === true,
    checkoutSafe: b(r?.checkoutSafe),
    commercialSafe: b(r?.commercialSafe),
    releaseLane: r?.releaseLane ?? g?.releaseLane ?? null,
    releaseMode: r?.releaseMode ?? g?.releaseMode ?? null,
    checkoutAllowed: b(g?.checkoutAllowed),
    manualFulfilmentAllowed: b(g?.manualFulfilmentAllowed),
    commercialClaimAllowed: b(g?.commercialClaimAllowed),
  };
}

export function allGovernanceCodes() {
  return Array.from(new Set([...Object.keys(readiness), ...Object.keys(governance)])).sort();
}

// ── Resolver (mirror of commercial-action-resolver.ts) ─────────────────────
function isFreeCatalog(p) {
  if (["manual_billing", "contracted", "paid", "evidence_gated"].includes(p.commercialStatus)) return false;
  return p.commercialStatus === "free_controlled" || p.accessType === "free" || (p.amount ?? 0) <= 0;
}
function hasValidStripe(p) { return Boolean(p.stripePriceId && (p.amount ?? 0) > 0); }

export function resolveCommercialAction(product, g, options = {}) {
  const cta = product.primaryCta;
  const successPath = product.successPath || "/pricing";
  const checkoutHref = product.cancelPath || successPath;
  const lane = g.releaseLane || "";
  const A = (state, reason, href = successPath, purchasable = false) => ({ state, reason, href, purchasable, label: cta || state });

  if (!product.active || product.commercialStatus === "inactive" || product.commercialStatus === "retired")
    return A("archive_reference_only", "inactive_or_retired");
  if (g.known && (g.readinessStatus === "blocked" || g.releaseMode === "blocked" || lane.startsWith("blocked")))
    return A("blocked", "governance_blocked");
  if (g.known && g.releaseMode === "internal_only" && !PUBLIC_INTAKE_ALLOWLIST.includes(product.code))
    return A("blocked", "internal_only");
  if (g.known && g.checkoutSafe === false)
    return lane.includes("evidence") ? A("evidence_gated", "checkout_not_safe_evidence") : A("review_gated", "checkout_not_safe_review");
  if (g.known && g.commercialSafe === false) return A("review_gated", "commercial_not_safe");
  if (g.known && g.checkoutAllowed === false && g.releaseMode !== "manual_fulfilment_only")
    return A("review_gated", "checkout_not_allowed");
  if (product.commercialStatus === "contracted" || product.requiresContract === true)
    return A("contact_sales", "contracted", successPath || "/contact");
  if (isFreeCatalog(product)) return A("view_free_surface", "free_access");
  if (g.known && g.releaseMode === "manual_fulfilment_only") return A("manual_fulfilment", "manual_fulfilment_only", "/contact");
  if (product.commercialStatus === "manual_billing") return A("manual_fulfilment", "manual_billing", "/contact");
  const checkoutIntended = product.commercialStatus === "paid" && product.requiresCheckout === true;
  if (checkoutIntended) {
    if (!hasValidStripe(product)) return A("unavailable", "missing_stripe_metadata");
    if (options.routeAvailable === false) return A("unavailable", "missing_route");
    return { state: "checkout", reason: undefined, href: checkoutHref, purchasable: true, label: cta || "Purchase / unlock" };
  }
  return A("request_access", "not_checkout_cleared", "/contact");
}

export const PUBLIC_INTAKE_ALLOWLIST = [];

// ── Product-code map mirror ─────────────────────────────────────────────────
export const CURRENT_GMI_QUARTER_KEY = "gmi_q2_2026";
export const PRODUCT_CODE_MAP = {
  fast_diagnostic: { catalogKey: "fast_diagnostic", aliasKeys: [] },
  enterprise_assessment: { catalogKey: "enterprise_assessment", aliasKeys: [] },
  gmi_quarterly: { catalogKey: "gmi_quarterly", aliasKeys: ["gmi_q2_2026", "gmi_q1_2026"], currentArtifactKey: CURRENT_GMI_QUARTER_KEY },
  reporting_monthly: { catalogKey: "reporting_monthly", aliasKeys: [] },
  reporting_custom: { catalogKey: "reporting_custom", aliasKeys: [] },
  boardroom_brief: { catalogKey: "boardroom_brief", aliasKeys: [] },
  executive_reporting: { catalogKey: "executive_reporting", aliasKeys: [] },
};

export const RELEASE_READY = ["gmi_quarterly", "reporting_monthly", "reporting_custom", "fast_diagnostic", "enterprise_assessment"];
export const BLOCKED = ["boardroom_brief", "executive_reporting"];

export function routeExists(rel) { return existsSync(join(ROOT, rel)); }
export function readFileSafe(rel) { const p = join(ROOT, rel); return existsSync(p) ? readFileSync(p, "utf8") : ""; }
