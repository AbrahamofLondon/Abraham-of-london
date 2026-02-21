/* pages/books/[slug].tsx — PRODUCTION-GRADE BOOK RENDERER (FULL RESOLUTION) */
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import { MDXRemote } from "next-mdx-remote";
import { ChevronLeft, BookOpen, Loader2, Lock } from "lucide-react";

import Layout from "@/components/Layout";
import AccessGate from "@/components/AccessGate";
import { BriefSummaryCard } from "@/components/mdx/BriefSummaryCard";
import mdxComponents from "@/components/mdx-components";

import { useAccess, type Tier } from "@/hooks/useAccess";
import { prepareMDX } from "@/lib/server/md-utils";

// IMPORTANT: keep server utilities server-only
import {
  getAllContentlayerDocs,
  getDocBySlug,
  isDraftContent,
  sanitizeData,
  normalizeSlug,
  resolveDocCoverImage,
} from "@/lib/content/server";

type BookDoc = {
  title: string;
  slug: string;
  accessLevel: Tier;
  subtitle?: string | null;
  description?: string | null;
  excerpt?: string | null;
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

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");

const BookPage: NextPage<Props> = ({ book, initialLocked, initialSource, mdxRaw, canonicalAbs, ogImageAbs }) => {
  const { hasClearance, verify, isValidating } = useAccess();
  const [mounted, setMounted] = React.useState(false);
  const [source, setSource] = React.useState<MDXRemoteSerializeResult | null>(initialSource);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const isAuthorized = hasClearance(book.accessLevel);

  const fetchSecurePayload = React.useCallback(async () => {
    if (loading || source) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/books/${encodeURIComponent(book.slug)}`);
      const json = await res.json().catch(() => null);
      if (res.ok && json?.source) setSource(json.source);
      else console.error("[BOOK_SECURE_PAYLOAD] Bad response", { status: res.status });
    } catch (e) {
      console.error("[BOOK_SECURE_PAYLOAD] Failed", e);
    } finally {
      setLoading(false);
    }
  }, [book.slug, loading, source]);

  // When unlocked, load content (for locked volumes)
  React.useEffect(() => {
    if (!mounted) return;
    if (initialLocked && isAuthorized && !source) void fetchSecurePayload();
  }, [mounted, initialLocked, isAuthorized, source, fetchSecurePayload]);

  // If this is PUBLIC but we somehow have no source, recover by serializing client-side is NOT ideal.
  // Instead, show a clear warning banner to avoid silent broken UX.
  const publicButMissing = mounted && !initialLocked && !source;

  return (
    <Layout title={book.title} description={book.description || book.excerpt || ""} className="bg-black" fullWidth>
      <Head>
        <link rel="canonical" href={canonicalAbs} />
        <meta property="og:image" content={ogImageAbs} />
        <meta name="robots" content={initialLocked ? "noindex, nofollow" : "index, follow"} />
      </Head>

      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-zinc-950/85 backdrop-blur-xl border-b border-white/5 px-6 py-3">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <Link
            href="/books"
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-500 hover:text-amber-300 transition-colors"
          >
            <ChevronLeft size={14} />
            Back to Library
          </Link>

          {initialLocked ? (
            <span className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.35em] text-amber-400/80">
              <Lock size={12} />
              Restricted Volume
            </span>
          ) : (
            <span className="text-[10px] font-mono uppercase tracking-[0.35em] text-zinc-500">
              Public Edition
            </span>
          )}
        </div>
      </div>

      {/* Hero */}
      <header className="border-b border-white/5 bg-zinc-950/40 py-16">
        <div className="mx-auto max-w-6xl px-6 grid lg:grid-cols-[1.2fr_0.8fr] gap-10 items-center">
          <div>
            <div className="font-mono text-[10px] text-amber-500 uppercase tracking-[0.5em] mb-6 flex items-center gap-3">
              <BookOpen size={14} />
              <span>{book.category || "Book"}</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-serif italic text-white leading-tight">{book.title}</h1>

            {book.subtitle ? (
              <p className="mt-6 text-lg text-white/60 font-light max-w-2xl">{book.subtitle}</p>
            ) : null}
          </div>

          <div className="flex justify-center lg:justify-end">
            {book.coverImage ? (
              <div className="relative rounded-3xl border border-amber-500/20 bg-black/30 p-3 shadow-2xl">
                <Image
                  src={book.coverImage}
                  alt={book.title}
                  width={300}
                  height={420}
                  className="rounded-2xl h-auto w-auto"
                  priority
                />
              </div>
            ) : (
              <div className="w-[300px] h-[420px] rounded-3xl border border-white/10 bg-white/5" />
            )}
          </div>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-6xl px-6 py-12">
        <BriefSummaryCard
          category="BOOK"
          classification={book.accessLevel}
          date={book.date || undefined}
          author={book.author || undefined}
        />

        <div className="mt-10 relative">
          {/* Premium loading overlay */}
          {loading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/55 backdrop-blur-sm rounded-2xl border border-white/10">
              <div className="flex items-center gap-3 text-amber-500">
                <Loader2 className="animate-spin" size={18} />
                <span className="font-mono text-[10px] tracking-[0.35em] uppercase italic">
                  Securing Transmission...
                </span>
              </div>
            </div>
          ) : null}

          {!isAuthorized && !isValidating && initialLocked ? (
            <AccessGate
              title={book.title}
              message="Restricted to authorized personnel."
              requiredTier={book.accessLevel}
              onUnlocked={() => verify()}
              onGoToJoin={() => window.location.assign("/inner-circle")}
            />
          ) : (
            <div className={loading ? "opacity-20 transition-opacity" : "opacity-100 transition-opacity"}>
              {publicButMissing ? (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
                  <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-amber-300 mb-2">
                    Render Warning
                  </div>
                  <p className="text-white/70 text-sm">
                    This is a public volume but no precompiled MDX payload was provided at build time.
                    Verify the book MDX is being serialized in <code>getStaticProps</code>.
                  </p>
                  <pre className="mt-4 text-xs text-white/50 overflow-auto">
                    {String(mdxRaw || "").slice(0, 800)}
                  </pre>
                </div>
              ) : null}

              {source ? (
                <div className="prose prose-invert prose-amber max-w-none">
                  {/* ✅ This is where Callout/Note/Divider resolve */}
                  <MDXRemote {...source} components={mdxComponents} />
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
                  <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-zinc-500">
                    Content Pending
                  </div>
                  <p className="mt-3 text-white/60 text-sm">
                    {initialLocked
                      ? "Unlock access to load this volume."
                      : "No compiled content available."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const docs = getAllContentlayerDocs()
    .filter((d: any) => !isDraftContent(d))
    .filter((d: any) => {
      const t = String(d?.type || "").toLowerCase();
      const fp = String(d?._raw?.flattenedPath || "");
      return t === "book" || fp.startsWith("books/");
    });

  const paths = docs.map((b: any) => {
    const s = normalizeSlug(String(b?.slug || b?._raw?.flattenedPath || ""));
    const bare = s.replace(/^books\//, "");
    return { params: { slug: bare } };
  });

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = normalizeSlug(String(params?.slug || ""));
  const rawDoc =
    getDocBySlug(`books/${slug}`) ||
    getDocBySlug(slug);

  if (!rawDoc || isDraftContent(rawDoc)) return { notFound: true };

  const accessLevel = (rawDoc.accessLevel || "inner-circle") as Tier;
  const initialLocked = accessLevel !== "public";

  const mdxRaw = String(rawDoc?.body?.raw || rawDoc?.content || "");

  // ✅ Public books: compile MDX at build time so components resolve immediately.
  const initialSource = initialLocked ? null : await prepareMDX(mdxRaw || " ");

  const coverImage = resolveDocCoverImage(rawDoc);

  const book: BookDoc = {
    title: rawDoc.title || "Untitled",
    subtitle: rawDoc.subtitle || null,
    description: rawDoc.description || null,
    excerpt: rawDoc.excerpt || null,
    slug,
    accessLevel,
    category: rawDoc.category || "Volume",
    date: rawDoc.date ? String(rawDoc.date) : null,
    author: rawDoc.author || "Abraham of London",
    coverImage,
  };

  const canonicalAbs = `${BASE_URL}/books/${slug}`;
  const ogImageAbs = coverImage ? `${BASE_URL}${coverImage}` : `${BASE_URL}/assets/images/social/og-image.jpg`;

  return {
    props: sanitizeData({
      book,
      initialLocked,
      initialSource,
      mdxRaw,
      canonicalAbs,
      ogImageAbs,
    }),
    revalidate: 3600,
  };
};

export default BookPage;