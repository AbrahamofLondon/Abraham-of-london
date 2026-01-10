// components/SEOHead.tsx
import Head from "next/head";
import * as React from "react";
import { absUrl } from "@/lib/siteConfig";

type ArticleTag = string;

type Props = {
  /** Base title. If it already contains "Abraham of London", we won't append it again. */
  title: string;
  description?: string;
  /** Path or absolute URL */
  slug?: string;
  /** Absolute URL preferred */
  coverImage?: string;
  publishedTime?: string;
  modifiedTime?: string;
  authorName?: string;
  tags?: ArticleTag[];
  /** "article" (default) or "website" for non-article pages like /about */
  type?: "article" | "website";
  /** Force appending site name. By default we auto-append unless the title already includes it. */
  appendSiteName?: boolean;
  /** Extra tags (e.g., JSON-LD, preload hints) */
  children?: React.ReactNode;
};

export default function SEOHead({
  title,
  description = "",
  slug = "/",
  coverImage,
  publishedTime,
  modifiedTime,
  authorName = "Abraham of London",
  tags = [],
  type = "article",
  appendSiteName,
  children,
}: Props) {
  const url = absUrl(slug);
  const img = coverImage || absUrl("/assets/images/social/og-image.jpg");

  // Decide whether to append site name
  const alreadyBranded = /abraham of london/i.test(title);
  const shouldAppend = appendSiteName ?? !alreadyBranded;
  const fullTitle = shouldAppend ? `${title} | Abraham of London` : title;

  // JSON-LD
  const jsonLd =
    type === "article"
      ? {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: title,
          description,
          image: [img],
          author: [{ "@type": "Person", name: authorName }],
          datePublished: publishedTime || undefined,
          dateModified: modifiedTime || publishedTime || undefined,
          mainEntityOfPage: { "@type": "WebPage", "@id": url },
        }
      : {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: title,
          description,
          url,
          image: img,
        };

  return (
    <Head>
      {/* Title */}
      <title>{fullTitle}</title>

      {/* Canonical + description */}
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta
        property="og:type"
        content={type === "article" ? "article" : "website"}
      />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />

      {/* Article-only tags */}
      {type === "article" && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === "article" && (modifiedTime || publishedTime) && (
        <meta
          property="article:modified_time"
          content={modifiedTime || publishedTime}
        />
      )}
      {type === "article" &&
        tags.map((t) => <meta key={t} property="article:tag" content={t} />)}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={img} />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Passthrough for page-specific extras (preload hints, additional JSON-LD, etc.) */}
      {children}
    </Head>
  );
}


