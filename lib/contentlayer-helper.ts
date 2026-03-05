/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * lib/contentlayer-helper.ts — SSOT CONTENT ADAPTER (Contentlayer → App)
 *
 * Guarantees exports expected by:
 * - lib/content/server.ts
 * - lib/mdx.ts
 * - lib/searchIndex.ts
 * - registry pages + sitemaps + api routes
 *
 * This file is intentionally defensive: it does not assume exact generated model names.
 */

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeRequiredTier } from "@/lib/access/tier-policy";

/* ────────────────────────────────────────────────────────────────────────────
   Generated Contentlayer (runtime require to stay build-safe)
──────────────────────────────────────────────────────────────────────────── */
let gen: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  gen = require("contentlayer/generated");
} catch {
  gen = null;
}

/* ────────────────────────────────────────────────────────────────────────────
   Types
──────────────────────────────────────────────────────────────────────────── */
export type DocKind =
  | "post"
  | "short"
  | "book"
  | "canon"
  | "brief"
  | "dispatch"
  | "intelligence"
  | "download"
  | "event"
  | "print"
  | "resource"
  | "strategy"
  | "lexicon"
  | "unknown";

export type ContentDoc = {
  _id?: string;
  type?: string;
  kind?: string;
  title?: string;
  slug?: string;
  href?: string;
  draft?: boolean;
  published?: boolean;
  accessLevel?: string;
  tier?: string;
  classification?: string;
  requiresAuth?: boolean;
  body?: { raw?: string; code?: string };
  content?: string;
  metadata?: any;
  _raw?: {
    flattenedPath?: string;
    sourceFilePath?: string;
    sourceFileName?: string;
    sourceFileDir?: string;
    contentType?: string;
  };
  [key: string]: any;
};

export type CardProps = {
  kind: DocKind;
  slug: string;       // bare slug (no collection prefix)
  href: string;       // canonical href
  title: string;
  description?: string | null;
  dateISO?: string | null;
  tags?: string[];
  coverImage?: string | null;
  coverAspect?: string | null;
  category?: string | null;
  tier: AccessTier;
  published: boolean;
};

/** Used by searchIndex iteration */
export const documentKinds: DocKind[] = [
  "post",
  "short",
  "book",
  "canon",
  "brief",
  "dispatch",
  "intelligence",
  "download",
  "event",
  "print",
  "resource",
  "strategy",
  "lexicon",
];

/* ────────────────────────────────────────────────────────────────────────────
   Small utilities
──────────────────────────────────────────────────────────────────────────── */
function safeString(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}
function lower(v: unknown): string {
  return safeString(v, "").toLowerCase();
}
function safeArray(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => safeString(x)).filter(Boolean) : [];
}
function safeISO(v: unknown): string | null {
  const s = safeString(v, "");
  if (!s) return null;
  const t = Date.parse(s);
  if (!Number.isFinite(t)) return null;
  return new Date(t).toISOString();
}

export function sanitizeData<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

export function normalizeSlug(input: string): string {
  return safeString(input, "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

export function isPublished(doc: any): boolean {
  if (!doc) return false;
  if (doc?.draft === true) return false;
  if (doc?.published === false) return false;
  return true; // default published unless explicitly draft/false
}

export function getAccessLevel(doc: any): AccessTier {
  return normalizeRequiredTier((doc?.tier || doc?.accessLevel || doc?.classification || "public") as any) as AccessTier;
}

function fp(doc: any): string {
  return lower(doc?._raw?.flattenedPath || doc?._raw?.sourceFilePath || doc?.slug || "");
}

/* ────────────────────────────────────────────────────────────────────────────
   Kind inference (folder + optional kind/type fields)
──────────────────────────────────────────────────────────────────────────── */
export function getDocKind(doc: any): DocKind {
  const k = lower(doc?.kind || doc?.type || doc?.docKind);
  const p = fp(doc);

  if (k && (documentKinds as string[]).includes(k)) return k as DocKind;

  if (p.startsWith("shorts/")) return "short";
  if (p.startsWith("briefs/")) return "brief";
  if (p.startsWith("canon/")) return "canon";
  if (p.startsWith("books/")) return "book";
  if (p.startsWith("events/")) return "event";
  if (p.startsWith("downloads/")) return "download";
  if (p.startsWith("prints/")) return "print";
  if (p.startsWith("resources/")) return "resource";
  if (p.startsWith("strategy/")) return "strategy";
  if (p.startsWith("lexicon/")) return "lexicon";
  if (p.startsWith("blog/") || p.startsWith("posts/")) return "post";

  return "unknown";
}

/* ────────────────────────────────────────────────────────────────────────────
   Canonical href builder
──────────────────────────────────────────────────────────────────────────── */
function buildHref(kind: DocKind, bareSlug: string): string {
  const s = normalizeSlug(bareSlug);
  if (!s) return "/";

  switch (kind) {
    case "short":
      return `/shorts/${s}`;
    case "brief":
    case "dispatch":
    case "intelligence":
      return `/briefs/${s}`;
    case "post":
      return `/blog/${s}`;
    case "canon":
      return `/canon/${s}`;
    case "book":
      return `/books/${s}`;
    case "event":
      return `/events/${s}`;
    case "download":
      return `/downloads/${s}`;
    case "print":
      return `/prints/${s}`;
    case "resource":
      return `/resources/${s}`;
    case "strategy":
      return `/strategy/${s}`;
    case "lexicon":
      return `/lexicon/${s}`;
    default:
      return s.startsWith("/") ? s : `/${s}`;
  }
}

function stripPrefix(input: string, prefix: string) {
  const re = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\/`, "i");
  return input.replace(re, "");
}

function computeRawSlug(doc: any): string {
  return safeString(doc?.slugComputed || doc?.slug || doc?._raw?.flattenedPath || doc?._raw?.sourceFilePath || "");
}

function computeBareSlug(kind: DocKind, raw: string): string {
  let s = normalizeSlug(raw);
  if (!s) return "";

  if (kind === "short") s = stripPrefix(s, "shorts");
  else if (kind === "brief" || kind === "dispatch" || kind === "intelligence") s = stripPrefix(s, "briefs");
  else if (kind === "post") {
    s = stripPrefix(s, "blog");
    s = stripPrefix(s, "posts");
  } else if (kind === "canon") s = stripPrefix(s, "canon");
  else if (kind === "book") s = stripPrefix(s, "books");
  else if (kind === "event") s = stripPrefix(s, "events");
  else if (kind === "download") s = stripPrefix(s, "downloads");
  else if (kind === "print") s = stripPrefix(s, "prints");
  else if (kind === "resource") s = stripPrefix(s, "resources");
  else if (kind === "strategy") s = stripPrefix(s, "strategy");
  else if (kind === "lexicon") s = stripPrefix(s, "lexicon");

  return s;
}

/* ────────────────────────────────────────────────────────────────────────────
   MASTER DOC ACCESS
──────────────────────────────────────────────────────────────────────────── */
export function getAllContentlayerDocs(): any[] {
  if (!gen) return [];

  const buckets: any[] = [];
  if (Array.isArray(gen.allDocuments)) buckets.push(...gen.allDocuments);

  // collect any "allX" arrays
  for (const k of Object.keys(gen)) {
    if (k.startsWith("all") && Array.isArray((gen as any)[k])) buckets.push(...(gen as any)[k]);
  }

  // de-dupe
  const seen = new Set<string>();
  const out: any[] = [];
  for (const d of buckets) {
    const key =
      safeString(d?._id) ||
      safeString(d?._raw?.flattenedPath) ||
      safeString(d?.slug) ||
      JSON.stringify(d);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(d);
    }
  }
  return out;
}

function matchesSlug(doc: any, normalized: string): boolean {
  const a = normalizeSlug(safeString(doc?.slug));
  const b = normalizeSlug(safeString(doc?._raw?.flattenedPath));
  const c = normalizeSlug(safeString(doc?._raw?.sourceFilePath));
  return a === normalized || b === normalized || c === normalized;
}

export function getDocBySlug(slug: string): any | null {
  const s = normalizeSlug(String(slug || ""));
  if (!s) return null;
  const docs = getAllContentlayerDocs();
  return docs.find((d) => matchesSlug(d, s) || matchesSlug(d, `/${s}`)) || null;
}

/* ────────────────────────────────────────────────────────────────────────────
   COLLECTION GETTERS
──────────────────────────────────────────────────────────────────────────── */
function byKind(kind: DocKind): any[] {
  return getAllContentlayerDocs().filter((d) => getDocKind(d) === kind);
}

export const getAllBooks = () => byKind("book");
export const getAllCanons = () => byKind("canon");
export const getAllDownloads = () => byKind("download");
export const getAllPosts = () => byKind("post");
export const getAllEvents = () => byKind("event");
export const getAllPrints = () => byKind("print");
export const getAllResources = () => byKind("resource");
export const getAllStrategies = () => byKind("strategy");
export const getAllShorts = () => byKind("short");

/* ────────────────────────────────────────────────────────────────────────────
   BY-SLUG LOOKUPS (the exact exports lib/mdx.ts expects)
──────────────────────────────────────────────────────────────────────────── */
function getByCollectionSlug(collection: string, slug: string): any | null {
  const s = normalizeSlug(String(slug || ""));
  if (!s) return null;

  // allow bare or prefixed
  return (
    getDocBySlug(`${collection}/${s}`) ||
    getDocBySlug(s) ||
    getAllContentlayerDocs().find((d) => matchesSlug(d, `${collection}/${s}`)) ||
    null
  );
}

export function getPostBySlug(slug: string) {
  return getByCollectionSlug("blog", slug) || getByCollectionSlug("posts", slug);
}
export function getBookBySlug(slug: string) {
  return getByCollectionSlug("books", slug);
}
export function getDownloadBySlug(slug: string) {
  return getByCollectionSlug("downloads", slug);
}
export function getResourceBySlug(slug: string) {
  return getByCollectionSlug("resources", slug);
}
export function getEventBySlug(slug: string) {
  return getByCollectionSlug("events", slug);
}
export function getPrintBySlug(slug: string) {
  return getByCollectionSlug("prints", slug);
}
export function getStrategyBySlug(slug: string) {
  return getByCollectionSlug("strategy", slug) || getByCollectionSlug("strategies", slug);
}
export function getCanonBySlug(slug: string) {
  return getByCollectionSlug("canon", slug) || getByCollectionSlug("canons", slug);
}
export function getShortBySlug(slug: string) {
  return getByCollectionSlug("shorts", slug);
}

/* server helper shims (server.ts imports these names) */
export function getServerBookBySlug(slug: string) {
  return getBookBySlug(slug);
}
export function getServerCanonBySlug(slug: string) {
  return getCanonBySlug(slug);
}

/* ────────────────────────────────────────────────────────────────────────────
   getCardProps — search-index safe
──────────────────────────────────────────────────────────────────────────── */
export function getCardProps(doc: any): CardProps {
  const kind = getDocKind(doc);

  const title = safeString(doc?.title, "Untitled");
  const description = safeString(doc?.excerpt || doc?.description || doc?.summary || "", "") || null;

  const rawSlug = computeRawSlug(doc);
  const slug = computeBareSlug(kind, rawSlug) || "unknown";

  const href = slug !== "unknown" ? buildHref(kind, slug) : "/";

  const dateISO = safeISO(doc?.date || doc?.eventDate || doc?.startDate || doc?.datetime || doc?.startsAt) ?? null;

  const tags = safeArray(doc?.tags);

  const coverImage =
    safeString(doc?.coverImage || doc?.image || doc?.heroImage || doc?.ogImage || "", "") || null;

  const coverAspect =
    safeString(doc?.coverAspect || doc?.imageAspect || doc?.aspect || "", "") || null;

  const category = safeString(doc?.category || doc?.theme || doc?.tag || "", "") || null;

  const tier = getAccessLevel(doc);
  const published = isPublished(doc);

  return {
    kind,
    slug,
    href,
    title,
    description,
    dateISO,
    tags,
    coverImage,
    coverAspect,
    category,
    tier,
    published,
  };
}

/* ────────────────────────────────────────────────────────────────────────────
   toUiDoc — stable UI adapter
──────────────────────────────────────────────────────────────────────────── */
export function toUiDoc(doc: any) {
  const props = getCardProps(doc);
  return {
    ...props,
    id: safeString(doc?._id) || props.slug,
    raw: doc,
  };
}