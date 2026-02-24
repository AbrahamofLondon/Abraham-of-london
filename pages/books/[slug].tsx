/* pages/books/[slug].tsx — PRODUCTION-GRADE BOOK RENDERER (V2.6 RESILIENCE) */
"use client";

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, BookOpen, Lock, Loader2 } from "lucide-react";

import Layout from "@/components/Layout";
import AccessGate from "@/components/AccessGate";
import { BriefSummaryCard } from "@/components/mdx/BriefSummaryCard";
import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer";

import { useAccess, type Tier } from "@/hooks/useAccess";

// Server utilities (Note: These are only used in getStaticProps/Paths)
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
  bodyCode: string; 
};

interface Props {
  book: BookDoc;
  initialLocked: boolean;
  canonicalAbs: string;
  ogImageAbs: string;
}

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");

const BookPage: NextPage<Props> = ({ book, initialLocked, canonicalAbs, ogImageAbs }) => {
  const { hasClearance, verify, isValidating } = useAccess();
  const [mounted, setMounted] = React.useState(false);
  
  // ✅ Manage active source state to allow post-unlock reification
  const [activeCode, setActiveCode] = React.useState<string>(book.bodyCode);
  const [isDecrypting, setIsDecrypting] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const isAuthorized = hasClearance(book.accessLevel);

  /**
   * Institutional Protocol: Reify Secure Content
   * Triggered after AccessGate confirms credentials.
   */
  const handleUnlock = async () => {
    verify(); // Update global access state
    
    // If it was locked, we need to fetch the actual full content from the secure proxy
    if (initialLocked) {
      setIsDecrypting(true);
      try {
        const res = await fetch(`/api/books/${encodeURIComponent(book.slug)}`);
        const json = await res.json();
        if (res.ok && json.bodyCode) {
          setActiveCode(json.bodyCode);
        }
      } catch (err) {
        console.error("Protocol Error: Secure payload acquisition failed.", err);
      } finally {
        setIsDecrypting(false);
      }
    }
  };

  if (!mounted) return null;

  return (
    <Layout title={book.title} description={book.description || book.excerpt || ""} className="bg-black" fullWidth>
      <Head>
        <link rel="canonical" href={canonicalAbs} />
        <meta property="og:image" content={ogImageAbs} />
        <meta name="robots" content={initialLocked ? "noindex, nofollow" : "index, follow"} />
      </Head>

      {/* Navigation Bar */}
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

      <header className="border-b border-white/5 bg-zinc-950/40 py-16">
        <div className="mx-auto max-w-6xl px-6 grid lg:grid-cols-[1.2fr_0.8fr] gap-10 items-center">
          <div className="animate-aolFadeUp">
            <div className="font-mono text-[10px] text-amber-500 uppercase tracking-[0.5em] mb-6 flex items-center gap-3">
              <BookOpen size={14} />
              <span>{book.category || "Book"}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-serif italic text-white leading-tight">{book.title}</h1>
            {book.subtitle && (
              <p className="mt-6 text-lg text-white/60 font-light max-w-2xl">{book.subtitle}</p>
            )}
          </div>

          <div className="flex justify-center lg:justify-end animate-aolFadeIn">
            {book.coverImage ? (
              <div className="relative rounded-3xl border border-amber-500/20 bg-black/30 p-3 shadow-2xl">
                <Image
                  src={book.coverImage}
                  alt={book.title}
                  width={300}
                  height={420}
                  className="rounded-2xl h-auto"
                  priority
                />
              </div>
            ) : (
              <div className="w-[300px] h-[420px] rounded-3xl border border-white/10 bg-white/5" />
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <BriefSummaryCard
          category="BOOK"
          classification={book.accessLevel}
          date={book.date || undefined}
          author={book.author || undefined}
        />

        <div className="mt-10 relative min-h-[400px]">
          {isDecrypting && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500 mb-4" />
              <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-amber-500/80">Reifying Asset...</span>
            </div>
          )}

          {!isAuthorized && !isValidating && initialLocked ? (
            <AccessGate
              title={book.title}
              message="Restricted to authorized personnel."
              requiredTier={book.accessLevel as any}
              onUnlocked={handleUnlock}
              onGoToJoin={() => window.location.assign("/inner-circle")}
            />
          ) : (
            <div className="prose prose-invert prose-amber max-w-none animate-aolFadeIn">
              <SafeMDXRenderer code={activeCode} />
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = normalizeSlug(String(params?.slug || ""));
  const rawDoc = getDocBySlug(`books/${slug}`) || getDocBySlug(slug);

  if (!rawDoc || isDraftContent(rawDoc)) return { notFound: true };

  const accessLevel = (rawDoc.accessLevel || "inner-circle") as Tier;
  const initialLocked = accessLevel !== "public";
  const coverImage = resolveDocCoverImage(rawDoc);

  // 🛡️ Institutional Security Guard: Prevent content leaking in Static HTML
  // If locked, we send a redacted version. The full code is fetched via API on-unlock.
  const secureBodyCode = initialLocked 
    ? `
      <div className="py-20 border-y border-white/5 my-10">
        <p className="text-zinc-500 italic font-serif text-center">
          This intelligence brief is encrypted. Please initialize decryption protocols via the security gate.
        </p>
      </div>
      `
    : rawDoc.body.code;

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
    bodyCode: secureBodyCode, 
  };

  const canonicalAbs = `${BASE_URL}/books/${slug}`;
  const ogImageAbs = coverImage ? `${BASE_URL}${coverImage}` : `${BASE_URL}/assets/images/social/og-image.jpg`;

  return {
    props: sanitizeData({
      book,
      initialLocked,
      canonicalAbs,
      ogImageAbs,
    }),
    revalidate: 3600,
  };
};