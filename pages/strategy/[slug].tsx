/* pages/strategy/[slug].tsx — REFINED WITH DUAL-MODE RENDERING */
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import { ChevronLeft, Download, Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import Layout from "@/components/Layout";
import BriefViewer from "@/components/strategy/BriefViewer";
import { getDocBySlug, getAllContentlayerDocs } from "@/lib/content/server";
import { prisma } from "@/lib/prisma";

const StrategyDetailPage: NextPage<any> = ({ strategy, source, isPdf, dbMeta }) => {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    if (isPdf) return; // Progress bar only for long-form MDX
    const handleScroll = () => {
      const doc = document.documentElement;
      const pct = (window.scrollY / (doc.scrollHeight - window.innerHeight)) * 100;
      setProgress(Math.max(0, Math.min(100, pct)));
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isPdf]);

  // MODE A: SECURE PDF DOSSIER
  if (isPdf) {
    const meta = dbMeta ? JSON.parse(dbMeta) : {};
    return (
      <Layout pageTitle={strategy.title}>
        <BriefViewer 
          assetUrl={`/api/assets/serve-pdf?id=${strategy.slug || strategy._id}`}
          title={strategy.title}
          classification={meta.classification || "LEVEL 3"}
          serialNumber={meta.institutional_code || `AOL-B-${strategy._id?.slice(-5)}`}
        />
      </Layout>
    );
  }

  // MODE B: MDX INTEL DISPATCH
  return (
    <Layout pageTitle={strategy.title}>
      <div className="fixed top-0 left-0 h-[1px] bg-primary z-[100] transition-all duration-300" style={{ width: `${progress}%` }} />
      
      <article className="relative pt-32 pb-40">
        <div className="max-w-6xl mx-auto px-6 mb-24">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-[9px] font-mono uppercase tracking-widest text-zinc-600 hover:text-primary transition-colors mb-12">
            <ChevronLeft size={10} /> Return_to_Registry
          </Link>

          <div className="grid lg:grid-cols-12 gap-12 items-end">
            <div className="lg:col-span-8 space-y-8">
              <div className="flex items-center gap-4">
                <span className="text-[9px] font-mono uppercase tracking-[0.5em] text-primary">Strategic Dispatch</span>
                <div className="h-px w-12 bg-primary/20" />
                <span className="text-[9px] font-mono text-zinc-700">AOL-B-{strategy._id?.slice(-5)}</span>
              </div>
              <h1 className="font-editorial text-5xl md:text-8xl font-light text-white tracking-tighter leading-[0.85] italic">
                {strategy.title}
              </h1>
            </div>
            <div className="lg:col-span-4 flex justify-end">
              <div className="text-right font-mono text-[9px] text-zinc-600 uppercase tracking-widest space-y-1">
                <p>Classification: <span className="text-zinc-300">Level 3 Private</span></p>
                <p>Origin: <span className="text-zinc-300">London Terminal</span></p>
                <p>Date: <span className="text-zinc-300">{new Date(strategy.date).toLocaleDateString()}</span></p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-12 gap-20">
          <aside className="lg:col-span-3 border-r border-white/5">
            <div className="sticky top-40 space-y-12 pr-8">
              <div className="space-y-6">
                <h4 className="text-[9px] font-mono uppercase tracking-[0.3em] text-zinc-800">Briefing_Index</h4>
                <nav className="flex flex-col gap-4 font-editorial italic text-xl text-zinc-500">
                  <a href="#overview" className="hover:text-primary transition-colors">Strategic_Overview</a>
                  <a href="#analysis" className="hover:text-primary transition-colors">Core_Analysis</a>
                  <a href="#implementation" className="hover:text-primary transition-colors">Execution_Logic</a>
                </nav>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-9">
            <div className="prose prose-invert prose-zinc max-w-none 
              prose-headings:font-editorial prose-headings:font-light prose-headings:tracking-tighter
              prose-h2:text-4xl prose-h2:italic prose-h2:border-b prose-h2:border-white/10 prose-h2:pb-6
              prose-p:text-zinc-400 prose-p:text-xl prose-p:leading-relaxed prose-p:font-light
              prose-strong:text-primary prose-strong:font-mono prose-strong:text-sm
              prose-blockquote:border-primary/40 prose-blockquote:bg-surface prose-blockquote:py-2 prose-blockquote:px-8">
              <MDXRemote {...source} />
            </div>
          </main>
        </div>
      </article>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const docs = getAllContentlayerDocs();
  const paths = docs.map((d: any) => ({ params: { slug: d.slug.split('/').pop() } }));
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  
  // 1. Attempt to find the document in the DB first (for PDF assets)
  const dbEntry = await prisma.contentMetadata.findUnique({ where: { slug } });
  
  // 2. Fetch the Contentlayer doc (for MDX content)
  const strategy = getDocBySlug(`strategy/${slug}`);

  if (!strategy && !dbEntry) return { notFound: true };

  const isPdf = dbEntry?.contentType === "PDF_BRIEF";
  const source = !isPdf && strategy ? await serialize(strategy.body.raw) : null;

  return { 
    props: { 
      strategy: strategy || { title: dbEntry?.title, _id: dbEntry?.slug }, 
      source, 
      isPdf,
      dbMeta: dbEntry?.metadata || null
    }, 
    revalidate: 3600 
  };
};

export default StrategyDetailPage;