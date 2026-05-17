/**
 * scripts/audit-public-route-coverage.mjs
 *
 * Guard public route families emitted by the brief/intelligence estate.
 * This is intentionally narrow: it protects the route families that the
 * public catalogue and market surfaces actively publish.
 */

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const failures = [];

const REQUIRED_ROUTES = [
  { family: "/briefs", file: "pages/briefs/index.tsx" },
  { family: "/briefs/[slug]", file: "pages/briefs/[slug].tsx" },
  { family: "/intelligence", file: "pages/intelligence/index.tsx" },
  { family: "/intelligence/[slug]", file: "pages/intelligence/[slug].tsx" },
  { family: "/intelligence/market", file: "pages/intelligence/market.tsx" },
  { family: "/library", file: "pages/library/index.tsx" },
  { family: "/provenance/demo", file: "pages/provenance/demo.tsx" },
  { family: "/trust", file: "pages/trust.tsx" },
  { family: "/pricing", file: "pages/pricing.tsx" },
];

for (const route of REQUIRED_ROUTES) {
  if (!fs.existsSync(route.file)) {
    failures.push(`Missing public route family ${route.family}: ${route.file}`);
  }
}

function readFrontmatter(relativePath) {
  const raw = fs.readFileSync(relativePath, "utf8");
  return matter(raw).data ?? {};
}

function isPublicCanonicalBrief(filePath) {
  const data = readFrontmatter(filePath);
  const tier = String(data.accessTier ?? data.accessLevel ?? "").toLowerCase();
  return (
    String(data.status ?? "").toLowerCase() === "canonical" &&
    tier === "public" &&
    data.draft !== true &&
    data.published !== false
  );
}

const briefsDir = "content/briefs";
const briefFiles = fs.existsSync(briefsDir)
  ? fs
      .readdirSync(briefsDir)
      .filter((file) => /\.(md|mdx)$/i.test(file))
      .map((file) => path.join(briefsDir, file))
  : [];

if (briefFiles.length === 0) {
  failures.push("content/briefs/ has no source files.");
}

const publicBriefSlugs = new Set(
  briefFiles
    .filter(isPublicCanonicalBrief)
    .map((file) => path.basename(file).replace(/\.(md|mdx)$/i, "")),
);

if (publicBriefSlugs.size === 0) {
  failures.push("No canonical public briefs are available for /briefs.");
}

const briefsIndexSource = fs.existsSync("pages/briefs/index.tsx")
  ? fs.readFileSync("pages/briefs/index.tsx", "utf8")
  : "";

if (briefsIndexSource.includes("vault/briefs")) {
  failures.push("Public briefs index references /vault/briefs/.");
}

if (!briefsIndexSource.includes("isRenderablePublicBrief")) {
  failures.push("Public briefs index does not explicitly filter renderable public briefs.");
}

const librarySource = fs.existsSync("lib/library/library-index.ts")
  ? fs.readFileSync("lib/library/library-index.ts", "utf8")
  : "";

if (librarySource.includes('type === "brief"') && !fs.existsSync("pages/briefs/[slug].tsx")) {
  failures.push("Library can emit brief items but pages/briefs/[slug].tsx is missing.");
}

if (librarySource.includes("/vault/briefs/")) {
  failures.push("Library source contains a direct /vault/briefs/ public emission.");
}

const marketSource = fs.existsSync("pages/intelligence/market.tsx")
  ? fs.readFileSync("pages/intelligence/market.tsx", "utf8")
  : "";

if (!marketSource.includes("isPublicBrief(doc)")) {
  failures.push("/intelligence/market no longer gates public read links through isPublicBrief.");
}

if (!marketSource.includes("View restricted metadata")) {
  failures.push("/intelligence/market no longer exposes restricted briefs as metadata-only.");
}

for (const match of marketSource.matchAll(/\/briefs\/([a-z0-9-]+)/gi)) {
  const slug = match[1];
  if (!publicBriefSlugs.has(slug)) {
    failures.push(`/intelligence/market references /briefs/${slug} without a canonical public source.`);
  }
}

const intelligenceDir = "content/intelligence";
const intelligenceIndexPath = path.join(intelligenceDir, "index.mdx");
const intelligenceFeaturePath = path.join(intelligenceDir, "decision-delay-governance-cost.mdx");
const intelligenceLandingSource = fs.existsSync("pages/intelligence/index.tsx")
  ? fs.readFileSync("pages/intelligence/index.tsx", "utf8")
  : "";

if (!fs.existsSync(intelligenceIndexPath)) {
  failures.push("content/intelligence/index.mdx is missing.");
}

if (!fs.existsSync(intelligenceFeaturePath)) {
  failures.push("Featured public intelligence brief decision-delay-governance-cost.mdx is missing.");
}

if (!intelligenceLandingSource.includes("/intelligence/decision-delay-governance-cost")) {
  failures.push("/intelligence no longer features the public delay-governance brief.");
}

if (fs.existsSync(intelligenceIndexPath)) {
  const indexData = readFrontmatter(intelligenceIndexPath);
  if (String(indexData.title ?? "") !== "Intelligence") {
    failures.push("content/intelligence/index.mdx is no longer clearly classified as the collection landing document.");
  }
}

if (failures.length > 0) {
  console.error("Public route coverage audit FAILED:");
  for (const failure of failures) console.error(`  ✗ ${failure}`);
  process.exit(1);
}

console.log("Public route coverage audit passed.");
