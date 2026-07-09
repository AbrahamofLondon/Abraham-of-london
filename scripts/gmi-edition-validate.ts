#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";
import { GMI_EDITION_REGISTRY } from "../lib/commercial/gmi/gmi-edition-registry";
import { getMarketIntelligenceRecord } from "../lib/intelligence/market-intelligence-lifecycle";
import { gmiPublicSlugForEditionSlug } from "../lib/intelligence/gmi-public-edition-resolver.server";

const editionId = process.argv[2];
if (!editionId) {
  console.error("Usage: pnpm gmi:edition:validate GMI-Q2-2026");
  process.exit(1);
}

const entry = GMI_EDITION_REGISTRY.find((item) => item.editionId === editionId) ?? null;
const lifecycle = getMarketIntelligenceRecord(editionId);
const contentPath = entry ? path.join(process.cwd(), "content", "artifacts", `global-market-intelligence-report-${entry.slug}.mdx`) : null;
const issues: string[] = [];
if (!entry) issues.push("missing_commercial_registry_entry");
if (!lifecycle) issues.push("missing_lifecycle_record");
if (contentPath && !fs.existsSync(contentPath)) issues.push("missing_content_package");
if (entry?.status === "active" && (!entry.stripeProductId || !entry.stripePriceId)) issues.push("active_checkout_missing_stripe_binding");
if (lifecycle?.lifecycleState === "ACTIVE_UNTIL_SUPERSEDED" && !lifecycle.publicVisible) issues.push("active_edition_not_public_visible");
if (lifecycle?.lifecycleState === "SUPERSEDED" && lifecycle.purchasable) issues.push("superseded_edition_still_purchasable");

console.log(JSON.stringify({
  ok: issues.length === 0,
  editionId,
  definition: Boolean(entry),
  lifecycle: lifecycle?.lifecycleState ?? null,
  publicSlug: entry ? gmiPublicSlugForEditionSlug(entry.slug) : null,
  contentPath,
  contentPresent: contentPath ? fs.existsSync(contentPath) : false,
  commerceStatus: entry?.status ?? null,
  stripeBound: Boolean(entry?.stripeProductId && entry?.stripePriceId),
  publicEligible: Boolean(lifecycle?.publicVisible && ["ACTIVE", "ACTIVE_UNTIL_SUPERSEDED", "SUPERSEDED", "ARCHIVED"].includes(lifecycle.lifecycleState)),
  issues,
}, null, 2));
process.exit(issues.length === 0 ? 0 : 1);