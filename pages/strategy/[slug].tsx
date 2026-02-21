/* pages/strategy/[slug].tsx — EXPORT-SAFE (NO BriefViewer, NO router deps) */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ChevronLeft, Download, ShieldCheck } from "lucide-react";

import Layout from "@/components/Layout";
import { getDocBySlug, getAllContentlayerDocs, sanitizeData } from "@/lib/content/server";
import { safeString, safeSplit } from "@/lib/utils/safe-string";

import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import { MDXRemote } from "next-mdx-remote";

// ✅ Import MDX components
import mdxComponents from "@/components/mdx-components";

// -----------------------------
// Types
// -----------------------------
type StrategyDoc = {
  title?: string | null;
  slug?: string | null;
  date?: string | null;
  excerpt?: string | null;
  description?: string | null;
  body?: { raw?: string | null } | null;
  _id?: string | null;
  draft?: boolean | null;
};

type Props = {
  strategy: {
    title: string;
    slug: string;
    date: string | null;
    _id: string;
  };
  source: MDXRemoteSerializeResult | null;
  isPdf: boolean;
  dbMeta: string | null;
  mode: "mdx" | "pdf";
};

// -----------------------------
// Helpers
// -----------------------------
function normalizeSlug(input: unknown): string {
  return safeString(input)
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

function stripStrategyPrefix(slug: string): string {
  let s = normalizeSlug(slug);
  const prefix = "strategy/";
  while (s.toLowerCase().startsWith(prefix)) s = s.slice(prefix.length);
  return normalizeSlug(s);
}

function safeJsonParse<T = any>(raw: unknown, fallback: T): T {
  try {
    const s = safeString(raw);
    if (!s) return fallback;
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}

function formatDateForDisplay(dateIsoLike: unknown): string {
  const s = safeString(dateIsoLike);
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function buildSafeId(slug: string) {
  const s = stripStrategyPrefix(slug);
  return s
    ? `AOL-S-${s.slice(-12).toUpperCase()}`
    : `AOL-S-${Math.random().toString(16).slice(2, 10).toUpperCase()}`;
}

async function serializeMdx(raw: string) {
  const { serialize } = await import("next-mdx-remote/serialize");
  return serialize(raw || " ");
}

// -----------------------------
// Page Component
// -----------------------------
const StrategyDetailPage: NextPage<Props> = ({ strategy, source, isPdf, dbMeta }) => {
  const [progress, setProgress] = React.useState(0);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (isPdf || !mounted) return;

    const handleScroll = () => {
      const doc = document.documentElement;
      const denom = doc.scrollHeight - window.innerHeight;
      const pct = denom > 0 ? (window.scrollY / denom) * 100 : 0;
      setProgress(Math.max(0, Math.min(100, pct)));
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll as any);
  }, [isPdf, mounted]);

  // During SSR/build, show minimal shell
  if (!mounted) {
    return (
      <Layout title="Strategic Dispatch">
        <div className="min-h-screen bg-black" />
      </Layout>
    );
  }

  const meta = safeJsonParse<any>(dbMeta, {});
  const title = safeString(strategy?.title, "Strategic Dispatch");
  const slug = safeString(strategy?.slug, "");
  const dateLabel = formatDateForDisplay(strategy?.date);

  // PDF MODE — Export-safe viewer (NO BriefViewer component)
  if (isPdf) {
    const classification = safeString(meta?.classification, "LEVEL 3");
    const serialNumber = safeString(meta?.institutional_code, buildSafeId(slug));
    const assetUrl = `/api/assets/serve-pdf?id=${encodeURIComponent(slug || strategy?._id || "")}`;

    return (
      <Layout title={`${title} | Strategy Dossier`} description="Strategy dossier (PDF).">
        <Head>
          <meta name="robots" content="noindex, nofollow" />
        </Head>

        <div className="min-h-screen bg-black text-white">
          <div className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/60 backdrop-blur-xl">
            <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between gap-6">
              <div>
                <div className="text-[9px] font-mono uppercase tracking-[0.45em] text-amber-400">
                  {classification} • {serialNumber}
                </div>
                <h1 className="mt-2 text-xl md:text-2xl font-serif italic">{title}</h1>
                <p className="mt-1 text-[11px] text-white/40 font-mono uppercase tracking-widest">
                  {dateLabel}
                </p>
              </div>

              <a
                href={assetUrl}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-[10px] font-black uppercase tracking-[0.35em] text-white/80 hover:border-amber-500/30 hover:text-amber-300 transition-all"
              >
                Open PDF <Download size={14} />
              </a>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-6 py-10">
            <div className="rounded-3xl border border-white/10 overflow-hidden bg-black">
              <iframe title={title} src={assetUrl} className="w-full h-[80vh] bg-black" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // MDX MODE — With components
  return (
    <Layout title={`${title} | Strategy`} description="Strategic dispatch (MDX).">
      <Head>
        <meta name="robots" content="index, follow" />
      </Head>

      <div
        className="fixed top-0 left-0 h-[1px] bg-amber-500 z-[100] transition-all duration-300"
        style={{ width: `${progress}%` }}
      />

      <article className="relative pt-24 md:pt-32 pb-24 md:pb-40 bg-black text-white">
        <div className="max-w-6xl mx-auto px-6 mb-20 md:mb-24">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[9px] font-mono uppercase tracking-widest text-zinc-500 hover:text-amber-300 transition-colors mb-10 md:mb-12"
          >
            <ChevronLeft size={10} /> Return_to_Home
          </Link>

          <div className="grid lg:grid-cols-12 gap-10 md:gap-12 items-end">
            <div className="lg:col-span-8 space-y-7 md:space-y-8">
              <div className="flex items-center gap-4">
                <span className="text-[9px] font-mono uppercase tracking-[0.5em] text-amber-400">
                  Strategic Dispatch
                </span>
                <div className="h-px w-12 bg-amber-500/20" />
                <span className="text-[9px] font-mono text-zinc-600">{buildSafeId(slug)}</span>
              </div>

              <h1 className="font-serif text-4xl md:text-7xl lg:text-8xl font-light text-white tracking-tighter leading-[0.9] italic">
                {title}
              </h1>
            </div>

            <div className="lg:col-span-4 flex justify-end">
              <div className="text-right font-mono text-[9px] text-zinc-500 uppercase tracking-widest space-y-1">
                <p>
                  Classification:{" "}
                  <span className="text-zinc-300 inline-flex items-center gap-1">
                    <ShieldCheck size={12} className="text-amber-400" /> Level 3 Private
                  </span>
                </p>
                <p>
                  Origin: <span className="text-zinc-300">London Terminal</span>
                </p>
                <p>
                  Date: <span className="text-zinc-300">{dateLabel}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-12 gap-14 md:gap-20">
          <aside className="lg:col-span-3 border-r border-white/5">
            <div className="sticky top-32 space-y-10 md:space-y-12 pr-6 md:pr-8">
              <div className="space-y-6">
                <h4 className="text-[9px] font-mono uppercase tracking-[0.3em] text-zinc-700">
                  Briefing_Index
                </h4>
                <nav className="flex flex-col gap-4 font-serif italic text-lg md:text-xl text-zinc-500">
                  <a href="#overview" className="hover:text-amber-300 transition-colors">
                    Strategic_Overview
                  </a>
                  <a href="#analysis" className="hover:text-amber-300 transition-colors">
                    Core_Analysis
                  </a>
                  <a href="#implementation" className="hover:text-amber-300 transition-colors">
                    Execution_Logic
                  </a>
                </nav>
              </div>

              <div className="pt-8 border-t border-white/5">
                <Link
                  href={`/downloads?ref=${encodeURIComponent(slug)}`}
                  className="inline-flex items-center justify-between w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[10px] font-mono uppercase tracking-[0.25em] text-white/70 hover:border-amber-500/30 hover:text-amber-300 transition-all"
                >
                  <span>Downloads</span>
                  <Download size={14} />
                </Link>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-9">
            <div className="prose prose-invert max-w-none">
              {source ? (
                // ✅ MDXRemote with components
                <MDXRemote {...source} components={mdxComponents} />
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-white/60">
                  This dispatch has no MDX body available.
                </div>
              )}
            </div>
          </main>
        </div>
      </article>
    </Layout>
  );
};

// -----------------------------
// SSG
// -----------------------------
export const getStaticPaths: GetStaticPaths = async () => {
  const docs = getAllContentlayerDocs() || [];

  const paths = (docs as any[])
    .map((d: any) => {
      const raw = safeString(d?.slug || d?._raw?.flattenedPath || "");
      const bare = stripStrategyPrefix(raw);
      if (!bare) return null;
      const last = safeSplit(bare, "/").filter(Boolean).pop() || "";
      if (!last) return null;
      return { params: { slug: last } };
    })
    .filter(Boolean) as { params: { slug: string } }[];

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const incoming = safeString(params?.slug || "");
  const slugBare = stripStrategyPrefix(incoming);
  if (!slugBare) return { notFound: true };

  const strategyRaw: StrategyDoc | null = (getDocBySlug(`strategy/${slugBare}`) ||
    getDocBySlug(slugBare) ||
    null) as any;

  if (!strategyRaw || strategyRaw?.draft) return { notFound: true };

  // Your real PDF detection can live here (DB metadata, frontmatter, etc.)
  const isPdf = false;
  const mode: Props["mode"] = isPdf ? "pdf" : "mdx";

  let source: MDXRemoteSerializeResult | null = null;
  if (!isPdf) {
    const rawBody = safeString(strategyRaw?.body?.raw || "");
    source = await serializeMdx(rawBody || " ");
  }

  const title = safeString(strategyRaw?.title || "Strategic Dispatch");
  const date = safeString(strategyRaw?.date || "", "") || null;

  return {
    props: sanitizeData({
      strategy: {
        title,
        slug: slugBare,
        date,
        _id: safeString(strategyRaw?._id || `strategy:${slugBare}`),
      },
      source,
      isPdf,
      dbMeta: null,
      mode,
    }),
    revalidate: 3600,
  };
};

export default StrategyDetailPage;