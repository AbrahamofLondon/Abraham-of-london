// pages/[slug].tsx — STRICT TOP-LEVEL DOC HANDLER (WON'T HIJACK SECTIONS)
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowRight, Calendar, Clock, Tag, User } from "lucide-react";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import { MDXRemote } from "next-mdx-remote";

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

/* -----------------------------------------------------------------------------
  TYPES
----------------------------------------------------------------------------- */
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
  source: MDXRemoteSerializeResult | null;
}

/* -----------------------------------------------------------------------------
  ROUTE PROTECTION
  This page must NEVER hijack real sections like /canon/* or /blog/*
----------------------------------------------------------------------------- */
const RESERVED = new Set([
  // site sections
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
  // framework / infra
  "api",
  "_next",
  "assets",
  "public",
  "admin",
  "dashboard",
  "auth",
  // common static files
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "manifest.json",
]);

function isReservedSlug(slug: string) {
  const s = slug.toLowerCase().trim();
  if (!s) return true;
  if (RESERVED.has(s)) return true;
  if (s.startsWith("_")) return true;
  if (s.includes(".")) return true; // blocks /whatever.png, /sitemap.xml, etc
  if (s.includes("/")) return true; // blocks nested slugs entirely
  return false;
}

function toISODate(date: string | null | undefined) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function safeText(v: unknown, fallback = "") {
  const s = typeof v === "string" ? v : "";
  return s.trim() || fallback;
}

const SITE_URL = "https://www.abrahamoflondon.org";

/* -----------------------------------------------------------------------------
  PAGE
----------------------------------------------------------------------------- */
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
          <div className="mt-10">
            <Link
              href="/"
              className="inline-flex items-center gap-3 rounded-xl border border-amber-400/25 bg-white/5 px-5 py-3 text-sm font-semibold text-amber-100 hover:border-amber-400/45"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              Return home
            </Link>
          </div>
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

  const canonical =
    `${SITE_URL}${doc.href.startsWith("/") ? doc.href : `/${doc.href}`}`;

  const ogImage = doc.image || "/assets/images/social/og-image.jpg";
  const description =
    doc.excerpt ||
    "Abraham of London — institutional advisory and strategic architecture.";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: doc.title,
    description,
    mainEntityOfPage: canonical,
    url: canonical,
    image: [`${SITE_URL}${ogImage.startsWith("/") ? ogImage : `/${ogImage}`}`],
    datePublished: toISODate(doc.date),
    dateModified: toISODate(doc.date),
    author: doc.author
      ? { "@type": "Person", name: doc.author }
      : { "@type": "Person", name: "Abraham of London" },
    publisher: {
      "@type": "Organization",
      name: "Abraham of London",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/assets/images/abraham-logo.jpg`,
      },
    },
    keywords: (doc.tags || []).join(", "),
  };

  return (
    <Layout title={doc.title} description={description}>
      <Head>
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={doc.title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content={`${SITE_URL}${ogImage}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={doc.title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`${SITE_URL}${ogImage}`} />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <section className="bg-black">
        <div className="mx-auto max-w-3xl px-6 py-12">
          {/* Kind pill */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-500/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
            {safeText(doc.kind, "document")}
          </div>

          <h1 className="font-serif text-4xl font-semibold leading-tight text-amber-100 sm:text-5xl">
            {doc.title}
          </h1>

          {/* Meta row */}
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

            {doc.author ? (
              <span className="inline-flex items-center gap-2">
                <User className="h-4 w-4 text-amber-300" />
                {doc.author}
              </span>
            ) : null}
          </div>

          {/* Excerpt */}
          {doc.excerpt ? (
            <p className="mt-6 text-lg leading-relaxed text-gray-200">
              {doc.excerpt}
            </p>
          ) : null}

          {/* Cover */}
          {doc.image ? (
            <div className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={doc.image} alt={doc.title} className="h-auto w-full" />
            </div>
          ) : null}

          {/* Content */}
          <article className="prose prose-invert mt-10 max-w-none">
            {source ? (
              <MDXRemote {...source} components={mdxComponents ?? {}} />
            ) : (
              <p className="text-gray-300">Content not available.</p>
            )}
          </article>

          {/* Tags */}
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

          {/* Actions */}
          <div className="mt-12 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-3 rounded-xl border border-amber-400/25 bg-white/5 px-5 py-3 text-sm font-semibold text-amber-100 hover:border-amber-400/45"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              Return home
            </Link>

            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-gray-200 hover:border-white/20"
              type="button"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              Back
            </button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

/* -----------------------------------------------------------------------------
  BUILD: PATHS
  STRICT: only generates /{slug} for documents whose href is exactly "/slug"
----------------------------------------------------------------------------- */
export const getStaticPaths: GetStaticPaths = async () => {
  try {
    await getContentlayerData();

    const docs = getPublishedDocuments();
    const paths =
      (docs ?? [])
        .map((d: any) => {
          const href = getDocHref(d);
          if (!href) return null;

          // Only allow exact top-level href: "/slug"
          const slug = normalizeSlug(href);
          if (!slug) return null;

          if (isReservedSlug(slug)) return null;
          if (href !== `/${slug}`) return null;

          return { params: { slug } };
        })
        .filter(Boolean) as { params: { slug: string } }[];

    return { paths, fallback: "blocking" };
  } catch (e) {
    console.error("getStaticPaths [slug] failed:", e);
    return { paths: [], fallback: "blocking" };
  }
};

/* -----------------------------------------------------------------------------
  BUILD: PROPS
  STRICT: only serves top-level "/slug", never nested content
----------------------------------------------------------------------------- */
export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const rawSlug = params?.slug;
    if (!rawSlug || Array.isArray(rawSlug)) return { notFound: true };

    const slug = normalizeSlug(String(rawSlug));
    if (!slug || isReservedSlug(slug)) return { notFound: true };

    const rawDoc = await getDocBySlug(slug);
    if (!rawDoc) return { notFound: true };
    if (isDraftContent(rawDoc)) return { notFound: true };

    const href = getDocHref(rawDoc);
    if (!href || href !== `/${slug}`) return { notFound: true };

    const doc: Doc = {
      key: rawDoc._id || `doc:${slug}`,
      kind: String(getDocKind(rawDoc) ?? "document"),
      title: safeText(rawDoc?.title, "Untitled"),
      href: String(href),
      excerpt: (rawDoc?.excerpt ?? rawDoc?.description ?? null) as string | null,
      date: rawDoc?.date ? String(rawDoc.date) : null,
      image: (resolveDocCoverImage(rawDoc) ?? null) as string | null,
      tags: Array.isArray(rawDoc.tags) ? rawDoc.tags : [],
      author: rawDoc.author || null,
      readTime: rawDoc.readTime || null,
      category: rawDoc.category || null,
    };

    const rawMdx = rawDoc.body?.raw || rawDoc.body || "";
    const source =
      typeof rawMdx === "string" && rawMdx.trim()
        ? await prepareMDX(rawMdx)
        : null;

    return { props: { doc, source }, revalidate: 3600 };
  } catch (e) {
    console.error("getStaticProps [slug] failed:", e);
    return { notFound: true };
  }
};

export default GenericContentPage;