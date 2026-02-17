import * as React from "react";
import Head from "next/head";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { MDXRemoteProps } from "next-mdx-remote/rsc";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import { getPageTitle, siteConfig } from "@/lib/imports";
import { safeCapitalize } from "@/lib/utils/safe";

// ----- Types ------------------------------------------------------

type CoverImage = string | { src?: string } | null | undefined;

type Frontmatter = {
  slug: string;
  title: string;
  excerpt?: string;
  description?: string;
  date?: string;
  author?: string;
  category?: string;
  tags?: string[];
  readTime?: string;
  coverImage?: CoverImage;
  url?: string;
  subtitle?: string;
  volumeNumber?: string;
  featured?: boolean;
};

export type ContentPageProps = {
  frontmatter: Frontmatter;
  mdxSource: string;
  contentType?: string;
  children?: React.ReactNode;
};

// ----- Helpers -----------------------------------------------------

function coerceOgImage(coverImage: CoverImage): string {
  if (!coverImage) return "";
  if (typeof coverImage === "string") return coverImage;
  if (typeof coverImage === "object" && typeof coverImage.src === "string")
    return coverImage.src;
  return "";
}

function normalizeReadTime(input?: string): string | null {
  if (!input) return null;
  const s = String(input).trim();
  if (!s) return null;
  if (/min/i.test(s)) return s;
  const n = Number(s);
  if (Number.isFinite(n) && n > 0) return `${Math.round(n)} min read`;
  return s;
}

// ----- Component ---------------------------------------------------

export default function ContentLayout({
  frontmatter,
  mdxSource,
  contentType = "content",
  children,
}: ContentPageProps) {
  // Base values
  const title = frontmatter.title || `${safeCapitalize(contentType)}`;
  const pageTitle = getPageTitle ? getPageTitle(title) : title;
  const description =
    frontmatter.excerpt || frontmatter.description || `Read about ${title}`;

  const url = frontmatter.url || `/${contentType}/${frontmatter.slug}`;
  const fullUrl = `${siteConfig.url}${url}`;

  const ogImage = coerceOgImage(frontmatter.coverImage);
  const readTime = normalizeReadTime(frontmatter.readTime);

  // Keywords as a comma‑separated string
  const keywords = Array.isArray(frontmatter.tags)
    ? frontmatter.tags.join(", ")
    : "";

  return (
    <>
      {/* Head metadata – handled here, not passed to Layout */}
      <Head>
        {/* Standard meta */}
        <title>{pageTitle}</title>
        <meta name="description" content={description} />
        {keywords && <meta name="keywords" content={keywords} />}

        {/* Open Graph / Social */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={fullUrl} />
        <meta property="og:type" content="article" />
        {ogImage && <meta property="og:image" content={ogImage} />}

        {/* Article specific */}
        {frontmatter.date && (
          <meta
            property="article:published_time"
            content={new Date(frontmatter.date).toISOString()}
          />
        )}
        {frontmatter.author && (
          <meta property="article:author" content={frontmatter.author} />
        )}
        {frontmatter.tags?.map((tag) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}

        {/* Canonical */}
        <link rel="canonical" href={fullUrl} />
      </Head>

      {/* Layout only receives structural props (className, children) */}
      <Layout className={`bg-charcoal content-${contentType}`}>
        {/* Render MDX content or passed children */}
        {children ? (
          children
        ) : (
          <MDXRemote 
            source={mdxSource} 
            components={mdxComponents as MDXRemoteProps['components']} 
          />
        )}

        {/* Optional read time display */}
        {readTime && (
          <p className="text-sm text-gray-400 mt-4">
            <span role="img" aria-label="clock">
              ⏱️
            </span>{" "}
            {readTime}
          </p>
        )}
      </Layout>
    </>
  );
}