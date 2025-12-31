/* ============================================================================
 * ENTERPRISE SEO CONTEXT SYSTEM
 * Version: 4.0.0
 * * Upgraded to support context retention from Contentlayer Helper v3.2.1.
 * Provides O(1) metadata resolution for all 24 project contexts.
 * ============================================================================ */

import { Metadata } from "next";
import ContentHelper, { ContentDoc, CardProps } from "@/lib/content-helper";

/* -------------------------------------------------------------------------- */
/* 1. TYPES & REGISTRY CONTEXT                                                */
/* -------------------------------------------------------------------------- */

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

const SITE_NAME = "Abraham of London";
const DEFAULT_DESC = "Insights, strategy, and leadership from Abraham of London.";
const TWITTER_HANDLE = "@AbrahamOfLondon";

/* -------------------------------------------------------------------------- */
/* 2. CORE URL RESOLVERS                                                      */
/* -------------------------------------------------------------------------- */

function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://abrahamoflondon.org").replace(/\/+$/, "");
}

export function toAbsoluteUrl(input?: string): string | undefined {
  if (!input) return undefined;
  if (/^https?:\/\//i.test(input)) return input;
  return `${getBaseUrl()}/${input.replace(/^\/+/, "")}`;
}

/* -------------------------------------------------------------------------- */
/* 3. ROBUST METADATA BUILDER                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Faithfully builds Next.js Metadata objects using the 24-context registry.
 * This is the primary entry point for Page components.
 */
export function buildMetadata(input: SeoInput): Metadata {
  const baseUrl = getBaseUrl();
  let card: CardProps | null = null;

  // If a document context is provided, resolve using the Enterprise Helper
  if (input.doc) {
    card = ContentHelper.getCardProps(input.doc);
  }

  // Priority-based resolution (Contextual Field -> Input Override -> Global Default)
  const titleCore = (input.title || card?.ogTitle || card?.title || SITE_NAME).trim();
  const titleFull = input.title || card?.title ? `${titleCore} | ${SITE_NAME}` : SITE_NAME;
  
  const description = (
    input.description || 
    card?.socialCaption || 
    card?.excerpt || 
    input.doc?.subtitle || 
    DEFAULT_DESC
  ).trim();

  const canonical = input.canonicalUrl || (card?.href ? `${baseUrl}${card.href}` : baseUrl);
  const imageUrl = toAbsoluteUrl(input.imageUrl || card?.coverImage);
  const robots = input.noindex ? "noindex, follow" : "index, follow";

  return {
    title: titleFull,
    description,
    alternates: {
      canonical: canonical,
    },
    robots,
    openGraph: {
      title: titleCore,
      description,
      url: canonical,
      siteName: SITE_NAME,
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630, alt: titleCore }] : [],
      type: card?.kind === "post" || card?.kind === "article" ? "article" : "website",
      ...(card?.dateISO && { publishedTime: card.dateISO }),
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title: titleCore,
      description,
      images: imageUrl ? [imageUrl] : [],
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
    },
    // Retain context for visual positioning in the project
    other: card ? {
      "content-kind": card.kind,
      "cover-fit": card.coverFit,
      "cover-position": card.coverPosition,
    } : {},
  };
}

/* -------------------------------------------------------------------------- */
/* 4. CONTEXT RETENTION HELPER FOR DYNAMIC ROUTES                             */
/* -------------------------------------------------------------------------- */

/**
 * One-liner for generateMetadata in Next.js dynamic routes.
 * Handles slug lookup and SEO generation for any of the 24 contexts.
 */
export async function getDynamicMetadata(
  slug: string, 
  kind: any // DocKind
): Promise<Metadata> {
  const doc = ContentHelper.getDocBySlug(slug, kind);
  if (!doc) return { title: "Not Found" };

  return buildMetadata({ doc });
}