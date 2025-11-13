// lib/seo.tsx
import Head from "next/head";

export const SITE_NAME = "Abraham of London";
export const ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";

const DEFAULT_DESC =
  "Principled strategy, writing, and ventures that prioritise signal over noise. Discreet Chatham Rooms available—off the record.";
const TWITTER_HANDLE = "@Abraham_of_LDN";

function abs(path: string): string {
  if (!path) return ORIGIN;
  return path.startsWith("/") ? `${ORIGIN}${path}` : path;
}

/* -------------------- OG / Twitter Head -------------------- */
export type OgHeadProps = {
  title: string;
  description?: string;
  /** path beginning with '/', e.g. '/blog/slug' */
  path: string;
  ogImagePath?: string;
  type?: "website" | "article";
  noIndex?: boolean;
};

export function OgHead({
  title,
  description = DEFAULT_DESC,
  path,
  ogImagePath,
  type = "website",
  noIndex,
}: OgHeadProps) {
  const canonical = abs(path);
  const ogImage = ogImagePath
    ? abs(ogImagePath)
    : `${ORIGIN}/api/og?title=${encodeURIComponent(title)}`;

  return (
    <Head>
      {/* Primary */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_HANDLE} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Head>
  );
}

/* -------------------- JSON-LD helpers -------------------- */

type JsonLdProps = {
  data: Record<string, unknown>;
};

function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      // We know this is safe structured data we control
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

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
  datePublished?: string;
  dateModified?: string;
  path: string;
  image?: string;
}) {
  const url = abs(path);
  const img = image ? abs(image) : undefined;

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    author: [{ "@type": "Person", name: author }],
    datePublished,
    dateModified: dateModified || datePublished,
    mainEntityOfPage: url,
    image: img ? [img] : undefined,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: ORIGIN,
    },
  };

  return <JsonLd data={data} />;
}

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
    url: abs(path),
    description,
    image: image ? [abs(image)] : undefined,
    eventStatus: eventStatus || "https://schema.org/EventScheduled",
  };

  if (location?.name) {
    (data as any).location = {
      "@type": "Place",
      name: location.name,
      address: location.address,
    };
  }

  return <JsonLd data={data} />;
}

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
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Book",
    name,
    author: { "@type": "Person", name: author },
    url: abs(path),
    image: image ? [abs(image)] : undefined,
    description,
    publisher: { "@type": "Organization", name: SITE_NAME },
  };

  return <JsonLd data={data} />;
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: Array<{ name: string; item: string }>;
}) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.item,
    })),
  };

  return <JsonLd data={data} />;
}