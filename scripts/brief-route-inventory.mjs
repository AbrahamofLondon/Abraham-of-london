#!/usr/bin/env node
/* scripts/brief-route-inventory.mjs — local brief-family route inventory */

import fs from "fs";
import path from "path";

const ROOT = process.cwd();

const GROUPS = [
  { key: "A", label: "content/briefs/*", dir: "content/briefs", type: "Brief" },
  { key: "B", label: "content/vault/briefs/*", dir: "content/vault/briefs", type: "VaultBrief" },
  { key: "C", label: "content/vault/indices/*", dir: "content/vault/indices", type: "VaultIndex" },
];

const VAULT_ALIASES = {
  "frontier-resilience-01": "frontier-resilience-surviving-volatility-without-losing-governing-order",
};

function normalize(input) {
  return String(input || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/")
    .replace(/\.(md|mdx)$/i, "");
}

function leaf(input) {
  const parts = normalize(input).split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

function parseFrontmatter(text) {
  if (!text.startsWith("---")) return {};
  const end = text.indexOf("\n---", 3);
  if (end < 0) return {};
  const raw = text.slice(3, end).split(/\r?\n/);
  const out = {};
  for (const line of raw) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    value = value.replace(/^['"]|['"]$/g, "");
    out[match[1]] = value;
  }
  return out;
}

function filesIn(dir) {
  const absolute = path.join(ROOT, dir);
  if (!fs.existsSync(absolute)) return [];
  return fs
    .readdirSync(absolute)
    .filter((file) => file.endsWith(".mdx"))
    .sort()
    .map((file) => path.join(dir, file).replace(/\\/g, "/"));
}

function routeFor(record) {
  if (record.group === "A") return `/briefs/${record.slug}`;
  if (record.group === "B") return `/vault/briefs/${record.slug}`;
  return null;
}

function shouldRender(record) {
  if (record.group === "A") return record.publicationStatus === "published";
  if (record.group === "B") return true;
  return false;
}

const records = [];

for (const group of GROUPS) {
  for (const sourcePath of filesIn(group.dir)) {
    const absolute = path.join(ROOT, sourcePath);
    const text = fs.readFileSync(absolute, "utf8");
    const fm = parseFrontmatter(text);
    const slug = leaf(fm.slug || sourcePath);
    const flattenedPath = normalize(sourcePath.replace(/^content\//, ""));
    const record = {
      group: group.key,
      sourceFilePath: sourcePath,
      documentType: group.type,
      title: fm.title || "(untitled)",
      slugFrontmatter: fm.slug || "",
      slug,
      flattenedPath,
      computedPublicRoute: group.key === "A" ? `/briefs/${slug}` : null,
      computedVaultRoute: group.key === "B" ? `/vault/briefs/${slug}` : null,
      publicationStatus: fm.publicationStatus || "",
      coverImage: fm.coverImage || "",
      ogImage: fm.ogImage || "",
      fileExists: fs.existsSync(absolute),
      shouldRender: false,
      shouldRedirect: false,
      shouldNotFound: false,
    };
    record.shouldRender = shouldRender(record);
    record.shouldNotFound = !record.shouldRender;
    records.push(record);
  }
}

for (const [alias, canonical] of Object.entries(VAULT_ALIASES)) {
  records.push({
    group: "D",
    sourceFilePath: "(alias map)",
    documentType: "Alias",
    title: `${alias} -> ${canonical}`,
    slugFrontmatter: alias,
    slug: alias,
    flattenedPath: "",
    computedPublicRoute: null,
    computedVaultRoute: `/vault/briefs/${alias}`,
    publicationStatus: "",
    coverImage: "",
    ogImage: "",
    fileExists: false,
    shouldRender: false,
    shouldRedirect: true,
    redirectDestination: `/vault/briefs/${canonical}`,
    shouldNotFound: false,
  });
}

for (const group of ["A", "B", "C", "D"]) {
  const subset = records.filter((record) => record.group === group);
  const label = group === "D" ? "legacy/alias slug records" : GROUPS.find((g) => g.key === group)?.label;
  console.log(`\n## ${group}. ${label} (${subset.length})`);
  for (const record of subset) {
    console.log(JSON.stringify(record));
  }
}

const summary = {
  publishedPublicBriefs: records.filter((r) => r.group === "A" && r.publicationStatus === "published").length,
  scheduledPublicBriefs: records.filter((r) => r.group === "A" && r.publicationStatus === "scheduled").length,
  vaultCanonBriefs: records.filter((r) => r.group === "B" && r.slug.startsWith("brief-")).length,
  frontierResilienceVaultBriefs: records.filter((r) => r.group === "B" && r.slug.startsWith("frontier-resilience-")).length,
  aliases: records.filter((r) => r.group === "D").length,
};

console.log("\n## Summary");
console.log(JSON.stringify(summary, null, 2));

