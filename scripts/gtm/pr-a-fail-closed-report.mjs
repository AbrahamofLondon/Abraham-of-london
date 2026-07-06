#!/usr/bin/env node
/**
 * scripts/gtm/pr-a-fail-closed-report.mjs
 *
 * PR A deliverables (read-only):
 *   1. Catalogue <-> governance set-difference (set-based, no hardcoded counts).
 *   2. Per-product disposition for every product AFFECTED by the fail-closed rule
 *      (former resolver action = checkout, new = blocked, reason
 *      governance_unknown_fail_closed).
 *
 * Uses the commercial mirror (which now carries the fail-closed rule) purely to
 * report; it is not a certification authority. Writes reports/gtm/*.md + .json.
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  ROOT, allLiteralCatalogKeys, parseCatalogProduct, getGovernanceState,
  resolveCommercialAction, allGovernanceCodes, readFileSafe,
} from "../_commercial-mirror.mjs";

const OUT = join(ROOT, "reports", "gtm");
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const catalogKeys = allLiteralCatalogKeys();
const govCodes = allGovernanceCodes();
const catalogSet = new Set(catalogKeys);
const govSet = new Set(govCodes);
const gmiDynamic = ["gmi_q1_2026", "gmi_q2_2026", "gmi_q3_2026"];

const inBoth = govCodes.filter((c) => catalogSet.has(c) || gmiDynamic.includes(c));
const govOnly = govCodes.filter((c) => !catalogSet.has(c) && !gmiDynamic.includes(c));
const catalogOnly = catalogKeys.filter((c) => !govSet.has(c));

// ── Which page surfaces reference a product (informational) ──
const pricingText = readFileSafe("pages/pricing.tsx");
const productsText = readFileSafe("pages/products.tsx");
function surfacesFor(code) {
  const s = [];
  if (new RegExp(`CATALOG\\.${code}\\b`).test(pricingText)) s.push("/pricing");
  if (new RegExp(`CATALOG\\.${code}\\b`).test(productsText)) s.push("/products");
  return s.length ? s.join(", ") : "—";
}

// ── Affected products: fail-closed flipped them from checkout → blocked ──
const affected = [];
for (const key of catalogKeys) {
  const p = parseCatalogProduct(key);
  if (!p) continue;
  const g = getGovernanceState(key);
  const action = resolveCommercialAction(p, g);
  if (action.state === "blocked" && action.reason === "governance_unknown_fail_closed") {
    affected.push({
      code: key,
      former: "checkout",
      current: "blocked",
      stripe: p.stripeProductId && p.stripePriceId ? "complete" : "incomplete",
      catalogState: `${p.commercialStatus}/active=${p.active}`,
      price: p.displayPrice,
      governanceGap: g.known ? "(has record)" : "no governance record",
      surface: surfacesFor(key),
    });
  }
}

// ── Set-difference report ──
const sd = [];
sd.push("# Catalogue ↔ Governance Set Difference (PR A)\n");
sd.push(`Generated: ${new Date().toISOString()}\n`);
sd.push(`Catalogue literal products: ${catalogKeys.length} · Governance products: ${govCodes.length}\n`);
sd.push(`\n## In BOTH (${inBoth.length}) — governed + built\n`);
inBoth.forEach((c) => sd.push(`- ${c}`));
sd.push(`\n## Catalogue-only (${catalogOnly.length}) — SOLD/built but NOT in governance matrix\n`);
catalogOnly.forEach((c) => sd.push(`- ${c}`));
sd.push(`\n## Governance-only (${govOnly.length}) — governed ROADMAP, no catalogue implementation\n`);
govOnly.forEach((c) => sd.push(`- ${c}`));
writeFileSync(join(OUT, "catalogue-governance-set-difference.md"), sd.join("\n"));

// ── Disposition report ──
const dp = [];
dp.push("# PR A — Fail-Closed Disposition Report\n");
dp.push(`Generated: ${new Date().toISOString()}\n`);
dp.push(`\nProducts affected by the fail-closed rule (former action \`checkout\` → now \`blocked\`, reason \`governance_unknown_fail_closed\`): **${affected.length}**\n`);
dp.push("\nThese are paid, self-serve, Stripe-complete products with **no governance record**. Under fail-closed they are non-purchasable until individually classified through the governance/evidence process. No governance records were invented; none were reclassified as release-ready to preserve checkout.\n");
dp.push("\n| Product | Former | Now | Stripe | Catalogue state | Governance gap | Surface | Recommended next action |");
dp.push("|---|---|---|---|---|---|---|---|");
for (const a of affected) {
  dp.push(`| ${a.code} | ${a.former} | **${a.current}** | ${a.stripe} | ${a.catalogState} | ${a.governanceGap} | ${a.surface} | Classify via governance + evidence, or keep gated |`);
}
dp.push("\n## Recommended next action (all)\n");
dp.push("1. Owner + governance review each affected product: is it a legitimate self-serve seller (→ add a governed record with evidence) or should it remain gated?\n2. Only after a governance record exists does the resolver return `checkout` again — no code change needed (resolver reads governance).\n3. Do NOT reclassify to release-ready solely to restore checkout.\n");
writeFileSync(join(OUT, "pr-a-fail-closed-disposition.md"), dp.join("\n"));

// ── JSON companion ──
writeFileSync(join(OUT, "pr-a-fail-closed.json"), JSON.stringify({
  generatedAt: new Date().toISOString(),
  setDifference: { inBoth, catalogOnly, governanceOnly: govOnly },
  affected,
}, null, 2));

console.log(`Set difference: inBoth=${inBoth.length} catalogOnly=${catalogOnly.length} govOnly=${govOnly.length}`);
console.log(`Fail-closed affected products: ${affected.length}`);
affected.forEach((a) => console.log(`  - ${a.code} (${a.stripe} Stripe, ${a.surface})`));
console.log(`\nReports written to reports/gtm/`);
