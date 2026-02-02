'use client';

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";

// Layout & UI
import Layout from "@/components/Layout";
import AccessGate from "@/components/AccessGate";
import CanonHero from "@/components/canon/CanonHero";
import { BriefSummaryCard } from "@/components/mdx/BriefSummaryCard";
import { MDXLayoutRenderer } from "@/components/mdx/MDXLayoutRenderer";

// Logic & Hooks
import { useAccess } from "@/hooks/useAccess";
import { getDocBySlug, getAllCanons } from "@/lib/contentlayer-helper"; 
import { normalizeSlug, joinHref } from "@/lib/content/shared";
import { sanitizeData, resolveDocCoverImage } from "@/lib/content/client-utils";
import { prepareMDX } from "@/lib/server/md-utils"; // Using our hardened utility

import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

/* -----------------------------------------------------------------------------
  TYPES
----------------------------------------------------------------------------- */
type Tier = "public" | "inner-circle" | "private";

type CanonDoc = {
  title: string;
  excerpt?: string | null;
  description?: string | null;
  slug: string;
  href: string;
  accessLevel: Tier;
  date?: string | null;
  coverImage?: string | null;
  category?: string | null;
  tags?: string[];
  author?: string | null;
  nextDoc?: { title: string; href: string } | null;
  prevDoc?: { title: string; href: string } | null;
};

interface Props {
  doc: CanonDoc;
  initialLocked: boolean;
  initialSource: MDXRemoteSerializeResult | null;
  mdxRaw: string;
}

/* -----------------------------------------------------------------------------
  PAGE COMPONENT
----------------------------------------------------------------------------- */
const CanonSlugPage: NextPage<Props> = ({ doc, initialLocked, initialSource, mdxRaw }) => {
  const router = useRouter();
  const { hasClearance, verify, isValidating } = useAccess();
  
  // State management for the intelligence payload
  const [source, setSource] = React.useState<MDXRemoteSerializeResult | null>(initialSource);
  const [loadingContent, setLoadingContent] = React.useState(false);

  const isAuthorized = hasClearance(doc.accessLevel);

  /**
   * Secure fetch for gated intelligence.
   * Prevents raw MDX from being exposed in static HTML.
   */
  const fetchDecryptedContent = React.useCallback(async () => {
    if (loadingContent) return;
    setLoadingContent(true);
    
    try {
      const res = await fetch(`/api/canon/${encodeURIComponent(doc.slug)}`);
      const json = await res.json();
      if (res.ok && json.source) {
        setSource(json.source);
      }
    } catch (e) {
      console.error("[CANON_DECRYPT_ERROR] Failed to fetch secure payload.");
    } finally {
      setLoadingContent(false);
    }
  }, [doc.slug, loadingContent]);

  // Authorization trigger
  React.useEffect(() => {
    if (isAuthorized && !source && !loadingContent) {
      fetchDecryptedContent();
    }
  }, [isAuthorized, source, fetchDecryptedContent, loadingContent]);

  if (router.isFallback) {
    return (
      <Layout title="Synchronizing...">
        <div className="min-h-screen flex items-center justify-center bg-black">
          <Loader2 className="animate-spin text-gold" size={32} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={doc.title} description={doc.description || doc.excerpt || ""}>
      <Head>
        <link rel="canonical" href={`https://www.abrahamoflondon.org${doc.href}`} />
        <meta name="robots" content={initialLocked ? "noindex, nofollow" : "index, follow"} />
      </Head>

      <section className="min-h-screen bg-black text-white selection:bg-gold/30">
        <CanonHero
          title={doc.title}
          description={doc.description || doc.excerpt || ""}
          coverImage={doc.coverImage}
          category={doc.category || "Institutional Canon"}
          tags={doc.tags || []}
          author={doc.author}
          publishedDate={doc.date}
        />

        <div className="mx-auto max-w-7xl px-6 py-12">
          {/* Metadata Dossier */}
          <BriefSummaryCard 
             category="CANON"
             classification={doc.accessLevel}
             date={doc.date || undefined}
             author={doc.author || undefined}
          />

          <div className="grid lg:grid-cols-4 gap-16 mt-16">
            <main className="lg:col-span-3">
              {!isAuthorized && !isValidating ? (
                <AccessGate
                  title={doc.title}
                  message="This foundational brief is restricted to members of the Inner Circle."
                  requiredTier={doc.accessLevel}
                  onUnlocked={() => verify()}
                  onGoToJoin={() => router.push("/inner-circle")}
                />
              ) : (
                <div className="relative min-h-[400px]">
                  {loadingContent && (
                    <div className="absolute inset-0 flex items-center gap-3 py-12 text-gold animate-pulse z-10 bg-black/50 backdrop-blur-sm">
                      <Loader2 className="animate-spin" size={18} />
                      <span className="font-mono text-[10px] tracking-[0.3em] uppercase italic">
                        Securing Transmission...
                      </span>
                    </div>
                  )}
                  
                  {/* The core rendering engine */}
                  <div className={loadingContent ? "opacity-20 transition-opacity" : "opacity-100 transition-opacity"}>
                    <MDXLayoutRenderer code={source as any} />
                  </div>
                </div>
              )}

              {/* Navigation: Intelligence Chain */}
              <nav className="mt-24 border-t border-white/10 pt-12 flex flex-col sm:flex-row justify-between gap-12">
                {doc.prevDoc && (
                  <a href={doc.prevDoc.href} className="group flex items-center gap-6 max-w-xs text-zinc-500 hover:text-gold transition-colors">
                    <ArrowLeft size={24} className="group-hover:-translate-x-2 transition-transform duration-300" />
                    <div>
                      <span className="block font-mono text-[9px] uppercase tracking-[0.4em] mb-2 text-zinc-600">Previous Entry</span>
                      <span className="text-base font-serif italic leading-snug">{doc.prevDoc.title}</span>
                    </div>
                  </a>
                )}
                {doc.nextDoc && (
                  <a href={doc.nextDoc.href} className="group flex items-center gap-6 max-w-xs text-zinc-500 hover:text-gold transition-colors ml-auto text-right">
                    <div>
                      <span className="block font-mono text-[9px] uppercase tracking-[0.4em] mb-2 text-zinc-600">Next Entry</span>
                      <span className="text-base font-serif italic leading-snug">{doc.nextDoc.title}</span>
                    </div>
                    <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform duration-300" />
                  </a>
                )}
              </nav>
            </main>

            {/* Institutional Sidebar */}
            <aside className="hidden lg:block lg:col-span-1">
              <div className="sticky top-32 p-8 rounded-sm bg-zinc-950/30 border border-white/5 shadow-2xl">
                <h4 className="font-mono text-[9px] uppercase tracking-[0.3em] text-zinc-500 mb-8 pb-4 border-b border-white/5">
                  Brief Context
                </h4>
                <div className="space-y-8">
                  <div>
                    <span className="block text-[10px] text-gold/60 uppercase tracking-widest mb-2 font-mono">Tier</span>
                    <span className="text-xl font-serif italic text-white/90 capitalize">
                      {doc.accessLevel.replace("-", " ")}
                    </span>
                  </div>
                  {doc.tags && (
                    <div>
                      <span className="block text-[10px] text-gold/60 uppercase tracking-widest mb-4 font-mono">Registry Tags</span>
                      <div className="flex flex-wrap gap-2">
                        {doc.tags.map(t => (
                          <span key={t} className="px-2 py-1 bg-white/[0.03] text-[9px] text-white/40 rounded-sm uppercase font-mono border border-white/5">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </Layout>
  );
};

/* -----------------------------------------------------------------------------
  DATA FETCHING
----------------------------------------------------------------------------- */

export const getStaticPaths: GetStaticPaths = async () => {
  const canons = getAllCanons();
  const paths = canons
    .filter((d: any) => !d.draft)
    .map((d: any) => ({
      params: { slug: normalizeSlug(d.slug || d._raw?.flattenedPath || "").replace(/^canon\//, "") }
    }));
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug || "");
  const rawDoc = getDocBySlug(`canon/${slug}`) || getDocBySlug(slug);

  if (!rawDoc || rawDoc.draft) return { notFound: true };

  const accessLevel = (rawDoc.accessLevel || "inner-circle") as Tier;
  const initialLocked = accessLevel !== "public";
  const mdxRaw = (rawDoc.body?.raw || rawDoc.bodyRaw || rawDoc.content || "");

  // Pre-serialize public content only
  let initialSource = null;
  if (!initialLocked) {
    initialSource = await prepareMDX(mdxRaw);
  }

  const all = getAllCanons();
  const idx = all.findIndex((d: any) => normalizeSlug(d.slug || "").includes(slug));
  const prevDocRaw = idx > 0 ? all[idx - 1] : null;
  const nextDocRaw = idx < all.length - 1 ? all[idx + 1] : null;

  const doc: CanonDoc = {
    title: rawDoc.title || "Institutional Brief",
    slug,
    href: joinHref("canon", slug),
    accessLevel,
    date: rawDoc.date ? String(rawDoc.date) : null,
    coverImage: resolveDocCoverImage(rawDoc),
    category: rawDoc.category || null,
    tags: rawDoc.tags || [],
    author: rawDoc.author || "Abraham of London",
    nextDoc: nextDocRaw ? { 
      title: nextDocRaw.title, 
      href: joinHref("canon", normalizeSlug(nextDocRaw.slug).replace(/^canon\//, "")) 
    } : null,
    prevDoc: prevDocRaw ? { 
      title: prevDocRaw.title, 
      href: joinHref("canon", normalizeSlug(prevDocRaw.slug).replace(/^canon\//, "")) 
    } : null,
  };

  return {
    props: sanitizeData({ doc, initialLocked, initialSource, mdxRaw }),
    revalidate: 1800, // 30 minutes for portfolio-wide updates
  };
};

export default CanonSlugPage;