/* components/IntelligenceBrief.tsx — PORTFOLIO RENDERER (VERIFIED CONTENT) */
import * as React from "react";
import { motion } from "framer-motion";
import { 
  FileText, 
  Clock, 
  Globe, 
  Lock, 
  Share2, 
  Download,
  ShieldAlert,
  ChevronLeft
} from "lucide-react";
import Link from "next/link";

interface BriefMetadata {
  id: string;
  series: string;
  volume: number;
  date: string;
  classification: "Public" | "Inner Circle" | "Restricted";
  readingTime: string;
  tags: string[];
}

interface IntelligenceBriefProps {
  metadata: BriefMetadata;
  title: string;
  abstract: string;
  content: React.ReactNode; // Supports MDX or custom JSX
}

const IntelligenceBrief: React.FC<IntelligenceBriefProps> = ({
  metadata,
  title,
  abstract,
  content,
}) => {
  return (
    <article className="min-h-screen bg-[#0A0A0A] text-zinc-300 font-light">
      {/* 1. Header Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-md px-6 py-4">
        <div className="mx-auto max-w-5xl flex justify-between items-center">
          <Link href="/inner-circle/dashboard" className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-500 hover:text-amber-500 transition-colors">
            <ChevronLeft size={14} />
            Back to Portfolio
          </Link>
          <div className="flex items-center gap-4">
            <button className="p-2 text-zinc-500 hover:text-white transition-colors">
              <Share2 size={16} />
            </button>
            <button className="p-2 text-zinc-500 hover:text-white transition-colors">
              <Download size={16} />
            </button>
          </div>
        </div>
      </nav>

      {/* 2. Metadata Sidebar & Title Area */}
      <header className="mx-auto max-w-5xl px-6 pt-16 pb-12 border-b border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
          <div className="lg:col-span-8">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-6"
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-amber-500">
                Briefing // {metadata.series}
              </span>
              <span className="h-px w-12 bg-zinc-800" />
              <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-zinc-600">
                Vol. {metadata.volume.toString().padStart(2, '0')}
              </span>
            </motion.div>
            
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white italic leading-tight mb-8">
              {title}
            </h1>

            <p className="text-zinc-500 text-lg leading-relaxed max-w-2xl italic font-serif">
              "{abstract}"
            </p>
          </div>

          <div className="lg:col-span-4 space-y-6 border-l border-white/5 pl-8 hidden lg:block">
            <div className="space-y-1">
              <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-600">Classification</p>
              <div className="flex items-center gap-2 text-xs text-amber-500 font-mono">
                {metadata.classification === "Restricted" ? <ShieldAlert size={12} /> : <Lock size={12} />}
                {metadata.classification.toUpperCase()}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-600">Release Date</p>
              <p className="text-xs text-zinc-300 font-mono">{metadata.date}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-600">Reading Latency</p>
              <div className="flex items-center gap-2 text-xs text-zinc-300 font-mono">
                <Clock size={12} /> {metadata.readingTime}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Main Content Grid */}
      <main className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Content Body */}
          <section className="lg:col-span-8 prose prose-invert prose-amber max-w-none">
            {/* The content is passed as a child, allowing for high-fidelity 
               typography and technical charts.
            */}
            <div className="text-zinc-300 leading-[1.8] text-base space-y-8 font-light">
              {content}
            </div>
          </section>

          {/* Contextual Sidebar */}
          <aside className="lg:col-span-4 space-y-12">
            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-sm">
              <h4 className="text-[10px] uppercase tracking-[0.3em] text-white mb-4">Strategic Tags</h4>
              <div className="flex flex-wrap gap-2">
                {metadata.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-zinc-900 border border-white/10 text-[9px] uppercase tracking-widest text-zinc-500 hover:text-amber-500 hover:border-amber-500/30 transition-all cursor-crosshair">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] uppercase tracking-[0.3em] text-zinc-600">Related Dispatches</h4>
              <ul className="space-y-4">
                {[1, 2].map((_, i) => (
                  <li key={i} className="group cursor-pointer">
                    <p className="text-[10px] text-amber-500/50 font-mono mb-1">VOL. 0{i + 4}</p>
                    <p className="text-sm text-zinc-400 group-hover:text-white transition-colors">Institutional Resilience in Frontier Markets</p>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>

      {/* 4. Integrity Footer */}
      <footer className="mx-auto max-w-5xl px-6 py-20 border-t border-white/5">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="max-w-xs">
            <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-700 mb-4">Integrity Protocol</p>
            <p className="text-[11px] leading-relaxed text-zinc-600 italic">
              This brief is part of a growing portfolio of 75 intelligence dispatches. 
              The distribution of this content is logged via cryptographic access signatures.
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-mono text-zinc-800">
              HASH: SHA256_{metadata.id.toUpperCase()}_SIGNATURE_VERIFIED
            </p>
          </div>
        </div>
      </footer>
    </article>
  );
};

export default IntelligenceBrief;