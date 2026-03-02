// pages/api/content/initialize.ts — COMPLETE INSTITUTIONAL SYNC (SSOT SAFE)
import type { NextApiRequest, NextApiResponse } from "next";

import {
  getAllCanons,
  getAllDownloads,
  getAllBooks,
  getAllShorts,
  getAllEvents,
  getAllResources,
  getAllPrints,
  getAllLexicons,
  getAllBlogs,
  normalizeSlug,
  sanitizeData,
} from "@/lib/content/server";

import tiers, { requiredTierFromDoc } from "@/lib/access/tiers";

/* -----------------------------------------------------------------------------
  TYPES
----------------------------------------------------------------------------- */
type ContentType =
  | "canon"
  | "download"
  | "book"
  | "short"
  | "event"
  | "resource"
  | "print"
  | "lexicon"
  | "blog";

interface NormalizedBrief {
  slug: string; // normalized "route slug" (no leading slash)
  title: string;
  type: ContentType;
  date: string | null;
  excerpt: string | null;

  // ✅ store canonical tier (SSOT) not raw accessLevel guesswork
  requiredTier: string;

  category?: string | null;

  // Optional, handy for clients
  href?: string | null;
}

interface ApiResponse {
  success: boolean;
  content: NormalizedBrief[];
  timestamp: string;
}

/* -----------------------------------------------------------------------------
  HELPERS
----------------------------------------------------------------------------- */
function pickHref(item: any): string | null {
  // Prefer computed hrefSafe, then href, then build from flattenedPath
  const href =
    (typeof item?.hrefSafe === "string" && item.hrefSafe) ||
    (typeof item?.href === "string" && item.href) ||
    "";

  const h = String(href || "").trim();
  return h ? h : null;
}

function pickSlug(item: any): string {
  // Prefer slugSafe, then slug, then flattenedPath
  const raw =
    (typeof item?.slugSafe === "string" && item.slugSafe) ||
    (typeof item?.slug === "string" && item.slug) ||
    (typeof item?._raw?.flattenedPath === "string" && item._raw.flattenedPath) ||
    "";

  return normalizeSlug(String(raw || ""));
}

function pickTitle(item: any, fallback: string): string {
  const t = String(item?.title || "").trim();
  return t || fallback;
}

function pickExcerpt(item: any): string | null {
  const e = String(item?.excerpt || "").trim();
  if (e) return e;
  const d = String(item?.description || "").trim();
  return d || null;
}

function pickDate(item: any): string | null {
  const d = item?.date ?? item?.updated ?? item?.lastUpdated ?? null;
  if (!d) return null;
  const s = String(d).trim();
  return s || null;
}

function isDraftish(slug: string, item: any): boolean {
  if (!slug) return true;
  if (slug.includes("/draft") || slug.includes("drafts/")) return true;
  if (item?.draft === true) return true;
  if (item?.published === false) return true;
  return false;
}

function mapItems(items: any[], type: ContentType, defaultTitle: string): NormalizedBrief[] {
  return (items || [])
    .map((item) => {
      const slug = pickSlug(item);
      const href = pickHref(item);

      if (isDraftish(slug, item)) return null;

      const requiredTier = tiers.normalize(requiredTierFromDoc(item));

      return {
        slug,
        href,
        title: pickTitle(item, defaultTitle),
        type,
        date: pickDate(item),
        excerpt: pickExcerpt(item),
        requiredTier,
        category: item?.category ?? null,
      } as NormalizedBrief;
    })
    .filter(Boolean) as NormalizedBrief[];
}

/* -----------------------------------------------------------------------------
  HANDLER
----------------------------------------------------------------------------- */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse | { success: false; reason?: string }>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ success: false, reason: "Method not allowed" });
  }

  try {
    const [canons, downloads, books, shorts, events, resources, prints, lexicons, blogs] =
      await Promise.all([
        Promise.resolve(getAllCanons() || []),
        Promise.resolve(getAllDownloads() || []),
        Promise.resolve(getAllBooks() || []),
        Promise.resolve(getAllShorts() || []),
        Promise.resolve(getAllEvents() || []),
        Promise.resolve(getAllResources() || []),
        Promise.resolve(getAllPrints() || []),
        Promise.resolve(getAllLexicons() || []),
        Promise.resolve(getAllBlogs() || []),
      ]);

    const normalizedContent: NormalizedBrief[] = [
      ...mapItems(canons, "canon", "Institutional Canon"),
      ...mapItems(downloads, "download", "Technical Transmission"),
      ...mapItems(books, "book", "Intelligence Volume"),
      ...mapItems(shorts, "short", "Field Note"),
      ...mapItems(events, "event", "Institutional Briefing"),
      ...mapItems(resources, "resource", "Asset"),
      ...mapItems(prints, "print", "Artistic Manifest"),
      ...mapItems(lexicons, "lexicon", "Terminology"),
      ...mapItems(blogs, "blog", "Editorial"),
    ].filter((x) => x.slug);

    // Sort by date desc, stable fallback to title
    normalizedContent.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      if (dateA !== dateB) return dateB - dateA;
      return (a.title || "").localeCompare(b.title || "");
    });

    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

    return res.status(200).json(
      sanitizeData({
        success: true,
        content: normalizedContent,
        timestamp: new Date().toISOString(),
      })
    );
  } catch (error) {
    console.error("❌ [API_CONTENT_ERROR] Registry expansion failed:", error);
    return res.status(500).json({ success: false, reason: "Internal Registry Failure" });
  }
}