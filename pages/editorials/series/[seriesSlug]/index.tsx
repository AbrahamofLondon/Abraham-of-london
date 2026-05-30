import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import {
  formatEditorialSeriesPartNumber,
  getEditorialSeriesBySlug,
  getEditorialSeriesCatalogue,
  type EditorialSeries,
  type EditorialSeriesPart,
} from "@/lib/editorial/series";

type Props = {
  series: EditorialSeries;
  totalMinutes: number;
};

function parseMins(readTime: string): number {
  const m = readTime.match(/(\d+)/);
  return m ? parseInt(m[1] ?? "0", 10) : 0;
}

function formatTotalTime(minutes: number): string {
  if (minutes < 60) return `~${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `~${h} hr` : `~${h} hr ${m} min`;
}

function PartRow({
  part,
  seriesSlug,
  isFirst,
}: {
  part: EditorialSeriesPart;
  seriesSlug: string;
  isFirst: boolean;
}) {
  const partLabel = `Part ${formatEditorialSeriesPartNumber(part.order)}`;
  // Scheduled parts (publicationState === "SCHEDULED") have status === "DRAFT"
  // in the two-value enum. Use this to decide between active link and Coming Soon.
  const isScheduled = part.status !== "PUBLISHED";

  const inner = (
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-8">
      <div className="flex-1 min-w-0">
        {/* Part number + entry marker / Coming soon badge */}
        <div className="flex items-center gap-3 mb-2">
          <span
            className="font-mono uppercase tracking-[0.32em]"
            style={{
              fontSize: "7px",
              color: isFirst && !isScheduled ? "var(--ds-accent)" : "var(--ds-text-subtle)",
            }}
          >
            {partLabel}
          </span>
          {isFirst && !isScheduled && (
            <span
              className="font-mono uppercase tracking-[0.28em]"
              style={{
                fontSize: "6.5px",
                color: "var(--ds-accent)",
                border: "1px solid var(--ds-accent-soft)",
                padding: "1px 6px",
              }}
            >
              Begin here
            </span>
          )}
          {isScheduled && (
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

        {/* Title */}
        <h3
          className={`font-serif italic mb-2${!isScheduled ? " transition-colors duration-200 group-hover:text-white" : ""}`}
          style={{
            fontWeight: 300,
            fontSize: isFirst ? "1.35rem" : "1.15rem",
            lineHeight: 1.1,
            color: isScheduled ? "var(--ds-text-subtle)" : "var(--ds-text)",
          }}
        >
          {part.title}
        </h3>

        {/* Excerpt */}
        <p
          className="text-[13px] leading-[1.55rem]"
          style={{ color: "var(--ds-text-muted)", maxWidth: "60ch" }}
        >
          {part.excerpt}
        </p>
      </div>

      {/* Right meta */}
      <div className="flex items-center gap-6 md:flex-col md:items-end md:gap-2 md:pt-1 flex-shrink-0">
        <span
          className="font-mono uppercase tracking-[0.26em]"
          style={{ fontSize: "7px", color: "var(--ds-text-subtle)" }}
        >
          {part.readTime}
        </span>
        {!isScheduled && (
          <span
            className="font-mono uppercase tracking-[0.26em] transition-colors duration-200 group-hover:text-[#C9963A]"
            style={{ fontSize: "7px", color: "var(--ds-text-subtle)" }}
          >
            {isFirst ? "Begin reading →" : "Read →"}
          </span>
        )}
      </div>
    </div>
  );

  if (isScheduled) {
    // Scheduled parts: no active link, visually dimmed
    return (
      <div
        className="block border-b py-6"
        style={{
          borderBottomColor: "var(--ds-border)",
          backgroundColor: "transparent",
          opacity: 0.45,
          cursor: "default",
        }}
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={`/editorials/series/${seriesSlug}/${part.slug}`}
      className="group block border-b py-6 transition-colors duration-200"
      style={{
        borderBottomColor: "var(--ds-border)",
        backgroundColor: isFirst ? "rgba(201,150,58,0.03)" : "transparent",
      }}
    >
      {inner}
    </Link>
  );
}

const SeriesHubPage: NextPage<Props> = ({ series, totalMinutes }) => {
  // publishedParts: for CTA "Begin with Part One" and the "X of Y published" counter.
  // Must remain published-only — no active link to a scheduled part.
  const publishedParts = series.parts
    .filter((p) => p.status === "PUBLISHED")
    .sort((a, b) => a.order - b.order);

  // displayParts: published + scheduled, sorted. Scheduled parts render as Coming Soon.
  const displayParts = (series.previewParts ?? series.parts)
    .slice()
    .sort((a, b) => a.order - b.order);

  const firstPart = publishedParts[0];

  return (
    <Layout
      title={`${series.title} — Editorial Series | Abraham of London`}
      description={series.descriptor}
      canonicalUrl={`/editorials/series/${series.slug}`}
      fullWidth
      headerTransparent
      className="ds-surface-essays"
    >
      <Head>
        <title>{series.title} — Editorial Series | Abraham of London</title>
        <meta name="description" content={series.descriptor} />
        <meta name="robots" content="index,follow" />
      </Head>

      <main style={{ backgroundColor: "var(--ds-background)", minHeight: "100vh", color: "white" }}>

        {/* Series header */}
        <section style={{ backgroundColor: "var(--ds-background-muted)", borderBottom: "1px solid var(--ds-border)" }}>
          <div className="mx-auto max-w-4xl px-6 pb-10 pt-20 lg:px-10 lg:pb-12 lg:pt-24">

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-7">
              <Link
                href="/editorials"
                className="font-mono uppercase tracking-[0.3em] transition-colors duration-200"
                style={{ fontSize: "7px", color: "var(--ds-text-subtle)" }}
              >
                Editorials
              </Link>
              <span style={{ color: "var(--ds-border)", fontSize: "7px" }}>›</span>
              <span
                className="font-mono uppercase tracking-[0.3em]"
                style={{ fontSize: "7px", color: "var(--ds-accent)" }}
              >
                Editorial Series
              </span>
            </div>

            {/* Series label */}
            <div className="flex items-center gap-3 mb-6">
              <span style={{ width: 1, height: 16, backgroundColor: "var(--ds-accent)", display: "inline-block" }} />
              <span
                className="font-mono uppercase tracking-[0.36em]"
                style={{ fontSize: "7px", color: "var(--ds-accent)" }}
              >
                {series.partCount}-Part Editorial Series
                {series.status === "PUBLISHED" ? " · Complete" : publishedParts.length === 0 ? " · Scheduled" : " · In Progress"}
                {totalMinutes > 0 ? ` · ${formatTotalTime(totalMinutes)} total` : ""}
              </span>
            </div>

            {/* Title */}
            <h1
              className="font-serif italic mb-5"
              style={{
                fontWeight: 300,
                fontSize: "clamp(2rem, 3.5vw, 3rem)",
                lineHeight: 0.98,
                color: "var(--ds-text)",
              }}
            >
              {series.title}
            </h1>

            {/* Descriptor */}
            <p
              className="text-sm leading-[1.7rem] mb-8"
              style={{ color: "var(--ds-text-muted)", maxWidth: "56ch" }}
            >
              {series.descriptor}
            </p>

            {/* Primary CTA */}
            {firstPart ? (
              <Link
                href={`/editorials/series/${series.slug}/${firstPart.slug}`}
                className="inline-flex items-center border px-5 py-3 font-mono uppercase tracking-[0.28em] transition-colors duration-200"
                style={{
                  fontSize: "7.5px",
                  borderColor: "var(--ds-accent-soft)",
                  color: "var(--ds-accent)",
                  backgroundColor: "var(--ds-accent-soft)",
                }}
              >
                Begin with Part One
              </Link>
            ) : null}
          </div>
        </section>

        {/* Reading sequence */}
        <section className="py-10 lg:py-12">
          <div className="mx-auto max-w-4xl px-6 lg:px-10">

            <div className="mb-6 flex items-center justify-between">
              <span
                className="font-mono uppercase tracking-[0.34em]"
                style={{ fontSize: "7.5px", color: "var(--ds-text-subtle)" }}
              >
                Reading sequence
              </span>
              <span
                className="font-mono uppercase tracking-[0.28em]"
                style={{ fontSize: "7px", color: "var(--ds-text-subtle)" }}
              >
                {publishedParts.length} of {series.partCount} published
              </span>
            </div>

            <div style={{ borderTop: "1px solid var(--ds-border)" }}>
              {displayParts.map((part) => (
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

        {/* Footer nav */}
        <section className="border-t py-8" style={{ borderTopColor: "var(--ds-border)" }}>
          <div className="mx-auto max-w-4xl px-6 lg:px-10">
            <Link
              href="/editorials"
              className="font-mono uppercase tracking-[0.26em] transition-colors duration-200"
              style={{ fontSize: "7px", color: "var(--ds-text-subtle)" }}
            >
              ← All editorials
            </Link>
          </div>
        </section>

      </main>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const series = getEditorialSeriesCatalogue();
  return {
    paths: series.map((s) => ({
      params: { seriesSlug: s.slug },
    })),
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.seriesSlug ?? "");
  const series = getEditorialSeriesBySlug(slug);

  if (!series) {
    return { notFound: true };
  }

  const totalMinutes = series.parts
    .filter((p) => p.status === "PUBLISHED")
    .reduce((sum, p) => sum + parseMins(p.readTime), 0);

  return {
    props: { series, totalMinutes },
    // No revalidate — pages are built at deploy time and served as static HTML.
    // Runtime re-generation fails because .contentlayer data is not in the
    // serverless function bundle. New series require a new deploy.
  };
};

export default SeriesHubPage;
