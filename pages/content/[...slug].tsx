// pages/content/[...slug].tsx — PREMIUM PRODUCTION (Router-Safe, Sovereign)
// — VAULT CONTENT DETAIL (Pages Router) — INSTITUTIONAL / NETLIFY-RESILIENT

/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";

import Layout from "@/components/Layout";
import AccessGate from "@/components/AccessGate";
import { BriefSummaryCard } from "@/components/mdx/BriefSummaryCard";
import { MDXLayoutRenderer } from "@/components/mdx/MDXLayoutRenderer";

import { useAccess } from "@/hooks/useAccess";
import { useClientRouter, useClientQuery, useClientIsReady } from "@/lib/router/useClientRouter";

// ✅ Contentlayer/server-only utilities (no DB)
import { getPublishedDocuments, getDocBySlug, normalizeSlug, sanitizeData } from "@/lib/content/server";
import { getDocKind, getDocHref } from "@/lib/content/shared";
import { prepareMDX } from "@/lib/server/md-utils";

import { ArrowLeft, Calendar, Clock, Loader2, Tag, FileText, Shield } from "lucide-react";

/* -----------------------------------------------------------------------------
  TYPES
----------------------------------------------------------------------------- */
type Tier = "public" | "inner-circle" | "private";

type VaultDoc = {
  title: string;
  excerpt?: string | null;
  description?: string | null;
  slug: string; // bare: "canon/..." OR "blog/..." etc
  href: string; // ALWAYS "/content/<slug>"
  accessLevel: Tier;
  date?: string | null;
  category?: string | null;
  tags?: string[];
  author?: string | null;
  kind?: string | null;
};

interface Props {
  doc: VaultDoc;
  initialLocked: boolean;
  initialSource: MDXRemoteSerializeResult | null;
  mdxRaw: string;
}

/* -----------------------------------------------------------------------------
  SLUG HYGIENE
----------------------------------------------------------------------------- */
function stripContentPrefix(input: string): string {
  let s = normalizeSlug(String(input || ""));
  const prefix = "content/";
  while (s.toLowerCase().startsWith(prefix)) s = s.slice(prefix.length);
  return normalizeSlug(s);
}

function joinSlugParam(param: string | string[] | undefined): string {
  if (!param) return "";
  const parts = Array.isArray(param) ? param : [param];
  return stripContentPrefix(parts.join("/"));
}

function safeStr(v: any): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function getRawBody(doc: any): string {
  return doc?.body?.raw || doc?.bodyRaw || doc?.content || doc?.body || "";
}

function pickTier(doc: any): Tier {
  const t = String(doc?.accessLevel || doc?.tier || doc?.access || "").toLowerCase().trim();
  if (t === "public" || t === "inner-circle" || t === "private") return t as Tier;
  return "inner-circle";
}

function ensureContentHref(doc: any): string {
  const href = safeStr(getDocHref(doc) || "");
  if (href.startsWith("/content/")) return href;

  const fp = stripContentPrefix(safeStr(doc?.slug || doc?._raw?.flattenedPath || ""));
  return fp ? `/content/${fp}` : "";
}

/* -----------------------------------------------------------------------------
  PAGE COMPONENT
----------------------------------------------------------------------------- */
const ContentSlugPage: NextPage<Props> = ({ doc, initialLocked, initialSource }) => {
  // ✅ Router-safe hooks
  const router = useClientRouter();
  const query = useClientQuery();
  const isReady = useClientIsReady();

  const { hasClearance, verify, isValidating } = useAccess();

  const [source, setSource] = React.useState<MDXRemoteSerializeResult | null>(initialSource);
  const [loadingContent, setLoadingContent] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthorized = hasClearance(doc.accessLevel);

  const fetchSecureContent = React.useCallback(async () => {
    if (loadingContent || source) return;
    setLoadingContent(true);

    try {
      const res = await fetch(`/api/content/${encodeURIComponent(doc.slug)}`);
      const json = await res.json();
      if (res.ok && json?.source) setSource(json.source);
    } catch {
      console.error("[CONTENT_DECRYPT_ERROR] Failed to fetch secure payload.");
    } finally {
      setLoadingContent(false);
    }
  }, [doc.slug, loadingContent, source]);

  React.useEffect(() => {
    if (isAuthorized && initialLocked && !source && mounted) {
      fetchSecureContent();
    }
  }, [isAuthorized, initialLocked, source, fetchSecureContent, mounted]);

  // ✅ Early return during SSR/prerender
  if (!router) {
    return (
      <Layout title={doc.title}>
        <div className="min-h-screen bg-black" />
      </Layout>
    );
  }

  const description = doc.description || doc.excerpt || "";
  const canonical = `https://www.abrahamoflondon.org${doc.href}`;

  return (
    <Layout title={doc.title} description={description}>
      <Head>
        <link rel="canonical" href={canonical} />
        <meta name="robots" content={initialLocked ? "noindex, nofollow" : "index, follow"} />
      </Head>

      <section className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white selection:bg-amber-500/30">
        {/* Header */}
        <header className="border-b border-white/5 bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="mx-auto max-w-7xl px-6 pt-20 pb-12">
            <Link
              href="/content"
              className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.35em] text-white/45 hover:text-amber-300 transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
              <span>Back to Vault Index</span>
            </Link>

            <div className="mt-10 flex flex-col gap-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 backdrop-blur-sm">
                  <FileText className="h-4 w-4 text-amber-400" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/55">
                    {doc.category || doc.kind || "Vault Document"}
                  </span>
                </span>

                {doc.date && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 backdrop-blur-sm">
                    <Calendar className="h-4 w-4 text-white/45" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/45">
                      {new Date(doc.date).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </span>
                )}

                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 backdrop-blur-sm">
                  <Shield className="h-4 w-4 text-amber-500/60" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.35em] text-amber-500/60">
                    {doc.accessLevel}
                  </span>
                </span>
              </div>

              <h1 className="text-4xl md:text-6xl font-serif italic text-white/95 leading-tight tracking-tight">
                {doc.title}
              </h1>

              {description && (
                <p className="max-w-3xl text-white/45 leading-relaxed text-lg border-l-4 border-amber-500/30 pl-6">
                  {description}
                </p>
              )}

              {doc.tags && doc.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {doc.tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 backdrop-blur-sm"
                    >
                      <Tag className="h-3.5 w-3.5 text-white/35" />
                      <span className="text-[9px] font-mono uppercase tracking-[0.28em] text-white/40">
                        {t}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-6 py-12">
          <BriefSummaryCard
            category={(doc.kind || "CONTENT").toUpperCase()}
            classification={doc.accessLevel}
            date={doc.date || undefined}
            author={doc.author || undefined}
          />

          <div className="grid lg:grid-cols-4 gap-16 mt-16">
            <main className="lg:col-span-3">
              {!isAuthorized && !isValidating ? (
                <div className="relative min-h-[400px]">
                  <AccessGate
                    title={doc.title}
                    message="This vault document is classified. Elevate clearance to unlock the full transmission."
                    requiredTier={doc.accessLevel}
                    onUnlocked={() => verify()}
                    onGoToJoin={() => router.push("/inner-circle")}
                  />
                </div>
              ) : (
                <div className="relative min-h-[400px]">
                  {loadingContent && (
                    <div className="absolute inset-0 flex items-center justify-center gap-3 py-12 text-amber-500 z-10 bg-black/80 backdrop-blur-sm rounded-2xl">
                      <Loader2 className="animate-spin" size={18} />
                      <span className="font-mono text-[10px] tracking-[0.3em] uppercase italic">
                        Securing Transmission...
                      </span>
                    </div>
                  )}

                  <div 
                    className={[
                      "transition-all duration-700",
                      loadingContent ? "opacity-20 blur-sm" : "opacity-100"
                    ].join(" ")}
                  >
                    {source ? (
                      <div className="prose prose-invert prose-amber max-w-none">
                        <MDXLayoutRenderer source={source as any} />
                      </div>
                    ) : (
                      <div className="text-white/40 text-center py-20 border border-dashed border-white/10 rounded-2xl">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>No content available</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </main>

            <aside className="hidden lg:block lg:col-span-1">
              <div className="sticky top-32 p-8 border border-white/5 bg-zinc-950/50 backdrop-blur-sm shadow-2xl rounded-2xl">
                <h4 className="font-mono text-[9px] uppercase tracking-[0.3em] text-zinc-500 mb-8 pb-4 border-b border-white/5">
                  Registry Context
                </h4>

                <div className="space-y-8">
                  <div>
                    <span className="block text-[10px] text-amber-500/60 uppercase tracking-widest mb-2 font-mono">
                      Tier
                    </span>
                    <span className="text-xl font-serif italic text-white/90 capitalize">
                      {doc.accessLevel.replace("-", " ")}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] text-amber-500/60 uppercase tracking-widest mb-2 font-mono">
                      Path
                    </span>
                    <span className="block font-mono text-[10px] uppercase tracking-[0.25em] text-white/35 break-words">
                      {doc.href.replace(/^\//, "").replace(/\//g, " · ")}
                    </span>
                  </div>

                  {doc.tags && doc.tags.length > 0 && (
                    <div>
                      <span className="block text-[10px] text-amber-500/60 uppercase tracking-widest mb-4 font-mono">
                        Registry Tags
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {doc.tags.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-1 bg-white/[0.03] text-[9px] text-white/40 border border-white/5 uppercase font-mono rounded"
                          >
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
  ROUTING & DATA
----------------------------------------------------------------------------- */
export const getStaticPaths: GetStaticPaths = async () => {
  const docs = getPublishedDocuments() || [];

  const paths = docs
    .map((d: any) => {
      const href = safeStr(getDocHref(d) || "");
      if (!href.startsWith("/content/")) return null;

      const raw = safeStr(d?.slug || d?._raw?.flattenedPath || "");
      const bare = stripContentPrefix(raw);
      if (!bare) return null;

      return { params: { slug: bare.split("/").filter(Boolean) } };
    })
    .filter(Boolean) as { params: { slug: string[] } }[];

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const incoming = joinSlugParam(params?.slug as any);
  if (!incoming) return { notFound: true };

  const rawDoc =
    getDocBySlug(`content/${incoming}`) ||
    getDocBySlug(incoming) ||
    getDocBySlug(`content/content/${incoming}`);

  if (!rawDoc || rawDoc?.draft) return { notFound: true };

  const href = ensureContentHref(rawDoc);
  if (!href.startsWith("/content/")) return { notFound: true };

  const accessLevel = pickTier(rawDoc);
  const initialLocked = accessLevel !== "public";

  const mdxRaw = getRawBody(rawDoc);
  let initialSource: MDXRemoteSerializeResult | null = null;

  if (!initialLocked) {
    initialSource = await prepareMDX(mdxRaw || " ");
  }

  const doc: VaultDoc = {
    title: safeStr(rawDoc.title || "Vault Document"),
    excerpt: safeStr(rawDoc.excerpt || "") || null,
    description: safeStr(rawDoc.description || "") || null,
    slug: incoming,
    href: `/content/${incoming}`,
    accessLevel,
    date: rawDoc.date ? String(rawDoc.date) : null,
    category: safeStr(rawDoc.category || "") || null,
    tags: Array.isArray(rawDoc.tags) ? rawDoc.tags : [],
    author: safeStr(rawDoc.author || "") || "Abraham of London",
    kind: safeStr(getDocKind(rawDoc) || "") || null,
  };

  return {
    props: sanitizeData({
      doc,
      initialLocked,
      initialSource: initialLocked ? null : initialSource,
      mdxRaw,
    }),
    revalidate: 1800,
  };
};

export default ContentSlugPage;