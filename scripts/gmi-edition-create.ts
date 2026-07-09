#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function parsePeriod(): { quarter: string; year: string; slug: string; editionId: string; productCode: string; contentPath: string } {
  const periodFlag = process.argv.find((arg) => arg.startsWith("--period="));
  const period = periodFlag?.slice("--period=".length) || process.argv[2] || "";
  const match = /^(\d{4})-Q([1-4])$/i.exec(period.trim());
  if (!match) fail("Usage: pnpm gmi:edition:create --period=2026-Q3");
  const year = match[1];
  const quarter = `Q${match[2]}`;
  const slug = `${quarter.toLowerCase()}-${year}`;
  return {
    quarter,
    year,
    slug,
    editionId: `GMI-${quarter}-${year}`,
    productCode: `gmi_${quarter.toLowerCase()}_${year}`,
    contentPath: path.join(process.cwd(), "content", "artifacts", `global-market-intelligence-report-${slug}.mdx`),
  };
}

const edition = parsePeriod();
if (fs.existsSync(edition.contentPath)) {
  console.log(JSON.stringify({ ok: true, action: "exists", ...edition }, null, 2));
  process.exit(0);
}

const skeleton = `---
title: "Global Market Intelligence Report — ${edition.quarter} ${edition.year}"
slug: "global-market-intelligence-report-${edition.slug}"
productCode: "${edition.productCode}"
documentId: "${edition.editionId}"
version: "0.1.0-draft"
coveragePeriod: "${edition.quarter} ${edition.year}"
publicationStatus: "draft"
commercialMode: "draft"
checkout: false
stripeProductId: null
stripePriceId: null
classification: "Architect Tier"
access: "internal_preview"
notInvestmentAdvice: true
falsificationReviewRequired: true
sourceLockRequired: true
canonicalPath: "/artifacts/global-market-intelligence-report-${edition.slug}"
summary: "Draft quarterly decision-intelligence package. Not public, not purchasable, and not release-authorised."
---

# Global Market Intelligence Report — ${edition.quarter} ${edition.year}

Draft scaffold only. Complete the source appendix, call-review window, falsification register, board-pulse evidence, release-candidate hashes and PDF export before requesting owner authority.
`;

fs.mkdirSync(path.dirname(edition.contentPath), { recursive: true });
fs.writeFileSync(edition.contentPath, skeleton, "utf8");
console.log(JSON.stringify({ ok: true, action: "created_content_skeleton", ...edition, warnings: ["Add registry/lifecycle metadata separately; this command never publishes or grants authority."] }, null, 2));