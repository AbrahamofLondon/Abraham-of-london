import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer";
import {
  getBlogSeriesCatalogue,
  getBlogSeriesBySlug,
  getBlogSeriesPart,
  getBlogSeriesPartNeighbors,
  formatBlogSeriesPartNumber,
  type BlogSeries,
  type BlogSeriesPart,
} from "@/lib/blog/series";
import { getRenderableBody } from "@/lib/content/render-body";

type Props = {
  series: BlogSeries;
  part: BlogSeriesPart;
  bodyCode: string;
  author: string;
  description: string;
  previous: BlogSeriesPart | null;
  next: BlogSeriesPart | null;
};

// ─── MDX Components ──────────────────────────────────────────────────────────

function EssayParagraph({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p {...props} className={`burden-paragraph ${className || ""}`.trim()}>
      {children}
    </p>
  );
}

function EssayCallout({
  type,
  title,
  children,
}: {
  type?: string;
  title?: string;
  children: React.ReactNode;
}) {
  void type;
  return (
    <aside className="burden-callout">
      {title ? <p className="burden-callout-title">{title}</p> : null}
      <div>{children}</div>
    </aside>
  );
}

function EssayPullQuote({ children }: { children: React.ReactNode }) {
  return <blockquote className="burden-pull-quote">{children}</blockquote>;
}

function EssaySectionBreak() {
  return <div className="burden-section-break" aria-hidden="true" />;
}

const blogSeriesComponents = {
  h1: () => null,
  h2: ({
    children,
    className,
    ...props
  }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 {...props} className={`burden-heading ${className || ""}`.trim()}>
      {children}
    </h2>
  ),
  h3: ({
    children,
    className,
    ...props
  }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 {...props} className={`burden-subheading ${className || ""}`.trim()}>
      {children}
    </h3>
  ),
  p: EssayParagraph,
  hr: (props: React.HTMLAttributes<HTMLHRElement>) => (
    <hr {...props} className={`burden-rule ${props.className || ""}`.trim()} />
  ),
  em: ({
    children,
    className,
    ...props
  }: React.HTMLAttributes<HTMLElement>) => (
    <em {...props} className={`burden-emphasis ${className || ""}`.trim()}>
      {children}
    </em>
  ),
  a: ({
    children,
    className,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props} className={`burden-link ${className || ""}`.trim()}>
      {children}
    </a>
  ),
  Callout: EssayCallout,
  PullQuote: EssayPullQuote,
  SectionBreak: EssaySectionBreak,
};

// ─── Page ────────────────────────────────────────────────────────────────────

const BlogSeriesPartReader: NextPage<Props> = ({
  series,
  part,
  bodyCode,
  author,
  description,
  previous,
  next,
}) => {
  const hubHref = `/blog/series/${series.slug}`;

  return (
    <Layout
      title={`${part.title} | ${series.title} | Abraham of London`}
      description={description}
      canonicalUrl={`${hubHref}/${part.slug}`}
      fullWidth
      headerTransparent={false}
      className="ds-surface-essays"
    >
      <Head>
        <meta name="robots" content="index,follow" />
        <meta name="color-scheme" content="dark" />
      </Head>

      <main className="burden-reader px-6 pb-16 pt-8 sm:pt-10 lg:px-10 lg:pb-28 lg:pt-14">
        <article className="burden-reader-article mx-auto max-w-[66ch]">

          {/* Series band */}
          <Link href={hubHref} className="burden-series-band">
            {series.title} · Part {part.order} of {series.partCount}
          </Link>

          {/* Header */}
          <header className="burden-reader-header">
            <h1>{part.title}</h1>
            <p>{author}</p>
          </header>

          {/* Body */}
          <div className="burden-reader-body">
            <SafeMDXRenderer code={bodyCode} components={blogSeriesComponents} />
          </div>

          {/* Navigation */}
          <nav
            className="burden-reader-nav"
            aria-label={`${series.title} part navigation`}
          >
            <div>
              {previous ? (
                <Link href={`${hubHref}/${previous.slug}`}>
                  <span>← Part {formatBlogSeriesPartNumber(previous.order)}</span>
                  {previous.title}
                </Link>
              ) : null}
            </div>
            <div>
              {next ? (
                <Link href={`${hubHref}/${next.slug}`}>
                  <span>Part {formatBlogSeriesPartNumber(next.order)} →</span>
                  {next.title}
                </Link>
              ) : null}
            </div>
          </nav>
        </article>
      </main>

      <style>{`
        /* ── Base ─────────────────────────────────────────────────────── */
        .burden-reader {
          --burden-bg: #141414;
          --burden-surface: #1a1a1a;
          --burden-text: rgba(255, 255, 255, 0.92);
          --burden-lead: rgba(255, 255, 255, 0.86);
          --burden-soft: rgba(255, 255, 255, 0.78);
          --burden-muted: rgba(255, 255, 255, 0.44);
          --burden-rule: rgba(255, 255, 255, 0.11);
          --burden-accent: #c9963a;
          --burden-accent-soft: rgba(201, 150, 58, 0.18);
          animation: burden-fade 150ms ease-out;
          background: var(--burden-bg);
          color: var(--burden-text);
          color-scheme: dark;
          min-height: 100vh;
          min-height: 100svh;
          overflow-x: hidden;
        }

        @keyframes burden-fade {
          from { opacity: 0.96; }
          to   { opacity: 1; }
        }

        .burden-reader-article {
          color: var(--burden-soft);
        }

        /* ── Series band ──────────────────────────────────────────────── */
        .burden-series-band {
          display: inline-block;
          color: var(--burden-muted);
          font-family: "JetBrains Mono", ui-monospace, monospace;
          font-size: 7.5px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          transition: color 150ms ease;
        }

        .burden-series-band:hover,
        .burden-series-band:focus-visible {
          color: var(--burden-accent);
        }

        /* ── Header ───────────────────────────────────────────────────── */
        .burden-reader-header {
          margin-top: 2.75rem;
          margin-bottom: 3.25rem;
        }

        .burden-reader-header h1 {
          color: var(--burden-text);
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(1.9rem, 4vw, 2.85rem);
          font-weight: 400;
          line-height: 1.1;
          letter-spacing: -0.01em;
        }

        .burden-reader-header p {
          margin-top: 1rem;
          color: var(--burden-muted);
          font-family: "JetBrains Mono", ui-monospace, monospace;
          font-size: 7.5px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
        }

        /* ── Body ─────────────────────────────────────────────────────── */
        .burden-reader-body {
          color: var(--burden-soft);
          font-family: Georgia, "Times New Roman", serif;
          font-size: 19px;
          line-height: 1.78;
        }

        .burden-reader-body .aol-mdx-content {
          color: var(--burden-soft);
          font-size: inherit;
          line-height: inherit;
        }

        /* ── Paragraphs ───────────────────────────────────────────────── */
        .burden-paragraph,
        .burden-reader-body .aol-mdx-content p {
          margin-bottom: 1.65rem;
          color: var(--burden-soft);
          font-family: Georgia, "Times New Roman", serif;
          font-size: inherit;
          font-weight: 400;
          line-height: inherit;
        }

        .burden-reader-body > p:first-of-type,
        .burden-reader-body .aol-mdx-content > p:first-of-type {
          color: var(--burden-lead) !important;
          font-size: 20px;
        }

        .burden-reader-body > p:last-of-type,
        .burden-reader-body .aol-mdx-content > p:last-of-type {
          margin-top: 2.75rem;
          margin-bottom: 0;
        }

        /* ── Headings ─────────────────────────────────────────────────── */
        .burden-heading,
        .burden-subheading,
        .burden-reader-body .aol-mdx-content h2,
        .burden-reader-body .aol-mdx-content h3 {
          color: var(--burden-text);
          font-family: Georgia, "Times New Roman", serif;
          font-style: normal;
          font-weight: 600;
          letter-spacing: -0.01em;
          line-height: 1.25;
          border: 0;
          text-transform: none;
        }

        .burden-heading,
        .burden-reader-body .aol-mdx-content h2 {
          margin: 3.2rem 0 1.25rem;
          font-size: clamp(1.25rem, 2vw, 1.6rem);
        }

        .burden-subheading,
        .burden-reader-body .aol-mdx-content h3 {
          margin: 2.6rem 0 1rem;
          font-size: clamp(1.1rem, 1.6vw, 1.35rem);
        }

        /* ── Inline ───────────────────────────────────────────────────── */
        .burden-emphasis {
          color: inherit;
          font-style: italic;
        }

        .burden-link {
          color: var(--burden-accent);
          text-decoration: underline;
          text-decoration-color: rgba(201, 150, 58, 0.35);
          text-underline-offset: 0.22em;
        }

        /* ── Rule ─────────────────────────────────────────────────────── */
        .burden-rule,
        .burden-reader-body .aol-mdx-content hr {
          margin: 3.25rem 0 2rem;
          border: 0;
          border-top: 1px solid var(--burden-rule);
        }

        /* ── Pull quote ───────────────────────────────────────────────── */
        .burden-pull-quote,
        .burden-reader-body .aol-mdx-content blockquote {
          margin: 2.75rem 0;
          border-left: 2px solid var(--burden-accent-soft);
          padding: 0.25rem 0 0.25rem 1.5rem;
          color: var(--burden-lead);
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(1.05rem, 1.8vw, 1.25rem);
          font-style: italic;
          font-weight: 400;
          line-height: 1.6;
        }

        /* ── Callout ──────────────────────────────────────────────────── */
        .burden-callout {
          margin: 2.25rem 0;
          background: var(--burden-surface);
          border: 1px solid var(--burden-rule);
          border-left: 2px solid rgba(201, 150, 58, 0.35);
          padding: 1.25rem 1.4rem;
          color: var(--burden-soft);
          font-family: Georgia, "Times New Roman", serif;
          font-size: 0.96rem;
          line-height: 1.75;
          border-radius: 2px;
        }

        .burden-callout-title {
          margin-bottom: 0.65rem;
          color: var(--burden-accent);
          font-family: "JetBrains Mono", ui-monospace, monospace;
          font-size: 7.5px;
          font-style: normal;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }

        /* ── Section break ────────────────────────────────────────────── */
        .burden-section-break {
          margin: 3.25rem 0;
          height: 1px;
          width: 100%;
          background: linear-gradient(90deg, transparent, var(--burden-rule), transparent);
        }

        /* ── Navigation ───────────────────────────────────────────────── */
        .burden-reader-nav {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-top: 4rem;
          border-top: 1px solid var(--burden-rule);
          padding-top: 2rem;
        }

        .burden-reader-nav > div:last-child {
          text-align: right;
        }

        .burden-reader-nav a {
          color: var(--burden-muted);
          font-family: Georgia, "Times New Roman", serif;
          font-size: 0.96rem;
          line-height: 1.6;
          transition: color 150ms ease;
        }

        .burden-reader-nav a:hover,
        .burden-reader-nav a:focus-visible {
          color: var(--burden-accent);
        }

        .burden-reader-nav span {
          display: block;
          margin-bottom: 0.45rem;
          font-family: "JetBrains Mono", ui-monospace, monospace;
          font-size: 7px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }

        /* ── Responsive ───────────────────────────────────────────────── */
        @media (max-width: 640px) {
          .burden-reader {
            padding-left: 12px;
            padding-right: 12px;
          }

          .burden-reader-header {
            margin-top: 2rem;
            margin-bottom: 2.25rem;
          }

          .burden-reader-header h1 {
            font-size: clamp(1.7rem, 8vw, 2.2rem);
            line-height: 1.12;
          }

          .burden-reader-body {
            font-size: 18px;
            line-height: 1.72;
          }

          .burden-reader-nav {
            grid-template-columns: 1fr;
            gap: 1.25rem;
          }

          .burden-reader-nav > div:last-child {
            text-align: left;
          }
        }
      `}</style>
    </Layout>
  );
};

// ─── Static generation ────────────────────────────────────────────────────────

export const getStaticPaths: GetStaticPaths = async () => {
  const catalogue = getBlogSeriesCatalogue();

  const paths = catalogue.flatMap((series) =>
    series.parts
      .filter((p) => p.status === "PUBLISHED")
      .map((part) => ({
        params: { seriesSlug: series.slug, partSlug: part.slug },
      })),
  );

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const seriesSlug = String(params?.seriesSlug ?? "");
  const partSlug = String(params?.partSlug ?? "");

  const series = getBlogSeriesBySlug(seriesSlug);
  if (!series) return { notFound: true };

  const part = getBlogSeriesPart(series, partSlug);
  if (!part) return { notFound: true };

  // Load the MDX document via contentlayer posts
  const { getPublishedPosts } = await import("@/lib/content/server");
  const posts = getPublishedPosts();

  const doc = posts.find((p: any) => {
    const slug = String(p?.slug || p?.slugSafe || "").toLowerCase().trim();
    return slug === partSlug.toLowerCase();
  });

  if (!doc) return { notFound: true };

  const body = getRenderableBody(doc);
  if (!body?.code) return { notFound: true };

  const { previous, next } = getBlogSeriesPartNeighbors(series, part.order);

  return {
    props: {
      series,
      part,
      bodyCode: body.code,
      author: String((doc as any)?.author || "Abraham of London"),
      description: String(
        (doc as any)?.description || (doc as any)?.excerpt || part.excerpt,
      ),
      previous,
      next,
    },
    revalidate: 1800,
  };
};

export default BlogSeriesPartReader;
