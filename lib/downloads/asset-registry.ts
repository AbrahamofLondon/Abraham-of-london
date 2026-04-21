/* lib/downloads/asset-registry.ts — CANONICAL DOWNLOAD ASSET REGISTRY */

import type { AccessTier } from "@/lib/access/tier-policy";
import {
  normalizeRequiredTier,
  requiredTierFromDoc,
} from "@/lib/access/tier-policy";

import {
  getAllDownloads,
  getPublishedBooks,
  getAllCanons,
} from "@/lib/content/server";

import {
  getPremiumContentList,
  getPremiumContentById,
  type PremiumContentItem,
} from "@/lib/premium/content-registry";
import { getPdfAssetBySlug } from "@/lib/assets/pdf-identity";

export type DownloadAssetContentType =
  | "books"
  | "canon"
  | "briefs"
  | "downloads";

export type DownloadAssetRecord = {
  id: string;
  slug: string;
  title: string;
  contentType: DownloadAssetContentType;
  requiredTier: AccessTier;
  isPublic: boolean;

  source: "premium-registry" | "content-doc";

  bodyCode?: string;
  downloadUrl?: string | null;

  premiumContentId?: string | null;
  mimeType?: string | null;
  filename?: string | null;

  watermarkRequired: boolean;
  maxDownloads?: number | null;

  metadata?: Record<string, unknown>;
};

function safeTrim(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSlugLike(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

function lastSegment(value: string): string {
  const parts = normalizeSlugLike(value).split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

function normalizeContentType(
  input: unknown,
): DownloadAssetContentType | null {
  const v = safeTrim(input).toLowerCase();

  if (v === "books" || v === "book") return "books";
  if (v === "canon" || v === "canons") return "canon";
  if (v === "briefs" || v === "brief") return "briefs";
  if (v === "downloads" || v === "download") return "downloads";

  return null;
}

function extractBodyCode(doc: any): string {
  return String(
    doc?.body?.code ||
      doc?.bodyCode ||
      doc?.content ||
      doc?.mdx ||
      doc?.body?.raw ||
      ""
  );
}

function getDocSlugCandidates(doc: any): string[] {
  const raw = normalizeSlugLike(doc?._raw?.flattenedPath || "");
  const slug = normalizeSlugLike(doc?.slug || "");
  const slugSafe = normalizeSlugLike(doc?.slugSafe || "");

  return Array.from(
    new Set(
      [raw, slug, slugSafe, lastSegment(raw), lastSegment(slug), lastSegment(slugSafe)].filter(
        Boolean,
      ),
    ),
  );
}

function matchesRequestedSlug(doc: any, requestedSlug: string): boolean {
  const wanted = normalizeSlugLike(requestedSlug);
  if (!wanted) return false;

  const candidates = getDocSlugCandidates(doc).map((v) => v.toLowerCase());
  const lowerWanted = wanted.toLowerCase();

  return (
    candidates.includes(lowerWanted) ||
    candidates.includes(`books/${lowerWanted}`) ||
    candidates.includes(`canon/${lowerWanted}`) ||
    candidates.includes(`briefs/${lowerWanted}`) ||
    candidates.includes(`downloads/${lowerWanted}`)
  );
}

function normalizePremiumRequiredTier(item: PremiumContentItem): AccessTier {
  const classification = safeTrim(item.metadata?.classification).toLowerCase();

  if (!classification || classification === "public") return "public";

  if (Array.isArray(item.metadata?.allowedTiers) && item.metadata.allowedTiers.length > 0) {
    const strongest = item.metadata.allowedTiers[item.metadata.allowedTiers.length - 1];
    return normalizeRequiredTier(strongest);
  }

  return normalizeRequiredTier(classification);
}

function toPremiumAssetRecord(
  item: PremiumContentItem,
  contentType: DownloadAssetContentType,
): DownloadAssetRecord {
  const requiredTier = normalizePremiumRequiredTier(item);

  return {
    id: item.id,
    slug: item.id,
    title: item.title,
    contentType,
    requiredTier,
    isPublic: requiredTier === "public",
    source: "premium-registry",

    premiumContentId: item.id,
    mimeType: item.asset.mimeType || null,
    filename: item.asset.filename || null,
    watermarkRequired: Boolean(item.metadata?.watermarkRequired),
    maxDownloads:
      typeof item.metadata?.maxDownloads === "number"
        ? item.metadata.maxDownloads
        : null,

    metadata: {
      subtitle: item.subtitle,
      category: item.category,
      categorySlug: item.categorySlug,
      confidentialLevel: item.confidentialLevel,
      tags: item.tags,
      classification: item.metadata?.classification,
      allowedTiers: item.metadata?.allowedTiers,
      relativePath: item.asset.relativePath,
    },
  };
}

function toDocAssetRecord(
  doc: any,
  contentType: DownloadAssetContentType,
  requestedSlug: string,
): DownloadAssetRecord {
  const requiredTier = normalizeRequiredTier(requiredTierFromDoc(doc));
  const slug = normalizeSlugLike(
    doc?.slug ||
      doc?.slugSafe ||
      doc?._raw?.flattenedPath ||
      requestedSlug,
  );
  const identity = getPdfAssetBySlug(lastSegment(slug) || requestedSlug);

  return {
    id: slug,
    slug,
    title: String(doc?.title || requestedSlug),
    contentType,
    requiredTier,
    isPublic: requiredTier === "public",
    source: "content-doc",

    bodyCode: extractBodyCode(doc),
    downloadUrl: identity?.canonicalPath || null,
    watermarkRequired: false,
    maxDownloads: null,

    metadata: {
      description: doc?.description || doc?.excerpt || null,
      coverImage: doc?.coverImage || null,
      tags: Array.isArray(doc?.tags) ? doc.tags : [],
      flattenedPath: doc?._raw?.flattenedPath || null,
      pdfIdentity: identity,
    },
  };
}

function resolveFromPremiumRegistry(
  contentType: DownloadAssetContentType,
  slug: string,
): DownloadAssetRecord | null {
  const wanted = normalizeSlugLike(slug);
  if (!wanted) return null;

  const exact = getPremiumContentById(wanted);
  if (exact) return toPremiumAssetRecord(exact, contentType);

  const premium = getPremiumContentList().find((item) => {
    const id = normalizeSlugLike(item.id);
    const filename = normalizeSlugLike(item.asset.filename || "");
    const relative = normalizeSlugLike(item.asset.relativePath || "");
    const titleSlug = normalizeSlugLike(
      String(item.title || "")
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    );

    const lastFile = filename ? filename.replace(/\.[^.]+$/, "") : "";
    return (
      wanted === id ||
      wanted === lastFile ||
      wanted === relative ||
      wanted === lastSegment(relative) ||
      wanted === titleSlug
    );
  });

  return premium ? toPremiumAssetRecord(premium, contentType) : null;
}

function resolveFromDocs(
  contentType: DownloadAssetContentType,
  slug: string,
): DownloadAssetRecord | null {
  const wanted = normalizeSlugLike(slug);
  if (!wanted) return null;

  const docs =
    contentType === "books"
      ? getPublishedBooks()
      : contentType === "canon"
        ? getAllCanons()
        : getAllDownloads();

  const doc =
    docs.find((d: any) => matchesRequestedSlug(d, wanted) && !d?.draft) || null;

  return doc ? toDocAssetRecord(doc, contentType, wanted) : null;
}

export function normalizeAssetContentType(
  input: unknown,
): DownloadAssetContentType | null {
  return normalizeContentType(input);
}

export async function resolveDownloadAsset(params: {
  contentType: unknown;
  slug: unknown;
}): Promise<DownloadAssetRecord | null> {
  const contentType = normalizeContentType(params.contentType);
  const slug = normalizeSlugLike(params.slug);

  if (!contentType || !slug) return null;

  if (contentType === "briefs" || contentType === "downloads") {
    const premium = resolveFromPremiumRegistry(contentType, slug);
    if (premium) return premium;
  }

  const doc = resolveFromDocs(contentType, slug);
  if (doc) return doc;

  const identity = getPdfAssetBySlug(slug);
  if (identity) {
    return {
      id: identity.slug,
      slug: identity.slug,
      title: identity.title,
      contentType,
      requiredTier: "public",
      isPublic: true,
      source: "content-doc",
      bodyCode: "",
      downloadUrl: identity.canonicalPath,
      watermarkRequired: false,
      maxDownloads: null,
      metadata: { pdfIdentity: identity },
    };
  }

  return null;
}

export default {
  normalizeAssetContentType,
  resolveDownloadAsset,
};
