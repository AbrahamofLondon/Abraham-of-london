"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { Search, X, Shield, ArrowRight, Loader2 } from "lucide-react";
import * as NextNavigation from "next/navigation";

interface VaultSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const VaultSearchOverlay: React.FC<VaultSearchOverlayProps> = ({
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  /** * SYSTEM RESOLUTION: 
   * We access the hook via the namespace cast to 'any'.
   * This overrides the 'compat' type definitions in next-env.d.ts that
   * are currently tricking the compiler into seeing this as Type-only.
   */
  const router = (NextNavigation as any).useRouter();

  const performSearch = React.useCallback(async (val: string) => {
    const trimmed = val.trim();

    if (trimmed.length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, limit: 5 }),
      });

      if (!res.ok) throw new Error("Search failed");

      const data = await res.json();
      setResults(Array.isArray(data?.results) ? data.results : []);
    } catch (err) {
      console.error("Search failed:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      void performSearch(query);
    }, 400);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      document.body.style.overflow = isOpen ? "hidden" : "";
    }
    return () => {
      if (typeof window !== "undefined") {
        document.body.style.overflow = "";
      }
    };
  }, [isOpen]);

  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  React.useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center px-4 pt-[15vh] sm:px-6">
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-emerald-900/30 bg-[#0a0a0a] shadow-2xl shadow-emerald-900/20">
        <div className="flex items-center gap-4 border-b border-white/5 p-6">
          <Search
            className={loading ? "animate-pulse text-emerald-500" : "text-zinc-500"}
            size={20}
          />
          <input
            autoFocus
            className="flex-1 border-none bg-transparent font-mono text-xs uppercase tracking-widest text-white outline-none placeholder:text-zinc-700"
            placeholder="TYPE_STRATEGIC_INTENT..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            onClick={onClose}
            className="text-zinc-500 transition-colors hover:text-white"
            aria-label="Close search"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {loading && results.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 p-12 text-zinc-600">
              <Loader2 className="animate-spin" size={24} />
              <span className="font-mono text-[10px] uppercase tracking-widest">
                Querying Neural Vault...
              </span>
            </div>
          )}

          {!loading && query.trim().length >= 3 && results.length === 0 && (
            <div className="p-12 text-center font-mono text-[10px] uppercase tracking-widest text-zinc-600">
              No matching intelligence found.
            </div>
          )}

          {results.map((item) => {
            const slug = String(item?.slug || "");
            const href = slug.startsWith("/") ? slug : `/vault/${slug}`;

            return (
              <button
                key={item.id || item.slug}
                onClick={() => {
                  router.push(href);
                  onClose();
                }}
                className="group flex w-full items-start justify-between rounded-xl p-4 text-left transition-all hover:bg-emerald-950/20"
              >
                <div className="flex gap-4">
                  <div className="mt-1 rounded-lg border border-white/5 bg-white/[0.03] p-2 transition-colors group-hover:border-emerald-500/30">
                    <Shield
                      size={14}
                      className="text-zinc-600 group-hover:text-emerald-500"
                    />
                  </div>
                  <div>
                    <h4 className="font-serif text-lg italic text-zinc-200 transition-colors group-hover:text-white">
                      {item.title}
                    </h4>
                    <p className="mt-1 line-clamp-1 text-xs font-light text-zinc-600">
                      {item.summary || "No summary available"}
                    </p>
                  </div>
                </div>
                <ArrowRight
                  size={14}
                  className="-translate-x-2 text-zinc-800 opacity-0 transition-all group-hover:translate-x-0 group-hover:text-emerald-500 group-hover:opacity-100"
                />
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-white/5 bg-black/50 p-4 font-mono text-[9px] uppercase tracking-widest text-zinc-700">
          <span>{results.length} Nodes Found</span>
          <span>Press ESC to Close</span>
        </div>
      </div>
    </div>
  );
};

export default VaultSearchOverlay;