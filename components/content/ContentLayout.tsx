// components/content/ContentLayout.tsx - FIXED
import * as React from "react";
import Head from "next/head";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import { getPageTitle, siteConfig } from "@/lib/imports";

type CoverImage = string | { src?: string } | null | undefined;

type Frontmatter = {
  slug: string;
  title: string;
  excerpt?: string;
  description?: string;
  date?: string; // ISO-ish or parseable
  author?: string;
  category?: string;
  tags?: string[];
  readTime?: string; // e.g. "6" or "6 min read" or "6 min"
  coverImage?: CoverImage;
  url?: string;
  subtitle?: string;
  volumeNumber?: string;
  featured?: boolean;
};

export type ContentLayoutProps = {
  frontmatter: Frontmatter;
  mdxSource: MDXRemoteSerializeResult;
  contentType?: string;
  children?: React.ReactNode;
};

function coerceOgImage(coverImage: CoverImage): string | undefined {
  if (!coverImage) return undefined;
  if (typeof coverImage === "string") return coverImage;
  if (typeof coverImage === "object" && typeof coverImage.src === "string") return coverImage.src;
  return undefined;
}

function normalizeReadTime(input?: string): string | null {
  if (!input) return null;
  const s = String(input).trim();
  if (!s) return null;

  // If user already wrote "min read" etc., keep it.
  if (/min/i.test(s)) return s;

  // If it's numeric, format as "X min read"
  const n = Number(s);
  if (Number.isFinite(n) && n > 0) return `${Math.round(n)} min read`;

  return s;
}

export default function ContentLayout({
  frontmatter,
  mdxSource,
  contentType = "content",
  children,
}: ContentLayoutProps): JSX.Element {
  const title =
    frontmatter.title ||
    `${contentType.charAt(0).toUpperCase()}${contentType.slice(1)}`;

  const pageTitle = getPageTitle(title);
  const description = frontmatter.excerpt || frontmatter.description || title;

  const url = frontmatter.url || `/${contentType}/${frontmatter.slug}`;
  const fullUrl = `${siteConfig.url}${url}`;

  const ogImage = coerceOgImage(frontmatter.coverImage);
  const readTime = normalizeReadTime(frontmatter.readTime);
  
  // FIX: Ensure keywords is always an array (not undefined)
  const keywords = frontmatter.tags || [];

  return (
    <Layout
      title={pageTitle}
      className={`bg-charcoal content-${contentType}`}
      description={description}
      keywords={keywords} // Now always an array
      canonicalUrl={fullUrl}
      ogImage={ogImage || ""} // Ensure ogImage is string, not undefined
      ogType="article"
    >
      <Head>
        {frontmatter.date ? (
          <meta
            property="article:published_time"
            content={new Date(frontmatter.date).toISOString()}
          />
        ) : null}

        {frontmatter.author ? (
          <meta property="article:author" content={frontmatter.author} />
        ) : null}

        {frontmatter.tags?.map((tag) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
      </Head>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:py-16 lg:py-20 text-cream">
        <article className="prose prose-invert prose-lg max-w-none">
          <header className="mb-10 border-b border-softGold/20 pb-8">
            <div className="mb-4">
              <span className="inline-block rounded-full bg-softGold/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-softGold">
                {contentType}
              </span>

              {frontmatter.volumeNumber ? (
                <span className="ml-2 inline-block rounded-full bg-charcoal-light px-3 py-1 text-xs font-medium text-cream/70">
                  Volume {frontmatter.volumeNumber}
                </span>
              ) : null}

              {frontmatter.featured ? (
                <span className="ml-2 inline-block rounded-full bg-softGold px-3 py-1 text-xs font-semibold text-charcoal">
                  Featured
                </span>
              ) : null}
            </div>

            <h1 className="mb-4 font-serif text-4xl font-semibold leading-tight text-cream md:text-5xl">
              {title}
            </h1>

            {frontmatter.subtitle ? (
              <p className="mb-6 text-xl italic text-cream/80">
                {frontmatter.subtitle}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-4 text-sm text-cream/70">
              {frontmatter.date ? (
                <time dateTime={frontmatter.date} className="flex items-center">
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {new Date(frontmatter.date).toLocaleDateString("en-GB", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              ) : null}

              {frontmatter.author ? (
                <span className="flex items-center">
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  {frontmatter.author}
                </span>
              ) : null}

              {readTime ? (
                <span className="flex items-center">
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {readTime}
                </span>
              ) : null}
            </div>

            {frontmatter.tags?.length ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {frontmatter.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-softGold/10 px-3 py-1 text-xs font-medium text-softGold transition-colors hover:bg-softGold/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </header>

          <div className="mt-8">
            <MDXRemote {...mdxSource} components={mdxComponents} />
            {children}
          </div>
        </article>
      </main>
    </Layout>
  );
}