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
    /** "article", "website", or "profile" for OpenGraph type. */
    type?: "article" | "website" | "profile";
    /** Force appending site name. By default we auto-append unless the title already includes it. */
    appendSiteName?: boolean;
    /** Extra tags (e.g., JSON-LD, preload hints) */
    children?: React.ReactNode;
    /** NEW: Optional structured data to be serialized and included. Can be an object or an array of objects. */
    structuredData?: any | any[]; // <-- FIX: Added the missing prop here
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
    type = "website",
    appendSiteName,
    children,
    structuredData, // <-- Destructure the new prop
}: Props) {
    const url = absUrl(slug);
    const img = coverImage || absUrl("/assets/images/social/og-image.jpg");

    // Decide whether to append site name
    const alreadyBranded = /abraham of london/i.test(title);
    const shouldAppend = appendSiteName ?? !alreadyBranded;
    const fullTitle = shouldAppend ? `${title} | Abraham of London` : title;

    // Base JSON-LD for the primary page content
    const baseJsonLd =
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
                  "@type": type === "profile" ? "ProfilePage" : "WebPage",
                  name: title,
                  description,
                  url,
                  image: img,
              };

    // Combine base JSON-LD with any passed structuredData
    // If structuredData is present, combine them into an array for a comprehensive JSON-LD block.
    const combinedJsonLd = structuredData
        ? Array.isArray(structuredData)
            ? [baseJsonLd, ...structuredData]
            : [baseJsonLd, structuredData]
        : baseJsonLd;

    return (
        <Head>
            {/* Title */}
            <title>{fullTitle}</title>

            {/* Canonical + description */}
            {description && <meta name="description" content={description} />}
            <link rel="canonical" href={url} />

            {/* Open Graph */}
            <meta property="og:type" content={type} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:url" content={url} />
            <meta property="og:image" content={img} />

            {/* Article-only tags */}
            {type === "article" && publishedTime && (
                <meta property="article:published_time" content={publishedTime} />
            )}
            {type === "article" && (modifiedTime || publishedTime) && (
                <meta property="article:modified_time" content={modifiedTime || publishedTime} />
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
                dangerouslySetInnerHTML={{ __html: JSON.stringify(combinedJsonLd, null, 2) }}
            />

            {/* Passthrough for page-specific extras (preload hints, additional JSON-LD, etc.) */}
            {children}
        </Head>
    );
}