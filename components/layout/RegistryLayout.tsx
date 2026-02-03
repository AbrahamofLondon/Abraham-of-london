// components/layouts/RegistryLayout.tsx — HARDENED (Command Center)
import * as React from "react";
import { Filter, Search, SortAsc, LayoutGrid, List } from "lucide-react";
import { useContentRegistry } from "@/hooks/useContentRegistry";
import SectorGrid from "@/components/registry/SectorGrid";

export default function RegistryLayout() {
  const { 
    setSearchQuery, 
    searchQuery, 
    totalCount, 
    filteredCount, 
    isLoading 
  } = useContentRegistry();

  return (
    <div className="flex min-h-screen bg-black pt-20">
      {/* 1. INSTITUTIONAL SIDEBAR (Filtering Engine) */}
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-white/5 bg-zinc-950 pt-20 lg:block">
        <div className="flex h-full flex-col p-6">
          <div className="mb-8">
            <h2 className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-amber-500">
              <Filter size={14} /> Intelligence Filters
            </h2>
            <div className="mt-4 h-px w-full bg-gradient-to-r from-amber-500/30 to-transparent" />
          </div>

          {/* Search Module */}
          <div className="mb-8">
            <label className="mb-2 block font-mono text-[9px] uppercase tracking-widest text-zinc-500">
              Query Registry
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Keywords..."
                className="w-full border border-white/10 bg-zinc-900 py-2 pl-10 pr-4 font-mono text-xs text-white placeholder:text-zinc-700 focus:border-amber-500/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Sector Selection */}
          <div className="space-y-6">
            <section>
              <h3 className="mb-3 font-mono text-[9px] uppercase tracking-widest text-zinc-500">Classification</h3>
              <div className="flex flex-col gap-2">
                {["Strategy", "Canon", "Events", "Lexicon", "Resources"].map((sector) => (
                  <button
                    key={sector}
                    className="flex items-center justify-between border border-white/5 bg-white/[0.02] px-3 py-2 text-left font-mono text-[10px] uppercase tracking-widest text-zinc-400 transition-all hover:bg-amber-500/10 hover:text-amber-500"
                  >
                    <span>{sector}</span>
                    <span className="text-[8px] opacity-40">00</span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3 className="mb-3 font-mono text-[9px] uppercase tracking-widest text-zinc-500">Priority Level</h3>
              <div className="space-y-2">
                {["Severe", "High", "Guarded"].map((level) => (
                  <label key={level} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="h-3 w-3 border border-white/20 bg-zinc-900 peer-checked:bg-amber-500 peer-checked:border-amber-500" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 group-hover:text-zinc-300">
                      {level}
                    </div>
                  </label>
                ))}
              </div>
            </section>
          </div>

          {/* System Status Footer */}
          <div className="mt-auto border-t border-white/5 pt-6">
            <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-zinc-600">
              <span>Registry Status</span>
              <span className="text-emerald-500">Synced</span>
            </div>
            <div className="mt-2 h-1 w-full bg-zinc-900 overflow-hidden">
               <div className="h-full w-2/3 bg-amber-500/40" />
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 lg:pl-72">
        <div className="mx-auto max-w-7xl p-6 lg:p-12">
          {/* Dashboard Header */}
          <header className="mb-12 flex flex-col justify-between gap-6 border-b border-white/5 pb-8 md:flex-row md:items-end">
            <div>
              <h1 className="font-serif text-4xl italic text-white lg:text-5xl">
                Intelligence Archive
              </h1>
              <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
                Displaying {filteredCount} of {totalCount} active dossiers
              </p>
            </div>

            <div className="flex items-center gap-4">
               <div className="flex border border-white/10 p-1">
                  <button className="bg-zinc-800 p-1.5 text-amber-500"><LayoutGrid size={16} /></button>
                  <button className="p-1.5 text-zinc-600 hover:text-zinc-400"><List size={16} /></button>
               </div>
               <button className="flex items-center gap-2 border border-amber-500/20 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-amber-500 transition-all hover:bg-amber-500/10">
                 <SortAsc size={14} /> Chronological
               </button>
            </div>
          </header>

          {/* The Data Grid */}
          <div className="relative min-h-[60vh]">
            <SectorGrid />
          </div>

          {/* Pagination/Load More */}
          <div className="mt-20 flex flex-col items-center border-t border-white/5 pt-12">
            <button className="group relative px-8 py-4 font-mono text-[10px] uppercase tracking-[0.4em] text-zinc-500 hover:text-white">
              <span className="relative z-10">Initialize Deep Archive Access</span>
              <div className="absolute inset-0 -z-10 h-full w-full border border-white/5 transition-all group-hover:border-amber-500/50" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}