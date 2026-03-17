"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Lock, 
  Search, 
  Filter, 
  FileText, 
  Clock, 
  ChevronRight,
  ShieldAlert
} from "lucide-react";
import { allBriefs } from "contentlayer/generated";
import Layout from "@/components/layout/Layout";

const BriefingRoom: React.FC = () => {
  const [search, setSearch] = React.useState("");

  // Sort real briefs by date descending
  const activeBriefs = React.useMemo(() => {
    return allBriefs
      .filter(b => b.title.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [search]);

  return (
    <Layout title="Briefing Room | Abraham of London">
      <main className="min-h-screen bg-black text-zinc-300 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          
          {/* Header Section */}
          <header className="mb-16 border-b border-zinc-900 pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-amber-500 font-mono text-[10px] uppercase tracking-[0.4em] mb-4">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  Live Intelligence Feed
                </div>
                <h1 className="text-5xl md:text-6xl font-serif font-bold text-white mb-4 italic">
                  The Briefing Room
                </h1>
                <p className="text-zinc-500 max-w-2xl italic font-serif">
                  Accessing a portfolio of {allBriefs.length} intelligence briefs. All data is encrypted and subject to institutional oversight.
                </p>
              </div>
              
              {/* Search & Filter Bar */}
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search Dossiers..."
                    className="bg-zinc-950 border border-zinc-800 rounded-sm pl-12 pr-6 py-3 text-xs uppercase tracking-widest focus:outline-none focus:border-amber-500/50 transition-all w-full md:w-64"
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <button className="p-3 bg-zinc-950 border border-zinc-800 hover:border-zinc-600 transition-colors">
                  <Filter size={16} />
                </button>
              </div>
            </div>
          </header>

          {/* Grid of Briefs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeBriefs.map((brief, idx) => (
              <Link 
                key={brief._id} 
                href={`/inner-circle/briefs/${brief.slug || brief._raw.flattenedPath}`}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.02, 0.5) }}
                  className="group h-full relative bg-zinc-950 border border-zinc-900 p-6 hover:border-amber-500/30 transition-all cursor-pointer overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-[9px] font-mono text-zinc-600 tracking-tighter uppercase">
                      Ref: {brief._id.slice(-8).toUpperCase()}
                    </span>
                    <span className={`text-[8px] px-2 py-0.5 border font-bold ${
                      brief.classification === "TOP SECRET" 
                        ? "border-red-900 text-red-500 bg-red-500/5" 
                        : "border-zinc-800 text-zinc-500"
                    }`}>
                      {brief.classification || "CONFIDENTIAL"}
                    </span>
                  </div>

                  <h3 className="text-lg font-serif text-white mb-4 leading-snug group-hover:text-amber-400 transition-colors italic">
                    {brief.title}
                  </h3>

                  <div className="flex items-center gap-4 mt-auto pt-6 border-t border-zinc-900/50">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-zinc-500">
                      <Clock size={12} />
                      {brief.readingTime?.text || "12 MIN"}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-zinc-500">
                      <FileText size={12} />
                      {brief.category || "Strategic"}
                    </div>
                  </div>

                  {/* Secure Hover Overlay */}
                  <div className="absolute inset-0 bg-amber-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
                    <ChevronRight className="text-amber-500" size={20} />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Institutional Footer */}
          <footer className="mt-24 pt-12 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                <ShieldAlert size={14} className="text-amber-900" />
                Protocol: AES-256
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                Node: London-Prime
              </div>
            </div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-700">
              © 2026 Abraham of London • Unauthorized access is strictly prohibited.
            </div>
          </footer>
        </div>
      </main>
    </Layout>
  );
};

export default BriefingRoom;