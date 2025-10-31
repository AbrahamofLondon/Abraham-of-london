// lib/seo.tsx
import Head from "next/head";
import * as React from "react";

// --- Constants ---
export const SITE_NAME = "Abraham of London";
export const ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";
// FIX: Corrected the broken ellipsis escape sequence
const DEFAULT_DESC =
  "Principled strategy, writing, and ventures that prioritize signal over noise. Discreet Chatham Rooms available—off the record.";
const TWITTER_HANDLE = "@Abraham_of_LDN";

// --- Utility Functions ---

/** Converts a relative path to an absolute URL using the site ORIGIN. */
function getAbsoluteUrl(path: string): string {
  if (path.startsWith("http")) {
    // Already absolute
    return path;
  }
  return path.startsWith("/") ? `${ORIGIN}${path}` : `${ORIGIN}/${path}`;
}

/** Utility to generate the URL-encoded path for the dynamic OG image endpoint. */
function getDynamicOgUrl(title: string, type: "og" | "twitter" = "og"): string {
    const params = new URLSearchParams({
        title: title.trim(),
        type: type,
    });
    return getAbsoluteUrl(`/api/og?${params.toString()}`);
}


/* -------------------- OG / Twitter Head Component -------------------- */
export type OgHeadProps = {
  title: string;
  description?: string;
  /** path beginning with '/', e.g. '/blog/slug' */
  path: string;
  /** Optional static image path (absolute or relative to origin) */
  ogImagePath?: string;
  type?: "website" | "article" | "book";
  noIndex?: boolean;
};

/**
 * Renders essential SEO metadata, Open Graph, and Twitter tags.
 */
export function OgHead({
  title,
  description = DEFAULT_DESC,
  path,
  ogImagePath,
  type = "website",
  noIndex,
}: OgHeadProps) {
  const canonical = getAbsoluteUrl(path);

  // Determine the OG image source, prioritizing a custom path, then dynamic generation
  const ogImage = ogImagePath
    ? getAbsoluteUrl(ogImagePath)
    : getDynamicOgUrl(title, "og"); // Defaults to og image type

  // Generate a dedicated Twitter image URL (assumes /api/og handles 'twitter' type)
  const twitterImage = ogImagePath
    ? getAbsoluteUrl(ogImagePath)
    : getDynamicOgUrl(title, "twitter");

  return (
    <Head>
      {/* Primary HTML & Indexing */}
      <title>{title} | {SITE_NAME}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      {/* Recommended OG Image dimensions */}
      <meta property="og:image:width" content="1200" /> 
      <meta property="og:image:height" content="630" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={twitterImage} />
    </Head>
  );
}

// --- JSON-LD Helpers ---

/** Renders a single JSON-LD block. */
function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data, null, 2) }} // Pretty-print for readability
      key={`json-ld-${data["@type"]}`}
    />
  );
}

/** Organization Schema (Essential for site-wide entity recognition) */
export function OrganizationJsonLd() {
    const data = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: SITE_NAME,
        url: ORIGIN,
        logo: getAbsoluteUrl("/assets/images/logo.png"), // Assuming a logo path
        sameAs: [
            // Add social links here for comprehensive SEO
            `https://twitter.com/${TWITTER_HANDLE.replace('@', '')}`,
        ]
    };
    return <JsonLd data={data} />;
}


/** Article Schema */
export function ArticleJsonLd({
  title,
  description,
  author = SITE_NAME,
  datePublished,
  dateModified,
  path,
  image,
}: {
  title: string;
  description?: string;
  author?: string;
  datePublished: string; // Must be present for Article
  dateModified?: string;
  path: string;
  image?: string;
}) {
  const url = getAbsoluteUrl(path);
  const img = image ? getAbsoluteUrl(image) : undefined;

  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: description || title,
    author: [{ "@type": "Person", name: author }],
    datePublished,
    dateModified: dateModified || datePublished,
    mainEntityOfPage: url,
    // image should be an array of absolute URLs
    image: img ? [img] : undefined, 
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: ORIGIN,
    },
  };

  return <JsonLd data={data} />;
}

/** Event Schema */
export function EventJsonLd({
  name,
  startDate,
  endDate,
  path,
  image,
  description,
  location,
  eventStatus,
}: {
  name: string;
  startDate: string; // ISO
  endDate?: string;
  path: string;
  image?: string;
  description?: string;
  location?: { name: string; address?: string };
  eventStatus?:
    | "https://schema.org/EventScheduled"
    | "https://schema.org/EventCancelled"
    | "https://schema.org/EventPostponed"
    | "https://schema.org/EventRescheduled"
    | "https://schema.org/EventMovedOnline"
    | "https://schema.org/EventCompleted";
}) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Event",
    name,
    startDate,
    endDate,
    url: getAbsoluteUrl(path),
    description,
    image: image ? [getAbsoluteUrl(image)] : undefined,
    eventStatus: eventStatus || "https://schema.org/EventScheduled",
  };
  
  if (location?.name) {
    data.location = {
      "@type": "Place",
      name: location.name,
      address: location.address,
    };
  }
  return <JsonLd data={data} />;
}

/** Book Schema */
export function BookJsonLd({
  name,
  author = SITE_NAME,
  path,
  image,
  description,
}: {
  name: string;
  author?: string;
  path: string;
  image?: string;
  description?: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Book",
    name,
    author: { "@type": "Person", name: author },
    url: getAbsoluteUrl(path),
    image: image ? [getAbsoluteUrl(image)] : undefined,
    description,
    publisher: { "@type": "Organization", name: SITE_NAME },
  };
  return <JsonLd data={data} />;
}

/** Breadcrumb Schema */
export function BreadcrumbJsonLd({
  items,
}: {
  items: Array<{ name: string; item: string }>;
}) {
    // Ensure all item URLs are absolute
  const itemListElement = items.map((it, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: it.name,
    item: getAbsoluteUrl(it.item),
  }));

  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: itemListElement,
  };
  return <JsonLd data={data} />;
}