"use client";

import * as React from "react";
import Fuse from "fuse.js";
import Link from "next/link";

type Item = {
  id: string;
  type: "post" | "book" | "event";
  title: string;
  url: string;
  date: string | null;
  snippet: string;
};

type SearchPaletteProps = {
  open: boolean;
  onClose: () => void;
};

export default function SearchPalette({ open, onClose }: SearchPaletteProps) {
  const [q, setQ] = React.useState("");
  const [items, setItems] = React.useState<Item[] | null>(null);
  const [fuse, setFuse] = React.useState<Fuse<Item> | null>(null);
  const [active, setActive] = React.useState(0);

  // lazy-load the index on first open
  React.useEffect(() => {
    if (!open || items) return;
    (async () => {
      const res = await fetch("/api/search-index");
      const data = await res.json();
      const list: Item[] = data.items;
      const f = new Fuse(list, {
        includeScore: true,
        threshold: 0.35,
        ignoreLocation: true,
        keys: ["title", "snippet", "url", "type"],
      });
      setItems(list);
      setFuse(f);
    })();
  }, [open, items]);

  // esc to close
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // lock background scroll while open
  React.useEffect(() => {
    if (!open) return;
    const y = window.scrollY;
    const { style } = document.documentElement;
    style.position = "fixed";
    style.top = `-${y}px`;
    style.left = "0";
    style.right = "0";
    style.width = "100%";
    return () => {
      style.position = "";
      style.top = "";
      style.left = "";
      style.right = "";
      style.width = "";
      window.scrollTo(0, y);
    };
  }, [open]);

  if (!open) return null;

  const results =
    q.trim().length && fuse
      ? fuse.search(q).slice(0, 12).map((r) => r.item)
      : (items || []).slice(0, 12);

  const onArrow = (dir: 1 | -1) => {
    setActive((a) => {
      const n = results.length;
      if (!n) return 0;
      return (a + dir + n) % n;
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Site search"
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 p-4 pt-24"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/10 dark:bg-neutral-900">
        <div className="border-b border-neutral-200 p-3 dark:border-neutral-800">
          <input
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); onArrow(1); }
              if (e.key === "ArrowUp") { e.preventDefault(); onArrow(-1); }
              if (e.key === "Enter" && results[active]) {
                window.location.href = results[active].url;
              }
            }}
            placeholder="Search posts, books, events…"
            className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-forest dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            aria-label="Search"
          />
        </div>

        <ul className="max-h-96 overflow-auto p-1">
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-neutral-500">No results</li>
          ) : (
            results.map((r, i) => (
              <li key={r.id}>
                <Link
                  href={r.url}
                  className={`block rounded-lg px-3 py-2 text-sm transition ${
                    i === active
                      ? "bg-forest text-cream"
                      : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  }`}
                  onMouseEnter={() => setActive(i)}
                  onClick={onClose}
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border px-2 py-0.5 text-xs uppercase tracking-wide opacity-75 dark:border-neutral-700">
                      {r.type}
                    </span>
                    {r.date ? (
                      <time className="text-xs opacity-70">
                        {new Date(r.date).toLocaleDateString()}
                      </time>
                    ) : null}
                  </div>
                  <div className="mt-1 font-medium">{r.title}</div>
                  {r.snippet ? (
                    <div className="mt-0.5 line-clamp-2 text-xs opacity-80">{r.snippet}</div>
                  ) : null}
                </Link>
              </li>
            ))
          )}
        </ul>
        <div className="flex items-center justify-between border-t border-neutral-200 px-3 py-2 text-xs text-neutral-500 dark:border-neutral-800">
          <span>Tip: Use ÃƒÂ¢Ã¢â‚¬' ÃƒÂ¢Ã¢â‚¬" and Enter</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}
