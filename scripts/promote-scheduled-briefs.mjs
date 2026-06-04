#!/usr/bin/env node
/**
 * scripts/promote-scheduled-briefs.mjs
 *
 * Safe, audited promotion of scheduled Intelligence Briefs.
 *
 * Rules:
 *   - Promotes any brief where publicationStatus === "scheduled"
 *     AND scheduledFor <= today's date
 *   - Never touches editorial-hold briefs
 *   - Never mutates unrelated frontmatter fields
 *   - Logs every change before writing
 *   - Supports --dry-run flag (preview without writing)
 *
 * Usage:
 *   pnpm exec node scripts/promote-scheduled-briefs.mjs            # apply
 *   pnpm exec node scripts/promote-scheduled-briefs.mjs --dry-run  # preview only
 *   pnpm exec node scripts/promote-scheduled-briefs.mjs --date 2026-07-03  # target date override
 *
 * After running, regenerate the briefs registry:
 *   pnpm exec node scripts/generate-briefs-registry.mjs
 */

import fs from "fs";
import path from "path";

const DRY_RUN = process.argv.includes("--dry-run");
const DATE_FLAG = process.argv.indexOf("--date");
const TARGET_DATE = DATE_FLAG >= 0 ? new Date(process.argv[DATE_FLAG + 1]) : new Date();

const BRIEFS_DIR = path.resolve(process.cwd(), "content", "briefs");
const TODAY = new Date(TARGET_DATE.toISOString().split("T")[0]); // midnight local

console.log(`
[promote-scheduled-briefs]
Mode     : ${DRY_RUN ? "DRY RUN (no files written)" : "LIVE"}
Today    : ${TODAY.toISOString().split("T")[0]}
Directory: ${BRIEFS_DIR}
`);

// ─── Frontmatter parser (minimal, line-by-line) ─────────────────────────────

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]+?)\r?\n---/);
  if (!match) return null;
  const lines = match[1].split(/\r?\n/);
  const fields = {};
  for (const line of lines) {
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (kv) fields[kv[1]] = kv[2].replace(/^["']|["']$/g, "").trim();
  }
  return { raw: match[0], text: match[1], fields };
}

// ─── Safe field updater — only touches publicationStatus and publishedAt ─────

function applyPromotion(content, today) {
  // Replace only the publicationStatus and add/update publishedAt
  let updated = content;

  // Update publicationStatus: scheduled → published
  updated = updated.replace(/(?m)^(publicationStatus:\s*)scheduled(\s*)$/, `$1published$2`);

  // If publishedAt already exists, leave it. If not, add it after publicationStatus.
  if (!updated.match(/(?m)^publishedAt:/)) {
    updated = updated.replace(
      /(?m)^(publicationStatus:\s*published)/,
      `$1\npublishedAt: "${today}"`
    );
  }

  return updated;
}

// ─── Main ────────────────────────────────────────────────────────────────────

const files = fs.readdirSync(BRIEFS_DIR).filter(
  (f) =>
    (f.startsWith("institutional-alpha") || f.startsWith("sovereign-intelligence")) &&
    f.endsWith(".mdx")
);

let promoted = 0;
let skipped = 0;
let held = 0;
let notYet = 0;

for (const filename of files) {
  const filePath = path.join(BRIEFS_DIR, filename);
  const content = fs.readFileSync(filePath, "utf-8");
  const fm = parseFrontmatter(content);

  if (!fm) {
    console.warn(`  [SKIP] ${filename}: no frontmatter`);
    skipped++;
    continue;
  }

  const status = fm.fields.publicationStatus ?? "";
  const scheduled = fm.fields.scheduledFor ?? "";

  if (status === "editorial-hold") {
    held++;
    continue;
  }

  if (status !== "scheduled") {
    skipped++;
    continue;
  }

  if (!scheduled) {
    console.warn(`  [WARN] ${filename}: status=scheduled but no scheduledFor date`);
    skipped++;
    continue;
  }

  const schedDate = new Date(scheduled);
  if (isNaN(schedDate.getTime())) {
    console.warn(`  [WARN] ${filename}: unparseable scheduledFor date "${scheduled}"`);
    skipped++;
    continue;
  }

  if (schedDate > TODAY) {
    notYet++;
    continue;
  }

  const todayStr = TODAY.toISOString().split("T")[0];
  const promoted_content = applyPromotion(content, todayStr);

  if (promoted_content === content) {
    console.warn(`  [WARN] ${filename}: no change applied (regex may not have matched)`);
    skipped++;
    continue;
  }

  console.log(`  [PROMOTE${DRY_RUN ? " (dry)" : ""}] ${filename}`);
  console.log(`            scheduledFor=${scheduled} → publicationStatus=published publishedAt=${todayStr}`);

  if (!DRY_RUN) {
    fs.writeFileSync(filePath, promoted_content, "utf-8");
  }

  promoted++;
}

console.log(`
Summary:
  Promoted  : ${promoted}${DRY_RUN ? " (not written — dry run)" : ""}
  Not yet   : ${notYet}  (scheduledFor > today)
  On hold   : ${held}
  Skipped   : ${skipped}  (already published or no status)

${promoted > 0 && !DRY_RUN
  ? "Next step: pnpm exec node scripts/generate-briefs-registry.mjs"
  : promoted > 0 && DRY_RUN
  ? "Re-run without --dry-run to apply."
  : "Nothing to promote today."
}
`);

process.exit(held > 0 ? 0 : 0); // editorial-hold never causes non-zero exit
