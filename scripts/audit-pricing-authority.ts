import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { CATALOG, resolveProductCode } from "../lib/commercial/catalog";

type Violation = {
  file: string;
  type: string;
  match: string;
};

const ROOT = process.cwd();
const CATALOG_PATH = "lib/commercial/catalog.ts";
const RETIRED_CODES = new Set(["diagnostic_report_basic", "diagnostic_report_pro"]);
const SKIP_DIRS = new Set([".git", ".next", ".netlify", "node_modules", "out", "dist", "coverage"]);
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".md", ".mdx"]);

const ACTIVE_PRODUCTS = Object.values(CATALOG).filter((product) => product.active);
const PRODUCT_PRICE_DISPLAYS = new Set(
  ACTIVE_PRODUCTS
    .map((product) => product.displayPrice)
    .filter((price) => price !== "Free" && price !== "Paid"),
);
const PRODUCT_AMOUNTS = new Set(
  ACTIVE_PRODUCTS
    .map((product) => String(product.amount))
    .filter((amount) => amount !== "0"),
);

function relative(file: string): string {
  return path.relative(ROOT, file).replace(/\\/g, "/");
}

function shouldSkipFile(file: string): boolean {
  const rel = relative(file);
  if (rel === CATALOG_PATH) return true;
  if (rel === "scripts/audit-pricing-authority.ts") return true;
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
  return ["app", "pages", "components", "lib"]
    .map((dir) => path.join(ROOT, dir))
    .filter(existsSync);
}

function collect(file: string): Violation[] {
  const rel = relative(file);
  const text = readFileSync(file, "utf8");
  const violations: Violation[] = [];
  const skipped = shouldSkipFile(file);

  if (!skipped) {
    for (const price of PRODUCT_PRICE_DISPLAYS) {
      if (text.includes(price) || text.includes(price.replace("£", "&pound;"))) {
        violations.push({ file: rel, type: "hardcoded_product_price", match: price });
      }
    }

    for (const amount of PRODUCT_AMOUNTS) {
      const amountPattern = new RegExp(`(?:amount|unit_amount|priceGBP|unitAmountGbp)\\s*:\\s*${amount}(?![0-9])`);
      if (amountPattern.test(text)) {
        violations.push({ file: rel, type: "hardcoded_product_amount", match: amount });
      }
    }
  }

  if (!skipped && rel !== CATALOG_PATH) {
    for (const retired of RETIRED_CODES) {
      if (text.includes(retired)) {
        violations.push({ file: rel, type: "retired_product_reference", match: retired });
      }
    }
  }

  const checkoutProductPatterns = [
    /productCode=["']([^"']+)["']/g,
    /productCode:\s*["']([^"']+)["']/g,
    /priceCode:\s*["']([^"']+)["']/g,
    /checkoutCode:\s*["']([^"']+)["']/g,
  ];
  if (!skipped) {
    for (const pattern of checkoutProductPatterns) {
      for (const match of text.matchAll(pattern)) {
        const identifier = match[1];
        if (!identifier || identifier.includes("${")) continue;
        if (!resolveProductCode(identifier)) {
          violations.push({ file: rel, type: "unknown_product_identifier", match: identifier });
        }
      }
    }
  }

  if (!skipped && (/amount:\s*(95|395)\b/.test(text) || /return\s+.*\?\s*25000\s*:\s*9500/.test(text))) {
    violations.push({ file: rel, type: "fallback_pricing_logic", match: "hardcoded fallback amount" });
  }

  return violations;
}

const violations: Violation[] = [];

if (existsSync(path.join(ROOT, "lib/commercial/stripe-price-catalog.ts"))) {
  violations.push({
    file: "lib/commercial/stripe-price-catalog.ts",
    type: "multiple_pricing_authorities",
    match: "secondary catalog exists",
  });
}

violations.push(...runtimeRoots().flatMap((root) => walk(root)).flatMap(collect));

if (violations.length === 0) {
  console.log("Pricing authority audit passed.");
  process.exit(0);
}

for (const violation of violations) {
  console.error(`${violation.file}: ${violation.type}: ${violation.match}`);
}

process.exit(1);
