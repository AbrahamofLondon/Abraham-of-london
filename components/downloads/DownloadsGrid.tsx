"use client";

import * as React from "react";
import DownloadCard from "./DownloadCard";

export type DownloadItem = {
  href: string;       // friendly slug preferred, e.g. /downloads/leaders-cue-card
  title: string;      // display text
  sub?: string;       // optional small descriptor
  newTab?: boolean;   // default true for PDFs & friendly slugs
  id?: string;        // optional test id
};

type Props = {
  items: DownloadItem[];
  className?: string;
  columns?: 1 | 2 | 3; // default 2
};

export default function DownloadsGrid({ items, className = "", columns = 2 }: Props) {
  const grid =
    columns === 3
      ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      : columns === 1
      ? "grid gap-6 grid-cols-1"
      : "grid gap-6 sm:grid-cols-2";

  if (!Array.isArray(items) || items.length === 0) {
    return (
      <p className="text-sm text-[color:var(--color-on-secondary)/0.75]">
        No downloads available yet.
      </p>
    );
  }

  return (
    <ul className={`${grid} ${className}`}>
      {items.map((d, i) => (
        <li key={d.href || i} data-testid={d.id}>
          <DownloadCard href={d.href} title={d.title} sub={d.sub} newTab={d.newTab} />
        </li>
      ))}
    </ul>
  );
}