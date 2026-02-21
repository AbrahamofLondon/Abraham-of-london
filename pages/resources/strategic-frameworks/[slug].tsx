/* pages/resources/strategic-frameworks/[slug].tsx — INSTITUTIONAL GRADE (ROUTER-SAFE) */
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, Lock, Eye, Shield, Activity, Download, Printer, ChevronRight } from "lucide-react";

import Layout from "@/components/Layout";
import { DecisionMemo } from "@/components/Frameworks/DecisionMemo";
import { AuditLog } from "@/components/Frameworks/AuditLog";
import { useClientRouter, useClientQuery, useClientIsReady } from "@/lib/router/useClientRouter";

import {
  LIBRARY_HREF,
  getAllFrameworkSlugs,
  getFrameworkBySlug,
  type Framework,
} from "@/lib/resources/strategic-frameworks";

import type { User } from "@/types/auth";
import type { InnerCircleAccess } from "@/lib/inner-circle/access.client";

// 🛡️ Build-time guard
const IS_BUILD = process.env.NODE_ENV === 'production' && 
                 process.env.NEXT_PHASE === 'phase-production-build';

/* -------------------------------------------------------------------------- */
/* UTIL & DESIGN SYSTEM                                                       */
/* -------------------------------------------------------------------------- */

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");

function canonicalFor(slug: string) {
  return `${SITE}/resources/strategic-frameworks/${slug}`;
}

function accentClass(accent: Framework["accent"]) {
  const map = {
    gold: "border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent text-amber-200 shadow-[0_0_30px_-8px_rgba(245,158,11,0.3)]",
    emerald: "border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent text-emerald-200 shadow-[0_0_30px_-8px_rgba(16,185,129,0.3)]",
    blue: "border-sky-500/30 bg-gradient-to-br from-sky-500/10 to-transparent text-sky-200 shadow-[0_0_30px_-8px_rgba(14,165,233,0.3)]",
    rose: "border-rose-500/30 bg-gradient-to-br from-rose-500/10 to-transparent text-rose-200 shadow-[0_0_30px_-8px_rgba(244,63,94,0.3)]",
    indigo: "border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-transparent text-indigo-200 shadow-[0_0_30px_-8px_rgba(99,102,241,0.3)]",
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
        
        <div className="border-b border-white/5 bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="mx-auto max-w-7xl px-6 py-4">
            <Link href={LIBRARY_HREF} className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors group text-sm">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
              <span className="font-mono text-[10px] uppercase tracking-widest">Back to Library</span>
            </Link>
          </div>
        </div>

        <section className="relative py-32 overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(245,158,11,0.08),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(245,158,11,0.05),transparent_60%)]" />
          
          <div className="relative mx-auto max-w-7xl px-6 flex flex-col items-center text-center">
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-amber-500/30 bg-amber-500/10 px-6 py-2 text-amber-200 text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-sm">
              <Lock size={14} /> Dossier Protected
            </div>
            <h1 className="font-serif text-5xl md:text-7xl font-bold text-white mb-6 uppercase tracking-tighter leading-[0.9]">
              {framework.title}
            </h1>
            <p className="max-w-2xl text-xl text-white/50 leading-relaxed mb-12 font-light">
              {framework.oneLiner}
            </p>
            <Link 
              href="/login" 
              className="group bg-white text-black px-10 py-4 rounded-full font-black uppercase tracking-widest hover:bg-amber-500 transition-all inline-flex items-center gap-3 shadow-2xl"
            >
              Unlock Full Intelligence
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>

        {/* Preview teaser */}
        <section className="border-t border-white/5 py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid md:grid-cols-3 gap-8">
              {framework.operatingLogic?.slice(0, 3).map((logic, i) => (
                <div key={i} className="p-8 border border-white/5 bg-white/[0.02] rounded-2xl backdrop-blur-sm">
                  <div className="text-amber-500 text-2xl mb-4 font-serif">0{i+1}</div>
                  <h3 className="text-white font-bold text-lg mb-3 uppercase tracking-tight">{logic.title}</h3>
                  <p className="text-zinc-600 text-sm leading-relaxed line-clamp-3">{logic.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </Layout>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* PROTECTED SHELL (Dynamically imported)                                     */
/* -------------------------------------------------------------------------- */

const ProtectedShell = dynamic(
  () => import('@/components/Frameworks/ProtectedFrameworkShell'),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-amber-500 font-mono text-xs uppercase tracking-widest animate-pulse">
          Decrypting secure layer...
        </div>
      </div>
    )
  }
);

/* -------------------------------------------------------------------------- */
/* PAGE COMPONENT                                                             */
/* -------------------------------------------------------------------------- */

interface PublicPageProps {
  framework: Framework;
}

const FrameworkDetailPage: NextPage<PublicPageProps> = (props) => {
  // ✅ Router-safe hooks
  const router = useClientRouter();
  const query = useClientQuery();
  const isReady = useClientIsReady();
  
  const [privateReady, setPrivateReady] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // ✅ Early return during SSR/prerender
  if (!mounted) {
    return (
      <Layout title={props.framework.title}>
        <div className="min-h-screen bg-black" />
      </Layout>
    );
  }

  return (
    <>
      <PublicFrameworkView framework={props.framework} hidden={privateReady} />
      {!IS_BUILD && (
        <ProtectedShell 
          framework={props.framework} 
          onPrivateReady={() => setPrivateReady(true)} 
        />
      )}
    </>
  );
};

/* -------------------------------------------------------------------------- */
/* STATIC GENERATION                                                          */
/* -------------------------------------------------------------------------- */

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