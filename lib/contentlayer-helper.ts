/**
 * lib/contentlayer-helper.ts — SSOT CONTENT ADAPTER
 *
 * Guarantees:
 * - Never relies on require("contentlayer/generated")
 * - Reads deterministic JSON indexes from .contentlayer/generated/<Type>/_index.json
 * - Enriches every document with canonical slug fields
 * - Provides stable collection getters and by-slug lookup helpers
 *
 * IMPORTANT:
 * - Server-intended module. Do not import from client components.
 * - Do NOT use `import "server-only"` here because this project still uses Pages Router.
 * - Do NOT use top-level imports for fs/path in Pages Router. Load them lazily.
 */

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeRequiredTier } from "@/lib/access/tier-policy";
import {
  buildCanonicalSlugFields,
  inferCollectionFromDoc,
  normalizePath,
  stripContentPrefix,
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
  tags?: unknown[];
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
  metadata?: unknown;
  _raw?: {
    flattenedPath?: string;
    sourceFilePath?: string;
    sourceFileName?: string;
    sourceFileDir?: string;
    contentType?: string;
  };
  [key: string]: unknown;
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

let cache: ContentDoc[] | null = null;

type NodeFs = typeof import("fs");
type NodePath = typeof import("path");

function assertServerRuntime(): void {
  if (typeof window !== "undefined") {
    throw new Error(
      "lib/contentlayer-helper.ts was imported into a browser bundle. Move this access behind server data functions."
    );
  }
}

function getNodeModules(): {
  fs: NodeFs;
  path: NodePath;
  generatedRoot: string;
} {
  assertServerRuntime();

  // Avoid static bundling of Node built-ins in Pages Router
  // eslint-disable-next-line no-eval
  const req = eval("require") as NodeRequire;
  const fs = req("fs") as NodeFs;
  const path = req("path") as NodePath;

  return {
    fs,
    path,
    generatedRoot: path.join(process.cwd(), ".contentlayer", "generated"),
  };
}

function safeString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function lower(value: unknown): string {
  return safeString(value).toLowerCase();
}

function safeArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => safeString(item)).filter(Boolean)
    : [];
}

function safeISO(value: unknown): string | null {
  const s = safeString(value);
  if (!s) return null;
  const t = Date.parse(s);
  if (!Number.isFinite(t)) return null;
  return new Date(t).toISOString();
}

export function sanitizeData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function normalizeSlug(input: string): string {
  return normalizePath(input);
}

function normalizeFlattenedPath(input: string): string {
  return stripContentPrefix(normalizePath(input));
}

export function isPublished(doc: ContentDoc | null | undefined): boolean {
  if (!doc) return false;
  if (doc.draft === true) return false;
  if (doc.published === false) return false;
  return true;
}

export function getAccessLevel(doc: ContentDoc | null | undefined): AccessTier {
  return normalizeRequiredTier(
    (doc?.tier || doc?.accessLevel || doc?.classification || "public") as string
  ) as AccessTier;
}

function getRawPath(doc: ContentDoc | null | undefined): string {
  const raw =
    safeString(doc?._raw?.flattenedPath) ||
    safeString(doc?._raw?.sourceFilePath) ||
    safeString(doc?.slugComputed) ||
    safeString(doc?.slug);
  return normalizeFlattenedPath(raw);
}

export function getDocKind(doc: ContentDoc | null | undefined): DocKind {
  const explicit = lower(doc?.docKind || doc?.kind || doc?.type);

  if (explicit === "lexicon") return "lexicon";
  if (explicit && (documentKinds as string[]).includes(explicit)) {
    return explicit as DocKind;
  }

  const p = lower(getRawPath(doc));

  if (p.startsWith("lexicon/")) return "lexicon";
  if (p.startsWith("shorts/")) return "short";
  if (p.startsWith("briefs/")) return "brief";
  if (p.startsWith("canon/")) return "canon";
  if (p.startsWith("books/")) return "book";
  if (p.startsWith("events/")) return "event";
  if (p.startsWith("downloads/")) return "download";
  if (p.startsWith("prints/")) return "print";
  if (p.startsWith("resources/")) return "resource";
  if (p.startsWith("strategy/") || p.startsWith("strategies/")) return "strategy";
  if (p.startsWith("vault/")) return "vault";
  if (p.startsWith("blog/") || p.startsWith("posts/")) return "post";

  return "unknown";
}

function parseIndexJson(jsonPath: string): ContentDoc[] {
  const { fs } = getNodeModules();

  try {
    const raw = fs.readFileSync(jsonPath, "utf8");
    const data = JSON.parse(raw) as unknown;

    if (Array.isArray(data)) return data as ContentDoc[];

    if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;

      if (Array.isArray(obj.documents)) return obj.documents as ContentDoc[];
      if (Array.isArray(obj.allDocuments)) return obj.allDocuments as ContentDoc[];

      const out: ContentDoc[] = [];
      for (const value of Object.values(obj)) {
        if (Array.isArray(value)) out.push(...(value as ContentDoc[]));
      }
      return out;
    }

    return [];
  } catch {
    return [];
  }
}

function loadAllFromGeneratedIndexes(): ContentDoc[] {
  const { fs, path, generatedRoot } = getNodeModules();

  if (!fs.existsSync(generatedRoot)) return [];

  const dirs = fs
    .readdirSync(generatedRoot, { withFileTypes: true })
    .filter((entry: { isDirectory: () => boolean }) => entry.isDirectory());

  const docs: ContentDoc[] = [];

  for (const dir of dirs) {
    const indexPath = path.join(generatedRoot, dir.name, "_index.json");
    if (fs.existsSync(indexPath)) {
      docs.push(...parseIndexJson(indexPath));
    }
  }

  return docs;
}

export function enrichWithCanonicalSlugs<T extends ContentDoc>(doc: T): T {
  if (!doc) return doc;

  const collection = inferCollectionFromDoc(doc);
  if (!collection) return doc;

  const rawSlug =
    safeString(doc.slugComputed) ||
    safeString(doc.slug) ||
    safeString(doc._raw?.flattenedPath) ||
    safeString(doc._raw?.sourceFilePath);

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

function dedupeKey(doc: ContentDoc): string {
  return (
    safeString(doc._id) ||
    safeString(doc._raw?.flattenedPath) ||
    safeString(doc._raw?.sourceFilePath) ||
    safeString(doc.slugComputed) ||
    safeString(doc.slug) ||
    JSON.stringify(doc)
  );
}

export function getAllContentlayerDocs(): ContentDoc[] {
  if (cache) return cache;

  const sourceDocs = loadAllFromGeneratedIndexes();
  const seen = new Set<string>();
  const out: ContentDoc[] = [];

  for (const rawDoc of sourceDocs) {
    const key = dedupeKey(rawDoc);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(enrichWithCanonicalSlugs(rawDoc));
  }

  cache = out;
  return cache;
}

function candidateKeys(doc: ContentDoc): string[] {
  const rawPath = getRawPath(doc);
  const slug = normalizeSlug(safeString(doc.slug));
  const slugComputed = normalizeSlug(safeString(doc.slugComputed));
  const urlSlug = normalizeSlug(safeString(doc.urlSlug));
  const collectionSlug = normalizeFlattenedPath(safeString(doc.collectionSlug));
  const href = normalizeSlug(safeString(doc.href).replace(/^\/+/, ""));

  return [rawPath, slug, slugComputed, urlSlug, collectionSlug, href].filter(Boolean);
}

export function getDocBySlug(slug: string): ContentDoc | null {
  const needle = normalizeFlattenedPath(String(slug || ""));
  if (!needle) return null;

  const docs = getAllContentlayerDocs();

  for (const doc of docs) {
    const keys = candidateKeys(doc);
    if (keys.includes(needle)) return doc;

    const docKind = getDocKind(doc);
    const urlSlug = normalizeSlug(safeString(doc.urlSlug));
    if (urlSlug) {
      const maybeCollectionMatch =
        (docKind === "short" && needle === `shorts/${urlSlug}`) ||
        (docKind === "brief" && needle === `briefs/${urlSlug}`) ||
        (docKind === "post" && (needle === `blog/${urlSlug}` || needle === `posts/${urlSlug}`)) ||
        (docKind === "canon" && (needle === `canon/${urlSlug}` || needle === `canons/${urlSlug}`)) ||
        (docKind === "book" && needle === `books/${urlSlug}`) ||
        (docKind === "event" && needle === `events/${urlSlug}`) ||
        (docKind === "download" && needle === `downloads/${urlSlug}`) ||
        (docKind === "print" && needle === `prints/${urlSlug}`) ||
        (docKind === "resource" && needle === `resources/${urlSlug}`) ||
        (docKind === "strategy" &&
          (needle === `strategy/${urlSlug}` || needle === `strategies/${urlSlug}`)) ||
        (docKind === "lexicon" && needle === `lexicon/${urlSlug}`) ||
        (docKind === "vault" && needle === `vault/${urlSlug}`);

      if (maybeCollectionMatch) return doc;
    }
  }

  return null;
}

function byKind(kind: DocKind): ContentDoc[] {
  return getAllContentlayerDocs().filter((doc) => getDocKind(doc) === kind);
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

function getByCollectionSlug(collections: string[], slug: string): ContentDoc | null {
  const normalizedSlug = normalizeSlug(String(slug || ""));
  if (!normalizedSlug) return null;

  const wanted = collections.map((collection) => `${collection}/${normalizedSlug}`);
  return (
    getAllContentlayerDocs().find((doc) => {
      const collectionSlug = normalizeFlattenedPath(safeString(doc.collectionSlug));
      return wanted.includes(collectionSlug);
    }) || null
  );
}

export function getPostBySlug(slug: string) {
  return getByCollectionSlug(["blog", "posts"], slug);
}

export function getBookBySlug(slug: string) {
  return getByCollectionSlug(["books"], slug);
}

export function getDownloadBySlug(slug: string) {
  return getByCollectionSlug(["downloads"], slug);
}

export function getResourceBySlug(slug: string) {
  return getByCollectionSlug(["resources"], slug);
}

export function getEventBySlug(slug: string) {
  return getByCollectionSlug(["events"], slug);
}

export function getPrintBySlug(slug: string) {
  return getByCollectionSlug(["prints"], slug);
}

export function getStrategyBySlug(slug: string) {
  return getByCollectionSlug(["strategy", "strategies"], slug);
}

export function getCanonBySlug(slug: string) {
  return getByCollectionSlug(["canon", "canons"], slug);
}

export function getBriefBySlug(slug: string) {
  return getByCollectionSlug(["briefs"], slug);
}

export function getShortBySlug(slug: string) {
  return getByCollectionSlug(["shorts"], slug);
}

export function getLexiconBySlug(slug: string) {
  return getByCollectionSlug(["lexicon"], slug);
}

export function getVaultBySlug(slug: string) {
  return getByCollectionSlug(["vault"], slug);
}

export function getServerBookBySlug(slug: string) {
  return getBookBySlug(slug);
}

export function getServerCanonBySlug(slug: string) {
  return getCanonBySlug(slug);
}

function defaultHrefForKind(kind: DocKind, urlSlug: string): string {
  const s = normalizeSlug(urlSlug);
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
      return `/${s}`;
  }
}

export function getCardProps(doc: ContentDoc): CardProps {
  const enriched = enrichWithCanonicalSlugs(doc);
  const kind = getDocKind(enriched);

  const title = safeString(enriched.title, "Untitled");
  const description =
    safeString(enriched.excerpt || enriched.description || enriched.summary || "", "") || null;

  const slug = normalizeSlug(safeString(enriched.urlSlug) || safeString(enriched.slug) || "unknown");
  const href = safeString(enriched.href) || defaultHrefForKind(kind, slug);

  const dateISO =
    safeISO(
      enriched.date ||
        enriched.eventDate ||
        enriched.startDate ||
        enriched.datetime ||
        enriched.startsAt
    ) ?? null;

  const tags = safeArray(enriched.tags);
  const coverImage =
    safeString(
      enriched.coverImage ||
        enriched.image ||
        enriched.heroImage ||
        enriched.ogImage ||
        "",
      ""
    ) || null;

  const coverAspect =
    safeString(enriched.coverAspect || enriched.imageAspect || enriched.aspect || "", "") || null;

  const category = safeString(enriched.category || enriched.theme || "", "") || null;
  const tier = getAccessLevel(enriched);
  const published = isPublished(enriched);

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

export function toUiDoc(doc: ContentDoc) {
  const props = getCardProps(doc);
  return {
    ...props,
    id: safeString(doc?._id) || props.slug,
    raw: doc,
  };
}