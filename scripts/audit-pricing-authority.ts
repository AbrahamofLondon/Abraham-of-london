import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { CATALOG, resolveProductCode } from "../lib/commercial/catalog";
import {
  collectPricingViolations,
  type PricingAuditContext,
  type PricingViolation,
} from "../lib/commercial/pricing-audit-core";

const ROOT = process.cwd();
const CATALOG_PATH = "lib/commercial/catalog.ts";
const RETIRED_CODES = new Set(["diagnostic_report_basic", "diagnostic_report_pro"]);
const SKIP_DIRS = new Set([".git", ".next", ".netlify", "node_modules", "out", "dist", "coverage"]);
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".md", ".mdx"]);

const ACTIVE_PRODUCTS = Object.values(CATALOG).filter((product) => product.active);
const PRODUCT_AMOUNTS = Array.from(
  new Set(ACTIVE_PRODUCTS.map((p) => String(p.amount)).filter((a) => a !== "0" && a !== "undefined")),
);

// Controlled = not self-serve-checkout-eligible (manual/contracted/inactive/
// retired/evidence-gated, or explicitly requiresCheckout !== true).
const CONTROLLED_CODES = new Set(
  Object.values(CATALOG)
    .filter((p) => {
      const status = p.commercialStatus;
      const controlledStatus = ["manual_billing", "contracted", "inactive", "retired", "evidence_gated"].includes(status ?? "");
      return controlledStatus || p.requiresCheckout !== true;
    })
    .map((p) => p.code),
);

const EXACT_LEGACY_PRICE_EXEMPTIONS = new Set([
  "lib/product/product-catalogue-registry.ts::£49",
  "lib/product/product-catalogue-registry.ts::£149",
  "lib/product/product-catalogue-registry.ts::£349",
  "lib/product/product-catalogue-registry.ts::From £2,500",
]);

function isExactLegacyPriceExemption(violation: PricingViolation): boolean {
  return violation.type === "hardcoded_product_price"
    && EXACT_LEGACY_PRICE_EXEMPTIONS.has(`${violation.file}::${violation.match}`);
}
const CONTEXT: PricingAuditContext = {
  productAmounts: PRODUCT_AMOUNTS,
  isResolvableProductCode: (id) => Boolean(resolveProductCode(id)),
  retiredCodes: RETIRED_CODES,
  controlledProductCodes: CONTROLLED_CODES,
};

function relative(file: string): string {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

// Narrow, exact skips only — the catalogue authority itself, the audit + its core,
// this detector's own tests, and non-runtime content corpora. No broad app/pages/lib skip.
function shouldSkipFile(file: string): boolean {
  const rel = relative(file);
  if (rel === CATALOG_PATH) return true;
  if (rel === "scripts/audit-pricing-authority.ts") return true;
  if (rel === "lib/commercial/pricing-audit-core.ts") return true;
  if (rel.startsWith("content/evidence/")) return true;
  if (rel.startsWith("content/outbound/")) return true;
  if (rel.startsWith("content/shorts/")) return true;
  if (/\.(test|spec)\.[jt]sx?$/.test(rel)) return true;
  return false;
}

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, files);
    else if (EXTENSIONS.has(path.extname(entry))) files.push(full);
  }
  return files;
}

function runtimeRoots(): string[] {
  return ["app", "pages", "components", "lib"].map((dir) => path.join(ROOT, dir)).filter(existsSync);
}

const violations: PricingViolation[] = [];

if (existsSync(path.join(ROOT, "lib/commercial/stripe-price-catalog.ts"))) {
  violations.push({ file: "lib/commercial/stripe-price-catalog.ts", type: "multiple_pricing_authorities", match: "secondary catalog exists" });
}

for (const file of runtimeRoots().flatMap((root) => walk(root))) {
  if (shouldSkipFile(file)) continue;
  violations.push(...collectPricingViolations(relative(file), readFileSync(file, "utf8"), CONTEXT).filter((v) => !isExactLegacyPriceExemption(v)));
}

if (violations.length === 0) {
  console.log("Pricing authority audit passed.");
  process.exit(0);
}

for (const violation of violations) {
  console.error(`${violation.file}: ${violation.type}: ${violation.match}`);
}
console.error(`\n${violations.length} pricing-authority finding(s).`);
process.exit(1);
