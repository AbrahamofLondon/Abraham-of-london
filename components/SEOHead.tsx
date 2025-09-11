import Head from "next/head";

type SEOHeadProps = {
  title: string;
  description: string;
  /** slug or full path, e.g. "/blog/when-gods-..." */
  slug: string;
  coverImage?: string;          // "/assets/images/..." or full URL
  publishedTime?: string;       // ISO date string
  modifiedTime?: string;        // ISO date string
  authorName?: string;          // defaults to site author
  tags?: string[];              // article:tag
  noindex?: boolean;            // override indexing
  locale?: string;              // default en_GB
};

const siteUrl =
  (process.env.NEXT_PUBLIC_SITE_URL as string) ||
  (globalThis as any)?.siteConfig?.siteUrl ||
  "https://www.abrahamoflondon.org";

const siteName =
  (globalThis as any)?.siteConfig?.siteName || "Abraham of London";

const twitterHandle =
  (globalThis as any)?.siteConfig?.twitter || "@abrahamoflondon";

function absUrl(pathOrUrl?: string) {
  if (!pathOrUrl) return undefined;
  try {
    // already absolute
    const u = new URL(pathOrUrl);
    return u.toString();
  } catch {
    // make absolute
    const p = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
    return `${siteUrl.replace(/\/+$/,"")}${p}`;
  }
}

export default function SEOHead({
  title,
  description,
  slug,
  coverImage,
  publishedTime,
  modifiedTime,
  authorName = "Abraham of London",
  tags = [],
  noindex = false,
  locale = "en_GB",
}: SEOHeadProps) {
  const canonical = absUrl(slug);
  const ogImage = absUrl(coverImage) || absUrl("/assets/images/og-default.jpg");

  const robots = noindex ? "noindex,nofollow" : "index,follow";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    image: ogImage ? [ogImage] : undefined,
    url: canonical,
    mainEntityOfPage: canonical,
    datePublished: publishedTime,
    dateModified: modifiedTime || publishedTime,
    author: [{ "@type": "Person", name: authorName }],
    publisher: {
      "@type": "Organization",
      name: siteName,
      logo: {
        "@type": "ImageObject",
        url: absUrl("/icon-512x512.png"),
      },
    },
  };

  return (
    <Head>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {canonical && <link rel="canonical" href={canonical} />}
      <meta name="robots" content={robots} />

      {/* Open Graph */}
      <meta property="og:type" content="article" />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content={locale} />
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      {canonical && <meta property="og:url" content={canonical} />}
      {ogImage && (
        <>
          <meta property="og:image" content={ogImage} />
          <meta property="og:image:alt" content={title} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
        </>
      )}
      {publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {tags.map((t) => (
        <meta key={t} property="article:tag" content={t} />
      ))}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={twitterHandle} />
      <meta name="twitter:title" content={title} />
      {description && (
        <meta name="twitter:description" content={description} />
      )}
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </Head>
  );
}
