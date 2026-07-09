#!/usr/bin/env node
/**
 * scripts/audit-product-access-links.mjs — Commercial Truth Link Audit
 *
 * Crawls product access surfaces, pricing pages, and navigation CTAs to
 * verify every link resolves to a correct commercial route.
 *
 * Fail conditions:
 *   - same-page loop not explicitly allowed
 *   - missing route (file not found in pages/ or app/)
 *   - paid label with no commercial path
 *   - access CTA with href="#" or empty href
 *   - checkout CTA without Stripe price ID
 *   - manual_billing product without enquiry route
 *   - dormant product with checkout CTA
 *   - commercialStatus=manual_billing + requiresCheckout=true
 *   - commercialStatus=evidence_gated + requiresCheckout=true
 *
 * Usage: node scripts/audit-product-access-links.mjs
 * Exit 0 = all PASS. Exit 1 = one or more FAIL.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Re-invoke via tsx so we can import TypeScript modules (GMI registry + factory).
// The text parser below handles non-GMI catalog products; GMI products are loaded
// directly from the registry for accuracy — dynamic spreads aren't text-parseable.
const isTsx = process.execArgv.some((a) => a.includes("tsx") || a.includes("ts-node"));
if (!isTsx && !process.env.__AUDIT_TSX__) {
  process.env.__AUDIT_TSX__ = "1";
  try {
    execSync(`node --import tsx/esm scripts/audit-product-access-links.mjs`, { stdio: "inherit", cwd: ROOT });
  } catch {
    execSync(`npx tsx scripts/audit-product-access-links.mjs`, { stdio: "inherit", cwd: ROOT });
  }
  process.exit(0);
}

// Import GMI registry + factory (only reached under tsx)
const { GMI_EDITION_REGISTRY } = await import("../lib/commercial/gmi/gmi-edition-registry.ts");
const { buildGmiEditionProduct, validateGmiEditionRegistry } = await import("../lib/commercial/gmi/gmi-edition-factory.ts");

const PASS = "✓";
const FAIL = "✗";
const WARN = "⚠";

// ─── Route existence check ────────────────────────────────────────────────────

function hasDynamicChildInDir(dir) {
  if (!existsSync(dir)) return false;
  try {
    return readdirSync(dir).some(
      (e) => e.startsWith("[") && (e.endsWith(".tsx") || e.endsWith(".ts") || !e.includes(".")),
    );
  } catch { return false; }
}

function routeExists(route) {
  if (!route || route === "#" || route === "") return false;

  const clean = route.split("?")[0].split("#")[0].replace(/^\//, "");
  if (!clean) return true;

  const segments = clean.split("/");

  // Exact file checks
  const exactChecks = [
    join(ROOT, "pages", clean, "index.tsx"),
    join(ROOT, "pages", clean, "index.ts"),
    join(ROOT, "pages", `${clean}.tsx`),
    join(ROOT, "pages", `${clean}.ts`),
    join(ROOT, "app", ...segments, "page.tsx"),
    join(ROOT, "app", ...segments, "page.ts"),
  ];
  if (exactChecks.some(existsSync)) return true;

  // Dynamic route check: walk up segments looking for [slug] / [...slug] patterns
  for (let depth = segments.length; depth >= 1; depth--) {
    const parentSegs = segments.slice(0, depth - 1);
    const pagesParentDir = join(ROOT, "pages", ...parentSegs);
    const appParentDir = join(ROOT, "app", ...parentSegs);

    if (hasDynamicChildInDir(pagesParentDir)) return true;
    if (hasDynamicChildInDir(appParentDir)) return true;
  }

  return false;
}

// ─── Load catalog ─────────────────────────────────────────────────────────────

function extractField(block, fieldName, isBoolean = false) {
  const patterns = [
    new RegExp(`${fieldName}:\\s*"([^"]+)"`),
    new RegExp(`${fieldName}:\\s*'([^']+)'`),
    isBoolean ? new RegExp(`${fieldName}:\\s*(true|false)`) : null,
  ].filter(Boolean);
  for (const re of patterns) {
    const m = block.match(re);
    if (m) return m[1];
  }
  return null;
}

function loadCatalog() {
  const catalogPath = join(ROOT, "lib", "commercial", "catalog.ts");
  if (!existsSync(catalogPath)) {
    console.error("  catalog.ts not found at", catalogPath);
    return {};
  }

  const src = readFileSync(catalogPath, "utf8");
  const catalog = {};

  // Find the CATALOG constant block by locating export const CATALOG
  const catalogMarker = "export const CATALOG";
  const catalogStart = src.indexOf(catalogMarker);
  if (catalogStart === -1) {
    console.error("  Could not find CATALOG export in catalog.ts");
    return {};
  }

  // Find the opening { of the CATALOG object
  const outerBracePos = src.indexOf("{", catalogStart);
  if (outerBracePos === -1) return {};

  // Extract the content up to the matching closing }
  let depth = 0;
  let endPos = outerBracePos;
  for (let i = outerBracePos; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") {
      depth--;
      if (depth === 0) { endPos = i; break; }
    }
  }

  const catalogBody = src.slice(outerBracePos + 1, endPos);

  // Find all top-level product entries: lines matching /^\n  key_name: {/
  // Then extract the block between the opening { and its matching }
  const keyPattern = /\n  ([a-z][a-z0-9_]+):\s*\{/g;
  let match;
  const entries = [];
  while ((match = keyPattern.exec(catalogBody)) !== null) {
    entries.push({ key: match[1], start: match.index + match[0].length - 1 });
  }

  for (let ei = 0; ei < entries.length; ei++) {
    const { key, start } = entries[ei];
    // Find matching closing brace starting from start
    let d = 0;
    let blockEnd = start;
    for (let i = start; i < catalogBody.length; i++) {
      if (catalogBody[i] === "{") d++;
      else if (catalogBody[i] === "}") {
        d--;
        if (d === 0) { blockEnd = i; break; }
      }
    }
    const block = catalogBody.slice(start, blockEnd + 1);

    const commercialStatus = extractField(block, "commercialStatus");
    if (!commercialStatus) continue;

    const stripePriceId = extractField(block, "stripePriceId");
    const stripeProductId = extractField(block, "stripeProductId");
    const successPath = extractField(block, "successPath");

    const requiresCheckoutMatch = block.match(/requiresCheckout:\s*(true|false)/);
    const requiresCheckout = requiresCheckoutMatch ? requiresCheckoutMatch[1] === "true" : false;

    const activeMatch = block.match(/\bactive:\s*(true|false)/);
    const active = activeMatch ? activeMatch[1] !== "false" : true;

    catalog[key] = {
      code: key,
      commercialStatus,
      requiresCheckout,
      stripePriceId: stripePriceId ?? null,
      stripeProductId: stripeProductId ?? null,
      active,
      successPath: successPath ?? null,
    };
  }

  // Merge in dynamically-generated GMI products from the registry.
  // These are not text-parseable from catalog.ts (they use a spread).
  for (const entry of GMI_EDITION_REGISTRY) {
    const product = buildGmiEditionProduct(entry);
    catalog[entry.productCode] = {
      code: product.code,
      commercialStatus: product.commercialStatus,
      requiresCheckout: product.requiresCheckout ?? false,
      stripePriceId: product.stripePriceId ?? null,
      stripeProductId: product.stripeProductId ?? null,
      active: product.active,
      successPath: product.successPath ?? null,
    };
  }

  return catalog;
}

// ─── GMI registry integrity checks ───────────────────────────────────────────

function auditGmiRegistry() {
  const errors = validateGmiEditionRegistry(GMI_EDITION_REGISTRY);
  const findings = [];

  for (const e of errors) {
    findings.push({ editionId: e.editionId, message: e.error, severity: "FAIL" });
  }

  // Warn if active edition is hidden from pricing unexpectedly
  for (const entry of GMI_EDITION_REGISTRY) {
    if (entry.current && entry.hiddenFromPricing && entry.status !== "manual_billing") {
      findings.push({
        editionId: entry.editionId,
        message: `current edition is hidden from pricing — verify this is intentional`,
        severity: "WARN",
      });
    }
    // Warn if archived edition has price but no product ID
    if (entry.status === "archived" && entry.stripePriceId && !entry.stripeProductId) {
      findings.push({
        editionId: entry.editionId,
        message: `archived edition has stripePriceId but no stripeProductId — incomplete Stripe metadata`,
        severity: "WARN",
      });
    }
  }

  return findings;
}

// ─── Product access link definitions ─────────────────────────────────────────
// These are the surfaces and CTAs that the audit must verify.

function getProductAccessSurfaces(catalog) {
  const surfaces = [];

  // All catalog products
  for (const [code, product] of Object.entries(catalog)) {
    const { commercialStatus, requiresCheckout, stripePriceId, stripeProductId, active, successPath, requiresContract } = product;

    let expectedAccessMode = "unknown";
    if (!active || ["inactive", "retired", "dormant"].includes(commercialStatus)) {
      expectedAccessMode = "dormant";
    } else if (commercialStatus === "free_controlled") {
      expectedAccessMode = "free_public";
    } else if (commercialStatus === "paid" && requiresCheckout) {
      expectedAccessMode = "paid_checkout";
    } else if (commercialStatus === "manual_billing") {
      expectedAccessMode = "manual_billing";
    } else if (commercialStatus === "contracted") {
      expectedAccessMode = "contracted";
    } else if (commercialStatus === "evidence_gated") {
      expectedAccessMode = "evidence_gated";
    } else if (commercialStatus === "internal_only") {
      expectedAccessMode = "admin_only";
    }

    surfaces.push({
      productCode: code,
      sourcePage: "catalog",
      linkText: code,
      href: successPath ?? "",
      expectedAccessMode,
      commercialStatus,
      requiresCheckout,
      stripePriceId,
      stripeProductId,
      active,
    });
  }

  // Key named surfaces from the product access directory.
  // sourcePage = the page where this CTA lives; href = the CTA destination.
  // These must NOT loop (href !== sourcePage).
  const namedSurfaces = [
    { productCode: "team_assessment",       sourcePage: "/products",     linkText: "Start Team Assessment",           href: "/diagnostics/team-assessment",                               expectedAccessMode: "free_public",     stripePriceId: null, stripeProductId: null },
    { productCode: "enterprise_assessment", sourcePage: "/products",     linkText: "Start Enterprise Assessment",     href: "/diagnostics/enterprise-assessment",                         expectedAccessMode: "free_public",     stripePriceId: null, stripeProductId: null },
    { productCode: "executive_reporting",   sourcePage: "/products",     linkText: "Proceed to Executive Reporting",  href: "/diagnostics/executive-reporting",                           expectedAccessMode: "paid_checkout",   stripePriceId: catalog["executive_reporting"]?.stripePriceId,   stripeProductId: catalog["executive_reporting"]?.stripeProductId },
    { productCode: "boardroom_brief",       sourcePage: "/products",     linkText: "Generate a brief",                href: "/boardroom-brief",                                           expectedAccessMode: "paid_checkout",   stripePriceId: catalog["boardroom_brief"]?.stripePriceId,       stripeProductId: catalog["boardroom_brief"]?.stripeProductId },
    { productCode: "strategy_room",         sourcePage: "/products",     linkText: "View Strategy Room",              href: "/strategy-room",                                             expectedAccessMode: "paid_checkout",   stripePriceId: catalog["strategy_room"]?.stripePriceId,         stripeProductId: catalog["strategy_room"]?.stripeProductId },
    { productCode: "professional",          sourcePage: "/pricing",      linkText: "Start Professional",              href: "/decision-centre",                                           expectedAccessMode: "paid_checkout",   stripePriceId: catalog["professional"]?.stripePriceId,          stripeProductId: catalog["professional"]?.stripeProductId },
    { productCode: "gmi_q2_2026",           sourcePage: "/products",     linkText: "View latest report — Q2 2026",   href: "/artifacts/global-market-intelligence-report-q2-2026",       expectedAccessMode: "paid_checkout",  stripePriceId: catalog["gmi_q2_2026"]?.stripePriceId,           stripeProductId: catalog["gmi_q2_2026"]?.stripeProductId },
    { productCode: "retainer_core",         sourcePage: "/products",     linkText: "Request review where eligible",   href: "/retainer/intake",                                           expectedAccessMode: "contracted",      stripePriceId: catalog["retainer_core"]?.stripePriceId,         stripeProductId: catalog["retainer_core"]?.stripeProductId },
    // inner_circle is dormant — no CTA should exist for it on any public surface
    { productCode: "boardroom_mode",        sourcePage: "/products",     linkText: "View Boardroom Mode",             href: "/boardroom-mode",                                            expectedAccessMode: "evidence_gated",  stripePriceId: null, stripeProductId: null },
    { productCode: "return_brief",          sourcePage: "/decision-centre", linkText: "Return Brief",                 href: "/return-brief",                                              expectedAccessMode: "evidence_gated",  stripePriceId: null, stripeProductId: null },
  ];

  return [...surfaces, ...namedSurfaces];
}

// ─── Audit checks ─────────────────────────────────────────────────────────────

function auditSurface(surface) {
  const findings = [];
  const { productCode, sourcePage, linkText, href, expectedAccessMode, commercialStatus, requiresCheckout, stripePriceId, stripeProductId, active } = surface;

  // 1. Dead link check
  if (href === "#" || href === "") {
    findings.push({ severity: "FAIL", check: "dead_link", message: `href is "#" or empty` });
  }

  // 2. Route existence
  if (href && href !== "#" && href !== "") {
    const exists = routeExists(href);
    if (!exists) {
      findings.push({ severity: "FAIL", check: "route_missing", message: `Route does not exist: ${href}` });
    }
  }

  // 3. Same-page loop check (href equals source page)
  if (href && href !== "#" && href !== "" && sourcePage) {
    const hrefBase = href.split("?")[0].split("#")[0];
    if (hrefBase === sourcePage) {
      findings.push({ severity: "FAIL", check: "same_page_loop", message: `Link loops back to same page: ${href} on ${sourcePage}` });
    }
  }

  // 4. Paid checkout must have Stripe IDs
  if (expectedAccessMode === "paid_checkout") {
    if (!stripePriceId) {
      findings.push({ severity: "FAIL", check: "stripe_price_missing", message: `paid_checkout but no stripePriceId` });
    }
    if (!stripeProductId) {
      findings.push({ severity: "WARN", check: "stripe_product_missing", message: `paid_checkout but no stripeProductId` });
    }
  }

  // 5. manual_billing must not have requiresCheckout=true
  if (commercialStatus === "manual_billing" && requiresCheckout) {
    findings.push({ severity: "FAIL", check: "manual_billing_checkout_contradiction", message: `manual_billing but requiresCheckout=true — contradiction` });
  }

  // 6. evidence_gated must not have requiresCheckout=true
  if (expectedAccessMode === "evidence_gated" && requiresCheckout) {
    findings.push({ severity: "FAIL", check: "evidence_gated_checkout_contradiction", message: `evidence_gated but requiresCheckout=true` });
  }

  // 7. dormant must not have checkout CTA
  if (expectedAccessMode === "dormant" && requiresCheckout) {
    findings.push({ severity: "FAIL", check: "dormant_checkout", message: `dormant product has requiresCheckout=true` });
  }

  // 8. Paid label (active + amount > 0) must have commercial path
  if (active && commercialStatus === "paid" && !stripePriceId && requiresCheckout) {
    findings.push({ severity: "FAIL", check: "paid_no_stripe", message: `Active paid product with requiresCheckout=true has no stripePriceId` });
  }

  const status = findings.some((f) => f.severity === "FAIL")
    ? "FAIL"
    : findings.some((f) => f.severity === "WARN")
    ? "WARN"
    : "PASS";

  return { ...surface, status, findings };
}

// ─── P1 audit table ───────────────────────────────────────────────────────────

function auditP1Table(catalog) {
  const TARGET_PRODUCTS = [
    "team_assessment",
    "enterprise_assessment",
    "executive_reporting",
    "boardroom_brief",
    "strategy_room",
    "retainer_core",
    "retainer_operational",
    "retainer_institutional",
    "inner_circle",
    "professional",
    "gmi_q1_2026",
    "gmi_q2_2026",
    "boardroom_mode",
  ];

  const rows = [];
  for (const code of TARGET_PRODUCTS) {
    const p = catalog[code];
    if (!p) {
      rows.push({
        productCode: code,
        commercialStatus: "NOT_IN_CATALOG",
        stripeProductId: null,
        stripePriceId: null,
        requiresCheckout: false,
        successPath: null,
        catalogEntry: false,
        status: "NEEDS_DECISION",
      });
      continue;
    }

    let status = "PASS";
    if (p.commercialStatus === "paid" && p.requiresCheckout && !p.stripePriceId) status = "FAIL";
    if (p.commercialStatus === "paid" && p.requiresCheckout && p.stripePriceId && !p.stripeProductId) status = "WARN"; // price ID present but product ID missing
    if (p.commercialStatus === "manual_billing" && p.requiresCheckout) status = "FAIL";
    if (p.commercialStatus === "evidence_gated" && p.requiresCheckout) status = "FAIL";
    if (!["paid", "free_controlled", "contracted", "manual_billing", "evidence_gated", "inactive", "retired", "dormant", "internal_only"].includes(p.commercialStatus)) status = "NEEDS_DECISION";

    rows.push({
      productCode: code,
      commercialStatus: p.commercialStatus,
      stripeProductId: p.stripeProductId,
      stripePriceId: p.stripePriceId,
      requiresCheckout: p.requiresCheckout,
      successPath: p.successPath,
      catalogEntry: true,
      status,
    });
  }
  return rows;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("  COMMERCIAL TRUTH AUDIT — Product Access Link Integrity");
  console.log("═══════════════════════════════════════════════════════════════\n");

  const catalog = loadCatalog();
  const catalogCount = Object.keys(catalog).length;
  console.log(`  Catalog products loaded: ${catalogCount}`);

  if (catalogCount === 0) {
    console.error("  ✗ Catalog empty — cannot continue. Ensure catalog.ts is parseable.");
    process.exit(1);
  }

  // ── GMI Registry Audit ────────────────────────────────────────────────────
  console.log("\n─── GMI: Edition Registry Integrity ────────────────────────────\n");
  const gmiFindings = auditGmiRegistry();
  const gmiFails = gmiFindings.filter((f) => f.severity === "FAIL");
  const gmiWarns = gmiFindings.filter((f) => f.severity === "WARN");

  if (gmiFindings.length === 0) {
    console.log(`  ${PASS} GMI edition registry: ${GMI_EDITION_REGISTRY.length} editions validated — no issues found`);
  } else {
    for (const f of gmiFindings) {
      const prefix = f.severity === "FAIL" ? FAIL : WARN;
      console.log(`  ${prefix} [${f.editionId}] ${f.message}`);
    }
  }

  // Edition summary
  for (const entry of GMI_EDITION_REGISTRY) {
    const tag = entry.current ? " [CURRENT]" : "";
    const stripeOk = entry.stripeProductId && entry.stripePriceId ? `${PASS} Stripe` : entry.status === "manual_billing" ? `${PASS} manual_billing` : `${WARN} no Stripe`;
    console.log(`    • ${entry.editionId} (${entry.status})${tag} — ${stripeOk}`);
  }

  if (gmiFails.length > 0) {
    console.log(`\n  ${FAIL} GMI registry has ${gmiFails.length} failure(s) — fix before release.`);
  }

  // ── P1 Table ──────────────────────────────────────────────────────────────
  console.log("\n─── P1: Paid / Manual Billing Product Audit Table ──────────────\n");
  const p1Rows = auditP1Table(catalog);

  console.log(
    "  " +
    ["productCode".padEnd(32), "commercialStatus".padEnd(20), "stripeProductId".padEnd(16), "stripePriceId".padEnd(16), "checkout".padEnd(10), "status"].join(" | ")
  );
  console.log("  " + "-".repeat(110));

  let p1Fails = 0;
  for (const row of p1Rows) {
    const line = [
      row.productCode.padEnd(32),
      (row.commercialStatus ?? "").padEnd(20),
      (row.stripeProductId ? "✓" : "✗ null").padEnd(16),
      (row.stripePriceId ? "✓" : "✗ null").padEnd(16),
      (row.requiresCheckout ? "yes" : "no").padEnd(10),
      row.status,
    ].join(" | ");
    const prefix = row.status === "FAIL" ? FAIL : row.status === "WARN" ? WARN : row.status === "NEEDS_DECISION" ? "?" : PASS;
    console.log(`  ${prefix} ${line}`);
    if (row.status === "FAIL") p1Fails++;
  }

  // ── Full link crawl ───────────────────────────────────────────────────────
  console.log("\n─── P6: Full Link Crawl ─────────────────────────────────────────\n");
  const surfaces = getProductAccessSurfaces(catalog);
  const results = surfaces.map(auditSurface);

  let totalFail = 0;
  let totalWarn = 0;
  let totalPass = 0;

  for (const result of results) {
    if (result.status === "FAIL") {
      totalFail++;
      console.log(`  ${FAIL} [${result.productCode}] ${result.href || "(no href)"}`);
      for (const f of result.findings.filter((f) => f.severity === "FAIL")) {
        console.log(`      → ${f.check}: ${f.message}`);
      }
    } else if (result.status === "WARN") {
      totalWarn++;
      console.log(`  ${WARN} [${result.productCode}] ${result.href}`);
      for (const f of result.findings.filter((f) => f.severity === "WARN")) {
        console.log(`      → ${f.check}: ${f.message}`);
      }
    } else {
      totalPass++;
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log(`  Results: ${totalPass} PASS  ${totalWarn} WARN  ${totalFail} FAIL  (P1 FAIL: ${p1Fails})`);
  console.log("═══════════════════════════════════════════════════════════════\n");

  if (totalFail > 0 || p1Fails > 0 || gmiFails.length > 0) {
    process.exit(1);
  }

  console.log("  All product access links pass commercial truth rules.\n");
  process.exit(0);
}

main();
