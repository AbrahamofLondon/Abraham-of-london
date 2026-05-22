import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer";
import {
  formatEditorialSeriesPartNumber,
  getEditorialSeriesBySlug,
  getEditorialSeriesCatalogue,
  getEditorialSeriesPart,
  getEditorialSeriesPartNeighbors,
  type EditorialSeries,
  type EditorialSeriesPart,
} from "@/lib/editorial/series";
import { getEditorialSeriesPartDocument } from "@/lib/editorial/series-content";
import { getRenderableBody } from "@/lib/content/render-body";

type Props = {
  series: EditorialSeries;
  part: EditorialSeriesPart;
  bodyCode: string;
  author: string;
  description: string;
  previous: EditorialSeriesPart | null;
  next: EditorialSeriesPart | null;
};

function textFromNode(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textFromNode).join(" ");
  if (React.isValidElement(node)) {
    return textFromNode((node.props as { children?: React.ReactNode }).children);
  }
  return "";
}

function ReaderParagraph({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  const text = textFromNode(children).trim();

  if (text.startsWith("The Mind's Clay, Part")) {
    return null;
  }

  return (
    <p {...props} className={`mind-clay-paragraph ${className || ""}`.trim()}>
      {children}
    </p>
  );
}

function ReaderCallout({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <aside className="mind-clay-callout">
      {title ? <p className="mind-clay-callout-title">{title}</p> : null}
      <div>{children}</div>
    </aside>
  );
}

function ReaderPullQuote({ children }: { children: React.ReactNode }) {
  return <blockquote className="mind-clay-pull-quote">{children}</blockquote>;
}

function ReaderSectionBreak() {
  return <div className="mind-clay-section-break" aria-hidden="true" />;
}

const editorialSeriesComponents = {
  h1: () => null,
  h2: ({
    children,
    className,
    ...props
  }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 {...props} className={`mind-clay-heading ${className || ""}`.trim()}>
      {children}
    </h2>
  ),
  h3: ({
    children,
    className,
    ...props
  }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 {...props} className={`mind-clay-subheading ${className || ""}`.trim()}>
      {children}
    </h3>
  ),
  p: ReaderParagraph,
  hr: (props: React.HTMLAttributes<HTMLHRElement>) => (
    <hr {...props} className={`mind-clay-rule ${props.className || ""}`.trim()} />
  ),
  em: ({
    children,
    className,
    ...props
  }: React.HTMLAttributes<HTMLElement>) => (
    <em {...props} className={`mind-clay-emphasis ${className || ""}`.trim()}>
      {children}
    </em>
  ),
  a: ({
    children,
    className,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props} className={`mind-clay-link ${className || ""}`.trim()}>
      {children}
    </a>
  ),
  Callout: ReaderCallout,
  PullQuote: ReaderPullQuote,
  SectionBreak: ReaderSectionBreak,
};

const EditorialSeriesPartReader: NextPage<Props> = ({
  series,
  part,
  bodyCode,
  author,
  description,
  previous,
  next,
}) => {
  const hubHref = `/editorials/series/${series.slug}`;

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

      <main className="mind-clay-reader px-6 pb-16 pt-8 sm:pt-10 lg:px-10 lg:pb-28 lg:pt-14">
        <article className="mind-clay-reader-article mx-auto max-w-[66ch]">
          <Link href={hubHref} className="mind-clay-series-band">
            {series.title} · Part {part.order} of {series.partCount}
          </Link>

          <header className="mind-clay-reader-header">
            <h1>{part.title}</h1>
            <p>{author}</p>
          </header>

          <div className="mind-clay-reader-body">
            <SafeMDXRenderer code={bodyCode} components={editorialSeriesComponents} />
          </div>

          <nav className="mind-clay-reader-nav" aria-label={`${series.title} part navigation`}>
            <div>
              {previous ? (
                <Link href={`${hubHref}/${previous.slug}`}>
                  <span>← Part {formatEditorialSeriesPartNumber(previous.order)}</span>
                  {previous.title}
                </Link>
              ) : null}
            </div>
            <div>
              {next ? (
                <Link href={`${hubHref}/${next.slug}`}>
                  <span>Part {formatEditorialSeriesPartNumber(next.order)} →</span>
                  {next.title}
                </Link>
              ) : null}
            </div>
          </nav>
        </article>
      </main>

      <style>{`
        .mind-clay-reader {
          --mind-clay-bg: #1b1b1b;
          --mind-clay-text: rgba(255, 255, 255, 0.94);
          --mind-clay-lead: rgba(255, 255, 255, 0.88);
          --mind-clay-muted: rgba(255, 255, 255, 0.5);
          --mind-clay-rule: rgba(255, 255, 255, 0.14);
          --mind-clay-accent: #d0a14e;
          --mind-clay-soft: rgba(255, 255, 255, 0.82);
          --mdx-accent: var(--mind-clay-accent);
          --mdx-border: var(--mind-clay-rule);
          --mdx-heading: var(--mind-clay-text);
          --mdx-muted: var(--mind-clay-muted);
          --mdx-text: var(--mind-clay-soft);
          animation: mind-clay-fade 150ms ease-out;
          background: var(--mind-clay-bg);
          color: var(--mind-clay-text);
          color-scheme: dark;
          min-height: 100vh;
          min-height: 100svh;
          overflow-x: hidden;
        }

        .mind-clay-reader-article {
          color: var(--mind-clay-soft);
        }

        @keyframes mind-clay-fade {
          from {
            opacity: 0.96;
          }

          to {
            opacity: 1;
          }
        }

        .mind-clay-series-band {
          display: inline-block;
          color: var(--mind-clay-muted);
          font-family: "JetBrains Mono", ui-monospace, monospace;
          font-size: 8px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          transition: color 150ms ease;
        }

        .mind-clay-series-band:hover,
        .mind-clay-series-band:focus-visible {
          color: var(--mind-clay-accent);
        }

        .mind-clay-reader-header {
          margin-top: 3rem;
          margin-bottom: 3.5rem;
        }

        .mind-clay-reader-header h1 {
          color: var(--mind-clay-text);
          font-family: "Cormorant Garamond", Georgia, serif;
          font-size: clamp(2.7rem, 5vw, 4.45rem);
          font-weight: 300;
          line-height: 1;
          letter-spacing: 0;
        }

        .mind-clay-reader-header p {
          margin-top: 1.15rem;
          color: var(--mind-clay-muted);
          font-family: "JetBrains Mono", ui-monospace, monospace;
          font-size: 8px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
        }

        .mind-clay-reader-body {
          color: var(--mind-clay-soft);
          font-family: Georgia, "Times New Roman", serif;
          font-size: 20px;
          line-height: 1.75;
        }

        .mind-clay-reader-body > p:first-of-type,
        .mind-clay-reader-body .aol-mdx-content > p:first-of-type {
          color: var(--mind-clay-lead) !important;
          font-size: 21px;
        }

        .mind-clay-reader-body .aol-mdx-content {
          color: var(--mind-clay-soft);
          font-size: inherit;
          line-height: inherit;
        }

        .mind-clay-reader-body .aol-mdx-content p,
        .mind-clay-reader-body .aol-mdx-content li {
          margin-bottom: 1.7rem;
          color: var(--mind-clay-soft) !important;
          font-family: Georgia, "Times New Roman", serif;
          font-size: inherit;
          font-weight: 400;
          line-height: inherit;
        }

        .mind-clay-paragraph {
          margin-bottom: 1.7rem;
          color: var(--mind-clay-soft);
          font-family: Georgia, "Times New Roman", serif;
          font-size: inherit;
          font-weight: 400;
          line-height: inherit;
        }

        .mind-clay-paragraph:first-of-type {
          color: var(--mind-clay-lead);
        }

        .mind-clay-reader-body > p:last-of-type {
          margin-top: 3rem;
          margin-bottom: 0;
        }

        .mind-clay-reader-body .aol-mdx-content > p:last-of-type {
          margin-top: 3rem;
          margin-bottom: 0;
        }

        .mind-clay-heading,
        .mind-clay-subheading,
        .mind-clay-reader-body .aol-mdx-content h2,
        .mind-clay-reader-body .aol-mdx-content h3 {
          border: 0;
          color: var(--mind-clay-text);
          font-family: "Cormorant Garamond", Georgia, serif;
          font-style: normal;
          font-weight: 400;
          letter-spacing: 0;
          line-height: 1.2;
          text-transform: none;
        }

        .mind-clay-heading,
        .mind-clay-reader-body .aol-mdx-content h2 {
          margin: 3.4rem 0 1.35rem;
          font-size: clamp(1.7rem, 3vw, 2.15rem);
        }

        .mind-clay-subheading,
        .mind-clay-reader-body .aol-mdx-content h3 {
          margin: 2.8rem 0 1rem;
          font-size: clamp(1.45rem, 2.4vw, 1.8rem);
        }

        .mind-clay-emphasis {
          color: inherit;
          font-style: italic;
        }

        .mind-clay-link {
          color: var(--mind-clay-accent);
          text-decoration: underline;
          text-decoration-color: rgba(208, 161, 78, 0.38);
          text-underline-offset: 0.24em;
        }

        .mind-clay-rule,
        .mind-clay-reader-body .aol-mdx-content hr {
          margin: 3.5rem 0 2rem;
          border: 0;
          border-top: 1px solid var(--mind-clay-rule);
        }

        .mind-clay-reader-body .aol-mdx-content hr + p {
          color: var(--mind-clay-soft);
          font-style: italic;
        }

        .mind-clay-callout {
          margin: 0 0 3rem;
          border-left: 1px solid var(--mind-clay-rule);
          padding-left: 1.35rem;
          color: var(--mind-clay-soft);
          font-family: Georgia, "Times New Roman", serif;
          font-size: 1rem;
          line-height: 1.8;
        }

        .mind-clay-callout-title {
          margin-bottom: 0.75rem;
          color: var(--mind-clay-muted);
          font-family: "JetBrains Mono", ui-monospace, monospace;
          font-size: 7.5px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
        }

        .mind-clay-pull-quote,
        .mind-clay-reader-body .aol-mdx-content blockquote {
          margin: 3rem 0;
          border-left: 1px solid var(--mind-clay-rule);
          padding-left: 1.5rem;
          color: var(--mind-clay-text);
          font-family: "Cormorant Garamond", Georgia, serif;
          font-size: clamp(1.55rem, 2.8vw, 2rem);
          font-style: italic;
          font-weight: 300;
          line-height: 1.45;
        }

        .mind-clay-section-break {
          margin: 3.5rem 0;
          height: 1px;
          width: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            var(--mind-clay-rule),
            transparent
          );
        }

        .mind-clay-reader-nav {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-top: 4rem;
          border-top: 1px solid var(--mind-clay-rule);
          padding-top: 2rem;
        }

        .mind-clay-reader-nav > div:last-child {
          text-align: right;
        }

        .mind-clay-reader-nav a {
          color: var(--mind-clay-muted);
          font-family: Georgia, "Times New Roman", serif;
          font-size: 1rem;
          line-height: 1.6;
          transition: color 150ms ease;
        }

        .mind-clay-reader-nav a:hover,
        .mind-clay-reader-nav a:focus-visible {
          color: var(--mind-clay-accent);
        }

        .mind-clay-reader-nav span {
          display: block;
          margin-bottom: 0.5rem;
          font-family: "JetBrains Mono", ui-monospace, monospace;
          font-size: 7.5px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }

        @media (max-width: 640px) {
          .mind-clay-reader {
            padding-left: 12px;
            padding-right: 12px;
          }

          .mind-clay-reader-header {
            margin-top: 2rem;
            margin-bottom: 2.5rem;
          }

          .mind-clay-reader-header h1 {
            font-size: clamp(2.35rem, 11vw, 3.35rem);
            line-height: 1.02;
          }

          .mind-clay-reader-body {
            font-size: 19px;
            line-height: 1.68;
          }

          .mind-clay-reader-body > p:first-of-type {
            font-size: 20px;
          }

          .mind-clay-reader-nav {
            grid-template-columns: 1fr;
            gap: 1.25rem;
          }

          .mind-clay-reader-nav > div:last-child {
            text-align: left;
          }
        }
      `}</style>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: getEditorialSeriesCatalogue().flatMap((series) =>
    series.parts.map((part) => ({
      params: { seriesSlug: series.slug, partSlug: part.slug },
    })),
  ),
  fallback: false,
});

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const seriesSlug = String(params?.seriesSlug || "");
  const partSlug = String(params?.partSlug || "");
  const series = getEditorialSeriesBySlug(seriesSlug);

  if (!series) {
    return { notFound: true };
  }

  const part = getEditorialSeriesPart(series, partSlug);
  const doc = part ? getEditorialSeriesPartDocument(part.mdxSlug) : null;
  const body = doc ? getRenderableBody(doc) : null;

  if (!part || !doc || !body?.code) {
    return { notFound: true };
  }

  const { previous, next } = getEditorialSeriesPartNeighbors(series, part.order);

  return {
    props: {
      series,
      part,
      bodyCode: body.code,
      author: String(doc.author || "Abraham of London"),
      description: String(doc.description || doc.excerpt || part.excerpt),
      previous,
      next,
    },
    revalidate: 1800,
  };
};

export default EditorialSeriesPartReader;
