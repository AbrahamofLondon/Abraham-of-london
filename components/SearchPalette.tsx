// components/SearchPalette.tsx — BUILD-SAFE (no Fuse generics, pages-router safe)
"use client";

import * as React from "react";
import { useRouter } from "next/router";
import { Search, FileText, Loader2, X } from "lucide-react";
import Fuse from "fuse.js";

type RegistryAsset = {
  t: string; // title
  s: string; // slug
  k: string; // kind
  d?: string; // date
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function safeArraySlice<T>(arr: T[], start: number, end?: number): T[] {
  return Array.isArray(arr) ? arr.slice(start, end) : [];
}

function resolveBase(kind: string): string {
  const k = String(kind || "").toLowerCase();
  if (k === "short") return "/shorts";
  if (k === "brief") return "/briefs";
  if (k === "canon") return "/canon";
  if (k === "download") return "/downloads";
  if (k === "resource") return "/resources";
  if (k === "event") return "/events";
  if (k === "strategy") return "/strategy";
  if (k === "lexicon") return "/lexicon";
  return "/blog";
}

export default function SearchPalette(): React.ReactElement {
  const router = useRouter();

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [items, setItems] = React.useState<RegistryAsset[]>([]);
  const [fuse, setFuse] = React.useState<any>(null); // ✅ DO NOT type Fuse in this codebase
  const [active, setActive] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);

  const inputRef = React.useRef<HTMLInputElement>(null);

  // Keyboard shortcut: ⌘K / Ctrl+K
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Load registry when opened
  React.useEffect(() => {
    if (!open) return;

    setIsLoading(true);

    fetch("/system/content-registry.json")
      .then((res) => res.json())
      .then((data) => {
        const assets: RegistryAsset[] = Array.isArray(data?.index) ? data.index : [];
        setItems(assets);

        // ✅ Create Fuse without generics/types — runtime is fine.
        const instance = new (Fuse as any)(assets, {
          keys: ["t", "k"],
          threshold: 0.3,
          ignoreLocation: true,
        });

        setFuse(instance);
      })
      .catch((err) => console.error("Registry load failed:", err))
      .finally(() => setIsLoading(false));
  }, [open]);

  // Reset on close
  React.useEffect(() => {
    if (!open) return;
    return () => {
      setQuery("");
      setActive(0);
    };
  }, [open]);

  // Focus input when opened
  React.useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(id);
  }, [open]);

  // Results
  const results: RegistryAsset[] =
    query.trim() && fuse
      ? (fuse.search(query) || []).map((r: any) => r?.item).filter(Boolean)
      : items;

  const top = safeArraySlice(results, 0, 12);

  const handleSelect = (slug: string, kind: string) => {
    const base = resolveBase(kind);
    router.push(`${base}/${slug}`);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((prev) => Math.min(prev + 1, Math.max(top.length - 1, 0)));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((prev) => Math.max(prev - 1, 0));
      return;
    }
    if (e.key === "Enter" && top[active]) {
      e.preventDefault();
      handleSelect(top[active].s, top[active].k);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
  };

  // Reset active when query changes
  React.useEffect(() => {
    setActive(0);
  }, [query]);

  // Closed state button (header can mount this anywhere)
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-white/10 px-3 py-1.5 text-sm text-white/60 transition-colors hover:text-white"
        aria-label="Search content"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono text-white/40">
          <span>⌘K</span>
        </kbd>
      </button>
    );
  }

  // Open palette modal
  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div
        className="fixed left-1/2 top-[18%] w-full max-w-2xl -translate-x-1/2 px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-hidden rounded-lg border border-white/10 bg-zinc-900 shadow-2xl">
          {/* Search Input */}
          <div className="flex items-center border-b border-white/10 px-4">
            <Search className="mr-3 h-4 w-4 shrink-0 text-white/40" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search content..."
              className="flex-1 bg-transparent py-4 text-sm text-white outline-none placeholder:text-white/40"
            />
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-white/40" />}
            <button
              onClick={() => setOpen(false)}
              className="rounded p-1 transition-colors hover:bg-white/10"
              aria-label="Close search"
            >
              <X className="h-4 w-4 text-white/40" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[420px] overflow-y-auto p-2">
            {!isLoading && top.length === 0 && (
              <div className="py-12 text-center text-sm text-white/40">
                {query ? "No results found" : "Start typing to search..."}
              </div>
            )}

            {top.map((item, index) => (
              <button
                key={`${item.k}:${item.s}`}
                onClick={() => handleSelect(item.s, item.k)}
                className={cx(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors",
                  index === active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5"
                )}
              >
                <FileText className="h-4 w-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{item.t}</div>
                  <div className="mt-0.5 text-xs uppercase tracking-wider text-white/40">{item.k}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 px-4 py-2 font-mono text-[10px] text-white/30">
            <span>↑↓ Navigate</span>
            <span className="mx-2">•</span>
            <span>↵ Select</span>
            <span className="mx-2">•</span>
            <span>ESC Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}