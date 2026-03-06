/* ============================================================================
 * ENTERPRISE SEO CONTEXT SYSTEM
 * Version: 4.4.0
 * - Does NOT assume ContentHelper.getCardProps exists
 * - Builds a stable "card" locally from doc fields
 * - Uses ContentHelper.normalizeSlug/getDocBySlug if present (optional)
 * ============================================================================ */

import type { Metadata } from "next";
import * as ContentHelper from "@/lib/content-helper";
import type { ContentDoc, DocKind } from "@/lib/content-helper";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type AccessTier =
  | "public"
  | "member"
  | "inner_circle"
  | "client"
  | "legacy"
  | "architect"
  | "owner";

type CardLike = {
  kind?: string;
  title?: string;
  description?: string | null;
  subtitle?: string | null;
  href?: string;
  dateISO?: string | null;
  coverImage?: string | null;
  coverFit?: string | null;
  coverPosition?: string | null;
  coverAspect?: string | null;
  tier?: AccessTier | string;
  published?: boolean;
};

export interface SeoInput {
  title?: string;
  description?: string;
  path?: string;
  imageUrl?: string;
  noindex?: boolean;
  canonicalUrl?: string;
  /** Pass the full document to retain context-specific metadata */
  doc?: ContentDoc;
}

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const SITE_NAME = "Abraham of London";
const DEFAULT_DESC = "Insights, strategy, and leadership from Abraham of London.";
const TWITTER_HANDLE = "@AbrahamOfLondon";

/* -------------------------------------------------------------------------- */
/* URL HELPERS                                                                */
/* -------------------------------------------------------------------------- */

function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");
}

export function toAbsoluteUrl(input?: string): string | undefined {
  if (!input) return undefined;
  if (/^https?:\/\//i.test(input)) return input;
  return `${getBaseUrl()}/${String(input).replace(/^\/+/, "")}`;
}

function safeString(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function safeISO(v: unknown): string | null {
  const s = safeString(v, "");
  if (!s) return null;
  const t = Date.parse(s);
  if (!Number.isFinite(t)) return null;
  return new Date(t).toISOString();
}

function normalizeSlug(input: string): string {
  // Prefer ContentHelper.normalizeSlug if it exists
  const fn = (ContentHelper as any)?.normalizeSlug;
  if (typeof fn === "function") return fn(input);
  return safeString(input, "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

function inferKind(doc: any): string {
  // If helper exposes getDocKind, use it
  const fn = (ContentHelper as any)?.getDocKind;
  if (typeof fn === "function") return String(fn(doc) || "unknown");

  const raw = safeString(doc?._raw?.flattenedPath || doc?._raw?.sourceFilePath || doc?.slug || "").toLowerCase();

  if (raw.startsWith("shorts/")) return "short";
  if (raw.startsWith("briefs/")) return "brief";
  if (raw.startsWith("canon/")) return "canon";
  if (raw.startsWith("books/")) return "book";
  if (raw.startsWith("events/")) return "event";
  if (raw.startsWith("downloads/")) return "download";
  if (raw.startsWith("prints/")) return "print";
  if (raw.startsWith("resources/")) return "resource";
  if (raw.startsWith("strategy/")) return "strategy";
  if (raw.startsWith("lexicon/")) return "lexicon";
  if (raw.startsWith("blog/") || raw.startsWith("posts/")) return "post";

  return safeString(doc?.kind || doc?.type || doc?.docKind || "unknown");
}

function buildHref(kind: string, slug: string): string {
  const s = normalizeSlug(slug);
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

function computeBareSlug(doc: any): string {
  // prefer explicit slug; fallback to flattenedPath
  const raw = safeString(doc?.slug || doc?.slugComputed || doc?._raw?.flattenedPath || doc?._raw?.sourceFilePath || "");
  return normalizeSlug(raw)
    .replace(/^shorts\//i, "")
    .replace(/^briefs\//i, "")
    .replace(/^blog\//i, "")
    .replace(/^posts\//i, "")
    .replace(/^canon\//i, "")
    .replace(/^books\//i, "")
    .replace(/^events\//i, "")
    .replace(/^downloads\//i, "")
    .replace(/^prints\//i, "")
    .replace(/^resources\//i, "")
    .replace(/^strategy\//i, "")
    .replace(/^lexicon\//i, "");
}

function isPublished(doc: any): boolean {
  const fn = (ContentHelper as any)?.isPublished;
  if (typeof fn === "function") return Boolean(fn(doc));
  if (doc?.draft === true) return false;
  if (doc?.published === false) return false;
  return true;
}

function getAccessLevel(doc: any): AccessTier | string {
  const fn = (ContentHelper as any)?.getAccessLevel;
  if (typeof fn === "function") return fn(doc);
  return (doc?.tier || doc?.accessLevel || doc?.classification || "public") as any;
}

/**
 * ✅ Local "card" adapter
 * Works even if ContentHelper doesn't export getCardProps/toUiDoc.
 */
function deriveCard(doc: any): CardLike {
  const kind = inferKind(doc);

  const title = safeString(doc?.title, "Untitled");
  const description =
    safeString(doc?.excerpt || doc?.description || doc?.summary || "", "") || null;

  const bareSlug = computeBareSlug(doc) || "unknown";
  const href = bareSlug !== "unknown" ? buildHref(kind, bareSlug) : "/";

  const dateISO =
    safeISO(doc?.date || doc?.eventDate || doc?.startDate || doc?.datetime || doc?.startsAt) ?? null;

  const coverImage =
    safeString(doc?.coverImage || doc?.image || doc?.heroImage || doc?.ogImage || "", "") || null;

  const coverAspect =
    safeString(doc?.coverAspect || doc?.imageAspect || doc?.aspect || "", "") || null;

  const tier = getAccessLevel(doc);
  const published = isPublished(doc);

  return {
    kind,
    title,
    description,
    href,
    dateISO,
    coverImage,
    coverAspect,
    tier,
    published,
  };
}

/* -------------------------------------------------------------------------- */
/* METADATA BUILDER                                                           */
/* -------------------------------------------------------------------------- */

export function buildMetadata(input: SeoInput): Metadata {
  const baseUrl = getBaseUrl();
  const card: CardLike | null = input.doc ? deriveCard(input.doc) : null;

  const titleCore = String(input.title || card?.title || SITE_NAME).trim();
  const titleFull = input.title || card?.title ? `${titleCore} | ${SITE_NAME}` : SITE_NAME;

  const description = String(input.description || card?.description || DEFAULT_DESC).trim();

  const canonical =
    input.canonicalUrl ||
    (input.path
      ? `${baseUrl}${input.path.startsWith("/") ? input.path : `/${input.path}`}`
      : card?.href
        ? `${baseUrl}${card.href}`
        : baseUrl);

  const imageUrl = toAbsoluteUrl(input.imageUrl || card?.coverImage || undefined);
  const robots = input.noindex ? "noindex, follow" : "index, follow";

  return {
    title: titleFull,
    description,
    alternates: { canonical },
    robots,
    openGraph: {
      title: titleCore,
      description,
      url: canonical,
      siteName: SITE_NAME,
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630, alt: titleCore }] : [],
      type:
        card?.kind === "post" || card?.kind === "article" || card?.kind === "brief"
          ? "article"
          : "website",
      ...(card?.dateISO ? { publishedTime: card.dateISO } : {}),
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title: titleCore,
      description,
      images: imageUrl ? [imageUrl] : [],
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
    },
    other: card
      ? {
          "content-kind": String(card.kind || "unknown"),
          "content-tier": String(card.tier || "public"),
          "content-published": String(card.published ?? true),
          ...(card.coverAspect ? { "cover-aspect": String(card.coverAspect) } : {}),
        }
      : {},
  };
}

/* -------------------------------------------------------------------------- */
/* DYNAMIC ROUTE HELPER                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Keeps `kind` for call-site compatibility but does not require it.
 * Your current ContentHelper resolves by slug/path, not (kind, slug).
 */
export async function getDynamicMetadata(slug: string, _kind: DocKind): Promise<Metadata> {
  const normalized = normalizeSlug(String(slug || ""));

  const getDocBySlugFn =
    (ContentHelper as any)?.getDocBySlug ||
    (ContentHelper as any)?.getDocumentBySlug; // some projects used this name

  const doc =
    typeof getDocBySlugFn === "function"
      ? getDocBySlugFn(normalized)
      : null;

  if (!doc) return { title: "Not Found" };

  return buildMetadata({ doc });
}