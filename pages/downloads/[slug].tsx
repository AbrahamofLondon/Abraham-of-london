/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/downloads/[slug].tsx — INSTITUTIONAL GRADE (SSR-Only, Router-Free, Luxe)

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import {
  ArrowLeft,
  Download,
  Lock,
  Shield,
  Calendar,
  FileText,
  Layers,
  Eye,
  BookOpen,
  ChevronRight,
  Sparkles,
  AlertCircle
} from "lucide-react";

import mdxComponents from "@/components/mdx-components";
import { createSeededSafeMdxComponents } from "@/lib/mdx/safe-components";
import { getDownloads } from "@/lib/content/server";
import { sanitizeData } from "@/lib/content/shared";

/* -----------------------------------------------------------------------------
  TYPES
----------------------------------------------------------------------------- */
type Tier = "public" | "inner-circle" | "private";

interface DownloadDTO {
  title: string;
  excerpt: string | null;
  description: string | null;
  slug: string;
  href: string;
  accessLevel: Tier;
  fileUrl: string | null;
  date: string | null;
  coverImage: string | null;
  category: string | null;
  size: string | null;
  pageCount: number | null;
}

interface Props {
  download: DownloadDTO;
  locked: boolean;
  initialSource: MDXRemoteSerializeResult | null;
  mdxRaw: string;
}

/* -----------------------------------------------------------------------------
  DEFENSIVE HELPERS
----------------------------------------------------------------------------- */
const normalizeSlug = (s: string) => String(s || "").replace(/^\/+|\/+$/g, "").trim();
const stripPrefix = (s: string) => normalizeSlug(s).replace(/^downloads\//, "");

function getRawBody(doc: any): string {
  return doc?.body?.raw || doc?.content || doc?.body || "";
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "";
  try {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  } catch {
    return "";
  }
}

/* -----------------------------------------------------------------------------
  LUXURY LOCK GATE COMPONENT
----------------------------------------------------------------------------- */
function LockGate({
  title,
  tier,
  onUnlock,
  busy,
  error
}: {
  title: string;
  tier: Tier;
  onUnlock: () => void;
  busy: boolean;
  error?: string | null;
}) {
  const tierLabels = {
    public: "Public Access",
    "inner-circle": "Inner Circle",
    private: "Private Archive"
  };

  const tierColors = {
    public: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20",
    "inner-circle": "from-amber-500/20 to-amber-500/5 border-amber-500/20",
    private: "from-rose-500/20 to-rose-500/5 border-rose-500/20"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`relative overflow-hidden rounded-3xl border bg-gradient-to-br ${tierColors[tier]} backdrop-blur-sm p-10`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.02),transparent_70%)]" />
      
      <div className="relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <Lock className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-400">
              {tierLabels[tier]}
            </span>
          </div>
        </div>

        <h2 className="font-serif text-3xl text-white mb-4 italic">
          {title}
        </h2>

        <p className="text-white/50 text-sm leading-relaxed max-w-xl mb-8">
          This document requires elevated clearance. Verify your credentials to access the full intelligence.
        </p>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="text-sm">{error}</span>
          </motion.div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={busy}
            onClick={onUnlock}
            className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-black hover:shadow-[0_0_30px_-8px_rgba(245,158,11,0.5)] transition-all disabled:opacity-40"
          >
            <span className="relative z-10 flex items-center gap-3">
              {busy ? (
                <>
                  <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Verifying Credentials
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  Unlock Document
                </>
              )}
            </span>
          </motion.button>

          <Link
            href="/inner-circle"
            className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/70 hover:text-white hover:border-amber-500/30 transition-all"
          >
            <span className="flex items-center gap-3">
              <Sparkles className="h-4 w-4" />
              Join Inner Circle
              <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/* -----------------------------------------------------------------------------
  METADATA CARD COMPONENT
----------------------------------------------------------------------------- */
function MetadataCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | null }) {
  if (!value) return null;
  
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5">
      <Icon className="h-4 w-4 text-amber-400/70" />
      <div>
        <div className="text-[9px] font-mono uppercase tracking-wider text-white/30">{label}</div>
        <div className="text-sm text-white/80 font-medium">{value}</div>
      </div>
    </div>
  );
}

/* -----------------------------------------------------------------------------
  PAGE COMPONENT
----------------------------------------------------------------------------- */
const DownloadSlugPage: NextPage<Props> = ({ download, locked, initialSource, mdxRaw }) => {
  const [mounted, setMounted] = React.useState(false);
  const [source, setSource] = React.useState<MDXRemoteSerializeResult | null>(initialSource);
  const [loading, setLoading] = React.useState(false);
  const [unlockError, setUnlockError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const safeComponents = React.useMemo(
    () =>
      createSeededSafeMdxComponents(mdxComponents, mdxRaw, {
        seeded: {},
      }),
    [mdxRaw]
  );

  const handleUnlock = React.useCallback(async () => {
    setLoading(true);
    setUnlockError(null);
    try {
      const res = await fetch(`/api/downloads/${encodeURIComponent(download.slug)}`);
      const data = await res.json().catch(() => null);
      
      if (!res.ok) {
        setUnlockError(data?.error || "Access denied. Please verify your credentials.");
        return;
      }
      
      if (data?.ok && data?.source) {
        setSource(data.source);
      } else {
        setUnlockError("Invalid response from server.");
      }
    } catch (err) {
      setUnlockError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [download.slug]);

  const robots = locked && !source ? "noindex,nofollow" : "index,follow";
  const formattedDate = formatDate(download.date);

  // During SSR, show minimal shell
  if (!mounted) {
    return (
      <>
        <Head>
          <title>{download.title} | Abraham of London</title>
          <meta name="robots" content={robots} />
        </Head>
        <div className="min-h-screen bg-black" />
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{download.title} | Abraham of London</title>
        <meta name="description" content={download.excerpt || download.description || ""} />
        <meta name="robots" content={robots} />
        <link rel="canonical" href={`https://www.abrahamoflondon.org${download.href}`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={download.title} />
        <meta property="og:description" content={download.excerpt || download.description || ""} />
        {download.coverImage && <meta property="og:image" content={download.coverImage} />}
        <meta property="og:type" content="article" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={download.title} />
        <meta name="twitter:description" content={download.excerpt || download.description || ""} />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">
        {/* Navigation */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="border-b border-white/5 bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-40"
        >
          <div className="mx-auto max-w-7xl px-6 py-4">
            <Link
              href="/downloads"
              className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-white/40 hover:text-amber-400 transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span>Return to Vault</span>
            </Link>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-6 py-16 lg:py-24">
          <div className="grid lg:grid-cols-3 gap-16">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-16">
              {/* Header */}
              <motion.header
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  {download.category && (
                    <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono uppercase tracking-wider">
                      {download.category}
                    </span>
                  )}
                  <span className="text-[10px] font-mono uppercase tracking-wider text-white/30">
                    {download.accessLevel.replace('-', ' ')} Clearance
                  </span>
                </div>

                <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight italic">
                  {download.title}
                </h1>

                {download.excerpt && (
                  <p className="mt-8 text-lg text-white/60 leading-relaxed border-l-2 border-amber-500/30 pl-6">
                    {download.excerpt}
                  </p>
                )}
              </motion.header>

              {/* Content */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                {locked && !source ? (
                  <div className="space-y-8">
                    <LockGate 
                      title={download.title} 
                      tier={download.accessLevel} 
                      onUnlock={handleUnlock} 
                      busy={loading}
                      error={unlockError}
                    />

                    {download.description && (
                      <div className="prose prose-invert max-w-none prose-p:text-white/50 prose-p:leading-relaxed bg-white/[0.02] p-8 rounded-2xl border border-white/5">
                        <h3 className="text-amber-400 font-mono text-xs uppercase tracking-wider mb-4">
                          Abstract
                        </h3>
                        <p className="text-white/70">{download.description}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  source && (
                    <article className="prose prose-invert prose-amber max-w-none">
                      <MDXRemote {...source} components={safeComponents as any} />
                    </article>
                  )
                )}
              </motion.div>
            </div>

            {/* Sidebar */}
            <motion.aside
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="lg:col-span-1"
            >
              <div className="sticky top-32 space-y-6">
                {/* Download Card */}
                {download.fileUrl && !locked && source && (
                  <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-2xl p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 rounded-xl bg-amber-500/20">
                        <Download className="h-5 w-5 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="font-mono text-xs uppercase tracking-wider text-white/70">
                          Asset
                        </h3>
                        <p className="text-sm font-medium">Ready for download</p>
                      </div>
                    </div>

                    <a
                      href={download.fileUrl}
                      className="group relative overflow-hidden w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-black hover:shadow-[0_0_30px_-8px_rgba(245,158,11,0.5)] transition-all flex items-center justify-center gap-3"
                    >
                      <Download className="h-4 w-4" />
                      Download Asset
                      <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </div>
                )}

                {/* Metadata */}
                <div className="bg-white/5 border border-white/5 rounded-2xl p-8 space-y-4">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-white/30 mb-4">
                    Document Information
                  </h3>
                  
                  <MetadataCard icon={Calendar} label="Date" value={formattedDate} />
                  <MetadataCard icon={FileText} label="Pages" value={download.pageCount ? `${download.pageCount}` : null} />
                  <MetadataCard icon={Layers} label="Size" value={download.size} />
                  <MetadataCard icon={Eye} label="Access Level" value={download.accessLevel.replace('-', ' ')} />
                  
                  {download.coverImage && (
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <img 
                        src={download.coverImage} 
                        alt={download.title}
                        className="w-full rounded-xl border border-white/10"
                      />
                    </div>
                  )}
                </div>

                {/* Related Link */}
                <Link
                  href="/downloads"
                  className="group flex items-center justify-between w-full bg-white/5 border border-white/5 rounded-xl p-4 hover:border-amber-500/30 transition-all"
                >
                  <span className="flex items-center gap-3">
                    <BookOpen className="h-4 w-4 text-amber-400/50" />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-white/50">
                      Browse Vault
                    </span>
                  </span>
                  <ChevronRight className="h-3 w-3 text-white/30 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.aside>
          </div>
        </div>
      </div>
    </>
  );
};

/* -----------------------------------------------------------------------------
  SSR-ONLY — PREVENTS STATIC GENERATION ENTIRELY
----------------------------------------------------------------------------- */
export const getServerSideProps: GetServerSideProps<Props> = async ({ params }) => {
  try {
    const slug = stripPrefix(String(params?.slug || ""));
    const allDocuments = getDownloads() || [];

    const doc = allDocuments.find((d: any) => {
      const dSlug = normalizeSlug(d.slug || d._raw?.flattenedPath || "");
      return dSlug.endsWith(slug);
    });

    if (!doc || doc.draft) return { notFound: true };

    const mdxRaw = getRawBody(doc);
    const accessLevel = (doc.accessLevel || "inner-circle") as Tier;
    const locked = accessLevel !== "public";

    let initialSource: MDXRemoteSerializeResult | null = null;
    if (!locked && mdxRaw.trim()) {
      initialSource = await serialize(mdxRaw, {
        mdxOptions: { remarkPlugins: [remarkGfm], rehypePlugins: [rehypeSlug] },
      });
    }

    const dto: DownloadDTO = {
      title: String(doc.title || "Untitled Brief"),
      excerpt: doc.excerpt || null,
      description: doc.description || null,
      slug,
      href: `/downloads/${slug}`,
      accessLevel,
      fileUrl: doc.fileUrl || doc.downloadUrl || null,
      date: doc.date ? String(doc.date) : null,
      coverImage: doc.coverImage || null,
      category: doc.category || "General Intelligence",
      size: doc.size || null,
      pageCount: doc.pageCount ? Number(doc.pageCount) : null,
    };

    return {
      props: sanitizeData({ download: dto, locked, initialSource, mdxRaw }),
    };
  } catch (error) {
    console.error("[Download SSR Error]:", error);
    return { notFound: true };
  }
};

export default DownloadSlugPage;