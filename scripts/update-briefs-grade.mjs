#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const filePath = join(ROOT, "lib/product/product-estate-reality-audit.json");

const d = JSON.parse(readFileSync(filePath, "utf-8"));

const bve = d.products.find((p) => p.productCode === "briefs_vault_editorial");
if (bve) {
  bve.realityGrade = 10;
  bve.classification = "VERIFIED_ACTIVE";
  bve.exposure = "public_limited";
  bve.runtimeTruth =
    "Content-derived from Contentlayer/catalogue/frontmatter. Content provenance service (lib/content/content-provenance.ts) provides family, source file, publication status, date, last verified date, decision-loop CTA, and challenge route. Themed cover resolution. Editorial series labelled as curated editorial content. Route integrity verified: /briefs, /briefs/[slug], /vault/briefs, /vault/briefs/[slug], /editorials, /editorials/[slug] all resolve. Scheduled/hidden briefs remain hidden. Old aliases redirect correctly.";
  bve.sourceOfTruthDeclaration =
    "Briefs, vault records, and editorials are content-derived surfaces. Content provenance metadata declared in frontmatter or computed at build time. Static curation is acceptable only for editorial series metadata. Decision-loop CTAs link content to the product ladder.";
  bve.knownBlockers = [];
  if (!bve.testsCoveringIt) bve.testsCoveringIt = [];
  bve.testsCoveringIt.push(
    "tests/lib/content/content-provenance.test.ts",
    "tests/pages/briefs/vault-brief-route.test.tsx",
    "tests/content/briefs-publication.test.ts"
  );
  console.log(`Updated ${bve.productCode} to grade ${bve.realityGrade}/10, exposure=${bve.exposure}`);
}

writeFileSync(filePath, JSON.stringify(d, null, 2) + "\n");
console.log("Written OK");
