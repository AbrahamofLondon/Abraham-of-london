// lib/canon.ts
import { allCanons } from "contentlayer/generated";
import type { Canon as ContentlayerCanon } from "contentlayer/generated";

export type Canon = ContentlayerCanon;

/* -------------------------------------------------------------------------- */
/* Normalisers                                                                */
/* -------------------------------------------------------------------------- */

const s = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));
const norm = (v: unknown) => s(v).trim().toLowerCase();

function isTruthyString(v: unknown): boolean {
  const n = norm(v);
  return n === "true" || n === "1" || n === "yes";
}

export function isDraftCanon(doc: any): boolean {
  if (!doc) return true;

  // explicit frontmatter draft
  if (doc.draft === true) return true;
  if (typeof doc.draft === "string" && isTruthyString(doc.draft)) return true;

  // convention: underscore prefix drafts
  const file = s(doc?._raw?.sourceFileName);
  if (file.startsWith("_")) return true;

  return false;
}

export function getAccessLevel(doc: any): "public" | "inner-circle" | "private" {
  const v = norm(doc?.accessLevel);
  if (v === "inner-circle" || v === "private" || v === "public") return v;
  // default to public when missing/invalid
  return "public";
}

export function isPublicCanon(doc: any): boolean {
  return getAccessLevel(doc) === "public";
}

/* -------------------------------------------------------------------------- */
/* Slug resolution                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Canon slug should be stable and match your Next.js route params.
 * Priority:
 * 1) frontmatter slug
 * 2) contentlayer computed url (/canon/<slug>) -> take last segment
 * 3) _raw.flattenedPath -> take last segment (or parent if ends with index)
 */
export function resolveCanonSlug(doc: any): string {
  if (!doc) return "";

  const explicit = norm(doc.slug);
  if (explicit) return explicit.replace(/\/+$/, "");

  const url = s(doc.url).trim();
  if (url) {
    const parts = url.split("/").filter(Boolean);
    const last = parts[parts.length - 1] ?? "";
    if (last) return norm(last);
  }

  const fp = s(doc?._raw?.flattenedPath).trim();
  if (!fp) return "";

  const parts = fp.split("/").filter(Boolean);
  const last = parts[parts.length - 1] ?? "";
  const fallback = last === "index" ? parts[parts.length - 2] ?? "" : last;

  return norm(fallback);
}

/* -------------------------------------------------------------------------- */
/* Index mapping                                                              */
/* -------------------------------------------------------------------------- */

export type CanonIndexItem = {
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  description: string | null;
  coverImage: string | null;
  volumeNumber: number | null;
  date: string | null;
  tags: string[];
  featured: boolean;
  accessLevel: "public" | "inner-circle" | "private";
  lockMessage: string | null;
  draft: boolean;
  order: number | null;
};

function toNumberOrNull(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(s(v).trim());
  return Number.isFinite(n) ? n : null;
}

export function getCanonIndexItems(): CanonIndexItem[] {
  return (allCanons ?? [])
    .filter((c) => c && !isDraftCanon(c))
    .map((c) => {
      const slug = resolveCanonSlug(c);

      return {
        slug,
        title: s(c.title).trim() || "Untitled Canon Volume",
        subtitle: s(c.subtitle).trim() || null,
        excerpt: s((c as any).excerpt).trim() || null,
        description: s((c as any).description).trim() || null,
        coverImage: s((c as any).coverImage).trim() || null,
        volumeNumber: toNumberOrNull((c as any).volumeNumber),
        date: typeof c.date === "string" ? c.date : c.date ? String(c.date) : null,
        tags: Array.isArray((c as any).tags)
          ? (c as any).tags.map((t: any) => s(t).trim()).filter(Boolean)
          : [],
        featured: Boolean((c as any).featured),
        accessLevel: getAccessLevel(c),
        lockMessage: s((c as any).lockMessage).trim() || null,
        draft: Boolean((c as any).draft) || isDraftCanon(c),
        order: toNumberOrNull((c as any).order),
      };
    })
    .filter((it) => Boolean(it.slug)); // drop empty slugs so routes don't break
}

/* -------------------------------------------------------------------------- */
/* Getters                                                                    */
/* -------------------------------------------------------------------------- */

/** Full doc (includes body.code) */
export function getCanonDocBySlug(slug: string): Canon | null {
  const target = norm(slug);
  if (!target) return null;

  const docs = allCanons ?? [];

  return (
    docs.find((c) => !isDraftCanon(c) && resolveCanonSlug(c) === target) ??
    docs.find((c) => !isDraftCanon(c) && norm(c?._raw?.flattenedPath?.split("/").pop()) === target) ??
    null
  );
}

/** Public canon documents (non-draft, public access) */
export function getPublicCanon(): Canon[] {
  return (allCanons ?? []).filter((c) => c && !isDraftCanon(c) && isPublicCanon(c));
}

/** All canons excluding drafts */
export function getAllCanons(): Canon[] {
  return (allCanons ?? []).filter((c) => c && !isDraftCanon(c));
}

/** Featured canons (excluding drafts) */
export function getFeaturedCanons(): Canon[] {
  return (allCanons ?? []).filter(
    (c) => c && !isDraftCanon(c) && (c as any).featured === true
  );
}

/** Canon by slug (excluding drafts) */
export function getCanonBySlug(slug: string): Canon | undefined {
  const target = norm(slug);
  return (allCanons ?? []).find((c) => c && !isDraftCanon(c) && resolveCanonSlug(c) === target);
}

/* -------------------------------------------------------------------------- */
/* Type guard                                                                 */
/* -------------------------------------------------------------------------- */

export function isCanon(doc: any): doc is ContentlayerCanon {
  return String(doc?.type ?? doc?._type ?? "").toLowerCase() === "canon";
}

/* -------------------------------------------------------------------------- */
/* Diagnostics (optional but deadly useful)                                   */
/* -------------------------------------------------------------------------- */

export function debugCanonVisibility() {
  const docs = allCanons ?? [];
  return docs.map((c: any) => {
    const slug = resolveCanonSlug(c);
    const draft = isDraftCanon(c);
    const access = getAccessLevel(c);
    const reasons: string[] = [];

    if (!slug) reasons.push("missing_slug");
    if (draft) reasons.push("draft");
    if (access !== "public") reasons.push(`accessLevel=${access}`);

    return {
      title: s(c?.title).trim(),
      flattenedPath: s(c?._raw?.flattenedPath),
      slug,
      draft,
      accessLevel: access,
      visiblePublic: !draft && access === "public" && Boolean(slug),
      reasons,
    };
  });
}