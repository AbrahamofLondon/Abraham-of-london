import * as React from "react";
import { fontConfig } from "@/lib/next-fonts";
import { MetadataTag } from "@/components/ui/BrandAssets";
import { Clock, Shield, Share2, Printer, ChevronLeft } from "lucide-react";
import Link from "next/link";

interface BriefingReaderProps {
  content: {
    title: string;
    subtitle?: string;
    date: string;
    categoryLabel?: string;
    readTime?: string;
    author?: string;
  };
  children: React.ReactNode;
}

export default function BriefingReader({ content, children }: BriefingReaderProps) {
  return (
    <article className="relative min-h-screen bg-black text-white selection:bg-amber-500/30">
      {/* Protocol Bar: Fixed top navigation for the reader */}
      <nav className="sticky top-20 z-40 w-full border-b border-white/5 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex h-12 max-w-4xl items-center justify-between px-6">
          <Link 
            href="/shorts" 
            className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-white/40 hover:text-amber-500 transition-colors"
          >
            <ChevronLeft className="h-3 w-3" />
            Back to Archive
          </Link>
          <div className="flex items-center gap-6">
            <button className="text-white/20 hover:text-white transition-colors"><Printer className="h-4 w-4" /></button>
            <button className="text-white/20 hover:text-white transition-colors"><Share2 className="h-4 w-4" /></button>
          </div>
        </div>
      </nav>

      <header className="mx-auto max-w-3xl px-6 pt-24 pb-16 text-center">
        <div className="mb-8 flex justify-center">
          <MetadataTag icon={Shield}>
            {content.categoryLabel || "Institutional Intelligence"}
          </MetadataTag>
        </div>

        <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl leading-[1.1] mb-6 tracking-tight">
          {content.title}
        </h1>
        
        {content.subtitle && (
          <p className="font-sans text-lg md:text-xl text-white/40 font-light italic mb-8 max-w-2xl mx-auto">
            {content.subtitle}
          </p>
        )}

        <div className="flex items-center justify-center gap-8 font-mono text-[10px] uppercase tracking-[0.2em] text-white/30 border-y border-white/5 py-6">
          <span className="flex items-center gap-2"><Clock className="h-3 w-3" /> {content.readTime || "5 MIN"}</span>
          <span className="hidden md:inline text-white/10">/</span>
          <span>Released: {content.date}</span>
          <span className="hidden md:inline text-white/10">/</span>
          <span>By: {content.author || "Abraham of London"}</span>
        </div>
      </header>

      {/* The Content Body: Focused, high-readability typography */}
      <section className="mx-auto max-w-2xl px-6 pb-32">
        <div className="prose prose-invert prose-amber max-w-none 
          prose-p:font-sans prose-p:text-lg prose-p:leading-relaxed prose-p:text-white/80
          prose-headings:font-serif prose-headings:font-normal prose-headings:tracking-tight
          prose-blockquote:border-l-amber-500 prose-blockquote:bg-white/5 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-blockquote:font-serif prose-blockquote:italic
          prose-strong:text-white prose-strong:font-bold
          prose-li:text-white/70
        ">
          {children}
        </div>
      </section>

      {/* Footer Signature */}
      <footer className="mx-auto max-w-3xl px-6 pb-24 border-t border-white/5 pt-12 text-center">
        <div className="inline-block p-4 border border-white/10 rounded-full mb-6">
          <Shield className="h-6 w-6 text-amber-500/50" />
        </div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-white/20">
          This briefing is part of the Abraham of London Institutional Canon.
          <br />Unauthorized distribution is discouraged.
        </p>
      </footer>
    </article>
  );
}