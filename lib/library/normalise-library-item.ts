/**
 * lib/library/normalise-library-item.ts — LIBRARY ITEM NORMALIZER
 *
 * Normalizes raw document data into a consistent LibraryIndexItem shape.
 * Provides safe fallbacks for missing fields and infers values where possible.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
  LibraryIndexItem,
  LibraryItemType,
  LibrarySection,
  LibraryItemAccess,
  LibraryItemFormat,
  LibraryItemStatus,
} from "./library-index";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function safeStr(v: unknown, fallback?: string | null): string {
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return fallback ?? "";
}

function safeArr(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => safeStr(x)).filter(Boolean) : [];
}

function safeISO(v: unknown): string | null {
  const s = safeStr(v);
  if (!s) return null;
  const t = Date.parse(s);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Access normalizer
// ─────────────────────────────────────────────────────────────────────────────

export function normaliseAccess(raw: unknown): LibraryItemAccess {
  const s = safeStr(raw).trim().toLowerCase();
  if (!s || s === "public" || s === "open" || s === "free" || s === "unclassified") return "public";
  if (s === "member" || s === "members" || s === "inner-circle" || s === "inner_circle" || s === "basic") return "member";
  if (s === "paid" || s === "premium" || s === "one_time" || s === "one-time") return "paid";
  if (
    s === "restricted" ||
    s === "private" ||
    s === "confidential" ||
    s === "secret" ||
    s === "top-secret" ||
    s === "top_secret" ||
    s === "hardened" ||
    s === "sovereign" ||
    s === "client" ||
    s === "architect" ||
    s === "owner" ||
    s === "legacy"
  )
    return "restricted";
  return "unknown";
}

// ─────────────────────────────────────────────────────────────────────────────
// Status normalizer
// ─────────────────────────────────────────────────────────────────────────────

export function normaliseStatus(raw: unknown): LibraryItemStatus {
  const s = safeStr(raw).trim().toLowerCase();
  if (s === "draft") return "draft";
  if (s === "archived") return "archived";
  if (s === "published" || s === "publish" || s === "live") return "published";
  if (raw === true) return "published";
  if (raw === false) return "draft";
  return "unknown";
}

// ─────────────────────────────────────────────────────────────────────────────
// Format inferrer
// ─────────────────────────────────────────────────────────────────────────────

export function inferFormat(type: LibraryItemType, raw?: any): LibraryItemFormat | null {
  // Explicit format field takes priority
  const explicit = safeStr(raw?.format || raw?.fileFormat || "").toLowerCase();
  if (explicit === "pdf") return "pdf";
  if (explicit === "epub" || explicit === "ebook") return "epub";
  if (explicit === "worksheet" || explicit === "canvas") return "worksheet";
  if (explicit === "article") return "article";

  // Infer from type
  const typeMap: Partial<Record<LibraryItemType, LibraryItemFormat>> = {
    book: "book",
    essay: "article",
    short: "article",
    brief: "brief",
    intelligence: "brief",
    event: "event",
    resource: "resource",
    toolkit: "toolkit",
    pdf: "pdf",
    download: "pdf",
    print: "pdf",
    playbook: "worksheet",
    framework: "worksheet",
    strategy: "worksheet",
    canon: "article",
    lexicon: "article",
    vault: "pdf",
    premium: "pdf",
  };
  return typeMap[type] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section inferrer
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_TO_SECTION: Record<LibraryItemType, LibrarySection> = {
  essay: "essays_analysis",
  short: "essays_analysis",
  book: "books_manuscripts",
  canon: "canon_lexicon",
  lexicon: "canon_lexicon",
  framework: "frameworks_playbooks",
  playbook: "frameworks_playbooks",
  strategy: "frameworks_playbooks",
  toolkit: "frameworks_playbooks",
  intelligence: "intelligence_briefs",
  brief: "intelligence_briefs",
  evidence: "intelligence_briefs",
  download: "downloads_resources",
  pdf: "downloads_resources",
  print: "downloads_resources",
  resource: "downloads_resources",
  vault: "vault",
  event: "events",
  premium: "intelligence_briefs",
};

export function inferSection(type: LibraryItemType): LibrarySection {
  return TYPE_TO_SECTION[type] || "downloads_resources";
}

// ─────────────────────────────────────────────────────────────────────────────
// Href inferrer
// ─────────────────────────────────────────────────────────────────────────────

export function inferHref(type: LibraryItemType, slug: string): string {
  const s = safeStr(slug)
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .replace(/\.(md|mdx)$/i, "");

  if (!s) return "/";

  const routeMap: Partial<Record<LibraryItemType, string>> = {
    essay: "/blog",
    short: "/shorts",
    book: "/books",
    canon: "/canon",
    lexicon: "/lexicon",
    playbook: "/playbooks",
    strategy: "/strategy",
    intelligence: "/intelligence",
    brief: "/briefs",
    evidence: "/evidence",
    download: "/downloads",
    print: "/prints",
    resource: "/resources",
    toolkit: "/toolkits",
    vault: "/vault",
    event: "/events",
    pdf: "/assets/downloads",
    premium: "/artifacts",
  };

  const base = routeMap[type] || "/";
  return `${base}/${s}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main normalizer
// ─────────────────────────────────────────────────────────────────────────────

export interface NormalizationReport {
  item: LibraryIndexItem;
  warnings: string[];
  missing: string[];
}

/**
 * Normalize a raw document into a LibraryIndexItem with fallbacks.
 * Returns the item plus a report of what was missing/inferred.
 */
export function normaliseLibraryItem(
  raw: any,
  overrides?: {
    id?: string;
    type?: LibraryItemType;
    href?: string;
  },
): NormalizationReport {
  const warnings: string[] = [];
  const missing: string[] = [];

  // ── ID ──
  const id =
    overrides?.id ||
    safeStr(raw._id) ||
    safeStr(raw.id) ||
    safeStr(raw.slug) ||
    safeStr(raw._raw?.flattenedPath) ||
    `item-${Math.random().toString(36).slice(2, 8)}`;

  // ── Title ──
  const title = safeStr(raw.title, "");
  if (!title) {
    missing.push("title");
    warnings.push(`Item ${id} has no title`);
  }

  // ── Summary / Description ──
  const summary = safeStr(raw.excerpt || raw.description || raw.summary || "", null) || null;
  const description = safeStr(raw.description || raw.excerpt || raw.summary || "", null) || null;
  if (!summary && !description) {
    missing.push("summary");
  }

  // ── Type ──
  const type: LibraryItemType = overrides?.type || raw._libraryType || "resource";

  // ── Section ──
  const section = inferSection(type);

  // ── Href ──
  const explicitHref = overrides?.href || safeStr(raw.href || raw.url || "");
  const href = explicitHref || inferHref(type, safeStr(raw.slug || raw._raw?.flattenedPath || ""));
  if (!href || href === "/") {
    missing.push("href");
    warnings.push(`Item ${id} has no resolvable href`);
  }

  // ── Access ──
  const accessRaw = raw.accessTierSafe || raw.accessTier || raw.accessLevel || raw.tier || raw.classification || raw.access || "public";
  const access = normaliseAccess(accessRaw);
  if (access === "unknown") {
    warnings.push(`Item ${id} has unrecognised access value: "${accessRaw}"`);
  }

  // ── Format ──
  const format = inferFormat(type, raw);

  // ── Status ──
  const statusRaw = raw.publishedSafe !== undefined ? raw.publishedSafe : raw.published;
  const status = normaliseStatus(statusRaw);

  // ── Date ──
  const date = safeISO(raw.date || raw.eventDate || raw.startDate || raw.datetime || raw.startsAt || raw.updated || raw.lastUpdated || raw.createdAt);
  if (!date) {
    missing.push("date");
  }

  // ── Tags ──
  const tags = safeArr(raw.tags);
  if (tags.length === 0) {
    missing.push("tags");
  }

  // ── Category ──
  const category = safeStr(raw.category || raw.theme || "", null) || null;

  // ── Featured ──
  const featured = Boolean(raw.featured === true);

  // ── Source ──
  const sourceType = safeStr(raw._sourceType || "unknown");
  const sourcePath = safeStr(raw._raw?.flattenedPath || raw._raw?.sourceFilePath || "", null) || null;

  const item: LibraryIndexItem = {
    id,
    title: title || "Untitled",
    summary,
    description,
    type,
    section,
    href: href || "/",
    access,
    format,
    status,
    date,
    tags,
    category,
    featured,
    sourceType,
    sourcePath,
  };

  return { item, warnings, missing };
}
