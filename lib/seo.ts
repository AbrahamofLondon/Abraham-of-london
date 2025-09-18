import Head from "next/head";

const SITE_NAME = "Abraham of London";
const ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";
const DEFAULT_DESC =
  "Principled strategy, writing, and ventures that prioritise signal over noise. Discreet Chatham Rooms available—off the record.";
const TWITTER_HANDLE = "@Abraham_of_LDN";

function abs(path: string) {
  if (!path.startsWith("/")) return path;
  return `${ORIGIN}${path}`;
}

/* -------------------- <OgHead/> -------------------- */
type OgHeadProps = {
  title: string;
  description?: string;
  /** path starting with '/' e.g. '/blog/foo' */
  path: string;
  /** explicit OG image path if you want to override the /api/og one */
  ogImagePath?: string;
  /** og:type; "website" default; "article" for posts */
  type?: "website" | "article";
  /** add noindex when true (e.g., past events) */
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
  const ogImage = ogImagePath ? abs(ogImagePath) : `${ORIGIN}/api/og?title=${encodeURIComponent(title)}`;

  return (
    <Head>
      {/* Primary */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noIndex ? <meta name="robots" content="noindex, nofollow" /> : null}

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
function JsonLd({ data }: { data: Record<string, any> }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
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

  const data = {
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
  const data: any = {
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
    data.location = { "@type": "Place", name: location.name, address: location.address };
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
  const data = {
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

export function BreadcrumbJsonLd({ items }: { items: Array<{ name: string; item: string }> }) {
  const data = {
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

export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: ORIGIN,
    logo: `${ORIGIN}/icon-512.png`,
    sameAs: [
      "https://x.com/Abraham_of_LDN",
      "https://www.linkedin.com/in/abraham-adaramola-06630321/",
      "https://www.instagram.com/abraham_of_london",
      "https://www.youtube.com/"
    ],
  };
  return <JsonLd data={data} />;
}
