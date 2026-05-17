/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer";
import { normalizeRequiredTier, requiredTierFromDoc } from "@/lib/access/tier-policy";
import { getRenderableBody } from "@/lib/content/render-body";

type PublicIntelligenceDoc = {
  title: string;
  subtitle: string | null;
  description: string | null;
  summary: string | null;
  date: string | null;
  category: string | null;
  bodyCode: string;
};

type Props = {
  doc: PublicIntelligenceDoc;
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

function publicIntelligenceBareSlug(input: unknown): string {
  const normalized = normalizePathish(input)
    .replace(/^content\//i, "")
    .replace(/^intelligence\//i, "");

  if (!normalized || normalized.includes("..")) return "";

  const parts = normalized.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

function isPublicIntelligenceSource(doc: any): boolean {
  const flattened = normalizePathish(doc?._raw?.flattenedPath).toLowerCase();
  const source = normalizePathish(doc?._raw?.sourceFilePath).toLowerCase();

  return (
    flattened.startsWith("intelligence/") ||
    source.startsWith("intelligence/") ||
    flattened.startsWith("content/intelligence/") ||
    source.startsWith("content/intelligence/")
  );
}

function isRenderablePublicIntelligence(doc: any): boolean {
  if (!doc || doc.draft === true || doc.published === false) return false;
  if (!isPublicIntelligenceSource(doc)) return false;

  const requiredTier = normalizeRequiredTier(requiredTierFromDoc(doc));
  return requiredTier === "public";
}

function publicIntelligenceSlugForDoc(doc: any): string {
  return (
    publicIntelligenceBareSlug(doc?.urlSlug) ||
    publicIntelligenceBareSlug(doc?.slugSafe) ||
    publicIntelligenceBareSlug(doc?.slugComputed) ||
    publicIntelligenceBareSlug(doc?.slug) ||
    publicIntelligenceBareSlug(doc?._raw?.flattenedPath) ||
    publicIntelligenceBareSlug(doc?._raw?.sourceFilePath) ||
    ""
  );
}

function toPublicIntelligenceDoc(doc: any): PublicIntelligenceDoc {
  const renderBody = getRenderableBody(doc);

  return {
    title: safeString(doc?.title) || "Untitled Intelligence",
    subtitle: safeString(doc?.subtitle) || null,
    description: safeString(doc?.description || doc?.excerpt) || null,
    summary: safeString(doc?.summary || doc?.excerpt || doc?.description) || null,
    date: safeString(doc?.date) || null,
    category: safeString(doc?.category) || null,
    bodyCode: safeString(renderBody.code),
  };
}

const PublicIntelligencePage: NextPage<Props> = ({ doc, bareSlug }) => {
  const canonicalUrl = `/intelligence/${bareSlug}`;
  const formattedDate = doc.date
    ? new Date(doc.date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <Layout
      title={`${doc.title} | Abraham of London`}
      description={doc.description || doc.summary || undefined}
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
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">
              <span className="rounded-full border border-[#C9A96E]/20 bg-[#C9A96E]/10 px-3 py-1 text-[#E6C98C]">
                Public intelligence
              </span>
              {doc.category ? <span>{doc.category}</span> : null}
              {formattedDate ? <span>{formattedDate}</span> : null}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
              <Link href="/library" className="transition hover:text-white">
                Library
              </Link>
              <Link href="/intelligence" className="transition hover:text-white">
                Intelligence
              </Link>
            </div>
          </div>

          <header className="mb-12">
            <p className="mb-5 font-mono text-[10px] uppercase tracking-[0.34em] text-[#C9A96E]/80">
              Decision intelligence
            </p>
            <h1 className="font-serif text-4xl leading-tight text-white md:text-6xl">{doc.title}</h1>
            {doc.subtitle ? <p className="mt-5 max-w-3xl text-lg leading-8 text-white/70">{doc.subtitle}</p> : null}
            {doc.summary ? (
              <p className="mt-6 max-w-3xl border-l border-[#C9A96E]/35 pl-5 text-base leading-8 text-white/58">
                {doc.summary}
              </p>
            ) : null}
          </header>

          <div className="prose prose-invert max-w-none">
            <SafeMDXRenderer code={doc.bodyCode} />
          </div>

          <footer className="mt-16 border-t border-white/10 pt-8 text-sm leading-7 text-white/50">
            <p>
              This is a public intelligence note from the Abraham of London estate. Return to the{" "}
              <Link href="/library" className="text-white/78 underline-offset-4 hover:underline">
                Library
              </Link>{" "}
              or continue through the{" "}
              <Link href="/intelligence" className="text-white/78 underline-offset-4 hover:underline">
                Intelligence index
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
  const { getAllIntelligence } = await import("@/lib/content/server");
  const docs = (getAllIntelligence() || []).filter(isRenderablePublicIntelligence);

  const paths = docs
    .map((doc: any) => publicIntelligenceSlugForDoc(doc))
    .filter(Boolean)
    .map((slug) => ({ params: { slug } }));

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const bareSlug = publicIntelligenceBareSlug(params?.slug);
  if (!bareSlug) return { notFound: true, revalidate: 60 };

  const { getAllIntelligence, sanitizeData } = await import("@/lib/content/server");
  const rawDoc =
    (getAllIntelligence() || []).find(
      (doc: any) =>
        isRenderablePublicIntelligence(doc) &&
        publicIntelligenceSlugForDoc(doc) === bareSlug,
    ) || null;

  if (!rawDoc) {
    return { notFound: true, revalidate: 60 };
  }

  return {
    props: sanitizeData({
      doc: toPublicIntelligenceDoc(rawDoc),
      bareSlug,
    }),
    revalidate: 1800,
  };
};

export default PublicIntelligencePage;
