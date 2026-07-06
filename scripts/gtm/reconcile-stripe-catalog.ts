/**
 * scripts/gtm/reconcile-stripe-catalog.ts
 *
 * PR B — run the reconciliation engine against the sanitized Stripe snapshot and
 * the local commercial catalogue. Writes machine + human readable reports.
 * Run: pnpm exec tsx scripts/gtm/reconcile-stripe-catalog.ts
 *
 * READ-ONLY. No Stripe calls here (uses the committed snapshot). No catalogue
 * write-back. No governance records. No active-flag changes.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  reconcile, recommendOrphanDisposition,
  type LocalCommercialProduct, type ReconResult,
} from "../../lib/commercial/stripe/stripe-reconciliation";
import type { StripeCatalogSnapshot } from "../../lib/commercial/stripe/stripe-catalog-adapter.server";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = join(ROOT, "reports", "gtm");

function str(body: string, f: string): string | null {
  const m = body.match(new RegExp(`${f}:\\s*"([^"]*)"`));
  return m ? m[1] : null;
}
function num(body: string, f: string): number | null {
  const m = body.match(new RegExp(`${f}:\\s*(-?\\d+)`));
  return m ? Number(m[1]) : null;
}
function bool(body: string, f: string): boolean | null {
  const m = body.match(new RegExp(`${f}:\\s*(true|false)`));
  return m ? m[1] === "true" : null;
}

/** Parse literal catalog.ts product blocks (data extraction only). */
function parseCatalogLocals(): LocalCommercialProduct[] {
  const txt = readFileSync(join(ROOT, "lib", "commercial", "catalog.ts"), "utf8");
  const re = /^  ([a-z][a-z0-9_]*):\s*\{([\s\S]*?)^  \},?$/gm;
  const out: LocalCommercialProduct[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(txt))) {
    const [, code, body] = m;
    if (!/\bcode:/.test(body)) continue;
    const accessType = str(body, "accessType");
    const duration = str(body, "duration");
    const recurringInterval = accessType === "subscription"
      ? (duration === "monthly" ? "month" : duration === "annual" ? "year" : null)
      : null;
    out.push({
      code,
      name: str(body, "displayName") ?? code,
      amount: num(body, "amount"),
      currency: "gbp",
      stripeProductId: str(body, "stripeProductId"),
      stripePriceId: str(body, "stripePriceId"),
      active: bool(body, "active") ?? true,
      commercialStatus: str(body, "commercialStatus"),
      recurringInterval,
    });
  }
  return out;
}

/** Parse the GMI edition registry for the dynamically-built GMI catalog products. */
function parseGmiLocals(): LocalCommercialProduct[] {
  const txt = readFileSafe(join(ROOT, "lib", "commercial", "gmi", "gmi-edition-registry.ts"));
  if (!txt) return [];
  const re = /\{\s*editionId:[\s\S]*?\}/g;
  const out: LocalCommercialProduct[] = [];
  for (const block of txt.match(re) ?? []) {
    const code = str(block, "productCode");
    if (!code) continue;
    const status = str(block, "status");
    const commercialStatus = status === "active" ? "paid" : status === "archived" ? "paid"
      : status === "manual_billing" ? "manual_billing" : status === "draft" ? "internal_only" : "retired";
    out.push({
      code,
      name: str(block, "title") ?? code,
      amount: num(block, "amountGbp"),
      currency: "gbp",
      stripeProductId: str(block, "stripeProductId"),
      stripePriceId: str(block, "stripePriceId"),
      active: status !== "retired" && status !== "draft",
      commercialStatus,
      recurringInterval: null,
    });
  }
  return out;
}

function readFileSafe(p: string): string {
  return existsSync(p) ? readFileSync(p, "utf8") : "";
}

function main() {
  if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });
  const snapPath = join(OUT, "stripe-catalog-snapshot.json");
  if (!existsSync(snapPath)) {
    console.error("Snapshot missing — run pull-stripe-catalog.ts first.");
    process.exit(1);
  }
  const snapshot = JSON.parse(readFileSync(snapPath, "utf8")) as StripeCatalogSnapshot;
  if (snapshot.keyMode === "test") {
    console.error("Snapshot is TEST mode — refusing to reconcile against production catalogue truth.");
    process.exit(1);
  }

  const locals = [...parseCatalogLocals(), ...parseGmiLocals()];
  const results = reconcile(snapshot, locals);

  const has = (r: ReconResult, c: string) => r.classifications.includes(c as never);
  const missingLocalId = results.filter((r) => has(r, "LOCAL_ID_MISSING"));
  const activeDrift = results.filter((r) => has(r, "ACTIVE_STATE_DRIFT"));
  const mismatches = results.filter((r) => ["AMOUNT_MISMATCH", "CURRENCY_MISMATCH", "INTERVAL_MISMATCH", "PRODUCT_ID_MISMATCH", "PRICE_ID_MISMATCH"].some((c) => has(r, c)));
  const orphans = results.filter((r) => has(r, "ORPHAN_REMOTE_PRODUCT"));
  const remoteMissing = results.filter((r) => has(r, "REMOTE_OBJECT_MISSING"));

  // JSON
  writeFileSync(join(OUT, "stripe-reconciliation.json"), JSON.stringify({
    generatedAt: new Date().toISOString(), keyMode: snapshot.keyMode, livemode: snapshot.livemode,
    remoteProducts: snapshot.productCount, remotePrices: snapshot.priceCount, localProducts: locals.length,
    results,
  }, null, 2));

  // Human report
  const L = [];
  L.push("# Stripe ↔ Catalogue Reconciliation (PR B, read-only)\n");
  L.push(`Generated: ${new Date().toISOString()}`);
  L.push(`Key mode: **${snapshot.keyMode.toUpperCase()}** · livemode: ${snapshot.livemode}`);
  L.push(`Live Stripe: ${snapshot.productCount} products, ${snapshot.priceCount} prices · Local catalogue products reconciled: ${locals.length}\n`);
  const counts: Record<string, number> = {};
  for (const r of results) for (const c of r.classifications) counts[c] = (counts[c] || 0) + 1;
  L.push("## Classification counts\n");
  Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => L.push(`- ${k}: ${v}`));

  const section = (title: string, rows: ReconResult[], render: (r: ReconResult) => string) => {
    L.push(`\n## ${title} (${rows.length})\n`);
    rows.forEach((r) => L.push(render(r)));
  };
  section("Local ID missing (live Stripe object exists; catalogue not bound)", missingLocalId,
    (r) => `- ${r.code} → product ${r.remoteProductId ?? "?"} price ${r.remotePriceId ?? "?"} (matched by ${r.matchedBy})`);
  section("Active-state drift (Stripe active ≠ catalogue active) — REVIEW, do not auto-sync", activeDrift,
    (r) => `- ${r.code}: stripeProductActive=${r.stripeProductActive} priceActive=${r.stripePriceActive} localActive=${r.localActive} status=${r.localCommercialStatus}`);
  section("Amount / currency / interval / ID mismatches", mismatches,
    (r) => `- ${r.code}: ${r.classifications.join(", ")} (product ${r.remoteProductId})`);
  section("Remote object missing (catalogue references an ID not in live Stripe)", remoteMissing,
    (r) => `- ${r.code}: stripeProductId not found live`);
  section("Orphan remote products (in Stripe, no catalogue) — recommendation only", orphans,
    (r) => `- ${r.remoteProductId} "${r.detail.replace('orphan remote: ', '')}" → recommend ${recommendOrphanDisposition(r.detail)}`);

  L.push("\n## Guardrails honoured\n");
  L.push("- No Stripe writes, no archive, no price deactivation, no metadata updates.");
  L.push("- No catalogue ID write-back, no governance records, no active-flag changes.");
  L.push("- Active-state facts reported separately (Stripe product/price vs catalogue vs governance); nothing auto-synced.");
  writeFileSync(join(OUT, "stripe-reconciliation.md"), L.join("\n"));

  console.log(`Reconciled ${locals.length} local products against ${snapshot.productCount} live Stripe products.`);
  console.log("Classification counts:", counts);
  console.log(`Reports: reports/gtm/stripe-reconciliation.{json,md}`);
}

main();
