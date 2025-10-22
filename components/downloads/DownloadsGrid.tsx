// components/downloads/DownloadsGrid.tsx
"use client";

import * as React from "react";
import Link from "next/link";

export type DownloadItem = {
  href: string; // can be friendly slug; redirects handle .pdf
  title: string;
  sub?: string;
};

type Props = {
  items: DownloadItem[];
  columns?: 1 | 2 | 3;
  className?: string;
};

export default function DownloadsGrid({ items, columns = 2, className = "" }: Props) {
  const grid = columns === 1 ? "grid-cols-1" : columns === 3 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2";

  return (
    <ul className={`grid gap-6 ${grid} ${className}`}>
      {items.map((it) => (
        <li key={it.href}>
          <Link
            href={it.href}
            prefetch={false}
            className="group block rounded-2xl border border-lightGrey bg-white p-5 shadow-card transition hover:shadow-cardHover focus:outline-none focus-visible:ring-2"
            aria-label={it.title}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-serif text-xl font-semibold text-deepCharcoal">{it.title}</div>
                {it.sub && <div className="mt-1 text-sm text-[color:var(--color-on-secondary)/0.8]">{it.sub}</div>}
              </div>
              <span aria-hidden className="text-softGold transition group-hover:translate-x-0.5">ÃƒÂ¢Ã¢â‚¬—</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
