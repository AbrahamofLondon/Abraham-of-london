// components/ContextualSearch.tsx — HARDENED (Registry Query Terminal)
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Command, Lock, FileText, X, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAccess } from '@/hooks/useAccess';
import { UnifiedDoc, getDocHref } from '@/lib/content/unified-router';

interface ContextualSearchProps {
  isOpen: boolean;
  onClose: () => void;
  docs: UnifiedDoc[];
}

export default function ContextualSearch({ isOpen, onClose, docs }: ContextualSearchProps) {
  const router = useRouter();
  const { hasClearance } = useAccess();
  const [query, setQuery] = useState('');

  // 1. Listen for CMD+K to open
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        isOpen ? onClose() : null; // Logic handled by parent state
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen, onClose]);

  // 2. High-performance filter logic
  const filteredResults = useMemo(() => {
    if (!query) return docs.slice(0, 5); // Show 5 recents/featured if empty
    const q = query.toLowerCase();
    return docs.filter(doc => 
      doc.title.toLowerCase().includes(q) || 
      doc.category?.toLowerCase().includes(q) ||
      doc.tags?.some(t => t.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [query, docs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] px-4">
      {/* OVERLAY */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />

      {/* SEARCH TERMINAL */}
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-white/10 shadow-2xl overflow-hidden">
        <div className="flex items-center px-6 py-4 border-b border-white/5">
          <Search className="text-zinc-500 mr-4" size={18} />
          <input 
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-white font-mono text-xs uppercase tracking-widest placeholder:text-zinc-700"
            placeholder="QUERY_REGISTRY_DATABASE..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="hidden sm:flex items-center gap-1 font-mono text-[9px] text-zinc-600 bg-white/5 px-2 py-1 rounded">
            <Command size={10} /> K
          </kbd>
          <button onClick={onClose} className="ml-4 text-zinc-500 hover:text-white">
            <X size={16} />
          </button>
        </div>

        {/* RESULTS GRID */}
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
          {filteredResults.length > 0 ? (
            <div className="divide-y divide-white/5">
              {filteredResults.map((doc) => {
                const isLocked = !hasClearance(doc.accessLevel);
                return (
                  <button
                    key={doc._raw.flattenedPath}
                    onClick={() => {
                      router.push(getDocHref(doc));
                      onClose();
                    }}
                    className="w-full group flex items-center justify-between p-6 hover:bg-white/[0.02] transition-all text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 border ${isLocked ? 'border-amber-500/20 bg-amber-500/5' : 'border-white/5'}`}>
                        {isLocked ? <Lock size={14} className="text-amber-500" /> : <FileText size={14} className="text-zinc-500" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-serif italic text-zinc-200 group-hover:text-white">{doc.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-[8px] uppercase tracking-widest text-zinc-600">{doc.category}</span>
                          <span className="h-[1px] w-4 bg-zinc-800" />
                          <span className="font-mono text-[8px] uppercase tracking-widest text-zinc-500">{doc.date}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-zinc-800 group-hover:text-amber-500 transform transition-transform group-hover:translate-x-1" />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-20 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-zinc-700">No matching dispatches found.</p>
            </div>
          )}
        </div>

        {/* FOOTER TIPS */}
        <div className="p-4 bg-black border-t border-white/5 flex justify-between items-center">
          <div className="flex gap-4">
            <div className="flex items-center gap-2 font-mono text-[8px] text-zinc-600">
              <span className="p-1 border border-white/10 rounded">↑↓</span> Navigate
            </div>
            <div className="flex items-center gap-2 font-mono text-[8px] text-zinc-600">
              <span className="p-1 border border-white/10 rounded">↵</span> Select
            </div>
          </div>
          <span className="font-mono text-[8px] uppercase text-zinc-800 tracking-tighter">
            Total Indexed: {docs.length} Briefs
          </span>
        </div>
      </div>
    </div>
  );
}