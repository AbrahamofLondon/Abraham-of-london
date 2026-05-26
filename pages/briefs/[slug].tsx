/* eslint-disable @typescript-eslint/no-explicit-any */
/* pages/briefs/[slug].tsx — PUBLIC BRIEF ROUTE */

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import { StaticMDXRenderer, renderDocBodyToStaticHtml } from "@/lib/mdx/static-mdx-runtime";
import {
  normalizeRequiredTier,
  requiredTierFromDoc,
} from "@/lib/access/tier-policy";

type PublicBrief = {
  title: string;
  subtitle: string | null;
  description: string | null;
  summary: string | null;
  date: string | null;
  readTime: string | null;
  category: string | null;
  tags: string[];
  staticHtml: string;
};

type Props = {
  brief: PublicBrief;
  bareSlug: string;
};

function safeString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}

function normalizePathish(input: unknown): string {
  return safeString(input)
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/")
    .replace(/\.(md|mdx)$/i, "");
}

function publicBriefBareSlug(input: unknown): string {
  const normalized = normalizePathish(input)
    .replace(/^content\//i, "")
    .replace(/^briefs\//i, "");

  if (!normalized || normalized.includes("..")) return "";

  const parts = normalized.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

function isPublicBriefSource(doc: any): boolean {
  const flattened = normalizePathish(doc?._raw?.flattenedPath).toLowerCase();
  const source    = normalizePathish(doc?._raw?.sourceFilePath).toLowerCase();

  return (
    flattened.startsWith("briefs/") ||
    source.startsWith("briefs/") ||
    flattened.startsWith("content/briefs/") ||
    source.startsWith("content/briefs/")
  );
}

function isRenderablePublicBrief(doc: any): boolean {
  if (!doc || doc.draft === true || doc.published === false) return false;
  if (!isPublicBriefSource(doc)) return false;
  if (safeString(doc?.status).trim().toLowerCase() !== "canonical") return false;

  const requiredTier = normalizeRequiredTier(requiredTierFromDoc(doc));
  return requiredTier === "public";
}

function publicBriefSlugForDoc(doc: any): string {
  return (
    publicBriefBareSlug(doc?.urlSlug) ||
    publicBriefBareSlug(doc?.slugSafe) ||
    publicBriefBareSlug(doc?.slugComputed) ||
    publicBriefBareSlug(doc?.slug) ||
    publicBriefBareSlug(doc?._raw?.flattenedPath) ||
    publicBriefBareSlug(doc?._raw?.sourceFilePath) ||
    ""
  );
}

function toPublicBrief(doc: any): PublicBrief {
  const { html: staticHtml } = renderDocBodyToStaticHtml(doc);

  return {
    title:       safeString(doc?.title) || "Untitled Brief",
    subtitle:    safeString(doc?.subtitle) || null,
    description: safeString(doc?.description || doc?.excerpt) || null,
    summary:     safeString(doc?.summary || doc?.excerpt || doc?.description) || null,
    date:        safeString(doc?.date) || null,
    readTime:    safeString(doc?.readTime || doc?.readingTime) || null,
    category:    safeString(doc?.category) || null,
    tags:        Array.isArray(doc?.tags)
      ? doc.tags.map((tag: unknown) => safeString(tag)).filter(Boolean)
      : [],
    staticHtml,
  };
}

const GOLD = "#C9A96E";

const PublicBriefPage: NextPage<Props> = ({ brief, bareSlug }) => {
  const canonicalUrl  = `/briefs/${bareSlug}`;
  const formattedDate = brief.date
    ? new Date(brief.date).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : null;

  return (
    <Layout
      title={`${brief.title} | Abraham of London`}
      description={brief.description || brief.summary || undefined}
      canonicalUrl={canonicalUrl}
      fullWidth
      headerTransparent={false}
    >
      <Head>
        <link rel="canonical" href={canonicalUrl} />
        <meta name="robots" content="index,follow" />
      </Head>

      <main className="min-h-screen bg-black px-6 pb-24 pt-24 text-white">
        <article className="mx-auto max-w-4xl">

          {/* Meta bar */}
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-emerald-200">
                Public brief
              </span>
              {brief.category  ? <span>{brief.category}</span>  : null}
              {formattedDate   ? <span>{formattedDate}</span>   : null}
              {brief.readTime  ? <span>{brief.readTime}</span>  : null}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
              <Link href="/briefs"               className="transition hover:text-white">Briefs</Link>
              <Link href="/library"              className="transition hover:text-white">Library</Link>
              <Link href="/intelligence/market"  className="transition hover:text-white">Intelligence</Link>
            </div>
          </div>

          {/* Title block */}
          <header className="mb-12">
            <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.34em]" style={{ color: `${GOLD}CC` }}>
              Public briefing
            </p>
            <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">
              {brief.title}
            </h1>
            {brief.subtitle ? (
              <p className="mt-5 max-w-3xl text-lg leading-8 text-white/70">{brief.subtitle}</p>
            ) : null}
            {brief.summary ? (
              <p
                className="mt-6 max-w-3xl border-l pl-5 text-base leading-8 text-white/58"
                style={{ borderColor: `${GOLD}35` }}
              >
                {brief.summary}
              </p>
            ) : null}
          </header>

          {/* Tags */}
          {brief.tags.length > 0 ? (
            <div className="mb-10 flex flex-wrap gap-2">
              {brief.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          {/* Body */}
          <div className="prose prose-invert max-w-none">
            <StaticMDXRenderer html={brief.staticHtml} />
          </div>

          {/* Footer */}
          <footer className="mt-16 border-t border-white/10 pt-8 text-sm leading-7 text-white/50">
            <p>
              This is a public briefing from the Abraham of London intelligence estate. For
              the wider public catalogue, return to{" "}
              <Link href="/briefs" className="text-white/78 underline-offset-4 hover:underline">
                Briefs
              </Link>
              , consult the{" "}
              <Link href="/library" className="text-white/78 underline-offset-4 hover:underline">
                Library
              </Link>{" "}
              or continue through{" "}
              <Link href="/intelligence/market" className="text-white/78 underline-offset-4 hover:underline">
                Market Intelligence
              </Link>
              .
            </p>
          </footer>
        </article>
      </main>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const { getAllBriefs } = await import("@/lib/content/server");
  const docs = (getAllBriefs() || []).filter(isRenderablePublicBrief);

  const paths = docs
    .map((doc: any) => publicBriefSlugForDoc(doc))
    .filter(Boolean)
    .map((slug) => ({ params: { slug } }));

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const bareSlug = publicBriefBareSlug(params?.slug);
  if (!bareSlug) return { notFound: true, revalidate: 60 };

  const { getAllBriefs, sanitizeData } = await import("@/lib/content/server");
  const rawDoc =
    (getAllBriefs() || []).find(
      (doc: any) =>
        isRenderablePublicBrief(doc) && publicBriefSlugForDoc(doc) === bareSlug,
    ) || null;

  if (!rawDoc) return { notFound: true, revalidate: 60 };

  return {
    props: sanitizeData({ brief: toPublicBrief(rawDoc), bareSlug }),
    revalidate: 1800,
  };
};

export default PublicBriefPage;
