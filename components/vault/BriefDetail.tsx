/* components/vault/BriefDetail.tsx — ARCHIVAL TYPOGRAPHY & INTEL CORE */
"use client";

import * as React from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { 
  ArrowLeft, 
  Share2, 
  Download, 
  ShieldCheck, 
  Clock, 
  ChevronRight,
  BookOpen
} from "lucide-react";
import Link from "next/link";
import Layout from "@/components/Layout";

interface BriefDetailProps {
  brief: {
    title: string;
    excerpt: string;
    category: string;
    date: string;
    readingTime: string;
    content: string; // MDX content
    tags: string[];
    author: string;
  };
}

export const BriefDetail: React.FC<BriefDetailProps> = ({ brief }) => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <Layout title={`${brief.title} // Briefing`} description={brief.excerpt}>
      {/* 1. PROGRESS MONITOR */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[2px] bg-amber-500 origin-left z-[110]"
        style={{ scaleX }}
      />

      <main className="relative min-h-screen bg-[#faf9f6] text-[#1a1a1a] pt-32 pb-24">
        {/* 2. INSTITUTIONAL HEADER */}
        <div className="container mx-auto px-6 lg:px-12 max-w-5xl">
          <Link 
            href="/vault" 
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 hover:text-amber-700 transition-colors mb-12 group"
          >
            <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
            Back to Registry
          </Link>

          <header className="space-y-8 mb-20">
            <div className="flex flex-wrap items-center gap-4">
              <span className="px-3 py-1 border border-amber-900/20 bg-amber-500/5 text-[9px] font-black uppercase tracking-widest text-amber-800">
                {brief.category}
              </span>
              <span className="h-4 w-px bg-zinc-200" />
              <div className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-widest text-zinc-400">
                <Clock size={10} /> {brief.readingTime} Reading
              </div>
              <div className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-widest text-zinc-400">
                <ShieldCheck size={10} /> Level 1 Access
              </div>
            </div>

            <h1 className="text-5xl lg:text-7xl font-serif leading-[1.1] tracking-tight">
              {brief.title.split(' ').map((word, i) => (
                <span key={i} className={i % 4 === 3 ? "italic font-light text-zinc-500" : ""}>
                  {word}{' '}
                </span>
              ))}
            </h1>

            <p className="text-xl lg:text-2xl text-zinc-500 font-light italic leading-relaxed max-w-3xl">
              {brief.excerpt}
            </p>

            <div className="flex items-center justify-between pt-8 border-t border-zinc-200">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center font-serif italic text-zinc-400">
                  {brief.author.charAt(0)}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest leading-none">
                    {brief.author}
                  </p>
                  <p className="text-[9px] text-zinc-400 font-mono mt-1">
                    Principal Intelligence
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button className="p-3 border border-zinc-200 hover:bg-white hover:shadow-lg transition-all text-zinc-400 hover:text-zinc-800">
                  <Share2 size={16} />
                </button>
                <button className="p-3 border border-zinc-200 hover:bg-white hover:shadow-lg transition-all text-zinc-400 hover:text-zinc-800">
                  <Download size={16} />
                </button>
              </div>
            </div>
          </header>

          {/* 3. THE ARCHIVAL BODY */}
          <article className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <aside className="hidden lg:block lg:col-span-3">
              <div className="sticky top-40 space-y-12">
                <div>
                  <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-300 mb-6">
                    Contents
                  </h4>
                  <nav className="space-y-4">
                    {['Executive Summary', 'Core Thesis', 'Strategic Vectors', 'Risk Assessment', 'Synthesis'].map((item, i) => (
                      <Link 
                        key={i} 
                        href={`#${item.toLowerCase().replace(' ', '-')}`}
                        className="group flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-amber-800 transition-colors"
                      >
                        <span className="text-[8px] font-mono text-zinc-200 group-hover:text-amber-500 transition-colors">0{i+1}</span>
                        {item}
                      </Link>
                    ))}
                  </nav>
                </div>
                
                <div className="p-6 bg-zinc-100 border-l-2 border-amber-600">
                  <p className="text-[10px] font-serif italic text-zinc-500 leading-snug">
                    "This brief is part of the ongoing 75 Intelligence Briefs portfolio for institutional partners."
                  </p>
                </div>
              </div>
            </aside>

            {/* MDX Content Area */}
            <div className="lg:col-span-9 prose prose-zinc prose-lg max-w-none 
              prose-headings:font-serif prose-headings:font-medium prose-headings:tracking-tight
              prose-p:text-zinc-600 prose-p:leading-relaxed prose-p:font-light
              prose-strong:text-zinc-900 prose-strong:font-bold
              prose-blockquote:border-l-amber-500 prose-blockquote:bg-zinc-50 prose-blockquote:py-2 prose-blockquote:font-serif prose-blockquote:italic
            ">
              <div dangerouslySetInnerHTML={{ __html: brief.content }} />
              
              {/* INTERACTIVE FOOTNOTES EXAMPLE */}
              <footer className="mt-20 pt-12 border-t border-zinc-200">
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300 mb-8">
                  Footnotes & Citations
                </h4>
                <div className="space-y-4 font-mono text-[10px] text-zinc-400 leading-relaxed">
                  <p>[1] Based on the 2026 Strategic Framework for London-based institutional deployments.</p>
                  <p>[2] See "The Velocity of Trust" (Brief #14) for further synthesis on this thesis.</p>
                </div>
              </footer>
            </div>
          </article>
        </div>
      </main>

      {/* 4. NEXT BRIEF NAVIGATION */}
      <section className="bg-white border-y border-zinc-200 py-20">
        <div className="container mx-auto px-6 lg:px-12 max-w-5xl">
          <div className="group cursor-pointer">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-300 mb-4 text-center">
              Next Intelligence
            </p>
            <div className="flex flex-col items-center text-center space-y-6">
              <h2 className="text-4xl lg:text-5xl font-serif italic text-zinc-400 group-hover:text-zinc-900 transition-colors duration-500">
                The Liquidity of Legacy
              </h2>
              <ChevronRight size={40} className="text-amber-500/20 group-hover:text-amber-500 transition-all duration-500 group-hover:translate-x-4" />
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};