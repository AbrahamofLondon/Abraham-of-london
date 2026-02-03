"use client";

import * as React from "react";
import Fuse from "fuse.js";
import Link from "next/link";
import { safeArraySlice } from "@/lib/utils/safe";

/* --- 1. DATA SHAPE --- */
interface RegistryAsset {
  id: string;   
  t: string;    
  type: string; 
  tier: string; 
  d: string;    
  w: number;    
}

interface SearchPaletteProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchPalette({
  open,
  onClose,
}: SearchPaletteProps): JSX.Element | null {
  const [query, setQuery] = React.useState("");
  const [items, setItems] = React.useState<RegistryAsset[]>([]);
  const [fuse, setFuse] = React.useState<Fuse<RegistryAsset> | null>(null);
  const [active, setActive] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Focus and Scroll Lock logic
  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [open]);

  // Load the Registry
  React.useEffect(() => {
    if (!open || items.length > 0) return;

    const loadRegistry = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/system/content-registry.json");
        const data = await res.json();
        const list: RegistryAsset[] = data.index;

        const fuseInstance = new Fuse(list, {
          includeScore: true,
          threshold: 0.4,
          keys: ["t", "id", "type"],
        });

        setItems(list);
        setFuse(fuseInstance);
      } catch (error) {
        console.error("❌ Registry Sync Error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadRegistry();
  }, [open, items]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((prev) => (prev + 1) % Math.min(results.length, 12));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((prev) => (prev - 1 + Math.min(results.length, 12)) % Math.min(results.length, 12));
    }
    if (e.key === "Enter" && results[active]) {
      // In a real scenario, you could push to router here
      onClose();
    }
  };

  if (!open) return null;

  const results = query.trim() && fuse
    ? fuse.search(query).map((r) => r.item)
    : items;

  const top = safeArraySlice(results, 0, 12);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-[#0a0a0a]/80 backdrop-blur-md p-4 pt-24 transition-opacity duration-300"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-sm bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] ring-1 ring-black/5 dark:bg-[#111] dark:ring-white/5">
        
        {/* Minimal Search Input */}
        <div className="flex items-center border-b border-neutral-100 p-5 dark:border-neutral-800">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActive(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search Intelligence Archive..."
            className="w-full bg-transparent text-xl font-light tracking-tight outline-none dark:text-neutral-200 placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
          />
          {isLoading && <div className="animate-spin rounded-full h-4 w-4 border border-emerald-800 border-t-transparent" />}
        </div>

        {/* Conservative Results List */}
        <ul className="max-h-[65vh] overflow-y-auto">
          {top.length === 0 ? (
            <li className="py-20 text-center text-xs uppercase tracking-widest text-neutral-400">
              {query ? "No relevant records found." : "Awaiting selection..."}
            </li>
          ) : (
            top.map((asset, index) => (
              <li key={asset.id}>
                <Link
                  href={`/vault/${asset.id}`}
                  onClick={onClose}
                  className={`group flex flex-col border-l-2 px-8 py-5 transition-all duration-300 ${
                    index === active
                      ? "border-emerald-800 bg-neutral-50/50 dark:bg-white/[0.02] dark:border-emerald-500"
                      : "border-transparent hover:bg-neutral-50/30 dark:hover:bg-white/[0.01]"
                  }`}
                  onMouseEnter={() => setActive(index)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={getTierStyles(asset.tier)}>
                      {asset.tier.replace('-', ' ')}
                    </span>
                    <span className="text-[9px] text-neutral-400 font-mono tracking-tighter opacity-60">
                      {asset.type} // {asset.w} WORDS
                    </span>
                  </div>
                  
                  <div className="text-base font-medium tracking-tight text-neutral-800 dark:text-neutral-200 group-hover:text-black dark:group-hover:text-white">
                    {asset.t}
                  </div>
                  
                  <div className="mt-2 text-[10px] text-neutral-400 font-light tracking-wide uppercase">
                    Ref: {asset.id} — {new Date(asset.d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>

        {/* Formal Footer */}
        <div className="flex items-center justify-between border-t border-neutral-100 bg-[#fafafa] px-6 py-3 text-[9px] uppercase tracking-[0.2em] text-neutral-400 dark:border-neutral-800 dark:bg-[#0d0d0d]">
          <div className="flex gap-6">
            <span className="flex items-center gap-2"><span className="opacity-50">↓↑</span> Navigate</span>
            <span className="flex items-center gap-2"><span className="opacity-50">↵</span> Access Record</span>
          </div>
          <span className="font-medium text-neutral-300 dark:text-neutral-700">Established 2026</span>
        </div>
      </div>
    </div>
  );
}

/* --- TIER STYLING: INSTITUTIONAL MINIMALISM --- */
function getTierStyles(tier: string) {
  const base = "text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-none border transition-all duration-300";
  
  switch (tier.toLowerCase()) {
    case 'inner-circle-elite':
      return `${base} bg-amber-50/30 text-amber-700 border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-300/80 dark:border-amber-900/40`;
    case 'inner-circle':
      return `${base} bg-emerald-50/30 text-emerald-800 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400/80 dark:border-emerald-900/40`;
    case 'private':
      return `${base} bg-rose-50/30 text-rose-900 border-rose-200/50 dark:bg-rose-950/20 dark:text-rose-400/80 dark:border-rose-900/40`;
    case 'member':
      return `${base} bg-slate-50/30 text-slate-700 border-slate-200/50 dark:bg-slate-900/30 dark:text-slate-400/80 dark:border-slate-800/40`;
    default:
      return `${base} bg-neutral-50/50 text-neutral-500 border-neutral-200 dark:bg-neutral-900/30 dark:text-neutral-500 dark:border-neutral-800/50`;
  }
}