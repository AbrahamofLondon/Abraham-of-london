/**
 * scripts/gtm/pull-stripe-catalog.ts
 *
 * PR B — READ-ONLY pull of the live Stripe catalogue into a sanitized snapshot.
 * Run: pnpm exec tsx scripts/gtm/pull-stripe-catalog.ts
 *
 * Uses only products.list / prices.list (via the adapter). No writes. No secret
 * material or customer data is written. Reports the key mode explicitly.
 */

import { config } from "dotenv";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { pullStripeCatalogSnapshot } from "../../lib/commercial/stripe/stripe-catalog-adapter.server";

// Load .env (STRIPE_SECRET_KEY lives here). .env.local first for local overrides.
config({ path: ".env.local" });
config({ path: ".env" });

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = join(ROOT, "reports", "gtm");

async function main() {
  if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

  const snapshot = await pullStripeCatalogSnapshot();

  // Explicit mode report — never print the key.
  console.log(`Stripe key mode: ${snapshot.keyMode.toUpperCase()}`);
  console.log(`Stripe API version (pinned): ${snapshot.apiVersion}`);
  console.log(`livemode: ${snapshot.livemode}`);
  console.log(`Products retrieved: ${snapshot.productCount}`);
  console.log(`Prices retrieved:   ${snapshot.priceCount}`);

  if (snapshot.keyMode === "test") {
    console.warn("WARNING: key is TEST mode — this snapshot must NOT be used to assert production truth.");
  }

  const path = join(OUT, "stripe-catalog-snapshot.json");
  writeFileSync(path, JSON.stringify(snapshot, null, 2));
  console.log(`\nSanitized snapshot written to reports/gtm/stripe-catalog-snapshot.json`);
  console.log("(commercial catalogue data only — no secret material, no customer data)");
}

main().catch((err) => {
  // Never surface the secret; print a safe message.
  console.error("Stripe catalogue pull failed:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
