// lib/content/index.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * CLIENT-SAFE CONTENT API
 * - Utilities only (slug, sanitize, mapping helpers)
 * - NO contentlayer collections, NO server getters, NO fs/redis/db.
 */

const WARN =
  process.env.NODE_ENV !== "production"
    ? (...args: any[]) => console.warn("[CONTENT]", ...args)
    : () => {};

export function normalizeSlug(input: string): string {
  try {
    return (input || "").trim().replace(/^\/+/, "").replace(/\/+$/, "");
  } catch {
    return "";
  }
}

export function sanitizeData<T = any>(data: T): T {
  try {
    return JSON.parse(
      JSON.stringify(data, (_k, v) => {
        if (v === undefined) return null;
        if (typeof v === "function") return undefined;
        if (typeof v === "bigint") return v.toString();
        return v;
      })
    );
  } catch (e) {
    WARN("sanitizeData failed; returning empty object.", e);
    return {} as T;
  }
}

export function isDraftContent(doc: any): boolean {
  try {
    return Boolean(doc?.draft);
  } catch {
    return false;
  }
}

export function isPublished(doc: any): boolean {
  try {
    if (!doc) return false;
    if (doc.draft === true) return false;
    if (doc.date) {
      const d = new Date(doc.date);
      if (!Number.isNaN(d.getTime()) && d.getTime() > Date.now()) return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function getAccessLevel(doc: any): string {
  try {
    return doc?.accessLevel || "public";
  } catch {
    return "public";
  }
}

export function resolveDocCoverImage(doc: any): string | null {
  if (!doc) return null;
  try {
    const pick = (v: any): string | null => {
      if (!v) return null;
      if (typeof v === "string") return v;
      if (typeof v?.url === "string") return v.url;
      return null;
    };
    return pick(doc.coverImage) || pick(doc.featuredImage) || pick(doc.image) || null;
  } catch {
    return null;
  }
}

export function resolveDocDownloadUrl(doc: any): string | null {
  try {
    if (!doc) return null;
    if (typeof doc.downloadUrl === "string") return doc.downloadUrl;
    if (typeof doc.fileUrl === "string") return doc.fileUrl;
    if (typeof doc.url === "string") return doc.url;
    return null;
  } catch {
    return null;
  }
}

export function getDocKind(doc: any): string {
  if (!doc) return "unknown";
  try {
    const src: string | undefined =
      doc?._raw?.sourceFilePath || doc?._raw?.source || doc?._raw?.flattenedPath;
    if (src) {
      if (src.includes("/books/")) return "book";
      if (src.includes("/canon/") || src.includes("/canons/")) return "canon";
      if (src.includes("/downloads/")) return "download";
      if (src.includes("/posts/") || src.includes("/blog/")) return "post";
      if (src.includes("/prints/")) return "print";
      if (src.includes("/resources/")) return "resource";
      if (src.includes("/strategies/") || src.includes("/strategy/")) return "strategy";
      if (src.includes("/events/")) return "event";
      if (src.includes("/shorts/")) return "short";
    }
    return doc?.type || doc?._type || "unknown";
  } catch {
    return "unknown";
  }
}

export function getDocHref(doc: any): string {
  if (!doc?.slug) return "/";
  try {
    const slug = normalizeSlug(doc.slug);
    switch (getDocKind(doc)) {
      case "book":
        return `/books/${slug}`;
      case "canon":
        return `/canon/${slug}`;
      case "download":
        return `/downloads/${slug}`;
      case "post":
        return `/blog/${slug}`;
      case "print":
        return `/prints/${slug}`;
      case "resource":
        return `/resources/${slug}`;
      case "strategy":
        return `/strategy/${slug}`;
      case "event":
        return `/events/${slug}`;
      case "short":
        return `/shorts/${slug}`;
      default:
        return `/${slug}`;
    }
  } catch {
    return "/";
  }
}

export function toUiDoc(doc: any): any {
  try {
    return {
      ...doc,
      slug: normalizeSlug(doc?.slug || ""),
      href: getDocHref(doc),
      kind: getDocKind(doc),
      coverImage: resolveDocCoverImage(doc),
      isPublished: isPublished(doc),
      accessLevel: getAccessLevel(doc),
    };
  } catch {
    return doc || {};
  }
}

const Content = {
  normalizeSlug,
  sanitizeData,
  isDraftContent,
  isPublished,
  getAccessLevel,
  resolveDocCoverImage,
  resolveDocDownloadUrl,
  getDocKind,
  getDocHref,
  toUiDoc,
};

export default Content;

// Helpful types used elsewhere (your code imports these)
export type DocBase = any;
export type DocKind = string;
export type Tier = "free" | "basic" | "premium" | "enterprise" | "restricted";