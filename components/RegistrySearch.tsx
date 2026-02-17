// components/RegistrySearch.tsx — HARDENED (Intel Discovery Terminal)
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Command, X, Shield, FileText, ArrowRight, Terminal } from 'lucide-react';
import { useRouter } from 'next/router'; // ✅ FIXED: Use next/router for Pages Router
import clsx from 'clsx';

export default function RegistrySearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter(); // ✅ Now correctly imported

  // Command-K Shortcut Listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      // ESC to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen]);

  const handleSearch = useCallback(async (val: string) => {
    setQuery(val);
    if (val.length < 2) return setResults([]);
    
    setLoading(true);
    try {
      // Hits the lightweight metadata API
      const res = await fetch(`/api/search?q=${encodeURIComponent(val)}`);
      const json = await res.json();
      setResults(json.results || []);
    } catch (err) {
      console.error("[SEARCH_FAILURE]", err);
    } finally {
      setLoading(false);
    }
  }, []);

  if (!isOpen) return (
    <button 
      onClick={() => setIsOpen(true)}
      className="hidden md:flex items-center gap-4 px-4 py-2 border border-white/5 bg-zinc-950/50 hover:bg-zinc-900 transition-all group"
    >
      <Search size={14} className="text-zinc-500 group-hover:text-amber-500" />
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">Access Registry...</span>
      <kbd className="font-mono text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-zinc-500 border border-white/10">⌘K</kbd>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 backdrop-blur-md bg-black/80 animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-zinc-950 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
        
        {/* TERMINAL HEADER */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-white/10 bg-white/[0.02]">
          <Terminal size={18} className="text-amber-500" />
          <input 
            autoFocus
            placeholder="SEARCH_INTEL_ARCHIVE..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none font-mono text-sm text-zinc-200 placeholder:text-zinc-800 uppercase tracking-widest"
          />
          <button onClick={() => setIsOpen(false)} className="text-zinc-600 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* RESULTS AREA */}
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-12 text-center font-mono text-[10px] uppercase tracking-[0.4em] text-amber-500/50 animate-pulse">
              Querying Institutional Database...
            </div>
          ) : results.length > 0 ? (
            <div className="divide-y divide-white/5">
              {results.map((item) => (
                <button
                  key={item.slug}
                  onClick={() => {
                    router.push(item.href);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-6 hover:bg-white/[0.02] transition-all group text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {item.classification === 'public' ? (
                        <FileText size={16} className="text-zinc-600 group-hover:text-zinc-400" />
                      ) : (
                        <Shield size={16} className="text-amber-500/50 group-hover:text-amber-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-serif italic text-lg text-zinc-300 group-hover:text-white transition-colors leading-none">
                        {item.title}
                      </h3>
                      <div className="mt-2 flex items-center gap-3 font-mono text-[9px] uppercase tracking-widest text-zinc-600">
                        <span>{item.category}</span>
                        <span className="h-1 w-1 bg-zinc-800 rounded-full" />
                        <span>{item.readingTime}</span>
                        {item.classification !== 'public' && (
                          <span className="text-amber-500/60 font-bold tracking-[0.2em]">// CLASSIFIED</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-zinc-800 group-hover:text-amber-500 transition-all translate-x-[-10px] group-hover:translate-x-0 opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          ) : query.length > 1 ? (
            <div className="p-12 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-zinc-700">No Intelligence Matches Found</p>
            </div>
          ) : (
            <div className="p-12 text-center space-y-4">
              <Command size={24} className="mx-auto text-zinc-800" />
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-zinc-600">
                Begin typing to filter the registry
              </p>
            </div>
          )}
        </div>

        {/* TERMINAL FOOTER */}
        <div className="px-6 py-3 border-t border-white/5 bg-black flex justify-between items-center">
          <div className="flex gap-4 font-mono text-[8px] uppercase tracking-widest text-zinc-700">
            <span><kbd className="text-zinc-500">↑↓</kbd> Navigate</span>
            <span><kbd className="text-zinc-500">⏎</kbd> Select</span>
            <span><kbd className="text-zinc-500">ESC</kbd> Close</span>
          </div>
          <div className="text-[8px] font-mono uppercase text-amber-500/30 tracking-[0.3em]">
            Institutional Access Only
          </div>
        </div>
      </div>
    </div>
  );
}