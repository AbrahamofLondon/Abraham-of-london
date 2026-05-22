import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import {
  getBlogSeriesCatalogue,
  getBlogSeriesBySlug,
  formatBlogSeriesPartNumber,
  parseMins,
  formatTotalTime,
  type BlogSeries,
  type BlogSeriesPart,
} from "@/lib/blog/series";

type Props = {
  series: BlogSeries;
  totalMinutes: number;
};

function PartRow({
  part,
  seriesSlug,
  isFirst,
}: {
  part: BlogSeriesPart;
  seriesSlug: string;
  isFirst: boolean;
}) {
  const href = `/blog/series/${seriesSlug}/${part.slug}`;
  const isDraft = part.status !== "PUBLISHED";

  return (
    <Link
      href={isDraft ? "#" : href}
      aria-disabled={isDraft}
      className={`group flex items-start gap-5 border-b py-6 transition-colors duration-200 ${
        isDraft
          ? "pointer-events-none opacity-40"
          : "hover:bg-[color:var(--ds-background-muted)]"
      }`}
      style={{ borderBottomColor: "var(--ds-border)" }}
    >
      {/* Part number */}
      <div
        className="flex-shrink-0 w-8 pt-0.5 font-mono uppercase tracking-[0.22em]"
        style={{ fontSize: "7px", color: "var(--ds-text-subtle)" }}
      >
        {String(part.order).padStart(2, "0")}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 mb-2">
          <span
            className="font-mono uppercase tracking-[0.24em]"
            style={{ fontSize: "7px", color: "var(--ds-accent)" }}
          >
            Part {formatBlogSeriesPartNumber(part.order)}
          </span>
          {isFirst && !isDraft && (
            <span
              className="font-mono uppercase tracking-[0.2em] px-1.5 py-0.5 rounded-sm"
              style={{
                fontSize: "6.5px",
                color: "var(--ds-accent)",
                background: "rgba(201,150,58,0.12)",
                border: "1px solid rgba(201,150,58,0.22)",
              }}
            >
              Begin here
            </span>
          )}
          {isDraft && (
            <span
              className="font-mono uppercase tracking-[0.2em] px-1.5 py-0.5 rounded-sm"
              style={{
                fontSize: "6.5px",
                color: "var(--ds-text-subtle)",
                background: "var(--ds-background-muted)",
                border: "1px solid var(--ds-border)",
              }}
            >
              Coming soon
            </span>
          )}
        </div>

        <h2
          className="font-serif mb-2 transition-colors duration-200 group-hover:text-white"
          style={{
            fontWeight: 300,
            fontStyle: "italic",
            fontSize: "clamp(1rem, 1.4vw, 1.2rem)",
            lineHeight: 1.2,
            color: "var(--ds-text)",
          }}
        >
          {part.title}
        </h2>

        <p
          className="text-[13px] leading-[1.65rem]"
          style={{ color: "var(--ds-text-muted)", maxWidth: "62ch" }}
        >
          {part.excerpt}
        </p>
      </div>

      {/* Read time + arrow */}
      <div
        className="flex-shrink-0 pt-0.5 flex flex-col items-end gap-3"
        style={{ minWidth: "6rem" }}
      >
        <span
          className="font-mono uppercase tracking-[0.2em] whitespace-nowrap"
          style={{ fontSize: "7px", color: "var(--ds-text-subtle)" }}
        >
          {part.readTime}
        </span>
        {!isDraft && (
          <span
            className="font-mono uppercase tracking-[0.2em] transition-colors duration-200 group-hover:text-[#C9963A] whitespace-nowrap"
            style={{ fontSize: "7px", color: "var(--ds-text-subtle)" }}
          >
            Read →
          </span>
        )}
      </div>
    </Link>
  );
}

const BlogSeriesHub: NextPage<Props> = ({ series, totalMinutes }) => {
  const publishedCount = series.parts.filter((p) => p.status === "PUBLISHED").length;
  const isComplete = publishedCount === series.partCount;

  return (
    <Layout
      title={`${series.title} | Applied Essay Series | Abraham of London`}
      description={series.description}
      canonicalUrl={`/blog/series/${series.slug}`}
      fullWidth
      headerTransparent={false}
      className="ds-surface-essays"
    >
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <main style={{ backgroundColor: "var(--ds-background)", minHeight: "100vh" }}>

        {/* Series header */}
        <section
          style={{
            backgroundColor: "var(--ds-background-muted)",
            borderBottom: "1px solid var(--ds-border)",
          }}
        >
          <div className="mx-auto max-w-4xl px-6 pb-10 pt-20 lg:px-10 lg:pb-14 lg:pt-24">

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-7">
              <Link
                href="/blog"
                className="font-mono uppercase tracking-[0.3em] transition-colors duration-200 hover:text-white"
                style={{ fontSize: "7px", color: "var(--ds-text-subtle)" }}
              >
                Essays
              </Link>
              <span style={{ color: "var(--ds-border)", fontSize: "7px" }}>›</span>
              <span
                className="font-mono uppercase tracking-[0.3em]"
                style={{ fontSize: "7px", color: "var(--ds-accent)" }}
              >
                Applied Essay Series
              </span>
            </div>

            {/* Label */}
            <div className="flex items-center gap-3 mb-5">
              <span
                style={{
                  width: 1,
                  height: 16,
                  backgroundColor: "rgba(201,150,58,0.5)",
                  display: "inline-block",
                }}
              />
              <span
                className="font-mono uppercase tracking-[0.38em]"
                style={{ fontSize: "7.5px", color: "var(--ds-accent)" }}
              >
                Applied Essay Series
              </span>
            </div>

            {/* Title */}
            <h1
              className="font-serif italic mb-5"
              style={{
                fontWeight: 300,
                fontSize: "clamp(2rem, 4vw, 3.2rem)",
                lineHeight: 1.0,
                color: "var(--ds-text)",
                maxWidth: "22ch",
              }}
            >
              {series.title}
            </h1>

            <p
              className="text-sm leading-[1.75rem] mb-6"
              style={{ color: "var(--ds-text-muted)", maxWidth: "58ch" }}
            >
              {series.description}
            </p>

            {/* Meta strip */}
            <div className="flex flex-wrap items-center gap-5">
              <span
                className="font-mono uppercase tracking-[0.24em]"
                style={{ fontSize: "7px", color: "var(--ds-text-subtle)" }}
              >
                {series.partCount}-Part Series
              </span>
              <span style={{ width: 1, height: 10, backgroundColor: "var(--ds-border)", display: "inline-block" }} />
              <span
                className="font-mono uppercase tracking-[0.24em]"
                style={{ fontSize: "7px", color: "var(--ds-text-subtle)" }}
              >
                {isComplete ? "Complete" : `${publishedCount} of ${series.partCount} published`}
              </span>
              <span style={{ width: 1, height: 10, backgroundColor: "var(--ds-border)", display: "inline-block" }} />
              <span
                className="font-mono uppercase tracking-[0.24em]"
                style={{ fontSize: "7px", color: "var(--ds-text-subtle)" }}
              >
                {formatTotalTime(totalMinutes)} total
              </span>
              <span style={{ width: 1, height: 10, backgroundColor: "var(--ds-border)", display: "inline-block" }} />
              <span
                className="font-mono uppercase tracking-[0.24em]"
                style={{ fontSize: "7px", color: "var(--ds-text-subtle)" }}
              >
                Abraham of London
              </span>
            </div>
          </div>
        </section>

        {/* Parts list */}
        <section className="py-8 lg:py-10">
          <div className="mx-auto max-w-4xl px-6 lg:px-10">
            <div style={{ borderTop: "1px solid var(--ds-border)" }}>
              {series.parts
                .sort((a, b) => a.order - b.order)
                .map((part) => (
                  <PartRow
                    key={part.slug}
                    part={part}
                    seriesSlug={series.slug}
                    isFirst={part.order === 1}
                  />
                ))}
            </div>
          </div>
        </section>

      </main>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const catalogue = getBlogSeriesCatalogue();
  return {
    paths: catalogue.map((s) => ({ params: { seriesSlug: s.slug } })),
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.seriesSlug ?? "");
  const series = getBlogSeriesBySlug(slug);

  if (!series) return { notFound: true };

  const totalMinutes = series.parts
    .filter((p) => p.status === "PUBLISHED")
    .reduce((sum, p) => sum + parseMins(p.readTime), 0);

  return {
    props: { series, totalMinutes },
    revalidate: 1800,
  };
};

export default BlogSeriesHub;
