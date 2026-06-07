#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const filePath = join(ROOT, "lib/commercial/catalog.ts");

let c = readFileSync(filePath, "utf-8");

// Find the GMI Q1 entry start
const q1Start = c.indexOf('gmi_q1_2026: {');
if (q1Start < 0) {
  console.log("gmi_q1_2026 not found");
  process.exit(1);
}

// Find the end of the Q1 entry (the closing }, before the next entry)
const q1End = c.indexOf("  //", q1Start + 100);
if (q1End < 0) {
  console.log("Could not find end of Q1 entry");
  process.exit(1);
}

const q1Entry = c.substring(q1Start - 2, q1End);
console.log("Found Q1 entry:", q1Entry.substring(0, 80) + "...");

// Build the replacement
const q1Replacement = `  gmi_q1_2026: {
    code: "gmi_q1_2026",
    displayName: "Global Market Intelligence Report \\u2014 Q1 2026",
    amount: 5900,
    displayPrice: "\\u00a359",
    stripeProductId: null,
    stripePriceId: "price_1TP1rRQFpelVFMXJWaFMOpJQ",
    entitlementSlug: "global-market-intelligence-report-q1-2026",
    tier: "premium-report",
    category: "intelligence",
    accessType: "one_time",
    duration: "lifetime",
    active: true,
    commercialStatus: "paid",
    requiresCheckout: true,
    hiddenFromPricing: true,
    hiddenReason: "superseded_by_q2",
    shortDescription: "Q1 2026 market intelligence \\u2014 superseded by Q2 2026 edition. Available for historical reference.",
    pricingNote: "Coverage period: Q1 2026. Superseded by Q2 2026 edition. Updated 8 April 2026.",
    successPath: "/artifacts/global-market-intelligence-report-q1-2026",
    cancelPath: "/artifacts/global-market-intelligence-report-q1-2026",
    cookieName: null,
    includes: [],
  },

  gmi_q2_2026: {
    code: "gmi_q2_2026",
    displayName: "Global Market Intelligence Report \\u2014 Q2 2026",
    amount: 5900,
    displayPrice: "\\u00a359",
    stripeProductId: null,
    stripePriceId: null,
    entitlementSlug: "global-market-intelligence-report-q2-2026",
    tier: "premium-report",
    category: "intelligence",
    accessType: "one_time",
    duration: "lifetime",
    active: true,
    commercialStatus: "paid",
    requiresCheckout: true,
    hiddenFromPricing: false,
    shortDescription: "Q2 2026 market intelligence \\u2014 current published edition. Accountable market intelligence for the current decision window.",
    pricingNote: "Coverage period: Q2 2026. Current decision window: Q2 2026. Published June 2026.",
    successPath: "/artifacts/global-market-intelligence-report-q2-2026",
    cancelPath: "/artifacts/global-market-intelligence-report-q2-2026",
    cookieName: null,
    includes: [],
  },`;

c = c.replace(q1Entry, q1Replacement);
writeFileSync(filePath, c);
console.log("Updated catalog: Q1 hidden, Q2 added");
