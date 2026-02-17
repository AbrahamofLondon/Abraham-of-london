// pages/books/[slug].tsx — HARDENED (Module Sovereignty / Decryption-Ready)
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import Image from "next/image";

import Layout from "@/components/Layout";
import { MDXLayoutRenderer } from "@/components/mdx/MDXLayoutRenderer";
import { BriefSummaryCard } from "@/components/mdx/BriefSummaryCard";
import AccessGate from "@/components/AccessGate";

import { useAccess, type Tier } from "@/hooks/useAccess";
import { prepareMDX } from "@/lib/server/md-utils";

import { Loader2 } from "lucide-react";

import { normalizeSlug, sanitizeData, resolveDocCoverImage } from "@/lib/content/shared";

// ✅ Prefer your canonical Pages-router server helper used elsewhere
import {
  getContentlayerData,
  getAllContentlayerDocs,
  getDocBySlug,
  isDraftContent,
} from "@/lib/content/server";

/* -----------------------------------------------------------------------------
  TYPES
----------------------------------------------------------------------------- */
type BookDoc = {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  excerpt?: string | null;
  slug: string; // ✅ BARE slug only (no "books/")
  accessLevel: Tier;
  category?: string | null;
  date?: string | null;
  author?: string | null;
  coverImage?: string | null;
};

interface Props {
  book: BookDoc;
  initialLocked: boolean;
  initialSource: MDXRemoteSerializeResult | null;
  mdxRaw: string;
  canonicalAbs: string;
  ogImageAbs: string;
}

/* -----------------------------------------------------------------------------
  HELPERS
----------------------------------------------------------------------------- */
const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");

function toAbs(pathOrUrl: string): string {
  const v = String(pathOrUrl || "").trim();
  if (!v) return BASE_URL;
  if (/^https?:\/\//i.test(v)) return v;
  const clean = v.startsWith("/") ? v : `/${v}`;
  return `${BASE_URL}${clean}`;
}

function getRawBody(d: any): string {
  return d?.body?.raw || d?.bodyRaw || d?.content || d?.body || d?.mdx || "";
}

/**
 * Strip route-base prefix repeatedly:
 * - books/books/x -> x
 * - books/x -> x
 */
function stripRepeatedPrefix(slug: string, prefix: string): string {
  const s = normalizeSlug(slug);
  const p = normalizeSlug(prefix);
  if (!p) return s;

  let out = s;
  const needle = p.endsWith("/") ? p : `${p}/`;

  while (out.toLowerCase().startsWith(needle.toLowerCase())) {
    out = out.slice(needle.length);
  }

  return normalizeSlug(out);
}

/**
 * Robust resolver:
 * - resolves using bare slug, but also attempts legacy polluted variants
 */
function resolveBookDoc(incomingSlug: string) {
  const clean = normalizeSlug(incomingSlug);
  const bare = stripRepeatedPrefix(clean, "books");

  return (
    getDocBySlug(`books/${bare}`) ||
    getDocBySlug(bare) ||
    getDocBySlug(`books/${clean}`) ||
    getDocBySlug(clean) ||
    getDocBySlug(`books/books/${bare}`) ||
    getDocBySlug(`books/books/${clean}`)
  );
}

/* -----------------------------------------------------------------------------
  PAGE COMPONENT
----------------------------------------------------------------------------- */
const BookPage: NextPage<Props> = ({
  book,
  initialLocked,
  initialSource,
  mdxRaw,
  canonicalAbs,
  ogImageAbs,
}) => {
  const router = useRouter();
  const { hasClearance, verify, isValidating } = useAccess();

  const [source, setSource] = React.useState<MDXRemoteSerializeResult | null>(initialSource);
  const [loadingContent, setLoadingContent] = React.useState(false);

  const isAuthorized = hasClearance(book.accessLevel);

  const fetchSecurePayload = React.useCallback(async () => {
    if (loadingContent || source) return;
    setLoadingContent(true);

    try {
      const res = await fetch(`/api/books/${encodeURIComponent(book.slug)}`);
      const json = await res.json();
      if (res.ok && json?.source) setSource(json.source);
    } catch {
      // eslint-disable-next-line no-console
      console.error("[BOOK_DECRYPT_ERROR] Fetch failed.");
    } finally {
      setLoadingContent(false);
    }
  }, [book.slug, loadingContent, source]);

  React.useEffect(() => {
    if (isAuthorized && !source && initialLocked) fetchSecurePayload();
  }, [isAuthorized, source, initialLocked, fetchSecurePayload]);

  if (router.isFallback) {
    return (
      <Layout title="Accessing Archive..." description="Synchronizing volume index.">
        <div className="min-h-screen bg-black flex items-center justify-center text-amber-500 font-mono text-xs uppercase tracking-widest">
          Synchronizing…
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={book.title} description={book.description || book.excerpt || ""} className="bg-black" fullWidth>
      <Head>
        <link rel="canonical" href={canonicalAbs} />
        <meta property="og:title" content={book.title} />
        <meta property="og:description" content={book.description || book.excerpt || ""} />
        <meta property="og:type" content="book" />
        <meta property="og:url" content={canonicalAbs} />
        <meta property="og:image" content={ogImageAbs} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={book.title} />
        <meta name="twitter:description" content={book.description || book.excerpt || ""} />
        <meta name="twitter:image" content={ogImageAbs} />

        {/* If gated, do not index */}
        <meta name="robots" content={initialLocked ? "noindex, nofollow" : "index, follow"} />
      </Head>

      <header className="border-b border-white/5 bg-zinc-950/50">
        <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20 grid gap-10 lg:grid-cols-[1.2fr_0.8fr] items-center">
          <div>
            <div className="font-mono text-[10px] text-amber-500 uppercase tracking-[0.5em] mb-6">
              Literature // {book.category || "Volume"}
            </div>
            <h1 className="text-4xl md:text-6xl font-serif italic text-white leading-tight">{book.title}</h1>

            {book.subtitle && (
              <p className="mt-6 text-lg md:text-xl text-white/40 font-light max-w-2xl leading-relaxed italic">
                {book.subtitle}
              </p>
            )}

            {book.excerpt && (
              <p className="mt-6 text-sm md:text-base text-white/55 max-w-2xl leading-relaxed">{book.excerpt}</p>
            )}
          </div>

          {/* Cover */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative rounded-3xl border border-amber-500/20 bg-black/40 p-3 shadow-[0_24px_60px_rgba(0,0,0,0.85)]">
              {book.coverImage ? (
                <Image
                  src={book.coverImage}
                  alt={`${book.title} cover`}
                  width={380}
                  height={540}
                  className="rounded-2xl border border-amber-500/20 w-[220px] sm:w-[260px] h-auto"
                  priority
                />
              ) : (
                <div className="w-[220px] sm:w-[260px] aspect-[2/3] rounded-2xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-white/40 font-mono text-[10px] uppercase tracking-widest">
                  Cover pending
                </div>
              )}
              <div className="mt-3 text-center text-[10px] font-mono uppercase tracking-[0.35em] text-white/40">
                Canon Shelf
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12 lg:py-16">
        <BriefSummaryCard
          category={book.category || "BOOK"}
          classification={book.accessLevel}
          date={book.date || undefined}
          author={book.author || undefined}
        />

        <div className="relative mt-10">
          {!isAuthorized && !isValidating ? (
            <div className="relative min-h-[520px]">
              <AccessGate
                title="Classified Volume"
                message={`Decryption of "${book.title}" requires ${book.accessLevel.replace("-", " ")} clearance.`}
                requiredTier={book.accessLevel}
                onUnlocked={() => verify()}
              />
            </div>
          ) : (
            <div className="relative min-h-[400px]">
              {loadingContent && (
                <div className="flex items-center gap-3 py-10 text-amber-500 animate-pulse font-mono text-xs uppercase tracking-widest">
                  <Loader2 className="animate-spin" size={16} />
                  Synchronizing Intelligence...
                </div>
              )}

              <div
                className={[
                  "prose prose-invert prose-amber max-w-none transition-opacity duration-700",
                  loadingContent ? "opacity-20" : "opacity-100",
                ].join(" ")}
              >
                {source ? <MDXLayoutRenderer code={source as any} /> : null}
              </div>
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
};

/* -----------------------------------------------------------------------------
  STATIC PATHS
----------------------------------------------------------------------------- */
export const getStaticPaths: GetStaticPaths = async () => {
  try {
    getContentlayerData();
    const docs = getAllContentlayerDocs() || [];

    const bookDocs = docs.filter((d: any) => {
      if (!d || isDraftContent(d)) return false;
      const t = String(d?.type || "").toLowerCase();
      const fp = String(d?._raw?.flattenedPath || "").toLowerCase();
      return t.includes("book") || fp.startsWith("books/");
    });

    const paths = bookDocs
      .map((b: any) => {
        const raw = normalizeSlug(String(b?.slug || b?._raw?.flattenedPath || ""));
        const bare = stripRepeatedPrefix(raw, "books"); // ✅ strips books/books/
        return bare ? { params: { slug: bare } } : null;
      })
      .filter(Boolean) as { params: { slug: string } }[];

    return { paths, fallback: "blocking" };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[BOOK_PATHS_ERROR]", e);
    return { paths: [], fallback: "blocking" };
  }
};

/* -----------------------------------------------------------------------------
  STATIC PROPS
----------------------------------------------------------------------------- */
export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const incoming = normalizeSlug(String(params?.slug || ""));
  if (!incoming) return { notFound: true };

  // ✅ Always use bare slug for canonical + API + routing identity
  const bareSlug = stripRepeatedPrefix(incoming, "books");

  const rawDoc = resolveBookDoc(bareSlug);
  if (!rawDoc || isDraftContent(rawDoc)) return { notFound: true };

  const accessLevel = (rawDoc.accessLevel || "inner-circle") as Tier;
  const initialLocked = accessLevel !== "public";

  const mdxRaw = getRawBody(rawDoc);

  let initialSource: MDXRemoteSerializeResult | null = null;
  if (!initialLocked) {
    initialSource = await prepareMDX(mdxRaw || " ");
  }

  const cover = resolveDocCoverImage(rawDoc) || "/assets/images/social/og-image.jpg";
  const canonicalAbs = toAbs(`/books/${bareSlug}`);
  const ogImageAbs = toAbs(cover);

  const book: BookDoc = {
    title: rawDoc.title || "Institutional Volume",
    subtitle: rawDoc.subtitle || null,
    description: rawDoc.description || null,
    excerpt: rawDoc.excerpt || null,
    slug: bareSlug, // ✅ bare
    accessLevel,
    category: rawDoc.category || null,
    date: rawDoc.date ? String(rawDoc.date) : null,
    author: rawDoc.author || "Abraham of London",
    coverImage: cover,
  };

  return {
    props: sanitizeData({
      book,
      initialLocked,
      initialSource: initialLocked ? null : initialSource,
      mdxRaw,
      canonicalAbs,
      ogImageAbs,
    }),
    revalidate: 3600,
  };
};

export default BookPage;