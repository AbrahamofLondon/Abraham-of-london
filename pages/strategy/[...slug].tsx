'use client';

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { 
  ArrowLeft, 
  FileText, 
  Clock, 
  ShieldAlert, 
  Share2, 
  Download,
  Fingerprint
} from "lucide-react";

import Layout from "@/components/Layout";
import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer";
import ClientUnlockRenderer from "@/components/content/ClientUnlockRenderer";

import { getRenderableBody } from "@/lib/content/render-body";
import tiers, { requiredTierFromDoc } from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tiers";

/* -------------------------------------------------------------------------- */
/* UTILITIES                                                                  */
/* -------------------------------------------------------------------------- */

type Props = { item: any; requiredTier: AccessTier };

function jsonSafe<T>(v: T): T {
  return JSON.parse(JSON.stringify(v, (_k, val) => (val === undefined ? null : val)));
}

function joinParamSlug(param: string | string[] | undefined): string {
  if (!param) return "";
  return Array.isArray(param) ? param.join("/") : String(param);
}

function cleanPathish(input: unknown): string {
  return String(input ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

function safeStr(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");

/* -------------------------------------------------------------------------- */
/* COMPONENT                                                                  */
/* -------------------------------------------------------------------------- */

const StrategySlugPage: NextPage<Props> = ({ item, requiredTier }) => {
  const title = safeStr(item?.title, "Intelligence Brief");
  const desc = safeStr(item?.description || item?.excerpt, "Classified Strategy Document");
  const og = safeStr(item?.coverImage, "") || undefined;
  const slug = cleanPathish(item?.slug || "");
  const canonical = `${SITE}/strategy/${encodeURIComponent(slug)}`;
  const isPublic = requiredTier === "public";
  const code = isPublic ? safeStr(item?.bodyCode, "") : "";

  return (
    <Layout title={title} description={desc} ogImage={og} className="bg-[#050505]">
      <Head>
        <link rel="canonical" href={canonical} />
        <meta name="robots" content="index, follow" />
      </Head>

      <main className="relative min-h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-[#8A6A2F]/30">
        {/* TOP NAVIGATION BAR */}
        <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 transition-colors hover:text-[#8A6A2F]"
            >
              <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
              Return to Registry
            </Link>
            
            <div className="flex items-center gap-6">
                <button className="text-zinc-600 hover:text-white transition-colors">
                    <Share2 className="h-3.5 w-3.5" />
                </button>
                <button className="flex items-center gap-2 border border-white/10 bg-white/5 px-3 py-1 text-[9px] font-mono uppercase tracking-widest text-zinc-400 hover:bg-white/10 transition-all">
                    <Download className="h-3 w-3" />
                    Export PDF
                </button>
            </div>
          </div>
        </nav>

        <div className="mx-auto max-w-6xl px-6 pb-24 pt-16 md:px-12">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
            
            {/* LEFT: MAIN CONTENT */}
            <article className="lg:col-span-8">
              <header className="mb-12 space-y-6">
                <div className="flex items-center gap-3">
                    <span className="bg-[#8A6A2F]/10 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-[0.3em] text-[#8A6A2F] border border-[#8A6A2F]/20">
                        {item?.category || "Strategy"}
                    </span>
                    <span className="h-px w-8 bg-zinc-800" />
                    <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-600">
                        Node: {slug.slice(0, 8).toUpperCase()}
                    </span>
                </div>

                <h1 className="font-serif text-5xl font-light leading-[1.1] tracking-tighter text-white md:text-7xl">
                  {title}
                </h1>

                {item?.excerpt && (
                  <p className="border-l border-[#8A6A2F]/40 pl-6 font-serif text-xl italic leading-relaxed text-zinc-400">
                    {item.excerpt}
                  </p>
                )}
              </header>

              {/* MDX RENDERER */}
              <div className="prose prose-invert prose-zinc max-w-none 
                prose-headings:font-serif prose-headings:font-light prose-headings:tracking-tight
                prose-h2:text-3xl prose-h2:border-b prose-h2:border-white/5 prose-h2:pb-4 prose-h2:mt-16
                prose-p:text-zinc-400 prose-p:leading-relaxed prose-p:text-lg
                prose-strong:text-[#8A6A2F] prose-strong:font-medium
                prose-blockquote:border-[#8A6A2F]/50 prose-blockquote:bg-white/[0.02] prose-blockquote:py-1
              ">
                {!isPublic ? (
                  <ClientUnlockRenderer
                    slug={`strategy/${slug}`}
                    requiredTier={requiredTier}
                    initialCode={null}
                    title={title}
                    message="This strategy document requires appropriate access."
                  />
                ) : code ? (
                  <SafeMDXRenderer code={code} />
                ) : (
                  <div className="rounded border border-dashed border-white/10 p-12 text-center text-[10px] font-mono uppercase tracking-widest text-zinc-600">
                    Intelligence body missing or corrupted.
                  </div>
                )}
              </div>
            </article>

            {/* RIGHT: DOSSIER METADATA SIDEBAR */}
            <aside className="lg:col-span-4 lg:sticky lg:top-32 h-fit space-y-8">
              <div className="border border-white/5 bg-white/[0.01] p-6 backdrop-blur-sm">
                <h4 className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">
                    <FileText className="h-3 w-3" />
                    Dossier Metadata
                </h4>

                <div className="space-y-4 font-mono text-[10px] uppercase tracking-widest">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-zinc-600">Authored</span>
                    <span className="text-zinc-300">{new Date(item?.createdAt || Date.now()).toLocaleDateString('en-GB')}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-zinc-600">Classification</span>
                    <span className="text-emerald-500">Sovereign // Clear</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-zinc-600">Reading Time</span>
                    <span className="text-zinc-300">~8 Mins</span>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-[#8A6A2F] bg-[#8A6A2F]/5 border border-[#8A6A2F]/20 p-3">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span className="text-[9px] font-bold tracking-[0.2em] uppercase">Eyes Only Protection</span>
                    </div>
                </div>
              </div>

              <div className="p-6 border border-dashed border-white/5">
                 <h4 className="mb-4 text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-700">Verification Hash</h4>
                 <div className="flex items-start gap-3">
                    <Fingerprint className="h-5 w-5 text-zinc-800" />
                    <code className="break-all text-[8px] leading-relaxed text-zinc-600">
                        {slug.split("").reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0).toString(16).padStart(8, "0")}
                    </code>
                 </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </Layout>
  );
};

/* -------------------------------------------------------------------------- */
/* DATA FETCHING                                                              */
/* -------------------------------------------------------------------------- */

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const { getPublishedStrategies } = await import("@/lib/server/strategies-data");
    const list = await getPublishedStrategies();

    const paths = (list || [])
      .map((s: any) => cleanPathish(s?.slug || ""))
      .filter(Boolean)
      .map((slug) => ({ params: { slug: slug.split("/").filter(Boolean) } }));

    return { paths, fallback: "blocking" };
  } catch {
    return { paths: [], fallback: "blocking" };
  }


};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = cleanPathish(joinParamSlug(params?.slug as any));
  if (!slug) return { notFound: true, revalidate: 300 };

  const { getStrategyBySlug } = await import("@/lib/server/strategies-data");
  const doc = await getStrategyBySlug(slug);

  if (!doc || (doc as any).draft === true || (doc as any).published === false) {
    return { notFound: true, revalidate: 300 };
  }

  const requiredTier = tiers.normalizeRequired(requiredTierFromDoc(doc as any));
  const isPublic = requiredTier === "public";
  const renderBody = getRenderableBody(doc);
  const bodyCode = isPublic ? renderBody.code : "";

  return {
    props: jsonSafe({ item: { ...doc, slug, bodyCode }, requiredTier }),
    revalidate: 1800,
  };


};

export default StrategySlugPage;