/* pages/resources/strategic-frameworks/[slug].tsx */
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { ArrowLeft, Lock, Key, Eye, Shield, Activity, Download, Printer } from "lucide-react";

import Layout from "@/components/Layout";
import { withUnifiedAuth } from "@/lib/auth/withUnifiedAuth";
import { DecisionMemo } from "@/components/Frameworks/DecisionMemo";
import { AuditLog } from "@/components/Frameworks/AuditLog";

import {
  LIBRARY_HREF,
  getAllFrameworkSlugs,
  getFrameworkBySlug,
  type Framework,
} from "@/lib/resources/strategic-frameworks";

import type { User } from "@/types/auth";
import type { InnerCircleAccess } from "@/lib/inner-circle/access.client";

/* -------------------------------------------------------------------------- */
/* UTIL & DESIGN SYSTEM                                                       */
/* -------------------------------------------------------------------------- */

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");

function canonicalFor(slug: string) {
  return `${SITE}/resources/strategic-frameworks/${slug}`;
}

function accentClass(accent: Framework["accent"]) {
  const map = {
    gold: "border-amber-500/25 bg-amber-500/10 text-amber-200",
    emerald: "border-emerald-500/25 bg-emerald-500/10 text-emerald-200",
    blue: "border-sky-500/25 bg-sky-500/10 text-sky-200",
    rose: "border-rose-500/25 bg-rose-500/10 text-rose-200",
    indigo: "border-indigo-500/25 bg-indigo-500/10 text-indigo-200",
  };
  return map[accent] || map.gold;
}

/* -------------------------------------------------------------------------- */
/* PUBLIC VIEW (SEO LAYER)                                                    */
/* -------------------------------------------------------------------------- */

const PublicFrameworkView: React.FC<{ framework: Framework; hidden?: boolean }> = ({ framework, hidden }) => {
  return (
    <div className={hidden ? "hidden" : "block"}>
      <Layout title={`${framework.title} | Strategic Framework`} description={framework.oneLiner} className="bg-black min-h-screen">
        <Head><link rel="canonical" href={canonicalFor(framework.slug)} /></Head>
        
        <div className="border-b border-white/10 py-4">
          <div className="mx-auto max-w-7xl px-4">
            <Link href={LIBRARY_HREF} className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors">
              <ArrowLeft size={16} /> Back to Library
            </Link>
          </div>
        </div>

        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.05),transparent_50%)]" />
          <div className="relative mx-auto max-w-7xl px-4 flex flex-col items-center text-center">
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-amber-500/30 bg-amber-500/10 px-6 py-2 text-amber-200 text-[10px] font-black uppercase tracking-[0.3em]">
              <Lock size={14} /> Dossier Protected
            </div>
            <h1 className="font-serif text-5xl md:text-7xl font-bold text-white mb-6 uppercase tracking-tighter">
              {framework.title}
            </h1>
            <p className="max-w-2xl text-xl text-white/70 leading-relaxed mb-12">
              {framework.oneLiner}
            </p>
            <Link href="/login" className="bg-white text-black px-10 py-4 rounded-full font-black uppercase tracking-widest hover:bg-amber-500 transition-all">
              Unlock Full Intelligence
            </Link>
          </div>
        </section>
      </Layout>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* PRIVATE VIEW (INTELLIGENCE LAYER)                                          */
/* -------------------------------------------------------------------------- */

const PrivateFrameworkView: React.FC<PrivatePageProps> = ({ framework, user, innerCircleAccess, onPrivateReady }) => {
  const hasAccess = Boolean(innerCircleAccess?.hasAccess) || user?.role === "admin" || user?.role === "editor";

  React.useEffect(() => {
    if (hasAccess) onPrivateReady?.();
  }, [hasAccess, onPrivateReady]);

  if (!hasAccess) return null;

  return (
    <Layout title={`${framework.title} | Strategic Briefing`} className="bg-black min-h-screen print:bg-white">
      <Head><meta name="robots" content="noindex,nofollow" /></Head>

      {/* 1. Decision Memo Engine (Print Secret Layer) */}
      <div className="print:block hidden">
        <DecisionMemo framework={framework} />
      </div>

      <div className="print:hidden">
        {/* Navigation / Header */}
        <div className="border-b border-white/5 bg-zinc-900/20 backdrop-blur-md sticky top-0 z-50">
          <div className="mx-auto max-w-7xl px-4 py-3 flex justify-between items-center">
             <div className="flex items-center gap-4">
               <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Live_Dossier_Active</span>
             </div>
             <div className="flex items-center gap-6">
               <span className="text-xs font-bold text-amber-500 uppercase tracking-tighter">{user?.name} // {user?.role}</span>
               <Link href={LIBRARY_HREF} className="text-white/60 hover:text-white text-xs uppercase font-bold tracking-widest">Close Brief</Link>
             </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-16 grid lg:grid-cols-4 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-20">
            <header>
              <span className={`inline-flex items-center rounded-full border px-4 py-1 text-[10px] font-black uppercase tracking-[0.2em] mb-6 ${accentClass(framework.accent)}`}>
                {framework.tag}
              </span>
              <h1 className="font-serif text-6xl font-bold text-white mb-6 uppercase leading-none">{framework.title}</h1>
              <p className="text-2xl text-white/60 font-serif italic border-l-2 border-amber-500/40 pl-8 py-2">"{framework.oneLiner}"</p>
            </header>

            {/* Decision Memo Component (Screen View) */}
            <DecisionMemo framework={framework} />

            {/* Structured Content Sections */}
            <section>
              <h2 className="text-sm font-black text-amber-500 uppercase tracking-[0.4em] mb-8 flex items-center gap-4">
                <span className="h-px bg-amber-500/20 flex-1" /> Operating Logic <Activity size={14} />
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {framework.operatingLogic?.map((logic, i) => (
                  <div key={i} className="bg-zinc-900/50 border border-white/5 p-8 rounded-2xl hover:border-amber-500/30 transition-colors group">
                    <h3 className="text-white font-bold text-lg mb-4 uppercase tracking-tight group-hover:text-amber-200 transition-colors">{logic.title}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">{logic.body}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Board Questions */}
            <section className="bg-amber-500/5 border border-amber-500/10 rounded-3xl p-10">
              <h2 className="text-white font-bold text-2xl mb-8 flex items-center gap-3">
                <Shield className="text-amber-500" /> Fiduciary Inquiries
              </h2>
              <div className="space-y-4">
                {framework.boardQuestions?.map((q, i) => (
                  <div key={i} className="flex gap-4 text-zinc-300 text-lg font-serif italic border-b border-white/5 pb-4 last:border-0">
                    <span className="text-amber-500 font-mono text-sm tracking-tighter">Q_{i+1}</span>
                    <p>{q}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar Intelligence */}
          <aside className="space-y-8">
            <div className="sticky top-24 space-y-6">
              <AuditLog slug={framework.slug} userName={user?.name || "Anonymous"} />
              
              <div className="bg-zinc-900/40 border border-white/5 rounded-xl p-6">
                <h4 className="text-white text-xs font-black uppercase tracking-widest mb-4">Metadata</h4>
                <div className="space-y-4">
                   <div>
                     <span className="block text-[10px] text-zinc-500 uppercase">Institutional Tier</span>
                     <span className="text-amber-200 text-sm font-bold uppercase">{framework.tier.join(" + ")}</span>
                   </div>
                   <div>
                     <span className="block text-[10px] text-zinc-500 uppercase">Canon Root</span>
                     <span className="text-zinc-300 text-sm italic">"{framework.canonRoot}"</span>
                   </div>
                </div>
              </div>

              {framework.artifactHref && (
                <a href={framework.artifactHref} className="flex items-center justify-between w-full bg-white text-black p-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 transition-all">
                  <span>Download Package</span>
                  <Download size={16} />
                </a>
              )}
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
};

/* -------------------------------------------------------------------------- */
/* PROTECTED SHELL & PAGE EXPORTS                                             */
/* -------------------------------------------------------------------------- */

const ProtectedShell = dynamic(async () => {
  return (props: PrivatePageProps) => {
    const ProtectedComponent = withUnifiedAuth(PrivateFrameworkView, {
      requiredRole: "inner-circle",
      fallbackComponent: () => null,
      publicFallback: true,
    });
    return <ProtectedComponent {...props} />;
  };
}, { ssr: false });

const FrameworkDetailPage: NextPage<PublicPageProps> = (props) => {
  const [privateReady, setPrivateReady] = React.useState(false);
  const router = useRouter();

  if (router.isFallback) return <div className="bg-black min-h-screen p-20 text-white font-mono uppercase tracking-[0.5em] animate-pulse">Loading_Dossier...</div>;

  return (
    <>
      <PublicFrameworkView framework={props.framework} hidden={privateReady} />
      <ProtectedShell {...(props as PrivatePageProps)} onPrivateReady={() => setPrivateReady(true)} />
    </>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = getAllFrameworkSlugs();
  return {
    paths: slugs.map((slug) => ({ params: { slug: String(slug).trim() } })),
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps<PublicPageProps> = async ({ params }) => {
  const slug = String(params?.slug || "").trim();
  const framework = getFrameworkBySlug(slug);
  if (!framework) return { notFound: true };
  return {
    props: { framework: JSON.parse(JSON.stringify(framework)) },
    revalidate: 3600,
  };
};

export default FrameworkDetailPage;