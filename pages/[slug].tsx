// pages/[slug].tsx - UPDATED IMPORT SECTION
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowRight, Calendar, Clock, Tag, User } from "lucide-react";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import { MDXRemote } from "next-mdx-remote";

import Layout from "@/components/Layout";

// ✅ Import directly from components, not md-utils
import mdxComponents from "@/components/mdx-components";

import {
  getAllCombinedDocs,
  getDocBySlug,
  normalizeSlug,
  isDraftContent,
  isPublished,
} from "@/lib/contentlayer-helper";

import {
  getDocKind,
  getDocHref,
  resolveDocCoverImage,
  sanitizeData,
} from "@/lib/content/shared";

// ✅ Import only prepareMDX from md-utils
import { prepareMDX } from "@/lib/server/md-utils";

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
  dateIso?: string | null;  // ✅ ISO for reliable handling
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
  ROUTE PROTECTION - UPDATED WITH ALL RESERVED ROUTES
----------------------------------------------------------------------------- */
const RESERVED_TOP_LEVEL = new Set<string>([
  "vault",
  "canon-campaign",
  "downloads",
  "download",
  "books",
  "canon",
  "events",
  "shorts",
  "strategy",
  "resources",
  "prints",
  "blog",
  "inner-circle",
  "login",
  "api",
  "admin",
  "about",
  "accessibility",
  "accessibility-statement",
  "cookie-policy",
  "cookies",
  "contact",
  "fatherhood",
  "founders",
  "leadership",
  "newsletter",
  "privacy",
  "security",
  "security-policy",
  "speaking",
  "subscribe",
  "terms",
  "terms-of-service",
  "ventures",
  "works-in-progress",
  "content",
  "board",
  "auth",
  "private",
  "debug",
  "diagnostic",
  "styling-test",
  "inner-circle-portal",
  "inner-circle-admin",
  "books-the-architecture-of-human-purpose-landing",
  "chatham-rooms",
  "consulting",
  "content-simple",
  "strategy-room",
  // ✅ ADDED: Problematic slugs from export errors
  "abraham-vault-pack",
  "download-legacy-architecture-canvas",
  "the-brotherhood-code",
  "ultimate-purpose-of-man-editorial",
]);

/* -----------------------------------------------------------------------------
  UTILITY FUNCTIONS
----------------------------------------------------------------------------- */
function stripMdxExt(s: string): string {
  return String(s || "").replace(/\.(md|mdx)$/, "");
}

function topSlugFromDoc(d: any): string {
  const raw =
    normalizeSlug(String(d?.slug || "")) ||
    normalizeSlug(String(d?._raw?.flattenedPath || "")) ||
    "";

  const noExt = stripMdxExt(raw);

  // Only allow *single-segment* slugs for this page.
  // Anything with "/" belongs to a nested router.
  const seg = noExt.split("/").filter(Boolean)[0] || "";
  return seg;
}

function toISODate(date: string | null | undefined): string | null {
  if (!date) return null;
  try {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  } catch {
    return null;
  }
}

function safeText(v: unknown, fallback = ""): string {
  const s = typeof v === "string" ? v : "";
  return s.trim() || fallback;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";

/* -----------------------------------------------------------------------------
  PAGE COMPONENT
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

  const canonical = `${SITE_URL}${doc.href.startsWith("/") ? doc.href : `/${doc.href}`}`;
  const ogImage = doc.image || "/assets/images/social/og-image.jpg";
  const description = doc.excerpt || "Abraham of London — institutional advisory and strategic architecture.";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: doc.title,
    description,
    mainEntityOfPage: canonical,
    url: canonical,
    image: [`${SITE_URL}${ogImage.startsWith("/") ? ogImage : `/${ogImage}`}`],
    datePublished: doc.dateIso,
    dateModified: doc.dateIso,
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
            {formattedDate && (
              <span className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-300" />
                {formattedDate}
              </span>
            )}

            {doc.readTime && (
              <span className="inline-flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-300" />
                {doc.readTime}
              </span>
            )}

            {doc.author && (
              <span className="inline-flex items-center gap-2">
                <User className="h-4 w-4 text-amber-300" />
                {doc.author}
              </span>
            )}
          </div>

          {/* Excerpt */}
          {doc.excerpt && (
            <p className="mt-6 text-lg leading-relaxed text-gray-200">
              {doc.excerpt}
            </p>
          )}

          {/* Cover */}
          {doc.image && (
            <div className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
              <img src={doc.image} alt={doc.title} className="h-auto w-full" />
            </div>
          )}

          {/* Content */}
          <article className="prose prose-invert mt-10 max-w-none">
            {source ? (
              <MDXRemote {...source} components={mdxComponents || {}} />
            ) : (
              <p className="text-gray-300">Content not available.</p>
            )}
          </article>

          {/* Tags */}
          {doc.tags && doc.tags.length > 0 && (
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
          )}

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
    const docs = getAllCombinedDocs();

    const candidates = docs
      .filter((d: any) => {
        if (!d) return false;
        try {
          return !isDraftContent(d) && isPublished(d);
        } catch {
          return false;
        }
      })
      .map(topSlugFromDoc)
      .filter(Boolean);

    // ✅ CRITICAL: Filter out reserved routes
    const unique = Array.from(new Set(candidates)).filter((s) => {
      if (!s) return false;
      if (RESERVED_TOP_LEVEL.has(s)) return false;
      return true;
    });

    return {
      paths: unique.map((slug) => ({ params: { slug } })),
      fallback: "blocking",
    };
  } catch (e) {
    console.error("[Slug Page] Error generating static paths:", e);
    return { paths: [], fallback: "blocking" };
  }
};

/* -----------------------------------------------------------------------------
  BUILD: PROPS
  STRICT: only serves top-level "/slug", never nested content
----------------------------------------------------------------------------- */
export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const raw = String((params as any)?.slug || "");
    const slug = normalizeSlug(raw);

    // ✅ CRITICAL: REJECT reserved routes
    if (!slug || RESERVED_TOP_LEVEL.has(slug)) {
      return { notFound: true };
    }

    // Try direct slug, and also flattenedPath variants (defensive)
    const rawDoc =
      getDocBySlug(slug) ||
      getDocBySlug(`${slug}/index`) ||
      getDocBySlug(`${slug}.mdx`) ||
      getDocBySlug(`${slug}.md`) ||
      null;

    if (!rawDoc) {
      return { notFound: true };
    }

    // Check if draft or unpublished
    if (isDraftContent(rawDoc) || !isPublished(rawDoc)) {
      return { notFound: true };
    }

    const href = getDocHref(rawDoc);
    
    // ✅ CRITICAL: Ensure it's truly top-level (not nested)
    if (!href || href !== `/${slug}`) {
      return { notFound: true };
    }

    // ✅ Store both ISO date (for schema) and display date
    const dateIso = toISODate(rawDoc?.date);
    const dateStr = rawDoc?.date ? String(rawDoc.date) : null;

    const doc: Doc = {
      key: rawDoc._id || `doc:${slug}`,
      kind: String(getDocKind(rawDoc) || "document"),
      title: safeText(rawDoc?.title, "Untitled"),
      href: String(href),
      excerpt: (rawDoc?.excerpt || rawDoc?.description || null) as string | null,
      date: dateStr,
      dateIso,
      image: (resolveDocCoverImage(rawDoc) || null) as string | null,
      tags: Array.isArray(rawDoc.tags) ? rawDoc.tags : [],
      author: rawDoc.author || null,
      readTime: rawDoc.readTime || null,
      category: rawDoc.category || null,
    };

    // ✅ Prepare MDX content
    const rawMdx = rawDoc.body?.raw || rawDoc.body || "";
    const source =
      typeof rawMdx === "string" && rawMdx.trim()
        ? await prepareMDX(rawMdx)
        : null;

    return {
      props: {
        doc: sanitizeData(doc),
        source: sanitizeData(source),
      },
      revalidate: 3600, // Revalidate every hour
    };
  } catch (error) {
    console.error("[Slug Page] Error in getStaticProps:", error);
    return { notFound: true };
  }
};

export default GenericContentPage;