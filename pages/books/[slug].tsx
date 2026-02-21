/* pages/books/[slug].tsx — RECALIBRATED & FIXED */
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import { MDXRemote } from "next-mdx-remote"; // ✅ Use MDXRemote directly
import Image from "next/image";
import Link from "next/link";

import Layout from "@/components/Layout";
import { BriefSummaryCard } from "@/components/mdx/BriefSummaryCard";
import AccessGate from "@/components/AccessGate";
import mdxComponents from "@/components/mdx-components";

import { useAccess, type Tier } from "@/hooks/useAccess";
import { prepareMDX } from "@/lib/server/md-utils";
import { useClientRouter } from "@/lib/router/useClientRouter";
import { Loader2, ChevronLeft, BookOpen } from "lucide-react";

import { normalizeSlug, sanitizeData, resolveDocCoverImage } from "@/lib/content/shared";
import { getContentlayerData, getAllContentlayerDocs, getDocBySlug, isDraftContent } from "@/lib/content/server";

type BookDoc = { 
  title: string; 
  subtitle?: string | null; 
  description?: string | null; 
  excerpt?: string | null; 
  slug: string; 
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
  canonicalAbs: string; 
  ogImageAbs: string; 
}

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");

const BookPage: NextPage<Props> = ({ book, initialLocked, initialSource, canonicalAbs, ogImageAbs }) => {
  const router = useClientRouter();
  const { hasClearance, verify, isValidating } = useAccess();
  const [source, setSource] = React.useState<MDXRemoteSerializeResult | null>(initialSource);
  const [loadingContent, setLoadingContent] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => { setMounted(true); }, []);
  const isAuthorized = hasClearance(book.accessLevel);

  const fetchSecurePayload = React.useCallback(async () => {
    if (loadingContent || source) return;
    setLoadingContent(true);
    try {
      const res = await fetch(`/api/books/${encodeURIComponent(book.slug)}`);
      const json = await res.json();
      if (res.ok && json?.source) setSource(json.source);
    } catch (e) {
      console.error("[VAULT_SYNC_ERROR]", e);
    } finally {
      setLoadingContent(false);
    }
  }, [book.slug, loadingContent, source]);

  React.useEffect(() => {
    if (isAuthorized && !source && initialLocked) fetchSecurePayload();
  }, [isAuthorized, source, initialLocked, fetchSecurePayload]);

  if (!mounted || !router) return <div className="bg-black min-h-screen" />;

  return (
    <Layout title={book.title} description={book.description || book.excerpt || ""} className="bg-black" fullWidth>
      <Head>
        <link rel="canonical" href={canonicalAbs} />
        <meta property="og:image" content={ogImageAbs} />
        <meta name="robots" content={initialLocked ? "noindex, nofollow" : "index, follow"} />
      </Head>

      <div className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-b border-white/5 px-6 py-3">
        <Link href="/books" className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-500 hover:text-amber-300">
          <ChevronLeft size={14} /> Back to Library
        </Link>
      </div>

      <header className="border-b border-white/5 bg-zinc-950/50 py-16">
        <div className="mx-auto max-w-6xl px-6 grid lg:grid-cols-[1.2fr_0.8fr] items-center">
          <div>
            <div className="font-mono text-[10px] text-amber-500 uppercase tracking-[0.5em] mb-6 flex items-center gap-3">
              <BookOpen size={14} /> <span>{book.category || "Volume"}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-serif italic text-white leading-tight">{book.title}</h1>
          </div>
          <div className="flex justify-center lg:justify-end">
            {book.coverImage && (
              <div className="relative rounded-3xl border border-amber-500/20 bg-black/40 p-3 shadow-2xl">
                <Image src={book.coverImage} alt={book.title} width={260} height={380} className="rounded-2xl h-auto" priority />
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <BriefSummaryCard category="BOOK" classification={book.accessLevel} date={book.date || undefined} author={book.author || undefined} />
        <div className="mt-10">
          {!isAuthorized && !isValidating ? (
            <AccessGate title="Classified Volume" message="Restricted to authorized personnel." requiredTier={book.accessLevel} onUnlocked={() => verify()} />
          ) : (
            <div className={loadingContent ? "opacity-20" : "opacity-100"}>
              {source ? (
                // ✅ Use MDXRemote directly with components
                <div className="prose prose-invert prose-amber max-w-none">
                  <MDXRemote {...source} components={mdxComponents} />
                </div>
              ) : null}
            </div>
          )}
          {loadingContent && (
            <div className="flex justify-center py-10 text-amber-500 font-mono text-xs animate-pulse">
              <Loader2 className="animate-spin mr-2" size={16} /> Synchronizing Intelligence...
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  getContentlayerData();
  const paths = getAllContentlayerDocs()
    .filter(d => !isDraftContent(d) && (String(d.type).includes("book") || String(d._raw.flattenedPath).startsWith("books/")))
    .map(b => ({ params: { slug: normalizeSlug(b.slug || b._raw.flattenedPath).replace(/^books\//, "") } }));
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug || "");
  const rawDoc = getDocBySlug(`books/${slug}`) || getDocBySlug(slug);
  if (!rawDoc || isDraftContent(rawDoc)) return { notFound: true };

  const accessLevel = (rawDoc.accessLevel || "inner-circle") as Tier;
  
  // ✅ Prepare MDX source
  const mdxContent = rawDoc.body?.raw || rawDoc.content || "";
  const initialSource = accessLevel === "public" ? await prepareMDX(mdxContent) : null;

  const book: BookDoc = {
    title: rawDoc.title || "Untitled",
    slug, 
    accessLevel,
    category: rawDoc.category, 
    date: rawDoc.date ? String(rawDoc.date) : null,
    author: rawDoc.author || "Abraham of London", 
    coverImage: resolveDocCoverImage(rawDoc)
  };

  return { 
    props: sanitizeData({ 
      book, 
      initialLocked: accessLevel !== "public", 
      initialSource, 
      canonicalAbs: `${BASE_URL}/books/${slug}`, 
      ogImageAbs: `${BASE_URL}${book.coverImage || ""}` 
    }),
    revalidate: 3600 
  };
};

export default BookPage;