// pages/[slug].tsx — STRICT TOP-LEVEL DOC HANDLER (WON'T HIJACK SECTIONS)
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { ArrowRight, Calendar, Clock, Tag } from "lucide-react";

import Layout from "@/components/Layout";
import {
  getPublishedDocuments,
  getDocBySlug,
  getDocKind,
  normalizeSlug,
  getDocHref,
  resolveDocCoverImage,
  getContentlayerData,
  isDraftContent,
} from "@/lib/contentlayer-compat";

import { prepareMDX, mdxComponents } from "@/lib/server/md-utils";
import { MDXRemote } from "next-mdx-remote";

type Doc = {
  key: string;
  kind: string;
  title: string;
  href: string;
  excerpt?: string | null;
  date?: string | null;
  image?: string | null;
  tags?: string[];
  author?: string | null;
  readTime?: string | null;
  category?: string | null;
};

interface Props {
  doc: Doc;
  source: any;
}

const RESERVED = new Set([
  "blog",
  "blogs",
  "canon",
  "canons",
  "books",
  "book",
  "shorts",
  "prints",
  "downloads",
  "resources",
  "events",
  "ventures",
  "strategy",
  "consulting",
  "contact",
  "inner-circle",
  "api",
  "_next",
  "assets",
]);

const isReservedSlug = (slug: string) => {
  const s = slug.toLowerCase();
  if (RESERVED.has(s)) return true;
  if (s.startsWith("_")) return true;
  if (s.includes(".")) return true;
  return false;
};

const GenericContentPage: NextPage<Props> = ({ doc, source }) => {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <Layout title="Loading…">
        <div className="mx-auto max-w-3xl px-6 py-16 text-gray-300">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-amber-400" />
          <p className="mt-6">Loading…</p>
        </div>
      </Layout>
    );
  }

  if (!doc) {
    return (
      <Layout title="404">
        <div className="mx-auto max-w-3xl px-6 py-16 text-gray-300">
          <h1 className="font-serif text-3xl text-amber-100">Page not found</h1>
          <p className="mt-3 text-gray-300">
            This route does not exist as a top-level document.
          </p>
        </div>
      </Layout>
    );
  }

  const formattedDate = doc.date
    ? new Date(doc.date).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const canonical = `https://www.abrahamoflondon.org${doc.href.startsWith("/") ? doc.href : `/${doc.href}`}`;

  return (
    <Layout title={doc.title} description={doc.excerpt ?? undefined}>
      <Head>
        <meta property="og:type" content="article" />
        <link rel="canonical" href={canonical} />
      </Head>

      <section className="bg-black">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-500/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
            {doc.kind}
          </div>

          <h1 className="font-serif text-4xl font-semibold leading-tight text-amber-100 sm:text-5xl">
            {doc.title}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-gray-300">
            {formattedDate ? (
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-300" />
                {formattedDate}
              </span>
            ) : null}

            {doc.readTime ? (
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-300" />
                {doc.readTime}
              </span>
            ) : null}
          </div>

          {doc.excerpt ? (
            <p className="mt-6 text-lg leading-relaxed text-gray-200">
              {doc.excerpt}
            </p>
          ) : null}

          {doc.image ? (
            <div className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={doc.image} alt={doc.title} className="w-full h-auto" />
            </div>
          ) : null}

          <article className="prose prose-invert mt-10 max-w-none">
            {source ? (
              <MDXRemote {...source} components={mdxComponents ?? {}} />
            ) : (
              <p className="text-gray-300">Content not available.</p>
            )}
          </article>

          {doc.tags && doc.tags.length > 0 ? (
            <div className="mt-10 border-t border-white/10 pt-8">
              <div className="mb-3 inline-flex items-center gap-2 text-sm text-gray-300">
                <Tag className="h-4 w-4 text-amber-300" />
                Tags
              </div>
              <div className="flex flex-wrap gap-2">
                {doc.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold tracking-[0.15em] text-gray-200"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <button
            onClick={() => router.push("/")}
            className="mt-12 inline-flex items-center gap-3 rounded-xl border border-amber-400/25 bg-white/5 px-5 py-3 text-sm font-semibold text-amber-100 hover:border-amber-400/45"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Return home
          </button>
        </div>
      </section>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    await getContentlayerData();
    const docs = getPublishedDocuments();

    const paths =
      (docs ?? [])
        .map((d: any) => {
          const slug = normalizeSlug(d);
          if (!slug) return null;
          if (isReservedSlug(slug)) return null;

          // STRICT: only top-level href ("/slug"), not nested
          const href = getDocHref(d);
          if (!href || href !== `/${slug}`) return null;

          return { params: { slug } };
        })
        .filter(Boolean) as { params: { slug: string } }[];

    return { paths, fallback: "blocking" };
  } catch (e) {
    console.error("getStaticPaths [slug] failed:", e);
    return { paths: [], fallback: "blocking" };
  }
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const rawSlug = params?.slug;
    if (!rawSlug || Array.isArray(rawSlug)) return { notFound: true };

    const slug = normalizeSlug(String(rawSlug));
    if (!slug || isReservedSlug(slug)) return { notFound: true };

    const rawDoc = await getDocBySlug(slug);
    if (!rawDoc) return { notFound: true };
    if (isDraftContent(rawDoc)) return { notFound: true };

    // STRICT: only allow "/slug" — never allow this page to serve nested content
    const href = getDocHref(rawDoc);
    if (!href || href !== `/${slug}`) return { notFound: true };

    const doc: Doc = {
      key: rawDoc._id || `doc:${slug}`,
      kind: String(getDocKind(rawDoc) ?? "document"),
      title: String(rawDoc?.title ?? "Untitled"),
      href: String(href),
      excerpt: (rawDoc?.excerpt ?? rawDoc?.description ?? null) as string | null,
      date: rawDoc?.date ? String(rawDoc.date) : null,
      image: (resolveDocCoverImage(rawDoc) ?? null) as string | null,
      tags: Array.isArray(rawDoc.tags) ? rawDoc.tags : [],
      author: rawDoc.author || null,
      readTime: rawDoc.readTime || null,
      category: rawDoc.category || null,
    };

    let source = null;
    const rawMdx = rawDoc.body?.raw || rawDoc.body || "";
    if (rawMdx && typeof rawMdx === "string") {
      source = await prepareMDX(rawMdx);
    }

    return { props: { doc, source }, revalidate: 3600 };
  } catch (e) {
    console.error("getStaticProps [slug] failed:", e);
    return { notFound: true };
  }
};

export default GenericContentPage;