/**
 * lib/contentlayer-helper.ts — SSOT CONTENT ADAPTER (SERVER-ONLY)
 *
 * Non-negotiables:
 * - No require("contentlayer/generated") in ESM runtime (Next 16 can run without require)
 * - Deterministic on Windows + Linux
 * - Always returns docs when .contentlayer/generated/<Type>/_index.json exists
 * - Every document exposes canonical slug fields: collectionSlug, urlSlug, href
 *
 * IMPORTANT:
 * - Server-only module. Do not import from client components.
 */

import fs from "fs";
import path from "path";

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeRequiredTier } from "@/lib/access/tier-policy";
import { 
  buildCanonicalSlugFields, 
  inferCollectionFromDoc,
  normalizePath,
  stripContentPrefix,
  type CanonicalSlugFields 
} from "./content/canonical";

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
  | "vault"
  | "unknown";

export type ContentDoc = {
  _id?: string;
  type?: string;
  kind?: string;
  docKind?: string;
  title?: string;
  slug?: string;
  slugComputed?: string;
  href?: string;
  collection?: string;
  collectionSlug?: string;
  urlSlug?: string;
  draft?: boolean;
  published?: boolean;
  accessLevel?: string;
  tier?: string;
  classification?: string;
  requiresAuth?: boolean;
  body?: { raw?: string; code?: string };
  bodyCode?: string;
  content?: string;
  excerpt?: string;
  description?: string;
  summary?: string;
  tags?: any[];
  category?: string;
  date?: string;
  eventDate?: string;
  startDate?: string;
  datetime?: string;
  startsAt?: string;
  coverImage?: string;
  image?: string;
  heroImage?: string;
  ogImage?: string;
  coverAspect?: string;
  imageAspect?: string;
  aspect?: string;
  theme?: string;
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
  slug: string;
  href: string;
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
  "vault",
];

function isServerRuntime() {
  return typeof window === "undefined";
}

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
  return normalizePath(input);
}

/** tolerate content/<collection>/... */
function normalizeFlattenedPath(input: string): string {
  return stripContentPrefix(normalizePath(input));
}

export function isPublished(doc: any): boolean {
  if (!doc) return false;
  if (doc?.draft === true) return false;
  if (doc?.published === false) return false;
  return true;
}

export function getAccessLevel(doc: any): AccessTier {
  return normalizeRequiredTier((doc?.tier || doc?.accessLevel || doc?.classification || "public") as any) as AccessTier;
}

function fp(doc: any): string {
  const raw =
    safeString(doc?._raw?.flattenedPath) ||
    safeString(doc?._raw?.sourceFilePath) ||
    safeString(doc?.slug) ||
    "";
  return lower(normalizeFlattenedPath(raw));
}

/**
 * Priority order for kind inference:
 * 1) docKind (SSOT truth) — highest authority
 * 2) kind/type fields (legacy)
 * 3) Folder inference (always reliable)
 */
export function getDocKind(doc: any): DocKind {
  // docKind must win over everything else
  const k = lower(doc?.docKind || doc?.kind || doc?.type);

  // Explicit safeguard: lexicon is always lexicon
  if (k === "lexicon") return "lexicon";

  if (k && (documentKinds as string[]).includes(k)) return k as DocKind;

  // Folder inference (always reliable)
  const p = fp(doc);

  if (p.startsWith("lexicon/")) return "lexicon";
  if (p.startsWith("shorts/")) return "short";
  if (p.startsWith("briefs/")) return "brief";
  if (p.startsWith("canon/")) return "canon";
  if (p.startsWith("books/")) return "book";
  if (p.startsWith("events/")) return "event";
  if (p.startsWith("downloads/")) return "download";
  if (p.startsWith("prints/")) return "print";
  if (p.startsWith("resources/")) return "resource";
  if (p.startsWith("strategy/")) return "strategy";
  if (p.startsWith("vault/")) return "vault";
  if (p.startsWith("blog/") || p.startsWith("posts/")) return "post";

  return "unknown";
}

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
    case "vault":
      return `/vault/${s}`;
    default:
      return s.startsWith("/") ? s : `/${s}`;
  }
}

function stripPrefix(input: string, prefix: string) {
  const re = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\/`, "i");
  return input.replace(re, "");
}

function computeRawSlug(doc: any): string {
  const raw =
    safeString(doc?.slugComputed) ||
    safeString(doc?.slug) ||
    safeString(doc?._raw?.flattenedPath) ||
    safeString(doc?._raw?.sourceFilePath) ||
    "";
  return normalizeFlattenedPath(raw);
}

function computeBareSlug(kind: DocKind, raw: string): string {
  let s = normalizeFlattenedPath(raw);
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
  else if (kind === "vault") s = stripPrefix(s, "vault");

  return normalizeSlug(s);
}

/* -------------------- JSON index loader -------------------- */
const GENERATED_ROOT = path.join(process.cwd(), ".contentlayer", "generated");

let _cache: any[] | null = null;

function parseIndexJson(jsonPath: string): any[] {
  try {
    const raw = fs.readFileSync(jsonPath, "utf8");
    const data = JSON.parse(raw);

    if (Array.isArray(data)) return data;
    if (data && Array.isArray((data as any).documents)) return (data as any).documents;
    if (data && Array.isArray((data as any).allDocuments)) return (data as any).allDocuments;

    if (data && typeof data === "object") {
      const out: any[] = [];
      for (const v of Object.values(data)) if (Array.isArray(v)) out.push(...v);
      return out;
    }
    return [];
  } catch {
    return [];
  }
}

function loadAllFromGeneratedIndexes(): any[] {
  if (!fs.existsSync(GENERATED_ROOT)) return [];
  const dirs = fs.readdirSync(GENERATED_ROOT, { withFileTypes: true }).filter((d) => d.isDirectory());

  const buckets: any[] = [];
  for (const d of dirs) {
    const idx = path.join(GENERATED_ROOT, d.name, "_index.json");
    if (fs.existsSync(idx)) buckets.push(...parseIndexJson(idx));
  }
  return buckets;
}

/**
 * Enrich a document with canonical slug fields
 * This is called once per document at the adapter level
 */
export function enrichWithCanonicalSlugs(doc: any): any {
  if (!doc) return doc;
  
  // Skip if already enriched with valid slugs
  if (doc.collectionSlug && doc.urlSlug && doc.href) {
    return doc;
  }

  const collection = inferCollectionFromDoc(doc);
  if (!collection) return doc;

  // Try different sources for the raw slug
  const rawSlug = 
    doc.slugComputed ||
    doc.slug ||
    doc._raw?.flattenedPath ||
    doc._raw?.sourceFilePath ||
    "";

  const canonical = buildCanonicalSlugFields(collection, rawSlug);
  if (!canonical) return doc;

  return {
    ...doc,
    collection: canonical.collection,
    collectionSlug: canonical.collectionSlug,
    urlSlug: canonical.urlSlug,
    href: canonical.href,
  };
}

export function getAllContentlayerDocs(): any[] {
  if (!isServerRuntime()) {
    throw new Error("lib/contentlayer-helper.ts is server-only but was imported in a client bundle.");
  }
  if (_cache) return _cache;

  const docs = loadAllFromGeneratedIndexes();

  // de-dupe and enrich with canonical slugs
  const seen = new Set<string>();
  const out: any[] = [];
  for (const doc of docs) {
    const key =
      safeString(doc?._id) ||
      safeString(doc?._raw?.flattenedPath) ||
      safeString(doc?._raw?.sourceFilePath) ||
      safeString(doc?.slug) ||
      "";
    const stable = key || JSON.stringify(doc);
    if (!seen.has(stable)) {
      seen.add(stable);
      out.push(enrichWithCanonicalSlugs(doc));
    }
  }

  _cache = out;
  return out;
}

function matchesSlug(doc: any, normalized: string): boolean {
  // Use canonical fields for matching
  return (
    doc.collectionSlug === normalized ||
    doc.urlSlug === normalized ||
    doc.href === `/${normalized}` ||
    doc.href === normalized
  );
}

export function getDocBySlug(slug: string): any | null {
  const s = normalizeFlattenedPath(String(slug || ""));
  if (!s) return null;

  const docs = getAllContentlayerDocs();
  return docs.find((d) => matchesSlug(d, s) || matchesSlug(d, `/${s}`) || matchesSlug(d, `content/${s}`)) || null;
}

/* COLLECTION GETTERS */
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
export const getAllBriefs = () => byKind("brief");
export const getAllLexicon = () => byKind("lexicon");
export const getAllVault = () => byKind("vault");

/* BY-SLUG LOOKUPS using canonical fields */
function getByCollectionSlug(collection: string, slug: string): any | null {
  const s = normalizeSlug(String(slug || ""));
  if (!s) return null;
  
  const docs = getAllContentlayerDocs();
  const collectionSlug = `${collection}/${s}`;
  
  return docs.find(d => d.collectionSlug === collectionSlug) || null;
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

export function getBriefBySlug(slug: string) {
  return getByCollectionSlug("briefs", slug);
}

/**
 * Get a short document by slug using canonical fields
 * No more slug guessing or path manipulation
 */
export function getShortBySlug(slug: string) {
  const input = normalizeSlug(String(slug || ""));
  if (!input) return null;

  const shorts = getAllShorts(); // Already enriched with canonical fields
  
  // Match against canonical fields only
  return (
    shorts.find(d => d.collectionSlug === `shorts/${input}`) ||
    shorts.find(d => d.urlSlug === input) ||
    shorts.find(d => d.href === `/shorts/${input}`) ||
    null
  );
}

export function getServerBookBySlug(slug: string) {
  return getBookBySlug(slug);
}

export function getServerCanonBySlug(slug: string) {
  return getCanonBySlug(slug);
}

/* getCardProps using canonical fields */
export function getCardProps(doc: any): CardProps {
  // Ensure doc has canonical slugs
  const enriched = enrichWithCanonicalSlugs(doc);
  
  const kind = getDocKind(enriched);
  const title = safeString(enriched?.title, "Untitled");
  const description = safeString(enriched?.excerpt || enriched?.description || enriched?.summary || "", "") || null;

  // Use canonical fields directly - no manipulation needed
  const slug = enriched.urlSlug || "unknown";
  const href = enriched.href || buildHref(kind, slug);

  const dateISO = safeISO(enriched?.date || enriched?.eventDate || enriched?.startDate || enriched?.datetime || enriched?.startsAt) ?? null;
  const tags = safeArray(enriched?.tags);

  const coverImage = safeString(enriched?.coverImage || enriched?.image || enriched?.heroImage || enriched?.ogImage || "", "") || null;
  const coverAspect = safeString(enriched?.coverAspect || enriched?.imageAspect || enriched?.aspect || "", "") || null;
  const category = safeString(enriched?.category || enriched?.theme || enriched?.tag || "", "") || null;

  const tier = getAccessLevel(enriched);
  const published = isPublished(enriched);

  return { kind, slug, href, title, description, dateISO, tags, coverImage, coverAspect, category, tier, published };
}

export function toUiDoc(doc: any) {
  const props = getCardProps(doc);
  return { ...props, id: safeString(doc?._id) || props.slug, raw: doc };
}