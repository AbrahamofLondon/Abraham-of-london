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

export type OutboundPostsResult = {
  posts: OutboundPost[];
  errors: Array<{ filename: string; message: string }>;
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

function readOutboundDirectory(
  dirPath: string,
  provider: OutboundPostProvider,
): OutboundPostsResult {
  assertServerRuntime();

  const result: OutboundPostsResult = { posts: [], errors: [] };

  if (!fs.existsSync(dirPath)) {
    return result;
  }

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return result;
  }

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const name = entry.name;
    if (!/\.(md|mdx)$/i.test(name)) continue;
    if (name.includes(".backup-")) continue;

    const filePath = path.join(dirPath, name);
    let content: string;
    try {
      content = fs.readFileSync(filePath, "utf8");
    } catch (err) {
      result.errors.push({ filename: name, message: String(err) });
      continue;
    }

    try {
      const { frontmatter, body } = parseFrontmatter(content);
      const post = frontmatterToPost(frontmatter, body, name, provider);
      result.posts.push(post);
    } catch (err) {
      result.errors.push({ filename: name, message: String(err) });
    }
  }

  // Sort by scheduledFor ascending (unscheduled last)
  result.posts.sort((a, b) => {
    if (!a.scheduledFor && !b.scheduledFor) return a.slug.localeCompare(b.slug);
    if (!a.scheduledFor) return 1;
    if (!b.scheduledFor) return -1;
    return a.scheduledFor.localeCompare(b.scheduledFor);
  });

  return result;
}

// ─── Public API ───────────────────────────────────────────────────────────────

const FACEBOOK_DIR = path.join(process.cwd(), "content", "outbound", "facebook");
const X_DIR = path.join(process.cwd(), "content", "outbound", "x");
const LINKEDIN_CAMPAIGNS_BASE = path.join(process.cwd(), "content", "outbound", "linkedin");

/**
 * Load all Facebook outbound post drafts from content/outbound/facebook/.
 */
export function getFacebookOutboundPosts(): OutboundPostsResult {
  return readOutboundDirectory(FACEBOOK_DIR, "facebook");
}

/**
 * Load all X outbound post drafts from content/outbound/x/.
 */
export function getXOutboundPosts(): OutboundPostsResult {
  return readOutboundDirectory(X_DIR, "x");
}

/**
 * Load LinkedIn outbound posts for a named campaign subdirectory.
 * Reads from content/outbound/linkedin/<campaignSlug>/.
 */
export function getLinkedInCampaignPosts(campaignSlug: string): OutboundPostsResult {
  return readOutboundDirectory(
    path.join(LINKEDIN_CAMPAIGNS_BASE, campaignSlug),
    "linkedin",
  );
}

/**
 * Load all LinkedIn outbound posts across all campaign subdirectories.
 * Scans each immediate subdirectory of content/outbound/linkedin/ that
 * contains .md/.mdx files and merges the results.
 */
export function getLinkedInOutboundPosts(): OutboundPostsResult {
  assertServerRuntime();
  const merged: OutboundPostsResult = { posts: [], errors: [] };

  if (!fs.existsSync(LINKEDIN_CAMPAIGNS_BASE)) return merged;

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(LINKEDIN_CAMPAIGNS_BASE, { withFileTypes: true });
  } catch {
    return merged;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const { posts, errors } = readOutboundDirectory(
      path.join(LINKEDIN_CAMPAIGNS_BASE, entry.name),
      "linkedin",
    );
    merged.posts.push(...posts);
    merged.errors.push(...errors);
  }

  // Re-sort merged results by scheduledFor ascending (unscheduled last)
  merged.posts.sort((a, b) => {
    if (!a.scheduledFor && !b.scheduledFor) return a.slug.localeCompare(b.slug);
    if (!a.scheduledFor) return 1;
    if (!b.scheduledFor) return -1;
    return a.scheduledFor.localeCompare(b.scheduledFor);
  });

  return merged;
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
