/* components/content/BriefingReader.tsx — SSOT ALIGNED */
import * as React from "react";
// Fonts loaded via CSS (styles/fonts.css) — no next/font import needed
import { MetadataTag } from "@/components/ui/BrandAssets";
import { Clock, Shield, Share2, Printer, ChevronLeft, Lock } from "lucide-react";
import Link from "next/link";

interface BriefingReaderProps {
  content: {
    title: string;
    subtitle?: string;
    date: string;
    categoryLabel?: string;
    readTime?: string;
    author?: string;
    isLocked?: boolean;
    slug?: string;
  };
  children: React.ReactNode;
}

export default function BriefingReader({ content, children }: BriefingReaderProps) {
  // Standardizing on the dashboard as the primary return path
  const backHref = "/inner-circle/dashboard";

  return (
    <article 
      className="relative min-h-screen bg-black text-white selection:bg-amber-500/30"
    >
      
      {/* Protocol Bar: Optimized for high-clearance navigation */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-black/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link 
            href={backHref} 
            className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-white/40 hover:text-amber-500 transition-all group"
          >
            <ChevronLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
            Return to Vault Registry
          </Link>
          
          <div className="flex items-center gap-4">
            {content.isLocked && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 font-mono text-[9px] uppercase tracking-tighter">
                <Lock className="h-3 w-3" /> Encrypted Session
              </div>
            )}
            <div className="h-4 w-[1px] bg-white/10 mx-2" />
            <button className="text-white/20 hover:text-white transition-colors" title="Print Briefing">
              <Printer className="h-4 w-4" />
            </button>
            <button className="text-white/20 hover:text-white transition-colors" title="Share Access">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="mx-auto max-w-4xl px-6 pt-24 pb-16 text-center">
        <div className="mb-10 flex justify-center">
          <MetadataTag icon={content.isLocked ? Lock : Shield}>
            {content.categoryLabel || "Institutional Intelligence"}
          </MetadataTag>
        </div>

        <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl leading-[1.05] mb-8 tracking-tight font-medium">
          {content.title}
        </h1>
        
        {content.subtitle && (
          <p className="font-sans text-xl md:text-2xl text-white/50 font-light italic mb-10 max-w-2xl mx-auto leading-relaxed">
            {content.subtitle}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 font-mono text-[10px] uppercase tracking-[0.25em] text-white/30 border-y border-white/5 py-8">
          <span className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-amber-500/50" /> 
            {content.readTime || "EST. 5 MIN"}
          </span>
          <span className="hidden md:inline text-white/10">|</span>
          <span>Released: {content.date}</span>
          <span className="hidden md:inline text-white/10">|</span>
          <span>Origin: {content.author || "Abraham of London"}</span>
        </div>
      </header>

      {/* Content Body */}
      <section className="mx-auto max-w-2xl px-6 pb-32">
        <div className="prose prose-invert prose-amber max-w-none 
          prose-p:font-sans prose-p:text-lg prose-p:leading-relaxed prose-p:text-white/80 prose-p:mb-8
          prose-headings:font-serif prose-headings:font-normal prose-headings:tracking-tight prose-headings:text-white
          prose-blockquote:border-l-amber-500 prose-blockquote:bg-white/5 prose-blockquote:py-4 prose-blockquote:px-8 prose-blockquote:rounded-r-xl prose-blockquote:font-serif prose-blockquote:italic prose-blockquote:text-white/90
          prose-strong:text-amber-500/90 prose-strong:font-bold
          prose-li:text-white/70 prose-li:marker:text-amber-500/40
          prose-hr:border-white/5
        ">
          {children}
        </div>
      </section>

      {/* Verification Footer */}
      <footer className="mx-auto max-w-3xl px-6 pb-24 border-t border-white/5 pt-16 text-center">
        <div className="relative inline-block mb-8">
          <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full"></div>
          <div className="relative p-5 border border-white/10 rounded-full bg-black">
            <Shield className="h-8 w-8 text-amber-500" />
          </div>
        </div>
        
        <h3 className="font-serif text-xl mb-4 text-white/90">Institutional Integrity Verified</h3>
        <p className="font-mono text-[10px] leading-loose uppercase tracking-[0.3em] text-white/20 max-w-md mx-auto">
          This briefing is classified under the 
          <span className="text-white/40 block">Abraham of London Institutional Canon</span>
          Digital Signature: {content.slug?.toUpperCase() || "INTERNAL-REF"}
        </p>
      </footer>
    </article>
  );
}