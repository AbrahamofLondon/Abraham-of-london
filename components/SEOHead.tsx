// components/SEOHead.tsx
import Head from "next/head";
import { absUrl } from "@/lib/siteConfig";

type Props = {
  title: string;
  description?: string;
  slug?: string;                 // e.g. "/blog/out-of-context-truth"
  coverImage?: string;           // absolute URL preferred
  publishedTime?: string;
  modifiedTime?: string;
  authorName?: string;
  tags?: string[];
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
}: Props) {
  const url = absUrl(slug);
  const img = coverImage || absUrl("/assets/images/social/og-image.jpg");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    image: [img],
    author: [{ "@type": "Person", name: authorName }],
    datePublished: publishedTime || undefined,
    dateModified: modifiedTime || publishedTime || undefined,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };

  return (
    <Head>
      <title>{title} | Abraham of London</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content="article" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {tags.map((t) => (
        <meta key={t} property="article:tag" content={t} />
      ))}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={img} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </Head>
  );
}
