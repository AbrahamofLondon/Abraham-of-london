import fs from "fs";
import path from "path";
import matter from "gray-matter";

import {
  getDraftLinkedInPosts,
  getPublishableLinkedInPosts,
  validateLinkedInOutboundItem,
  validateLinkedInSequence,
  type LinkedInOutboundItem,
} from "@/lib/outbound/linkedin-outbound-governance";
import { getMarketIntelligenceRecord } from "@/lib/intelligence/market-intelligence-lifecycle";

const LINKEDIN_DIR = path.join(process.cwd(), "content", "outbound", "linkedin");

function readMdxFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) return readMdxFiles(absolute);
      return entry.isFile() && entry.name.endsWith(".mdx") ? [absolute] : [];
    })
    .sort();
}

function normalizeItem(filePath: string): LinkedInOutboundItem {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = matter(raw);
  const relative = path.relative(LINKEDIN_DIR, filePath).replace(/\\/g, "/");

  return {
    ...(parsed.data as Record<string, unknown>),
    body: parsed.content,
    filename: relative,
  } as LinkedInOutboundItem;
}

const items = readMdxFiles(LINKEDIN_DIR).map(normalizeItem);
const sequenceResult = validateLinkedInSequence(items);
const itemResults = items.map((item) => ({
  item,
  result: validateLinkedInOutboundItem(item),
}));

const warnings = [
  ...sequenceResult.warnings.map((warning) => `sequence: ${warning}`),
  ...itemResults.flatMap(({ item, result }) =>
    result.warnings.map((warning) => `${item.filename || item.title}: ${warning}`),
  ),
];

const errors = [
  ...sequenceResult.errors.map((error) => `sequence: ${error}`),
  ...itemResults.flatMap(({ item, result }) =>
    result.errors.map((error) => `${item.filename || item.title}: ${error}`),
  ),
];

const counts = {
  total: items.length,
  draft: items.filter((item) => item.status === "draft").length,
  ready: items.filter((item) => item.status === "ready").length,
  published: items.filter((item) => item.status === "published" || item.published === true).length,
  posted: items.filter((item) => item.status === "posted").length,
  blocked: items.filter((item) => {
    if (item.status === "draft" || item.draft === true) return true;
    const report = item.linkedReportId ? getMarketIntelligenceRecord(item.linkedReportId) : null;
    return report?.lifecycleState === "DRAFT" || report?.lifecycleState === "SCHEDULED";
  }).length,
  publishable: getPublishableLinkedInPosts(items).length,
  drafts: getDraftLinkedInPosts(items).length,
};

console.log("LinkedIn outbound governance report");
console.log("-----------------------------------");
console.log(`Total posts: ${counts.total}`);
console.log(`Draft: ${counts.draft}`);
console.log(`Ready: ${counts.ready}`);
console.log(`Published/released: ${counts.published}`);
console.log(`Posted: ${counts.posted}`);
console.log(`Blocked: ${counts.blocked}`);
console.log(`Publishable: ${counts.publishable}`);
console.log(`Warnings: ${warnings.length}`);
console.log(`Errors: ${errors.length}`);

if (warnings.length > 0) {
  console.log("\nWarnings");
  for (const warning of warnings) console.log(`- ${warning}`);
}

if (errors.length > 0) {
  console.error("\nErrors");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
