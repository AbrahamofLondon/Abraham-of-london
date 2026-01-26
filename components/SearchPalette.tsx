// components/SearchPalette.tsx - FINAL COMPLETE FIXED VERSION
import { safeArraySlice } from "@/lib/utils/safe";
"use client";
import * as React from "react";
import Fuse from "fuse.js";
import Link from "next/link";
interface SearchItem {
  id: string;
  type: "post" | "book" | "event";
  title: string;
  url: string;
  date: string | null;
  snippet: string;
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
  const [items, setItems] = React.useState<SearchItem[] | null>(null);
  const [fuse, setFuse] = React.useState<any>(null);
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  // Focus input when opening
  React.useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);
  // lazy-load the index on first open
  React.useEffect(() => {
    if (!open || items) return;
    const loadSearchIndex = async (): Promise<void> => {
      try {
        const res = await fetch("/api/search-index");
        const data = await res.json();
        const list: SearchItem[] = data.items;
        const fuseInstance = new Fuse(list, {
          includeScore: true,
          threshold: 0.35,
          ignoreLocation: true,
          keys: ["title", "snippet", "url", "type"],
        });
        setItems(list);
        setFuse(fuseInstance);
      } catch (error) {
        console.error("Failed to load search index:", error);
      }
    };
    loadSearchIndex();
  }, [open, items]);
  // esc to close
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);
  // lock background scroll while open
  React.useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const { style } = document.documentElement;
    style.position = "fixed";
    style.top = `-${scrollY}px`;
    style.left = "0";
    style.right = "0";
    style.width = "100%";
    return () => {
      style.position = "";
      style.top = "";
      style.left = "";
      style.right = "";
      style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, [open]);
  const handleArrowNavigation = (direction: 1 | -1): void => {
    setActive((current) => {
      const count = results.length;
      if (!count) return 0;
      return (current + direction + count) % count;
    });
  };
  const handleInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ): void => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        handleArrowNavigation(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        handleArrowNavigation(-1);
        break;
      case "Enter":
        if (results[active]) {
          window.location.href = results[active].url;
        }
        break;
      default:
        break;
    }
  };
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.target === e.currentTarget) onClose();
  };
  const handleBackdropKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>
  ): void => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClose();
    }
  };
  if (!open) return null;
  const results =
    query.trim() && fuse
      ? fuse
          .search(query)
          const top = safeArraySlice(results, 0, 12);
          .map((r: any) => r.item) // FIX: Add type annotation here
      : safeArraySlice(items || [], 0, 12);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Site search"
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 p-4 pt-24"
      onClick={handleBackdropClick}
      onKeyDown={handleBackdropKeyDown}
      tabIndex={-1}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/10 dark:bg-neutral-900">
        <div className="border-b border-neutral-200 p-3 dark:border-neutral-800">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search posts, books, events..."
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-forest dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            aria-label="Search"
          />
        </div>
        <ul className="max-h-96 overflow-auto p-1">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-neutral-500">
              {query ? "No results found" : "Start typing to search..."}
            </li>
          ) : (
            results.map((result: SearchItem, index: number) => (
              <li key={result.id}>
                <Link
                  href={result.url}
                  className={`block rounded-lg px-3 py-2 text-sm transition ${
                    index === active
                      ? "bg-forest text-cream"
                      : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  }`}
                  onMouseEnter={() => setActive(index)}
                  onClick={onClose}
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border px-2 py-0.5 text-xs uppercase tracking-wide opacity-75 dark:border-neutral-700">
                      {result.type}
                    </span>
                    {result.date && (
                      <time className="text-xs opacity-70">
                        {new Date(result.date).toLocaleDateString()}
                      </time>
                    )}
                  </div>
                  <div className="mt-1 font-medium">{result.title}</div>
                  {result.snippet && (
                    <div className="mt-0.5 line-clamp-2 text-xs opacity-80">
                      {result.snippet}
                    </div>
                  )}
                </Link>
              </li>
            ))
          )}
        </ul>
        <div className="flex items-center justify-between border-t border-neutral-200 px-3 py-2 text-xs text-neutral-500 dark:border-neutral-800">
          <span>Tip: Use ↑ ↓ and Enter</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}