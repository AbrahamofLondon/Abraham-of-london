'use client';

import React, { useState, useMemo } from 'react';
import { Shield, Search, ArrowRight, Lock } from 'lucide-react';
import { useRegistry } from '@/contexts/RegistryProvider';
import Link from 'next/link';

interface RegistryViewProps {
  initialDocs: any[];
  categories: string[];
}

export default function RegistryView({ initialDocs, categories }: RegistryViewProps) {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { hasClearance } = useRegistry();

  // SCALABLE FILTERING LOGIC
  const filteredDocs = useMemo(() => {
    return initialDocs.filter((doc) => {
      const matchesCategory = filter === 'all' || doc.category === filter;
      const matchesSearch = 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [filter, searchQuery, initialDocs]);

  return (
    <section className="bg-black min-h-screen pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* 1. ARCHIVE HEADER */}
        <header className="mb-16 border-b border-white/5 pb-12">
          <div className="flex items-center gap-4 mb-6">
            <span className="h-px w-12 bg-amber-500/50" />
            <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-amber-500">
              Registry v2.6 // {initialDocs.length} Assets Loaded
            </span>
          </div>
          <h1 className="text-6xl md:text-8xl font-serif italic text-white mb-8">
            The Archive.
          </h1>
          
          {/* TACTICAL SEARCH & FILTER BAR */}
          <div className="flex flex-col md:flex-row gap-4 mt-12">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-500 transition-colors" size={16} />
              <input 
                type="text"
                placeholder="FILTER_BY_KEYWORD..."
                className="w-full bg-zinc-950 border border-white/5 py-4 pl-12 pr-4 font-mono text-xs uppercase tracking-widest text-zinc-300 focus:border-amber-500/50 outline-none transition-all"
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {['all', ...categories].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-6 py-4 font-mono text-[10px] uppercase tracking-widest border transition-all whitespace-nowrap ${
                    filter === cat 
                    ? 'bg-amber-500 text-black border-amber-500' 
                    : 'bg-transparent text-zinc-500 border-white/5 hover:border-white/20'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* 2. INTELLIGENCE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 border border-white/5">
          {filteredDocs.map((doc) => {
            const locked = !hasClearance(doc.accessLevel);
            
            return (
              <Link 
                href={doc.href} 
                key={doc.slug}
                className="group bg-black p-8 hover:bg-zinc-950 transition-all flex flex-col justify-between min-h-[320px] relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                  <span className="font-mono text-[40px] text-white">/</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-8">
                    <span className="font-mono text-[9px] text-zinc-600 uppercase tracking-[0.3em]">
                      {doc.category || 'Dispatch'}
                    </span>
                    {locked ? (
                      <Lock size={12} className="text-amber-500/50" />
                    ) : (
                      <Shield size={12} className="text-zinc-800 group-hover:text-amber-500 transition-colors" />
                    )}
                  </div>

                  <h3 className="text-2xl font-serif italic text-zinc-200 group-hover:text-white transition-colors mb-4 leading-snug">
                    {doc.title}
                  </h3>
                  <p className="text-zinc-500 text-sm font-light leading-relaxed line-clamp-3">
                    {doc.excerpt}
                  </p>
                </div>

                <div className="mt-8 flex items-center justify-between pt-6 border-t border-white/5">
                  <span className="font-mono text-[9px] text-zinc-700 uppercase tracking-widest">
                    {doc.date || 'UNSPECIFIED'}
                  </span>
                  <div className="flex items-center gap-2 text-amber-500/80 font-mono text-[9px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    Access Brief <ArrowRight size={10} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* 3. EMPTY STATE */}
        {filteredDocs.length === 0 && (
          <div className="py-40 text-center border border-dashed border-white/5">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-zinc-700">
              Zero Intelligence Matches within Archive Parameters
            </p>
          </div>
        )}
      </div>
    </section>
  );
}