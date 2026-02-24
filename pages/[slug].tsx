/* eslint-disable @next/next/no-img-element */
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";

// ✅ REMOVED: next-mdx-remote imports (the source of your bundle bloat/errors)
// ✅ ADDED: Your resilient Contentlayer2 renderer
import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer";
import Layout from "@/components/Layout";

import {
  getAllCombinedDocs,
  getDocBySlug,
  normalizeSlug,
  isDraftContent,
  isPublished,
} from "@/lib/content/server";
import { getDocKind, sanitizeData } from "@/lib/content/shared";

// -----------------------------
// Routing Guardrails (Institutional Standard)
// -----------------------------
function norm(input: string): string {
  return String(input || "").trim().replace(/^\/+/, "").replace(/\/+$/, "");
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
  return !(!s || s.includes("/") || RESERVED_ROOT.has(s));
}

interface Props {
  doc: {
    title: string;
    kind: string;
    date: string | null;
    excerpt: string;
    readTime: string | null;
    bodyCode: string; // ✅ The pre-compiled code from Contentlayer
  } | null;
  canonicalUrl: string;
}

const GenericContentPage: NextPage<Props> = ({ doc, canonicalUrl }) => {
  if (!doc) {
    return (
      <Layout title="404 | Abraham of London" description="Content not found" canonicalUrl={canonicalUrl}>
        <div className="min-h-screen flex items-center justify-center bg-black">
          <div className="text-center animate-aolFadeUp">
            <h1 className="aol-editorial text-4xl mb-4">404</h1>
            <p className="aol-micro text-white/30 uppercase tracking-widest">Asset Not Found</p>
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
      <article className="relative min-h-screen bg-black pt-24 pb-32">
        <header className="mx-auto max-w-3xl px-6 text-center mb-16 animate-aolFadeUp">
          <div className="mb-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-amber-500/60 border border-amber-500/20 px-4 py-1.5 rounded-full">
            {doc.kind} // Protocol v2.6
          </div>

          <h1 className="aol-editorial text-5xl md:text-7xl text-white tracking-tight mb-8">
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
            {/* ✅ Using the SafeMDXRenderer with pre-compiled code */}
            <SafeMDXRenderer code={doc.bodyCode} />
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

  // ✅ Optimized: Sanitizing only what is necessary for the client
  const doc = sanitizeData({
    title: rawDoc.title || "Untitled",
    kind: getDocKind(rawDoc) || "Content",
    date: rawDoc.date ? new Date(rawDoc.date).toLocaleDateString("en-GB") : null,
    excerpt: rawDoc.excerpt || rawDoc.description || "",
    readTime: rawDoc.readTime ?? null,
    bodyCode: rawDoc.body.code, // ✅ Passing compiled code directly
  });

  return {
    props: {
      doc,
      canonicalUrl,
    },
    revalidate: 3600,
  };
};

export default GenericContentPage;