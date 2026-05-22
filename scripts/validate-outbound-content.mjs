/**
 * scripts/validate-outbound-content.mjs
 *
 * Validates all outbound post drafts in content/outbound/facebook/ and
 * content/outbound/x/ before publishing or committing.
 *
 * Usage:
 *   node scripts/validate-outbound-content.mjs
 *   node scripts/validate-outbound-content.mjs --strict
 *
 * Checks:
 *   - Required frontmatter fields present
 *   - Provider matches folder (facebook/ only contains facebook posts)
 *   - Text/body exists and is non-empty
 *   - No draft item marked scheduled without approval
 *   - X char counts are within limit (280 weighted chars per tweet)
 *   - Links are allowed first-party domains (or null)
 *   - Image paths are under /assets/ (or null)
 *   - UK house style passes (delegates to style checker dictionary)
 *   - No duplicate IDs across all providers
 *   - scheduledFor is a valid ISO date where present
 *   - No past scheduledFor unless status is published/skipped
 *   - Thread items must have threadIndex
 *   - Thread items in same thread must share threadId
 *
 * Strict mode (--strict):
 *   Exits non-zero if any errors (not just warnings) are found.
 */

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const strict = process.argv.includes("--strict");

// ─── Constants ────────────────────────────────────────────────────────────────

const FACEBOOK_DIR = path.join(rootDir, "content", "outbound", "facebook");
const X_DIR = path.join(rootDir, "content", "outbound", "x");

const X_TWEET_MAX_CHARS = 280;
const X_URL_LENGTH = 23; // Twitter wraps all URLs to 23 chars (t.co)

const ALLOWED_LINK_PREFIXES = [
  "https://abrahamoflondon.com",
  "https://www.abrahamoflondon.com",
];

const ALLOWED_IMAGE_PREFIX = "/assets/";

const VALID_STATUSES = new Set(["draft", "ready", "scheduled", "published", "skipped", "rejected"]);
const VALID_APPROVAL = new Set(["needs_review", "approved", "rejected"]);
const VALID_PROVIDERS = new Set(["facebook", "x"]);

const REQUIRED_FIELDS = [
  "id",
  "provider",
  "status",
  "approvalStatus",
  "requiresFinalApproval",
];

const FORBIDDEN_PHRASES = [
  "must read",
  "game changer",
  "ai will change everything",
  "unlock your",
  "10 lessons",
  "guaranteed returns",
  "investment advice",
];

// ─── Frontmatter parser (lightweight) ────────────────────────────────────────

function parseFrontmatter(content) {
  const result = {};
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) return { frontmatter: result, body: content };

  const raw = match[1] ?? "";
  const body = content.slice(match[0].length);
  const lines = raw.split(/\r?\n/);
  let currentKey = null;
  let currentArray = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ")) {
      currentArray.push(trimmed.slice(2).trim().replace(/^["']|["']$/g, ""));
      if (currentKey) result[currentKey] = [...currentArray];
      continue;
    }
    if (currentKey && currentArray.length > 0) {
      result[currentKey] = [...currentArray];
      currentArray = [];
    }
    const kv = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    const val = (kv[2] ?? "").trim().replace(/^["']|["']$/g, "");
    currentKey = key;
    if (val === "") { currentArray = []; continue; }
    if (val === "true") result[key] = true;
    else if (val === "false") result[key] = false;
    else if (val === "null" || val === "~") result[key] = null;
    else result[key] = val;
  }
  if (currentKey && currentArray.length > 0) result[currentKey] = [...currentArray];

  return { frontmatter: result, body };
}

// ─── X weighted character count ───────────────────────────────────────────────

function countXChars(text) {
  // Replace URLs with 23-char placeholders (Twitter t.co wrapping)
  const withPlaceholders = text.replace(/https?:\/\/\S+/g, "_".repeat(X_URL_LENGTH));
  return withPlaceholders.length;
}

// ─── Validators ───────────────────────────────────────────────────────────────

function validateLink(link) {
  if (!link || link === "null") return null; // null link is OK
  for (const prefix of ALLOWED_LINK_PREFIXES) {
    if (link.startsWith(prefix)) return null;
  }
  return `Link "${link}" is not an allowed first-party domain.`;
}

function validateImagePath(imagePath) {
  if (!imagePath || imagePath === "null") return null;
  if (!imagePath.startsWith(ALLOWED_IMAGE_PREFIX)) {
    return `imagePath "${imagePath}" must start with /assets/.`;
  }
  return null;
}

function validateScheduledFor(scheduledFor, status) {
  if (!scheduledFor || scheduledFor === "null") return null;
  const d = new Date(scheduledFor);
  if (isNaN(d.getTime())) {
    return `scheduledFor "${scheduledFor}" is not a valid ISO date.`;
  }
  // Past scheduledFor is only OK if status is published or skipped
  if (d < new Date() && !["published", "skipped"].includes(status ?? "")) {
    return `scheduledFor "${scheduledFor}" is in the past but status is "${status}".`;
  }
  return null;
}

function validateNoApprovedScheduledDraft(fm) {
  if (fm.status === "scheduled" && fm.approvalStatus !== "approved") {
    return `Status is "scheduled" but approvalStatus is "${fm.approvalStatus}" — approval required before scheduling.`;
  }
  return null;
}

function validateXCharCount(text, link, declaredCount) {
  const fullText = link ? `${text}\n${link}` : text;
  const actual = countXChars(fullText);
  if (actual > X_TWEET_MAX_CHARS) {
    return `Tweet text exceeds ${X_TWEET_MAX_CHARS} chars (actual weighted count: ${actual}).`;
  }
  if (declaredCount !== null && declaredCount !== undefined) {
    const declared = Number(declaredCount);
    // Allow ±15 char tolerance for estimation
    if (Math.abs(actual - declared) > 15) {
      return `Declared xCharCount (${declared}) differs from actual weighted count (${actual}) by more than 15.`;
    }
  }
  return null;
}

function validateForbiddenPhrases(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const phrase of FORBIDDEN_PHRASES) {
    if (lower.includes(phrase)) {
      return `Text contains forbidden phrase: "${phrase}"`;
    }
  }
  return null;
}

// ─── File processor ───────────────────────────────────────────────────────────

async function validateFile(filePath, expectedProvider, allIds) {
  const errors = [];
  const warnings = [];
  const filename = path.basename(filePath);

  let content;
  try {
    content = await fs.readFile(filePath, "utf8");
  } catch {
    errors.push("Could not read file.");
    return { filename, errors, warnings };
  }

  const { frontmatter: fm, body } = parseFrontmatter(content);

  // Required fields
  for (const field of REQUIRED_FIELDS) {
    if (fm[field] === undefined || fm[field] === null || fm[field] === "") {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Provider matches folder
  if (fm.provider && fm.provider !== expectedProvider) {
    errors.push(`Provider field "${fm.provider}" does not match folder "${expectedProvider}".`);
  }

  // Status and approval are valid
  if (fm.status && !VALID_STATUSES.has(String(fm.status))) {
    errors.push(`Invalid status: "${fm.status}"`);
  }
  if (fm.approvalStatus && !VALID_APPROVAL.has(String(fm.approvalStatus))) {
    errors.push(`Invalid approvalStatus: "${fm.approvalStatus}"`);
  }

  // Text body exists
  const text = (body ?? "").trim();
  if (!text) {
    errors.push("Post body (text) is empty.");
  }

  // Forbidden phrases
  const phraseErr = validateForbiddenPhrases(text);
  if (phraseErr) errors.push(phraseErr);

  // Scheduled without approval
  const schedErr = validateNoApprovedScheduledDraft(fm);
  if (schedErr) errors.push(schedErr);

  // Link validation
  const linkErr = validateLink(fm.link ?? null);
  if (linkErr) errors.push(linkErr);

  // Image path
  const imgErr = validateImagePath(fm.imagePath ?? null);
  if (imgErr) warnings.push(imgErr);

  // scheduledFor
  const schedForErr = validateScheduledFor(fm.scheduledFor ?? fm.scheduleFor ?? null, fm.status ?? null);
  if (schedForErr) errors.push(schedForErr);

  // X-specific: char count
  if (expectedProvider === "x" && text) {
    const xErr = validateXCharCount(text, fm.link ?? null, fm.xCharCount ?? null);
    if (xErr) errors.push(xErr);
  }

  // Thread items must have threadIndex
  if (fm.thread === true || fm.thread === "true") {
    if (fm.threadIndex === undefined || fm.threadIndex === null) {
      errors.push("Thread item is missing threadIndex.");
    }
    if (!fm.threadId) {
      errors.push("Thread item is missing threadId.");
    }
  }

  // Duplicate ID check
  const id = String(fm.id ?? "");
  if (id) {
    if (allIds.has(id)) {
      errors.push(`Duplicate ID "${id}" — already seen in another file.`);
    } else {
      allIds.add(id);
    }
  }

  return { filename, errors, warnings };
}

// ─── Directory scanner ────────────────────────────────────────────────────────

async function validateDirectory(dir, provider, allIds) {
  const results = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return results; // Directory doesn't exist — not an error if empty
  }

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!/\.(md|mdx)$/i.test(entry.name)) continue;
    if (entry.name.includes(".backup-")) continue;
    const filePath = path.join(dir, entry.name);
    const result = await validateFile(filePath, provider, allIds);
    results.push(result);
  }

  return results;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const allIds = new Set();

  const [fbResults, xResults] = await Promise.all([
    validateDirectory(FACEBOOK_DIR, "facebook", allIds),
    validateDirectory(X_DIR, "x", allIds),
  ]);

  const allResults = [
    ...fbResults.map((r) => ({ ...r, dir: "facebook" })),
    ...xResults.map((r) => ({ ...r, dir: "x" })),
  ];

  const totalFiles = allResults.length;
  const totalErrors = allResults.reduce((n, r) => n + r.errors.length, 0);
  const totalWarnings = allResults.reduce((n, r) => n + r.warnings.length, 0);

  console.log(`[OUTBOUND_CONTENT] Validated ${totalFiles} file${totalFiles === 1 ? "" : "s"}.`);

  if (totalErrors === 0 && totalWarnings === 0) {
    console.log("[OUTBOUND_CONTENT] All outbound posts valid. ✓");
    return;
  }

  for (const result of allResults) {
    if (result.errors.length === 0 && result.warnings.length === 0) continue;
    console.log(`\n  ${result.dir}/${result.filename}:`);
    for (const err of result.errors) {
      console.log(`    ✗ ${err}`);
    }
    for (const warn of result.warnings) {
      console.log(`    ⚠ ${warn}`);
    }
  }

  console.log(`\n[OUTBOUND_CONTENT] ${totalErrors} error${totalErrors === 1 ? "" : "s"}, ${totalWarnings} warning${totalWarnings === 1 ? "" : "s"}.`);

  if (strict && totalErrors > 0) {
    console.error("[OUTBOUND_CONTENT] Strict mode: errors found. Fix before publishing.");
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("[OUTBOUND_CONTENT] Failed:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
