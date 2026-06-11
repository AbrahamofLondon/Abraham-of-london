/* components/dashboard/BriefSearch.tsx — DASHBOARD INTEGRATION */
'use client';

import React, { useState } from 'react';
import { useSearch } from '@/hooks/useSearch';
import { Search, FileText, X } from 'lucide-react';
import Link from 'next/link';

export default function BriefSearch() {
  const [query, setQuery] = useState("");
  const results = useSearch(query);

  return (
    <div className="relative w-full max-w-xl group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-gold/50 group-focus-within:text-gold transition-colors" />
      </div>
      <input
        type="text"
        className="block w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 pl-10 pr-3 text-sm placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-gold/50 focus:bg-white/[0.05] transition-all"
        placeholder="Search 169 intelligence assets..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {/* Results Dropdown */}
      {query && (
        <div className="absolute z-50 mt-2 w-full bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl">
          <div className="max-h-[400px] overflow-y-auto p-2">
            {results.length > 0 ? (
              results.map((asset: any) => (
                <Link key={asset.slug} href={asset.slug}>
                  <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group/item">
                    <div className="bg-gold/10 p-2 rounded-md group-hover/item:bg-gold/20">
                      <FileText className="h-4 w-4 text-gold" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{asset.title}</div>
                      <div className="text-[10px] uppercase tracking-tighter text-white/40">{asset.category}</div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-white/20 font-mono">No matching assets found.</div>
            )}
          </div>
          <div className="bg-white/[0.02] p-2 border-t border-white/5 flex justify-between items-center px-4">
             <span className="text-[9px] text-white/20 uppercase font-mono italic">Sovereign OS Search Index v1.0</span>
             <button onClick={() => setQuery("")} className="text-white/40 hover:text-white"><X size={12}/></button>
          </div>
        </div>
      )}
    </div>
  );
}