/**
 * lib/outbound/outbound-content-loader.ts
 *
 * Server-side utilities for reading Facebook and X outbound post drafts
 * from content/outbound/facebook/ and content/outbound/x/.
 *
 * Uses the same frontmatter parsing pattern as linkedin-utils.ts.
 * Server-only — do NOT import into client components.
 *
 * The admin console loads posts from these directories to:
 *  - Display a review queue per provider
 *  - Show preview text, schedule, approval status
 *  - Route to publish/schedule after final approval
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import fs from "fs";
import path from "path";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OutboundPostStatus =
  | "draft"
  | "ready"
  | "scheduled"
  | "published"
  | "skipped"
  | "rejected";

export type OutboundApprovalStatus =
  | "needs_review"
  | "approved"
  | "rejected";

export type OutboundPostProvider = "facebook" | "x" | "linkedin";

export type OutboundPostType =
  | "single"
  | "reflective"
  | "link"
  | "quote"
  | "quote-card"
  | "discussion"
  | "thread"
  | "deep-thread"
  | "launch"
  | "thesis"
  | "applied";

export type OutboundPost = {
  /** Internal stable ID — must be unique per post. */
  id: string;
  provider: OutboundPostProvider;
  postType: OutboundPostType;
  /** Filename without directory (e.g. writing-changed-humanity-01.md). */
  filename: string;
  /** Slug derived from filename. */
  slug: string;
  /** Prose body of the post. */
  text: string;
  // ── Source attribution ─────────────────────────────────────────────────────
  sourceType: string | null;
  sourceSlug: string | null;
  sourcePath: string | null;
  campaign: string | null;
  series: string | null;
  // ── Publishing state ───────────────────────────────────────────────────────
  status: OutboundPostStatus;
  approvalStatus: OutboundApprovalStatus;
  scheduledFor: string | null;     // ISO date string
  requiresFinalApproval: boolean;
  // ── Content metadata ───────────────────────────────────────────────────────
  assetUrl: string | null;
  link: string | null;
  imagePath: string | null;
  tone: string | null;
  theme: string[];
  // ── X-specific ────────────────────────────────────────────────────────────
  thread: boolean;
  threadIndex: number | null;
  threadId: string | null;
  xCharCount: number | null;
  // ── LinkedIn-specific ─────────────────────────────────────────────────────
  /** Campaign series slug (e.g. "the-burden-changes-hands"). */
  sourceSeries: string | null;
  /** Source essay slug (e.g. "the-accountant-in-uruk"). */
  sourceMaterial: string | null;
  /** Week number within the campaign (1-indexed). */
  seriesWeek: number | null;
  /** Sequence within the week (1 = thesis, 2 = applied, 3 = reflective). */
  sequence: number | null;
  /** Provider slugs this post may be synchronised to (e.g. ["facebook"]). */
  syncTargets: string[];
  // ── Idempotency ───────────────────────────────────────────────────────────
  /** Stable key: id + provider + scheduledFor — used to detect duplicate publishes. */
  idempotencyKey: string;
  // ── Raw frontmatter (for admin display) ───────────────────────────────────
  createdBy: string | null;
};

export type ExclusionReason =
  | "posted_archive"
  | "backup_file"
  | "unsupported_extension"
  | "parse_error"
  | "provider_mismatch";

export type ExcludedFile = {
  /** Filename relative to the provider root (e.g. "posted/01-foo.mdx"). */
  filename: string;
  reason: ExclusionReason;
  detail?: string;
};

export type OutboundPostsResult = {
  posts: OutboundPost[];
  errors: Array<{ filename: string; message: string }>;
  excluded: ExcludedFile[];
  /** All .md/.mdx non-backup files found, including those in excluded dirs. */
  discoveredCount: number;
  /** Files successfully parsed into posts (=== posts.length). */
  acceptedCount: number;
  /** Posts with status "ready" or ("scheduled" + approvalStatus "approved"). */
  publishableCount: number;
  /** Accepted posts that cannot publish yet (draft, needs_review, etc.). */
  blockedCount: number;
  /** Files skipped before parsing (posted/archive dirs, unsupported ext). */
  excludedCount: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const VALID_STATUSES: OutboundPostStatus[] = [
  "draft", "ready", "scheduled", "published", "skipped", "rejected",
];

const VALID_APPROVAL_STATUSES: OutboundApprovalStatus[] = [
  "needs_review", "approved", "rejected",
];

// ─── Server guard ─────────────────────────────────────────────────────────────

function assertServerRuntime(): void {
  if (typeof window !== "undefined") {
    throw new Error(
      "lib/outbound/outbound-content-loader.ts was imported into a browser bundle. " +
      "Use server-side only (API routes or getServerSideProps).",
    );
  }
}

// ─── Safe field helpers ───────────────────────────────────────────────────────

function safeStr(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return fallback;
}

function safeStrNullable(v: unknown): string | null {
  const s = safeStr(v);
  return s || null;
}

function safeBool(v: unknown, fallback = false): boolean {
  if (typeof v === "boolean") return v;
  if (v === "true") return true;
  if (v === "false") return false;
  return fallback;
}

function safeNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function safeArr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => safeStr(x)).filter(Boolean);
}

// ─── Frontmatter parser ───────────────────────────────────────────────────────

function parseFrontmatter(content: string): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const frontmatter: Record<string, unknown> = {};
  let body = content;

  // Handle both \r\n and \n line endings
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match || match[1] === undefined) {
    return { frontmatter, body };
  }

  const raw = match[1];
  body = content.slice(match[0].length);

  const lines = raw.split(/\r?\n/);
  let currentKey: string | null = null;
  let currentArray: string[] = [];
  let inMultilineString = false;
  let multilineBuffer: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // End of multiline string block
    if (inMultilineString) {
      if (/^[A-Za-z_]/.test(trimmed) && trimmed.includes(":")) {
        // New key — flush multiline
        if (currentKey !== null) {
          frontmatter[currentKey] = multilineBuffer.join(" ").trim();
        }
        inMultilineString = false;
        multilineBuffer = [];
        currentKey = null;
        // fall through to process this line as a new key
      } else {
        multilineBuffer.push(trimmed);
        continue;
      }
    }

    // Array item
    if (trimmed.startsWith("- ")) {
      currentArray.push(trimmed.slice(2).trim().replace(/^["']|["']$/g, ""));
      if (currentKey !== null) {
        frontmatter[currentKey] = [...currentArray];
      }
      continue;
    }

    // Flush array
    if (currentKey !== null && currentArray.length > 0) {
      frontmatter[currentKey] = [...currentArray];
      currentArray = [];
    }

    // Key-value pair
    const kvMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/);
    if (!kvMatch) continue;

    const key = kvMatch[1] ?? "";
    const val = (kvMatch[2] ?? "").trim();
    currentKey = key;

    if (val === "|" || val === ">") {
      inMultilineString = true;
      multilineBuffer = [];
      continue;
    }

    if (val === "") {
      // Empty value — likely preceding an array
      currentArray = [];
      continue;
    }

    // Remove optional quotes
    const cleaned = val.replace(/^["']|["']$/g, "");

    // Parse booleans and numbers
    if (cleaned === "true") frontmatter[key] = true;
    else if (cleaned === "false") frontmatter[key] = false;
    else if (cleaned === "null" || cleaned === "~") frontmatter[key] = null;
    else if (/^\d+(\.\d+)?$/.test(cleaned)) frontmatter[key] = Number(cleaned);
    else frontmatter[key] = cleaned;
  }

  // Flush pending array or multiline
  if (currentKey !== null && currentArray.length > 0) {
    frontmatter[currentKey] = [...currentArray];
  }
  if (inMultilineString && currentKey !== null) {
    frontmatter[currentKey] = multilineBuffer.join(" ").trim();
  }

  return { frontmatter, body };
}

// ─── Post builder ─────────────────────────────────────────────────────────────

function buildIdempotencyKey(
  id: string,
  provider: string,
  scheduledFor: string | null,
): string {
  return `${id}:${provider}:${scheduledFor ?? "unscheduled"}`;
}

function frontmatterToPost(
  fm: Record<string, unknown>,
  body: string,
  filename: string,
  provider: OutboundPostProvider,
): OutboundPost {
  const id = safeStr(fm.id) || filename.replace(/\.(md|mdx)$/i, "");
  const scheduledFor = safeStrNullable(fm.scheduledFor ?? fm.scheduleFor);
  const statusRaw = safeStr(fm.status, "draft").toLowerCase();
  const approvalRaw = safeStr(fm.approvalStatus, "needs_review").toLowerCase();

  return {
    id,
    provider,
    postType: (safeStr(fm.postType, "single") as OutboundPostType),
    filename,
    slug: filename.replace(/\.(md|mdx)$/i, ""),
    text: body.trim(),
    sourceType: safeStrNullable(fm.sourceType),
    sourceSlug: safeStrNullable(fm.sourceSlug),
    sourcePath: safeStrNullable(fm.sourcePath),
    campaign: safeStrNullable(fm.campaign),
    series: safeStrNullable(fm.series),
    status: (VALID_STATUSES.includes(statusRaw as OutboundPostStatus)
      ? statusRaw
      : "draft") as OutboundPostStatus,
    approvalStatus: (VALID_APPROVAL_STATUSES.includes(approvalRaw as OutboundApprovalStatus)
      ? approvalRaw
      : "needs_review") as OutboundApprovalStatus,
    scheduledFor,
    requiresFinalApproval: safeBool(fm.requiresFinalApproval, true),
    assetUrl: safeStrNullable(fm.assetUrl),
    link: safeStrNullable(fm.link),
    imagePath: safeStrNullable(fm.imagePath),
    tone: safeStrNullable(fm.tone),
    theme: safeArr(fm.theme),
    thread: safeBool(fm.thread, false),
    threadIndex: safeNum(fm.threadIndex),
    threadId: safeStrNullable(fm.threadId),
    xCharCount: safeNum(fm.xCharCount),
    sourceSeries: safeStrNullable(fm.sourceSeries),
    sourceMaterial: safeStrNullable(fm.sourceMaterial),
    seriesWeek: safeNum(fm.seriesWeek),
    sequence: safeNum(fm.sequence),
    syncTargets: safeArr(fm.syncTargets),
    idempotencyKey: buildIdempotencyKey(id, provider, scheduledFor),
    createdBy: safeStrNullable(fm.createdBy),
  };
}

// ─── Directory reader ─────────────────────────────────────────────────────────

/** Subdirectory names that are excluded from discovery and explicitly recorded. */
const EXCLUDED_DIR_NAMES = new Set(["posted", "archive"]);

/**
 * Walk an excluded directory and record every .md/.mdx file as excluded.
 * Files inside excluded dirs count toward discoveredCount and excludedCount.
 */
function recordExcludedDir(
  dirPath: string,
  relativePrefix: string,
  result: OutboundPostsResult,
): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      recordExcludedDir(
        path.join(dirPath, entry.name),
        `${relativePrefix}/${entry.name}`,
        result,
      );
      continue;
    }
    if (!entry.isFile()) continue;
    const name = entry.name;
    if (name.includes(".backup-")) continue;
    if (!/\.(md|mdx)$/i.test(name)) continue;
    result.discoveredCount++;
    result.excludedCount++;
    result.excluded.push({
      filename: `${relativePrefix}/${name}`,
      reason: "posted_archive",
      detail: `File is inside excluded directory '${relativePrefix.split("/")[0]}'`,
    });
  }
}

/**
 * Recursively scan a directory tree, collecting posts.
 * Subdirectory names in EXCLUDED_DIR_NAMES are skipped and their files are
 * recorded with reason "posted_archive".
 */
function readOutboundDirectoryRecursive(
  dirPath: string,
  provider: OutboundPostProvider,
  result: OutboundPostsResult,
  relativeDir = "",
): void {
  if (!fs.existsSync(dirPath)) return;

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (EXCLUDED_DIR_NAMES.has(entry.name)) {
        const prefix = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
        recordExcludedDir(path.join(dirPath, entry.name), prefix, result);
      } else {
        const nextRel = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
        readOutboundDirectoryRecursive(
          path.join(dirPath, entry.name),
          provider,
          result,
          nextRel,
        );
      }
      continue;
    }

    if (!entry.isFile()) continue;
    const name = entry.name;

    if (name.includes(".backup-")) continue;

    if (!/\.(md|mdx)$/i.test(name)) {
      result.excluded.push({
        filename: relativeDir ? `${relativeDir}/${name}` : name,
        reason: "unsupported_extension",
      });
      result.excludedCount++;
      continue;
    }

    result.discoveredCount++;

    const filePath = path.join(dirPath, name);
    let content: string;
    try {
      content = fs.readFileSync(filePath, "utf8");
    } catch (err) {
      const rel = relativeDir ? `${relativeDir}/${name}` : name;
      result.errors.push({ filename: rel, message: String(err) });
      result.excluded.push({ filename: rel, reason: "parse_error", detail: String(err) });
      result.excludedCount++;
      continue;
    }

    try {
      const { frontmatter, body } = parseFrontmatter(content);
      const post = frontmatterToPost(frontmatter, body, name, provider);
      result.posts.push(post);
    } catch (err) {
      const rel = relativeDir ? `${relativeDir}/${name}` : name;
      result.errors.push({ filename: rel, message: String(err) });
      result.excluded.push({ filename: rel, reason: "parse_error", detail: String(err) });
      result.excludedCount++;
    }
  }
}

function makeEmptyResult(): OutboundPostsResult {
  return {
    posts: [],
    errors: [],
    excluded: [],
    discoveredCount: 0,
    acceptedCount: 0,
    publishableCount: 0,
    blockedCount: 0,
    excludedCount: 0,
  };
}

function finaliseResult(result: OutboundPostsResult): OutboundPostsResult {
  result.posts.sort((a, b) => {
    if (!a.scheduledFor && !b.scheduledFor) return a.slug.localeCompare(b.slug);
    if (!a.scheduledFor) return 1;
    if (!b.scheduledFor) return -1;
    return a.scheduledFor.localeCompare(b.scheduledFor);
  });
  result.acceptedCount = result.posts.length;
  result.publishableCount = result.posts.filter(
    (p) =>
      p.status === "ready" ||
      (p.status === "scheduled" && p.approvalStatus === "approved"),
  ).length;
  result.blockedCount = result.acceptedCount - result.publishableCount;
  return result;
}

// ─── Public API ───────────────────────────────────────────────────────────────

const FACEBOOK_DIR = path.join(process.cwd(), "content", "outbound", "facebook");
const X_DIR = path.join(process.cwd(), "content", "outbound", "x");
const LINKEDIN_CAMPAIGNS_BASE = path.join(process.cwd(), "content", "outbound", "linkedin");

/**
 * Load all Facebook outbound post drafts from content/outbound/facebook/,
 * including nested campaign subdirectories.
 * The "posted" and "archive" subdirectories are excluded and their files are
 * recorded in result.excluded with reason "posted_archive".
 */
export function getFacebookOutboundPosts(): OutboundPostsResult {
  assertServerRuntime();
  const result = makeEmptyResult();
  readOutboundDirectoryRecursive(FACEBOOK_DIR, "facebook", result);
  return finaliseResult(result);
}

/**
 * Load all X outbound post drafts from content/outbound/x/,
 * including nested campaign subdirectories.
 * The "posted" and "archive" subdirectories are excluded and their files are
 * recorded in result.excluded with reason "posted_archive".
 */
export function getXOutboundPosts(): OutboundPostsResult {
  assertServerRuntime();
  const result = makeEmptyResult();
  readOutboundDirectoryRecursive(X_DIR, "x", result);
  return finaliseResult(result);
}

/**
 * Load LinkedIn outbound posts for a named campaign subdirectory.
 * Reads recursively from content/outbound/linkedin/<campaignSlug>/.
 */
export function getLinkedInCampaignPosts(campaignSlug: string): OutboundPostsResult {
  assertServerRuntime();
  const result = makeEmptyResult();
  readOutboundDirectoryRecursive(
    path.join(LINKEDIN_CAMPAIGNS_BASE, campaignSlug),
    "linkedin",
    result,
  );
  return finaliseResult(result);
}

/**
 * Load all LinkedIn outbound posts.
 * Scans content/outbound/linkedin/ recursively, including root-level files and
 * all campaign subdirectories.
 * The "posted" subdirectory is excluded — files there are recorded with
 * reason "posted_archive". This is an intentional exclusion: posted/ contains
 * already-published content that should not re-enter the publish queue.
 */
export function getLinkedInOutboundPosts(): OutboundPostsResult {
  assertServerRuntime();
  const result = makeEmptyResult();
  readOutboundDirectoryRecursive(LINKEDIN_CAMPAIGNS_BASE, "linkedin", result);
  return finaliseResult(result);
}

/**
 * Load all outbound posts for a given provider.
 */
export function getOutboundPostsByProvider(
  provider: OutboundPostProvider,
): OutboundPostsResult {
  switch (provider) {
    case "facebook":
      return getFacebookOutboundPosts();
    case "x":
      return getXOutboundPosts();
    case "linkedin":
      return getLinkedInOutboundPosts();
  }
}

/**
 * Load a single outbound post by provider + slug.
 * Returns null if not found.
 */
export function getOutboundPostBySlug(
  provider: OutboundPostProvider,
  slug: string,
): OutboundPost | null {
  const { posts } = getOutboundPostsByProvider(provider);
  return posts.find((p) => p.slug === slug || p.id === slug) ?? null;
}

/**
 * Load a single outbound post by its stable ID.
 * Searches all providers.
 */
export function getOutboundPostById(id: string): OutboundPost | null {
  for (const provider of ["facebook", "x", "linkedin"] as const) {
    const { posts } = getOutboundPostsByProvider(provider);
    const found = posts.find((p) => p.id === id);
    if (found) return found;
  }
  return null;
}

/**
 * Return only posts in the given statuses.
 */
export function getOutboundPostsForReview(
  provider: OutboundPostProvider,
): OutboundPost[] {
  const { posts } = getOutboundPostsByProvider(provider);
  return posts.filter(
    (p) =>
      p.status === "ready" ||
      p.status === "scheduled" ||
      (p.status === "draft" && p.approvalStatus === "needs_review"),
  );
}

/**
 * Return only posts that are explicitly scheduled and approved.
 * This is the canonical scheduler eligibility filter.
 *
 * Rules:
 *  - status must be "scheduled" (not "ready", not "draft")
 *  - approvalStatus must be "approved"
 *  - requiresFinalApproval must be true
 *  - scheduledFor must be <= asOf
 *  - provider diagnostics should be READY (checked by caller)
 *  - OUTBOUND_SCHEDULER_ENABLED must be "true" (checked by caller)
 *
 * The scheduler must NOT pick up "ready" items — they need explicit
 * scheduling via the admin UI first.
 */
export function getOutboundPostsDue(
  provider: OutboundPostProvider,
  asOf: string = new Date().toISOString(),
): OutboundPost[] {
  const { posts } = getOutboundPostsByProvider(provider);
  return posts.filter(
    (p) =>
      p.scheduledFor !== null &&
      p.scheduledFor <= asOf &&
      p.status === "scheduled" &&
      p.approvalStatus === "approved" &&
      p.requiresFinalApproval === true,
  );
}

/**
 * Return posts with status "scheduled" regardless of scheduledFor time.
 * Useful for admin UI to show what's queued for the scheduler.
 */
export function getOutboundPostsScheduled(
  provider: OutboundPostProvider,
): OutboundPost[] {
  const { posts } = getOutboundPostsByProvider(provider);
  return posts.filter(
    (p) =>
      p.status === "scheduled" &&
      p.approvalStatus === "approved" &&
      p.requiresFinalApproval === true,
  );
}
