// components/RegistrySearch.tsx — HARRODS/McKINSEY GRADE (Institutional Discovery Terminal)
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, Command, X, Shield, FileText, ArrowRight, Terminal, Sparkles, Crown } from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import clsx from "clsx";

// Safe navigation that works in both App Router and Pages Router (no hooks, no router dependency)
function safeNavigate(href: string) {
  if (typeof window === "undefined") return;
  window.location.assign(href);
}

// ✅ FIX: Properly typed animation variants
const fadeIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.6, 
      ease: [0.22, 1, 0.36, 1] as const // Type assertion for the ease array
    } 
  },
};

export default function RegistrySearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Command-K Shortcut Listener
  useEffect(() => {
    if (!mounted) return;

    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
        setSelectedIndex(0);
      }

      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
        return;
      }

      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      }

      if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        handleResultClick(results[selectedIndex].href);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [mounted, isOpen, results, selectedIndex]);

  const handleSearch = useCallback(async (val: string) => {
    setQuery(val);
    setSelectedIndex(0);

    if (val.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(val)}`);
      const json = await res.json().catch(() => null);
      setResults((json as any)?.results || []);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[SEARCH_FAILURE]", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleResultClick = (href: string) => {
    // Close first for UX; navigation is deterministic
    setIsOpen(false);
    safeNavigate(href);
  };

  // During SSR / pre-hydration, render a minimal stable button (no client-only deps triggered)
  if (!mounted) {
    return (
      <button
        type="button"
        className="hidden md:flex items-center gap-4 px-5 py-2.5 border border-white/10 bg-zinc-950/50 rounded-full"
      >
        <Search size={14} className="text-zinc-500" />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-600">Access Registry...</span>
      </button>
    );
  }

  if (!isOpen) {
    return (
      <motion.button
        type="button"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-4 px-5 py-2.5 border border-white/10 bg-zinc-950/50 hover:bg-zinc-900/80 transition-all duration-500 group rounded-full"
      >
        <Search size={14} className="text-zinc-500 group-hover:text-amber-400 transition-colors" />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 group-hover:text-zinc-300 transition-colors">
          Access Registry
        </span>
        <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-md border border-white/10">
          <Command size={10} className="text-zinc-500" />
          <kbd className="font-mono text-[8px] text-zinc-500">K</kbd>
        </div>
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 backdrop-blur-xl bg-black/90"
        onClick={() => setIsOpen(false)}
      >
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-2xl bg-gradient-to-b from-zinc-950 to-black border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* TERMINAL HEADER — Harrods Green Room aesthetic */}
          <div className="flex items-center gap-4 px-8 py-6 border-b border-white/5 bg-gradient-to-r from-black via-zinc-950 to-black">
            <div className="p-2 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Terminal size={16} className="text-amber-400" />
            </div>

            <input
              autoFocus
              placeholder="SEARCH_INSTITUTIONAL_ARCHIVE..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none font-mono text-sm text-white placeholder:text-zinc-800 uppercase tracking-[0.15em]"
            />

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-full hover:bg-white/5 transition-colors group"
              aria-label="Close"
            >
              <X size={16} className="text-zinc-600 group-hover:text-white transition-colors" />
            </button>
          </div>

          {/* RESULTS AREA — Luxury presentation */}
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar bg-gradient-to-b from-black via-zinc-950 to-black">
            {loading ? (
              <div className="p-16 text-center space-y-4">
                <div className="inline-flex p-3 rounded-full bg-amber-500/5 border border-amber-500/20">
                  <Search size={20} className="text-amber-400/50 animate-pulse" />
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-amber-500/50 animate-pulse">
                  Querying Institutional Database
                </p>
              </div>
            ) : results.length > 0 ? (
              <div className="divide-y divide-white/5">
                {results.map((item, index) => (
                  <motion.button
                    type="button"
                    key={item.slug ?? `${item.href}-${index}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleResultClick(item.href)}
                    className={clsx(
                      "w-full flex items-center justify-between p-6 transition-all duration-300 group text-left",
                      index === selectedIndex
                        ? "bg-gradient-to-r from-amber-500/10 via-transparent to-transparent border-l-2 border-amber-500"
                        : "hover:bg-white/[0.02]"
                    )}
                  >
                    <div className="flex items-start gap-5">
                      <div
                        className={clsx(
                          "mt-1 p-2 rounded-lg transition-all duration-300",
                          item.classification === "public"
                            ? "bg-zinc-900/50 text-zinc-500 group-hover:text-zinc-300"
                            : "bg-amber-500/5 text-amber-500/50 group-hover:text-amber-400 border border-amber-500/10"
                        )}
                      >
                        {item.classification === "public" ? <FileText size={16} /> : <Shield size={16} />}
                      </div>

                      <div>
                        <h3 className="font-serif text-xl italic text-white group-hover:text-amber-100 transition-colors leading-tight">
                          {item.title}
                        </h3>

                        <div className="mt-2 flex items-center gap-3 font-mono text-[9px] uppercase tracking-widest text-zinc-600">
                          <span className="px-2 py-0.5 bg-zinc-900/80 rounded-full">{item.category}</span>
                          <span className="h-1 w-1 bg-zinc-800 rounded-full" />
                          <span>{item.readingTime}</span>

                          {item.classification !== "public" ? (
                            <>
                              <span className="h-1 w-1 bg-zinc-800 rounded-full" />
                              <span className="text-amber-500/70 font-bold tracking-[0.2em]">CLASSIFIED</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <ArrowRight
                      size={16}
                      className={clsx(
                        "text-zinc-800 group-hover:text-amber-500 transition-all duration-300",
                        index === selectedIndex
                          ? "opacity-100 translate-x-0"
                          : "opacity-0 translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0"
                      )}
                    />
                  </motion.button>
                ))}
              </div>
            ) : query.length > 1 ? (
              <div className="p-20 text-center space-y-4">
                <div className="inline-flex p-4 rounded-full bg-zinc-900/50 border border-white/5">
                  <Search size={24} className="text-zinc-700" />
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-zinc-700">No Intelligence Matches Found</p>
                <p className="font-serif text-sm text-white/20 italic">"The archive is vast. Refine your query."</p>
              </div>
            ) : (
              <div className="p-20 text-center space-y-6">
                <div className="inline-flex p-4 rounded-full bg-gradient-to-b from-amber-500/5 to-transparent border border-amber-500/10">
                  <Crown size={28} className="text-amber-500/30" />
                </div>
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-zinc-700">
                  Begin typing to access the institutional registry
                </p>
                <div className="flex items-center justify-center gap-8 text-[8px] font-mono uppercase tracking-widest text-zinc-800">
                  <span>75+ Briefs</span>
                  <span className="h-1 w-1 bg-zinc-800 rounded-full" />
                  <span>Strategic Frameworks</span>
                  <span className="h-1 w-1 bg-zinc-800 rounded-full" />
                  <span>The Canon</span>
                </div>
              </div>
            )}
          </div>

          {/* TERMINAL FOOTER — Institutional provenance */}
          <div className="px-8 py-4 border-t border-white/5 bg-gradient-to-r from-black via-zinc-950 to-black flex justify-between items-center">
            <div className="flex gap-6 font-mono text-[8px] uppercase tracking-widest text-zinc-700">
              <span className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10 text-zinc-500">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10 text-zinc-500">↓</kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-2">
                <kbd className="px-2 py-0.5 bg-white/5 rounded border border-white/10 text-zinc-500">⏎</kbd>
                <span>Select</span>
              </span>
              <span className="flex items-center gap-2">
                <kbd className="px-2 py-0.5 bg-white/5 rounded border border-white/10 text-zinc-500">ESC</kbd>
                <span>Close</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-[8px] font-mono uppercase text-amber-500/30 tracking-[0.3em]">
              <Sparkles size={10} className="text-amber-500/20" />
              <span>Abraham of London · Institutional Access</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}