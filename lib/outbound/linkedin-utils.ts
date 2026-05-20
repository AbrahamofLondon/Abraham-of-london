/**
 * lib/outbound/linkedin-utils.ts — LinkedIn Outbound Utilities
 *
 * Server-side utilities for reading, parsing, and managing LinkedIn outbound
 * posts stored in content/outbound/linkedin/.
 *
 * Safe for use in getServerSideProps and API routes only.
 * Do NOT import into client components directly.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import fs from "fs";
import path from "path";
import type {
  LinkedInFrontmatter,
  LinkedInPost,
  LinkedInStatus,
} from "./linkedin-types";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const LINKEDIN_DIR = path.join(process.cwd(), "content", "outbound", "linkedin");
const POSTED_DIR = path.join(LINKEDIN_DIR, "posted");
const MAX_LINKEDIN_CHARS = 3000;

const LINKEDIN_PILLARS = [
  "decision_authority",
  "strategy_room",
  "provenance",
  "executive_reporting",
  "decision_centre",
  "leadership",
  "faith_strategy",
  "market_intelligence",
] as const;

const LINKEDIN_AUDIENCES = [
  "operators",
  "founders",
  "executives",
  "boards",
  "consultants",
  "general",
] as const;

const LINKEDIN_STATUSES: LinkedInStatus[] = [
  "draft",
  "ready",
  "published",
  "posted",
  "retired",
  "archived",
  "needs_review",
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function assertServerRuntime(): void {
  if (typeof window !== "undefined") {
    throw new Error(
      "lib/outbound/linkedin-utils.ts was imported into a browser bundle. Use server-side only.",
    );
  }
}

function safeStr(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return fallback;
}

function safeArr(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => safeStr(x)).filter(Boolean) : [];
}

function safeStrNullable(v: unknown): string | null {
  const s = safeStr(v);
  return s || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Frontmatter parsing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse frontmatter from an MDX file content.
 * Returns the raw frontmatter object and the body content.
 */
export function parseMdxFrontmatter(
  content: string,
): { frontmatter: Record<string, unknown>; body: string } {
  const frontmatter: Record<string, unknown> = {};
  let body = content;

  const match = content.match(/^---\n([\s\S]*?)\n---\n/);
  if (match && match[1] !== undefined) {
    const raw = match[1];
    body = content.slice(match[0].length);

    // Simple YAML-like parser for frontmatter fields
    const lines = raw.split("\n");
    let currentKey: string | null = null;
    let currentArray: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // Array item
      if (trimmed.startsWith("- ")) {
        currentArray.push(trimmed.slice(2).trim());
        if (currentKey !== null) {
          frontmatter[currentKey] = [...currentArray];
        }
        continue;
      }

      // If we were collecting an array, flush it
      if (currentKey !== null && currentArray.length > 0) {
        frontmatter[currentKey] = [...currentArray];
        currentArray = [];
      }

      // Key-value pair
      const kvMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/);
      if (kvMatch && kvMatch[1]) {
        const key = kvMatch[1];
        currentKey = key;
        const value = (kvMatch[2] ?? "").trim();

        if (value === "" || value === "null") {
          frontmatter[key] = null;
        } else if (value === "true") {
          frontmatter[key] = true;
        } else if (value === "false") {
          frontmatter[key] = false;
        } else if (/^\d+$/.test(value)) {
          frontmatter[key] = parseInt(value, 10);
        } else if (/^\d+\.\d+$/.test(value)) {
          frontmatter[key] = parseFloat(value);
        } else if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          frontmatter[key] = value.slice(1, -1);
        } else {
          frontmatter[key] = value;
        }
      }
    }

    // Flush remaining array
    if (currentKey !== null && currentArray.length > 0) {
      frontmatter[currentKey] = [...currentArray];
    }
  }

  return { frontmatter, body: body.trim() };
}

// ─────────────────────────────────────────────────────────────────────────────
// Post classification
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Classify an MDX file as a LinkedIn post, script, essay, or misplaced asset.
 */
export function classifyPost(
  frontmatter: Record<string, unknown>,
  body: string,
  filename: string,
): "post" | "script" | "essay" | "misplaced_asset" {
  const title = safeStr(frontmatter.title).toLowerCase();
  const bodyLower = body.toLowerCase();
  const wordCount = body.split(/\s+/).filter(Boolean).length;

  // Explicit classification from frontmatter
  if (frontmatter.structure === "conversion" && wordCount > 150) {
    return "script";
  }

  // Strategy Room conversion script detection
  if (
    filename.includes("strategy-room-conversion") ||
    filename.includes("conversion-script")
  ) {
    return "script";
  }

  // Check for script-like content
  const scriptIndicators = [
    "enter strategy room",
    "the decision is locked",
    "once you enter",
    "if you are not ready to act",
    "this only works if",
  ];
  const scriptScore = scriptIndicators.filter((i) => bodyLower.includes(i)).length;

  if (scriptScore >= 3) {
    return "script";
  }

  // Essay detection (very long content)
  if (wordCount > 500) {
    return "essay";
  }

  // Check for misplaced asset indicators
  const misplacedIndicators = [
    "<!--",
    "---",
    "table of contents",
    "chapter",
    "appendix",
  ];
  const misplacedScore = misplacedIndicators.filter((i) => bodyLower.includes(i)).length;

  if (misplacedScore >= 2) {
    return "misplaced_asset";
  }

  return "post";
}

// ─────────────────────────────────────────────────────────────────────────────
// Post validation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate a LinkedIn post and return warnings.
 */
export function validatePost(
  frontmatter: Record<string, unknown>,
  body: string,
): string[] {
  const warnings: string[] = [];
  const charCount = body.length;

  // Character count warning
  if (charCount > MAX_LINKEDIN_CHARS) {
    warnings.push(
      `Exceeds LinkedIn character limit (${charCount.toLocaleString()}/${MAX_LINKEDIN_CHARS.toLocaleString()}). Post will be truncated.`,
    );
  }

  // Missing required frontmatter
  const requiredFields = ["title", "platform", "channel"];
  for (const field of requiredFields) {
    if (!frontmatter[field] || safeStr(frontmatter[field]).trim() === "") {
      warnings.push(`Missing required frontmatter field: "${field}".`);
    }
  }

  // Platform check
  if (safeStr(frontmatter.platform) !== "linkedin") {
    warnings.push(`Platform is not set to "linkedin" (got "${frontmatter.platform}").`);
  }

  // Channel check
  if (!["company", "linkedin"].includes(safeStr(frontmatter.channel))) {
    warnings.push(`Channel is not set to "company" or "linkedin" (got "${frontmatter.channel}").`);
  }

  // Status check
  if (!frontmatter.status || !LINKEDIN_STATUSES.includes(frontmatter.status as LinkedInStatus)) {
    warnings.push(
      `Status is missing or invalid. Expected one of: ${LINKEDIN_STATUSES.join(", ")}.`,
    );
  }

  // Pillar check
  if (frontmatter.pillar && !LINKEDIN_PILLARS.includes(frontmatter.pillar as any)) {
    warnings.push(
      `Pillar "${frontmatter.pillar}" is not in the allowed list: ${LINKEDIN_PILLARS.join(", ")}.`,
    );
  }

  // Audience check
  if (frontmatter.audience && !LINKEDIN_AUDIENCES.includes(frontmatter.audience as any)) {
    warnings.push(
      `Audience "${frontmatter.audience}" is not in the allowed list: ${LINKEDIN_AUDIENCES.join(", ")}.`,
    );
  }

  // CTA URL check
  if (frontmatter.ctaLabel && !frontmatter.ctaUrl) {
    warnings.push('Has "ctaLabel" but no "ctaUrl".');
  }

  // Hashtags
  const hashtags = safeArr(frontmatter.hashtags);
  if (hashtags.length === 0) {
    warnings.push("No hashtags defined.");
  }

  return warnings;
}

// ─────────────────────────────────────────────────────────────────────────────
// File operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Read all LinkedIn posts from the outbound directory.
 */
export function getAllLinkedInPosts(includePosted = false): LinkedInPost[] {
  assertServerRuntime();

  const posts: LinkedInPost[] = [];

  // Read active directory
  if (fs.existsSync(LINKEDIN_DIR)) {
    const files = fs
      .readdirSync(LINKEDIN_DIR)
      .filter((f) => f.endsWith(".mdx") && f !== "posted");

    for (const file of files) {
      const filePath = path.join(LINKEDIN_DIR, file);
      const content = fs.readFileSync(filePath, "utf8");
      posts.push(buildPost(file, content, false));
    }
  }

  // Read posted directory
  if (includePosted && fs.existsSync(POSTED_DIR)) {
    const files = fs
      .readdirSync(POSTED_DIR)
      .filter((f) => f.endsWith(".mdx"));

    for (const file of files) {
      const filePath = path.join(POSTED_DIR, file);
      const content = fs.readFileSync(filePath, "utf8");
      posts.push(buildPost(file, content, true));
    }
  }

  // Sort by filename (numbered order)
  posts.sort((a, b) => a.filename.localeCompare(b.filename));

  return posts;
}

/**
 * Build a LinkedInPost object from raw file content.
 */
function buildPost(
  filename: string,
  content: string,
  isPosted: boolean,
): LinkedInPost {
  const { frontmatter, body } = parseMdxFrontmatter(content);
  const wordCount = body.split(/\s+/).filter(Boolean).length;
  const charCount = body.length;
  const warnings = validatePost(frontmatter, body);
  const classification = classifyPost(frontmatter, body, filename);

  // Determine if LinkedIn-ready
  const isLinkedInReady =
    !isPosted &&
    classification === "post" &&
    safeStr(frontmatter.platform) === "linkedin" &&
    ["company", "linkedin"].includes(safeStr(frontmatter.channel)) &&
    ["ready", "published"].includes(safeStr(frontmatter.status)) &&
    charCount <= MAX_LINKEDIN_CHARS &&
    warnings.filter((w) => w.startsWith("Missing required")).length === 0;

  return {
    filename,
    frontmatter: frontmatter as Partial<LinkedInFrontmatter>,
    body,
    wordCount,
    charCount,
    isPosted,
    isLinkedInReady,
    warnings,
    classification,
  };
}

/**
 * Get a single LinkedIn post by filename.
 */
export function getLinkedInPost(filename: string): LinkedInPost | null {
  assertServerRuntime();

  // Check active directory
  const activePath = path.join(LINKEDIN_DIR, filename);
  if (fs.existsSync(activePath)) {
    const content = fs.readFileSync(activePath, "utf8");
    return buildPost(filename, content, false);
  }

  // Check posted directory
  const postedPath = path.join(POSTED_DIR, filename);
  if (fs.existsSync(postedPath)) {
    const content = fs.readFileSync(postedPath, "utf8");
    return buildPost(filename, content, true);
  }

  return null;
}

/**
 * Mark a post as posted: update frontmatter, move file to posted/.
 */
export function markPostAsPosted(
  filename: string,
  linkedinPostUrl: string,
  postedAt?: string,
): { ok: boolean; error?: string } {
  assertServerRuntime();

  const activePath = path.join(LINKEDIN_DIR, filename);
  if (!fs.existsSync(activePath)) {
    return { ok: false, error: `File not found: ${filename}` };
  }

  // Read current content
  const content = fs.readFileSync(activePath, "utf8");
  const { frontmatter, body } = parseMdxFrontmatter(content);

  // Check if already posted
  if (frontmatter.status === "posted") {
    return { ok: false, error: `Post "${filename}" is already marked as posted.` };
  }

  // Build new frontmatter
  const timestamp = postedAt || new Date().toISOString();
  const newFrontmatter: Record<string, unknown> = {
    ...frontmatter,
    status: "posted",
    postedAt: timestamp,
    linkedinPostUrl,
  };

  // Serialize frontmatter
  const fmLines = Object.entries(newFrontmatter).map(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length === 0) return `${key}: []`;
        return `${key}:\n${value.map((v) => `  - ${v}`).join("\n")}`;
      }
      if (value === null || value === undefined) return `${key}: null`;
      if (typeof value === "boolean") return `${key}: ${value}`;
      if (typeof value === "number") return `${key}: ${value}`;
      // String — quote if it contains special chars
      const str = String(value);
      if (str.includes(":") || str.includes("#") || str.includes("\n") || str.includes('"')) {
        return `${key}: "${str.replace(/"/g, '\\"')}"`;
      }
      return `${key}: ${str}`;
    });

  const newContent = `---\n${fmLines.join("\n")}\n---\n\n${body}\n`;

  // Ensure posted directory exists
  if (!fs.existsSync(POSTED_DIR)) {
    fs.mkdirSync(POSTED_DIR, { recursive: true });
  }

  // Check if target exists
  const postedPath = path.join(POSTED_DIR, filename);
  if (fs.existsSync(postedPath)) {
    return {
      ok: false,
      error: `File already exists in posted/: ${filename}. Remove it first or use a different filename.`,
    };
  }

  // Write to posted directory
  fs.writeFileSync(postedPath, newContent, "utf8");

  // Remove from active directory
  fs.unlinkSync(activePath);

  return { ok: true };
}

/**
 * Update the status of a LinkedIn post.
 */
export function updatePostStatus(
  filename: string,
  status: LinkedInStatus,
): { ok: boolean; error?: string } {
  assertServerRuntime();

  const activePath = path.join(LINKEDIN_DIR, filename);
  if (!fs.existsSync(activePath)) {
    return { ok: false, error: `File not found: ${filename}` };
  }

  if (!LINKEDIN_STATUSES.includes(status)) {
    return {
      ok: false,
      error: `Invalid status "${status}". Expected one of: ${LINKEDIN_STATUSES.join(", ")}.`,
    };
  }

  const content = fs.readFileSync(activePath, "utf8");
  const { frontmatter, body } = parseMdxFrontmatter(content);

  // Build new frontmatter with updated status
  const newFrontmatter: Record<string, unknown> = {
    ...frontmatter,
    status,
  };

  const fmLines = Object.entries(newFrontmatter).map(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length === 0) return `${key}: []`;
        return `${key}:\n${value.map((v) => `  - ${v}`).join("\n")}`;
      }
      if (value === null || value === undefined) return `${key}: null`;
      if (typeof value === "boolean") return `${key}: ${value}`;
      if (typeof value === "number") return `${key}: ${value}`;
      const str = String(value);
      if (str.includes(":") || str.includes("#") || str.includes("\n") || str.includes('"')) {
        return `${key}: "${str.replace(/"/g, '\\"')}"`;
      }
      return `${key}: ${str}`;
    });

  const newContent = `---\n${fmLines.join("\n")}\n---\n\n${body}\n`;

  fs.writeFileSync(activePath, newContent, "utf8");

  return { ok: true };
}
