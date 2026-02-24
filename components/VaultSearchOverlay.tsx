/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { Search, X, Shield, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/router";

export function VaultSearchOverlay({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  // Handle Search Execution
  const performSearch = async (val: string) => {
    if (val.length < 3) return;
    setLoading(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: val, limit: 5 }),
      });
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }
  };

  // Debounce logic
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (query) performSearch(query);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  // Prevent background scroll
  React.useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] px-4 sm:px-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />

      {/* Search Modal */}
      <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-emerald-900/30 rounded-2xl shadow-2xl shadow-emerald-900/20 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center gap-4">
          <Search className={loading ? "text-emerald-500 animate-pulse" : "text-zinc-500"} size={20} />
          <input
            autoFocus
            className="flex-1 bg-transparent border-none outline-none text-white font-mono text-xs uppercase tracking-widest placeholder:text-zinc-700"
            placeholder="TYPE_STRATEGIC_INTENT..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {loading && results.length === 0 && (
            <div className="p-12 flex flex-col items-center justify-center gap-4 text-zinc-600">
              <Loader2 className="animate-spin" size={24} />
              <span className="font-mono text-[10px] uppercase tracking-widest">Querying Neural Vault...</span>
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="p-12 text-center font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
              No matching intelligence found.
            </div>
          )}

          {results.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                router.push(`/vault/${item.slug}`);
                onClose();
              }}
              className="w-full text-left p-4 hover:bg-emerald-950/20 group flex items-start justify-between rounded-xl transition-all"
            >
              <div className="flex gap-4">
                <div className="mt-1 p-2 bg-white/[0.03] border border-white/5 rounded-lg group-hover:border-emerald-500/30 transition-colors">
                  <Shield size={14} className="text-zinc-600 group-hover:text-emerald-500" />
                </div>
                <div>
                  <h4 className="text-zinc-200 font-serif italic text-lg group-hover:text-white transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-zinc-600 text-xs line-clamp-1 mt-1 font-light">
                    {item.summary}
                  </p>
                </div>
              </div>
              <ArrowRight size={14} className="text-zinc-800 group-hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
            </button>
          ))}
        </div>

        <div className="p-4 bg-black/50 border-t border-white/5 flex justify-between items-center font-mono text-[9px] text-zinc-700 uppercase tracking-widest">
          <span>{results.length} Nodes Found</span>
          <span>Press ESC to Close</span>
        </div>
      </div>
    </div>
  );
}