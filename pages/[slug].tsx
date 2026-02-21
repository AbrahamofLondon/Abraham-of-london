/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";

import { MDXRemote } from "next-mdx-remote";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";

import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import { createSeededSafeMdxComponents } from "@/lib/mdx/safe-components";

import {
  getAllCombinedDocs,
  getDocBySlug,
  normalizeSlug,
  isDraftContent,
  isPublished,
} from "@/lib/content/server";
import { getDocKind, sanitizeData } from "@/lib/content/shared";

// -----------------------------
// Routing Guardrails
// -----------------------------
function norm(input: string): string {
  return String(input || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

function isNested(slug: string): boolean {
  return slug.includes("/");
}

const RESERVED_ROOT = new Set<string>([
  "admin", "api", "auth", "blog", "board", "books", "brands", "canon",
  "canon-campaign", "chatham-rooms", "consulting", "content", "debug",
  "downloads", "events", "fatherhood", "founders", "inner-circle",
  "leadership", "prints", "private", "resources", "shorts", "speaking",
  "strategy", "vault", "ventures", "about", "contact", "privacy",
  "security", "terms", "subscribe", "newsletter", "cookies", "diagnostic",
  "accessibility", "accessibility-statement", "works-in-progress", "404",
]);

function allowRootSlug(slug: string): boolean {
  const s = norm(slug).toLowerCase();
  if (!s || isNested(s) || RESERVED_ROOT.has(s)) return false;
  return true;
}

interface Props {
  doc: {
    title: string;
    kind: string;
    date: string | null;
    excerpt: string;
    readTime: string | null;
  } | null;
  source: MDXRemoteSerializeResult | null;
  mdxRaw: string;
  canonicalUrl: string; // ✅ use this instead of "currentPath"
}

const GenericContentPage: NextPage<Props> = ({ doc, source, mdxRaw, canonicalUrl }) => {
  const safeComponents = React.useMemo(
    () =>
      createSeededSafeMdxComponents(mdxComponents, mdxRaw, {
        warnOnFallback: process.env.NODE_ENV === "development",
      }),
    [mdxRaw]
  );

  if (!doc) {
    return (
      <Layout title="404 | Abraham of London" description="Content not found" canonicalUrl={canonicalUrl}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-serif mb-4">404</h1>
            <p className="text-zinc-500">Content not found</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={`${doc.title} | Abraham of London`}
      description={doc.excerpt}
      canonicalUrl={canonicalUrl}
    >
      <Head>
        {/* Layout already sets <title> and meta description; Head here is optional.
            Keep only truly page-specific tags if you want. */}
      </Head>

      <article className="relative min-h-screen bg-black pt-24 pb-32">
        <header className="mx-auto max-w-3xl px-6 text-center mb-16">
          <div className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-amber-500/60 border border-amber-500/20 px-4 py-1.5 rounded-full">
            {doc.kind} // Protocol v2.6
          </div>

          <h1 className="font-serif text-5xl md:text-7xl text-white tracking-tight mb-8">
            {doc.title}
          </h1>

          <div className="flex justify-center items-center gap-6 font-mono text-[10px] uppercase text-white/30 tracking-widest border-y border-white/5 py-4">
            <span>{doc.date ?? "—"}</span>
            <span className="h-1 w-1 bg-white/20 rounded-full" />
            <span>{doc.readTime || "5 MIN READ"}</span>
          </div>
        </header>

        <div className="mx-auto max-w-2xl px-6">
          <div className="prose prose-invert max-w-none">
            {source ? <MDXRemote {...source} components={safeComponents as any} /> : null}
          </div>
        </div>
      </article>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const docs = getAllCombinedDocs().filter((d) => !isDraftContent(d) && isPublished(d));

  const seen = new Set<string>();
  const paths: Array<{ params: { slug: string } }> = [];

  for (const d of docs) {
    const raw = normalizeSlug(d.slug || d?._raw?.flattenedPath || "");
    const slug = norm(raw);
    const key = slug.toLowerCase();

    if (!slug || !allowRootSlug(slug) || seen.has(key)) continue;

    seen.add(key);
    paths.push({ params: { slug } });
  }

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = norm(String(params?.slug || ""));
  const canonicalUrl = `/${slug}`;

  if (!allowRootSlug(slug)) return { notFound: true, revalidate: 60 };

  const needle = norm(normalizeSlug(slug));
  const rawDoc = getDocBySlug(needle);

  if (!rawDoc || isDraftContent(rawDoc) || !isPublished(rawDoc)) {
    return { notFound: true, revalidate: 60 };
  }

  // MDX scope safety
  const featureGridItems = Array.isArray((rawDoc as any).featureGridItems)
    ? (rawDoc as any).featureGridItems
    : [];

  const mdxRaw = rawDoc.body?.raw || "";

  const source = await serialize(mdxRaw || " ", {
    scope: { featureGridItems },
    mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] },
  });

  const doc = sanitizeData({
    title: rawDoc.title || "Untitled",
    kind: getDocKind(rawDoc) || "Content",
    date: rawDoc.date ? new Date(rawDoc.date).toLocaleDateString("en-GB") : null,
    excerpt: rawDoc.excerpt || rawDoc.description || "",
    readTime: rawDoc.readTime ?? null,
  });

  return {
    props: sanitizeData({
      doc,
      source,
      mdxRaw,
      canonicalUrl,
    }),
    revalidate: 3600,
  };
};

export default GenericContentPage;