// components/layout/RegistryLayout.tsx — HARDENED (Command Center)
"use client";

import * as React from "react";
import { Filter, Search, SortAsc, LayoutGrid, List } from "lucide-react";

interface RegistryLayoutProps {
  children?: React.ReactNode;
  showGrid?: boolean; // Toggle to hide the SectorGrid when viewing individual docs
}

export default function RegistryLayout({ children, showGrid = false }: RegistryLayoutProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-black pt-20 text-white">
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
          {/* Main Slot for MDX Content or Registry View */}
          <div className="relative min-h-[60vh]">
            {isLoading ? (
               <div className="flex items-center justify-center py-20 font-mono text-xs uppercase tracking-widest text-zinc-500 animate-pulse">
                 Syncing Intelligence...
               </div>
            ) : (
              children
            )}
          </div>
        </div>
      </main>
    </div>
  );
}