"use client";

import * as React from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Clock, 
  Share2, 
  Printer, 
  ShieldCheck, 
  Menu,
  ChevronRight
} from "lucide-react";
import { MetadataTag } from "@/components/ui/BrandAssets";

interface BriefingReaderProps {
  title: string;
  subtitle?: string;
  date: string;
  readTime: string;
  category: string;
  content: React.ReactNode;
}

export default function BriefingReader({
  title,
  subtitle,
  date,
  readTime,
  category,
  content
}: BriefingReaderProps) {
  return (
    <article className="relative min-h-screen bg-black text-white selection:bg-amber-500/30">
      {/* 1. Tactical Navigation Header */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <Link 
              href="/shorts" 
              className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
              Return to Feed
            </Link>
            <div className="hidden h-4 w-px bg-white/10 md:block" />
            <div className="hidden items-center gap-2 md:flex">
              <MetadataTag icon={ShieldCheck}>AOL-INTEL-SECURE</MetadataTag>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="rounded-full p-2 text-white/40 hover:bg-white/5 hover:text-white transition-all">
              <Share2 className="h-4 w-4" />
            </button>
            <button className="hidden rounded-full p-2 text-white/40 hover:bg-white/5 hover:text-white transition-all md:block">
              <Printer className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* 2. Intelligence Header (The "Setup") */}
      <header className="relative border-b border-white/5 pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="absolute top-0 right-0 h-full w-1/2 bg-gradient-to-l from-amber-500/20 to-transparent" />
        </div>
        
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <span className="text-[10px] font-mono text-amber-500 uppercase tracking-[0.3em] font-bold">
              {category} // FIELD REPORT
            </span>
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-[10px] font-mono text-white/20 uppercase">
              Issued: {date}
            </span>
          </div>

          <h1 className="font-serif text-5xl md:text-7xl font-medium tracking-tight text-white leading-[1.05]">
            {title}
          </h1>
          
          {subtitle && (
            <p className="mt-8 text-xl md:text-2xl font-light text-white/40 leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          )}

          <div className="mt-12 flex items-center gap-6 border-t border-white/5 pt-8">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40">
              <Clock className="h-3.5 w-3.5 text-amber-500/60" />
              Read Duration: {readTime}
            </div>
            <div className="h-1 w-1 rounded-full bg-white/10" />
            <div className="text-[10px] font-black uppercase tracking-widest text-white/40">
              Protocol: OPEN ACCESS
            </div>
          </div>
        </div>
      </header>

      {/* 3. Main Body Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Sidebar (Desktop Only) */}
          <aside className="hidden lg:col-span-3 lg:block pt-16">
            <div className="sticky top-32 space-y-10">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500/60 mb-4">
                  Report Structure
                </h4>
                <nav className="space-y-3">
                  {['Executive Summary', 'Operational Logic', 'Institutional Drift', 'Strategic Conclusion'].map((item) => (
                    <button key={item} className="flex items-center gap-2 text-xs font-light text-white/30 hover:text-white transition-colors group">
                      <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-amber-500" />
                      {item}
                    </button>
                  ))}
                </nav>
              </div>
              
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
                <p className="text-[10px] leading-relaxed text-white/30 italic">
                  "Institutional integrity is not a static state, but a dynamic resistance to entropy."
                </p>
              </div>
            </div>
          </aside>

          {/* Prose Content */}
          <main className="lg:col-span-7 pt-16 pb-32">
            <div className="prose prose-invert prose-amber max-w-none 
              prose-headings:font-serif prose-headings:font-medium prose-headings:tracking-tight
              prose-p:text-lg prose-p:font-light prose-p:leading-relaxed prose-p:text-white/70
              prose-strong:text-white prose-strong:font-bold
              prose-blockquote:border-amber-500/50 prose-blockquote:bg-amber-500/5 prose-blockquote:py-2 prose-blockquote:rounded-r-lg
              prose-li:text-white/60">
              {content}
            </div>
          </main>

        </div>
      </div>
    </article>
  );
}